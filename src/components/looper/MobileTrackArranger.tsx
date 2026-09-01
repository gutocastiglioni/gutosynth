/**
 * Vertical Mobile Multi-Track Stem Arranger
 * Tactical monochrome and amber design for smartphone screens
 */

import React from 'react';
import { Play, Pause, Circle, Trash2, Mic, Waves, Flame, AudioWaveform, Disc3 } from 'lucide-react';
import { TrackState, InstrumentId, LooperState } from '../../types/audio';
import { Button } from '../common/Button';

interface MobileTrackArrangerProps {
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

export const MobileTrackArranger: React.FC<MobileTrackArrangerProps> = ({
  tracks,
  looperState,
  currentStep,
  currentBar,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onArmTrack,
  onClearTrack,
  onPlay,
  onPause,
  onToggleRecord,
  onSetLoopBars
}) => {
  const getTrackIcon = (id: InstrumentId) => {
    switch (id) {
      case 'synth': return <Waves size={16} />;
      case 'guitar': return <Flame size={16} />;
      case 'bass': return <AudioWaveform size={16} />;
      case 'drums': return <Disc3 size={16} />;
      case 'mic': return <Mic size={16} />;
    }
  };

  return (
    <div className="w-full border border-white/15 bg-[#0a0b0e] flex flex-col select-none rounded-none shadow-xl space-y-3 p-3">
      {/* 1. Mobile Transport Header */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[#060709] border border-white/10 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#f59e0b]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            STEMS ({tracks.length})
          </span>
          <span className="text-xs font-bold text-amber-300 px-2 py-0.5 bg-[#14151b] border border-white/15">
            BAR {currentBar + 1}/{looperState.loopBars}
          </span>
        </div>

        {/* Play & Record */}
        <div className="flex items-center gap-2">
          {looperState.isPlaying ? (
            <Button variant="amber" size="sm" icon={<Pause size={14} />} onClick={onPause}>
              PAUSE
            </Button>
          ) : (
            <Button variant="bone" size="sm" icon={<Play size={14} />} onClick={onPlay}>
              PLAY
            </Button>
          )}

          <Button
            variant={looperState.isRecording ? 'danger' : 'secondary'}
            size="sm"
            active={looperState.isRecording}
            icon={<Circle size={10} className={looperState.isRecording ? 'fill-white' : 'fill-red-400'} />}
            onClick={onToggleRecord}
          >
            {looperState.isRecording ? 'REC' : 'REC'}
          </Button>
        </div>
      </div>

      {/* 2. Vertical Mobile Channel Cards Stack */}
      <div className="space-y-2.5">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`
              p-3 border flex flex-col gap-2 transition-all rounded-none
              ${
                track.armed
                  ? 'border-red-500/60 bg-red-950/20 shadow-md'
                  : 'border-white/15 bg-[#111218]'
              }
            `}
          >
            {/* Top Row: Arm, Name, Mute, Solo, Trash */}
            <div className="flex items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => onArmTrack(track.id)}
                  className={`
                    w-8 h-8 flex items-center justify-center text-xs font-bold border transition-all cursor-pointer rounded-none
                    ${
                      track.armed
                        ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
                        : 'bg-black text-slate-300 border-white/20 hover:text-white'
                    }
                  `}
                  title="Arm Track"
                >
                  R
                </button>

                <div className="flex items-center gap-2 truncate">
                  <span className="text-amber-400">{getTrackIcon(track.id)}</span>
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate">
                    0{index + 1} {track.name}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleMute(track.id)}
                  className={`
                    px-3 py-1 text-xs font-bold border transition-all cursor-pointer rounded-none min-h-[32px]
                    ${
                      track.muted
                        ? 'bg-red-600 text-white border-red-400'
                        : 'bg-[#181922] text-slate-300 border-white/15'
                    }
                  `}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo(track.id)}
                  className={`
                    px-3 py-1 text-xs font-bold border transition-all cursor-pointer rounded-none min-h-[32px]
                    ${
                      track.solo
                        ? 'bg-[#f59e0b] text-black font-bold border-amber-300'
                        : 'bg-[#181922] text-slate-300 border-white/15'
                    }
                  `}
                >
                  S
                </button>
                <button
                  onClick={() => onClearTrack(track.id)}
                  className="p-2 text-slate-400 hover:text-red-400 border border-transparent hover:border-white/20 cursor-pointer rounded-none min-h-[32px]"
                  title="Clear Track"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Row: Volume Fader & dB Readout */}
            <div
              className="flex items-center gap-3 pt-1"
              onDoubleClick={() => onVolumeChange(track.id, 0)}
            >
              <span className="text-xs font-mono font-bold text-slate-400">VOL</span>
              <input
                type="range"
                min={-40}
                max={6}
                step={1}
                value={track.volume}
                onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-[#181922] appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-200 w-12 text-right">
                {track.volume > -40 ? `${track.volume}dB` : '-inf'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
