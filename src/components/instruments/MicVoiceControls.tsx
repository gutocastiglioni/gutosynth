/**
 * Industrial Microphone & Vocal Transformer Control Deck
 * Real-time mic toggle, pitch shifter, robot vocoder, distortion & space FX with ample breathing room
 */

import React, { useState } from 'react';
import { Mic, MicOff, Bot, Radio } from 'lucide-react';
import { micVoiceEngine } from '../../audio/instruments/MicVoiceEngine';
import { Knob } from '../common/Knob';
import { Button } from '../common/Button';

export const MicVoiceControls: React.FC = () => {
  const [isLive, setIsLive] = useState(micVoiceEngine.isActive);
  const [pitchShift, setPitchShiftState] = useState(micVoiceEngine.params.pitchShift);
  const [robotMode, setRobotModeState] = useState(micVoiceEngine.params.robotRingMod);
  const [distortion, setDistortion] = useState(micVoiceEngine.params.distortion);
  const [delay, setDelay] = useState(micVoiceEngine.params.delayFeedback);
  const [reverb, setReverb] = useState(micVoiceEngine.params.reverbMix);
  const [gestureLinked, setGestureLinked] = useState(micVoiceEngine.params.gestureLinked);

  const handleToggleMic = async () => {
    const live = await micVoiceEngine.toggleMicrophone();
    setIsLive(live);
  };

  const handleToggleRobot = () => {
    const next = !robotMode;
    setRobotModeState(next);
    micVoiceEngine.setRobotMode(next);
  };

  const handleToggleGesture = () => {
    const next = !gestureLinked;
    setGestureLinked(next);
    micVoiceEngine.params.gestureLinked = next;
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Mic Status & Big Toggle Button */}
      <div className="p-5 border border-white/15 bg-[#12131a] flex flex-wrap items-center justify-between gap-4 rounded-none shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/20 bg-black flex items-center justify-center text-amber-300 flex-shrink-0">
            {isLive ? <Mic size={22} className="animate-pulse text-emerald-400" /> : <MicOff size={22} />}
          </div>
          <div>
            <h4 className="text-sm md:text-base font-mono font-bold text-white uppercase tracking-wider">LIVE VOCAL DSP</h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isLive ? 'Microphone active • Processing real-time FX' : 'Microphone offline'}
            </p>
          </div>
        </div>

        <Button
          variant={isLive ? 'danger' : 'bone'}
          size="md"
          className="h-[46px] px-6"
          icon={isLive ? <MicOff size={16} /> : <Mic size={16} />}
          onClick={handleToggleMic}
        >
          {isLive ? 'MUTE MIC' : 'ACTIVATE MIC'}
        </Button>
      </div>

      {/* Pitch Shifter & Modes */}
      <div className="p-6 border border-white/15 bg-[#090a0d] space-y-6 rounded-none shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="text-xs md:text-sm font-mono font-bold tracking-widest text-slate-200 uppercase">
            <span>PITCH SHIFTER & MODES</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={gestureLinked ? 'amber' : 'secondary'}
              size="sm"
              className="h-[44px] px-5"
              active={gestureLinked}
              icon={<Radio size={14} />}
              onClick={handleToggleGesture}
            >
              GESTURE LINK
            </Button>
            <Button
              variant={robotMode ? 'bone' : 'secondary'}
              size="sm"
              className="h-[44px] px-5"
              active={robotMode}
              icon={<Bot size={14} />}
              onClick={handleToggleRobot}
            >
              ROBOT VOCODER
            </Button>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm font-mono font-bold text-slate-200">
            <span>PITCH SHIFT</span>
            <span className="text-amber-400 font-bold">{pitchShift > 0 ? `+${pitchShift}` : pitchShift} SEMITONES</span>
          </div>
          <input
            type="range"
            min={-12}
            max={12}
            step={1}
            value={pitchShift}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setPitchShiftState(val);
              micVoiceEngine.setPitchShift(val);
            }}
            className="w-full h-2.5 bg-[#181922] appearance-none cursor-pointer"
          />
        </div>

        {/* Space & Distortion Knobs */}
        <div className="grid grid-cols-3 gap-6 justify-items-center pt-2">
          <Knob
            label="Distort"
            value={distortion}
            defaultValue={0.0}
            min={0}
            max={0.9}
            step={0.05}
            color="#f97316"
            onChange={(val) => {
              setDistortion(val);
              micVoiceEngine.setFX(val, 0.25, delay, reverb);
            }}
          />
          <Knob
            label="Echo"
            value={delay}
            defaultValue={0.2}
            min={0}
            max={0.8}
            step={0.05}
            color="#f59e0b"
            onChange={(val) => {
              setDelay(val);
              micVoiceEngine.setFX(distortion, 0.25, val, reverb);
            }}
          />
          <Knob
            label="Reverb"
            value={reverb}
            defaultValue={0.35}
            min={0}
            max={0.9}
            step={0.05}
            color="#f59e0b"
            onChange={(val) => {
              setReverb(val);
              micVoiceEngine.setFX(distortion, 0.25, delay, val);
            }}
          />
        </div>
      </div>
    </div>
  );
};
