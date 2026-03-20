import { getDayOfWeek, getDayOfYear, daysBetween } from './dateUtils';
import { ROUTINE_ITEMS } from '../data/routineData';

export function getScheduledItems(dateStr, settings = {}, items = null) {
  const allItems = items || ROUTINE_ITEMS;
  const dayOfWeek = getDayOfWeek(dateStr);
  const dayOfYear = getDayOfYear(dateStr);

  const scheduledIds = new Set();
  const scheduled = [];

  for (const item of allItems) {
    if (isItemScheduled(item, dateStr, dayOfWeek, dayOfYear, settings, allItems)) {
      scheduledIds.add(item.id);
      scheduled.push(item);
    }
  }

  return scheduled.filter(item => {
    if (item.conflictsWith && scheduledIds.has(item.conflictsWith)) {
      return false;
    }
    return true;
  });
}

function isItemScheduled(item, dateStr, dayOfWeek, dayOfYear, settings, allItems) {
  switch (item.schedule) {
    case 'daily':
      return true;

    case 'specific_days': {
      const settingKey = `${item.id}_days`;
      const days = settings[settingKey] || item.defaultDays || [];
      return days.includes(dayOfWeek);
    }

    case 'alternating_days': {
      const isEvenDay = dayOfYear % 2 === 0;
      const isBasicVariant = item.id.includes('basic');
      return isBasicVariant ? isEvenDay : !isEvenDay;
    }

    case 'retinol_schedule': {
      if (settings.retinol_mode === 'nightly') return true;
      if (settings.retinol_start_date) {
        const daysSinceStart = daysBetween(settings.retinol_start_date, dateStr);
        return daysSinceStart >= 0 && daysSinceStart % 2 === 0;
      }
      return dayOfYear % 2 === 0;
    }

    case 'daily_except': {
      if (!item.exceptWhen) return true;
      const exceptItem = allItems.find(i => i.id === item.exceptWhen);
      if (!exceptItem) return true;
      return !isItemScheduled(exceptItem, dateStr, dayOfWeek, dayOfYear, settings, allItems);
    }

    default:
      return true;
  }
}

export function getCompletionPercentage(itemStatuses) {
  const required = Object.entries(itemStatuses).filter(([, status]) => !status.optional);
  if (required.length === 0) return 100;
  const completed = required.filter(([, status]) => status.status === 'completed').length;
  return Math.round((completed / required.length) * 100);
}
