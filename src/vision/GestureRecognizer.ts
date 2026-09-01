/**
 * Gesture Recognizer: Invariant 3D kinematics, extension ratios & pinch engine
 */

import {
  NormalizedLandmark,
  Vector3D,
  ProcessedHand,
  Handedness,
  HandOrientation3D,
  PalmFacing,
  HandPose,
  FingerMetrics,
  PinchStrengths
} from '../types/gesture';

export class GestureRecognizer {
  public detectChiralHandedness(landmarks: NormalizedLandmark[]): { handedness: Handedness; confidence: number } {
    if (!landmarks || landmarks.length < 21) {
      return { handedness: 'Right', confidence: 0.5 };
    }

    const p0 = { x: 1.0 - landmarks[0].x, y: landmarks[0].y }, p2 = { x: 1.0 - landmarks[2].x, y: landmarks[2].y };
    const p5 = { x: 1.0 - landmarks[5].x, y: landmarks[5].y }, p9 = { x: 1.0 - landmarks[9].x, y: landmarks[9].y }, p17 = { x: 1.0 - landmarks[17].x, y: landmarks[17].y };

    const vLongX = p9.x - p0.x, vLongY = p9.y - p0.y;
    const vTransX = p5.x - p17.x, vTransY = p5.y - p17.y;
    const vThumbX = p2.x - p0.x, vThumbY = p2.y - p0.y;

    const detPalm = vLongX * vTransY - vLongY * vTransX;
    const detThumb = vLongX * vThumbY - vLongY * vThumbX;

    const invariantProduct = detPalm * detThumb;
    const handedness: Handedness = invariantProduct < 0 ? 'Right' : 'Left';

    const confidence = Math.min(1.0, Math.max(0.75, 0.75 + Math.abs(invariantProduct) * 60));
    return { handedness, confidence };
  }

  public extract3DOrientation(landmarks: NormalizedLandmark[]): HandOrientation3D {
    const p0 = landmarks[0] || { x: 0.5, y: 0.5, z: 0 };
    const p5 = landmarks[5] || p0;
    const p9 = landmarks[9] || p0;
    const p17 = landmarks[17] || p0;

    const vLong: Vector3D = {
      x: p9.x - p0.x,
      y: p9.y - p0.y,
      z: (p9.z || 0) - (p0.z || 0)
    };

    const vTrans: Vector3D = {
      x: p5.x - p17.x,
      y: p5.y - p17.y,
      z: (p5.z || 0) - (p17.z || 0)
    };

    const palmNormalRaw = this.crossProduct(vLong, vTrans);
    const palmNormal = this.normalizeVector(palmNormalRaw);

    const rollRad = Math.atan2(p5.y - p17.y, p5.x - p17.x);
    const roll = (rollRad * 180) / Math.PI;

    const planarDist = Math.sqrt(vLong.x * vLong.x + (vLong.z || 0) * (vLong.z || 0));
    const pitchRad = Math.atan2(-vLong.y, planarDist + 1e-6);
    const pitch = (pitchRad * 180) / Math.PI;

    const yawRad = Math.atan2(vLong.x, -(vLong.z || 0) + 1e-6);
    const yaw = (yawRad * 180) / Math.PI;

    const det2D = vLong.x * vTrans.y - vLong.y * vTrans.x;
    const facingSign = det2D >= 0 ? 1 : -1;
    const facingNormal = Math.max(-1.0, Math.min(1.0, palmNormal.z !== 0 ? palmNormal.z : facingSign));

    let palmFacing: PalmFacing = 'palm';
    if (facingNormal > 0.2) {
      palmFacing = 'palm';
    } else if (facingNormal < -0.2) {
      palmFacing = 'back';
    } else {
      palmFacing = vTrans.z > 0 ? 'side_radial' : 'side_ulnar';
    }

    const elevationAngle = Math.abs(pitch);

    return {
      roll,
      pitch,
      yaw,
      rollRad,
      pitchRad,
      yawRad,
      facingNormal,
      palmFacing,
      palmNormal,
      elevationAngle
    };
  }

