import { useState, useEffect, useCallback } from 'react';
import { getAllSettings, setSetting, db } from '../db';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function DayPicker({ selectedDays, onChange, multiSelect = true }) {
  const toggle = (day) => {
    if (multiSelect) {
      onChange(
        selectedDays.includes(day)
          ? selectedDays.filter(d => d !== day)
          : [...selectedDays, day]
      );
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
            selectedDays.includes(day)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {DAY_LABELS[i]}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ onSettingsChange }) {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllSettings().then(s => {
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

  const update = useCallback(async (key, value) => {
    await setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingsChange?.();
  }, [onSettingsChange]);

  const exportData = useCallback(async () => {
    const logs = await db.dailyLogs.toArray();
    const settingsData = await db.settings.toArray();
    const data = { logs, settings: settingsData, exportDate: new Date().toISOString() };
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
        // Validate structure
        if (!Array.isArray(data.logs) || !Array.isArray(data.settings)) {
          alert('Invalid backup file format.');
          return;
        }
        // Validate logs have required shape
        const validLogs = data.logs.filter(log =>
          typeof log.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.date) &&
          typeof log.items === 'object' && log.items !== null
        );
        // Validate settings have required shape
        const validSettings = data.settings.filter(s =>
          typeof s.key === 'string' && s.key.length < 100
        );
        if (!confirm(`Import ${validLogs.length} daily logs and ${validSettings.length} settings? This will replace all existing data.`)) {
          return;
        }
        await db.transaction('rw', db.dailyLogs, db.settings, async () => {
          await db.dailyLogs.clear();
          await db.settings.clear();
          if (validLogs.length) await db.dailyLogs.bulkPut(validLogs);
          if (validSettings.length) await db.settings.bulkPut(validSettings);
        });
        const s = await getAllSettings();
        setSettings(s);
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

  return (
    <div className="pb-20 px-4 pt-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-100 mb-4">Settings</h1>

      {/* Dandruff Shampoo Days */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Dandruff Shampoo Days</h2>
        <DayPicker
          selectedDays={settings.dandruff_shampoo_days || []}
          onChange={(days) => update('dandruff_shampoo_days', days)}
        />
      </div>

      {/* Exfoliation Days */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Exfoliation Days</h2>
        <p className="text-xs text-gray-500 mb-2">Not on retinol nights</p>
        <DayPicker
          selectedDays={settings.exfoliation_days || []}
          onChange={(days) => update('exfoliation_days', days)}
        />
      </div>

      {/* Derma Roller Day */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Derma Roller Day</h2>
        <DayPicker
          selectedDays={settings.derma_roller_days || []}
          onChange={(days) => update('derma_roller_days', days)}
          multiSelect={false}
        />
      </div>

      {/* Lift Days */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Lift Days</h2>
        <DayPicker
          selectedDays={settings.lift_days || []}
          onChange={(days) => update('lift_days', days)}
        />
      </div>

      {/* Retinol Mode */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Retinol Schedule</h2>
        <div className="flex gap-3">
          <button
            onClick={() => update('retinol_mode', 'alternating')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.retinol_mode !== 'nightly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            Every Other Night
          </button>
          <button
            onClick={() => update('retinol_mode', 'nightly')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.retinol_mode === 'nightly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400'
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
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={settings.streak_threshold || 80}
          onChange={(e) => update('streak_threshold', Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Data Management */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Data Management</h2>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium active:bg-gray-600"
          >
            Export Data
          </button>
          <button
            onClick={importData}
            className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium active:bg-gray-600"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}
