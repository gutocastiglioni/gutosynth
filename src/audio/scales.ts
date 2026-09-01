/**
 * Music Theory, Scales & Chord Quantizer for Gesture Mapping
 */

import { ScaleName } from '../types/audio';

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const SCALE_INTERVALS: Record<ScaleName, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  cyberpunk: [0, 1, 5, 7, 8],
  blues: [0, 3, 5, 6, 7, 10]
};

export function midiToFreq(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = ROOT_NOTES.indexOf(name as any);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

export function midiToNoteName(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${ROOT_NOTES[noteIndex]}${octave}`;
}

export function getScaleNotes(rootNote: string, scaleName: ScaleName, baseOctave = 3, numOctaves = 3): string[] {
  const rootIndex = ROOT_NOTES.indexOf(rootNote as any);
  if (rootIndex === -1) return [];
  const intervals = SCALE_INTERVALS[scaleName] || SCALE_INTERVALS.minor;
  const result: string[] = [];

  for (let oct = 0; oct < numOctaves; oct++) {
    const currentOctave = baseOctave + oct;
    const baseMidi = (currentOctave + 1) * 12 + rootIndex;
    for (const interval of intervals) {
      result.push(midiToNoteName(baseMidi + interval));
    }
  }
  return result;
}

export function quantizeCoordinateToNote(
  normalizedY: number,
  rootNote: string,
  scaleName: ScaleName,
  baseOctave = 3,
  numOctaves = 2
): string {
  const notes = getScaleNotes(rootNote, scaleName, baseOctave, numOctaves);
  if (notes.length === 0) return 'C4';
  const clampedY = Math.max(0, Math.min(0.999, normalizedY));
  const index = Math.floor(clampedY * notes.length);
  return notes[index];
}

/**
 * Generates a full 4-note chord voicing (root, 3rd, 5th, 7th) based on scale degree
 */
export function getLeadNoteForHand(
  normalizedY: number,
  rootNote: string,
  scaleName: ScaleName,
  ext: { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean },
  baseOctave = 3
): string {
  const notes = getScaleNotes(rootNote, scaleName, baseOctave, 3);
  if (notes.length === 0) return 'C4';

  const clampedY = Math.max(0, Math.min(0.999, normalizedY));
  const baseIdx = Math.floor(clampedY * Math.max(1, notes.length - 8));

  // Contextual Interval Shift based on active finger combination
  let intervalOffset = 0;
  if (ext.thumb && !ext.index && !ext.middle && !ext.ring && !ext.pinky) {
    intervalOffset = -7; // Sub-Bass (-1 Octave)
  } else if (ext.thumb && ext.index && !ext.middle && !ext.ring && !ext.pinky) {
    intervalOffset = 4; // Dominant (+5th)
  } else if (ext.index && ext.middle && !ext.ring && !ext.pinky) {
    intervalOffset = 2; // Peace / 3rd Harmony (+3rd)
  } else if (ext.index && ext.middle && ext.ring && !ext.pinky) {
    intervalOffset = 4; // 3 Fingers / 5th Harmony (+5th)
  } else if (ext.index && ext.pinky && !ext.middle && !ext.ring) {
    intervalOffset = 7; // Horns / Octave (+8ve)
  } else if (ext.middle && !ext.index && !ext.ring && !ext.pinky) {
    intervalOffset = 2; // Middle alone (+3rd)
  } else if (ext.ring && !ext.index && !ext.middle && !ext.pinky) {
    intervalOffset = 4; // Ring alone (+5th)
  } else if (ext.pinky && !ext.index && !ext.middle && !ext.ring) {
    intervalOffset = 7; // Pinky alone (+8ve)
  } else if (ext.index && ext.middle && ext.ring && ext.pinky) {
    intervalOffset = 7; // 4 Fingers (+8ve)
  }

  const finalIdx = Math.max(0, Math.min(notes.length - 1, baseIdx + intervalOffset));
  return notes[finalIdx] || 'C4';
}

/**
 * Generates a full 4-note chord voicing (root, 3rd, 5th, 7th) based on scale degree
 */
export function getChordVoicing(
  chordIndex: number,
  rootNote: string,
  scaleName: ScaleName,
  octave = 3,
  withSubBass = false
): string[] {
  const notes = getScaleNotes(rootNote, scaleName, octave, 2);
  const baseIndex = chordIndex % Math.max(1, notes.length - 4);

  const root = notes[baseIndex] || 'C3';
  const third = notes[baseIndex + 2] || 'E3';
  const fifth = notes[baseIndex + 4] || 'G3';
  const seventh = notes[baseIndex + 6] || 'B3';

  const chord = [root, third, fifth, seventh];
  if (withSubBass) {
    const subBassNotes = getScaleNotes(rootNote, scaleName, Math.max(1, octave - 2), 1);
    if (subBassNotes[0]) {
      chord.unshift(subBassNotes[0]);
    }
  }
  return chord;
}
