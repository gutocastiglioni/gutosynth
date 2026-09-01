/**
 * Looper Timeline & Playhead Bar Component
 * Displays real-time looping bars, quantized beats (1-16), playhead cursor and recording progress
 */

import React from 'react';
import { Play, Pause, Square, Circle, Bell } from 'lucide-react';
import { LooperState } from '../../types/audio';
import { Button } from '../common/Button';

interface TimelineViewProps {
  looperState: LooperState;
  currentStep: number;
  currentBar: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleMetronome: () => void;
  onSetLoopBars: (bars: 1 | 2 | 4 | 8) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  looperState,
  currentStep,
  currentBar,
  onPlay,
  onPause,
  onStop,
  onToggleRecord,
  onBpmChange,
  onToggleMetronome,
  onSetLoopBars
}) => {
  const barOptions: (1 | 2 | 4 | 8)[] = [1, 2, 4, 8];

  return (
    <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-4">
      {/* Master Transport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Transport Actions */}
        <div className="flex items-center gap-2">
          {looperState.isPlaying ? (
            <Button variant="amber" size="md" icon={<Pause size={16} />} onClick={onPause}>
              Pause
            </Button>
          ) : (
            <Button variant="cyan" size="md" icon={<Play size={16} />} onClick={onPlay}>
              Play
            </Button>
          )}

          <Button variant="ghost" size="md" icon={<Square size={14} />} onClick={onStop}>
            Stop
          </Button>

          <Button
            variant={looperState.isRecording ? 'danger' : 'ghost'}
            size="md"
            active={looperState.isRecording}
            icon={<Circle size={14} className={looperState.isRecording ? 'fill-red-400' : ''} />}
            onClick={onToggleRecord}
          >
            {looperState.isRecording ? 'Recording...' : 'Record'}
          </Button>

          <Button
            variant={looperState.metronome ? 'cyan' : 'ghost'}
            size="sm"
            icon={<Bell size={14} />}
            onClick={onToggleMetronome}
            title="Metronome Click"
          >
            Click
          </Button>
        </div>

        {/* BPM & Loop Length Selectors */}
        <div className="flex items-center gap-4">
          {/* BPM Controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Tempo</span>
            <input
              type="number"
              min={50}
              max={220}
              value={looperState.bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value, 10) || 120)}
              className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-center border-none outline-none"
            />
            <span className="text-slate-500 font-mono text-[10px]">BPM</span>
          </div>

          {/* Loop Duration in Bars */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
            {barOptions.map((b) => (
              <button
                key={b}
                onClick={() => onSetLoopBars(b)}
                className={`
                  px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer outline-none
                  ${looperState.loopBars === b ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#00f2fe]' : 'text-slate-400 hover:text-white'}
                `}
              >
                {b}B
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Playhead & Bar Grid */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>BAR {currentBar + 1} / {looperState.loopBars}</span>
          <span>STEP {currentStep + 1} / 16</span>
        </div>

        {/* Multi-Bar Grid Progress */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${looperState.loopBars}, 1fr)` }}>
          {Array.from({ length: looperState.loopBars }).map((_, barIdx) => {
            const isCurrentBar = currentBar === barIdx;
            return (
              <div
                key={barIdx}
                className={`
                  h-3 rounded-md overflow-hidden bg-black/50 border relative
                  ${isCurrentBar ? 'border-cyan-400/80 shadow-[0_0_10px_rgba(0,242,254,0.3)]' : 'border-white/10'}
                `}
              >
                {/* 16 Step Sub-ticks */}
                <div className="absolute inset-0 grid grid-cols-16">
                  {Array.from({ length: 16 }).map((_, sIdx) => {
                    const isStep = isCurrentBar && currentStep === sIdx;
                    return (
                      <div
                        key={sIdx}
                        className={`h-full ${isStep ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]' : sIdx % 4 === 0 ? 'border-r border-white/10' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
