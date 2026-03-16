import { useState } from 'react';
import ChecklistItem from './ChecklistItem';

export default function TimeBlock({ block, items, itemStatuses, onToggle, expandedItemId, onExpandItem, isLiftDay }) {
  const [collapsed, setCollapsed] = useState(false);
  const completed = items.filter(i => itemStatuses[i.id]?.status === 'completed').length;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px]"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-medium text-gray-200">{block.name}</span>
          {block.timeLabel && (
            <span className="text-xs text-gray-500">{block.timeLabel}</span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {completed}/{items.length}
        </span>
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-gray-700/30">
          {items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              status={itemStatuses[item.id]?.status}
              onToggle={() => onToggle(item.id)}
              isExpanded={expandedItemId === item.id}
              onExpand={() => onExpandItem(expandedItemId === item.id ? null : item.id)}
              isLiftDay={isLiftDay}
            />
          ))}
        </div>
      )}
    </div>
  );
}
