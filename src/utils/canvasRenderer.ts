import { TimelineClip, VideoFilterType, VideoAspectRatio } from '../types/video';

/**
 * Render a single video timeline frame onto a 2D HTML5 canvas context.
 */
export function renderTimelineFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  videoClip: TimelineClip | null,
  timeInClip: number,
  activeFilter: VideoFilterType,
  activeSubtitle: TimelineClip | null,
  videoElementMap: Map<string, HTMLVideoElement>,
  aspectRatio: VideoAspectRatio = '16:9'
) {
  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background base
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  if (videoClip) {
    const videoEl = videoClip.sourceUrl ? videoElementMap.get(videoClip.id) : null;

    if (videoEl && videoEl.readyState >= 2 && !videoClip.isProcedural) {
      // Draw actual video source with object-fit cover
      try {
        const videoRatio = videoEl.videoWidth / (videoEl.videoHeight || 1);
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoRatio > canvasRatio) {
          drawW = height * videoRatio;
          offsetX = (width - drawW) / 2;
        } else {
          drawH = width / videoRatio;
          offsetY = (height - drawH) / 2;
        }

        ctx.drawImage(videoEl, offsetX, offsetY, drawW, drawH);
      } catch {
        renderProceduralScene(ctx, width, height, videoClip, timeInClip);
      }
    } else {
      // Draw CineStudio high-fidelity procedural AI motion canvas
      renderProceduralScene(ctx, width, height, videoClip, timeInClip);
    }
  } else {
    // Empty timeline slate
    renderSlatePlaceholder(ctx, width, height);
  }

  // Apply Cinematic Color LUT / Filter
  applyCinematicFilter(ctx, width, height, activeFilter, timeInClip);

  // Render Subtitles / Motion Titles Overlay
  if (activeSubtitle && activeSubtitle.text) {
    renderSubtitleOverlay(ctx, width, height, activeSubtitle, timeInClip);
  }

  ctx.restore();
}

/**
 * Procedural AI scene renderer with camera motion, light leaks, and particle depth.
 */
function renderProceduralScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clip: TimelineClip,
  t: number
) {
  const profile = clip.sceneProfile;
  const palette = profile?.colorPalette && profile.colorPalette.length >= 3
    ? profile.colorPalette
    : ['#1e1b4b', '#4338ca', '#818cf8', '#0f172a'];

  const progress = clip.duration > 0 ? Math.min(1, Math.max(0, t / clip.duration)) : 0;
  // Camera motion: slow zoom-in + pan
  const zoom = 1.0 + progress * 0.12;
  const panX = Math.sin(progress * Math.PI) * (w * 0.04);
  const panY = Math.cos(progress * Math.PI) * (h * 0.02);

  ctx.save();
  ctx.translate(w / 2 + panX, h / 2 + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-w / 2, -h / 2);

  // Dynamic atmospheric gradient
  const grad = ctx.createRadialGradient(
    w * (0.3 + 0.4 * progress),
    h * 0.35,
    w * 0.05,
    w * 0.5,
    h * 0.5,
    w * 0.8
  );
  grad.addColorStop(0, palette[1] || '#6366f1');
  grad.addColorStop(0.45, palette[0] || '#312e81');
  grad.addColorStop(0.85, palette[2] || '#1e1b4b');
  grad.addColorStop(1, palette[3] || '#09090b');

  ctx.fillStyle = grad;
  ctx.fillRect(-w * 0.2, -h * 0.2, w * 1.4, h * 1.4);

  // Perspective 3D light grid
  ctx.strokeStyle = `${palette[1]}33`;
  ctx.lineWidth = 1.5;
  const horizon = h * 0.65;
  const gridCount = 14;

  ctx.beginPath();
  for (let i = 0; i <= gridCount; i++) {
    const xBase = (w / gridCount) * i;
    ctx.moveTo(w * 0.5, horizon * 0.85);
    ctx.lineTo(xBase * 1.6 - w * 0.3, h * 1.2);
  }
  for (let j = 1; j <= 6; j++) {
    const yLine = horizon + (h - horizon) * Math.pow(j / 6, 1.8);
    ctx.moveTo(-w * 0.2, yLine);
    ctx.lineTo(w * 1.2, yLine);
  }
  ctx.stroke();

  // Floating ambient light particles
  const particleCount = 28;
  for (let i = 0; i < particleCount; i++) {
    const seed = (i * 997 + Math.floor(t * 10)) % 1000;
    const px = ((i * 137.5) % w + (t * 22 * (i % 2 === 0 ? 1 : -0.7))) % w;
    const py = ((i * 223.7) % h - (t * 18 * ((i % 3) + 1))) % h;
    const radius = 1.5 + (i % 4) * 1.2;
    const alpha = 0.25 + 0.45 * Math.sin(t * 2 + i);

    ctx.beginPath();
    ctx.arc((px + w) % w, (py + h) % h, radius, 0, Math.PI * 2);
    ctx.fillStyle = `${palette[1]}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fill();
  }

  // Cinematic Volumetric Light Orb
  const orbGrad = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, w * 0.35);
  orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  orbGrad.addColorStop(0.3, `${palette[2]}44`);
  orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orbGrad;
  ctx.fillRect(0, 0, w, h);

  // Cinematic Headline Center Badge
  if (profile?.headlineOverlay) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(w * 0.045)}px 'Inter', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.shadowColor = palette[0] || '#4f46e5';
    ctx.shadowBlur = 18;
    ctx.fillText(profile.headlineOverlay.toUpperCase(), w / 2, h * 0.38);
    ctx.shadowBlur = 0;

    // Subtitle tagline
    ctx.font = `600 ${Math.round(w * 0.02)}px 'Inter', sans-serif`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.letterSpacing = '3px';
    ctx.fillText(profile.title.toUpperCase(), w / 2, h * 0.44);
    ctx.letterSpacing = '0px';
  }

  ctx.restore();
}

/**
 * Empty slate placeholder
 */
function renderSlatePlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#111116';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(w * 0.028)}px 'Inter', sans-serif`;
  ctx.fillStyle = '#52525b';
  ctx.fillText('CineStudio Pro Preview Slate • Drag or Generate Clips to Timeline', w / 2, h / 2);
}

/**
 * Apply Cinematic LUT filters
 */
function applyCinematicFilter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filter: VideoFilterType,
  t: number
) {
  if (filter === 'none') return;

  ctx.save();
  switch (filter) {
    case 'cinematic-warm': {
      // Warm golden overlay + vignette
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'multiply';
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
      vig.addColorStop(0, 'rgba(255, 255, 255, 1)');
      vig.addColorStop(1, 'rgba(80, 45, 10, 0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'teal-orange': {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
      ctx.fillRect(0, 0, w, h * 0.6);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.fillRect(0, h * 0.4, w, h * 0.6);
      break;
    }

    case 'cyber-neon': {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(217, 70, 239, 0.25)';
      ctx.fillRect(0, 0, w, h);

      // Neon scan sweep
      const sweepY = (t * 120) % h;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.fillRect(0, sweepY, w, 4);
      break;
    }

    case 'vhs-retro': {
      // Scanlines
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }

      // Vintage timestamp
      ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
      ctx.font = `700 ${Math.round(w * 0.024)}px monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('PLAY ► SP  00:00:08', w * 0.05, h * 0.06);
      break;
    }

    case 'noir-bw': {
      // Grayscale desaturation
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'hsl(0, 0%, 50%)';
      ctx.fillRect(0, 0, w, h);

      // High contrast crush
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'matrix-green': {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
  ctx.restore();
}

/**
 * Render Subtitle / Motion Title
 */
function renderSubtitleOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clip: TimelineClip,
  t: number
) {
  const text = clip.text || '';
  if (!text) return;

  ctx.save();
  const position = clip.textPosition || 'bottom';
  const style = clip.textStyle || 'bold-caption';

  let y = h * 0.84;
  if (position === 'center') y = h * 0.5;
  if (position === 'top') y = h * 0.16;

  const fontSize = Math.round(w * 0.032);
  ctx.font = `700 ${fontSize}px 'Inter', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const paddingX = Math.round(fontSize * 0.8);
  const paddingY = Math.round(fontSize * 0.45);
  const boxW = metrics.width + paddingX * 2;
  const boxH = fontSize + paddingY * 2;
  const boxX = w / 2 - boxW / 2;
  const boxY = y - boxH / 2;

  // Background pill / box
  ctx.fillStyle = clip.textBg || 'rgba(0, 0, 0, 0.72)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = clip.textColor || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, w / 2, y);

  ctx.restore();
}

/**
 * Audio Synthesizer for stock tracks and SFX using Web Audio API
 */
export class CineAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.mediaStreamDest && this.ctx) {
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    }
    return this.ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMediaStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.init();
    return this.mediaStreamDest;
  }

  /**
   * Plays a synthesized procedural ambient music loop
   */
  public playSynthesizedTrack(
    synthType: 'lofi' | 'ambient' | 'epic' | 'fusion' | 'tech',
    volume = 0.35
  ) {
    this.init();
    if (!this.ctx) return;

    this.stopAll();

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    if (this.mediaStreamDest) {
      masterGain.connect(this.mediaStreamDest);
    }
    this.activeNodes.push(masterGain);

    const now = this.ctx.currentTime;
    const chords = [
      [220, 261.63, 329.63, 392], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196, 246.94], // Cmaj7
      [196, 246.94, 293.66, 349.23], // G7
    ];

    chords.forEach((chord, i) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = synthType === 'lofi' ? 'triangle' : synthType === 'epic' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 2.5);

        // Lowpass filter for smooth warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(synthType === 'tech' ? 1200 : 700, now);

        oscGain.gain.setValueAtTime(0.001, now + i * 2.5);
        oscGain.gain.exponentialRampToValueAtTime(0.08, now + i * 2.5 + 0.3);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 2.5 + 2.4);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now + i * 2.5);
        osc.stop(now + i * 2.5 + 2.5);
        this.activeNodes.push(osc);
      });
    });
  }

  public stopAll() {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
  }
}