  public processLandmarks(
    landmarks: NormalizedLandmark[],
    handednessOverride?: Handedness,
    confidenceOverride?: number,
    trackId = 0
  ): ProcessedHand {
    const chiralRes = this.detectChiralHandedness(landmarks);
    const finalHandedness: Handedness = handednessOverride || chiralRes.handedness;
    const handednessConfidence = confidenceOverride ?? chiralRes.confidence;

    const wrist = landmarks[0] || { x: 0.5, y: 0.5, z: 0 };
    const thumbTip = landmarks[4] || wrist;
    const indexTip = landmarks[8] || wrist;
    const middleTip = landmarks[12] || wrist;
    const ringTip = landmarks[16] || wrist;
    const pinkyTip = landmarks[20] || wrist;

    const indexBase = landmarks[5] || wrist;
    const middleBase = landmarks[9] || wrist;
    const ringBase = landmarks[13] || wrist;
    const pinkyBase = landmarks[17] || wrist;

    const palmCenter = {
      x: (wrist.x + indexBase.x + pinkyBase.x + middleBase.x) * 0.25,
      y: (wrist.y + indexBase.y + pinkyBase.y + middleBase.y) * 0.25,
      z: ((wrist.z || 0) + (indexBase.z || 0) + (pinkyBase.z || 0) + (middleBase.z || 0)) * 0.25
    };

    const palmScale = Math.max(0.06, this.calculate3DDistance(wrist, middleBase));
    const orientation = this.extract3DOrientation(landmarks);

    const { fingerCurls, fingerJointAngles, extensions } = this.calculateFingerKinematics(landmarks, palmCenter, palmScale);

    const indexTipToMcp = this.calculate3DDistance(indexTip, indexBase);
    const middleTipToMcp = this.calculate3DDistance(middleTip, middleBase);
    const ringTipToMcp = this.calculate3DDistance(ringTip, ringBase);
    const pinkyTipToMcp = this.calculate3DDistance(pinkyTip, pinkyBase);

    // 1. PINCH DETECTION (Exclusive 3D Tip-to-Tip Contact: Thumb + Index)
    const PINCH_THRESHOLD = palmScale * 0.30;
    const indexDist = this.calculate3DDistance(thumbTip, indexTip);
    const indexPipToWrist = this.calculate3DDistance(landmarks[6] || wrist, wrist);
    const isIndexLoopOpen = indexPipToWrist > palmScale * 0.70 && indexTipToMcp > palmScale * 0.45;

    let isPinching = false;
    let activePinchFinger: 'index' | null = null;
    let indexPinch = false;
    let pinchDistance = 999;

    // Index Pinch (Classic OK / Pinch Sign with active open loop)
    if (indexDist < PINCH_THRESHOLD && isIndexLoopOpen) {
      indexPinch = true;
      isPinching = true;
      activePinchFinger = 'index';
      pinchDistance = indexDist;
    }

    // 2. FIST / CLOSED HAND RULE (Palm or Back facing camera):
    // If all 5 fingers are closed and not pinching, hand is 100% closed (ZERO sounds, SILENCE).
    const hasAnyExtended = extensions.index || extensions.middle || extensions.ring || extensions.pinky || extensions.thumb;
    const isHandClosed = !isPinching && !hasAnyExtended;
    const isClosedHand = isHandClosed;
    const isFist = isHandClosed;

    const pinchStrength: PinchStrengths = {
      index: indexPinch ? 1.0 : 0,
      middle: 0,
      ring: 0,
      pinky: 0
    };

    const handSpan = this.calculate3DDistance(thumbTip, pinkyTip);
    const isOpenPalm = extensions.index && extensions.middle && extensions.ring && extensions.pinky && extensions.thumb;

    const handPose = this.classifyHandPose(extensions, isPinching, activePinchFinger, isOpenPalm, isFist, orientation);

    let activeLandmark: NormalizedLandmark = indexTip;
    if (isPinching) {
      if (activePinchFinger === 'index') activeLandmark = { x: (thumbTip.x + indexTip.x) * 0.5, y: (thumbTip.y + indexTip.y) * 0.5, z: 0 };
      else if (activePinchFinger === 'middle') activeLandmark = { x: (thumbTip.x + middleTip.x) * 0.5, y: (thumbTip.y + middleTip.y) * 0.5, z: 0 };
      else if (activePinchFinger === 'ring') activeLandmark = { x: (thumbTip.x + ringTip.x) * 0.5, y: (thumbTip.y + ringTip.y) * 0.5, z: 0 };
      else if (activePinchFinger === 'pinky') activeLandmark = { x: (thumbTip.x + pinkyTip.x) * 0.5, y: (thumbTip.y + pinkyTip.y) * 0.5, z: 0 };
    } else {
      const extendedTips: NormalizedLandmark[] = [];
      if (extensions.index) extendedTips.push(indexTip);
      if (extensions.middle) extendedTips.push(middleTip);
      if (extensions.ring) extendedTips.push(ringTip);
      if (extensions.pinky) extendedTips.push(pinkyTip);
      if (extensions.thumb) extendedTips.push(thumbTip);

      if (extendedTips.length > 0) {
        extendedTips.sort((a, b) => a.y - b.y);
        activeLandmark = extendedTips[0];
      } else {
        activeLandmark = indexTip;
      }
    }

    const normalizedX = Math.max(0, Math.min(1, 1.0 - activeLandmark.x));
    const normalizedY = Math.max(0, Math.min(1, 1.0 - activeLandmark.y));

    // Harmonic gesture degree mapping - Exhaustive Open Finger Combinations
    let chordIndex = 0;
    if (isPinching) {
      chordIndex = activePinchFinger === 'index' ? 0 : activePinchFinger === 'middle' ? 1 : activePinchFinger === 'ring' ? 2 : 4;
    } else if (extensions.thumb && !extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 0; // 1. Dedão Sozinho: Grau I (Deep Sub-Bass Root)
    } else if (extensions.thumb && extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 4; // 2. Dedão + Indicador (L-Shape): Grau V (Dominante + Sub)
    } else if (extensions.thumb && !extensions.index && extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 2; // 3. Dedão + Médio: Grau III (Mediante + Sub)
    } else if (extensions.thumb && extensions.index && extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 3; // 4. Dedão + Indicador + Médio: Grau IV (Subdominante + Sub)
    } else if (extensions.thumb && !extensions.index && extensions.middle && extensions.ring && !extensions.pinky) {
      chordIndex = 4; // 5. Dedão + Médio + Anelar: Grau V (Sub)
    } else if (extensions.thumb && !extensions.index && !extensions.middle && extensions.ring && !extensions.pinky) {
      chordIndex = 5; // 6. Dedão + Anelar: Grau VI (Sub)
    } else if (extensions.thumb && !extensions.index && !extensions.middle && !extensions.ring && extensions.pinky) {
      chordIndex = 0; // 7. Dedão + Mindinho: Grau I (Tônica + Oitava)
    } else if (extensions.thumb && extensions.index && !extensions.middle && !extensions.ring && extensions.pinky) {
      chordIndex = 4; // 8. Dedão + Indicador + Mindinho: Grau V (Add9)
    } else if (extensions.thumb && extensions.index && extensions.middle && extensions.ring && !extensions.pinky) {
      chordIndex = 3; // 9. Dedão + 3 Dedos: Grau IV
    } else if (isOpenPalm) {
      chordIndex = 6; // 10. Palma Aberta: Grau VII (Maj7 Full)
    } else if (!extensions.thumb && extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 0; // 11. Apenas Indicador: Grau I (Tônica)
    } else if (!extensions.thumb && extensions.index && extensions.middle && !extensions.ring && !extensions.pinky) {
      chordIndex = 1; // 12. Indicador + Médio (Peace): Grau II
    } else if (!extensions.thumb && extensions.index && extensions.middle && extensions.ring && !extensions.pinky) {
      chordIndex = 2; // 13. 3 Dedos (Indicador + Médio + Anelar): Grau III
    } else if (!extensions.thumb && !extensions.index && extensions.middle && extensions.ring && !extensions.pinky) {
      chordIndex = 3; // 14. Médio + Anelar: Grau IV
    } else if (!extensions.thumb && extensions.index && !extensions.middle && !extensions.ring && extensions.pinky) {
      chordIndex = 5; // 15. Horns (Indicador + Mindinho): Grau VI
    } else if (!extensions.thumb && extensions.middle && !extensions.index && !extensions.ring && !extensions.pinky) {
      chordIndex = 1; // 16. Apenas Médio: Grau II
    } else if (!extensions.thumb && extensions.ring && !extensions.index && !extensions.middle && !extensions.pinky) {
      chordIndex = 4; // 17. Apenas Anelar: Grau V
    } else if (!extensions.thumb && extensions.pinky) {
      chordIndex = 3; // 18. Apenas Mindinho: Grau IV
    } else {
      chordIndex = 0;
    }

    return {
      handedness: finalHandedness,
      handednessConfidence,
      handednessSource: handednessOverride ? 'fused' : 'chiral_3d',
      trackId,
      landmarks,
      wrist,
      indexTip,
      thumbTip,
      middleTip,
      ringTip,
      pinkyTip,
      orientation,
      palmNormal: orientation.palmNormal,
      facingNormal: orientation.facingNormal,
      palmFacing: orientation.palmFacing,
      handPose,
      handSpan,
      palmScale,
      isPinching,
      indexPinch,
      middlePinch: false,
      ringPinch: false,
      pinkyPinch: false,
      activePinchFinger,
      pinchDistance,
      pinchVelocity: 0,
      pinchStrength,
      thumbExtended: extensions.thumb,
      indexExtended: extensions.index,
      middleExtended: extensions.middle,
      ringExtended: extensions.ring,
      pinkyExtended: extensions.pinky,
      thumbClosed: !extensions.thumb,
      indexClosed: !extensions.index,
      middleClosed: !extensions.middle,
      ringClosed: !extensions.ring,
      pinkyClosed: !extensions.pinky,
      isClosedHand,
      isHandClosed,
      fingerCurls,
      fingerJointAngles,
      isOpenPalm,
      isFist,
      palmAngle: orientation.rollRad,
      palmCenter,
      normalizedX,
      normalizedY,
      chordIndex
    };
  }

