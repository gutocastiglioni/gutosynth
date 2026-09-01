/**
 * Track Recorder
 * Captures live audio stems for individual instrument tracks into memory buffers
 */

import * as Tone from 'tone';
import { audioEngine } from '../AudioEngine';
import { InstrumentId } from '../../types/audio';

export class TrackRecorder {
  private recorders: Map<InstrumentId, Tone.Recorder> = new Map();
  private recordedBlobs: Map<InstrumentId, Blob> = new Map();
  private recordedUrls: Map<InstrumentId, string> = new Map();
  private players: Map<InstrumentId, Tone.Player> = new Map();

  /**
   * Prepares a recorder for a specific instrument
   */
  public initRecorder(instrumentId: InstrumentId): Tone.Recorder {
    let recorder = this.recorders.get(instrumentId);
    if (!recorder) {
      recorder = new Tone.Recorder();
      const channel = audioEngine.getChannel(instrumentId);
      if (channel) {
        channel.connect(recorder);
      }
      this.recorders.set(instrumentId, recorder);
    }
    return recorder;
  }

  /**
   * Starts recording on the armed track
   */
  public startRecording(instrumentId: InstrumentId): void {
    const recorder = this.initRecorder(instrumentId);
    if (recorder.state !== 'started') {
      recorder.start();
    }
  }

  /**
   * Stops recording on the armed track and creates an audio buffer player
   */
  public async stopRecording(instrumentId: InstrumentId): Promise<string | null> {
    const recorder = this.recorders.get(instrumentId);
    if (!recorder || recorder.state !== 'started') return null;

    try {
      const blob = await recorder.stop();
      this.recordedBlobs.set(instrumentId, blob);
      
      const prevUrl = this.recordedUrls.get(instrumentId);
      if (prevUrl) URL.revokeObjectURL(prevUrl);

      const url = URL.createObjectURL(blob);
      this.recordedUrls.set(instrumentId, url);

      // Create looping player
      const channel = audioEngine.getChannel(instrumentId);
      const player = new Tone.Player({
        url,
        loop: true,
        autostart: false
      });

      if (channel) {
        player.connect(channel);
      }

      this.players.set(instrumentId, player);
      return url;
    } catch (err) {
      console.error(`Failed to stop recording for ${instrumentId}:`, err);
      return null;
    }
  }

  /**
   * Plays recorded loop buffer for an instrument
   */
  public playTrack(instrumentId: InstrumentId, time?: number): void {
    const player = this.players.get(instrumentId);
    if (player && player.loaded && player.state !== 'started') {
      player.start(time);
    }
  }

  /**
   * Stops recorded loop playback for an instrument
   */
  public stopTrack(instrumentId: InstrumentId): void {
    const player = this.players.get(instrumentId);
    if (player && player.state === 'started') {
      player.stop();
    }
  }

  /**
   * Clears recorded loop for an instrument
   */
  public clearTrack(instrumentId: InstrumentId): void {
    this.stopTrack(instrumentId);
    const player = this.players.get(instrumentId);
    if (player) {
      player.dispose();
      this.players.delete(instrumentId);
    }
    const url = this.recordedUrls.get(instrumentId);
    if (url) {
      URL.revokeObjectURL(url);
      this.recordedUrls.delete(instrumentId);
    }
    this.recordedBlobs.delete(instrumentId);
  }

  /**
   * Gets the recorded blob for export
   */
  public getBlob(instrumentId: InstrumentId): Blob | undefined {
    return this.recordedBlobs.get(instrumentId);
  }

  /**
   * Checks if an instrument has a valid recorded track buffer
   */
  public hasTrack(instrumentId: InstrumentId): boolean {
    return this.players.has(instrumentId) && !!this.recordedBlobs.get(instrumentId);
  }
}

export const trackRecorder = new TrackRecorder();
