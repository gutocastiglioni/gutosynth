/**
 * Tactical Industrial Rotary Dial / Knob Component
 * Matte graphite cylinder with crisp bone-white notch and warm amber LED arc
 * Double-click reset supported
 */

import React, { useState, useRef, useCallback } from 'react';

interface KnobProps {
  label: string;
  value: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  color?: string;
  size?: number;
  isHero?: boolean;
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  defaultValue,
  min = 0,
  max = 1,
  step = 0.01,
  unit = '',
  color = '#f59e0b',
  size = 64,
  isHero = false,
  onChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const defaultValRef = useRef<number>(defaultValue !== undefined ? defaultValue : value);

  const actualSize = isHero ? 100 : size;
  const normalizedVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const angle = -135 + normalizedVal * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const deltaVal = (deltaY / (isHero ? 200 : 140)) * range;
      let newVal = startValRef.current + deltaVal;

      if (step > 0) {
        newVal = Math.round(newVal / step) * step;
      }
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(Number(newVal.toFixed(2)));
    },
    [isDragging, max, min, step, isHero, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
      setIsDragging(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resetTarget = defaultValue !== undefined ? defaultValue : defaultValRef.current;
    onChange(resetTarget);
  };

  const strokeWidth = isHero ? 4 : 3;
  const radius = (actualSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (270 / 360) * circumference;
  const dashOffset = arcLength * (1 - normalizedVal);

  return (
    <div
      className="flex flex-col items-center justify-center select-none group min-w-[70px]"
      onDoubleClick={handleDoubleClick}
      title="Drag to adjust • Double-click to reset"
    >
      <div
        className="relative flex items-center justify-center cursor-ns-resize touch-none"
        style={{ width: actualSize, height: actualSize }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* LED Ring Gauge */}
        <svg width={actualSize} height={actualSize} className="transform rotate-[135deg] pointer-events-none">
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.08s ease',
              opacity: isHero ? 1 : 0.85
            }}
          />
        </svg>

        {/* Rotary Disc (100% Round Anodized Charcoal) */}
        <div
          className={`
            absolute knob-disc flex items-center justify-center transition-all duration-100
            bg-gradient-to-b from-[#252732] via-[#1a1b22] to-[#111217]
            border border-white/20
            ${
              isDragging
                ? 'scale-[1.04] border-amber-400 shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                : 'shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-white/35'
            }
          `}
          style={{
            width: actualSize - (isHero ? 20 : 14),
            height: actualSize - (isHero ? 20 : 14),
            borderRadius: '50%',
            transform: `rotate(${angle}deg)`
          }}
        >
          {/* Vertical Notch / Indicator */}
          <div
            className={`mb-auto ${
              isHero ? 'w-[3px] h-4 mt-2' : 'w-[2.5px] h-2.5 mt-1.5'
            }`}
            style={{
              backgroundColor: isDragging ? '#ffffff' : '#f4f4f5',
              boxShadow: isDragging ? `0 0 10px ${color}` : 'none',
              borderRadius: '2px'
            }}
          />
        </div>
      </div>

      {/* High-Contrast Clear Label & Value */}
      <div className="flex flex-col items-center mt-1.5 text-center">
        <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase truncate max-w-[85px]">
          {label}
        </span>
        <span
          className="text-xs font-mono font-bold text-slate-400 mt-0.5"
          style={{ color: isDragging ? color : undefined }}
        >
          {value}
          {unit}
        </span>
      </div>
    </div>
  );
};
