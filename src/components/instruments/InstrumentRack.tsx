/**
 * Tactical Studio Instrument Controller Chassis
 * 5-Column single-row tab switcher, custom dropdowns and fitted instrument decks
 */

import React from 'react';
import { Waves, Flame, AudioWaveform, Disc3, Mic } from 'lucide-react';
import { InstrumentId, ScaleName, TriggerSettings, RepeatSubdivision } from '../../types/audio';
import { ROOT_NOTES } from '../../audio/scales';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { SynthControls } from './SynthControls';
import { GuitarControls } from './GuitarControls';
import { BassControls } from './BassControls';
import { DrumPadGrid } from './DrumPadGrid';
import { MicVoiceControls } from './MicVoiceControls';

interface InstrumentRackProps {
  activeInstrument: InstrumentId;
  onSelectInstrument: (id: InstrumentId) => void;
  scale: ScaleName;
  onSelectScale: (scale: ScaleName) => void;
  rootNote: string;
  onSelectRootNote: (root: string) => void;
  currentStep?: number;
  showSwitcher?: boolean;
  triggerSettings: TriggerSettings;
  onTriggerSettingsChange: (settings: TriggerSettings) => void;
  currentBpm?: number;
}

export const InstrumentRack: React.FC<InstrumentRackProps> = React.memo(({
  activeInstrument,
  onSelectInstrument,
  scale,
  onSelectScale,
  rootNote,
  onSelectRootNote,
  currentStep = 0,
  showSwitcher = true,
  triggerSettings,
  onTriggerSettingsChange,
  currentBpm = 120
}) => {
  const instruments: { id: InstrumentId; label: string; icon: React.ReactNode }[] = [
    { id: 'synth', label: 'SYNTH', icon: <Waves size={15} /> },
    { id: 'guitar', label: 'GUITAR', icon: <Flame size={15} /> },
    { id: 'bass', label: 'BASS', icon: <AudioWaveform size={15} /> },
    { id: 'drums', label: 'DRUMS', icon: <Disc3 size={15} /> },
    { id: 'mic', label: 'VOICE', icon: <Mic size={15} /> }
  ];

  const rootOptions: SelectOption[] = ROOT_NOTES.map((note) => ({
    value: note,
    label: `KEY ${note}`
  }));

  const scaleOptions: SelectOption[] = [
    { value: 'minor', label: 'Natural Minor' },
    { value: 'major', label: 'Major Scale' },
    { value: 'pentatonic', label: 'Pentatonic' },
    { value: 'cyberpunk', label: 'Hirajoshi' },
    { value: 'blues', label: 'Blues' },
    { value: 'dorian', label: 'Dorian' }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-4 font-mono">
      {/* 1. Single-Row 5-Column Segmented Instrument Switcher */}
      {showSwitcher && (
        <div className="grid grid-cols-5 gap-1.5 w-full bg-[#08080a] p-1 border border-white/20">
          {instruments.map((inst) => {
            const isSelected = activeInstrument === inst.id;
            return (
              <button
                key={inst.id}
                onClick={() => onSelectInstrument(inst.id)}
                className={`
                  h-[42px] px-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider uppercase
                  transition-all duration-75 rounded-none border select-none cursor-pointer outline-none
                  ${
                    isSelected
                      ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-md'
                      : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:border-white/35 hover:bg-[#1c1f2e]'
                  }
                `}
              >
                <span className="flex-shrink-0">{inst.icon}</span>
                <span className="truncate">{inst.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Scale & Root Key Row */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <CustomSelect
          label="ROOT"
          value={rootNote}
          options={rootOptions}
          onChange={onSelectRootNote}
          width="w-1/2"
        />

        <CustomSelect
          label="SCALE"
          value={scale}
          options={scaleOptions}
          onChange={(val) => onSelectScale(val as ScaleName)}
          width="w-1/2"
        />
      </div>

      {/* 3. Note Trigger Articulation & Repeat Speed Deck */}
      {activeInstrument !== 'drums' && (
        <div className="p-2.5 bg-[#08080a] border border-white/20 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-300 uppercase">
            <span>DISPARO // ARTICULAÇÃO</span>
            <span className="text-amber-400 font-bold">
              {triggerSettings.mode === 'continuous'
                ? 'CONTÍNUO (SUSTAIN)'
                : triggerSettings.mode === 'single'
                ? 'NOTA ÚNICA (DISPARO)'
                : `REPETIÇÃO (${triggerSettings.subdivision} • ${triggerSettings.speedHz}Hz)`}
            </span>
          </div>

          {/* 3-Way Mode Switcher: Continuous vs Single Note vs Repeat */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            <button
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, mode: 'continuous' })}
              className={`
                h-[36px] px-1 text-xs font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer flex items-center justify-center
                ${
                  triggerSettings.mode === 'continuous'
                    ? 'bg-[#f4f4f5] text-black border-white shadow-md'
                    : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
                }
              `}
            >
              CONTÍNUO
            </button>
            <button
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, mode: 'single' })}
              className={`
                h-[36px] px-1 text-xs font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer flex items-center justify-center
                ${
                  triggerSettings.mode === 'single'
                    ? 'bg-[#f4f4f5] text-black border-white shadow-md'
                    : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
                }
              `}
            >
              NOTA ÚNICA
            </button>
            <button
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, mode: 'repeat' })}
              className={`
                h-[36px] px-1 text-xs font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer flex items-center justify-center
                ${
                  triggerSettings.mode === 'repeat'
                    ? 'bg-[#f4f4f5] text-black border-white shadow-md'
                    : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
                }
              `}
            >
              REPETIÇÃO
            </button>
          </div>

          {/* Repeat Speed & Gate Controls */}
          {triggerSettings.mode !== 'continuous' && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              {triggerSettings.mode === 'repeat' && (
                <>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>VELOCIDADE DA REPETIÇÃO</span>
                    <span className="text-amber-400 font-bold">
                      {triggerSettings.speedHz.toFixed(1)} Hz ({Math.round(1000 / triggerSettings.speedHz)}ms)
                    </span>
                  </div>

                  {/* Subdivision Presets */}
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {(['1/4', '1/8', '1/16', '1/32'] as RepeatSubdivision[]).map((sub) => {
                      const factor = sub === '1/4' ? 1 : sub === '1/8' ? 2 : sub === '1/16' ? 4 : 8;
                      const hz = Number(((currentBpm / 60) * factor).toFixed(1));
                      const isSelected = triggerSettings.subdivision === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() =>
                            onTriggerSettingsChange({
                              ...triggerSettings,
                              subdivision: sub,
                              speedHz: hz
                            })
                          }
                          className={`
                            h-[30px] text-xs font-mono font-bold tracking-wider border transition-all cursor-pointer
                            ${
                              isSelected
                                ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-sm'
                                : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
                            }
                          `}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Sliders: Speed Hz (in Repeat mode) + Gate Time */}
              <div className="grid grid-cols-2 gap-3 items-center pt-0.5">
                {triggerSettings.mode === 'repeat' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                      <span>VELOCIDADE</span>
                      <span className="text-amber-400 font-bold">{triggerSettings.speedHz} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={triggerSettings.speedHz}
                      onChange={(e) =>
                        onTriggerSettingsChange({
                          ...triggerSettings,
                          speedHz: parseFloat(e.target.value)
                        })
                      }
                      className="w-full h-1.5 bg-[#181922] appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 text-[10px] text-slate-400 font-mono">
                    <span className="text-amber-400 font-bold uppercase">DISPARO POR GESTO</span>
                    <p className="text-[9px] text-slate-500 leading-tight">Levantar dedos marca 1 nota pontual.</p>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                    <span>DURAÇÃO (GATE)</span>
                    <span className="text-amber-400 font-bold">{Math.round(triggerSettings.gateTime * 1000)}ms</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    value={triggerSettings.gateTime}
                    onChange={(e) =>
                      onTriggerSettingsChange({
                        ...triggerSettings,
                        gateTime: parseFloat(e.target.value)
                      })
                    }
                    className="w-full h-1.5 bg-[#181922] appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Active Instrument Controller Body (Fitted) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        {activeInstrument === 'synth' && <SynthControls />}
        {activeInstrument === 'guitar' && <GuitarControls />}
        {activeInstrument === 'bass' && <BassControls />}
        {activeInstrument === 'drums' && <DrumPadGrid currentStep={currentStep} />}
        {activeInstrument === 'mic' && <MicVoiceControls />}
      </div>
    </div>
  );
});
