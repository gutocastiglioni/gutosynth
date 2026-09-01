/**
 * Industrial Bass Deck Component
 * 100% Unified 50px Height Preset Buttons & Filter Controls
 */

import React, { useState } from 'react';
import { bassEngine } from '../../audio/instruments/BassEngine';
import { BassPreset } from '../../types/audio';
import { Knob } from '../common/Knob';

export const BassControls: React.FC = () => {
  const [preset, setPresetState] = useState<BassPreset>(bassEngine.params.preset);
  const [subBoost, setSubBoost] = useState(bassEngine.params.subBoost);
  const [drive, setDrive] = useState(bassEngine.params.drive);
  const [cutoff, setCutoff] = useState(bassEngine.params.cutoff);
  const [wobbleSpeed, setWobbleSpeed] = useState(bassEngine.params.wobbleSpeed);

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

  return (
    <div className="space-y-8 pt-2">
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

      {/* Sub-Bass & Drive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-6 space-y-4">
          <div className="landr-section-header text-xs">
            <span>SUB-BASS & SATURATION</span>
          </div>
          <div className="grid grid-cols-2 gap-6 justify-items-center">
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
              defaultValue={0.2}
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

        <div className="md:col-span-6 space-y-4">
          <div className="landr-section-header text-xs">
            <span>FILTER & WOBBLE</span>
          </div>
          <div className="grid grid-cols-2 gap-6 justify-items-center">
            <Knob
              label="Cutoff"
              value={cutoff}
              defaultValue={450}
              min={50}
              max={3000}
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
