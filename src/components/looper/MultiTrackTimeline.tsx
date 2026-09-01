/**
 * Studio Multi-Track Tape & Stem Arranger
 * Open, unboxed modern DAW timeline with full-bleed waveform canvas and sleek channel strips
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { TrackState, InstrumentId, LooperState } from '../../types/audio';

interface MultiTrackTimelineProps {
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
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleMetronome: () => void;
  onSetLoopBars: (bars: 1 | 2 | 4 | 8) => void;
}

const STRIP_WIDTH_PX = 135;

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  tracks,
  looperState,
  currentStep,
  currentBar,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onArmTrack,
  onClearTrack
}) => {
  const totalStepsInLoop = looperState.loopBars * 16;
  const currentTotalStep = currentBar * 16 + currentStep;
  const playheadPercent = looperState.isPlaying ? (currentTotalStep / totalStepsInLoop) * 100 : 0;

  const getInstrumentCode = (id: InstrumentId, index: number) => {
    switch (id) {
      case 'synth': return { code: `0${index + 1}`, label: 'SYNTH' };
      case 'guitar': return { code: `0${index + 1}`, label: 'GUITAR' };
      case 'bass': return { code: `0${index + 1}`, label: 'BASS' };
      case 'drums': return { code: `0${index + 1}`, label: 'DRUMS' };
      case 'mic': return { code: `0${index + 1}`, label: 'VOICE' };
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0b0e] flex flex-col select-none rounded-none overflow-hidden">
      {/* 1. Master Tracker Header Bar */}
      <div className="px-3.5 py-2.5 bg-[#08080a] border-b border-white/15 flex items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#f59e0b]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            STEM RECORDER
          </span>
        </div>

        <div className="text-xs font-bold text-amber-300 px-2.5 py-0.5 bg-[#14151b] border border-white/20">
          <span>BAR 0{currentBar + 1}</span>
          <span className="text-slate-500 mx-1">/</span>
          <span>0{looperState.loopBars}</span>
        </div>
      </div>

      {/* 2. Timeline Musical Grid Ruler */}
      <div className="flex border-b border-white/15 bg-[#07080a] text-xs font-mono text-slate-400 h-7">
        <div
          style={{ width: STRIP_WIDTH_PX }}
          className="px-2.5 border-r border-white/15 font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between flex-shrink-0 text-[10px]"
        >
          <span>TRACK</span>
          <span>M/S</span>
        </div>

        {/* Bar Ruler Grid */}
        <div className="flex-1 grid relative h-full" style={{ gridTemplateColumns: `repeat(${looperState.loopBars}, 1fr)` }}>
          {Array.from({ length: looperState.loopBars }).map((_, barIdx) => (
            <div key={barIdx} className="px-2 border-r border-white/15 flex items-center justify-between text-slate-400 h-full font-bold text-[10px]">
              <span className={`font-bold ${currentBar === barIdx ? 'text-amber-400' : ''}`}>
                0{barIdx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Open Unboxed Multi-Track Rows */}
      <div className="flex-1 divide-y divide-white/10 bg-[#090a0d] relative overflow-y-auto custom-scrollbar">
        {/* Playhead Line */}
        {looperState.isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#f59e0b] z-30 pointer-events-none transition-all duration-75 shadow-[0_0_10px_#f59e0b]"
            style={{
              left: `calc(${STRIP_WIDTH_PX}px + (100% - ${STRIP_WIDTH_PX}px) * ${playheadPercent / 100})`
            }}
          >
            <div className="w-2.5 h-2.5 -ml-[4px] bg-[#f59e0b]" />
          </div>
        )}

        {tracks.map((track, index) => {
          const info = getInstrumentCode(track.id, index);
          return (
            <div key={track.id} className="flex items-stretch group hover:bg-white/[0.02] transition-colors h-[68px]">
              {/* Left Channel Controls */}
              <div
                style={{ width: STRIP_WIDTH_PX }}
                className="p-2 border-r border-white/15 flex flex-col justify-between bg-[#0e1017] flex-shrink-0 font-mono"
              >
                {/* Arm, Name, Mute, Solo, Trash */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      onClick={() => onArmTrack(track.id)}
                      className={`
                        w-5 h-5 flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer flex-shrink-0 rounded-none
                        ${
                          track.armed
                            ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
                            : 'bg-black text-slate-300 border-white/25 hover:text-white'
                        }
                      `}
                      title="Arm Track"
                    >
                      R
                    </button>

                    <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate">
                      {info.code} {info.label}
                    </span>
                  </div>

                  {/* Mute, Solo & Trash */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onToggleMute(track.id)}
                      className={`
                        w-4 h-4 flex items-center justify-center text-[9px] font-bold border transition-all cursor-pointer rounded-none
                        ${
                          track.muted
                            ? 'bg-red-600 text-white border-red-400'
                            : 'bg-[#181922] text-slate-400 border-white/20 hover:text-white'
                        }
                      `}
                    >
                      M
                    </button>
                    <button
                      onClick={() => onToggleSolo(track.id)}
                      className={`
                        w-4 h-4 flex items-center justify-center text-[9px] font-bold border transition-all cursor-pointer rounded-none
                        ${
                          track.solo
                            ? 'bg-[#f59e0b] text-black font-bold border-amber-300'
                            : 'bg-[#181922] text-slate-400 border-white/20 hover:text-white'
                        }
                      `}
                    >
                      S
                    </button>
                    <button
                      onClick={() => onClearTrack(track.id)}
                      className="p-0.5 text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Clear Stem Audio"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                {/* Volume Slider & dB */}
                <div
                  className="flex items-center gap-1.5"
                  onDoubleClick={() => onVolumeChange(track.id, 0)}
                  title="Double-click to reset volume to 0dB"
                >
                  <input
                    type="range"
                    min={-40}
                    max={6}
                    step={1}
                    value={track.volume}
                    onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-[#181922] appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-300 w-8 text-right">
                    {track.volume > -40 ? `${track.volume}dB` : '-inf'}
                  </span>
                </div>
              </div>

              {/* Right Open Waveform Lane (No Nested Bounding Boxes) */}
              <div
                className={`
                  flex-1 relative flex items-center px-2 select-none h-full transition-colors
                  ${track.armed ? 'bg-red-950/20' : 'bg-[#090a0d]'}
                `}
              >
                {/* Bar Grid Subdivision Lines */}
                <div
                  className="absolute inset-0 grid pointer-events-none h-full"
                  style={{ gridTemplateColumns: `repeat(${looperState.loopBars}, 1fr)` }}
                >
                  {Array.from({ length: looperState.loopBars }).map((_, barIdx) => (
                    <div key={barIdx} className="border-r border-white/10 h-full" />
                  ))}
                </div>

                {/* Open Full-Bleed Waveform Visualizer */}
                <div className="absolute inset-0 flex items-center justify-around px-3 pointer-events-none">
                  {Array.from({ length: 42 }).map((_, wIdx) => {
                    const seed = (index * 9 + wIdx * 17) % 100;
                    const h = 25 + (seed % 70);
                    return (
                      <div
                        key={wIdx}
                        className="w-[2px] transition-all"
                        style={{
                          height: `${h}%`,
                          backgroundColor: track.armed ? '#ef4444' : '#f4f4f5',
                          opacity: looperState.isPlaying ? 0.9 : 0.35
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
