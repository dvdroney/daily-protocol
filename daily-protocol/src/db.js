import Dexie from 'dexie';
import { ROUTINE_ITEMS } from './data/routineData';

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const VALID_SETTING_KEYS = new Set([
  'dandruff_shampoo_days', 'gentle_shampoo_days', 'exfoliation_days',
  'derma_roller_days', 'lift_days', 'retinol_mode', 'retinol_start_date',
  'day_reset_hour', 'streak_threshold',
]);
const ITEM_MAP = Object.fromEntries(ROUTINE_ITEMS.map(i => [i.id, i]));

export const db = new Dexie('DailyProtocol');

db.version(1).stores({
  dailyLogs: 'date',
  settings: 'key',
  streakCache: 'id',
});

export async function getDailyLog(dateStr) {
  const log = await db.dailyLogs.get(dateStr);
  return log || { date: dateStr, items: {}, completionPercentage: 0 };
}

export async function saveDailyLog(log) {
  await db.dailyLogs.put(log);
}

export async function toggleItem(dateStr, itemId) {
  const item = ITEM_MAP[itemId];
  if (!item) return await getDailyLog(dateStr);
  const isOptional = item.optional || false;
  const log = await getDailyLog(dateStr);
  const current = log.items[itemId];
  if (current && current.status === 'completed') {
    log.items[itemId] = { status: null, completedAt: null, optional: isOptional };
  } else {
    log.items[itemId] = { status: 'completed', completedAt: Date.now(), optional: isOptional };
  }
  await saveDailyLog(log);
  return log;
}

export async function skipItem(dateStr, itemId) {
  const item = ITEM_MAP[itemId];
  if (!item) return await getDailyLog(dateStr);
  const isOptional = item.optional || false;
  const log = await getDailyLog(dateStr);
  const current = log.items[itemId];
  if (current && current.status === 'skipped') {
    log.items[itemId] = { status: null, completedAt: null, optional: isOptional };
  } else {
    log.items[itemId] = { status: 'skipped', completedAt: null, optional: isOptional };
  }
  await saveDailyLog(log);
  return log;
}

export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key);
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  if (!VALID_SETTING_KEYS.has(key)) return;
  // Validate day arrays
  if (key.endsWith('_days') && Array.isArray(value)) {
    value = value.filter(d => VALID_DAYS.includes(d));
  }
  // Validate numeric settings
  if (key === 'streak_threshold') {
    value = Math.min(100, Math.max(0, Number(value) || 80));
  }
  if (key === 'day_reset_hour') {
    value = Math.min(23, Math.max(0, Number(value) || 3));
  }
  await db.settings.put({ key, value });
}

export async function getAllSettings() {
  const rows = await db.settings.toArray();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function getLogsInRange(startDate, endDate) {
  return db.dailyLogs.where('date').between(startDate, endDate, true, true).toArray();
}

const DEFAULT_SETTINGS = {
  dandruff_shampoo_days: ['monday', 'wednesday', 'friday'],
  gentle_shampoo_days: ['tuesday', 'thursday', 'saturday', 'sunday'],
  exfoliation_days: ['tuesday', 'saturday'],
  derma_roller_days: ['saturday'],
  lift_days: [],
  retinol_mode: 'alternating',
  retinol_start_date: new Date().toISOString().slice(0, 10),
  day_reset_hour: 3,
  streak_threshold: 80,
};

export async function initializeDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.settings.get(key);
    if (!existing) {
      await db.settings.put({ key, value });
    }
  }
}
