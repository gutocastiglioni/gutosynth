/**
 * SynthGesture Studio - Main Application Root
 * Next-Generation Spatial Gesture Multi-Instrument Studio
 * Single Viewport Desktop Workstation with Zero Vertical Page Scroll
 */

import React, { useState, useCallback } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useHandTracking } from './hooks/useHandTracking';
import { useLooper } from './hooks/useLooper';
import { Header } from './components/layout/Header';
import { MobileLayout } from './components/layout/MobileLayout';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { GestureHelper } from './components/visualizer/GestureHelper';
import { ExportModal } from './components/looper/ExportModal';
import { ProjectLibraryModal } from './components/projects/ProjectLibraryModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ScaleName } from './types/audio';
import { PresetLibraryItem } from './types/project';
import { polySynthEngine } from './audio/instruments/PolySynthEngine';
import { guitarEngine } from './audio/instruments/GuitarEngine';
import { bassEngine } from './audio/instruments/BassEngine';

export const App: React.FC = () => {
  const responsive = useResponsive();
  const [scale, setScale] = useState<ScaleName>('minor');
  const [rootNote, setRootNote] = useState<string>('C');

  // Modals state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Audio Engine Hook
  const {
    isAudioReady,
    activeInstrument,
    tracks,
    masterVolume,
    setMasterVolume,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    armTrack
  } = useAudioEngine();

  // Looper Hook
  const {
    looperState,
    currentStep,
    currentBar,
    play,
    pause,
    stop,
    toggleRecord,
    setBpm,
    setLoopBars,
    toggleMetronome,
    clearTrackRecording
  } = useLooper(activeInstrument);

  // Hand Tracking Hook
  const {
    videoRef,
    isCameraActive,
    toggleCamera,
    hudMode,
    setHudMode,
    leftHand,
    rightHand,
    telemetry
  } = useHandTracking(activeInstrument, scale, rootNote, isAudioReady);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLoadPreset = useCallback((preset: PresetLibraryItem) => {
    if (preset.bpm) setBpm(preset.bpm);
    if (preset.scale) setScale(preset.scale);
    if (preset.rootNote) setRootNote(preset.rootNote);
    if (preset.projectData?.synthParams) {
      polySynthEngine.params = { ...polySynthEngine.params, ...preset.projectData.synthParams };
    }
    if (preset.projectData?.guitarParams) {
      guitarEngine.applyPreset(preset.projectData.guitarParams.preset);
    }
    if (preset.projectData?.bassParams) {
      bassEngine.applyPreset(preset.projectData.bassParams.preset);
    }
  }, [setBpm]);

  return (
    <div className="h-screen max-h-screen w-full bg-[#080a0e] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Master Studio Bar */}
      <Header
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        looperState={looperState}
        currentStep={currentStep}
        currentBar={currentBar}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onToggleRecord={toggleRecord}
        onBpmChange={setBpm}
        onToggleMetronome={toggleMetronome}
        onSetLoopBars={setLoopBars}
      />

      {/* Main Studio Viewport */}
      <main className="w-full flex-1 flex flex-col justify-center overflow-hidden">
        {responsive.isMobile || responsive.isPortrait ? (
          <div className="w-full h-full overflow-y-auto custom-scrollbar">
            <MobileLayout
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              onToggleCamera={toggleCamera}
              leftHand={leftHand}
              rightHand={rightHand}
              telemetry={telemetry}
              activeInstrument={activeInstrument}
              onSelectInstrument={armTrack}
              scale={scale}
              onSelectScale={setScale}
              rootNote={rootNote}
              onSelectRootNote={setRootNote}
              hudMode={hudMode}
              onSetHudMode={setHudMode}
              tracks={tracks}
              onVolumeChange={updateTrackVolume}
              onPanChange={updateTrackPan}
              onToggleMute={toggleTrackMute}
              onToggleSolo={toggleTrackSolo}
              onArmTrack={armTrack}
              onClearTrack={(id) => {
                clearTrackRecording(id);
                addToast('info', 'Track Cleared', `Buffer for ${id} reset.`);
              }}
              looperState={looperState}
              currentStep={currentStep}
              currentBar={currentBar}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onToggleRecord={toggleRecord}
              onBpmChange={setBpm}
              onToggleMetronome={toggleMetronome}
              onSetLoopBars={setLoopBars}
            />
          </div>
        ) : (
          <DesktopLayout
            videoRef={videoRef}
            isCameraActive={isCameraActive}
            onToggleCamera={toggleCamera}
            leftHand={leftHand}
            rightHand={rightHand}
            telemetry={telemetry}
            activeInstrument={activeInstrument}
            onSelectInstrument={armTrack}
            scale={scale}
            onSelectScale={setScale}
            rootNote={rootNote}
            onSelectRootNote={setRootNote}
            hudMode={hudMode}
            onSetHudMode={setHudMode}
            tracks={tracks}
            onVolumeChange={updateTrackVolume}
            onPanChange={updateTrackPan}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onArmTrack={armTrack}
            onClearTrack={(id) => {
              clearTrackRecording(id);
              addToast('info', 'Track Cleared', `Buffer for ${id} reset.`);
            }}
            looperState={looperState}
            currentStep={currentStep}
            currentBar={currentBar}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onToggleRecord={toggleRecord}
            onBpmChange={setBpm}
            onToggleMetronome={toggleMetronome}
            onSetLoopBars={setLoopBars}
          />
        )}
      </main>

      {/* Modals */}
      <GestureHelper isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onSuccess={(msg) => addToast('success', 'Export Complete', msg)}
      />

      <ProjectLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        currentBpm={looperState.bpm}
        currentScale={scale}
        currentRootNote={rootNote}
        onLoadPreset={handleLoadPreset}
        onNotify={(msg) => addToast('success', 'Preset Loaded', msg)}
      />

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default App;
