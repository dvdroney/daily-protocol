import { useState, useEffect, useCallback } from 'react';
import { getEffectiveDate } from '../utils/dateUtils';
import { getScheduledItems } from '../utils/scheduleLogic';
import { getAllSettings, initializeDefaults } from '../db';
import { TIME_BLOCKS } from '../data/routineData';

export function useSchedule() {
  const [todayStr, setTodayStr] = useState(getEffectiveDate());
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    await initializeDefaults();
    const s = await getAllSettings();
    setSettings(s);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check for day rollover every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getEffectiveDate();
      if (now !== todayStr) {
        setTodayStr(now);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [todayStr]);

  const scheduledItems = isLoading ? [] : getScheduledItems(todayStr, settings);

  // Group items by time block
  const groupedItems = TIME_BLOCKS.map(block => ({
    ...block,
    items: scheduledItems.filter(item => item.timeBlock === block.id),
  })).filter(block => block.items.length > 0);

  return { todayStr, groupedItems, scheduledItems, settings, isLoading, reloadSettings: loadSettings };
}
