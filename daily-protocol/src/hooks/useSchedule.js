import { useState, useEffect, useCallback } from 'react';
import { getEffectiveDate } from '../utils/dateUtils';
import { getScheduledItems } from '../utils/scheduleLogic';
import { getAllSettings, initializeDefaults, getAllItems } from '../db';
import { TIME_BLOCKS } from '../data/routineData';

export function useSchedule(selectedDate = null) {
  const [effectiveToday, setEffectiveToday] = useState(getEffectiveDate());
  const [settings, setSettings] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const targetDate = selectedDate || effectiveToday;

  const loadSettings = useCallback(async () => {
    await initializeDefaults();
    const s = await getAllSettings();
    setSettings(s);
    setAllItems(getAllItems());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check for day rollover (3 AM boundary)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getEffectiveDate();
      if (now !== effectiveToday) {
        setEffectiveToday(now);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [effectiveToday]);

  const scheduledItems = isLoading ? [] : getScheduledItems(targetDate, settings, allItems);

  const groupedItems = TIME_BLOCKS.map(block => ({
    ...block,
    items: scheduledItems.filter(item => item.timeBlock === block.id),
  })).filter(block => block.items.length > 0);

  return { todayStr: targetDate, effectiveToday, groupedItems, scheduledItems, settings, isLoading, reloadSettings: loadSettings };
}
