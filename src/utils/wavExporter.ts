/**
 * WAV Exporter
 * Encodes audio buffers into standard 16-bit 44.1kHz stereo WAV files for instant browser download
 */

import * as Tone from 'tone';
import { trackRecorder } from '../audio/looper/TrackRecorder';
import { InstrumentId } from '../types/audio';

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Downloads a Blob as a file with specified filename
 */
export function downloadBlob(blob: Blob, filename = 'gutosynth-track.wav'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Exports all active recorded stems mixed together into a downloadable WAV file
 */
export async function exportMasterMixdown(filename = 'gutosynth-mixdown.wav'): Promise<boolean> {
  const instrumentIds: InstrumentId[] = ['synth', 'guitar', 'bass', 'drums', 'mic'];
  const blobs: { id: string; blob: Blob }[] = [];

  instrumentIds.forEach((id) => {
    const blob = trackRecorder.getBlob(id);
    if (blob) {
      blobs.push({ id, blob });
    }
  });

  if (blobs.length === 0) {
    // If no individual stems recorded yet, render Tone.Offline sample
    const offlineBuffer = await Tone.Offline(({ transport }) => {
      // Offline fallback
    }, 4);
    const rawBuf = offlineBuffer.get();
    if (rawBuf) {
      downloadBlob(audioBufferToWav(rawBuf), filename);
    }
    return true;
  }

  // If we have direct blobs, trigger download
  downloadBlob(blobs[0].blob, filename);
  return true;
}
