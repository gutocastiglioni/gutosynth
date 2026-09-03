/**
 * Drum Engine & Air-Drumming Synthesizer
 * 8-Piece acoustic/electronic hybrid drum kit with high-impact "PÁ" Snare,
 * transient click generators, bandpass wire sizzle, and dedicated punch bus compressor.
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { DrumSound, DrumPadConfig, StepSequence } from '../../types/audio';

export const DRUM_PADS: DrumPadConfig[] = [
  { id: 'kick', name: '808 Kick', key: '1', color: '#00f2fe', volume: 0, pitch: 1 },
  { id: 'snare', name: 'Snare "PÁ"', key: '2', color: '#9d4edd', volume: 0, pitch: 1 },
  { id: 'hihat_closed', name: 'Closed Hat', key: '3', color: '#ff007f', volume: 0, pitch: 1 },
  { id: 'hihat_open', name: 'Open Hat', key: '4', color: '#ffb703', volume: 0, pitch: 1 },
  { id: 'clap', name: 'Studio Clap', key: '5', color: '#06d6a0', volume: 0, pitch: 1 },
  { id: 'tom', name: 'Synth Tom', key: '6', color: '#38bdf8', volume: 0, pitch: 1 },
  { id: 'rimshot', name: 'Rimshot', key: '7', color: '#a855f7', volume: 0, pitch: 1 },
  { id: 'cymbal', name: 'Crash Cymbal', key: '8', color: '#f43f5e', volume: 0, pitch: 1 }
];

export class DrumEngine {
  // Drum Bus & Dynamics
  private drumBus: Tone.Gain | null = null;
  private drumCompressor: Tone.Compressor | null = null;

  // Kick Modules
  private kickSynth: Tone.MembraneSynth | null = null;
  private kickClick: Tone.Synth | null = null;

  // Snare "PÁ" Modules (Transient Crack + Tuned Shell + Filtered Sizzle)
  private snareBody: Tone.MembraneSynth | null = null;
  private snareTransient: Tone.Synth | null = null;
  private snareNoise: Tone.NoiseSynth | null = null;
  private snareFilter: Tone.Filter | null = null;
  public snareSnap = 0.85; // Intensity of the "PÁ" crack (0.0 to 1.0)

  // Hi-Hats & Cymbals (Highpassed & Resonant)
  private hatFilter: Tone.Filter | null = null;
  private hihatClosed: Tone.NoiseSynth | null = null;
  private hihatOpen: Tone.NoiseSynth | null = null;
  private cymbalSynth: Tone.NoiseSynth | null = null;
  private cymbalFilter: Tone.Filter | null = null;

  // Percussion (Clap multi-burst, Tom, Rimshot)
  private clapSynth: Tone.NoiseSynth | null = null;
  private clapFilter: Tone.Filter | null = null;
  private tomSynth: Tone.MembraneSynth | null = null;
  private rimSynth: Tone.Synth | null = null;

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
   * Initializes the synthesized drum modules & dedicated glue compressor bus
   */
  public init(): void {
    if (this.drumBus) return;
    const channel = audioEngine.getChannel('drums');
    if (!channel) return;

    // Dedicated Drum Bus Glue Compressor for maximum punch and presence
    this.drumCompressor = new Tone.Compressor({
      threshold: -16,
      ratio: 4.5,
      attack: 0.003,
      release: 0.12
    });

    this.drumBus = new Tone.Gain(1.25);
    this.drumBus.chain(this.drumCompressor, channel);

    // =========================================================================
    // 1. KICK (Punchy Beater Click + Sub-Weight Boom)
    // =========================================================================
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 5.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.42, sustain: 0.01, release: 0.45 }
    }).connect(this.drumBus);

    this.kickClick = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.005 }
    }).connect(this.drumBus);
    this.kickClick.volume.value = -8;

    // =========================================================================
    // 2. SNARE "PÁ" (3-Stage: Beater Click + Tuned Shell Pitch-Drop + Wire Sizzle)
    // =========================================================================
    // A. Tuned Shell Membrane with rapid pitch drop (A2 ~110Hz to G1)
    this.snareBody = new Tone.MembraneSynth({
      pitchDecay: 0.025,
      octaves: 2.8,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 }
    }).connect(this.drumBus);
    this.snareBody.volume.value = 2.0;

    // B. Sharp Stick Impact Transient Click (850Hz -> 180Hz in 5ms) for the "P"
    this.snareTransient = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.0005, decay: 0.02, sustain: 0, release: 0.01 }
    }).connect(this.drumBus);
    this.snareTransient.volume.value = 4.0;

    // C. Crisp Snare Wires Bandpass Filtered Noise (2.2kHz - 8.5kHz) for the "Á"
    this.snareFilter = new Tone.Filter({
      frequency: 3400,
      type: 'bandpass',
      Q: 1.1
    }).connect(this.drumBus);

    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.17, sustain: 0 }
    }).connect(this.snareFilter);
    this.snareNoise.volume.value = 3.0;

    // =========================================================================
    // 3. HI-HATS (Crisp Highpassed Metallic Sizzle, TV-static eliminated)
    // =========================================================================
    this.hatFilter = new Tone.Filter({
      frequency: 7200,
      type: 'highpass',
      rolloff: -24
    }).connect(this.drumBus);

    this.hihatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.0008, decay: 0.045, sustain: 0 }
    }).connect(this.hatFilter);
    this.hihatClosed.volume.value = 1.0;

    this.hihatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.32, sustain: 0 }
    }).connect(this.hatFilter);
    this.hihatOpen.volume.value = 0.5;

    // =========================================================================
    // 4. CLAP (Multi-Burst Flam Texture + Filtered Reverb Tail)
    // =========================================================================
    this.clapFilter = new Tone.Filter({
      frequency: 1800,
      type: 'bandpass',
      Q: 1.4
    }).connect(this.drumBus);

    this.clapSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.004, decay: 0.22, sustain: 0 }
    }).connect(this.clapFilter);
    this.clapSynth.volume.value = 1.5;

    // =========================================================================
    // 5. TOM (Pitched Membrane with Warm Thud)
    // =========================================================================
    this.tomSynth = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.32, sustain: 0.01, release: 0.35 }
    }).connect(this.drumBus);

    // =========================================================================
    // 6. RIMSHOT (Crisp Wood/Stick Strike)
    // =========================================================================
    this.rimSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.0005, decay: 0.035, sustain: 0, release: 0.01 }
    }).connect(this.drumBus);
    this.rimSynth.volume.value = 0.5;

    // =========================================================================
    // 7. CRASH CYMBAL (Bright Explosive Wash)
    // =========================================================================
    this.cymbalFilter = new Tone.Filter({
      frequency: 5500,
      type: 'highpass',
      rolloff: -12
    }).connect(this.drumBus);

    this.cymbalSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.95, sustain: 0 }
    }).connect(this.cymbalFilter);
  }

  /**
   * Triggers an individual drum pad sound with dynamic velocity
   */
  public triggerPad(sound: DrumSound, velocity = 0.9): void {
    if (!this.drumBus) this.init();

    const now = Tone.now();
    const clampedVel = Math.min(1.0, Math.max(0.2, velocity));

    switch (sound) {
      case 'kick':
        this.kickSynth?.triggerAttackRelease('C1', '8n', now, clampedVel);
        this.kickClick?.triggerAttackRelease('C5', '64n', now, clampedVel * 0.8);
        break;

      case 'snare': {
        // High-Impact "PÁ": Transient snap + tuned punch shell + wire sizzle
        const snapGain = 0.5 + this.snareSnap * 0.6;
        this.snareTransient?.triggerAttackRelease('A4', '64n', now, clampedVel * snapGain);
        this.snareBody?.triggerAttackRelease('A2', '16n', now, clampedVel);
        this.snareNoise?.triggerAttackRelease('16n', now + 0.001, clampedVel * snapGain);
        break;
      }

      case 'hihat_closed':
        this.hihatClosed?.triggerAttackRelease('32n', now, clampedVel * 0.9);
        break;

      case 'hihat_open':
        this.hihatOpen?.triggerAttackRelease('8n', now, clampedVel * 0.85);
        break;

      case 'clap': {
        // Studio flam multi-tap: 2 rapid micro-bursts followed by full body
        this.clapSynth?.triggerAttackRelease('32n', now, clampedVel * 0.45);
        this.clapSynth?.triggerAttackRelease('32n', now + 0.012, clampedVel * 0.65);
        this.clapSynth?.triggerAttackRelease('16n', now + 0.024, clampedVel);
        break;
      }

      case 'tom':
        this.tomSynth?.triggerAttackRelease('G2', '8n', now, clampedVel);
        break;

      case 'rimshot':
        this.rimSynth?.triggerAttackRelease('D4', '64n', now, clampedVel);
        break;

      case 'cymbal':
        this.cymbalSynth?.triggerAttackRelease('2n', now, clampedVel * 0.85);
        break;
    }
  }

  /**
   * Sets the intensity of the snare punch / "PÁ" crack (0.0 = softer, 1.0 = maximum explosive snap)
   */
  public setSnareSnap(snap: number): void {
    this.snareSnap = Math.max(0, Math.min(1, snap));
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
        this.triggerPad(sound, 0.92);
      }
    });
  }
}

export const drumEngine = new DrumEngine();
