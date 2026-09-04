/**
 * ============================================================================
 * KINEMATIC HAND PREDICTOR - DEAD RECKONING & TEMPORAL STATE MEMORY
 * ============================================================================
 * Provides inertial dead reckoning and state memorization for hand tracking.
 * Decouples audio performance from visual inference delays & frame drops.
 *
 * Rules:
 * 1. Physical closed fist / zero fingers = Instant 0ms mute (NEVER extrapolated).
 * 2. Visual drop / AI lag while playing = Extrapolates position & maintains chords
 *    for a graceful temporal window (up to 130ms) with exponential velocity decay.
 */

import { ProcessedHand, Handedness, NormalizedLandmark } from '../types/gesture';

interface KinematicMemory {
  lastHand: ProcessedHand | null;
  lastTimestamp: number;
  vx: number;
  vy: number;
  vz: number;
  intentionalMute: boolean;
}

export class KinematicHandPredictor {
  // Grace period before completely dropping hand if not seen (in milliseconds)
  private readonly GRACE_PERIOD_MS = 130;

  // Maximum allowed velocity projection per millisecond to prevent physics explosion
  private readonly MAX_VELOCITY = 0.003;

  private leftMemory: KinematicMemory = {
    lastHand: null,
    lastTimestamp: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    intentionalMute: false
  };

  private rightMemory: KinematicMemory = {
    lastHand: null,
    lastTimestamp: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    intentionalMute: false
  };

  /**
   * Updates tracking memory with a verified physical detection from camera/MediaPipe
   */
  public update(hand: ProcessedHand, timestamp: number): void {
    const memory = hand.handedness === 'Left' ? this.leftMemory : this.rightMemory;
    const prev = memory.lastHand;
    const dt = memory.lastTimestamp > 0 ? Math.max(1, timestamp - memory.lastTimestamp) : 16.6;

    // Check if hand is intentionally muted (fist or 0 fingers extended)
    const isMuted =
      hand.isFist ||
      hand.isClosedHand ||
      (!hand.isPinching &&
        !hand.thumbExtended &&
        !hand.indexExtended &&
        !hand.middleExtended &&
        !hand.ringExtended &&
        !hand.pinkyExtended);

    memory.intentionalMute = isMuted;

    if (prev && dt < 300) {
      // Calculate instant velocity from palm center
      const rawVx = (hand.palmCenter.x - prev.palmCenter.x) / dt;
      const rawVy = (hand.palmCenter.y - prev.palmCenter.y) / dt;
      const rawVz = ((hand.palmCenter.z || 0) - (prev.palmCenter.z || 0)) / dt;

      // Clamp velocity to prevent sudden jumps
      const clampedVx = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, rawVx));
      const clampedVy = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, rawVy));
      const clampedVz = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, rawVz));

      // Adaptive EMA smoothing for velocity vector
      const alpha = 0.65;
      memory.vx = memory.vx * (1.0 - alpha) + clampedVx * alpha;
      memory.vy = memory.vy * (1.0 - alpha) + clampedVy * alpha;
      memory.vz = memory.vz * (1.0 - alpha) + clampedVz * alpha;
    } else {
      memory.vx = 0;
      memory.vy = 0;
      memory.vz = 0;
    }

    memory.lastHand = hand;
    memory.lastTimestamp = timestamp;
  }

  /**
   * Predicts / extrapolates hand state if visual frame was dropped or delayed
   */
  public predict(handedness: Handedness, timestamp: number): ProcessedHand | null {
    const memory = handedness === 'Left' ? this.leftMemory : this.rightMemory;
    const lastHand = memory.lastHand;

    if (!lastHand || memory.lastTimestamp === 0) {
      return null;
    }

    const elapsed = timestamp - memory.lastTimestamp;

    // If time elapsed exceeds grace period or hand was intentionally closed, do not extrapolate
    if (elapsed > this.GRACE_PERIOD_MS || memory.intentionalMute) {
      return null;
    }

    // Exponential velocity damping over time (deceleration)
    const framesElapsed = elapsed / 16.6;
    const damping = Math.pow(0.92, framesElapsed);

    const dx = memory.vx * elapsed * damping;
    const dy = memory.vy * elapsed * damping;
    const dz = memory.vz * elapsed * damping;

    // Extrapolate landmarks
    const extrapolatedLandmarks: NormalizedLandmark[] = lastHand.landmarks.map((lm) => ({
      x: Math.max(0.01, Math.min(0.99, lm.x + dx)),
      y: Math.max(0.01, Math.min(0.99, lm.y + dy)),
      z: (lm.z || 0) + dz
    }));

    // Confidence decays linearly with time away from visual confirmation
    const decayRatio = Math.max(0.2, 1.0 - (elapsed / this.GRACE_PERIOD_MS) * 0.5);
    const confidence = Math.max(0.3, lastHand.handednessConfidence * decayRatio);

    const extCenter = {
      x: Math.max(0.01, Math.min(0.99, lastHand.palmCenter.x + dx)),
      y: Math.max(0.01, Math.min(0.99, lastHand.palmCenter.y + dy)),
      z: (lastHand.palmCenter.z || 0) + dz
    };

    const extNormX = Math.max(0, Math.min(1, 1.0 - extCenter.x));
    const extNormY = Math.max(0, Math.min(1, 1.0 - extCenter.y));

    const p0 = extrapolatedLandmarks[0] || lastHand.wrist;
    const p4 = extrapolatedLandmarks[4] || lastHand.thumbTip;
    const p8 = extrapolatedLandmarks[8] || lastHand.indexTip;
    const p12 = extrapolatedLandmarks[12] || lastHand.middleTip;
    const p16 = extrapolatedLandmarks[16] || lastHand.ringTip;
    const p20 = extrapolatedLandmarks[20] || lastHand.pinkyTip;

    return {
      ...lastHand,
      landmarks: extrapolatedLandmarks,
      wrist: p0,
      thumbTip: p4,
      indexTip: p8,
      middleTip: p12,
      ringTip: p16,
      pinkyTip: p20,
      palmCenter: extCenter,
      normalizedX: extNormX,
      normalizedY: extNormY,
      handednessConfidence: confidence,
      isExtrapolated: true,
      predictionConfidence: confidence
    };
  }

  /**
   * Resets memory for one or both hands
   */
  public reset(handedness?: Handedness): void {
    if (!handedness || handedness === 'Left') {
      this.leftMemory = {
        lastHand: null,
        lastTimestamp: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        intentionalMute: false
      };
    }
    if (!handedness || handedness === 'Right') {
      this.rightMemory = {
        lastHand: null,
        lastTimestamp: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        intentionalMute: false
      };
    }
  }
}

export const kinematicPredictor = new KinematicHandPredictor();
