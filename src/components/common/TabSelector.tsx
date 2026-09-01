/**
 * Tactical 0-Corner Segmented Tab Selector
 * Spacious, independent module tabs with generous padding and high-contrast active states
 */

import React from 'react';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface TabSelectorProps<T extends string> {
  options: TabOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TabSelector<T extends string>({
  options,
  selectedId,
  onSelect
}: TabSelectorProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
      {options.map((option) => {
        const isSelected = selectedId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
              h-[46px] px-5 sm:px-6 flex items-center justify-center gap-2.5 font-mono text-xs md:text-sm font-bold tracking-[0.12em] uppercase
              transition-all duration-75 rounded-none border select-none cursor-pointer outline-none active:translate-y-px
              ${
                isSelected
                  ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-md'
                  : 'bg-[#141620] text-slate-200 border-white/20 hover:text-white hover:border-white/40 hover:bg-[#1c1f2e]'
              }
            `}
          >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
            {option.badge && (
              <span className="text-[10px] px-1.5 py-0.5 bg-black/30 font-mono font-bold">{option.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
