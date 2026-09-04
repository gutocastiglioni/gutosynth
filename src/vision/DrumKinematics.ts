/**
 * ============================================================================
 * DRUM KINEMATICS - BALLISTIC PREDICTOR & CONTINUOUS COLLISION ENGINE
 * ============================================================================
 * Solves the high-speed air-drumming frame drop problem:
 * 1. Continuous Ray/Segment collision test (Liang-Barsky) catches strikes between frames.
 * 2. Ballistic trajectory extrapolation projects 18ms ahead to eliminate camera lag.
 * 3. Fast-recoil state machine supports up to 16 strokes per second (rolls & flams).
 * 4. Double and single kick triggers via thumb extension gestures.
 */

import { drumEngine } from '../audio/instruments/DrumEngine';
import { gestureVisualizer, DRUM_ZONES } from './GestureVisualizer';
import { ProcessedHand } from '../types/gesture';

interface DrumStriker {
  x: number;
  y: number;
  z: number;
  time: number;
  vx: number;
  vy: number;
  vz: number;
  state: 'ARMED' | 'STRUCK' | 'RECOILING';
  lastStrikeTime: number;
  peakZ: number;
  peakY: number;
}

export interface DrumProcessResult {
  hitNote: string | null;
}

export class DrumKinematics {
  private leftStriker: DrumStriker = this.createInitialStriker();
  private rightStriker: DrumStriker = this.createInitialStriker();
  private prevLeftThumb = false;
  private prevRightThumb = false;
  private lastKickTime = 0;

  private createInitialStriker(): DrumStriker {
    return {
      x: 0.5,
      y: 0.5,
      z: 0,
      time: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      state: 'ARMED',
      lastStrikeTime: 0,
      peakZ: 0,
      peakY: 0.5
    };
  }

  /**
   * Resets all striker states and kick triggers
   */
  public reset(): void {
    this.leftStriker = this.createInitialStriker();
    this.rightStriker = this.createInitialStriker();
    this.prevLeftThumb = false;
    this.prevRightThumb = false;
    this.lastKickTime = 0;
  }

  /**
   * Continuous Liang-Barsky segment vs box intersection test
   */
  private segmentIntersectsBox(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): boolean {
    if (x0 >= minX && x0 <= maxX && y0 >= minY && y0 <= maxY) return true;
    if (x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) return true;

    const dx = x1 - x0;
    const dy = y1 - y0;
    let u1 = 0;
    let u2 = 1;

    const edges = [
      { p: -dx, q: -(minX - x0) },
      { p: dx, q: maxX - x0 },
      { p: -dy, q: -(minY - y0) },
      { p: dy, q: maxY - y0 }
    ];

    for (const edge of edges) {
      if (edge.p === 0) {
        if (edge.q < 0) return false;
      } else {
        const r = edge.q / edge.p;
        if (edge.p < 0) {
          if (r > u2) return false;
          if (r > u1) u1 = r;
        } else {
          if (r < u1) return false;
          if (r < u2) u2 = r;
        }
      }
    }

    return u1 <= u2;
  }

