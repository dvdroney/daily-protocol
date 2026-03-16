import { useState, useEffect, useCallback } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { useStreak } from '../hooks/useStreak';
import { getDailyLog, toggleItem, saveDailyLog } from '../db';
import { getCompletionPercentage } from '../utils/scheduleLogic';
import { formatDateDisplay } from '../utils/dateUtils';
import ProgressBar from '../components/ProgressBar';
import StreakBadge from '../components/StreakBadge';
import TimeBlock from '../components/TimeBlock';

export default function Today() {
  const { todayStr, groupedItems, scheduledItems, settings, isLoading } = useSchedule();
  const [itemStatuses, setItemStatuses] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);

  const completed = Object.values(itemStatuses).filter(s => s.status === 'completed').length;
  const requiredItems = scheduledItems.filter(i => !i.optional);
  const completedRequired = requiredItems.filter(i => itemStatuses[i.id]?.status === 'completed').length;
  const completionPct = requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 0;

  const { currentStreak, bestStreak } = useStreak(completionPct);

  // Load daily log
  useEffect(() => {
    if (!todayStr || isLoading) return;
    getDailyLog(todayStr).then(log => {
      // Initialize statuses for scheduled items
      const statuses = {};
      for (const item of scheduledItems) {
        statuses[item.id] = log.items[item.id] || { status: null, completedAt: null, optional: item.optional || false };
      }
      setItemStatuses(statuses);
    });
  }, [todayStr, isLoading, scheduledItems]);

  const handleToggle = useCallback(async (itemId) => {
    const log = await toggleItem(todayStr, itemId);
    setItemStatuses(prev => {
      const updated = { ...prev };
      updated[itemId] = log.items[itemId];
      return updated;
    });

    // Update completion percentage in the log
    const updatedLog = await getDailyLog(todayStr);
    const required = scheduledItems.filter(i => !i.optional);
    const comp = required.filter(i => updatedLog.items[i.id]?.status === 'completed').length;
    updatedLog.completionPercentage = required.length > 0 ? Math.round((comp / required.length) * 100) : 0;
    await saveDailyLog(updatedLog);
  }, [todayStr, scheduledItems]);

  const isLiftDay = (settings.lift_days || []).includes(
    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">{formatDateDisplay(todayStr)}</h1>
        </div>
        <StreakBadge currentStreak={currentStreak} bestStreak={bestStreak} />
      </div>

      {/* Progress */}
      <ProgressBar completed={completed} total={scheduledItems.length} />

      {/* All done state */}
      {completed === scheduledItems.length && scheduledItems.length > 0 && (
        <div className="mx-4 mb-3 p-3 bg-green-900/30 border border-green-700/30 rounded-xl text-center">
          <span className="text-green-400 font-medium">All done for today!</span>
        </div>
      )}

      {/* Time blocks */}
      <div className="px-4 space-y-3 mt-2">
        {groupedItems.map(block => (
          <TimeBlock
            key={block.id}
            block={block}
            items={block.items}
            itemStatuses={itemStatuses}
            onToggle={handleToggle}
            expandedItemId={expandedItemId}
            onExpandItem={setExpandedItemId}
            isLiftDay={isLiftDay}
          />
        ))}
      </div>
    </div>
  );
}
