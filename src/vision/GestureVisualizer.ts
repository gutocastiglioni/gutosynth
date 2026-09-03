/**
 * ============================================================================
 * GESTURE VISUALIZER - CLEAN 3D HOLOGRAPHIC HUD & SKELETON RENDERER
 * ============================================================================
 * Renders:
 * 1. 21-joint skeleton frames (Left: Electric Purple, Right: Cyber Cyan).
 * 2. Clean, transparent L-HARMONY and R-EXPRESSION labels without container boxes.
 * 3. Laser beams, pulsating rings, shockwave ripples, and glowing Pinch indicators.
 */

import { ProcessedHand, HUDVisualMode } from '../types/gesture';
import { InstrumentId } from '../types/audio';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm base arch
];

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  isNormalized?: boolean;
}

export const DRUM_ZONES = [
  { id: 'hihat_closed', name: 'CLOSED HAT', x: 0.20, y: 0.28, width: 0.22, height: 0.24, color: '#f59e0b' },
  { id: 'hihat_open', name: 'OPEN HAT', x: 0.50, y: 0.24, width: 0.22, height: 0.22, color: '#fbbf24' },
  { id: 'cymbal', name: 'CRASH', x: 0.80, y: 0.28, width: 0.22, height: 0.24, color: '#ef4444' },
  { id: 'snare', name: 'SNARE "PÁ"', x: 0.25, y: 0.65, width: 0.28, height: 0.28, color: '#00f2fe' },
  { id: 'clap', name: 'CLAP', x: 0.75, y: 0.65, width: 0.28, height: 0.28, color: '#06d6a0' },
  { id: 'tom', name: 'TOM // PERC', x: 0.50, y: 0.65, width: 0.24, height: 0.24, color: '#9d4edd' }
];

export class GestureVisualizer {
  private ripples: Ripple[] = [];
  private pulsePhase = 0;

  public addRipple(x: number, y: number, color = '#00f2fe', isNormalized = false): void {
    this.ripples.push({
      x,
      y,
      radius: 8,
      maxRadius: 72,
      color,
      alpha: 1.0,
      isNormalized
    });
  }

  public addNormalizedRipple(normX: number, normY: number, color = '#00f2fe'): void {
    this.addRipple(normX, normY, color, true);
  }

