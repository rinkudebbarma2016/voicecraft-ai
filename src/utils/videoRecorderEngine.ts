import {
  ImageToVideoAtmosphere,
  ImageToVideoMotion,
  ImageToVideoAspectRatio,
  FlowVector,
} from '../types/imageToVideo';

export interface RenderOptions {
  sourceImage: string;
  motion: ImageToVideoMotion;
  motionSpeed: number; // 0.5 to 2.0
  atmosphere: ImageToVideoAtmosphere;
  aspectRatio: ImageToVideoAspectRatio;
  duration: number; // seconds
  fps: number; // 24, 30, 60
  flowVectors?: FlowVector[];
  promptFidelity?: number; // 0.0 to 1.0
  audioUrl?: string;
  zDepthMove?: number;
  perspectiveIntensity?: number;
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  videoBlob: Blob;
  videoUrl: string;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
}

export function getDimensionsForAspect(
  aspect: ImageToVideoAspectRatio,
  quality: 'hd' | 'fhd' | '4k' = 'fhd'
): { width: number; height: number } {
  if (aspect === '9:16') {
    return quality === '4k'
      ? { width: 2160, height: 3840 }
      : quality === 'fhd'
      ? { width: 1080, height: 1920 }
      : { width: 720, height: 1280 };
  }
  if (aspect === '4:5') {
    return quality === '4k'
      ? { width: 2160, height: 2700 }
      : quality === 'fhd'
      ? { width: 1080, height: 1350 }
      : { width: 720, height: 900 };
  }
  if (aspect === '1:1') {
    return quality === '4k'
      ? { width: 2160, height: 2160 }
      : quality === 'fhd'
      ? { width: 1080, height: 1080 }
      : { width: 720, height: 720 };
  }
  if (aspect === '21:9') {
    return quality === '4k'
      ? { width: 3840, height: 1645 }
      : quality === 'fhd'
      ? { width: 2560, height: 1080 }
      : { width: 1920, height: 822 };
  }
  // default 16:9
  return quality === '4k'
    ? { width: 3840, height: 2160 }
    : quality === 'fhd'
    ? { width: 1920, height: 1080 }
    : { width: 1280, height: 720 };
}

// Particle state for atmospheric simulation
export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  color?: string;
}

export function initParticles(
  count: number,
  width: number,
  height: number,
  type: ImageToVideoAtmosphere,
  flowVectors?: FlowVector[]
): Particle[] {
  const particles: Particle[] = [];

  // Determine average flow direction from vectors
  let avgDx = 0;
  let avgDy = 0;
  if (flowVectors && flowVectors.length > 0) {
    for (const fv of flowVectors) {
      avgDx += fv.dx * fv.intensity;
      avgDy += fv.dy * fv.intensity;
    }
    avgDx /= flowVectors.length;
    avgDy /= flowVectors.length;
  }

  for (let i = 0; i < count; i++) {
    const baseSpeedX =
      type === 'rain'
        ? -2 - Math.random() * 1.5
        : (Math.random() - 0.5) * 1.2 + avgDx * 1.8;
    const baseSpeedY =
      type === 'embers'
        ? -1.5 - Math.random() * 2
        : type === 'rain'
        ? 14 + Math.random() * 8
        : type === 'sakura-petals'
        ? 1.2 + Math.random() * 1.8
        : (Math.random() - 0.5) * 0.8 + avgDy * 1.5;

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size:
        type === 'embers'
          ? 2 + Math.random() * 4
          : type === 'dust-particles'
          ? 1.5 + Math.random() * 3.5
          : type === 'sakura-petals'
          ? 6 + Math.random() * 8
          : 1 + Math.random() * 2,
      speedX: baseSpeedX,
      speedY: baseSpeedY,
      opacity: 0.2 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      color:
        type === 'embers'
          ? Math.random() > 0.4
            ? '#fb923c'
            : '#f59e0b'
          : type === 'sakura-petals'
          ? '#f472b6'
          : '#ffffff',
    });
  }
  return particles;
}

