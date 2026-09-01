/**
 * Drum Engine & Air-Drumming Synthesizer
 * 8-Piece synthesized drum kit (Kick, Snare, Hi-Hats, Clap, Tom, Rimshot, Cymbal)
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { DrumSound, DrumPadConfig, StepSequence } from '../../types/audio';

export const DRUM_PADS: DrumPadConfig[] = [
  { id: 'kick', name: '808 Kick', key: '1', color: '#00f2fe', volume: 0, pitch: 1 },
  { id: 'snare', name: 'Snare Punch', key: '2', color: '#9d4edd', volume: 0, pitch: 1 },
  { id: 'hihat_closed', name: 'Closed Hat', key: '3', color: '#ff007f', volume: 0, pitch: 1 },
  { id: 'hihat_open', name: 'Open Hat', key: '4', color: '#ffb703', volume: 0, pitch: 1 },
  { id: 'clap', name: 'Studio Clap', key: '5', color: '#06d6a0', volume: 0, pitch: 1 },
  { id: 'tom', name: 'Synth Tom', key: '6', color: '#38bdf8', volume: 0, pitch: 1 },
  { id: 'rimshot', name: 'Rimshot', key: '7', color: '#a855f7', volume: 0, pitch: 1 },
  { id: 'cymbal', name: 'Crash Cymbal', key: '8', color: '#f43f5e', volume: 0, pitch: 1 }
];

export class DrumEngine {
  private kickSynth: Tone.MembraneSynth | null = null;
  private snareNoise: Tone.NoiseSynth | null = null;
  private snareBody: Tone.Synth | null = null;
  private hihatClosed: Tone.NoiseSynth | null = null;
  private hihatOpen: Tone.NoiseSynth | null = null;
  private clapSynth: Tone.NoiseSynth | null = null;
  private tomSynth: Tone.MembraneSynth | null = null;
  private rimSynth: Tone.Synth | null = null;
  private cymbalSynth: Tone.NoiseSynth | null = null;
  private drumBus: Tone.Gain | null = null;

  public sequence: StepSequence = {
    kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat_closed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hihat_open: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
    clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    tom: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    rimshot: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    cymbal: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
  };

  /**
   * Initializes the synthesized drum modules
   */
  public init(): void {
    if (this.drumBus) return;
    const channel = audioEngine.getChannel('drums');
    if (!channel) return;

    this.drumBus = new Tone.Gain(1.1);
    this.drumBus.connect(channel);

    // 1. Kick (808 Membrane)
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.45, sustain: 0.01, release: 0.5 }
    }).connect(this.drumBus);

    // 2. Snare (Noise + Body)
    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0 }
    }).connect(this.drumBus);

    this.snareBody = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 }
    }).connect(this.drumBus);

    // 3. Hi-Hat Closed
    this.hihatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 }
    }).connect(this.drumBus);

    // 4. Hi-Hat Open
    this.hihatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0 }
    }).connect(this.drumBus);

    // 5. Clap
    this.clapSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.25, sustain: 0 }
    }).connect(this.drumBus);

    // 6. Tom
    this.tomSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.4 }
    }).connect(this.drumBus);

    // 7. Rimshot
    this.rimSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }
    }).connect(this.drumBus);

    // 8. Crash Cymbal
    this.cymbalSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.8, sustain: 0 }
    }).connect(this.drumBus);
  }

  /**
   * Triggers an individual drum pad sound
   */
  public triggerPad(sound: DrumSound, velocity = 0.9): void {
    if (!this.drumBus) this.init();

    const now = Tone.now();
    switch (sound) {
      case 'kick':
        this.kickSynth?.triggerAttackRelease('C1', '8n', now, velocity);
        break;
      case 'snare':
        this.snareNoise?.triggerAttackRelease('8n', now, velocity);
        this.snareBody?.triggerAttackRelease('G2', '16n', now, velocity * 0.7);
        break;
      case 'hihat_closed':
        this.hihatClosed?.triggerAttackRelease('16n', now, velocity * 0.85);
        break;
      case 'hihat_open':
        this.hihatOpen?.triggerAttackRelease('4n', now, velocity * 0.9);
        break;
      case 'clap':
        this.clapSynth?.triggerAttackRelease('8n', now, velocity);
        break;
      case 'tom':
        this.tomSynth?.triggerAttackRelease('G2', '8n', now, velocity);
        break;
      case 'rimshot':
        this.rimSynth?.triggerAttackRelease('D4', '32n', now, velocity);
        break;
      case 'cymbal':
        this.cymbalSynth?.triggerAttackRelease('2n', now, velocity * 0.9);
        break;
    }
  }

  /**
   * Toggles a step in the 16-step sequencer
   */
  public toggleStep(sound: DrumSound, stepIndex: number): void {
    if (this.sequence[sound] && stepIndex >= 0 && stepIndex < 16) {
      this.sequence[sound][stepIndex] = !this.sequence[sound][stepIndex];
    }
  }

  /**
   * Plays the sounds programmed for a specific 16th-note step index
   */
  public playStep(stepIndex: number): void {
    Object.keys(this.sequence).forEach((soundKey) => {
      const sound = soundKey as DrumSound;
      if (this.sequence[sound]?.[stepIndex]) {
        this.triggerPad(sound, 0.88);
      }
    });
  }
}

export const drumEngine = new DrumEngine();
