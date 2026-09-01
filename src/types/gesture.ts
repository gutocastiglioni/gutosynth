/**
 * Gesture & Vision Type Definitions
 * Multi-finger pinch support, 3D anatomical skeletal basis, full-angle pose estimation,
 * continuous joint curl telemetry, invariant chirality tracking, and explicit closed-finger tracking.
 */

export interface NormalizedLandmark {
  x: number; // 0 to 1 (left to right)
  y: number; // 0 to 1 (top to bottom)
  z: number; // relative depth (camera z)
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right';

export type PalmFacing = 'palm' | 'back' | 'side_radial' | 'side_ulnar';

export type HandPose =
  | 'open_palm'
  | 'fist'
  | 'pointing'
  | 'peace'
  | 'horns'
  | 'thumb_up'
  | 'thumb_down'
  | 'pinch_index'
  | 'pinch_middle'
  | 'pinch_ring'
  | 'pinch_pinky'
  | 'flat_edge'
  | 'custom';

export interface FingerMetrics {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface PinchStrengths {
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface HandOrientation3D {
  roll: number; // Roll in degrees (-180 to +180) around forearm axis
  pitch: number; // Pitch in degrees (-90 to +90) vertical tilt
  yaw: number; // Yaw in degrees (-180 to +180) horizontal rotation
  rollRad: number;
  pitchRad: number;
  yawRad: number;
  facingNormal: number; // -1.0 (back of hand) to +1.0 (palm facing camera)
  palmFacing: PalmFacing;
  palmNormal: Vector3D;
  elevationAngle: number; // Degrees
}

export interface ProcessedHand {
  handedness: Handedness;
  handednessConfidence: number; // 0.0 to 1.0
  handednessSource: 'chiral_3d' | 'classifier' | 'fused';
  trackId: number;

  landmarks: NormalizedLandmark[];
  wrist: NormalizedLandmark;
  indexTip: NormalizedLandmark;
  thumbTip: NormalizedLandmark;
  middleTip: NormalizedLandmark;
  ringTip: NormalizedLandmark;
  pinkyTip: NormalizedLandmark;

  // 3D Spatial Nuance & Orientation
  orientation: HandOrientation3D;
  palmNormal: Vector3D;
  facingNormal: number;
  palmFacing: PalmFacing;
  handPose: HandPose;
  handSpan: number; // 3D distance between thumb tip and pinky tip
  palmScale: number; // Metacarpal scale

  // Multi-Finger Pinch & Proximity Strengths
  isPinching: boolean;
  indexPinch: boolean;
  middlePinch: boolean;
  ringPinch: boolean;
  pinkyPinch: boolean;
  activePinchFinger: 'index' | 'middle' | 'ring' | 'pinky' | null;
  pinchDistance: number;
  pinchVelocity: number;
  pinchStrength: PinchStrengths;

  // Explicit Internal Open / Closed State Markers
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  thumbClosed: boolean;
  indexClosed: boolean;
  middleClosed: boolean;
  ringClosed: boolean;
  pinkyClosed: boolean;
  isClosedHand: boolean;
  isHandClosed: boolean;
  fingerCurls: FingerMetrics; // 0.0 = fully extended, 1.0 = fully curled
  fingerJointAngles: FingerMetrics; // Joint bend angles in degrees

  isOpenPalm: boolean;
  isFist: boolean;
  palmAngle: number;
  palmCenter: { x: number; y: number; z?: number };

  // Musical mapping values
  normalizedX: number;
  normalizedY: number;
  chordIndex: number;
}

export interface GestureTelemetry {
  activeHandsCount: number;
  leftHand: ProcessedHand | null;
  rightHand: ProcessedHand | null;
  primaryParameter: string;
  secondaryParameter: string;
  detectedChord: string | null;
  detectedNote: string | null;
  cutoffHz: number;
  expressionValue: number;
  fps: number;
}

export type HUDVisualMode = 'cyber' | 'minimal' | 'wireframe' | 'matrix';
