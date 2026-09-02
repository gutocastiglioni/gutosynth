/**
 * Master Tactical Studio Header Component
 * 100% Symmetrical Heroic 48px Height Grid Across All Header Controls
 */

import React from 'react';
import {
  HelpCircle,
  Download,
  FolderOpen,
  Play,
  Pause,
  Square,
  Circle,
  Bell
} from 'lucide-react';
import { LooperState } from '../../types/audio';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenLibrary: () => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
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

export const Header: React.FC<HeaderProps> = ({
  onOpenLibrary,
  onOpenHelp,
  onOpenExport,
  looperState,
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
    <header className="w-full h-[68px] border-b border-white/15 bg-[#0a0b0e] select-none shadow-lg flex-shrink-0 flex items-center px-4 md:px-6">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Quick Tools */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-white flex items-center justify-center bg-white/10 rounded-none flex-shrink-0">
              <div className="w-3.5 h-3.5 bg-[#f59e0b] rounded-none" />
            </div>

            <span className="text-sm md:text-base font-bold text-white tracking-widest font-mono uppercase">
              GUTO<span className="text-[#f59e0b]">SYNTH</span> <span className="text-slate-400 font-normal text-xs">OP-1</span>
            </span>
          </div>

          <div className="h-6 w-[1px] bg-white/20 mx-1 hidden lg:block" />

          <div className="hidden lg:flex items-center gap-2.5">
            <Button variant="secondary" size="md" icon={<FolderOpen size={15} />} onClick={onOpenLibrary}>
              PRESETS
            </Button>
            <Button variant="secondary" size="md" icon={<HelpCircle size={15} />} onClick={onOpenHelp}>
              GESTURES
            </Button>
          </div>
        </div>

        {/* Center: 100% Height-Symmetric Large 48px Transport Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause (48px) */}
          {looperState.isPlaying ? (
            <Button variant="amber" size="md" className="px-7" icon={<Pause size={16} />} onClick={onPause}>
              PAUSE
            </Button>
          ) : (
            <Button variant="bone" size="md" className="px-7" icon={<Play size={16} />} onClick={onPlay}>
              PLAY
            </Button>
          )}

          {/* Stop (48px x 48px) */}
          <Button variant="secondary" size="icon" onClick={onStop} title="Stop">
            <Square size={15} />
          </Button>

          {/* Rec (48px) */}
          <Button
            variant={looperState.isRecording ? 'danger' : 'secondary'}
            size="md"
            className="px-6"
            active={looperState.isRecording}
            icon={<Circle size={13} className={looperState.isRecording ? 'fill-white' : 'fill-red-400'} />}
            onClick={onToggleRecord}
          >
            REC
          </Button>

          {/* Metronome (48px x 48px) */}
          <Button
            variant={looperState.metronome ? 'amber' : 'secondary'}
            size="icon"
            onClick={onToggleMetronome}
            title="Metronome"
          >
            <Bell size={15} />
          </Button>

          {/* BPM Box (Exact 48px) */}
          <div className="flex items-center gap-2 px-3.5 h-[48px] bg-[#141620] border border-white/20 box-border">
            <span className="text-xs text-slate-400 font-mono font-bold uppercase">BPM</span>
            <input
              type="number"
              min={50}
              max={220}
              value={looperState.bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value, 10) || 120)}
              className="w-12 bg-transparent text-amber-300 font-mono font-bold text-sm text-center outline-none p-0 m-0"
            />
          </div>

          {/* Loop Bars (Exact 48px) */}
          {barOptions.map((b) => (
            <button
              key={b}
              onClick={() => onSetLoopBars(b)}
              className={`
                w-11 h-[48px] text-xs font-mono font-bold transition-all cursor-pointer outline-none rounded-none flex items-center justify-center border box-border
                ${
                  looperState.loopBars === b
                    ? 'bg-[#f59e0b] text-black border-amber-300 font-bold shadow-md'
                    : 'bg-[#141620] text-slate-300 border-white/20 hover:text-white hover:bg-[#1c1f2e]'
                }
              `}
            >
              {b}B
            </button>
          ))}
        </div>

        {/* Right: Export WAV (48px) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="bone" size="md" className="px-7" icon={<Download size={16} />} onClick={onOpenExport}>
            EXPORT WAV
          </Button>
        </div>
      </div>
    </header>
  );
};
