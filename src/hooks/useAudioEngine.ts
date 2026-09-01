/**
 * Audio Engine Bridge Hook
 * Connects React UI to Tone.js master audio engine and manages instrument states
 * Automatically initializes audio context on first user interaction seamlessly
 */

import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { InstrumentId, TrackState } from '../types/audio';

const INITIAL_TRACKS: TrackState[] = [
  { id: 'synth', name: 'Poly Synth', color: '#00f2fe', volume: 0, pan: 0, muted: false, solo: false, armed: true, hasRecording: false, durationBars: 4 },
  { id: 'guitar', name: 'Electric Guitar', color: '#ff007f', volume: 0, pan: -0.2, muted: false, solo: false, armed: false, hasRecording: false, durationBars: 4 },
  { id: 'bass', name: '808 Bass', color: '#9d4edd', volume: 0, pan: 0, muted: false, solo: false, armed: false, hasRecording: false, durationBars: 4 },
  { id: 'drums', name: 'Drum Kit', color: '#ffb703', volume: 0, pan: 0, muted: false, solo: false, armed: false, hasRecording: false, durationBars: 4 },
  { id: 'mic', name: 'Voice FX', color: '#06d6a0', volume: 0, pan: 0.2, muted: false, solo: false, armed: false, hasRecording: false, durationBars: 4 }
];

export function useAudioEngine() {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [activeInstrument, setActiveInstrument] = useState<InstrumentId>('synth');
  const [tracks, setTracks] = useState<TrackState[]>(INITIAL_TRACKS);
  const [masterVolume, setMasterVolumeState] = useState(0.85);

  const initAudio = useCallback(async () => {
    const success = await audioEngine.init();
    if (success) {
      setIsAudioReady(true);
    }
    return success;
  }, []);

  // Automatically start AudioContext on the very first user interaction transparently
  useEffect(() => {
    const handleFirstInteraction = async () => {
      const ok = await audioEngine.init();
      if (ok) {
        setIsAudioReady(true);
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('click', handleFirstInteraction, { once: true });

    // Try starting immediately
    handleFirstInteraction();

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const updateTrackVolume = useCallback((id: InstrumentId, volumeDb: number) => {
    audioEngine.setInstrumentVolume(id, volumeDb);
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, volume: volumeDb } : t)));
  }, []);

  const updateTrackPan = useCallback((id: InstrumentId, pan: number) => {
    audioEngine.setInstrumentPan(id, pan);
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, pan } : t)));
  }, []);

  const toggleTrackMute = useCallback((id: InstrumentId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextMuted = !t.muted;
          audioEngine.setInstrumentMute(id, nextMuted);
          return { ...t, muted: nextMuted };
        }
        return t;
      })
    );
  }, []);

  const toggleTrackSolo = useCallback((id: InstrumentId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextSolo = !t.solo;
          audioEngine.setInstrumentSolo(id, nextSolo);
          return { ...t, solo: nextSolo };
        }
        return t;
      })
    );
  }, []);

  const armTrack = useCallback((id: InstrumentId) => {
    setTracks((prev) => prev.map((t) => ({ ...t, armed: t.id === id })));
    setActiveInstrument(id);
  }, []);

  const setMasterVol = useCallback((gain: number) => {
    audioEngine.setMasterVolume(gain);
    setMasterVolumeState(gain);
  }, []);

  return {
    isAudioReady,
    initAudio,
    activeInstrument,
    setActiveInstrument,
    tracks,
    setTracks,
    masterVolume,
    setMasterVolume: setMasterVol,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    armTrack
  };
}
