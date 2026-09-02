/**
 * Centralized Spatial Gesture Stage & Spectrum Canvas
 * Symmetrical 40px height header badges & square toggle, FFT spectrum visualizer
 */

import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../../audio/AudioEngine';
import { gestureVisualizer } from '../../vision/GestureVisualizer';
import { ProcessedHand, GestureTelemetry, HUDVisualMode } from '../../types/gesture';
import { InstrumentId } from '../../types/audio';

interface HolographicHUDProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  leftHand?: ProcessedHand | null;
  rightHand?: ProcessedHand | null;
  telemetry: GestureTelemetry;
  activeInstrument: InstrumentId;
  hudMode: HUDVisualMode;
  onSetHudMode: (mode: HUDVisualMode) => void;
}

const FREQ_MARKS = ['20Hz', '50Hz', '100Hz', '200Hz', '500Hz', '1kHz', '2kHz', '5kHz', '10kHz'];

export const HolographicHUD: React.FC<HolographicHUDProps> = ({
  videoRef,
  isCameraActive,
  onToggleCamera,
  leftHand,
  rightHand,
  telemetry,
  activeInstrument,
  hudMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Draw warm golden-amber audio spectrum curve
      const fftData = audioEngine.getFrequencyData();
      const waveData = audioEngine.getWaveformData();

      const pointsCount = 64;
      const step = w / (pointsCount - 1);

      const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
      grad.addColorStop(0.5, 'rgba(180, 83, 9, 0.15)');
      grad.addColorStop(1, 'rgba(10, 10, 12, 0.02)');

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < pointsCount; i++) {
        const x = i * step;
        const dataIdx = Math.floor((i / pointsCount) * waveData.length);
        const fftIdx = Math.floor((i / pointsCount) * fftData.length);
        const fftVal = Math.max(0, (fftData[fftIdx] + 90) / 90);
        const waveVal = waveData[dataIdx] || 0;
        const bell = Math.sin((i / pointsCount) * Math.PI) * 0.4 + 0.6;
        const y = h - (fftVal * h * 0.35 * bell + waveVal * 15 + 15);
        ctx.lineTo(x, Math.max(20, y));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Render Hand Landmarks and Laser HUD directly from visualizer cache
      gestureVisualizer.render(ctx, w, h, undefined, undefined, activeInstrument, hudMode);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeInstrument, hudMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[480px] bg-[#0a0b0e] flex flex-col justify-between overflow-hidden select-none">
      {/* Mirrored Camera */}
      <video
        ref={videoRef as any}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transform-gpu transition-opacity duration-300 ${
          isCameraActive ? 'opacity-85 md:filter md:contrast-110 md:brightness-95' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Standby State */}
      {!isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 bg-[#0c0d10]">
          <div className="text-xs md:text-sm font-mono font-bold tracking-[0.2em] text-[#f59e0b] uppercase mb-3">
            STAGE 01 // SENSOR ÓPTICO
          </div>
          <h2 className="text-xl md:text-3xl font-mono font-bold text-white tracking-widest uppercase mb-3">
            CONTROLE POR GESTOS
          </h2>
          <p className="text-sm md:text-base font-mono text-slate-300 max-w-lg mb-8 leading-relaxed">
            Posicione as mãos em frente à câmera para tocar acordes com a mão esquerda e melodias com a direita.
          </p>
          <button
            onClick={onToggleCamera}
            className="px-10 py-4 bg-[#f4f4f5] text-black hover:bg-white border-2 border-white text-sm md:text-base font-mono font-bold tracking-widest uppercase cursor-pointer transition-all active:translate-y-px shadow-2xl min-h-[56px] rounded-none"
          >
            LIGAR CÂMERA
          </button>
        </div>
      )}

      {/* 60FPS Spatial Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none transform-gpu" />

      {/* Top Header: Height-Symmetric (40px) Status Badge & Square Icon Toggle */}
      <div className="relative z-30 p-3 flex items-center justify-between pointer-events-auto">
        {/* Left: Hand Detection Badge (Exact 40px Height) */}
        <div className="h-[40px] box-border flex items-center gap-2.5 px-3.5 bg-black/85 border border-white/20 text-xs font-mono shadow-md rounded-none">
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M7 11V7a5 5 0 0110 0v4M5 9v5a7 7 0 0014 0V9" />
          </svg>

          {isCameraActive ? (
            telemetry.activeHandsCount > 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                <span className="text-white text-sm font-bold">{telemetry.activeHandsCount}</span>
                <span className="text-[10px] text-slate-300 uppercase">{telemetry.activeHandsCount === 1 ? 'MÃO' : 'MÃOS'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 font-bold tracking-wider">
                <svg className="w-3.5 h-3.5 animate-pulse text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[10px] text-amber-400 animate-pulse uppercase">PROCURANDO...</span>
              </div>
            )
          ) : (
            <span className="text-[10px] text-slate-400 uppercase font-bold">OFFLINE</span>
          )}
        </div>

        {/* Right: Square Camera Toggle Icon Button (Exact 40px x 40px) */}
        <button
          onClick={onToggleCamera}
          title={isCameraActive ? 'Desligar Câmera' : 'Ligar Câmera'}
          className={`
            w-[40px] h-[40px] box-border flex items-center justify-center border transition-all cursor-pointer rounded-none shadow-lg
            ${
              isCameraActive
                ? 'bg-[#dc2626] text-white border-red-400 hover:bg-red-700'
                : 'bg-[#181920] text-slate-200 border-white/25 hover:bg-[#262833] hover:text-white'
            }
          `}
        >
          {isCameraActive ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h7M3 3l18 18M9 18h6a2 2 0 002-2v-4m-2-4H7a2 2 0 00-2 2v6" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Bottom Telemetry & Frequency Axis */}
      <div className="relative z-30 flex flex-col pointer-events-none">
        {isCameraActive && (
          <div className="px-4 py-2 mx-3 mb-2 bg-black/90 border border-white/20 flex items-center justify-between text-xs font-mono text-amber-300 shadow-lg">
            <div className="font-bold truncate tracking-wider uppercase">{telemetry.primaryParameter}</div>
            <div className="font-bold text-slate-100 truncate tracking-wider uppercase">{telemetry.secondaryParameter}</div>
            <div className="text-slate-300 hidden sm:block font-bold uppercase">CUTOFF: {telemetry.cutoffHz}Hz</div>
          </div>
        )}

        <div className="px-5 py-2 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 border-t border-white/15 bg-[#08080a]/95">
          {FREQ_MARKS.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
