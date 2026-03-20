const DAY_RESET_HOUR = 3;

export function getEffectiveDate(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < DAY_RESET_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  return formatYMD(d);
}

export function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function getDayOfWeek(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[parseDate(dateStr).getDay()];
}

export function getDayOfYear(dateStr) {
  const date = parseDate(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatDateDisplay(dateStr) {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getDateRange(startDateStr, endDateStr) {
  const dates = [];
  const current = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  while (current <= end) {
    dates.push(formatYMD(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function isToday(dateStr) {
  return dateStr === getEffectiveDate();
}

export function getPreviousDate(dateStr) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() - 1);
  return formatYMD(d);
}

export function getNextDate(dateStr) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + 1);
  return formatYMD(d);
}

export function getRelativeDayLabel(dateStr) {
  const today = getEffectiveDate();
  const diff = daysBetween(today, dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