  public triggerEchoVisualBurst(x: number, y: number, color = '#00f2fe'): void {
    for (let i = 0; i < 3; i++) {
      this.ripples.push({
        x,
        y,
        radius: 10 + i * 14,
        maxRadius: 90 + i * 30,
        color,
        alpha: 1.0 - i * 0.15
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    leftHand: ProcessedHand | null,
    rightHand: ProcessedHand | null,
    activeInstrument: InstrumentId,
    mode: HUDVisualMode = 'cyber'
  ): void {
    if (width <= 0 || height <= 0) return;
    this.pulsePhase += 0.08;

    // 1. Holographic Pitch Grid Lines
    this.drawHolographicGrid(ctx, width, height, mode);

    // 2. Demarcated Drum Zones (when on Drums)
    if (activeInstrument === 'drums') {
      this.drawDrumZones(ctx, width, height);
    }

    // 3. Render Left Hand Frame (Electric Purple)
    if (leftHand) {
      this.renderHand(ctx, leftHand, width, height, '#9d4edd', '#c77dff', 'L-HARMONY', activeInstrument);
    }

    // 4. Render Right Hand Frame (Cyber Cyan)
    if (rightHand) {
      this.renderHand(ctx, rightHand, width, height, '#00f2fe', '#67e8f9', 'R-EXPRESSION', activeInstrument);
    }

    // 5. Impact & Echo Ripples
    this.renderRipples(ctx, width, height);
  }

  private renderHand(
    ctx: CanvasRenderingContext2D,
    hand: ProcessedHand,
    w: number,
    h: number,
    primaryColor: string,
    glowColor: string,
    label: string,
    activeInstrument: InstrumentId
  ): void {
    const landmarks = hand.landmarks;
    if (!landmarks || landmarks.length < 21) return;

    // 1. Sleek 21-Joint Skeletal Segments in Mirrored Space
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = primaryColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;

    HAND_CONNECTIONS.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2) {
        const x1 = (1.0 - p1.x) * w;
        const y1 = p1.y * h;
        const x2 = (1.0 - p2.x) * w;
        const y2 = p2.y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // 2. Joint Nodes: Extended tips get prominent white nodes, closed fingers stay subtle
    for (let i = 0; i < 21; i++) {
      const p = landmarks[i];
      if (!p) continue;
      const px = (1.0 - p.x) * w;
      const py = p.y * h;

      const isExtendedTip =
        (i === 4 && hand.thumbExtended) ||
        (i === 8 && hand.indexExtended) ||
        (i === 12 && hand.middleExtended) ||
        (i === 16 && hand.ringExtended) ||
        (i === 20 && hand.pinkyExtended);

      ctx.beginPath();
      ctx.arc(px, py, isExtendedTip ? 4.5 : 2.0, 0, Math.PI * 2);
      ctx.fillStyle = isExtendedTip ? '#ffffff' : `${primaryColor}80`;
      ctx.fill();
    }

    // 3. Contextual Finger Lasers
    const isRight = hand.handedness === 'Right';
    const thumbLabel = activeInstrument === 'drums' ? 'BUMBO' : (isRight ? 'SUB' : 'SUB / ROOT');
    const indexLabel = activeInstrument === 'drums' ? 'STRIKE' : (isRight ? 'LEAD' : 'MELODY');
    const midLabel = isRight ? '3RD' : '3RD';
    const ringLabel = isRight ? '5TH' : '5TH';
    const pinkyLabel = isRight ? 'OCT' : 'OCT';

    const fingerDefs = [
      { tip: landmarks[4], extended: hand.thumbExtended, label: thumbLabel },
      { tip: landmarks[8], extended: hand.indexExtended, label: indexLabel },
      { tip: landmarks[12], extended: hand.middleExtended, label: midLabel },
      { tip: landmarks[16], extended: hand.ringExtended, label: ringLabel },
      { tip: landmarks[20], extended: hand.pinkyExtended, label: pinkyLabel }
    ];

    fingerDefs.forEach((f) => {
      if (!f.tip || !f.extended) return;
      const fx = (1.0 - f.tip.x) * w;
      const fy = f.tip.y * h;

      const yRatio = Math.max(0.01, Math.min(0.99, fy / h));
      const yMin = Math.max(0, Math.min(yRatio - 0.05, (fy - 80) / h));
      const yMax = Math.min(1, Math.max(yRatio + 0.05, (fy + 80) / h));

      ctx.save();
      const laserGrad = ctx.createLinearGradient(fx, 0, fx, h);
      laserGrad.addColorStop(0, `${primaryColor}00`);
      if (yMin > 0.02) laserGrad.addColorStop(yMin, `${primaryColor}40`);
      laserGrad.addColorStop(yRatio, glowColor);
      if (yMax < 0.98) laserGrad.addColorStop(yMax, `${primaryColor}40`);
      laserGrad.addColorStop(1, `${primaryColor}00`);

      ctx.strokeStyle = laserGrad;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.lineTo(fx, h);
      ctx.stroke();
      ctx.restore();

      const pulseR = 10 + Math.sin(this.pulsePhase + fx * 0.01) * 3;
      ctx.beginPath();
      ctx.arc(fx, fy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(fx, fy, pulseR + 7, 0, Math.PI * 2);
      ctx.strokeStyle = `${primaryColor}60`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#000000';
      ctx.fillText(f.label, fx, fy - 18);
    });

    // 4. Glowing Pinch Indicator Ring (when in a real elevated pinch)
    if (hand.isPinching) {
      let pTip = landmarks[8];
      if (hand.activePinchFinger === 'middle') pTip = landmarks[12];
      else if (hand.activePinchFinger === 'ring') pTip = landmarks[16];
      else if (hand.activePinchFinger === 'pinky') pTip = landmarks[20];

      const tTip = landmarks[4];
      if (pTip && tTip) {
        const px = (1.0 - (pTip.x + tTip.x) * 0.5) * w;
        const py = ((pTip.y + tTip.y) * 0.5) * h;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 15 + Math.sin(this.pulsePhase * 2) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = glowColor;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.fillText('PINCH', px, py - 20);
        ctx.restore();
      }
    }

    // 5. Palm Center Clean Text Label (Transparent, No Container Box)
    const pcx = (1.0 - hand.palmCenter.x) * w;
    const pcy = hand.palmCenter.y * h;
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#000000';
    ctx.fillText(label, pcx, pcy - 12);
  }

  private drawHolographicGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mode: HUDVisualMode
  ): void {
    if (mode === 'minimal') return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawDrumZones(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    DRUM_ZONES.forEach((zone) => {
      const zx = (zone.x - zone.width / 2) * width;
      const zy = (zone.y - zone.height / 2) * height;
      const zw = zone.width * width;
      const zh = zone.height * height;

      ctx.save();
      ctx.strokeStyle = `${zone.color}50`;
      ctx.fillStyle = `${zone.color}08`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(zx, zy, zw, zh);
      ctx.fillRect(zx, zy, zw, zh);

      ctx.fillStyle = zone.color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, zx + zw / 2, zy + zh / 2 + 3);
      ctx.restore();
    });
  }

  private renderRipples(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 3.2;
      r.alpha -= 0.035;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      const rx = r.isNormalized ? r.x * width : r.x;
      const ry = r.isNormalized ? r.y * height : r.y;

      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = r.color;
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const gestureVisualizer = new GestureVisualizer();
