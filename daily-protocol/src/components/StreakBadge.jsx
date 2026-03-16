export default function StreakBadge({ currentStreak, bestStreak }) {
  if (currentStreak === 0 && bestStreak === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 23c-3.866 0-7-2.686-7-6 0-1.665.587-3.203 1.563-4.4L12 5l5.437 7.6A6.696 6.696 0 0119 17c0 3.314-3.134 6-7 6z" />
        </svg>
        <span className="text-lg font-bold text-orange-400">{currentStreak}</span>
      </div>
      {bestStreak > currentStreak && (
        <span className="text-xs text-gray-500">best: {bestStreak}</span>
      )}
    </div>
  );
}
