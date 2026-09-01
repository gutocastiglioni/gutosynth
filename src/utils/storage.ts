/**
 * Project Storage & Cloud Sync Utility
 * Manages LocalStorage & IndexedDB project sessions + preset templates
 */

import { ProjectData, PresetLibraryItem } from '../types/project';

const STORAGE_KEY = 'synth_gesture_projects_v1';

export const FACTORY_PRESETS: PresetLibraryItem[] = [
  {
    id: 'preset-synthwave',
    title: 'Cyber Neon Nights',
    category: 'Synthwave',
    bpm: 118,
    scale: 'minor',
    rootNote: 'A',
    description: 'Lush 80s polysynth pads with 808 sub-bass and gated cyberpunk snare beats.',
    projectData: {
      bpm: 118,
      scale: 'minor',
      rootNote: 'A',
      synthParams: {
        waveform: 'sawtooth',
        cutoff: 3200,
        resonance: 4.2,
        adsr: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 1.2 },
        chorus: 0.45,
        delay: 0.3,
        reverb: 0.5,
        portamento: 0.03,
        thereminMode: false,
        octave: 4
      }
    }
  },
  {
    id: 'preset-cyber-rock',
    title: 'Neon Overdrive Shred',
    category: 'Cyberpunk Rock',
    bpm: 135,
    scale: 'pentatonic',
    rootNote: 'E',
    description: 'High-gain tube overdrive guitar with heavy delay, slap bass and punchy acoustic rock drums.',
    projectData: {
      bpm: 135,
      scale: 'pentatonic',
      rootNote: 'E',
      guitarParams: {
        preset: 'heavy_lead',
        drive: 0.88,
        tone: 0.8,
        reverb: 0.4,
        delay: 0.35,
        cabinet: true,
        strumVelocity: 0.9
      }
    }
  },
  {
    id: 'preset-future-bass',
    title: 'Tokyo Cyber Bass',
    category: 'Trap 808',
    bpm: 140,
    scale: 'cyberpunk',
    rootNote: 'F#',
    description: 'Japanese Hirajoshi cyberpunk scale with modulated acid bass sweeps and fast hi-hat rolls.',
    projectData: {
      bpm: 140,
      scale: 'cyberpunk',
      rootNote: 'F#',
      bassParams: {
        preset: 'acid_303',
        subBoost: 0.9,
        drive: 0.65,
        cutoff: 1200,
        resonance: 6.5,
        wobbleSpeed: 4.0
      }
    }
  }
];

export class StorageService {
  /**
   * Retrieves all saved user projects from local storage
   */
  public getProjects(): ProjectData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves or updates a project session
   */
  public saveProject(project: ProjectData): boolean {
    try {
      const projects = this.getProjects();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      if (existingIdx >= 0) {
        projects[existingIdx] = { ...project, updatedAt: Date.now() };
      } else {
        projects.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (err) {
      console.error('Failed to save project:', err);
      return false;
    }
  }

  /**
   * Deletes a project by ID
   */
  public deleteProject(projectId: string): boolean {
    try {
      const projects = this.getProjects().filter((p) => p.id !== projectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
