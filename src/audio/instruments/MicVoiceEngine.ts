/**
 * Microphone & Voice FX Engine (Vocal Transformer)
 * Live mic capture with real-time gesture-controlled pitch shifting, robot ring mod, delay, reverb & bitcrush distortion
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { MicVoiceParams } from '../../types/audio';

export class MicVoiceEngine {
  private micNode: Tone.UserMedia | null = null;
  private inputGain: Tone.Gain | null = null;
  private pitchShifter: Tone.PitchShift | null = null;
  private distortion: Tone.Distortion | null = null;
  private bitcrusher: Tone.BitCrusher | null = null;
  private filter: Tone.Filter | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private isLive = false;

  public params: MicVoiceParams = {
    active: false,
    gain: 1.0,
    pitchShift: 0,
    robotRingMod: false,
    distortion: 0.15,
    delayTime: 0.25,
    delayFeedback: 0.35,
    reverbMix: 0.3,
    gestureLinked: true
  };

  /**
   * Initializes the microphone FX processing chain
   */
  public async init(): Promise<boolean> {
    if (this.micNode) return true;
    const channel = audioEngine.getChannel('mic');
    if (!channel) return false;

    try {
      this.micNode = new Tone.UserMedia();
      this.inputGain = new Tone.Gain(this.params.gain);

      this.pitchShifter = new Tone.PitchShift({
        pitch: this.params.pitchShift,
        windowSize: 0.08,
        delayTime: 0,
        feedback: 0
      });

      this.distortion = new Tone.Distortion({
        distortion: this.params.distortion,
        wet: 0.3
      });

      this.bitcrusher = new Tone.BitCrusher(8);
      this.bitcrusher.wet.value = 0.0;

      this.filter = new Tone.Filter({
        frequency: 4500,
        type: 'lowpass',
        rolloff: -12
      });

      this.delay = new Tone.FeedbackDelay({
        delayTime: this.params.delayTime,
        feedback: this.params.delayFeedback,
        wet: 0.3
      });

      this.reverb = new Tone.Reverb({
        decay: 3.5,
        preDelay: 0.01,
        wet: this.params.reverbMix
      });

      // Chain microphone through DSP modules to master mic channel
      this.micNode.chain(
        this.inputGain,
        this.pitchShifter,
        this.distortion,
        this.bitcrusher,
        this.filter,
        this.delay,
        this.reverb,
        channel
      );

      return true;
    } catch (err) {
      console.error('Failed to initialize MicVoiceEngine chain:', err);
      return false;
    }
  }

  /**
   * Starts capturing real-time audio from user's microphone
   */
  public async startMicrophone(): Promise<boolean> {
    await this.init();
    if (!this.micNode) return false;

    try {
      await this.micNode.open();
      this.isLive = true;
      this.params.active = true;
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or device not found:', err);
      this.isLive = false;
      this.params.active = false;
      return false;
    }
  }

  /**
   * Stops microphone capture
   */
  public stopMicrophone(): void {
    if (this.micNode && this.isLive) {
      this.micNode.close();
      this.isLive = false;
      this.params.active = false;
    }
  }

  /**
   * Toggles microphone active state
   */
  public async toggleMicrophone(): Promise<boolean> {
    if (this.isLive) {
      this.stopMicrophone();
      return false;
    } else {
      return await this.startMicrophone();
    }
  }

  /**
   * Sets pitch shift in semitones (-12 to +12)
   */
  public setPitchShift(semitones: number): void {
    this.params.pitchShift = semitones;
    if (this.pitchShifter) {
      this.pitchShifter.pitch = semitones;
    }
  }

  /**
   * Toggles Robot Voice / Bitcrusher Ring-Mod effect
   */
  public setRobotMode(enabled: boolean): void {
    this.params.robotRingMod = enabled;
    if (this.bitcrusher && this.distortion) {
      this.bitcrusher.wet.value = enabled ? 0.75 : 0.0;
      this.distortion.wet.value = enabled ? 0.8 : 0.2;
    }
  }

  /**
   * Sets live FX parameters
   */
  public setFX(distortion: number, delayTime: number, delayFeedback: number, reverbMix: number): void {
    this.params.distortion = distortion;
    this.params.delayTime = delayTime;
    this.params.delayFeedback = delayFeedback;
    this.params.reverbMix = reverbMix;

    if (this.distortion) this.distortion.distortion = distortion;
    if (this.delay) {
      this.delay.delayTime.rampTo(delayTime, 0.05);
      this.delay.feedback.rampTo(delayFeedback, 0.05);
    }
    if (this.reverb) this.reverb.wet.rampTo(reverbMix, 0.05);
  }

  /**
   * Modulates Voice effects via real-time hand gestures
   */
  public setGestureVoiceModulation(normalizedX: number, normalizedY: number): void {
    if (!this.params.gestureLinked || !this.isLive) return;

    // Pitch shift mapped from Y (bottom = -12st, center = 0st, top = +12st)
    const semitones = Math.round((normalizedY - 0.5) * 24);
    this.setPitchShift(semitones);

    // Filter Cutoff mapped from X (left = dark, right = bright/open)
    if (this.filter) {
      const freq = 400 + normalizedX * 8000;
      this.filter.frequency.rampTo(freq, 0.04);
    }

    // Delay Feedback mapped from X
    if (this.delay) {
      const feedback = 0.1 + normalizedX * 0.65;
      this.delay.feedback.rampTo(feedback, 0.05);
    }
  }

  public get isActive(): boolean {
    return this.isLive;
  }
}

export const micVoiceEngine = new MicVoiceEngine();
