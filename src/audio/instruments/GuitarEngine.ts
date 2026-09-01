/**
 * ============================================================================
 * ELECTRIC GUITAR ENGINE & AMP MODELER
 * ============================================================================
 * Tube overdrive, gesture rotation distortion, aggressive whip echo burst & strumming
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { GuitarParams, GuitarPreset } from '../../types/audio';

export class GuitarEngine {
  private synth: Tone.PolySynth | null = null;
  private preAmpGain: Tone.Gain | null = null;
  private distortion: Tone.Distortion | null = null;
  private cabinetFilter: Tone.Filter | null = null;
  private toneFilter: Tone.EQ3 | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private echoTimeout: any = null;

  public params: GuitarParams = {
    preset: 'crunch_overdrive',
    drive: 0.65,
    tone: 0.7,
    reverb: 0.35,
    delay: 0.25,
    cabinet: true,
    strumVelocity: 0.85
  };

  public init(): void {
    if (this.synth) return;
    const channel = audioEngine.getChannel('guitar');
    if (!channel) return;

    this.preAmpGain = new Tone.Gain(1.2);
    this.distortion = new Tone.Distortion({ distortion: this.params.drive, wet: 0.85 });

    this.cabinetFilter = new Tone.Filter({
      frequency: 4200,
      type: 'lowpass',
      rolloff: -12
    });

    this.toneFilter = new Tone.EQ3({
      low: 2,
      mid: 3,
      high: 1
    });

    this.delay = new Tone.FeedbackDelay('8n.', 0.25);
    this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: this.params.reverb });

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth6' },
      envelope: {
        attack: 0.005,
        decay: 0.35,
        sustain: 0.3,
        release: 0.3
      }
    });

    this.synth.chain(
      this.preAmpGain,
      this.distortion,
      this.cabinetFilter,
      this.toneFilter,
      this.delay,
      this.reverb,
      channel
    );

    this.applyPreset(this.params.preset);
  }

  public triggerEchoBurst(intensity = 0.85): void {
    if (!this.delay) return;
    if (this.echoTimeout) clearTimeout(this.echoTimeout);

    this.delay.wet.rampTo(Math.min(0.85, intensity * 0.9), 0.03);
    this.delay.feedback.rampTo(0.65, 0.03);

    this.echoTimeout = setTimeout(() => {
      if (this.delay) {
        this.delay.wet.rampTo(this.params.delay, 1.2);
        this.delay.feedback.rampTo(0.25, 1.2);
      }
    }, 450);
  }

  public setTiltDistortion(rotationAngle: number): void {
    if (!this.distortion) return;
    const deviation = Math.min(1.0, Math.abs(rotationAngle) * 0.85);
    if (deviation > 0.1) {
      const drive = Math.min(0.98, this.params.drive + (deviation - 0.1) * 0.5);
      this.distortion.distortion = drive;
      this.distortion.wet.rampTo(0.95, 0.04);
    } else {
      this.distortion.distortion = this.params.drive;
      this.distortion.wet.rampTo(0.75, 0.04);
    }
  }

  public strumChord(notes: string[], direction: 'down' | 'up' = 'down', velocity = 0.85): void {
    if (!this.synth) this.init();
    if (!this.synth) return;

    const orderedNotes = direction === 'down' ? [...notes] : [...notes].reverse();
    const stringDelay = 0.022;

    orderedNotes.forEach((note, index) => {
      const time = Tone.now() + index * stringDelay;
      const vel = Math.min(1.0, velocity * (0.85 + Math.random() * 0.2));
      this.synth?.triggerAttackRelease(note, '2n', time, vel);
    });
  }

  public playLeadNote(note: string, velocity = 0.9, duration = '4n'): void {
    if (!this.synth) this.init();
    if (!this.synth) return;

    this.synth.triggerAttackRelease(note, duration, Tone.now(), velocity);
  }

  public stopAll(): void {
    if (this.synth) {
      try {
        this.synth.releaseAll();
      } catch {
        // safe ignore
      }
    }
  }

  public applyPreset(preset: GuitarPreset): void {
    this.params.preset = preset;
    if (!this.distortion || !this.toneFilter || !this.synth) return;

    switch (preset) {
      case 'clean_strat':
        this.distortion.distortion = 0.05;
        this.distortion.wet.value = 0.1;
        this.toneFilter.high.value = 4;
        this.toneFilter.mid.value = -1;
        this.toneFilter.low.value = 1;
        this.synth.set({ oscillator: { type: 'triangle8' } });
        break;

      case 'crunch_overdrive':
        this.distortion.distortion = 0.55;
        this.distortion.wet.value = 0.8;
        this.toneFilter.high.value = 2;
        this.toneFilter.mid.value = 4;
        this.toneFilter.low.value = 3;
        this.synth.set({ oscillator: { type: 'sawtooth8' } });
        break;

      case 'heavy_lead':
        this.distortion.distortion = 0.92;
        this.distortion.wet.value = 1.0;
        this.toneFilter.high.value = 3;
        this.toneFilter.mid.value = 6;
        this.toneFilter.low.value = 4;
        this.synth.set({ oscillator: { type: 'sawtooth16' } });
        break;

      case 'acoustic_sim':
        this.distortion.distortion = 0.0;
        this.distortion.wet.value = 0.0;
        this.toneFilter.high.value = 5;
        this.toneFilter.mid.value = -3;
        this.toneFilter.low.value = 2;
        this.synth.set({ oscillator: { type: 'sine' } });
        break;
    }
  }

  public setGestureDriveTone(normalizedX: number, normalizedY: number): void {
    if (this.distortion) {
      const drive = Math.max(0.05, Math.min(0.98, normalizedX));
      this.distortion.distortion = drive;
      this.params.drive = drive;
    }
    if (this.cabinetFilter) {
      const cutoff = 1500 + normalizedY * 5000;
      this.cabinetFilter.frequency.rampTo(cutoff, 0.04);
    }
  }

  public setFX(delayWet: number, reverbWet: number): void {
    this.params.delay = delayWet;
    this.params.reverb = reverbWet;
    if (this.delay) this.delay.wet.rampTo(delayWet, 0.05);
    if (this.reverb) this.reverb.wet.rampTo(reverbWet, 0.05);
  }
}

export const guitarEngine = new GuitarEngine();
