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
import { gestureVisualizer, DRUM_ZONES } from '../vision/GestureVisualizer';
import { audioEngine } from '../audio/AudioEngine';
import { polySynthEngine, FingerId } from '../audio/instruments/PolySynthEngine';
import { guitarEngine } from '../audio/instruments/GuitarEngine';
import { bassEngine } from '../audio/instruments/BassEngine';
import { drumEngine } from '../audio/instruments/DrumEngine';
import { micVoiceEngine } from '../audio/instruments/MicVoiceEngine';
import { quantizeCoordinateToNote, getChordVoicing, getLeadNoteForHand } from '../audio/scales';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../types/gesture';
import { InstrumentId, ScaleName } from '../types/audio';

interface DrumStriker {
  y: number;
  z: number;
  time: number;
  state: 'ARMED' | 'STRUCK' | 'RECOILING';
  lastStrikeTime: number;
  peakZ: number;
}

export function useHandTracking(
  activeInstrument: InstrumentId,
  scale: ScaleName = 'minor',
  rootNote = 'C',
  isAudioReady = false
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

  const smoothYRef = useRef<Record<FingerId, number>>({
    thumb: 0.5,
    index: 0.5,
    middle: 0.5,
    ring: 0.5,
    pinky: 0.5
  });

  const drumTrackerRef = useRef<{
    right: DrumStriker;
    left: DrumStriker;
    prevLeftThumb: boolean;
    prevRightThumb: boolean;
    lastKickTime: number;
  }>({
    right: { y: 0.5, z: 0, time: 0, state: 'ARMED', lastStrikeTime: 0, peakZ: 0 },
    left: { y: 0.5, z: 0, time: 0, state: 'ARMED', lastStrikeTime: 0, peakZ: 0 },
    prevLeftThumb: false,
    prevRightThumb: false,
    lastKickTime: 0
  });

  const lastPresenceRef = useRef({ left: false, right: false });
  const lastTelemetryTimeRef = useRef(0);
  const lastTelemetryValuesRef = useRef({ activeCount: -1, primary: '', secondary: '' });

  const toggleCamera = useCallback(async () => {
    if (isCameraActive) {
      handTracker.stop();
      gestureVisualizer.updateHands(null, null);
      lastPresenceRef.current = { left: false, right: false };
      setIsCameraActive(false);
      setLeftHand(null);
      setRightHand(null);
      polySynthEngine.releaseAll();
      guitarEngine.stopAll();
      bassEngine.triggerRelease();
    } else {
      await audioEngine.init();
      polySynthEngine.init();
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
      // 1. Direct 60FPS hand update to Canvas visualizer without triggering heavy React re-renders
      gestureVisualizer.updateHands(left, right);

      // 2. Only update React hand presence state when a hand enters or leaves the frame
      const hasLeft = Boolean(left);
      const hasRight = Boolean(right);
      if (hasLeft !== lastPresenceRef.current.left || hasRight !== lastPresenceRef.current.right) {
        lastPresenceRef.current = { left: hasLeft, right: hasRight };
        setLeftHand(left);
        setRightHand(right);
      }

      const activeCount = (left ? 1 : 0) + (right ? 1 : 0);
      let detectedNote: string | null = null;
      let detectedChord: string | null = null;
      const now = performance.now();

      if (!isAudioReady && !audioEngine.initialized) {
        setTelemetry((prev) => ({ ...prev, activeHandsCount: activeCount }));
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
      // 1. AIR-DRUMMING (DISCRETE STROKE FSM)
      // =====================================================================
      if (activeInstrument === 'drums') {
        const kickTracker = drumTrackerRef.current;
        const leftThumb = left?.thumbExtended || false;
        const rightThumb = right?.thumbExtended || false;

        const isDoubleThumb = leftThumb && rightThumb;
        const isSingleThumb = (leftThumb || rightThumb) && !isDoubleThumb;
        const thumbEdge = (leftThumb && !kickTracker.prevLeftThumb) || (rightThumb && !kickTracker.prevRightThumb);

        if (isDoubleThumb && thumbEdge && now - kickTracker.lastKickTime > 200) {
          drumEngine.triggerPad('kick', 1.0);
          gestureVisualizer.addRipple(320, 360, '#f59e0b');
          setTimeout(() => {
            drumEngine.triggerPad('kick', 0.95);
            gestureVisualizer.addRipple(320, 380, '#f59e0b');
          }, 95);
          kickTracker.lastKickTime = now;
          detectedNote = 'BUMBO DUPLO';
        } else if (isSingleThumb && thumbEdge && now - kickTracker.lastKickTime > 160) {
          drumEngine.triggerPad('kick', 0.9);
          const kx = rightThumb ? (right?.thumbTip.x || 0.5) * 640 : (left?.thumbTip.x || 0.5) * 640;
          const ky = rightThumb ? (right?.thumbTip.y || 0.7) * 480 : (left?.thumbTip.y || 0.7) * 480;
          gestureVisualizer.addRipple(kx, ky, '#f59e0b');
          kickTracker.lastKickTime = now;
          detectedNote = 'BUMBO';
        }

        kickTracker.prevLeftThumb = leftThumb;
        kickTracker.prevRightThumb = rightThumb;

        const processIndexStroke = (hand: ProcessedHand, side: 'left' | 'right') => {
          const tip = hand.indexTip;
          if (!tip || hand.isFist || !hand.indexExtended) return;

          const striker = drumTrackerRef.current[side];
          const mirroredX = 1.0 - tip.x;
          const currentY = tip.y;
          const currentZ = tip.z || 0;
          const dt = Math.max(1, now - striker.time);

          const vz = (currentZ - striker.z) / (dt / 16.6);
          const vy = (currentY - striker.y) / (dt / 16.6);

          switch (striker.state) {
            case 'ARMED': {
              const isThrustForward = vz < -0.018;
              const isDownwardSnap = vy > 0.026;

              if (isThrustForward || isDownwardSnap) {
                for (const zone of DRUM_ZONES) {
                  const minX = zone.x - zone.width / 2;
                  const maxX = zone.x + zone.width / 2;
                  const minY = zone.y - zone.height / 2;
                  const maxY = zone.y + zone.height / 2;

                  if (mirroredX >= minX && mirroredX <= maxX && currentY >= minY && currentY <= maxY) {
                    const velocity = Math.min(1.0, Math.max(0.65, Math.abs(vz) * 16 + vy * 8 + 0.65));
                    drumEngine.triggerPad(zone.id as any, velocity);
                    gestureVisualizer.addRipple(mirroredX * 640, currentY * 480, zone.color);

                    striker.state = 'STRUCK';
                    striker.lastStrikeTime = now;
                    striker.peakZ = currentZ;
                    detectedNote = zone.name;
                    break;
                  }
                }
              }
              break;
            }

            case 'STRUCK': {
              if (currentZ < striker.peakZ) {
                striker.peakZ = currentZ;
              }
              const isPullingBack = vz > 0.008 || currentZ > striker.peakZ + 0.018 || now - striker.lastStrikeTime > 140;
              if (isPullingBack) {
                striker.state = 'RECOILING';
              }
              break;
            }

            case 'RECOILING': {
              const hasResetPosition = currentZ > striker.peakZ + 0.035 || vz >= -0.003 || now - striker.lastStrikeTime > 220;
              if (hasResetPosition) {
                striker.state = 'ARMED';
              }
              break;
            }
          }

          striker.y = currentY;
          striker.z = currentZ;
          striker.time = now;
        };

        if (right) processIndexStroke(right, 'right');
        if (left) processIndexStroke(left, 'left');
      }

      // =====================================================================
      // 2. RIGHT HAND (MELODY / EXPRESSION) - STRICT ZERO ON NO EXTENDED FINGER
      // =====================================================================
      if (activeInstrument !== 'drums') {
        if (!hasVisualRight) {
          // Zero sons imediato quando a mão direita não tem dedos ativos
          polySynthEngine.releaseLead();
          guitarEngine.stopAll();
          bassEngine.triggerRelease();
          lastActiveNoteRef.current = null;
          wasActiveRef.current.right = false;
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

          switch (activeInstrument) {
            case 'synth': {
              polySynthEngine.setGestureModulation(right.normalizedX, maxActiveHeight);
              polySynthEngine.playLead(leadNote, 0.85);
              lastActiveNoteRef.current = leadNote;
              wasActiveRef.current.right = true;
              break;
            }

            case 'guitar': {
              guitarEngine.setGestureDriveTone(right.normalizedX, maxActiveHeight);
              if (lastActiveNoteRef.current !== leadNote) {
                guitarEngine.playLeadNote(leadNote, 0.9);
                lastActiveNoteRef.current = leadNote;
                wasActiveRef.current.right = true;
              }
              break;
            }

            case 'bass': {
              bassEngine.setGestureFilter(right.normalizedX, maxActiveHeight);
              const bassNote = quantizeCoordinateToNote(maxActiveHeight, rootNote, scale, 1, 2);
              if (lastActiveNoteRef.current !== bassNote) {
                bassEngine.triggerAttack(bassNote, 0.9);
                lastActiveNoteRef.current = bassNote;
                wasActiveRef.current.right = true;
              }
              break;
            }

            case 'mic':
              micVoiceEngine.setGestureVoiceModulation(right.normalizedX, maxActiveHeight);
              break;
          }

          detectedNote = leadNote;
        }
      }

      // =====================================================================
      // 3. LEFT HAND (CHORDS / HARMONY) - STRICT ZERO ON NO EXTENDED FINGER
      // =====================================================================
      if (activeInstrument !== 'drums') {
        if (!hasVisualLeft) {
          // Zero sons imediato quando a mão esquerda não tem dedos ativos
          polySynthEngine.releaseChord();
          guitarEngine.stopAll();
          lastChordKeyRef.current = null;
          wasActiveRef.current.left = false;
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

          if (lastChordKeyRef.current !== chordKey || !wasActiveRef.current.left) {
            if (activeInstrument === 'synth') {
              polySynthEngine.triggerChord(chordNotes, 0.75);
            } else if (activeInstrument === 'guitar') {
              guitarEngine.strumChord(chordNotes, 'down', 0.85);
            }
            lastChordKeyRef.current = chordKey;
            wasActiveRef.current.left = true;
          }
        }
      }

      // If absolutely no active fingers exist across both hands, guarantee silence
      if (!hasVisualLeft && !hasVisualRight && activeInstrument !== 'drums') {
        polySynthEngine.releaseAll();
        guitarEngine.stopAll();
        bassEngine.triggerRelease();
      }

      const currentCutoff = Math.round(200 * Math.pow(16000 / 200, right ? (1.0 - right.normalizedY) : 0.5));

      const primaryText = right
        ? `DIR: ${detectedNote || 'MUTED'}`
        : 'DIR: AGUARDANDO';
      const secondaryText = left
        ? `ESQ: ${detectedChord || 'MUTED'}`
        : 'ESQ: AGUARDANDO';

      // Throttle telemetry state dispatch to avoid thrashing React DOM reconciliation on mobile
      const shouldUpdateTelemetry =
        activeCount !== lastTelemetryValuesRef.current.activeCount ||
        primaryText !== lastTelemetryValuesRef.current.primary ||
        secondaryText !== lastTelemetryValuesRef.current.secondary ||
        now - lastTelemetryTimeRef.current > 150;

      if (shouldUpdateTelemetry) {
        lastTelemetryTimeRef.current = now;
        lastTelemetryValuesRef.current = {
          activeCount,
          primary: primaryText,
          secondary: secondaryText
        };
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
