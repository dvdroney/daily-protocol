import { useState, useEffect } from 'react';
import { useStreak } from '../hooks/useStreak';
import { getLogsInRange } from '../db';
import { formatYMD } from '../utils/dateUtils';
import { ROUTINE_ITEMS } from '../data/routineData';
import CalendarHeatmap from '../components/CalendarHeatmap';

const ITEM_NAMES = Object.fromEntries(ROUTINE_ITEMS.map(i => [i.id, i.name]));

export default function History() {
  const { currentStreak, bestStreak } = useStreak();
  const [stats, setStats] = useState({ avgCompletion: 0, mostSkipped: [] });

  useEffect(() => {
    async function loadStats() {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const logs = await getLogsInRange(formatYMD(start), formatYMD(end));

      // Average completion
      const completions = logs.filter(l => l.completionPercentage > 0).map(l => l.completionPercentage);
      const avg = completions.length > 0 ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) : 0;

      // Most skipped/missed items
      const skipCounts = {};
      for (const log of logs) {
        for (const [itemId, status] of Object.entries(log.items || {})) {
          if (status.status === 'skipped' || status.status === null) {
            skipCounts[itemId] = (skipCounts[itemId] || 0) + 1;
          }
        }
      }
      const mostSkipped = Object.entries(skipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));

      setStats({ avgCompletion: avg, mostSkipped });
    }
    loadStats();
  }, []);

  return (
    <div className="pb-20 px-4 pt-4">
      <h1 className="text-xl font-bold text-gray-100 mb-4">History</h1>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-3xl font-bold text-orange-400">{currentStreak}</div>
          <div className="text-xs text-gray-500 mt-1">Current Streak</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-3xl font-bold text-purple-400">{bestStreak}</div>
          <div className="text-xs text-gray-500 mt-1">Best Streak</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Last 13 Weeks</h2>
        <CalendarHeatmap numWeeks={13} />
      </div>

      {/* Weekly average */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-1">30-Day Average</h2>
        <div className="text-2xl font-bold text-gray-200">{stats.avgCompletion}%</div>
      </div>

      {/* Most skipped */}
      {stats.mostSkipped.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Most Skipped (Last 30 Days)</h2>
          <div className="space-y-2">
            {stats.mostSkipped.map(({ id, count }) => (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{ITEM_NAMES[id] || id}</span>
                <span className="text-gray-500">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