  private isLongFingerExtended(
    tip: NormalizedLandmark,
    pip: NormalizedLandmark,
    mcp: NormalizedLandmark,
    wrist: NormalizedLandmark,
    palmCenter: NormalizedLandmark,
    palmScale: number,
    pipAngle: number,
    dipAngle: number,
    minScaleRatio = 0.45
  ): boolean {
    const tipToMcp = this.calculate3DDistance(tip, mcp);
    const pipToMcp = Math.max(0.01, this.calculate3DDistance(pip, mcp));
    const tipToCenter = this.calculate3DDistance(tip, palmCenter);
    const tipToWrist = this.calculate3DDistance(tip, wrist);
    const pipToWrist = this.calculate3DDistance(pip, wrist);

    // Anatomical extension ratio (Tip to MCP distance vs PIP to MCP segment)
    const stretchRatio = tipToMcp / pipToMcp;

    // 1. Core extension rule: Stretched away from base knuckle and not curled inward
    const isStretched = stretchRatio > 1.18 || tipToMcp > palmScale * (minScaleRatio - 0.05);
    const isUncurled = pipAngle > 95 && dipAngle > 80;
    const isAwayFromCenter = tipToCenter > palmScale * (minScaleRatio - 0.12);

    if (isStretched && isUncurled && isAwayFromCenter) {
      return true;
    }

    // 2. Linear projection rule: Tip is clearly farther from wrist than PIP
    if (tipToWrist > pipToWrist * 1.04 && tipToMcp > palmScale * (minScaleRatio - 0.12)) {
      return true;
    }

    return false;
  }

