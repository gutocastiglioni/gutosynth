/**
 * PolySynthEngine - Dedicated Dual-Engine Synthesizer
 * 1. Monophonic Lead Synthesizer for right hand expression & melody gliding.
 * 2. Polyphonic Chord Synthesizer with differential voice management for left hand harmony.
 */

import * as Tone from 'tone';
import { SynthWaveform } from '../../types/audio';
import { audioEngine } from '../AudioEngine';

export type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export interface SynthParams {
  waveform: SynthWaveform;
  cutoff: number;
  resonance: number;
  adsr: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  chorus: number;
  delay: number;
  reverb: number;
  portamento: number;
}

export class PolySynthEngine {
  private leadSynth: Tone.Synth | null = null;
  private chordSynth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private chorus: Tone.Chorus | null = null;
  private delay: Tone.PingPongDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private isLeadActive = false;
  private currentLeadNote: string | null = null;
  private chordNotes: Set<string> = new Set();

  public params: SynthParams = {
    waveform: 'sawtooth',
    cutoff: 3600,
    resonance: 1.5,
    adsr: {
      attack: 0.02,
      decay: 0.25,
      sustain: 0.7,
      release: 0.35
    },
    chorus: 0.35,
    delay: 0.15,
    reverb: 0.3,
    portamento: 0.05
  };

