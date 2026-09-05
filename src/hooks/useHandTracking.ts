/**
 * ============================================================================
 * HAND TRACKING & TOUCHLESS SPATIAL AUDIO DISPATCHER HOOK
 * ============================================================================
 * Strict Zero-Sound Enforcement:
 * - 0 Active Extended Fingers & No Pinch = ZERO SOUNDS (0ms instant mute).
 * - Sounds ONLY play when extended fingers or genuine pinches are active.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { handTracker } from '../vision/HandTracker';
import { gestureVisualizer } from '../vision/GestureVisualizer';
import { drumKinematics } from '../vision/DrumKinematics';
import { audioEngine } from '../audio/AudioEngine';
import { polySynthEngine, FingerId } from '../audio/instruments/PolySynthEngine';
import { guitarEngine } from '../audio/instruments/GuitarEngine';
import { bassEngine } from '../audio/instruments/BassEngine';
import { drumEngine } from '../audio/instruments/DrumEngine';
import { micVoiceEngine } from '../audio/instruments/MicVoiceEngine';
import { quantizeCoordinateToNote, getChordVoicing, getLeadNoteForHand, getScaleNotes } from '../audio/scales';
import { dispatchLeadSound, dispatchChordSound, releaseAllInstrumentSounds } from '../audio/GestureAudioDispatcher';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../types/gesture';
import { InstrumentId, ScaleName, TriggerSettings } from '../types/audio';

export function useHandTracking(
  activeInstrument: InstrumentId,
  scale: ScaleName = 'minor',
  rootNote = 'C',
  isAudioReady = false,
  triggerSettings?: TriggerSettings,
  bpm = 120
) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hudMode, setHudMode] = useState<HUDVisualMode>('cyber');
  const [leftHand, setLeftHand] = useState<ProcessedHand | null>(null);
  const [rightHand, setRightHand] = useState<ProcessedHand | null>(null);
  const [telemetry, setTelemetry] = useState<GestureTelemetry>({
    activeHandsCount: 0,
    leftHand: null,
    rightHand: null,
    primaryParameter: 'DIR: AGUARDANDO',
    secondaryParameter: 'ESQ: AGUARDANDO',
    detectedChord: null,
    detectedNote: null,
    cutoffHz: 3600,
    expressionValue: 0.5,
    fps: 60
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastActiveNoteRef = useRef<string | null>(null);
  const lastChordKeyRef = useRef<string | null>(null);
  const wasActiveRef = useRef({ left: false, right: false });

  // Finger lift and repeat tracking refs
  const prevRightFingersRef = useRef({
    thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0, isPinching: false
  });
  const prevLeftFingersRef = useRef({
    thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0, isPinching: false
  });
  const lastRightTriggerTimeRef = useRef(0);
  const lastLeftTriggerTimeRef = useRef(0);

  // Presence & throttle refs to decouple high-speed 60fps tracking from React render cycle
  const prevLeftPresenceRef = useRef(false);
  const prevRightPresenceRef = useRef(false);
  const prevActiveCountRef = useRef(0);
  const prevPrimaryTextRef = useRef('');
  const prevSecondaryTextRef = useRef('');
  const lastTelemetryTimeRef = useRef(0);

  const triggerSettingsRef = useRef(triggerSettings);
  useEffect(() => {
    triggerSettingsRef.current = triggerSettings;
  }, [triggerSettings]);

  // Cleanly stop audio on trigger mode switch
  const prevModeRef = useRef(triggerSettings?.mode);
  useEffect(() => {
    if (triggerSettings && prevModeRef.current !== triggerSettings.mode) {
      polySynthEngine.releaseAll();
      guitarEngine.stopAll();
      bassEngine.triggerRelease();
      lastActiveNoteRef.current = null;
      lastChordKeyRef.current = null;
      wasActiveRef.current = { left: false, right: false };
      prevModeRef.current = triggerSettings.mode;
    }
  }, [triggerSettings?.mode]);

  const smoothYRef = useRef<Record<FingerId, number>>({
    thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5
  });



  // Strict Mode Isolation: Cleanly reset audio & tracking states when active instrument changes
  const prevInstrumentRef = useRef<InstrumentId>(activeInstrument);
  useEffect(() => {
    if (prevInstrumentRef.current !== activeInstrument) {
      polySynthEngine.releaseAll();
      guitarEngine.stopAll();
      bassEngine.triggerRelease();
      lastActiveNoteRef.current = null;
      lastChordKeyRef.current = null;
      wasActiveRef.current = { left: false, right: false };
      drumKinematics.reset();
      prevInstrumentRef.current = activeInstrument;
    }
  }, [activeInstrument]);

  const toggleCamera = useCallback(async () => {
    if (isCameraActive) {
      handTracker.stop();
      setIsCameraActive(false);
      prevLeftPresenceRef.current = false;
      prevRightPresenceRef.current = false;
      prevActiveCountRef.current = 0;
      setLeftHand(null);
      setRightHand(null);
      setTelemetry((prev) => ({
        ...prev,
        activeHandsCount: 0,
        leftHand: null,
        rightHand: null,
        primaryParameter: 'DIR: AGUARDANDO',
        secondaryParameter: 'ESQ: AGUARDANDO'
      }));
      polySynthEngine.releaseAll();
      guitarEngine.stopAll();
      bassEngine.triggerRelease();
    } else {
      await audioEngine.init();
      polySynthEngine.init();
      guitarEngine.init();
      bassEngine.init();
      drumEngine.init();
      polySynthEngine.releaseAll();
      guitarEngine.stopAll();
      bassEngine.triggerRelease();
      if (videoRef.current) {
        const initialized = await handTracker.init(videoRef.current);
        if (initialized) {
          const started = await handTracker.start();
          setIsCameraActive(started);
        }
      }
    }
  }, [isCameraActive]);

  const handleHandUpdate = useCallback(
    (left: ProcessedHand | null, right: ProcessedHand | null) => {
      // Fast presence check: Only trigger state update when hands enter or leave view
      const leftPresent = Boolean(left);
      const rightPresent = Boolean(right);
      if (prevLeftPresenceRef.current !== leftPresent) {
        prevLeftPresenceRef.current = leftPresent;
        setLeftHand(left);
      }
      if (prevRightPresenceRef.current !== rightPresent) {
        prevRightPresenceRef.current = rightPresent;
        setRightHand(right);
      }

      const activeCount = (left ? 1 : 0) + (right ? 1 : 0);
      let detectedNote: string | null = null;
      let detectedChord: string | null = null;
      const now = performance.now();

      if (!isAudioReady && !audioEngine.initialized) {
        if (activeCount !== prevActiveCountRef.current) {
          prevActiveCountRef.current = activeCount;
          setTelemetry((prev) => ({ ...prev, activeHandsCount: activeCount }));
        }
        return;
      }

      // Count active extended fingers and pinches strictly
      const numActiveFingersRight = right
        ? (right.indexExtended ? 1 : 0) +
          (right.middleExtended ? 1 : 0) +
          (right.ringExtended ? 1 : 0) +
          (right.pinkyExtended ? 1 : 0) +
          (right.thumbExtended ? 1 : 0)
        : 0;

      const numActiveFingersLeft = left
        ? (left.indexExtended ? 1 : 0) +
          (left.middleExtended ? 1 : 0) +
          (left.ringExtended ? 1 : 0) +
          (left.pinkyExtended ? 1 : 0) +
          (left.thumbExtended ? 1 : 0)
        : 0;

      const hasVisualRight = Boolean(right) && (numActiveFingersRight > 0 || Boolean(right?.isPinching));
      const hasVisualLeft = Boolean(left) && (numActiveFingersLeft > 0 || Boolean(left?.isPinching));

      // =====================================================================
      // 1. AIR-DRUMMING (BALLISTIC KINEMATIC PREDICTOR & RAY-SWEEP)
      // =====================================================================
      if (activeInstrument === 'drums') {
        const drumResult = drumKinematics.process(left, right, now);
        if (drumResult.hitNote) {
          detectedNote = drumResult.hitNote;
        }
      }

      // =====================================================================
      // 2. RIGHT HAND (MELODY / EXPRESSION)
      // =====================================================================
      const curFingersRight = {
        thumb: Boolean(right?.thumbExtended),
        index: Boolean(right?.indexExtended),
        middle: Boolean(right?.middleExtended),
        ring: Boolean(right?.ringExtended),
        pinky: Boolean(right?.pinkyExtended),
        count: numActiveFingersRight,
        isPinching: Boolean(right?.isPinching)
      };
      const prevFingersRight = prevRightFingersRef.current;
      const fingerLiftedRight =
        (!prevFingersRight.thumb && curFingersRight.thumb) ||
        (!prevFingersRight.index && curFingersRight.index) ||
        (!prevFingersRight.middle && curFingersRight.middle) ||
        (!prevFingersRight.ring && curFingersRight.ring) ||
        (!prevFingersRight.pinky && curFingersRight.pinky) ||
        (!prevFingersRight.isPinching && curFingersRight.isPinching) ||
        (curFingersRight.count > prevFingersRight.count);
      prevRightFingersRef.current = curFingersRight;

      const triggerMode = triggerSettingsRef.current?.mode || 'continuous';
      const speedHz = Math.max(0.5, triggerSettingsRef.current?.speedHz || 8);
      const repeatIntervalMs = 1000 / speedHz;
      const gateDuration = triggerSettingsRef.current?.gateTime || 0.2;

      if (activeInstrument !== 'drums') {
        if (!hasVisualRight) {
          // Zero sons imediato na mão direita quando fechada ou ausente
          polySynthEngine.releaseLead();
          guitarEngine.stopAll();
          if (!hasVisualLeft) {
            bassEngine.triggerRelease();
          }
          lastActiveNoteRef.current = null;
          wasActiveRef.current.right = false;
          prevRightFingersRef.current = {
            thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0, isPinching: false
          };
          detectedNote = right ? 'MUTED (FECHADA)' : null;
        } else if (right) {
          const maxActiveHeight = Math.max(0.01, Math.min(1.0, right.normalizedY));
          const leadNote = getLeadNoteForHand(maxActiveHeight, rootNote, scale, {
            thumb: right.thumbExtended,
            index: right.indexExtended,
            middle: right.middleExtended,
            ring: right.ringExtended,
            pinky: right.pinkyExtended
          }, 3);

          const noteChangedRight = lastActiveNoteRef.current !== leadNote;

          if (triggerMode === 'continuous') {
            dispatchLeadSound(activeInstrument, leadNote, 'continuous', gateDuration, right.normalizedX, maxActiveHeight, noteChangedRight);
            lastActiveNoteRef.current = leadNote;
            wasActiveRef.current.right = true;
            detectedNote = leadNote;
          } else if (triggerMode === 'single') {
            // Modo Nota Única: levantar os dedos marca uma nota (sem som contínuo)
            const shouldTrigger = fingerLiftedRight || noteChangedRight || !wasActiveRef.current.right;
            if (shouldTrigger) {
              dispatchLeadSound(activeInstrument, leadNote, 'single', gateDuration, right.normalizedX, maxActiveHeight, noteChangedRight);
              lastActiveNoteRef.current = leadNote;
              wasActiveRef.current.right = true;
            }
            detectedNote = `${leadNote} [1-SHOT]`;
          } else if (triggerMode === 'repeat') {
            // Modo Repetição: repete as notas na velocidade controlada
            const timeSinceLast = now - lastRightTriggerTimeRef.current;
            const isIntervalDue = timeSinceLast >= repeatIntervalMs;
            const shouldTrigger = fingerLiftedRight || noteChangedRight || isIntervalDue || !wasActiveRef.current.right;
            if (shouldTrigger) {
              const clampedGate = Math.min(gateDuration, (repeatIntervalMs / 1000) * 0.85);
              dispatchLeadSound(activeInstrument, leadNote, 'repeat', clampedGate, right.normalizedX, maxActiveHeight, noteChangedRight);
              lastRightTriggerTimeRef.current = now;
              lastActiveNoteRef.current = leadNote;
              wasActiveRef.current.right = true;
            }
            detectedNote = `${leadNote} [${triggerSettingsRef.current?.subdivision || 'REP'}]`;
          }
        }
      }

      // =====================================================================
      // 3. LEFT HAND (CHORDS / HARMONY)
      // =====================================================================
      const curFingersLeft = {
        thumb: Boolean(left?.thumbExtended),
        index: Boolean(left?.indexExtended),
        middle: Boolean(left?.middleExtended),
        ring: Boolean(left?.ringExtended),
        pinky: Boolean(left?.pinkyExtended),
        count: numActiveFingersLeft,
        isPinching: Boolean(left?.isPinching)
      };
      const prevFingersLeft = prevLeftFingersRef.current;
      const fingerLiftedLeft =
        (!prevFingersLeft.thumb && curFingersLeft.thumb) ||
        (!prevFingersLeft.index && curFingersLeft.index) ||
        (!prevFingersLeft.middle && curFingersLeft.middle) ||
        (!prevFingersLeft.ring && curFingersLeft.ring) ||
        (!prevFingersLeft.pinky && curFingersLeft.pinky) ||
        (!prevFingersLeft.isPinching && curFingersLeft.isPinching) ||
        (curFingersLeft.count > prevFingersLeft.count);
      prevLeftFingersRef.current = curFingersLeft;

      if (activeInstrument !== 'drums') {
        if (!hasVisualLeft) {
          // Zero sons imediato na mão esquerda quando fechada ou ausente
          polySynthEngine.releaseChord();
          guitarEngine.stopAll();
          if (!hasVisualRight) {
            bassEngine.triggerRelease();
          }
          lastChordKeyRef.current = null;
          wasActiveRef.current.left = false;
          prevLeftFingersRef.current = {
            thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0, isPinching: false
          };
          detectedChord = left ? 'MUTED (FECHADA)' : null;
        } else if (left) {
          const chordOctave = left.normalizedY > 0.6 ? 4 : 3;
          const hasSub = Boolean(left.thumbExtended);
          const chordNotes = getChordVoicing(left.chordIndex, rootNote, scale, chordOctave, hasSub);
          const rootLabel = chordNotes[hasSub && chordNotes.length > 4 ? 1 : 0] || chordNotes[0];
          detectedChord = `${rootLabel} (${scale.toUpperCase()})${hasSub ? ' + SUB' : ''}`;

          if (!right || !hasVisualRight) {
            if (activeInstrument === 'synth') {
              polySynthEngine.setGestureModulation(left.normalizedX, left.normalizedY);
            } else if (activeInstrument === 'guitar') {
              guitarEngine.setGestureDriveTone(left.normalizedX, left.normalizedY);
            } else if (activeInstrument === 'bass') {
              bassEngine.setGestureFilter(left.normalizedX, left.normalizedY);
            }
          }

          const chordKey = `${left.chordIndex}_${hasSub}_${chordOctave}_${chordNotes.join('-')}`;
          const chordChanged = lastChordKeyRef.current !== chordKey;
          const bassNotes = activeInstrument === 'bass' ? getScaleNotes(rootNote, scale, 2, 2) : [];
          const rootBassNote = bassNotes[left.chordIndex % Math.max(1, bassNotes.length)] || 'C2';

          if (triggerMode === 'continuous') {
            const isBassChanged = lastChordKeyRef.current !== rootBassNote || !wasActiveRef.current.left;
            const isTrig = activeInstrument === 'bass' ? isBassChanged : (chordChanged || !wasActiveRef.current.left);
            dispatchChordSound(activeInstrument, chordNotes, rootBassNote, 'continuous', gateDuration, isTrig);
            lastChordKeyRef.current = activeInstrument === 'bass' ? rootBassNote : chordKey;
            wasActiveRef.current.left = true;
            detectedChord = activeInstrument === 'bass' ? `BASS ROOT: ${rootBassNote}` : detectedChord;
          } else if (triggerMode === 'single') {
            const shouldTriggerChord = fingerLiftedLeft || chordChanged || !wasActiveRef.current.left;
            if (shouldTriggerChord) {
              dispatchChordSound(activeInstrument, chordNotes, rootBassNote, 'single', gateDuration, true);
              lastChordKeyRef.current = activeInstrument === 'bass' ? rootBassNote : chordKey;
              wasActiveRef.current.left = true;
            }
            detectedChord = activeInstrument === 'bass' ? `BASS: ${rootBassNote} [1-SHOT]` : `${detectedChord} [1-SHOT]`;
          } else if (triggerMode === 'repeat') {
            const timeSinceLast = now - lastLeftTriggerTimeRef.current;
            const isIntervalDue = timeSinceLast >= repeatIntervalMs;
            const shouldTriggerChord = fingerLiftedLeft || chordChanged || isIntervalDue || !wasActiveRef.current.left;
            if (shouldTriggerChord) {
              const clampedGate = Math.min(gateDuration, (repeatIntervalMs / 1000) * 0.85);
              dispatchChordSound(activeInstrument, chordNotes, rootBassNote, 'repeat', clampedGate, true);
              lastChordKeyRef.current = activeInstrument === 'bass' ? rootBassNote : chordKey;
              wasActiveRef.current.left = true;
              lastLeftTriggerTimeRef.current = now;
            }
            detectedChord = activeInstrument === 'bass' ? `BASS: ${rootBassNote} [${triggerSettingsRef.current?.subdivision || 'REP'}]` : `${detectedChord} [${triggerSettingsRef.current?.subdivision || 'REP'}]`;
          }
        }
      }

      // If absolutely no active fingers exist across both hands, guarantee silence
      if (!hasVisualLeft && !hasVisualRight && activeInstrument !== 'drums') {
        releaseAllInstrumentSounds();
      }

      const currentCutoff = Math.round(200 * Math.pow(16000 / 200, right ? (1.0 - right.normalizedY) : 0.5));

      const primaryText = right
        ? `DIR: ${detectedNote || 'MUTED'}${right.isExtrapolated ? ' [MEM]' : ''}`
        : 'DIR: AGUARDANDO';
      const secondaryText = left
        ? `ESQ: ${detectedChord || 'MUTED'}${left.isExtrapolated ? ' [MEM]' : ''}`
        : 'ESQ: AGUARDANDO';

      const shouldUpdateTelemetry =
        activeCount !== prevActiveCountRef.current ||
        primaryText !== prevPrimaryTextRef.current ||
        secondaryText !== prevSecondaryTextRef.current ||
        now - lastTelemetryTimeRef.current > 80;

      if (shouldUpdateTelemetry) {
        prevActiveCountRef.current = activeCount;
        prevPrimaryTextRef.current = primaryText;
        prevSecondaryTextRef.current = secondaryText;
        lastTelemetryTimeRef.current = now;

        setTelemetry({
          activeHandsCount: activeCount,
          leftHand: left,
          rightHand: right,
          primaryParameter: primaryText,
          secondaryParameter: secondaryText,
          detectedChord,
          detectedNote,
          cutoffHz: currentCutoff,
          expressionValue: right ? right.normalizedY : 0.5,
          fps: 60
        });
      }
    },
    [activeInstrument, scale, rootNote, isAudioReady]
  );

  useEffect(() => {
    const unsubscribe = handTracker.onHandUpdate(handleHandUpdate);
    return () => unsubscribe();
  }, [handleHandUpdate]);

  return {
    videoRef,
    isCameraActive,
    toggleCamera,
    hudMode,
    setHudMode,
    leftHand,
    rightHand,
    telemetry
  };
}
