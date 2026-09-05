/**
 * Vertical Mobile Studio Layout
 * Precision 0-corner portrait mobile studio layout with centered gesture camera and touch arranger
 */

import React, { useState } from 'react';
import { Waves, Flame, AudioWaveform, Disc3, Mic, Sliders, Layers } from 'lucide-react';
import { HolographicHUD } from '../visualizer/HolographicHUD';
import { InstrumentRack } from '../instruments/InstrumentRack';
import { MobileTrackArranger } from '../looper/MobileTrackArranger';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../../types/gesture';
import { InstrumentId, ScaleName, TrackState, LooperState, TriggerSettings } from '../../types/audio';

interface MobileLayoutProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  leftHand: ProcessedHand | null;
  rightHand: ProcessedHand | null;
  telemetry: GestureTelemetry;
  activeInstrument: InstrumentId;
  onSelectInstrument: (id: InstrumentId) => void;
  scale: ScaleName;
  onSelectScale: (s: ScaleName) => void;
  rootNote: string;
  onSelectRootNote: (r: string) => void;
  hudMode: HUDVisualMode;
  onSetHudMode: (m: HUDVisualMode) => void;
  triggerSettings: TriggerSettings;
  onTriggerSettingsChange: (s: TriggerSettings) => void;
  tracks: TrackState[];
  onVolumeChange: (id: InstrumentId, vol: number) => void;
  onPanChange: (id: InstrumentId, pan: number) => void;
  onToggleMute: (id: InstrumentId) => void;
  onToggleSolo: (id: InstrumentId) => void;
  onArmTrack: (id: InstrumentId) => void;
  onClearTrack: (id: InstrumentId) => void;
  looperState: LooperState;
  currentStep: number;
  currentBar: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleMetronome: () => void;
  onSetLoopBars: (bars: 1 | 2 | 4 | 8) => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  videoRef,
  isCameraActive,
  onToggleCamera,
  leftHand,
  rightHand,
  telemetry,
  activeInstrument,
  onSelectInstrument,
  scale,
  onSelectScale,
  rootNote,
  onSelectRootNote,
  hudMode,
  onSetHudMode,
  triggerSettings,
  onTriggerSettingsChange,
  tracks,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onArmTrack,
  onClearTrack,
  looperState,
  currentStep,
  currentBar,
  onPlay,
  onPause,
  onStop,
  onToggleRecord,
  onBpmChange,
  onToggleMetronome,
  onSetLoopBars
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'tracks'>('controls');

  const instruments: { id: InstrumentId; label: string; icon: React.ReactNode }[] = [
    { id: 'synth', label: 'SYNTH', icon: <Waves size={15} /> },
    { id: 'guitar', label: 'GUITAR', icon: <Flame size={15} /> },
    { id: 'bass', label: 'BASS', icon: <AudioWaveform size={15} /> },
    { id: 'drums', label: 'DRUMS', icon: <Disc3 size={15} /> },
    { id: 'mic', label: 'VOICE', icon: <Mic size={15} /> }
  ];

  return (
    <div className="w-full flex flex-col items-center gap-3.5 p-2 sm:p-4 safe-p-bottom rounded-none max-w-[560px] mx-auto select-none">
      {/* 1. Portrait Spatial Camera Stage (Almost 9:16 Vertical Viewport) */}
      <div className="w-full aspect-[9/15] sm:aspect-[9/14] max-h-[calc(100svh-175px)] min-h-[400px] overflow-hidden border border-white/20 bg-[#0d121c] shadow-2xl rounded-none relative flex-shrink-0">
        <HolographicHUD
          videoRef={videoRef}
          isCameraActive={isCameraActive}
          onToggleCamera={onToggleCamera}
          leftHand={leftHand}
          rightHand={rightHand}
          telemetry={telemetry}
          activeInstrument={activeInstrument}
          hudMode={hudMode}
          onSetHudMode={onSetHudMode}
        />
      </div>

      {/* 2. Horizontal Scroll Instrument Switcher Bar (All Buttons Identical Size & Unclipped) */}
      <div className="w-full bg-[#08080a] p-1.5 border border-white/20 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5 select-none">
          {instruments.map((inst) => {
            const isSelected = activeInstrument === inst.id;
            return (
              <button
                key={inst.id}
                onClick={() => onSelectInstrument(inst.id)}
                className={`
                  w-[120px] min-w-[120px] h-[46px] px-3 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider uppercase
                  transition-all duration-75 rounded-none border select-none cursor-pointer outline-none flex-shrink-0 whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-md'
                      : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:border-white/35 hover:bg-[#1c1f2e]'
                  }
                `}
              >
                <span className="flex-shrink-0">{inst.icon}</span>
                <span className="truncate">{inst.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Vertical Scroll Console Section: Symmetrical Dual Tabs */}
      <div className="w-full flex flex-col gap-3 pt-1">
        {/* Dual Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 w-full bg-[#08080a] p-1 border border-white/20 font-mono shadow-md">
          <button
            onClick={() => setActiveTab('controls')}
            className={`
              h-[44px] flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all duration-75 rounded-none border cursor-pointer outline-none
              ${
                activeTab === 'controls'
                  ? 'bg-[#f59e0b] text-black border-amber-300 shadow-md font-bold'
                  : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
              }
            `}
          >
            <Sliders size={15} />
            <span>CONTROLADORES</span>
          </button>

          <button
            onClick={() => setActiveTab('tracks')}
            className={`
              h-[44px] flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all duration-75 rounded-none border cursor-pointer outline-none
              ${
                activeTab === 'tracks'
                  ? 'bg-[#f59e0b] text-black border-amber-300 shadow-md font-bold'
                  : 'bg-[#141620] text-slate-300 border-white/15 hover:text-white hover:bg-[#1c1f2e]'
              }
            `}
          >
            <Layers size={15} />
            <span>TRACKS ({tracks.length})</span>
          </button>
        </div>

        {/* Tab 1 Content: Active Instrument Controls Deck */}
        {activeTab === 'controls' && (
          <div className="w-full p-3 sm:p-4 border border-white/15 bg-[#141b27] shadow-lg rounded-none">
            <InstrumentRack
              activeInstrument={activeInstrument}
              onSelectInstrument={onSelectInstrument}
              scale={scale}
              onSelectScale={onSelectScale}
              rootNote={rootNote}
              onSelectRootNote={onSelectRootNote}
              currentStep={currentStep}
              showSwitcher={false}
              triggerSettings={triggerSettings}
              onTriggerSettingsChange={onTriggerSettingsChange}
              currentBpm={looperState.bpm}
            />
          </div>
        )}

        {/* Tab 2 Content: Stems Arranger */}
        {activeTab === 'tracks' && (
          <div className="w-full rounded-none">
            <MobileTrackArranger
              tracks={tracks}
              looperState={looperState}
              currentStep={currentStep}
              currentBar={currentBar}
              onVolumeChange={onVolumeChange}
              onPanChange={onPanChange}
              onToggleMute={onToggleMute}
              onToggleSolo={onToggleSolo}
              onArmTrack={onArmTrack}
              onClearTrack={onClearTrack}
              onPlay={onPlay}
              onPause={onPause}
              onStop={onStop}
              onToggleRecord={onToggleRecord}
              onBpmChange={onBpmChange}
              onToggleMetronome={onToggleMetronome}
              onSetLoopBars={onSetLoopBars}
            />
          </div>
        )}
      </div>
    </div>
  );
};
