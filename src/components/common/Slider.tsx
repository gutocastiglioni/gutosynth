/**
 * Studio Fader / Slider Component
 * Supports vertical and horizontal orientations with high-contrast glowing neon rails
 */

import React from 'react';

interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  color?: string;
  orientation?: 'horizontal' | 'vertical';
  onChange: (val: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  unit = '',
  color = '#00f2fe',
  orientation = 'horizontal',
  onChange
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-2 h-44 select-none">
        <span className="text-[10px] font-mono text-slate-300">
          {value}
          {unit}
        </span>
        <div className="relative flex-1 w-6 flex items-center justify-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-32 h-6 -rotate-90 origin-center cursor-pointer bg-transparent"
          />
        </div>
        {label && <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      <div className="flex justify-between items-center text-xs">
        {label && <span className="text-slate-400 font-medium tracking-wide uppercase text-[11px]">{label}</span>}
        <span className="font-mono text-slate-300 font-semibold text-[11px]">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative w-full flex items-center">
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#161824] rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};
