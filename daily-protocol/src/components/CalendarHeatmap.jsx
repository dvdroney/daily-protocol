import { useState, useEffect } from 'react';
import { getDateRange, formatYMD, parseDate, formatDateDisplay } from '../utils/dateUtils';
import { getLogsInRange } from '../db';

function getColor(pct) {
  if (pct === null || pct === undefined) return 'bg-gray-800';
  if (pct === 0) return 'bg-gray-800';
  if (pct < 40) return 'bg-green-900';
  if (pct < 60) return 'bg-green-800';
  if (pct < 80) return 'bg-green-700';
  if (pct < 100) return 'bg-green-500';
  return 'bg-green-400';
}

export default function CalendarHeatmap({ numWeeks = 13 }) {
  const [logs, setLogs] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    async function load() {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - numWeeks * 7);
      const startStr = formatYMD(start);
      const endStr = formatYMD(end);
      const data = await getLogsInRange(startStr, endStr);
      const map = {};
      for (const log of data) {
        map[log.date] = log;
      }
      setLogs(map);
    }
    load();
  }, [numWeeks]);

  // Build grid: we need to fill from the start of a week
  const today = new Date();
  const endDate = formatYMD(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - numWeeks * 7 + 1);
  // Align to Monday
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() - 1);
  }
  const dates = getDateRange(formatYMD(startDate), endDate);

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];
  for (const dateStr of dates) {
    const d = parseDate(dateStr);
    if (d.getDay() === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(dateStr);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-4 h-4 text-[10px] text-gray-500 flex items-center justify-center">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }, (_, di) => {
              const dateStr = week[di];
              if (!dateStr) return <div key={di} className="w-4 h-4" />;
              const log = logs[dateStr];
              const pct = log?.completionPercentage ?? null;
              const isToday = dateStr === endDate;
              return (
                <button
                  key={di}
                  onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                  className={`w-4 h-4 rounded-sm ${getColor(pct)} ${isToday ? 'ring-1 ring-blue-400' : ''}`}
                  title={`${dateStr}: ${pct !== null ? pct + '%' : 'no data'}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm font-medium text-gray-300">{formatDateDisplay(selectedDay)}</div>
          {logs[selectedDay] ? (
            <div className="text-sm text-gray-400 mt-1">
              Completion: {logs[selectedDay].completionPercentage}%
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-1">No data</div>
          )}
        </div>
      )}
    </div>
  );
}
