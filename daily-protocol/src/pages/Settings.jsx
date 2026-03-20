import { useState, useEffect, useCallback } from 'react';
import { getAllSettings, setSetting, db, getAllItems, saveCustomItem, deleteCustomItem, restoreDefaultItem } from '../db';
import { backupToGist, restoreFromGist } from '../utils/cloudBackup';
import { TIME_BLOCKS, ROUTINE_ITEMS, CATEGORY_COLORS } from '../data/routineData';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SCHEDULE_TYPES = ['daily', 'specific_days', 'alternating_days', 'retinol_schedule', 'daily_except'];
const CATEGORIES = Object.keys(CATEGORY_COLORS);
const DEFAULT_IDS = new Set(ROUTINE_ITEMS.map(i => i.id));

function DayPicker({ selectedDays, onChange, multiSelect = true }) {
  const toggle = (day) => {
    if (multiSelect) {
      onChange(selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day]);
    } else {
      onChange([day]);
    }
  };
  return (
    <div className="flex gap-2">
      {DAYS.map((day, i) => (
        <button
          key={day}
          onClick={() => toggle(day)}
          className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
            selectedDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}
        >
          {DAY_LABELS[i]}
        </button>
      ))}
    </div>
  );
}

function ItemEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: item?.id || '',
    name: item?.name || '',
    timeBlock: item?.timeBlock || TIME_BLOCKS[0].id,
    category: item?.category || 'supplement',
    schedule: item?.schedule || 'daily',
    defaultDays: item?.defaultDays || [],
    instructions: item?.instructions || '',
    product: item?.product || '',
    productUrl: item?.productUrl || '',
    optional: item?.optional || false,
  });
  const isNew = !item;

  const handleSave = () => {
    if (!form.name.trim()) return;
    const id = form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    onSave({ ...form, id });
  };

  return (
    <div className="space-y-3">
      <input
        placeholder="Item name"
        value={form.name}
        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.timeBlock}
          onChange={(e) => setForm(f => ({ ...f, timeBlock: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600"
        >
          {TIME_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={form.category}
          onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <select
        value={form.schedule}
        onChange={(e) => setForm(f => ({ ...f, schedule: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600"
      >
        {SCHEDULE_TYPES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
      </select>
      {form.schedule === 'specific_days' && (
        <DayPicker selectedDays={form.defaultDays} onChange={(days) => setForm(f => ({ ...f, defaultDays: days }))} />
      )}
      <textarea
        placeholder="Instructions (optional)"
        value={form.instructions}
        onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
      />
      <input
        placeholder="Product name (optional)"
        value={form.product}
        onChange={(e) => setForm(f => ({ ...f, product: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input
          type="checkbox"
          checked={form.optional}
          onChange={(e) => setForm(f => ({ ...f, optional: e.target.checked }))}
          className="accent-blue-500"
        />
        Optional (won't count toward completion %)
      </label>
      <div className="flex gap-3">
        <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
          {isNew ? 'Add Item' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Settings({ onSettingsChange }) {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [ghToken, setGhToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [cloudStatus, setCloudStatus] = useState('');
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // null | 'new' | item object
  const [credsSaved, setCredsSaved] = useState(false);

  useEffect(() => {
    getAllSettings().then(s => {
      setSettings(s);
      setGhToken(s.gh_token || '');
      setPassphrase(s.backup_passphrase || '');
      setCredsSaved(!!(s.gh_token && s.backup_passphrase));
      setIsLoading(false);
    });
    setItems(getAllItems());
  }, []);

  const update = useCallback(async (key, value) => {
    await setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingsChange?.();
  }, [onSettingsChange]);

  const saveCredentials = useCallback(async () => {
    await setSetting('gh_token', ghToken);
    await setSetting('backup_passphrase', passphrase);
    setCredsSaved(true);
    setCloudStatus('Credentials saved for auto-backup');
  }, [ghToken, passphrase]);

  const handleSaveItem = useCallback(async (item) => {
    await saveCustomItem(item);
    setItems(getAllItems());
    setEditingItem(null);
    onSettingsChange?.();
  }, [onSettingsChange]);

  const handleDeleteItem = useCallback(async (itemId) => {
    if (!confirm('Remove this item from your routine?')) return;
    await deleteCustomItem(itemId);
    setItems(getAllItems());
    onSettingsChange?.();
  }, [onSettingsChange]);

  const handleRestoreItem = useCallback(async (itemId) => {
    await restoreDefaultItem(itemId);
    setItems(getAllItems());
    onSettingsChange?.();
  }, [onSettingsChange]);

  const exportData = useCallback(async () => {
    const logs = await db.dailyLogs.toArray();
    const settingsData = await db.settings.toArray();
    const customItems = await db.customItems.toArray();
    const data = { logs, settings: settingsData, customItems, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-protocol-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data.logs) || !Array.isArray(data.settings)) {
          alert('Invalid backup file format.');
          return;
        }
        const validLogs = data.logs.filter(log =>
          typeof log.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.date) &&
          typeof log.items === 'object' && log.items !== null
        );
        const validSettings = data.settings.filter(s =>
          typeof s.key === 'string' && s.key.length < 100
        );
        if (!confirm(`Import ${validLogs.length} daily logs and ${validSettings.length} settings? This will replace all existing data.`)) {
          return;
        }
        const tables = [db.dailyLogs, db.settings];
        if (db.customItems) tables.push(db.customItems);
        await db.transaction('rw', tables, async () => {
          await db.dailyLogs.clear();
          await db.settings.clear();
          if (validLogs.length) await db.dailyLogs.bulkPut(validLogs);
          if (validSettings.length) await db.settings.bulkPut(validSettings);
          if (db.customItems && Array.isArray(data.customItems) && data.customItems.length) {
            await db.customItems.clear();
            await db.customItems.bulkPut(data.customItems);
          }
        });
        const s = await getAllSettings();
        setSettings(s);
        setItems(getAllItems());
        onSettingsChange?.();
        alert('Data imported successfully!');
      } catch {
        alert('Failed to import data. Please check the file format.');
      }
    };
    input.click();
  }, [onSettingsChange]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  // Group items by time block for the editor list
  const groupedItems = TIME_BLOCKS.map(b => ({
    ...b,
    items: items.filter(i => i.timeBlock === b.id),
  })).filter(b => b.items.length > 0);

  return (
    <div className="pb-20 px-4 pt-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-100 mb-4">Settings</h1>

      {/* Manage Items */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-300">Manage Items</h2>
          <button
            onClick={() => setEditingItem('new')}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium"
          >
            + Add
          </button>
        </div>

        {editingItem === 'new' && (
          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <ItemEditor onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
          </div>
        )}

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {groupedItems.map(block => (
            <div key={block.id}>
              <div className="text-xs text-gray-500 font-medium mb-1">{block.name}</div>
              {block.items.map(item => (
                <div key={item.id}>
                  {editingItem?.id === item.id ? (
                    <div className="p-3 bg-gray-700/50 rounded-lg mb-1">
                      <ItemEditor item={item} onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[item.category]?.dot || 'bg-gray-500'}`} />
                        <span className="text-sm text-gray-300 truncate">{item.name}</span>
                        {item.optional && <span className="text-xs text-gray-500">(opt)</span>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dandruff Shampoo Days */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Dandruff Shampoo Days</h2>
        <DayPicker selectedDays={settings.dandruff_shampoo_days || []} onChange={(days) => update('dandruff_shampoo_days', days)} />
      </div>

      {/* Derma Roller Day */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Derma Roller Day</h2>
        <DayPicker selectedDays={settings.derma_roller_days || []} onChange={(days) => update('derma_roller_days', days)} multiSelect={false} />
      </div>

      {/* Lift Days */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Lift Days</h2>
        <DayPicker selectedDays={settings.lift_days || []} onChange={(days) => update('lift_days', days)} />
      </div>

      {/* Retinol Mode */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Retinol Schedule</h2>
        <div className="flex gap-3">
          <button
            onClick={() => update('retinol_mode', 'alternating')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.retinol_mode !== 'nightly' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            Every Other Night
          </button>
          <button
            onClick={() => update('retinol_mode', 'nightly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.retinol_mode === 'nightly' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            Nightly
          </button>
        </div>
      </div>

      {/* Streak Threshold */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-gray-300">Streak Threshold</h2>
          <span className="text-sm text-blue-400 font-medium">{settings.streak_threshold || 80}%</span>
        </div>
        <input type="range" min="50" max="100" step="5" value={settings.streak_threshold || 80}
          onChange={(e) => update('streak_threshold', Number(e.target.value))} className="w-full accent-blue-500" />
      </div>

      {/* Local Backup */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Local Backup</h2>
        <div className="flex gap-3">
          <button onClick={exportData} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium active:bg-gray-600">Export JSON</button>
          <button onClick={importData} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium active:bg-gray-600">Import JSON</button>
        </div>
      </div>

      {/* Cloud Backup */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Encrypted Cloud Backup</h2>
        <p className="text-xs text-gray-500 mb-3">
          {credsSaved
            ? 'Auto-backup is active. Backs up once daily when you check off an item.'
            : 'Enter credentials to enable daily auto-backup to a private GitHub Gist.'}
        </p>
        <div className="space-y-3">
          <input type="password" placeholder="GitHub token (gist scope)" value={ghToken}
            onChange={(e) => { setGhToken(e.target.value); setCredsSaved(false); }}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none" />
          <input type="password" placeholder="Encryption passphrase" value={passphrase}
            onChange={(e) => { setPassphrase(e.target.value); setCredsSaved(false); }}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none" />
          {!credsSaved && ghToken && passphrase && (
            <button onClick={saveCredentials} className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium active:bg-green-700">
              Save Credentials for Auto-Backup
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!ghToken || !passphrase) { setCloudStatus('Enter token and passphrase'); return; }
                setCloudStatus('Backing up...');
                try {
                  await backupToGist(db, ghToken, passphrase);
                  await setSetting('last_backup_date', new Date().toISOString().slice(0, 10));
                  setCloudStatus('Backup saved!');
                } catch (e) {
                  setCloudStatus('Backup failed: ' + e.message);
                }
              }}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium active:bg-blue-700"
            >
              Backup Now
            </button>
            <button
              onClick={async () => {
                if (!ghToken || !passphrase) { setCloudStatus('Enter token and passphrase'); return; }
                setCloudStatus('Restoring...');
                try {
                  const result = await restoreFromGist(db, ghToken, passphrase);
                  const s = await getAllSettings();
                  setSettings(s);
                  setItems(getAllItems());
                  onSettingsChange?.();
                  setCloudStatus(`Restored ${result.logs} logs from ${new Date(result.backupDate).toLocaleDateString()}`);
                } catch (e) {
                  setCloudStatus(e.message === 'No backup found' ? 'No backup found' : 'Restore failed: wrong passphrase?');
                }
              }}
              className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium active:bg-gray-600"
            >
              Restore
            </button>
          </div>
          {cloudStatus && (
            <p className={`text-xs ${cloudStatus.includes('failed') || cloudStatus.includes('Enter') ? 'text-red-400' : 'text-green-400'}`}>
              {cloudStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
