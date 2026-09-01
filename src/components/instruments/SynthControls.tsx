/**
 * Industrial Synthesizer Console Component
 * Symmetrical 5-Waveform Bar, 4x2 Rotary Matrix, and Balanced Output Deck
 */

import React, { useState } from 'react';
import { polySynthEngine } from '../../audio/instruments/PolySynthEngine';
import { SynthWaveform } from '../../types/audio';
import { Knob } from '../common/Knob';

export const SynthControls: React.FC = () => {
  const [waveform, setWaveformState] = useState<SynthWaveform>(polySynthEngine.params.waveform);
  const [cutoff, setCutoff] = useState(polySynthEngine.params.cutoff);
  const [resonance, setResonance] = useState(polySynthEngine.params.resonance);
  const [attack, setAttack] = useState(polySynthEngine.params.adsr.attack);
  const [decay, setDecay] = useState(polySynthEngine.params.adsr.decay);
  const [sustain, setSustain] = useState(polySynthEngine.params.adsr.sustain);
  const [release, setRelease] = useState(polySynthEngine.params.adsr.release);
  const [chorus, setChorus] = useState(polySynthEngine.params.chorus);
  const [reverb, setReverb] = useState(polySynthEngine.params.reverb);
  const [stereoWidth, setStereoWidth] = useState(0.5);
  const [outputLoudness, setOutputLoudness] = useState(0.85);

  const handleWaveformChange = (w: SynthWaveform) => {
    setWaveformState(w);
    polySynthEngine.setWaveform(w);
  };

  const waveforms: { id: SynthWaveform; label: string }[] = [
    { id: 'sawtooth', label: 'SAW' },
    { id: 'square', label: 'SQUARE' },
    { id: 'sine', label: 'SINE' },
    { id: 'triangle', label: 'TRI' },
    { id: 'fmsynth', label: 'FM SINE' }
  ];

  const dbMarks = ['-0', '-6', '-12', '-24', '-inf'];

  return (
    <div className="w-full space-y-5 font-mono select-none">
      {/* 1. Single-Row 5-Waveform Segmented Switcher */}
      <div className="grid grid-cols-5 gap-1.5 w-full bg-[#08080a] p-1 border border-white/15">
        {waveforms.map((w) => (
          <button
            key={w.id}
            onClick={() => handleWaveformChange(w.id)}
            className={`
              h-[38px] px-1 text-xs font-mono font-bold transition-all cursor-pointer border rounded-none tracking-wider uppercase flex items-center justify-center
              ${
                waveform === w.id
                  ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-md'
                  : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
              }
            `}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* 2. Symmetrical 4x2 Rotary Parameter Matrix */}
      <div className="space-y-4 p-3 bg-[#0a0b0e] border border-white/15">
        {/* Section 1: Filter & Space (4 Knobs) */}
        <div className="space-y-2">
          <div className="landr-section-header text-[10px]">
            <span>FILTER & MODULATION</span>
          </div>
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="Cutoff"
              value={cutoff}
              defaultValue={2400}
              min={200}
              max={12000}
              step={100}
              unit="Hz"
              size={52}
              onChange={(v) => {
                polySynthEngine.params.cutoff = v;
                setCutoff(v);
              }}
            />
            <Knob
              label="Reso"
              value={resonance}
              defaultValue={3.5}
              min={0.5}
              max={15}
              step={0.1}
              size={52}
              onChange={(v) => {
                polySynthEngine.params.resonance = v;
                setResonance(v);
              }}
            />
            <Knob
              label="Chorus"
              value={chorus}
              defaultValue={0.35}
              min={0}
              max={1}
              step={0.05}
              size={52}
              onChange={(v) => {
                setChorus(v);
                polySynthEngine.setFX(v, polySynthEngine.params.delay, reverb);
              }}
            />
            <Knob
              label="Reverb"
              value={reverb}
              defaultValue={0.4}
              min={0}
              max={1}
              step={0.05}
              size={52}
              onChange={(v) => {
                setReverb(v);
                polySynthEngine.setFX(chorus, polySynthEngine.params.delay, v);
              }}
            />
          </div>
        </div>

        {/* Section 2: Envelope Dynamics ADSR (4 Knobs) */}
        <div className="space-y-2 pt-1">
          <div className="landr-section-header text-[10px]">
            <span>ENVELOPE DYNAMICS (ADSR)</span>
          </div>
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="Attack"
              value={attack}
              defaultValue={0.05}
              min={0.005}
              max={1.5}
              step={0.01}
              unit="s"
              size={52}
              onChange={(v) => {
                setAttack(v);
                polySynthEngine.setEnvelope({ attack: v });
              }}
            />
            <Knob
              label="Decay"
              value={decay}
              defaultValue={0.2}
              min={0.05}
              max={2.0}
              step={0.05}
              unit="s"
              size={52}
              onChange={(v) => {
                setDecay(v);
                polySynthEngine.setEnvelope({ decay: v });
              }}
            />
            <Knob
              label="Sustain"
              value={sustain}
              defaultValue={0.7}
              min={0}
              max={1}
              step={0.05}
              size={52}
              onChange={(v) => {
                setSustain(v);
                polySynthEngine.setEnvelope({ sustain: v });
              }}
            />
            <Knob
              label="Release"
              value={release}
              defaultValue={0.8}
              min={0.1}
              max={4.0}
              step={0.1}
              unit="s"
              size={52}
              onChange={(v) => {
                setRelease(v);
                polySynthEngine.setEnvelope({ release: v });
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Output Stage: Stereo Field + Master Level + VU Meter */}
      <div className="p-3 bg-[#0a0b0e] border border-white/15 grid grid-cols-12 gap-3 items-center">
        {/* Left: Stereo Field Slider */}
        <div className="col-span-7 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase">
            <span>STEREO FIELD</span>
            <span className="text-amber-400 font-bold">{Math.round(stereoWidth * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={stereoWidth}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setStereoWidth(val);
              polySynthEngine.setFX(val, polySynthEngine.params.delay, reverb);
            }}
            className="w-full h-1.5 bg-[#181922] appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
            <span>FOCUS</span>
            <span>WIDE</span>
          </div>
        </div>

        {/* Right: Master Output + VU Meter */}
        <div className="col-span-5 flex items-center justify-end gap-3 pl-2 border-l border-white/10">
          <Knob
            label="Volume"
            value={outputLoudness}
            defaultValue={0.85}
            min={0}
            max={1}
            step={0.01}
            size={52}
            color="#f59e0b"
            onChange={(v) => setOutputLoudness(v)}
          />

          {/* Compact VU Meter */}
          <div className="flex gap-1 items-stretch h-14 py-0.5">
            <div className="w-2 bg-[#050608] border border-white/15 flex flex-col justify-end p-0.5">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                style={{ height: `${outputLoudness * 85}%` }}
              />
            </div>
            <div className="w-2 bg-[#050608] border border-white/15 flex flex-col justify-end p-0.5">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                style={{ height: `${outputLoudness * 82}%` }}
              />
            </div>
            <div className="flex flex-col justify-between text-[8px] font-mono text-slate-400 pl-0.5">
              {dbMarks.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