  private isThumbExtended(
    thumbTip: NormalizedLandmark,
    thumbMcp: NormalizedLandmark,
    indexMcp: NormalizedLandmark,
    pinkyMcp: NormalizedLandmark,
    palmCenter: NormalizedLandmark,
    palmScale: number
  ): boolean {
    const thumbToIndexMcp = this.calculate3DDistance(thumbTip, indexMcp);
    const thumbToCenter = this.calculate3DDistance(thumbTip, palmCenter);
    const thumbToMcp = this.calculate3DDistance(thumbTip, thumbMcp);

    // Dedão aberto DEVE estar projetado para fora da palma e longe da base do indicador
    const isAbductedFromIndex = thumbToIndexMcp > palmScale * 0.58;
    const isAwayFromPalmCenter = thumbToCenter > palmScale * 0.52;
    const isStretchedFromMcp = thumbToMcp > palmScale * 0.45;

    return (isAbductedFromIndex && isAwayFromPalmCenter) || (isAbductedFromIndex && isStretchedFromMcp);
  }

  private calculateFingerKinematics(
    lm: NormalizedLandmark[],
    palmCenter: { x: number; y: number; z?: number },
    palmScale: number
  ): {
    fingerCurls: FingerMetrics;
    fingerJointAngles: FingerMetrics;
    extensions: { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean };
  } {
    const center = palmCenter as NormalizedLandmark;
    const wrist = lm[0];

    // Joint Angles
    const thumbAngle = this.calculate3DJointAngle(lm[1], lm[2], lm[3]) + this.calculate3DJointAngle(lm[2], lm[3], lm[4]);
    const indexPipAngle = this.calculate3DJointAngle(lm[5], lm[6], lm[7]);
    const indexDipAngle = this.calculate3DJointAngle(lm[6], lm[7], lm[8]);
    const middlePipAngle = this.calculate3DJointAngle(lm[9], lm[10], lm[11]);
    const middleDipAngle = this.calculate3DJointAngle(lm[10], lm[11], lm[12]);
    const ringPipAngle = this.calculate3DJointAngle(lm[13], lm[14], lm[15]);
    const ringDipAngle = this.calculate3DJointAngle(lm[14], lm[15], lm[16]);
    const pinkyPipAngle = this.calculate3DJointAngle(lm[17], lm[18], lm[19]);
    const pinkyDipAngle = this.calculate3DJointAngle(lm[18], lm[19], lm[20]);

    // Robust Invariant Extension Classification
    const indexExtended = this.isLongFingerExtended(lm[8], lm[6], lm[5], wrist, center, palmScale, indexPipAngle, indexDipAngle, 0.48);
    const middleExtended = this.isLongFingerExtended(lm[12], lm[10], lm[9], wrist, center, palmScale, middlePipAngle, middleDipAngle, 0.48);
    const ringExtended = this.isLongFingerExtended(lm[16], lm[14], lm[13], wrist, center, palmScale, ringPipAngle, ringDipAngle, 0.44);
    const pinkyExtended = this.isLongFingerExtended(lm[20], lm[18], lm[17], wrist, center, palmScale, pinkyPipAngle, pinkyDipAngle, 0.40);
    const thumbExtended = this.isThumbExtended(lm[4], lm[2], lm[5], lm[17], center, palmScale);

    const thumbCurl = thumbExtended ? 0.05 : 0.95;
    const indexCurl = indexExtended ? 0.05 : 0.95;
    const middleCurl = middleExtended ? 0.05 : 0.95;
    const ringCurl = ringExtended ? 0.05 : 0.95;
    const pinkyCurl = pinkyExtended ? 0.05 : 0.95;

    return {
      fingerCurls: {
        thumb: thumbCurl,
        index: indexCurl,
        middle: middleCurl,
        ring: ringCurl,
        pinky: pinkyCurl
      },
      fingerJointAngles: {
        thumb: Number(thumbAngle.toFixed(1)),
        index: Number((indexPipAngle + indexDipAngle).toFixed(1)),
        middle: Number((middlePipAngle + middleDipAngle).toFixed(1)),
        ring: Number((ringPipAngle + ringDipAngle).toFixed(1)),
        pinky: Number((pinkyPipAngle + pinkyDipAngle).toFixed(1))
      },
      extensions: {
        thumb: thumbExtended,
        index: indexExtended,
        middle: middleExtended,
        ring: ringExtended,
        pinky: pinkyExtended
      }
    };
  }

