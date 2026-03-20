import { getSetting, setSetting } from '../db';
import { getEffectiveDate } from './dateUtils';

const GIST_FILENAME = 'daily-protocol-backup.enc';

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(plaintext, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...packed));
}

async function decrypt(base64Data, passphrase) {
  const packed = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ciphertext = packed.slice(28);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

async function findBackupGist(token) {
  const res = await fetch('https://api.github.com/gists', {
    headers: { Authorization: `token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch gists');
  const gists = await res.json();
  return gists.find(g => g.files && g.files[GIST_FILENAME]);
}

export async function backupToGist(db, token, passphrase) {
  const logs = await db.dailyLogs.toArray();
  const settings = await db.settings.toArray();
  const customItems = await db.customItems.toArray();
  const data = { logs, settings, customItems, backupDate: new Date().toISOString() };
  const encrypted = await encrypt(JSON.stringify(data), passphrase);

  const existing = await findBackupGist(token);
  const body = {
    description: 'Daily Protocol encrypted backup',
    public: false,
    files: { [GIST_FILENAME]: { content: encrypted } },
  };

  let res;
  if (existing) {
    res = await fetch(`https://api.github.com/gists/${existing.id}`, {
      method: 'PATCH',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } else {
    res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  if (!res.ok) throw new Error('Failed to save backup');
  return await res.json();
}

export async function restoreFromGist(db, token, passphrase) {
  const existing = await findBackupGist(token);
  if (!existing) throw new Error('No backup found');

  const res = await fetch(`https://api.github.com/gists/${existing.id}`, {
    headers: { Authorization: `token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch backup');
  const gist = await res.json();
  const encrypted = gist.files[GIST_FILENAME].content;
  const decrypted = await decrypt(encrypted, passphrase);
  const data = JSON.parse(decrypted);

  if (!Array.isArray(data.logs) || !Array.isArray(data.settings)) {
    throw new Error('Invalid backup data');
  }

  const tables = [db.dailyLogs, db.settings];
  if (db.customItems) tables.push(db.customItems);

  await db.transaction('rw', tables, async () => {
    await db.dailyLogs.clear();
    await db.settings.clear();
    if (data.logs.length) await db.dailyLogs.bulkPut(data.logs);
    if (data.settings.length) await db.settings.bulkPut(data.settings);
    if (db.customItems && Array.isArray(data.customItems) && data.customItems.length) {
      await db.customItems.clear();
      await db.customItems.bulkPut(data.customItems);
    }
  });

  return { logs: data.logs.length, settings: data.settings.length, backupDate: data.backupDate };
}

// Auto-backup: runs silently once per day
export async function maybeAutoBackup(db) {
  try {
    const token = await getSetting('gh_token');
    const passphrase = await getSetting('backup_passphrase');
    if (!token || !passphrase) return;

    const today = getEffectiveDate();
    const lastBackup = await getSetting('last_backup_date');
    if (lastBackup === today) return;

    await backupToGist(db, token, passphrase);
    await setSetting('last_backup_date', today);
  } catch {
    // Silent fail — don't interrupt the user
  }
}
