import { getDayOfWeek, getDayOfYear, daysBetween } from './dateUtils';
import { ROUTINE_ITEMS } from '../data/routineData';

export function getScheduledItems(dateStr, settings = {}) {
  const dayOfWeek = getDayOfWeek(dateStr);
  const dayOfYear = getDayOfYear(dateStr);

  // First pass: determine which items are scheduled
  const scheduledIds = new Set();
  const items = [];

  for (const item of ROUTINE_ITEMS) {
    if (isItemScheduled(item, dateStr, dayOfWeek, dayOfYear, settings)) {
      scheduledIds.add(item.id);
      items.push(item);
    }
  }

  // Second pass: resolve conflicts
  return items.filter(item => {
    // If this item conflicts with another scheduled item, hide it
    if (item.conflictsWith && scheduledIds.has(item.conflictsWith)) {
      return false;
    }
    return true;
  });
}

function isItemScheduled(item, dateStr, dayOfWeek, dayOfYear, settings) {
  switch (item.schedule) {
    case 'daily':
      return true;

    case 'specific_days': {
      const settingKey = `${item.id}_days`;
      const days = settings[settingKey] || item.defaultDays || [];
      return days.includes(dayOfWeek);
    }

    case 'alternating_days': {
      // For alternating pairs, show the "basic" variant on even days, "lateral" on odd
      const isEvenDay = dayOfYear % 2 === 0;
      const isBasicVariant = item.id.includes('basic');
      return isBasicVariant ? isEvenDay : !isEvenDay;
    }

    case 'retinol_schedule': {
      if (settings.retinol_mode === 'nightly') return true;
      // Alternating: use start date if available, otherwise day-of-year
      if (settings.retinol_start_date) {
        const daysSinceStart = daysBetween(settings.retinol_start_date, dateStr);
        return daysSinceStart >= 0 && daysSinceStart % 2 === 0;
      }
      return dayOfYear % 2 === 0;
    }

    case 'daily_except': {
      // Show daily except when the referenced item is scheduled
      if (!item.exceptWhen) return true;
      const exceptItem = ROUTINE_ITEMS.find(i => i.id === item.exceptWhen);
      if (!exceptItem) return true;
      return !isItemScheduled(exceptItem, dateStr, dayOfWeek, dayOfYear, settings);
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
