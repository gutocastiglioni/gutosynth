/**
 * Looper Transport & Clock Hook
 * Coordinates master BPM, playhead step tracking, bar looping, and quantized recording
 */

import { useState, useEffect, useCallback } from 'react';
import { loopManager } from '../audio/looper/LoopManager';
import { trackRecorder } from '../audio/looper/TrackRecorder';
import { InstrumentId, LooperState } from '../types/audio';

export function useLooper(armedTrack: InstrumentId = 'synth') {
  const [looperState, setLooperState] = useState<LooperState>({ ...loopManager.state });
  const [currentStep, setCurrentStep] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);

  useEffect(() => {
    const unsub = loopManager.addStepListener((step, bar) => {
      setCurrentStep(step);
      setCurrentBar(bar);
      setLooperState({ ...loopManager.state });
    });
    return () => unsub();
  }, []);

  const play = useCallback(async () => {
    await loopManager.play();
    setLooperState({ ...loopManager.state });
  }, []);

  const pause = useCallback(() => {
    loopManager.pause();
    setLooperState({ ...loopManager.state });
  }, []);

  const stop = useCallback(() => {
    loopManager.stop();
    setCurrentStep(0);
    setCurrentBar(0);
    setLooperState({ ...loopManager.state });
  }, []);

  const toggleRecord = useCallback(async () => {
    await loopManager.toggleRecord(armedTrack);
    setLooperState({ ...loopManager.state });
  }, [armedTrack]);

  const setBpm = useCallback((bpm: number) => {
    loopManager.setBpm(bpm);
    setLooperState({ ...loopManager.state });
  }, []);

  const setLoopBars = useCallback((bars: 1 | 2 | 4 | 8) => {
    loopManager.setLoopBars(bars);
    setLooperState({ ...loopManager.state });
  }, []);

  const toggleMetronome = useCallback(() => {
    const next = loopManager.toggleMetronome();
    setLooperState((prev) => ({ ...prev, metronome: next }));
  }, []);

  const clearTrackRecording = useCallback((id: InstrumentId) => {
    trackRecorder.clearTrack(id);
  }, []);

  return {
    looperState,
    currentStep,
    currentBar,
    play,
    pause,
    stop,
    toggleRecord,
    setBpm,
    setLoopBars,
    toggleMetronome,
    clearTrackRecording
  };
}
