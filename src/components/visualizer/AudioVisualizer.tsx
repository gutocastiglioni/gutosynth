/**
 * 60FPS Audio Waveform & Spectrum Visualizer
 * Real-time canvas oscilloscope with multi-color neon gradients
 */

import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../../audio/AudioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = '#00f2fe',
  height = 80
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

      ctx.clearRect(0, 0, w, h);

      // Fetch waveform data from master analyser
      const waveform = audioEngine.getWaveformData();

      // Create glowing gradient
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, '#00f2fe');
      gradient.addColorStop(0.5, '#9d4edd');
      gradient.addColorStop(1, '#ff007f');

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isPlaying ? gradient : 'rgba(255, 255, 255, 0.15)';
      ctx.shadowColor = isPlaying ? color : 'transparent';
      ctx.shadowBlur = isPlaying ? 12 : 0;

      ctx.beginPath();
      const sliceWidth = w / waveform.length;
      let x = 0;

      for (let i = 0; i < waveform.length; i++) {
        const v = waveform[i]; // -1.0 to 1.0
        const y = ((v + 1) / 2) * h;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = height;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [height]);

  return (
    <div className="w-full relative overflow-hidden rounded-xl bg-black/40 border border-white/10 p-1 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full block" style={{ height }} />
    </div>
  );
};