  /**
   * Processes hand tracking frame for air-drumming hits
   */
  public process(
    left: ProcessedHand | null,
    right: ProcessedHand | null,
    now: number
  ): DrumProcessResult {
    let detectedNote: string | null = null;

    // 1. Kick Trigger (Thumbs)
    const leftThumb = left?.thumbExtended || false;
    const rightThumb = right?.thumbExtended || false;
    const isDoubleThumb = leftThumb && rightThumb;
    const isSingleThumb = (leftThumb || rightThumb) && !isDoubleThumb;
    const thumbEdge = (leftThumb && !this.prevLeftThumb) || (rightThumb && !this.prevRightThumb);

    if (isDoubleThumb && thumbEdge && now - this.lastKickTime > 200) {
      drumEngine.triggerPad('kick', 1.0);
      gestureVisualizer.addNormalizedRipple(0.5, 0.8, '#f59e0b');
      setTimeout(() => {
        drumEngine.triggerPad('kick', 0.95);
        gestureVisualizer.addNormalizedRipple(0.5, 0.8, '#f59e0b');
      }, 95);
      this.lastKickTime = now;
      detectedNote = 'BUMBO DUPLO';
    } else if (isSingleThumb && thumbEdge && now - this.lastKickTime > 160) {
      drumEngine.triggerPad('kick', 0.9);
      gestureVisualizer.addNormalizedRipple(0.5, 0.8, '#f59e0b');
      this.lastKickTime = now;
      detectedNote = 'BUMBO';
    }

    this.prevLeftThumb = leftThumb;
    this.prevRightThumb = rightThumb;

    // 2. Continuous Stroke Processing for Left & Right Hands
    const processHandStroke = (hand: ProcessedHand, side: 'left' | 'right') => {
      let tip = null;
      if (hand.pinkyExtended) tip = hand.landmarks[20];
      else if (hand.ringExtended) tip = hand.landmarks[16];
      else if (hand.middleExtended) tip = hand.landmarks[12];
      else if (hand.indexExtended) tip = hand.landmarks[8] || hand.indexTip;
      else if (hand.landmarks[8] && !hand.isFist) tip = hand.landmarks[8];

      if (!tip) return;

      const striker = side === 'left' ? this.leftStriker : this.rightStriker;
      const mirroredX = 1.0 - tip.x;
      const currentY = tip.y;
      const currentZ = tip.z || 0;
      const dt = striker.time > 0 ? Math.max(1, now - striker.time) : 16.6;

      // Instantaneous normalized velocities (per 16.6ms standard frame)
      const frameFactor = dt / 16.6;
      const rawVx = (mirroredX - striker.x) / frameFactor;
      const rawVy = (currentY - striker.y) / frameFactor;
      const rawVz = (currentZ - striker.z) / frameFactor;

      // Smooth velocities with adaptive response
      striker.vx = striker.vx * 0.3 + rawVx * 0.7;
      striker.vy = striker.vy * 0.3 + rawVy * 0.7;
      striker.vz = striker.vz * 0.3 + rawVz * 0.7;

      switch (striker.state) {
        case 'ARMED': {
          const isThrustForward = striker.vz < -0.006;
          const isDownwardSnap = striker.vy > 0.007;

          if (isThrustForward || isDownwardSnap) {
            const padMargin = 0.035;

            // Ballistic dead reckoning projection (project 18ms into the immediate future)
            const projectedX = mirroredX + striker.vx * 1.1;
            const projectedY = currentY + striker.vy * 1.1;

            for (const zone of DRUM_ZONES) {
              const minX = zone.x - zone.width / 2 - padMargin;
              const maxX = zone.x + zone.width / 2 + padMargin;
              const minY = zone.y - zone.height / 2 - padMargin;
              const maxY = zone.y + zone.height / 2 + padMargin;

              // Test both segment from previous frame and projected forward segment
              const hitHistorical = this.segmentIntersectsBox(
                striker.x,
                striker.y,
                mirroredX,
                currentY,
                minX,
                maxX,
                minY,
                maxY
              );
              const hitProjected = this.segmentIntersectsBox(
                mirroredX,
                currentY,
                projectedX,
                projectedY,
                minX,
                maxX,
                minY,
                maxY
              );

              if (hitHistorical || hitProjected) {
                const strikeEnergy = Math.sqrt(striker.vy * striker.vy + striker.vz * striker.vz);
                const velocity = Math.min(1.0, Math.max(0.65, strikeEnergy * 24 + 0.65));

                drumEngine.triggerPad(zone.id as any, velocity);
                gestureVisualizer.addNormalizedRipple(mirroredX, currentY, zone.color);

                striker.state = 'STRUCK';
                striker.lastStrikeTime = now;
                striker.peakZ = currentZ;
                striker.peakY = currentY;
                detectedNote = zone.name;
                break;
              }
            }
          }
          break;
        }

        case 'STRUCK': {
          if (currentZ < striker.peakZ) striker.peakZ = currentZ;
          if (currentY > striker.peakY) striker.peakY = currentY;

          // Adaptive recoil detection: pulling back in Z or moving up in Y
          const isPullingBack =
            striker.vz > 0.002 ||
            striker.vy < -0.004 ||
            currentZ > striker.peakZ + 0.008 ||
            striker.peakY - currentY > 0.010 ||
            now - striker.lastStrikeTime > 45;

          if (isPullingBack) {
            striker.state = 'RECOILING';
          }
          break;
        }

        case 'RECOILING': {
          // Rapid re-arming for drum rolls and 16th notes
          const hasResetPosition =
            currentZ > striker.peakZ + 0.012 ||
            striker.peakY - currentY > 0.012 ||
            striker.vy < -0.001 ||
            now - striker.lastStrikeTime > 60;

          if (hasResetPosition) {
            striker.state = 'ARMED';
          }
          break;
        }
      }

      striker.x = mirroredX;
      striker.y = currentY;
      striker.z = currentZ;
      striker.time = now;
    };

    if (right) processHandStroke(right, 'right');
    if (left) processHandStroke(left, 'left');

    return { hitNote: detectedNote };
  }
}

export const drumKinematics = new DrumKinematics();