  public init(): void {
    if (this.leadSynth && this.chordSynth) return;

    const channel = audioEngine.getChannel('synth');
    if (!channel) return;

    // Master Dynamic Lowpass Filter
    this.filter = new Tone.Filter({
      frequency: this.params.cutoff,
      type: 'lowpass',
      rolloff: -24,
      Q: this.params.resonance
    });

    // Master FX Chain
    this.chorus = new Tone.Chorus(2.5, 4.0, this.params.chorus).start();
    this.delay = new Tone.PingPongDelay('8n', this.params.delay);
    this.delay.wet.value = this.params.delay;
    this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.015, wet: this.params.reverb });

    // Filter -> FX -> Synth Channel
    this.filter.chain(this.chorus, this.delay, this.reverb, channel);

    const oscType = this.params.waveform === 'fmsynth' ? 'sine' : this.params.waveform;

    // 1. Dedicated Expressive Lead Synth with Legato Portamento
    this.leadSynth = new Tone.Synth({
      oscillator: { type: oscType as any },
      envelope: {
        attack: this.params.adsr.attack,
        decay: this.params.adsr.decay,
        sustain: this.params.adsr.sustain,
        release: this.params.adsr.release
      },
      volume: -2,
      portamento: this.params.portamento
    });
    this.leadSynth.connect(this.filter);

    // 2. Dedicated Left Hand Chord Synthesizer with high polyphony
    this.chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType as any },
      envelope: {
        attack: 0.04,
        decay: 0.30,
        sustain: 0.65,
        release: 0.30
      },
      volume: -6
    });
    this.chordSynth.maxPolyphony = 32;
    this.chordSynth.connect(this.filter);
  }

  /**
   * Plays a scale-quantized lead note with smooth legato glide
   */
  public playLead(note: string, velocity = 0.85): void {
    if (!this.leadSynth) this.init();
    if (!this.leadSynth) return;

    if (!this.isLeadActive) {
      try {
        this.leadSynth.triggerAttack(note, Tone.now(), velocity);
        this.isLeadActive = true;
        this.currentLeadNote = note;
      } catch {
        // safe ignore
      }
    } else if (this.currentLeadNote !== note) {
      try {
        this.leadSynth.setNote(note);
        this.currentLeadNote = note;
      } catch {
        // safe ignore
      }
    }
  }

  /**
   * Releases lead synth note immediately
   */
  public releaseLead(): void {
    if (this.leadSynth) {
      try {
        this.leadSynth.triggerRelease(Tone.now());
      } catch {
        // safe ignore
      }
    }
    this.isLeadActive = false;
    this.currentLeadNote = null;
  }

  /**
   * Triggers a discrete single note (One-Shot / Staccato) without continuous sustain
   */
  public triggerSingleNote(note: string, duration: number | string = '8n', velocity = 0.85): void {
    if (!this.leadSynth) this.init();
    if (!this.leadSynth) return;

    try {
      const now = Tone.now();
      if (this.isLeadActive) {
        this.leadSynth.triggerRelease(now);
        this.isLeadActive = false;
      }
      this.leadSynth.triggerAttackRelease(note, duration, now, velocity);
      this.currentLeadNote = note;
    } catch {
      // safe ignore
    }
  }

  public releaseAllFingers(): void {
    this.releaseLead();
  }

  public isAnyFingerActive(): boolean {
    return this.isLeadActive;
  }

  /**
   * Triggers a chord voicing from left hand with differential voice management
   * (never wipes the entire voice pool, eliminating voice dropouts and audio cutoffs)
   */
  public triggerChord(notes: string[], velocity = 0.75): void {
    if (!this.chordSynth) this.init();
    if (!this.chordSynth) return;

    const uniqueNotes = Array.from(new Set(notes.filter(Boolean)));
    if (uniqueNotes.length === 0) return;

    try {
      const now = Tone.now();

      // Determine notes to release vs notes to attack
      const toRelease: string[] = [];
      this.chordNotes.forEach((oldNote) => {
        if (!uniqueNotes.includes(oldNote)) {
          toRelease.push(oldNote);
        }
      });

      const toAttack: string[] = [];
      uniqueNotes.forEach((newNote) => {
        if (!this.chordNotes.has(newNote)) {
          toAttack.push(newNote);
        }
      });

      if (toRelease.length > 0) {
        this.chordSynth.triggerRelease(toRelease, now);
      }

      if (toAttack.length > 0) {
        this.chordSynth.triggerAttack(toAttack, now, velocity);
      } else if (this.chordNotes.size === 0) {
        this.chordSynth.triggerAttack(uniqueNotes, now, velocity);
      }

      this.chordNotes.clear();
      uniqueNotes.forEach((n) => this.chordNotes.add(n));
    } catch (e) {
      console.warn('PolySynth triggerChord error:', e);
    }
  }

  /**
   * Triggers a discrete single chord voicing without continuous sustain
   */
  public triggerChordSingle(notes: string[], duration: number | string = '4n', velocity = 0.75): void {
    if (!this.chordSynth) this.init();
    if (!this.chordSynth) return;

    const uniqueNotes = Array.from(new Set(notes.filter(Boolean)));
    if (uniqueNotes.length === 0) return;

    try {
      const now = Tone.now();
      this.chordSynth.releaseAll();
      this.chordNotes.clear();
      this.chordSynth.triggerAttackRelease(uniqueNotes, duration, now, velocity);
    } catch {
      // safe ignore
    }
  }

  /**
   * Releases chord synth notes unconditionally
   */
  public releaseChord(): void {
    if (this.chordSynth) {
      try {
        if (this.chordNotes.size > 0) {
          this.chordSynth.triggerRelease(Array.from(this.chordNotes), Tone.now());
        } else {
          this.chordSynth.releaseAll();
        }
      } catch {
        // safe ignore
      }
    }
    this.chordNotes.clear();
  }

  /**
   * Releases all audio generators unconditionally
   */
  public releaseAll(): void {
    this.releaseLead();
    this.releaseChord();
  }

  /**
   * Modulates Filter Cutoff (Y) & Resonance/Chorus (X) in safe musical bounds
   */
  public setGestureModulation(normalizedX: number, normalizedHeight: number): void {
    if (!this.filter) this.init();
    if (!this.filter) return;

    const clampedY = Math.max(0.01, Math.min(1.0, normalizedHeight));
    const clampedX = Math.max(0.0, Math.min(1.0, normalizedX));

    // Filter cutoff: Exponential sweep from 250Hz (warm) to 10,000Hz (crisp/open)
    const minFreq = 250;
    const maxFreq = 10000;
    const targetFreq = minFreq * Math.pow(maxFreq / minFreq, clampedY);
    this.filter.frequency.rampTo(targetFreq, 0.04);

    // Filter Q: Musical range from 1.0 to 3.5
    const targetQ = 1.0 + clampedX * 2.5;
    this.filter.Q.rampTo(targetQ, 0.04);

    // Stereo Chorus depth
    if (this.chorus) {
      const chorusDepth = 0.15 + clampedX * 0.45;
      this.chorus.wet.rampTo(chorusDepth, 0.05);
    }
  }

  public setWaveform(w: SynthWaveform): void {
    this.params.waveform = w;
    const oscType = w === 'fmsynth' ? 'sine' : w;
    if (this.leadSynth) {
      try {
        this.leadSynth.oscillator.type = oscType as any;
      } catch {
        // safe ignore
      }
    }
    if (this.chordSynth) {
      try {
        this.chordSynth.set({ oscillator: { type: oscType as any } });
      } catch {
        // safe ignore
      }
    }
  }

  public setEnvelope(adsr: Partial<SynthParams['adsr']>): void {
    this.params.adsr = { ...this.params.adsr, ...adsr };
    if (this.leadSynth) {
      if (adsr.attack !== undefined) this.leadSynth.envelope.attack = adsr.attack;
      if (adsr.decay !== undefined) this.leadSynth.envelope.decay = adsr.decay;
      if (adsr.sustain !== undefined) this.leadSynth.envelope.sustain = adsr.sustain;
      if (adsr.release !== undefined) this.leadSynth.envelope.release = adsr.release;
    }
    if (this.chordSynth) {
      this.chordSynth.set({
        envelope: {
          attack: this.params.adsr.attack,
          decay: this.params.adsr.decay,
          sustain: this.params.adsr.sustain,
          release: this.params.adsr.release
        }
      });
    }
  }

  public setFX(chorus?: number, delay?: number, reverb?: number): void {
    if (chorus !== undefined) {
      this.params.chorus = chorus;
      if (this.chorus) this.chorus.wet.rampTo(chorus, 0.05);
    }
    if (delay !== undefined) {
      this.params.delay = delay;
      if (this.delay) this.delay.wet.rampTo(delay, 0.05);
    }
    if (reverb !== undefined) {
      this.params.reverb = reverb;
      if (this.reverb) this.reverb.wet.rampTo(reverb, 0.05);
    }
  }
}

export const polySynthEngine = new PolySynthEngine();
