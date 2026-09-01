/**
 * Multi-Track Looper & Studio Mixer Component
 * Full-width 5-Stem channel strips (Vertical Volume Faders, Pan Dials, Mute, Solo, Arm Record & Bar Looping Progress)
 */

import React from 'react';
import { Disc2, Trash2, Mic2 } from 'lucide-react';
import { TrackState, InstrumentId, LooperState } from '../../types/audio';
import { Knob } from '../common/Knob';
import { Button } from '../common/Button';

interface MultiTrackMixerProps {
  tracks: TrackState[];
  looperState: LooperState;
  currentStep: number;
  currentBar: number;
  onVolumeChange: (id: InstrumentId, volDb: number) => void;
  onPanChange: (id: InstrumentId, pan: number) => void;
  onToggleMute: (id: InstrumentId) => void;
  onToggleSolo: (id: InstrumentId) => void;
  onArmTrack: (id: InstrumentId) => void;
  onClearTrack: (id: InstrumentId) => void;
}

export const MultiTrackMixer: React.FC<MultiTrackMixerProps> = ({
  tracks,
  looperState,
  currentStep,
  currentBar,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onArmTrack,
  onClearTrack
}) => {
  return (
    <div className="w-full p-4 rounded-2xl glass-panel border border-white/10 space-y-3.5">
      {/* Top Mixer & Looper Bar Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] animate-pulse" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
            Multi-Track DAW Console
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
            5 Stems • {looperState.bpm} BPM • {looperState.loopBars} Bars
          </span>
        </div>

        {/* Bar & Step Playhead Progress Track */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-300 font-bold hidden sm:inline">
            BAR {currentBar + 1}/{looperState.loopBars}
          </span>
          <div
            className="grid gap-1.5 w-36 sm:w-56"
            style={{ gridTemplateColumns: `repeat(${looperState.loopBars}, 1fr)` }}
          >
            {Array.from({ length: looperState.loopBars }).map((_, barIdx) => {
              const isCurrentBar = currentBar === barIdx;
              return (
                <div
                  key={barIdx}
                  className={`
                    h-2.5 rounded-sm overflow-hidden bg-black/60 border relative
                    ${
                      isCurrentBar
                        ? 'border-cyan-400 shadow-[0_0_8px_rgba(0,242,254,0.4)]'
                        : 'border-white/10'
                    }
                  `}
                >
                  <div className="absolute inset-0 grid grid-cols-16">
                    {Array.from({ length: 16 }).map((_, sIdx) => {
                      const isStep = isCurrentBar && currentStep === sIdx;
                      return (
                        <div
                          key={sIdx}
                          className={`h-full ${
                            isStep
                              ? 'bg-cyan-400 shadow-[0_0_5px_#00f2fe]'
                              : sIdx % 4 === 0
                              ? 'border-r border-white/10'
                              : ''
                          }`}
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

      {/* 5-Stem Channel Strips Grid (Evenly Distributed) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`
              p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all duration-200
              ${
                track.armed
                  ? 'bg-red-950/25 border-red-500/50 shadow-[0_0_18px_rgba(239,68,68,0.25)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }
            `}
          >
            {/* Track Header & Arm / Select */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: track.color }} />
                <span className="text-xs font-bold font-display text-slate-100 truncate">{track.name}</span>
              </div>

              <button
                onClick={() => onArmTrack(track.id)}
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer flex-shrink-0
                  ${
                    track.armed
                      ? 'bg-red-500 text-white shadow-[0_0_10px_#ef4444] animate-pulse'
                      : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                  }
                `}
                title={track.armed ? 'Armed for Recording' : 'Arm Track'}
              >
                R
              </button>
            </div>

            {/* Pan Rotary Dial */}
            <div className="flex justify-center py-0.5">
              <Knob
                label="Pan"
                value={track.pan}
                min={-1}
                max={1}
                step={0.1}
                size={44}
                color={track.color}
                onChange={(val) => onPanChange(track.id, val)}
              />
            </div>

            {/* Volume Fader Range */}
            <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-white/5">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>VOL</span>
                <span className="font-bold text-slate-200">
                  {track.volume > -40 ? `${track.volume}dB` : '-inf'}
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={6}
                step={1}
                value={track.volume}
                onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1a1e2e] rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Mute, Solo & Clear Buttons */}
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={track.muted ? 'danger' : 'ghost'}
                size="sm"
                className="px-1 text-[10px] min-h-[26px]"
                onClick={() => onToggleMute(track.id)}
              >
                M
              </Button>
              <Button
                variant={track.solo ? 'amber' : 'ghost'}
                size="sm"
                className="px-1 text-[10px] min-h-[26px]"
                onClick={() => onToggleSolo(track.id)}
              >
                S
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-1 text-[10px] min-h-[26px] text-slate-500 hover:text-red-400"
                onClick={() => onClearTrack(track.id)}
                title="Clear Track Recording"
              >
                <Trash2 size={11} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
