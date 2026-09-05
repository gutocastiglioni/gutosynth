/**
 * Studio Workstation Desktop Layout (Single Viewport • Zero Vertical Page Scroll)
 * Top-Aligned 750px 4:3 Hero Camera Stage + Full-Width Side Consoles
 */

import React from 'react';
import { HolographicHUD } from '../visualizer/HolographicHUD';
import { InstrumentRack } from '../instruments/InstrumentRack';
import { MultiTrackTimeline } from '../looper/MultiTrackTimeline';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../../types/gesture';
import { InstrumentId, ScaleName, TrackState, LooperState, TriggerSettings } from '../../types/audio';

interface DesktopLayoutProps {
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

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
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
  return (
    <div className="w-full h-[calc(100vh-68px)] max-h-[calc(100vh-68px)] flex items-stretch gap-4 p-3.5 select-none overflow-hidden box-border">
      {/* 1. LEFT PANEL: MULTI-TRACK STEM TRACKER (Full Available Left Width) */}
      <div className="flex-1 h-full min-w-0 flex flex-col border border-white/20 bg-[#0a0b0e] shadow-xl rounded-none overflow-hidden">
        <MultiTrackTimeline
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

      {/* 2. CENTER STAGE: TOP-ALIGNED HERO 4:3 CAMERA (+10% Expanded to 750px) */}
      <div className="w-[680px] xl:w-[750px] 2xl:w-[790px] flex-shrink-0 flex items-start justify-center">
        <div className="w-full aspect-[4/3] overflow-hidden border-2 border-white/25 bg-[#0a0b0e] shadow-2xl relative rounded-none flex items-center justify-center">
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
      </div>

      {/* 3. RIGHT PANEL: INSTRUMENT RACK & CONTROLS (Full Available Right Width) */}
      <div className="flex-1 h-full min-w-0 flex flex-col border border-white/20 bg-[#0d0e14] p-4 shadow-xl rounded-none overflow-hidden">
        <InstrumentRack
          activeInstrument={activeInstrument}
          onSelectInstrument={onSelectInstrument}
          scale={scale}
          onSelectScale={onSelectScale}
          rootNote={rootNote}
          onSelectRootNote={onSelectRootNote}
          currentStep={currentStep}
          triggerSettings={triggerSettings}
          onTriggerSettingsChange={onTriggerSettingsChange}
          currentBpm={looperState.bpm}
        />
      </div>
    </div>
  );
};
