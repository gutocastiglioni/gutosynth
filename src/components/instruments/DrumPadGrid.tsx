/**
 * LANDR Studio Drum Pad Grid & 16-Step Pattern Sequencer
 * 8 large tactile silicone pads with trigger flashes, Snare "PÁ" Snap control & accessible step matrix
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { drumEngine, DRUM_PADS } from '../../audio/instruments/DrumEngine';
import { DrumSound } from '../../types/audio';
import { Knob } from '../common/Knob';

interface DrumPadGridProps {
  currentStep?: number;
}

export const DrumPadGrid: React.FC<DrumPadGridProps> = ({ currentStep = 0 }) => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [sequenceState, setSequenceState] = useState({ ...drumEngine.sequence });
  const [snareSnap, setSnareSnap] = useState(drumEngine.snareSnap);

  const handleTriggerPad = (id: DrumSound) => {
    drumEngine.triggerPad(id, 0.95);
    setActivePad(id);
    setTimeout(() => setActivePad((cur) => (cur === id ? null : cur)), 100);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pad = DRUM_PADS.find((p) => p.key === e.key);
      if (pad && !(e.target instanceof HTMLInputElement)) {
        handleTriggerPad(pad.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleStep = (sound: DrumSound, stepIdx: number) => {
    drumEngine.toggleStep(sound, stepIdx);
    setSequenceState({ ...drumEngine.sequence });
  };

  const handleClearSequence = () => {
    Object.keys(drumEngine.sequence).forEach((s) => {
      drumEngine.sequence[s] = new Array(16).fill(false);
    });
    setSequenceState({ ...drumEngine.sequence });
  };

  const handleSnareSnapChange = (val: number) => {
    setSnareSnap(val);
    drumEngine.setSnareSnap(val);
  };

  return (
    <div className="space-y-4 pt-1 font-mono">
      {/* 8 Large Silicone Drum Pads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {DRUM_PADS.map((pad) => {
          const isTriggered = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => handleTriggerPad(pad.id)}
              className={`
                relative h-18 sm:h-20 flex flex-col items-center justify-center p-2 rounded-none
                border transition-all duration-75 cursor-pointer select-none outline-none
                ${
                  isTriggered
                    ? 'bg-white text-black scale-95 border-white shadow-[0_0_20px_#ffffff]'
                    : 'bg-[#151c2a] border-white/15 hover:border-white/30 text-slate-100 active:scale-95 shadow-md'
                }
              `}
              style={{
                borderColor: isTriggered ? '#ffffff' : `${pad.color}40`
              }}
            >
              {/* Corner Key Shortcut Badge */}
              <span className="absolute top-1.5 left-2 text-[10px] font-mono font-bold text-slate-400">
                [{pad.key}]
              </span>

              {/* Pad Indicator Light */}
              <div
                className="w-2 h-2 mb-1"
                style={{
                  backgroundColor: pad.color,
                  boxShadow: isTriggered ? `0 0 10px ${pad.color}` : 'none'
                }}
              />

              <span className="text-xs font-mono font-bold tracking-wider uppercase truncate max-w-[90%]">
                {pad.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kit Dynamics Bar: Snare "PÁ" Crack Control & Punch Status */}
      <div className="p-3 bg-[#0a0b0e] border border-white/15 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-[#161a26] border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              SNARE "PÁ" PUNCH & CRACK
            </div>
            <div className="text-[9px] text-slate-400">
              Ajuste dinâmico de transiente e estalo da caixa
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleTriggerPad('snare')}
            className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            OUVIR "PÁ"
          </button>
          <Knob
            label="Crack"
            value={snareSnap}
            defaultValue={0.85}
            min={0}
            max={1}
            step={0.05}
            size={48}
            color="#00f2fe"
            onChange={handleSnareSnapChange}
          />
        </div>
      </div>

      {/* 16-Step Sequencer Matrix */}
      <div className="p-3 border border-white/10 bg-[#0f1420] space-y-2.5 rounded-none">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
            <span>16-STEP RHYTHM MATRIX</span>
          </div>
          <button
            onClick={handleClearSequence}
            className="text-[10px] font-mono font-bold text-slate-300 hover:text-white px-2.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/15 flex items-center gap-1.5 cursor-pointer rounded-none"
          >
            <RotateCcw size={11} />
            <span>CLEAR</span>
          </button>
        </div>

        {/* Sequencer Rows */}
        <div className="space-y-1.5 overflow-x-auto custom-scrollbar pb-1">
          {DRUM_PADS.slice(0, 5).map((pad) => (
            <div key={pad.id} className="flex items-center gap-2 min-w-[340px]">
              <span className="w-16 text-[10px] font-mono font-bold text-slate-300 uppercase truncate">
                {pad.name}
              </span>
              <div className="flex-1 grid grid-cols-16 gap-1">
                {sequenceState[pad.id]?.map((active, stepIdx) => {
                  const isCurrent = currentStep === stepIdx;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => handleToggleStep(pad.id, stepIdx)}
                      className={`
                        h-6 transition-all cursor-pointer outline-none rounded-none
                        ${stepIdx % 4 === 0 ? 'border-l border-white/30' : ''}
                        ${
                          active
                            ? 'bg-[#facc15] shadow-[0_0_8px_#facc15]'
                            : isCurrent
                            ? 'bg-white/30'
                            : 'bg-black/70 hover:bg-white/15'
                        }
                        ${isCurrent ? 'ring-1 ring-white' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
