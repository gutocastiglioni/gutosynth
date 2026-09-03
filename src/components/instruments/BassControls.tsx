/**
 * Industrial Bass Deck Component
 * Unified 50px Height Preset Buttons, Analog Tone Controls & Interactive Note Strip
 */

import React, { useState } from 'react';
import { bassEngine } from '../../audio/instruments/BassEngine';
import { BassPreset } from '../../types/audio';
import { Knob } from '../common/Knob';

const TACTILE_BASS_NOTES = [
  { note: 'C2', label: 'C2', freq: '65Hz' },
  { note: 'D2', label: 'D2', freq: '73Hz' },
  { note: 'E2', label: 'E2', freq: '82Hz' },
  { note: 'F2', label: 'F2', freq: '87Hz' },
  { note: 'G2', label: 'G2', freq: '98Hz' },
  { note: 'A2', label: 'A2', freq: '110Hz' },
  { note: 'B2', label: 'B2', freq: '123Hz' },
  { note: 'C3', label: 'C3', freq: '131Hz' }
];

export const BassControls: React.FC = () => {
  const [preset, setPresetState] = useState<BassPreset>(bassEngine.params.preset);
  const [subBoost, setSubBoost] = useState(bassEngine.params.subBoost);
  const [drive, setDrive] = useState(bassEngine.params.drive);
  const [cutoff, setCutoff] = useState(bassEngine.params.cutoff);
  const [wobbleSpeed, setWobbleSpeed] = useState(bassEngine.params.wobbleSpeed);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const presets: { id: BassPreset; label: string }[] = [
    { id: 'sub_808', label: '808 SUB' },
    { id: 'slap_funk', label: 'SLAP FUNK' },
    { id: 'acid_303', label: '303 ACID' },
    { id: 'smooth_reese', label: 'REESE' }
  ];

  const handlePresetSelect = (p: BassPreset) => {
    setPresetState(p);
    bassEngine.applyPreset(p);
  };

  const handlePlayNote = (note: string) => {
    bassEngine.pluck(note, 0.95);
    setActiveNote(note);
    setTimeout(() => setActiveNote((cur) => (cur === note ? null : cur)), 250);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Unified 50px Height Bass Model Selector */}
      <div className="flex items-center justify-center">
        <div className="flex flex-wrap items-center p-1.5 bg-[#090a0d] border border-white/20 gap-2 w-full sm:w-auto justify-center">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              className={`
                px-8 h-[50px] text-xs md:text-sm font-mono font-bold transition-all cursor-pointer border rounded-none tracking-[0.14em] uppercase flex items-center justify-center
                ${
                  preset === p.id
                    ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-lg'
                    : 'bg-[#15161d] text-slate-200 border-white/10 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Tactile Bass Note Strip (Touch & Click Trigger) */}
      <div className="p-3 bg-[#0a0b0e] border border-white/15 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
          <span>BASS STRING // NOTE STRIP (CLICK TO AUDITION)</span>
          <span className="text-amber-400 font-bold">{activeNote ? `ACTIVE: ${activeNote}` : 'READY'}</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {TACTILE_BASS_NOTES.map((item) => {
            const isPlaying = activeNote === item.note;
            return (
              <button
                key={item.note}
                onClick={() => handlePlayNote(item.note)}
                className={`
                  h-14 sm:h-16 flex flex-col items-center justify-center border transition-all cursor-pointer select-none outline-none
                  ${
                    isPlaying
                      ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-[0_0_16px_rgba(251,191,36,0.6)] scale-95'
                      : 'bg-[#12141c] text-slate-200 border-white/15 hover:border-amber-400/50 hover:bg-[#1a1d28] active:scale-95'
                  }
                `}
              >
                <span className="text-sm font-mono font-bold">{item.label}</span>
                <span className="text-[10px] font-mono text-slate-400">{item.freq}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Bass & Drive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 space-y-3">
          <div className="landr-section-header text-xs">
            <span>SUB-BASS & SATURATION</span>
          </div>
          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Sub"
              value={subBoost}
              defaultValue={0.8}
              min={0}
              max={1}
              step={0.05}
              color="#f59e0b"
              onChange={(val) => {
                setSubBoost(val);
                bassEngine.params.subBoost = val;
              }}
            />
            <Knob
              label="Drive"
              value={drive}
              defaultValue={0.35}
              min={0}
              max={1}
              step={0.05}
              color="#f97316"
              onChange={(val) => {
                setDrive(val);
                bassEngine.params.drive = val;
              }}
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-3">
          <div className="landr-section-header text-xs">
            <span>FILTER & WOBBLE</span>
          </div>
          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Cutoff"
              value={cutoff}
              defaultValue={1200}
              min={80}
              max={4000}
              step={25}
              unit="Hz"
              color="#f59e0b"
              onChange={(val) => {
                setCutoff(val);
                bassEngine.params.cutoff = val;
              }}
            />
            <Knob
              label="Wobble"
              value={wobbleSpeed}
              defaultValue={2.0}
              min={0.5}
              max={10}
              step={0.5}
              unit="Hz"
              color="#f97316"
              onChange={(val) => {
                setWobbleSpeed(val);
                bassEngine.params.wobbleSpeed = val;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
