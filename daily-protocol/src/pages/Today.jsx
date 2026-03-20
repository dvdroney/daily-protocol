import { useState, useEffect, useCallback, useRef } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { useStreak } from '../hooks/useStreak';
import { db, getDailyLog, toggleItem, saveDailyLog } from '../db';
import { getCompletionPercentage } from '../utils/scheduleLogic';
import { formatDateDisplay, getEffectiveDate, getPreviousDate, getNextDate, getRelativeDayLabel, isToday } from '../utils/dateUtils';
import { maybeAutoBackup } from '../utils/cloudBackup';
import ProgressBar from '../components/ProgressBar';
import StreakBadge from '../components/StreakBadge';
import TimeBlock from '../components/TimeBlock';

const SWIPE_THRESHOLD = 50;
const MAX_FUTURE_DAYS = 6;
const MAX_PAST_DAYS = 7;

function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      if (distance > 0) onSwipeLeft();
      else onSwipeRight();
    }
    touchStart.current = null;
    touchEnd.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export default function Today() {
  const [selectedDate, setSelectedDate] = useState(getEffectiveDate());
  const { todayStr, effectiveToday, groupedItems, scheduledItems, settings, isLoading } = useSchedule(selectedDate);
  const [itemStatuses, setItemStatuses] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);

  const isViewingToday = selectedDate === effectiveToday;

  const completed = Object.values(itemStatuses).filter(s => s.status === 'completed').length;
  const requiredItems = scheduledItems.filter(i => !i.optional);
  const completedRequired = requiredItems.filter(i => itemStatuses[i.id]?.status === 'completed').length;
  const completionPct = requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 0;

  const { currentStreak, bestStreak } = useStreak(completionPct);

  // Snap back to today if the effective date changes (day rollover at 3 AM)
  useEffect(() => {
    if (selectedDate !== effectiveToday && isToday(selectedDate)) {
      setSelectedDate(effectiveToday);
    }
  }, [effectiveToday]);

  // Load daily log
  useEffect(() => {
    if (!todayStr || isLoading) return;
    getDailyLog(todayStr).then(log => {
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

    const updatedLog = await getDailyLog(todayStr);
    const required = scheduledItems.filter(i => !i.optional);
    const comp = required.filter(i => updatedLog.items[i.id]?.status === 'completed').length;
    updatedLog.completionPercentage = required.length > 0 ? Math.round((comp / required.length) * 100) : 0;
    await saveDailyLog(updatedLog);

    maybeAutoBackup(db);
  }, [todayStr, scheduledItems]);

  const goToPreviousDay = useCallback(() => {
    setSelectedDate(prev => {
      const today = getEffectiveDate();
      const prevDate = getPreviousDate(prev);
      // Limit how far back
      const daysBack = Math.round((new Date(today) - new Date(prevDate)) / (1000 * 60 * 60 * 24));
      if (daysBack > MAX_PAST_DAYS) return prev;
      return prevDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const today = getEffectiveDate();
      const nextDate = getNextDate(prev);
      const daysForward = Math.round((new Date(nextDate) - new Date(today)) / (1000 * 60 * 60 * 24));
      if (daysForward > MAX_FUTURE_DAYS) return prev;
      return nextDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(getEffectiveDate());
  }, []);

  const swipeHandlers = useSwipe(goToNextDay, goToPreviousDay);

  const isLiftDay = (settings.lift_days || []).includes(
    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  );

  const relativeLabel = getRelativeDayLabel(selectedDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-20" {...swipeHandlers}>
      {/* Header with day navigation */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 -ml-2 text-gray-400 active:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-100">{relativeLabel}</h1>
              <p className="text-xs text-gray-500">{formatDateDisplay(selectedDate)}</p>
            </div>
            <button
              onClick={goToNextDay}
              className="p-2 text-gray-400 active:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <button
                onClick={goToToday}
                className="text-xs text-blue-400 border border-blue-400/30 rounded-full px-3 py-1 active:bg-blue-400/10"
              >
                Today
              </button>
            )}
            <StreakBadge currentStreak={currentStreak} bestStreak={bestStreak} />
          </div>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar completed={completed} total={scheduledItems.length} />

      {/* All done state */}
      {completed === scheduledItems.length && scheduledItems.length > 0 && (
        <div className="mx-4 mb-3 p-3 bg-green-900/30 border border-green-700/30 rounded-xl text-center">
          <span className="text-green-400 font-medium">All done{isViewingToday ? ' for today' : ''}!</span>
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
