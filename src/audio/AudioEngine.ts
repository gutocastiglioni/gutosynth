/**
 * Master Audio Engine
 * Coordinates Web Audio Context, Tone.js Routing, Master FX & Analyser
 */

import * as Tone from 'tone';
import { InstrumentId } from '../types/audio';

class MasterAudioEngine {
  private isInitialized = false;
  private masterGain: Tone.Gain | null = null;
  private masterLimiter: Tone.Limiter | null = null;
  private masterCompressor: Tone.Compressor | null = null;
  private fftAnalyser: Tone.Analyser | null = null;
  private waveformAnalyser: Tone.Analyser | null = null;
  
  // Per-instrument channel strips
  private channelStrips: Map<InstrumentId, Tone.Channel> = new Map();

  /**
   * Initializes the Tone.js Audio Context upon first user interaction
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await Tone.start();
      
      // Master Chain Setup
      this.masterGain = new Tone.Gain(0.9);
      this.masterLimiter = new Tone.Limiter(-0.5);
      this.masterCompressor = new Tone.Compressor({
        threshold: -18,
        ratio: 4,
        attack: 0.003,
        release: 0.25
      });

      // 60FPS Visualizer Analysers
      this.fftAnalyser = new Tone.Analyser('fft', 128);
      this.waveformAnalyser = new Tone.Analyser('waveform', 256);

      // Connect Master Chain
      this.masterGain.chain(
        this.masterCompressor,
        this.masterLimiter,
        this.fftAnalyser,
        this.waveformAnalyser,
        Tone.Destination
      );

      // Initialize individual instrument channels
      const instrumentIds: InstrumentId[] = ['synth', 'guitar', 'bass', 'drums', 'mic'];
      instrumentIds.forEach((id) => {
        const channel = new Tone.Channel({
          volume: 0,
          pan: 0,
          mute: false,
          solo: false
        });
        if (this.masterGain) {
          channel.connect(this.masterGain);
        }
        this.channelStrips.set(id, channel);
      });

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
      return false;
    }
  }

  /**
   * Returns true if audio context is running
   */
  public get initialized(): boolean {
    return this.isInitialized && Tone.context.state === 'running';
  }

  /**
   * Returns the channel node for a given instrument
   */
  public getChannel(instrumentId: InstrumentId): Tone.Channel | undefined {
    return this.channelStrips.get(instrumentId);
  }

  /**
   * Updates volume for an instrument channel (in dB, -60 to +6)
   */
  public setInstrumentVolume(instrumentId: InstrumentId, volumeDb: number): void {
    const channel = this.channelStrips.get(instrumentId);
    if (channel) {
      channel.volume.rampTo(volumeDb, 0.05);
    }
  }

  /**
   * Updates pan for an instrument channel (-1.0 left to +1.0 right)
   */
  public setInstrumentPan(instrumentId: InstrumentId, pan: number): void {
    const channel = this.channelStrips.get(instrumentId);
    if (channel) {
      channel.pan.rampTo(pan, 0.05);
    }
  }

  /**
   * Toggles mute on an instrument channel
   */
  public setInstrumentMute(instrumentId: InstrumentId, muted: boolean): void {
    const channel = this.channelStrips.get(instrumentId);
    if (channel) {
      channel.mute = muted;
    }
  }

  /**
   * Toggles solo on an instrument channel
   */
  public setInstrumentSolo(instrumentId: InstrumentId, solo: boolean): void {
    const channel = this.channelStrips.get(instrumentId);
    if (channel) {
      channel.solo = solo;
    }
  }

  /**
   * Sets the global master volume (0.0 to 1.0)
   */
  public setMasterVolume(gainNormalized: number): void {
    if (this.masterGain) {
      const db = gainNormalized <= 0.001 ? -Infinity : Tone.gainToDb(gainNormalized);
      this.masterGain.gain.rampTo(gainNormalized, 0.05);
    }
  }

  /**
   * Retrieves live FFT frequency spectrum data for visualization
   */
  public getFrequencyData(): Float32Array {
    if (!this.fftAnalyser) return new Float32Array(128);
    return this.fftAnalyser.getValue() as Float32Array;
  }

  /**
   * Retrieves live oscilloscope waveform data for visualization
   */
  public getWaveformData(): Float32Array {
    if (!this.waveformAnalyser) return new Float32Array(256);
    return this.waveformAnalyser.getValue() as Float32Array;
  }

  /**
   * Returns current Tone context raw AudioContext for node linking
   */
  public get rawContext(): AudioContext {
    return Tone.context.rawContext as AudioContext;
  }
}

export const audioEngine = new MasterAudioEngine();