// Smooth cubic ease in-out
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Draw single frame onto canvas with motion matrix, VidsCraft neural flow vectors, and atmospheric FX
export function renderMotionFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: number, // 0.0 to 1.0 progress
  width: number,
  height: number,
  motion: ImageToVideoMotion,
  speedMultiplier: number,
  atmosphere: ImageToVideoAtmosphere,
  particles: Particle[],
  flowVectors?: FlowVector[],
  promptFidelity = 0.9,
  zDepthMove = 1.5,
  perspectiveIntensity = 50
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background fill
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  const easedT = easeInOutCubic(t);
  const speed = Math.max(0.2, Math.min(3.0, speedMultiplier));

  // Compute camera transforms with 3D depth and perspective scaling
  const zFactor = 1.0 + (zDepthMove * 0.07) * easedT * speed;
  const fovRatio = perspectiveIntensity / 50.0;
  const depthScale = Math.max(0.3, zFactor) * (1.0 + (fovRatio - 1.0) * 0.1 * easedT);

  let scale = 1.0 * depthScale;
  let translateX = 0;
  let translateY = 0;
  let rotation = 0;

  switch (motion) {
    case 'zoom-in': {
      scale = (1.0 + 0.28 * easedT * speed) * depthScale;
      break;
    }
    case 'zoom-out': {
      scale = 1.28 - 0.28 * easedT * speed;
      break;
    }
    case 'pan-right': {
      scale = 1.18;
      translateX = (-0.06 + 0.12 * easedT * speed) * width;
      break;
    }
    case 'pan-left': {
      scale = 1.18;
      translateX = (0.06 - 0.12 * easedT * speed) * width;
      break;
    }
    case 'tilt-up': {
      scale = 1.18;
      translateY = (0.06 - 0.12 * easedT * speed) * height;
      break;
    }
    case 'tilt-down': {
      scale = 1.18;
      translateY = (-0.06 + 0.12 * easedT * speed) * height;
      break;
    }
    case 'orbit': {
      scale = 1.22;
      const angle = (-0.04 + 0.08 * Math.sin(t * Math.PI)) * speed;
      rotation = angle;
      translateX = Math.sin(t * Math.PI * 2) * 18 * speed;
      translateY = Math.cos(t * Math.PI * 2) * 12 * speed;
      break;
    }
    case 'dolly-zoom': {
      scale = 1.35 - 0.22 * Math.sin(t * Math.PI) * speed;
      translateX = Math.sin(t * Math.PI) * 10 * speed;
      break;
    }
    case 'ambient-flow': {
      scale = 1.04 + 0.05 * Math.sin(t * Math.PI * 2) * speed;
      translateX = Math.sin(t * Math.PI * 2) * 14 * speed;
      translateY = Math.cos(t * Math.PI * 2) * 8 * speed;
      break;
    }
    case 'static-glamour':
    default: {
      scale = 1.03 + 0.015 * Math.sin(t * Math.PI);
      break;
    }
  }

  // Factor in prompt flow vectors if present (steered camera offset & organic drift)
  if (flowVectors && flowVectors.length > 0) {
    let flowShiftX = 0;
    let flowShiftY = 0;
    for (const fv of flowVectors) {
      if (fv.category === 'camera' || fv.category === 'subject') {
        flowShiftX += fv.dx * fv.intensity * 12 * easedT * promptFidelity;
        flowShiftY += fv.dy * fv.intensity * 12 * easedT * promptFidelity;
      }
    }
    translateX += flowShiftX;
    translateY += flowShiftY;
  }

  // Draw image with cover aspect ratio & transforms centered
  ctx.save();
  ctx.translate(width / 2 + translateX, height / 2 + translateY);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  ctx.scale(scale, scale);

  // Compute cover dimensions
  const imgAspect = img.width / img.height;
  const canvasAspect = width / height;
  let drawW = width;
  let drawH = height;

  if (imgAspect > canvasAspect) {
    drawH = height;
    drawW = height * imgAspect;
  } else {
    drawW = width;
    drawH = width / imgAspect;
  }

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Render VidsCraft Neural Flow Vector Displacement Passes
  if (flowVectors && flowVectors.length > 0) {
    renderFlowVectorDynamics(ctx, flowVectors, width, height, t, promptFidelity);
  }

  // Subtle vignette for cinematic depth
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Render Atmosphere / Particle Pass
  if (atmosphere !== 'none' && particles.length > 0) {
    renderAtmospherePass(ctx, atmosphere, particles, width, height, t);
  }

  ctx.restore();
}

