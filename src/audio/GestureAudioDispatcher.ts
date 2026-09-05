/**
 * Gesture Audio Dispatcher
 * Dispatches lead melodies and chords across PolySynth, Guitar, and Bass engines
 * Supporting Continuous (sustain), Single Note (1-shot on finger lift), and Repeat (pulse).
 */

import { InstrumentId, TriggerMode } from '../types/audio';
import { polySynthEngine } from './instruments/PolySynthEngine';
import { guitarEngine } from './instruments/GuitarEngine';
import { bassEngine } from './instruments/BassEngine';
import { micVoiceEngine } from './instruments/MicVoiceEngine';

/**
 * Dispatches melodic right hand lead notes according to current TriggerMode
 */
export function dispatchLeadSound(
  instrument: InstrumentId,
  leadNote: string,
  mode: TriggerMode,
  gateDuration: number,
  normalizedX: number,
  normalizedY: number,
  noteChanged: boolean
): void {
  switch (instrument) {
    case 'synth':
      polySynthEngine.setGestureModulation(normalizedX, normalizedY);
      if (mode === 'continuous') {
        polySynthEngine.playLead(leadNote, 0.85);
      } else {
        polySynthEngine.triggerSingleNote(leadNote, gateDuration, 0.85);
      }
      break;

    case 'guitar':
      guitarEngine.setGestureDriveTone(normalizedX, normalizedY);
      if (mode === 'continuous') {
        if (noteChanged) guitarEngine.playLeadNote(leadNote, 0.9);
      } else {
        guitarEngine.playLeadNote(leadNote, 0.9, `${gateDuration}s`);
      }
      break;

    case 'bass':
      bassEngine.setGestureFilter(normalizedX, normalizedY);
      if (mode === 'continuous') {
        if (noteChanged) bassEngine.triggerAttack(leadNote, 0.95);
      } else {
        bassEngine.triggerAttackRelease(leadNote, `${gateDuration}s`, 0.95);
      }
      break;

    case 'mic':
      micVoiceEngine.setGestureVoiceModulation(normalizedX, normalizedY);
      break;
  }
}

/**
 * Dispatches harmonic left hand chord voicings according to current TriggerMode
 */
export function dispatchChordSound(
  instrument: InstrumentId,
  chordNotes: string[],
  rootBassNote: string,
  mode: TriggerMode,
  gateDuration: number,
  isChordChanged: boolean
): void {
  if (instrument === 'bass') {
    if (mode === 'continuous') {
      if (isChordChanged) bassEngine.triggerAttack(rootBassNote, 0.95);
    } else {
      bassEngine.triggerAttackRelease(rootBassNote, `${gateDuration}s`, 0.95);
    }
  } else {
    if (mode === 'continuous') {
      if (isChordChanged) {
        if (instrument === 'synth') polySynthEngine.triggerChord(chordNotes, 0.75);
        else if (instrument === 'guitar') guitarEngine.strumChord(chordNotes, 'down', 0.85);
      }
    } else {
      if (instrument === 'synth') polySynthEngine.triggerChordSingle(chordNotes, gateDuration, 0.75);
      else if (instrument === 'guitar') guitarEngine.strumChord(chordNotes, 'down', 0.85);
    }
  }
}

/**
 * Releases all active sounds across all instruments unconditionally
 */
export function releaseAllInstrumentSounds(): void {
  polySynthEngine.releaseAll();
  guitarEngine.stopAll();
  bassEngine.triggerRelease();
}
