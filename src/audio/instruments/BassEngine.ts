/**
 * Bass Synthesis Engine
 * Deep Sub-808, Slap Funk, Acid 303, and Reese bass generator
 * Features dedicated post-filter for glitch-free gesture sweeps,
 * harmonic saturation for audible presence on all speakers, and punch compression.
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { BassParams, BassPreset } from '../../types/audio';

export class BassEngine {
  private monoSynth: Tone.MonoSynth | null = null;
  private postFilter: Tone.Filter | null = null;
  private distortion: Tone.Distortion | null = null;
  private compressor: Tone.Compressor | null = null;
  private subGain: Tone.Gain | null = null;
  private activeNote: string | null = null;

  public params: BassParams = {
    preset: 'sub_808',
    subBoost: 0.8,
    drive: 0.35,
    cutoff: 1200,
    resonance: 3.5,
    wobbleSpeed: 2.0
  };

  /**
   * Initializes bass engine and connects to the bass channel strip
   */
  public init(): void {
    if (this.monoSynth) return;
    const channel = audioEngine.getChannel('bass');
    if (!channel) return;

    // 1. Dedicated post-filter for 100% clean, click-free gesture modulation
    this.postFilter = new Tone.Filter({
      frequency: this.params.cutoff,
      type: 'lowpass',
      rolloff: -24,
      Q: this.params.resonance
    });

    // 2. Analog distortion / tube grit
    this.distortion = new Tone.Distortion({
      distortion: this.params.drive,
      wet: 0.35
    });

    // 3. Bass glue compressor to keep dynamics solid and punchy
    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 5,
      attack: 0.005,
      release: 0.12
    });

    // 4. Sub output gain stage
    this.subGain = new Tone.Gain(1.4);

    // 5. Monophonic synthesis engine
    this.monoSynth = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.008,
        decay: 0.35,
        sustain: 0.85,
        release: 0.45
      },
      filter: {
        Q: 1.5,
        type: 'lowpass',
        rolloff: -12
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.25,
        sustain: 0.4,
        release: 0.3,
        baseFrequency: 120,
        octaves: 3
      },
      portamento: 0.04
    });

    // Clean signal routing: MonoSynth -> PostFilter -> Distortion -> Compressor -> Gain -> Channel
    this.monoSynth.chain(this.postFilter, this.distortion, this.compressor, this.subGain, channel);
    this.applyPreset(this.params.preset);
  }

  /**
   * Triggers a bass note at the designated octave with legato portamento
   */
  public triggerAttack(note: string, velocity = 0.9): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    this.activeNote = note;
    this.monoSynth.triggerAttack(note, Tone.now(), Math.min(1.0, Math.max(0.3, velocity)));
  }

  /**
   * Releases current active bass note cleanly
   */
  public triggerRelease(): void {
    if (!this.monoSynth) return;
    this.monoSynth.triggerRelease();
    this.activeNote = null;
  }

  /**
   * Plucks a bass note with percussive attack and automatic decay
   */
  public pluck(note: string, velocity = 0.95): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    this.activeNote = note;
    this.monoSynth.triggerAttackRelease(note, '4n', Tone.now(), velocity);
  }

  /**
   * Plays a bass note with specific duration (e.g. '8n', '4n')
   */
  public triggerAttackRelease(note: string, duration = '4n', velocity = 0.9): void {
    if (!this.monoSynth) this.init();
    if (!this.monoSynth) return;

    this.activeNote = note;
    this.monoSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
  }

  /**
   * Returns current active note or null
   */
  public get currentNote(): string | null {
    return this.activeNote;
  }

  /**
   * Applies distinct bass presets with tuned harmonics for audible clarity
   */
  public applyPreset(preset: BassPreset): void {
    this.params.preset = preset;
    if (!this.monoSynth || !this.distortion || !this.postFilter) return;

    switch (preset) {
      case 'sub_808':
        // Triangle with soft saturation: produces warm sub fundamental + audible 2nd harmonic
        this.distortion.distortion = 0.28;
        this.distortion.wet.value = 0.35;
        this.monoSynth.set({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.005, decay: 0.6, sustain: 0.9, release: 0.8 },
          filterEnvelope: { baseFrequency: 80, octaves: 2.2 },
          portamento: 0.06
        });
        this.postFilter.frequency.rampTo(1400, 0.05);
        this.postFilter.Q.value = 2.0;
        break;

      case 'slap_funk':
        // Punchy square with rapid attack pop and bright snap
        this.distortion.distortion = 0.45;
        this.distortion.wet.value = 0.45;
        this.monoSynth.set({
          oscillator: { type: 'square' },
          envelope: { attack: 0.003, decay: 0.22, sustain: 0.5, release: 0.2 },
          filterEnvelope: { baseFrequency: 220, octaves: 4.0 },
          portamento: 0.01
        });
        this.postFilter.frequency.rampTo(2800, 0.05);
        this.postFilter.Q.value = 4.0;
        break;

      case 'acid_303':
        // Sawtooth with high resonance sweep and rich biting overtones
        this.distortion.distortion = 0.7;
        this.distortion.wet.value = 0.75;
        this.monoSynth.set({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.004, decay: 0.28, sustain: 0.35, release: 0.15 },
          filterEnvelope: { baseFrequency: 140, octaves: 5.0 },
          portamento: 0.03
        });
        this.postFilter.frequency.rampTo(3400, 0.05);
        this.postFilter.Q.value = 6.0;
        break;

      case 'smooth_reese':
        // Fat rich multi-saw with lush wide body and sustained thickness
        this.distortion.distortion = 0.35;
        this.distortion.wet.value = 0.4;
        this.monoSynth.set({
          oscillator: { type: 'fatsawtooth', count: 3, spread: 25 } as any,
          envelope: { attack: 0.03, decay: 0.45, sustain: 0.85, release: 0.6 },
          filterEnvelope: { baseFrequency: 100, octaves: 3.0 },
          portamento: 0.08
        });
        this.postFilter.frequency.rampTo(1800, 0.05);
        this.postFilter.Q.value = 2.5;
        break;
    }
  }

  /**
   * Modulates bass cutoff (Y) and distortion drive / grit (X) via real-time hand gesture
   */
  public setGestureFilter(normalizedX: number, normalizedY: number): void {
    if (!this.monoSynth) this.init();
    if (!this.postFilter) return;

    // Y axis: Post-filter Cutoff from 80Hz (deep sub) to 4800Hz (bright acid bite)
    const baseFreq = 80 + Math.pow(Math.max(0, Math.min(1, normalizedY)), 1.7) * 4400;
    this.postFilter.frequency.rampTo(baseFreq, 0.03);
    this.params.cutoff = Math.round(baseFreq);

    // X axis: Distortion drive from 0.05 (clean sub) to 0.95 (heavy saturated drive)
    if (this.distortion) {
      const drive = Math.max(0.05, Math.min(0.95, normalizedX));
      this.distortion.distortion = drive;
      this.params.drive = drive;
    }
  }
}

export const bassEngine = new BassEngine();