// VidsCraft Dynamic Vector Render Pass (Fluid Ripples, Wind Streaks, Light Flares)
function renderFlowVectorDynamics(
  ctx: CanvasRenderingContext2D,
  flowVectors: FlowVector[],
  width: number,
  height: number,
  t: number,
  promptFidelity: number
) {
  for (const fv of flowVectors) {
    const originX = fv.x * width;
    const originY = fv.y * height;
    const effSpeed = fv.speed || 1.0;
    const effIntensity = (fv.intensity || 0.7) * promptFidelity;

    ctx.save();

    if (fv.category === 'water') {
      // Dynamic fluid ripples propagating along (dx, dy)
      const ripplePhase = (t * effSpeed * 3) % 1;
      const waveRadius = 30 + ripplePhase * 90;
      const rippleAlpha = (1 - ripplePhase) * 0.28 * effIntensity;

      const rippleGrad = ctx.createRadialGradient(
        originX + fv.dx * ripplePhase * 40,
        originY + fv.dy * ripplePhase * 40,
        waveRadius * 0.3,
        originX + fv.dx * ripplePhase * 40,
        originY + fv.dy * ripplePhase * 40,
        waveRadius
      );
      rippleGrad.addColorStop(0, `rgba(186, 230, 253, ${rippleAlpha * 0.6})`);
      rippleGrad.addColorStop(0.7, `rgba(56, 189, 248, ${rippleAlpha})`);
      rippleGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

      ctx.fillStyle = rippleGrad;
      ctx.beginPath();
      ctx.ellipse(
        originX + fv.dx * ripplePhase * 35,
        originY + fv.dy * ripplePhase * 35,
        waveRadius,
        waveRadius * 0.45,
        Math.atan2(fv.dy, fv.dx),
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (fv.category === 'light') {
      // Volumetric light emanation & flare pulse
      const flarePulse = 0.4 + 0.3 * Math.sin(t * effSpeed * Math.PI * 2);
      const flareGrad = ctx.createRadialGradient(
        originX,
        originY,
        10,
        originX + fv.dx * 60,
        originY + fv.dy * 60,
        180 * effIntensity
      );
      flareGrad.addColorStop(0, `rgba(254, 240, 138, ${flarePulse * 0.35 * effIntensity})`);
      flareGrad.addColorStop(0.5, `rgba(251, 191, 36, ${flarePulse * 0.15 * effIntensity})`);
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (fv.category === 'wind') {
      // Wind streaks along (dx, dy)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * effIntensity})`;
      ctx.lineWidth = 1.5;
      for (let w = 0; w < 3; w++) {
        const offsetT = (t * effSpeed * 1.5 + w * 0.33) % 1;
        const startX = originX - 40 + w * 25 + fv.dx * offsetT * 120;
        const startY = originY - 20 + w * 18 + fv.dy * offsetT * 120;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + fv.dx * 35, startY + fv.dy * 35);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// VidsCraft Visual Motion Vectors Overlay (Draws glowing vector field onto preview)
export function drawFlowVectorOverlay(
  ctx: CanvasRenderingContext2D,
  flowVectors: FlowVector[],
  width: number,
  height: number,
  activeVectorId?: string | null
) {
  if (!flowVectors || flowVectors.length === 0) return;

  ctx.save();

  // Draw vector arrows
  for (const fv of flowVectors) {
    const isActive = activeVectorId === fv.id;
    const originX = fv.x * width;
    const originY = fv.y * height;
    const arrowLength = 55 * Math.max(0.5, fv.speed || 1);
    const targetX = originX + fv.dx * arrowLength;
    const targetY = originY + fv.dy * arrowLength;

    const categoryColors: Record<string, string> = {
      water: '#38bdf8', // sky-400
      wind: '#34d399', // emerald-400
      subject: '#a855f7', // purple-500
      camera: '#f59e0b', // amber-500
      light: '#fde047', // yellow-300
      particles: '#ec4899', // pink-500
    };
    const color = categoryColors[fv.category] || '#60a5fa';

    // Outer glow for active vector
    if (isActive) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
    }

    // Main vector arrow body
    ctx.strokeStyle = color;
    ctx.lineWidth = isActive ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(targetY - originY, targetX - originX);
    const headLen = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLen * Math.cos(angle - Math.PI / 6),
      targetY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      targetX - headLen * Math.cos(angle + Math.PI / 6),
      targetY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Circular anchor point
    ctx.beginPath();
    ctx.arc(originX, originY, isActive ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#ffffff' : color;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label badge
    const badgeText = fv.label || fv.category;
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    const textMetrics = ctx.measureText(badgeText);
    const badgeWidth = textMetrics.width + 14;
    const badgeHeight = 18;
    const badgeX = originX - badgeWidth / 2;
    const badgeY = originY - 22;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, badgeX + 7, badgeY + 13);
  }

  ctx.restore();
}

function renderAtmospherePass(
  ctx: CanvasRenderingContext2D,
  atmosphere: ImageToVideoAtmosphere,
  particles: Particle[],
  width: number,
  height: number,
  t: number
) {
  ctx.save();

  if (atmosphere === 'rain') {
    ctx.strokeStyle = 'rgba(210, 230, 255, 0.55)';
    ctx.lineWidth = 1.2;
    for (const p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y > height) {
        p.y = -20;
        p.x = Math.random() * (width + 100);
      }
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 2.5, p.y + p.speedY * 2.5);
      ctx.stroke();
    }
  } else if (atmosphere === 'embers') {
    for (const p of particles) {
      p.x += p.speedX + Math.sin(p.y * 0.05 + t * 10) * 0.6;
      p.y += p.speedY;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      const alpha = p.opacity * (0.6 + 0.4 * Math.sin(t * 15 + p.x));
      ctx.fillStyle = p.color || '#f59e0b';
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (atmosphere === 'dust-particles') {
    for (const p of particles) {
      p.x += p.speedX + Math.sin(t * 4 + p.y * 0.02) * 0.4;
      p.y += p.speedY;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = p.opacity * 0.65;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (atmosphere === 'god-rays') {
    const rayPulse = 0.25 + 0.15 * Math.sin(t * Math.PI * 2);
    const rayGradient = ctx.createLinearGradient(0, 0, width, height);
    rayGradient.addColorStop(0, `rgba(254, 240, 138, ${rayPulse})`);
    rayGradient.addColorStop(0.5, `rgba(251, 191, 36, ${rayPulse * 0.6})`);
    rayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rayGradient;
    ctx.fillRect(0, 0, width, height);
  } else if (atmosphere === 'sakura-petals') {
    for (const p of particles) {
      p.x += p.speedX + Math.sin(t * 5 + p.y * 0.03) * 1.5;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;
      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color || '#f472b6';
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (atmosphere === 'cyber-glitch') {
    const scanlineY = (t * 800) % height;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fillRect(0, scanlineY, width, 4);

    if (Math.sin(t * 40) > 0.88) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
      ctx.fillRect(0, Math.random() * height, width, 18);
    }
  } else if (atmosphere === 'anamorphic-flare') {
    const flareX = width * (0.2 + 0.6 * t);
    const flareY = height * 0.45;
    const flareGrad = ctx.createLinearGradient(
      flareX - width * 0.45,
      flareY,
      flareX + width * 0.45,
      flareY
    );
    flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flareGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
    flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, flareY - 3, width, 6);
  }

  ctx.restore();
}

// Convert image URL / Base64 into HTMLImageElement
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) =>
      reject(new Error('Failed to load image for video rendering: ' + String(err)));
    img.src = src;
  });
}

// Full video generation and encoding to true WebM/MP4 video file
export async function generateImageToVideo(
  options: RenderOptions
): Promise<RenderResult> {
  const {
    sourceImage,
    motion,
    motionSpeed,
    atmosphere,
    aspectRatio,
    duration,
    fps = 30,
    flowVectors,
    promptFidelity = 0.9,
    audioUrl,
    zDepthMove = 1.5,
    perspectiveIntensity = 50,
    onProgress,
  } = options;

  const img = await loadImage(sourceImage);
  const dims = getDimensionsForAspect(aspectRatio, 'fhd');
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Could not obtain 2D canvas context for video encoding');
  }

  const particleCount =
    atmosphere === 'rain'
      ? 120
      : atmosphere === 'embers'
      ? 65
      : atmosphere === 'sakura-petals'
      ? 35
      : 45;
  const particles = initParticles(
    particleCount,
    dims.width,
    dims.height,
    atmosphere,
    flowVectors
  );

  // Setup MediaStream from canvas
  const canvasStream = canvas.captureStream(fps);
  let finalStream: MediaStream = canvasStream;
  let audioContext: AudioContext | null = null;
  let audioSourceNode: AudioBufferSourceNode | null = null;

  // Optional audio track integration
  if (audioUrl) {
    try {
      audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const resp = await fetch(audioUrl);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuf);

      const dest = audioContext.createMediaStreamDestination();
      audioSourceNode = audioContext.createBufferSource();
      audioSourceNode.buffer = audioBuffer;
      audioSourceNode.loop = true;
      audioSourceNode.connect(dest);

      // Combine video tracks with audio tracks
      finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
    } catch (audioErr) {
      console.warn('Audio sync skipped during video render:', audioErr);
    }
  }

  // Determine best supported recorder format
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  let chosenMime = 'video/webm';
  for (const mime of mimeTypes) {
    if (
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported(mime)
    ) {
      chosenMime = mime;
      break;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const recorder = new MediaRecorder(finalStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 8000000, // 8 Mbps high-clarity video
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          if (audioSourceNode) {
            try {
              audioSourceNode.stop();
            } catch {}
          }
          if (audioContext && audioContext.state !== 'closed') {
            try {
              audioContext.close();
            } catch {}
          }
          finalStream.getTracks().forEach((track) => track.stop());

          const blob = new Blob(chunks, { type: chosenMime });
          const videoUrl = URL.createObjectURL(blob);

          resolve({
            videoBlob: blob,
            videoUrl,
            duration,
            width: dims.width,
            height: dims.height,
            mimeType: chosenMime,
          });
        } catch (stopErr) {
          reject(stopErr);
        }
      };

      recorder.onerror = (e) => {
        reject(new Error('MediaRecorder encountered an error: ' + String(e)));
      };

      recorder.start(100); // chunk every 100ms
      if (audioSourceNode) {
        audioSourceNode.start(0);
      }

      const totalFrames = Math.round(duration * fps);
      let frameIndex = 0;
      const frameIntervalMs = 1000 / fps;

      const renderNext = () => {
        if (frameIndex >= totalFrames) {
          if (onProgress) onProgress(100);
          recorder.stop();
          return;
        }

        const t = frameIndex / (totalFrames - 1 || 1);
        renderMotionFrame(
          ctx,
          img,
          t,
          dims.width,
          dims.height,
          motion,
          motionSpeed,
          atmosphere,
          particles,
          flowVectors,
          promptFidelity,
          zDepthMove,
          perspectiveIntensity
        );

        if (onProgress && frameIndex % 5 === 0) {
          const pct = Math.min(99, Math.round((frameIndex / totalFrames) * 100));
          onProgress(pct);
        }

        frameIndex++;
        setTimeout(renderNext, frameIntervalMs);
      };

      renderNext();
    } catch (recErr) {
      reject(recErr);
    }
  });
}

