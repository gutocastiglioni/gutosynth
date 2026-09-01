/**
 * Bass Synthesis Engine
 * Deep Sub-808, Slap Funk, and Acid 303 bass generator with gesture wobble & resonance growl
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { BassParams, BassPreset } from '../../types/audio';

export class BassEngine {
  private monoSynth: Tone.MonoSynth | null = null;
  private distortion: Tone.Distortion | null = null;
  private compressor: Tone.Compressor | null = null;
  private subGain: Tone.Gain | null = null;

  public params: BassParams = {
    preset: 'sub_808',
    subBoost: 0.8,
    drive: 0.4,
    cutoff: 800,
    resonance: 4.0,
    wobbleSpeed: 2.0
  };

  /**
   * Initializes bass engine and connects to the bass channel strip
   */
  public init(): void {
    if (this.monoSynth) return;
    const channel = audioEngine.getChannel('bass');
    if (!channel) return;

    this.distortion = new Tone.Distortion({ distortion: this.params.drive, wet: 0.4 });
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 6,
      attack: 0.005,
      release: 0.15
    });

    this.subGain = new Tone.Gain(1.3);

    this.monoSynth = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0.8,
        release: 0.6
      },
      filter: {
        Q: this.params.resonance,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.2,
        release: 0.4,
        baseFrequency: 60,
        octaves: 3.5
      },
      portamento: 0.05
    });

    this.monoSynth.chain(this.distortion, this.compressor, this.subGain, channel);
    this.applyPreset(this.params.preset);
  }

  /**
   * Triggers a bass note at the designated octave
   */
  public triggerAttack(note: string, velocity = 0.9): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    this.monoSynth.triggerAttack(note, Tone.now(), velocity);
  }

  /**
   * Releases current active bass note
   */
  public triggerRelease(): void {
    if (!this.monoSynth) return;
    this.monoSynth.triggerRelease();
  }

  /**
   * Plays a bass note with specific duration (e.g. '8n', '4n')
   */
  public triggerAttackRelease(note: string, duration = '4n', velocity = 0.9): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    this.monoSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
  }

  /**
   * Applies distinct bass presets
   */
  public applyPreset(preset: BassPreset): void {
    this.params.preset = preset;
    if (!this.monoSynth || !this.distortion) return;

    switch (preset) {
      case 'sub_808':
        this.distortion.distortion = 0.25;
        this.distortion.wet.value = 0.3;
        this.monoSynth.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.8, sustain: 0.9, release: 1.2 },
          filterEnvelope: { baseFrequency: 45, octaves: 2 },
          portamento: 0.08
        });
        break;

      case 'slap_funk':
        this.distortion.distortion = 0.45;
        this.distortion.wet.value = 0.5;
        this.monoSynth.set({
          oscillator: { type: 'square' },
          envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.2 },
          filterEnvelope: { baseFrequency: 120, octaves: 4.5 },
          portamento: 0.01
        });
        break;

      case 'acid_303':
        this.distortion.distortion = 0.75;
        this.distortion.wet.value = 0.85;
        this.monoSynth.set({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.15 },
          filterEnvelope: { baseFrequency: 80, octaves: 5 },
          portamento: 0.04
        });
        break;

      case 'smooth_reese':
        this.distortion.distortion = 0.35;
        this.distortion.wet.value = 0.4;
        this.monoSynth.set({
          oscillator: { type: 'fatsawtooth' },
          envelope: { attack: 0.08, decay: 0.5, sustain: 0.8, release: 0.8 },
          filterEnvelope: { baseFrequency: 60, octaves: 3 },
          portamento: 0.1
        });
        break;
    }
  }

  /**
   * Modulates bass cutoff (Y) and distortion drive / grit (X) via real-time hand gesture
   */
  public setGestureFilter(normalizedX: number, normalizedY: number): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    // Y axis: Cutoff from 60Hz (deep sub) to 3600Hz (bright acid)
    const baseFreq = 60 + Math.pow(normalizedY, 1.8) * 3500;
    this.monoSynth.filter.frequency.rampTo(baseFreq, 0.04);

    // X axis: Distortion drive from 0.05 (clean sub) to 0.95 (heavy saturated drive)
    if (this.distortion) {
      const drive = Math.max(0.05, Math.min(0.95, normalizedX));
      this.distortion.distortion = drive;
      this.params.drive = drive;
    }
  }
}

export const bassEngine = new BassEngine();
