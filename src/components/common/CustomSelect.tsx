/**
 * Tactical Custom Dropdown Select Component
 * High-end hardware popover replacing native select dropdowns
 * Features generous padding, keyboard/click navigation, and zero layout overflow
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  width?: string;
  accentColor?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  width = 'w-44',
  accentColor = '#f59e0b'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${width} font-mono select-none`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          w-full h-[46px] px-4 flex items-center justify-between gap-2.5
          bg-[#141620] border text-xs md:text-sm font-bold tracking-wider uppercase
          cursor-pointer outline-none transition-all rounded-none
          ${
            isOpen
              ? 'border-amber-400 bg-[#1c1f2e] text-white shadow-lg'
              : 'border-white/25 text-slate-100 hover:border-white/40 hover:bg-[#1a1c29]'
          }
        `}
      >
        <div className="flex items-center gap-1.5 truncate">
          {label && <span className="text-slate-400 text-[11px]">{label}:</span>}
          <span className="truncate" style={{ color: isOpen ? accentColor : undefined }}>
            {selectedOption ? selectedOption.label : value}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-150 flex-shrink-0 text-slate-300 ${
            isOpen ? 'transform rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#10121a] border border-white/25 shadow-2xl rounded-none max-h-56 overflow-y-auto custom-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`
                  px-4 py-2.5 text-xs md:text-sm font-bold tracking-wider uppercase cursor-pointer transition-colors flex items-center justify-between
                  ${
                    isSelected
                      ? 'bg-[#f59e0b] text-black font-bold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 bg-black" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