// Multi-Scene Storyboard Sequence Video Generator
export async function generateMultiSceneVideo(options: {
  scenes: import('../types/imageToVideo').StoryboardScene[];
  aspectRatio: import('../types/imageToVideo').ImageToVideoAspectRatio;
  fps?: number;
  audioUrl?: string;
  onProgress?: (percent: number, currentSceneIndex: number, totalScenes: number) => void;
}): Promise<RenderResult> {
  const { scenes, aspectRatio, fps = 30, audioUrl, onProgress } = options;

  if (scenes.length === 0) {
    throw new Error('At least one storyboard scene is required to generate a video');
  }

  // Pre-load all scene images
  const loadedImages: HTMLImageElement[] = [];
  for (const scene of scenes) {
    const img = await loadImage(scene.image);
    loadedImages.push(img);
  }

  const dims = getDimensionsForAspect(aspectRatio, 'fhd');
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Could not obtain canvas context for multi-scene rendering');
  }

  const canvasStream = canvas.captureStream(fps);
  let finalStream: MediaStream = canvasStream;
  let audioContext: AudioContext | null = null;
  let audioSourceNode: AudioBufferSourceNode | null = null;

  if (audioUrl) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const resp = await fetch(audioUrl);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuf);

      const dest = audioContext.createMediaStreamDestination();
      audioSourceNode = audioContext.createBufferSource();
      audioSourceNode.buffer = audioBuffer;
      audioSourceNode.loop = true;
      audioSourceNode.connect(dest);

      finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
    } catch (audioErr) {
      console.warn('Audio sync skipped in multi-scene render:', audioErr);
    }
  }

  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  let chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  return new Promise((resolve, reject) => {
    try {
      const recorder = new MediaRecorder(finalStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 10_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

      recorder.onstop = () => {
        try {
          if (audioSourceNode) {
            audioSourceNode.stop();
            audioSourceNode.disconnect();
          }
          if (audioContext) audioContext.close();
          finalStream.getTracks().forEach((track) => track.stop());

          const blob = new Blob(chunks, { type: chosenMime });
          const videoUrl = URL.createObjectURL(blob);

          resolve({
            videoBlob: blob,
            videoUrl,
            duration: totalDuration,
            width: dims.width,
            height: dims.height,
            mimeType: chosenMime,
          });
        } catch (stopErr) {
          reject(stopErr);
        }
      };

      recorder.onerror = (e) => reject(new Error('Recorder error: ' + String(e)));

      recorder.start(100);
      if (audioSourceNode) audioSourceNode.start(0);

      let currentSceneIdx = 0;
      let frameInScene = 0;
      let overallFrameIndex = 0;
      const totalFramesAllScenes = Math.round(totalDuration * fps);
      const frameIntervalMs = 1000 / fps;

      const particles = initParticles(50, dims.width, dims.height, 'dust-particles');

      const renderNextMultiFrame = () => {
        if (currentSceneIdx >= scenes.length) {
          if (onProgress) onProgress(100, scenes.length, scenes.length);
          recorder.stop();
          return;
        }

        const scene = scenes[currentSceneIdx];
        const sceneImg = loadedImages[currentSceneIdx];
        const sceneTotalFrames = Math.round(scene.duration * fps);
        const t = frameInScene / (sceneTotalFrames - 1 || 1);

        // 1. Render base scene motion
        renderMotionFrame(
          ctx,
          sceneImg,
          t,
          dims.width,
          dims.height,
          scene.motion,
          1.0,
          scene.atmosphere,
          particles,
          [],
          0.9,
          scene.zDepthMove ?? 1.5,
          scene.perspectiveIntensity ?? 50
        );

        // 2. Handle scene transitions near end of scene (last 15 frames)
        const transitionFrames = Math.min(15, Math.floor(sceneTotalFrames * 0.2));
        if (
          currentSceneIdx < scenes.length - 1 &&
          frameInScene >= sceneTotalFrames - transitionFrames
        ) {
          const transProgress =
            (frameInScene - (sceneTotalFrames - transitionFrames)) / transitionFrames;
          const nextImg = loadedImages[currentSceneIdx + 1];

          if (scene.transition === 'cross-dissolve' && nextImg) {
            ctx.globalAlpha = transProgress;
            ctx.drawImage(nextImg, 0, 0, dims.width, dims.height);
            ctx.globalAlpha = 1.0;
          } else if (scene.transition === 'fade-black') {
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = Math.sin(transProgress * Math.PI);
            ctx.fillRect(0, 0, dims.width, dims.height);
            ctx.globalAlpha = 1.0;
          } else if (scene.transition === 'slide-left' && nextImg) {
            const slideOffset = (1 - transProgress) * dims.width;
            ctx.drawImage(nextImg, slideOffset, 0, dims.width, dims.height);
          }
        }

        // 3. Render Lower Third headline overlay if enabled
        if (scene.lowerThird?.enabled) {
          ctx.save();
          const margin = dims.width * 0.04;
          const boxWidth = dims.width * 0.45;
          const boxHeight = dims.height * 0.12;
          const boxY =
            scene.lowerThird.position === 'top-banner'
              ? margin
              : dims.height - boxHeight - margin;
          const boxX =
            scene.lowerThird.position === 'center'
              ? (dims.width - boxWidth) / 2
              : margin;

          // Gradient backdrop
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
          ctx.fill();

          // Accent bar
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(boxX, boxY, 6, boxHeight);

          // Texts
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(dims.height * 0.032)}px system-ui, sans-serif`;
          ctx.fillText(
            scene.lowerThird.headline,
            boxX + 24,
            boxY + boxHeight * 0.48,
            boxWidth - 40
          );

          ctx.fillStyle = '#a1a1aa';
          ctx.font = `500 ${Math.round(dims.height * 0.02)}px system-ui, sans-serif`;
          ctx.fillText(
            scene.lowerThird.subheadline,
            boxX + 24,
            boxY + boxHeight * 0.82,
            boxWidth - 40
          );
          ctx.restore();
        }

        // Progress update
        overallFrameIndex++;
        if (onProgress && overallFrameIndex % 6 === 0) {
          const overallPct = Math.min(
            99,
            Math.round((overallFrameIndex / totalFramesAllScenes) * 100)
          );
          onProgress(overallPct, currentSceneIdx + 1, scenes.length);
        }

        frameInScene++;
        if (frameInScene >= sceneTotalFrames) {
          frameInScene = 0;
          currentSceneIdx++;
        }

        setTimeout(renderNextMultiFrame, frameIntervalMs);
      };

      renderNextMultiFrame();
    } catch (recErr) {
      reject(recErr);
    }
  });
}

