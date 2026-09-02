/**
 * Minority Report Gesture Guide Component
 * Clear visual documentation for hand mappings, chord poses and air-drumming zones
 */

import React from 'react';
import { Hand, Music, Radio, Volume2, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';

interface GestureHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureHelper: React.FC<GestureHelperProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GutoSynth Gesture Controls"
      subtitle="Master spatial music creation with dual-hand tracking gestures"
      maxWidth="lg"
    >
      <div className="space-y-6 text-slate-200 text-sm">
        {/* Dual Hand Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Hand Card */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-300 font-bold font-display text-base">
              <Hand className="w-5 h-5 text-purple-400" />
              <span>Left Hand: Harmony & Chords</span>
            </div>
            <p className="text-xs text-slate-400">
              Controls chord voicings, harmonies and rhythmic rhythm strums.
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong className="text-purple-300">Thumb + Index Pinch:</strong> Triggers active chord voicing.</li>
              <li><strong className="text-purple-300">1 Finger Extended:</strong> Root Triad chord.</li>
              <li><strong className="text-purple-300">2 Fingers (Peace):</strong> Minor 7th chord.</li>
              <li><strong className="text-purple-300">3 Fingers Extended:</strong> Major 7th chord.</li>
              <li><strong className="text-purple-300">Open Palm:</strong> Lush Add9 / Suspended chord.</li>
            </ul>
          </div>

          {/* Right Hand Card */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold font-display text-base">
              <Music className="w-5 h-5 text-cyan-400" />
              <span>Right Hand: Melody & Filter FX</span>
            </div>
            <p className="text-xs text-slate-400">
              Controls lead pitch, scales, resonant filter cutoffs and dynamic expression.
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong className="text-cyan-300">Vertical (Y-Axis):</strong> Quantized pitch / scale notes (higher = higher pitch).</li>
              <li><strong className="text-cyan-300">Horizontal (X-Axis):</strong> Filter cutoff & distortion sweep (80Hz to 14kHz).</li>
              <li><strong className="text-cyan-300">Pinch Index + Thumb:</strong> Strikes note / triggers envelope.</li>
              <li><strong className="text-cyan-300">Guitar Mode:</strong> Down/Up sweep strums chords.</li>
            </ul>
          </div>
        </div>

        {/* Air Drumming & Voice Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Air Drumming */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-display text-base">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>Air-Drumming Zones</span>
            </div>
            <p className="text-xs text-slate-300">
              When Drum kit is active, pinch in holographic zones:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="p-2 rounded bg-black/40 border border-amber-500/20">Top-Left: Hi-Hat Open</div>
              <div className="p-2 rounded bg-black/40 border border-amber-500/20">Top-Right: Crash</div>
              <div className="p-2 rounded bg-black/40 border border-amber-500/20">Mid-Left: Snare</div>
              <div className="p-2 rounded bg-black/40 border border-amber-500/20">Bottom: 808 Kick</div>
            </div>
          </div>

          {/* Voice FX */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold font-display text-base">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              <span>Vocal Transformer</span>
            </div>
            <p className="text-xs text-slate-300">
              Sing or speak into your microphone and gesture with your right hand:
            </p>
            <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
              <li>Move hand <strong className="text-emerald-300">Up/Down</strong> for real-time Pitch Shifting.</li>
              <li>Move hand <strong className="text-emerald-300">Left/Right</strong> for Tape Echo & Delay feedback.</li>
              <li>Toggle <strong className="text-emerald-300">Robot Mode</strong> for vocoder bitcrushing.</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};
