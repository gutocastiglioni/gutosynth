/**
 * Vertical Mobile Studio Layout
 * Precision 0-corner portrait mobile studio layout with centered gesture camera and touch arranger
 */

import React from 'react';
import { HolographicHUD } from '../visualizer/HolographicHUD';
import { InstrumentRack } from '../instruments/InstrumentRack';
import { MobileTrackArranger } from '../looper/MobileTrackArranger';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../../types/gesture';
import { InstrumentId, ScaleName, TrackState, LooperState } from '../../types/audio';

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
    <div className="w-full flex flex-col items-center gap-5 p-2 sm:p-4 safe-p-bottom rounded-none max-w-[600px] mx-auto">
      {/* 1. Centered Mobile Spatial Camera Stage */}
      <div className="w-full h-[320px] sm:h-[380px] overflow-hidden border border-white/15 bg-[#0d121c] shadow-lg rounded-none relative">
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

      {/* 2. Active Touch Instrument Controls */}
      <div className="w-full p-4 border border-white/15 bg-[#141b27] shadow-lg rounded-none">
        <InstrumentRack
          activeInstrument={activeInstrument}
          onSelectInstrument={onSelectInstrument}
          scale={scale}
          onSelectScale={onSelectScale}
          rootNote={rootNote}
          onSelectRootNote={onSelectRootNote}
          currentStep={currentStep}
        />
      </div>

      {/* 3. Mobile Touch Stems Arranger */}
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
    </div>
  );
};
