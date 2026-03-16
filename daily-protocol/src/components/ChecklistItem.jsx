import { CATEGORY_COLORS } from '../data/routineData';
import InstructionPanel from './InstructionPanel';

export default function ChecklistItem({ item, status, onToggle, isExpanded, onExpand, isLiftDay }) {
  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.hygiene;
  const isCompleted = status === 'completed';
  const isSkipped = status === 'skipped';

  return (
    <div className="border-b border-gray-700/30 last:border-b-0">
      <div
        className={`flex items-center gap-3 px-4 py-3 min-h-[48px] ${
          isCompleted ? 'opacity-50' : isSkipped ? 'opacity-30' : ''
        }`}
      >
        {/* Category dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />

        {/* Item name */}
        <button
          className={`flex-1 text-left text-sm ${isSkipped ? 'line-through text-gray-500' : 'text-gray-100'}`}
          onClick={onExpand}
        >
          <span>{item.name}</span>
          {item.optional && <span className="text-gray-500 text-xs ml-1">(optional)</span>}
          {item.critical && <span className="text-red-400 text-xs ml-1 font-medium">important</span>}
          {isLiftDay && item.liftDayNote && (
            <span className="text-amber-400 text-xs block">{item.liftDayNote}</span>
          )}
          {item.durationMinutes && (
            <span className="text-gray-500 text-xs ml-1">{item.durationMinutes}min</span>
          )}
        </button>

        {/* Expand arrow */}
        {(item.instructions || item.timerType) && (
          <button
            onClick={onExpand}
            className="p-1 text-gray-500 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'bg-green-600 border-green-600'
              : 'border-gray-600 active:border-green-500'
          }`}
        >
          {isCompleted && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Expandable instruction panel */}
      {isExpanded && <InstructionPanel item={item} />}
    </div>
  );
}
