/**
 * Tactical Studio Instrument Controller Chassis
 * 5-Column single-row tab switcher, custom dropdowns and fitted instrument decks
 */

import React from 'react';
import { Waves, Flame, AudioWaveform, Disc3, Mic } from 'lucide-react';
import { InstrumentId, ScaleName } from '../../types/audio';
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
}

export const InstrumentRack: React.FC<InstrumentRackProps> = ({
  activeInstrument,
  onSelectInstrument,
  scale,
  onSelectScale,
  rootNote,
  onSelectRootNote,
  currentStep = 0
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

      {/* 3. Active Instrument Controller Body (Fitted) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        {activeInstrument === 'synth' && <SynthControls />}
        {activeInstrument === 'guitar' && <GuitarControls />}
        {activeInstrument === 'bass' && <BassControls />}
        {activeInstrument === 'drums' && <DrumPadGrid currentStep={currentStep} />}
        {activeInstrument === 'mic' && <MicVoiceControls />}
      </div>
    </div>
  );
};
