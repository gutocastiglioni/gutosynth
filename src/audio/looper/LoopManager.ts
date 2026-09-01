/**
 * Master Loop Manager & Transport Clock
 * Synchronizes BPM, 16-step sequencer ticks, metronome clicks, and quantized loop recording
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { drumEngine } from '../instruments/DrumEngine';
import { trackRecorder } from './TrackRecorder';
import { InstrumentId, LooperState } from '../../types/audio';

export type StepCallback = (step: number, bar: number) => void;

export class LoopManager {
  private repeatEventId: number | null = null;
  private metronomeSynth: Tone.Synth | null = null;
  private stepListeners: Set<StepCallback> = new Set();
  private armedTrack: InstrumentId = 'synth';
  private recordStartBar = 0;

  public state: LooperState = {
    bpm: 120,
    isPlaying: false,
    isRecording: false,
    currentBar: 0,
    currentStep: 0,
    loopBars: 4,
    metronome: false,
    masterVolume: 0.85
  };

  /**
   * Initializes Transport clock and metronome sound
   */
  public init(): void {
    if (this.metronomeSynth) return;

    this.metronomeSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }
    }).toDestination();
    this.metronomeSynth.volume.value = -12;

    Tone.Transport.bpm.value = this.state.bpm;

    // Schedule 16th note subdivisions (16 steps per bar)
    this.repeatEventId = Tone.Transport.scheduleRepeat((time) => {
      const totalSteps = Math.floor(Tone.Transport.ticks / (Tone.Transport.PPQ / 4));
      const stepIndex = totalSteps % 16;
      const barIndex = Math.floor(totalSteps / 16) % this.state.loopBars;

      this.state.currentStep = stepIndex;
      this.state.currentBar = barIndex;

      // Play drum sequencer step
      drumEngine.playStep(stepIndex);

      // Metronome clicks on quarter notes (steps 0, 4, 8, 12)
      if (this.state.metronome && stepIndex % 4 === 0) {
        const isDownbeat = stepIndex === 0 && barIndex === 0;
        this.metronomeSynth?.triggerAttackRelease(isDownbeat ? 'C6' : 'G5', '32n', time, isDownbeat ? 1.0 : 0.6);
      }

      // Check quantized loop recording boundary
      if (this.state.isRecording) {
        if (stepIndex === 0 && barIndex === 0 && totalSteps > 0) {
          // Reached full loop cycle, finish recording
          this.stopRecordingLoop();
        }
      }

      // Notify UI listeners
      this.stepListeners.forEach((cb) => cb(stepIndex, barIndex));
    }, '16n');
  }

  /**
   * Starts master playback
   */
  public async play(): Promise<void> {
    await audioEngine.init();
    this.init();

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
      this.state.isPlaying = true;

      // Start all recorded stems
      const instrumentIds: InstrumentId[] = ['synth', 'guitar', 'bass', 'drums', 'mic'];
      instrumentIds.forEach((id) => {
        if (trackRecorder.hasTrack(id)) {
          trackRecorder.playTrack(id);
        }
      });
    }
  }

  /**
   * Pauses master playback
   */
  public pause(): void {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      this.state.isPlaying = false;

      const instrumentIds: InstrumentId[] = ['synth', 'guitar', 'bass', 'drums', 'mic'];
      instrumentIds.forEach((id) => trackRecorder.stopTrack(id));
    }
  }

  /**
   * Stops playback and resets playhead to zero
   */
  public stop(): void {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.state.isPlaying = false;
    this.state.currentBar = 0;
    this.state.currentStep = 0;

    const instrumentIds: InstrumentId[] = ['synth', 'guitar', 'bass', 'drums', 'mic'];
    instrumentIds.forEach((id) => trackRecorder.stopTrack(id));

    this.stepListeners.forEach((cb) => cb(0, 0));
  }

  /**
   * Toggles recording on the currently armed track
   */
  public async toggleRecord(armedTrack: InstrumentId): Promise<boolean> {
    this.armedTrack = armedTrack;

    if (this.state.isRecording) {
      await this.stopRecordingLoop();
      return false;
    } else {
      if (!this.state.isPlaying) {
        await this.play();
      }
      this.state.isRecording = true;
      trackRecorder.startRecording(this.armedTrack);
      return true;
    }
  }

  /**
   * Stops active loop recording and binds track playback
   */
  private async stopRecordingLoop(): Promise<void> {
    if (!this.state.isRecording) return;
    this.state.isRecording = false;
    await trackRecorder.stopRecording(this.armedTrack);
    trackRecorder.playTrack(this.armedTrack);
  }

  /**
   * Sets tempo in BPM (40 to 240)
   */
  public setBpm(bpm: number): void {
    const clamped = Math.max(40, Math.min(240, bpm));
    this.state.bpm = clamped;
    Tone.Transport.bpm.value = clamped;
  }

  /**
   * Sets loop duration in bars (1, 2, 4, 8)
   */
  public setLoopBars(bars: 1 | 2 | 4 | 8): void {
    this.state.loopBars = bars;
  }

  /**
   * Toggles metronome click
   */
  public toggleMetronome(): boolean {
    this.state.metronome = !this.state.metronome;
    return this.state.metronome;
  }

  /**
   * Adds a step tick listener for UI components
   */
  public addStepListener(callback: StepCallback): () => void {
    this.stepListeners.add(callback);
    return () => this.stepListeners.delete(callback);
  }
}

export const loopManager = new LoopManager();
