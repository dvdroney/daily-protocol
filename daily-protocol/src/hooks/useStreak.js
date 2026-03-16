import { useState, useEffect, useCallback } from 'react';
import { getEffectiveDate, getPreviousDate } from '../utils/dateUtils';
import { db, getDailyLog, getSetting } from '../db';

export function useStreak(todayCompletion = 0) {
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const calculate = useCallback(async () => {
    const threshold = await getSetting('streak_threshold', 80);
    const todayStr = getEffectiveDate();

    let current = 0;
    let dateToCheck = todayStr;

    // If today meets threshold, count it
    if (todayCompletion >= threshold) {
      current = 1;
      dateToCheck = getPreviousDate(todayStr);
    } else {
      // Start checking from yesterday
      dateToCheck = getPreviousDate(todayStr);
    }

    // Walk backwards
    for (let i = 0; i < 365; i++) {
      const log = await getDailyLog(dateToCheck);
      if (log.completionPercentage >= threshold) {
        current++;
        dateToCheck = getPreviousDate(dateToCheck);
      } else {
        break;
      }
    }

    // Get cached best
    const cached = await db.streakCache.get(1);
    const best = Math.max(current, cached?.bestStreak || 0);

    await db.streakCache.put({ id: 1, currentStreak: current, bestStreak: best, lastCompletedDate: todayStr });
    setStreak({ currentStreak: current, bestStreak: best });
    setIsLoading(false);
  }, [todayCompletion]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { ...streak, isLoading };
}