  private classifyHandPose(
    ext: { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean },
    isPinching: boolean,
    activePinch: string | null,
    isOpenPalm: boolean,
    isFist: boolean,
    orientation: HandOrientation3D
  ): HandPose {
    if (isFist) {
      if (ext.thumb && orientation.pitch > 35) return 'thumb_up';
      if (ext.thumb && orientation.pitch < -35) return 'thumb_down';
      return 'fist';
    }
    if (isPinching && activePinch) {
      return `pinch_${activePinch}` as HandPose;
    }
    if (isOpenPalm) return 'open_palm';
    if (ext.index && !ext.middle && !ext.ring && !ext.pinky) return 'pointing';
    if (ext.index && ext.middle && !ext.ring && !ext.pinky) return 'peace';
    if (ext.index && ext.pinky && !ext.middle && !ext.ring) return 'horns';
    if (Math.abs(orientation.facingNormal) < 0.15) return 'flat_edge';
    return 'custom';
  }

  public calculate3DDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    const dx = p1.x - p2.x, dy = p1.y - p2.y, dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz * 0.45);
  }

  private calculate3DJointAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = this.dotProduct(v1, v2), len1 = this.vectorLength(v1), len2 = this.vectorLength(v2);
    if (len1 * len2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
  }

  private crossProduct(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
  }

  private dotProduct(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private vectorLength(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private normalizeVector(v: Vector3D): Vector3D {
    const len = this.vectorLength(v) + 1e-7;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
}

export const gestureRecognizer = new GestureRecognizer();
