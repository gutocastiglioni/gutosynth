/**
 * Industrial Guitar Amp Control Deck
 * 100% Unified 50px Height Preset Buttons & Analog Tone Controls
 */

import React, { useState } from 'react';
import { guitarEngine } from '../../audio/instruments/GuitarEngine';
import { GuitarPreset } from '../../types/audio';
import { Knob } from '../common/Knob';

export const GuitarControls: React.FC = () => {
  const [preset, setPresetState] = useState<GuitarPreset>(guitarEngine.params.preset);
  const [drive, setDrive] = useState(guitarEngine.params.drive);
  const [tone, setTone] = useState(guitarEngine.params.tone);
  const [delay, setDelay] = useState(guitarEngine.params.delay);
  const [reverb, setReverb] = useState(guitarEngine.params.reverb);

  const presets: { id: GuitarPreset; label: string }[] = [
    { id: 'clean_strat', label: 'CLEAN' },
    { id: 'crunch_overdrive', label: 'CRUNCH' },
    { id: 'heavy_lead', label: 'LEAD' },
    { id: 'acoustic_sim', label: 'ACOUSTIC' }
  ];

  const handlePresetSelect = (p: GuitarPreset) => {
    setPresetState(p);
    guitarEngine.applyPreset(p);
  };

  return (
    <div className="space-y-8 pt-2">
      {/* Unified 50px Height Amp Presets */}
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

      {/* Tone & FX Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-6 space-y-4">
          <div className="landr-section-header text-xs">
            <span>ANALOG TONE & DRIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-6 justify-items-center">
            <Knob
              label="Drive"
              value={drive}
              defaultValue={0.3}
              min={0}
              max={1}
              step={0.05}
              color="#f97316"
              onChange={(val) => {
                setDrive(val);
                guitarEngine.setGestureDriveTone(val, tone);
              }}
            />
            <Knob
              label="Tone"
              value={tone}
              defaultValue={0.5}
              min={0}
              max={1}
              step={0.05}
              color="#f97316"
              onChange={(val) => {
                setTone(val);
                guitarEngine.setGestureDriveTone(drive, val);
              }}
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-4">
          <div className="landr-section-header text-xs">
            <span>SPATIAL DELAY & REVERB</span>
          </div>
          <div className="grid grid-cols-2 gap-6 justify-items-center">
            <Knob
              label="Echo"
              value={delay}
              defaultValue={0.25}
              min={0}
              max={1}
              step={0.05}
              color="#f59e0b"
              onChange={(val) => {
                setDelay(val);
                guitarEngine.setFX(val, reverb);
              }}
            />
            <Knob
              label="Spring"
              value={reverb}
              defaultValue={0.3}
              min={0}
              max={1}
              step={0.05}
              color="#f59e0b"
              onChange={(val) => {
                setReverb(val);
                guitarEngine.setFX(delay, val);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
