/**
 * Project and Persistence Type Definitions
 */

import { InstrumentId, TrackState, SynthParams, GuitarParams, BassParams, StepSequence, MicVoiceParams, ScaleName } from './audio';

export interface ProjectData {
  id: string;
  title: string;
  bpm: number;
  scale: ScaleName;
  rootNote: string;
  tracks: TrackState[];
  synthParams: SynthParams;
  guitarParams: GuitarParams;
  bassParams: BassParams;
  drumSequence: StepSequence;
  micParams: MicVoiceParams;
  createdAt: number;
  updatedAt: number;
}

export interface PresetLibraryItem {
  id: string;
  title: string;
  category: 'Synthwave' | 'Cyberpunk Rock' | 'Lo-Fi Chill' | 'Trap 808' | 'Futuristic Vocals';
  bpm: number;
  scale: ScaleName;
  rootNote: string;
  description: string;
  projectData: Partial<ProjectData>;
}
