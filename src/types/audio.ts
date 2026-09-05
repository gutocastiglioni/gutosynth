/**
 * Audio Engine Type Definitions
 */

export type InstrumentId = 'synth' | 'guitar' | 'bass' | 'drums' | 'mic';

export type SynthWaveform = 'sawtooth' | 'square' | 'sine' | 'triangle' | 'fmsynth';

export type ScaleName = 'chromatic' | 'major' | 'minor' | 'pentatonic' | 'dorian' | 'cyberpunk' | 'blues';

export type GuitarPreset = 'clean_strat' | 'crunch_overdrive' | 'heavy_lead' | 'acoustic_sim';

export type BassPreset = 'sub_808' | 'slap_funk' | 'acid_303' | 'smooth_reese';

export type DrumSound = 'kick' | 'snare' | 'hihat_closed' | 'hihat_open' | 'clap' | 'tom' | 'rimshot' | 'cymbal';

export interface ADSRConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthParams {
  waveform: SynthWaveform;
  cutoff: number;
  resonance: number;
  adsr: ADSRConfig;
  chorus: number;
  delay: number;
  reverb: number;
  portamento: number;
  thereminMode: boolean;
  octave: number;
}

export interface GuitarParams {
  preset: GuitarPreset;
  drive: number;
  tone: number;
  reverb: number;
  delay: number;
  cabinet: boolean;
  strumVelocity: number;
}

export interface BassParams {
  preset: BassPreset;
  subBoost: number;
  drive: number;
  cutoff: number;
  resonance: number;
  wobbleSpeed: number;
}

export interface DrumPadConfig {
  id: DrumSound;
  name: string;
  key: string;
  color: string;
  volume: number;
  pitch: number;
}

export interface StepSequence {
  [drumSound: string]: boolean[]; // 16 steps
}

export interface MicVoiceParams {
  active: boolean;
  gain: number;
  pitchShift: number; // in semitones -12 to +12
  robotRingMod: boolean;
  distortion: number;
  delayTime: number;
  delayFeedback: number;
  reverbMix: number;
  gestureLinked: boolean;
}

export interface TrackState {
  id: InstrumentId;
  name: string;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  hasRecording: boolean;
  audioBufferUrl?: string;
  durationBars: number;
}

export interface LooperState {
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentBar: number;
  currentStep: number;
  loopBars: 1 | 2 | 4 | 8;
  metronome: boolean;
  masterVolume: number;
}

export type TriggerMode = 'continuous' | 'single' | 'repeat';

export type RepeatSubdivision = '1/4' | '1/8' | '1/16' | '1/32';

export interface TriggerSettings {
  mode: TriggerMode;
  subdivision: RepeatSubdivision;
  speedHz: number; // 1.0 to 20.0 Hz
  gateTime: number; // 0.05 to 0.8s
}
