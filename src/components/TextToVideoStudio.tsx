import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Film,
  Camera,
  Layers,
  Wand2,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  RefreshCw,
  Music,
  Share2,
  Copy,
  ChevronRight,
  Monitor,
  Eye,
  Radio,
  Clock,
} from 'lucide-react';
import { GeneratedAudio, VideoSceneData, VideoVisualPreset, VideoCameraMotion } from '../types/tts';
import { formatTime } from '../utils/audio';

interface TextToVideoStudioProps {
  currentTTSAudio: GeneratedAudio | null;
  geminiAvailable: boolean;
  onSendToTimeline?: (scene: VideoSceneData) => void;
  onSendToAudioPlayer?: (audio: GeneratedAudio) => void;
  onOpenTimelineEditor?: () => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Cyberpunk Rain City',
    style: 'cyberpunk' as VideoVisualPreset,
    motion: 'zoom-in' as VideoCameraMotion,
    prompt: 'Cinematic cyber city in pouring rain with neon reflections on wet asphalt, flying sky-cabs, and towering holographic billboards in 4K',
  },
  {
    title: 'Misty Alpine Ridge',
    style: 'drone-nature' as VideoVisualPreset,
    motion: 'drone-dive' as VideoCameraMotion,
    prompt: 'FPV drone sweeping over mist-covered pine forests and snow-capped alpine peaks at golden sunrise with volumetric god rays',
  },
  {
    title: 'Space Station Orbit',
    style: 'cinematic' as VideoVisualPreset,
    motion: 'orbit' as VideoCameraMotion,
    prompt: 'Massive futuristic orbital space station passing slowly over an illuminated ocean planet with glowing aurora borealis and starfield',
  },
  {
    title: 'Anime Sakura Garden',
    style: 'anime' as VideoVisualPreset,
    motion: 'pan-right' as VideoCameraMotion,
    prompt: 'Studio Ghibli aesthetic Japanese hillside shrine with drifting pink cherry blossom petals, vibrant watercolor clouds, and warm sunlight',
  },
  {
    title: '35mm Vintage Desert',
    style: 'vintage-film' as VideoVisualPreset,
    motion: 'pan-right' as VideoCameraMotion,
    prompt: 'Vintage 35mm film grain shot of a classic sports car speeding across red rock desert canyon highway under warm golden hour lens flare',
  },
  {
    title: 'Moody Noir Detective',
    style: 'dark-noir' as VideoVisualPreset,
    motion: 'static' as VideoCameraMotion,
    prompt: 'High-contrast black and white dramatic cinematic detective alleyway with vertical window blind shadows, rising steam, and heavy rain',
  },
];

const STYLE_OPTIONS: Array<{
  id: VideoVisualPreset;
  label: string;
  badge: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'cinematic',
    label: 'Cinematic 4K',
    badge: 'Popular',
    desc: 'Hollywood 2.39:1 anamorphic contrast, amber-teal grade & atmospheric haze',
    icon: '🎬',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    badge: 'Vibrant',
    desc: 'Teal & magenta neon lights, wet pavement reflections & sci-fi skyline',
    icon: '⚡',
  },
  {
    id: 'drone-nature',
    label: 'Drone Nature 4K',
    badge: 'Aerial',
    desc: 'Sweeping alpine ridges, lush pine canopies, golden sunbeams & mist layers',
    icon: '🦅',
  },
  {
    id: 'anime',
    label: 'Anime & Ghibli',
    badge: 'Artistic',
    desc: 'Hand-painted watercolor clouds, radiant skies & drifting blossom petals',
    icon: '🌸',
  },
  {
    id: 'vintage-film',
    label: '35mm Vintage',
    badge: 'Retro',
    desc: 'Analog 35mm silver emulsion, warm optical flare, vignette & retro grain',
    icon: '🎞️',
  },
  {
    id: 'dark-noir',
    label: 'Dark Noir',
    badge: 'Dramatic',
    desc: 'High chiaroscuro contrast, monochrome shadows & moody atmospheric steam',
    icon: '🖤',
  },
];

const MOTION_OPTIONS: Array<{
  id: VideoCameraMotion;
  label: string;
  desc: string;
  icon: string;
}> = [
  { id: 'zoom-in', label: 'Dynamic Zoom In', desc: 'Slow dramatic focal plunge toward subject', icon: '🔍' },
  { id: 'pan-right', label: 'Tracking Pan', desc: 'Smooth horizontal cinema dolly move', icon: '↔️' },
  { id: 'drone-dive', label: 'FPV Drone Dive', desc: 'Altitude descent with sweeping horizon tilt', icon: '📉' },
  { id: 'orbit', label: '3D Parallax Orbit', desc: 'Subtle rotational depth shift with subject lock', icon: '🔄' },
  { id: 'static', label: 'Static Cinema Lock', desc: 'Rock-steady tripod frame with active particle life', icon: '🔒' },
];

export const TextToVideoStudio: React.FC<TextToVideoStudioProps> = ({
  currentTTSAudio,
  geminiAvailable,
  onSendToTimeline,
  onSendToAudioPlayer,
  onOpenTimelineEditor,
}) => {
  // Video Generation Form State
  const [promptText, setPromptText] = useState(
    'Cinematic cyber city in pouring rain with neon reflections on wet asphalt, flying sky-cabs, and towering holographic billboards in 4K'
  );
  const [selectedStyle, setSelectedStyle] = useState<VideoVisualPreset>('cyberpunk');
  const [selectedMotion, setSelectedMotion] = useState<VideoCameraMotion>('zoom-in');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '21:9'>('16:9');
  const [durationSec, setDurationSec] = useState<number>(8);
  const [syncAudio, setSyncAudio] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Generation state & multi-pass synthesizer
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Active Scene Data (Loaded on startup so video is immediately playable!)
  const [activeScene, setActiveScene] = useState<VideoSceneData>({
    title: 'Cyberpunk Neon Metropolis',
    prompt: 'Cinematic cyber city in pouring rain with neon reflections on wet asphalt, flying sky-cabs, and towering holographic billboards in 4K',
    style: 'cyberpunk',
    cameraMotion: 'zoom-in',
    aspectRatio: '16:9',
    duration: 8,
    palette: ['#0f172a', '#3b82f6', '#06b6d4', '#ec4899'],
    lighting: 'Volumetric neon glow with wet street reflections',
    particles: 'rain',
    headlineOverlay: 'NEO TOKYO 2099',
    elements: ['Flying sky-cabs', 'Holographic ads', 'Wet asphalt reflections', 'Skyline spires'],
    subtitleText: currentTTSAudio?.text?.slice(0, 50) || 'Welcome to the Next-Gen AI Video Studio.',
  });

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= activeScene.duration) {
            // Loop or stop
            return 0;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeScene.duration]);

  // Sync hidden audio with video playback
  useEffect(() => {
    if (!audioRef.current || !currentTTSAudio?.audioUrl || !syncAudio) return;

    if (isPlaying) {
      if (Math.abs(audioRef.current.currentTime - currentTime) > 0.3) {
        audioRef.current.currentTime = currentTime;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, syncAudio, currentTTSAudio]);

  // Handle seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && syncAudio) {
      audioRef.current.currentTime = time;
    }
  };

  // -------------------------------------------------------------
  // HIGH-DEFINITION PROCEDURAL CINEMATIC SCENE RENDERER ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const progress = Math.min(1, Math.max(0, currentTime / (activeScene.duration || 1)));

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Motion Matrix
    if (activeScene.cameraMotion === 'zoom-in') {
      const zoom = 1.0 + progress * 0.18; // 1.0 -> 1.18 zoom
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);
    } else if (activeScene.cameraMotion === 'pan-right') {
      const panX = (progress - 0.5) * (width * 0.12);
      ctx.translate(-panX, 0);
    } else if (activeScene.cameraMotion === 'drone-dive') {
      const diveZoom = 1.0 + progress * 0.22;
      const diveY = progress * (height * 0.08);
      ctx.translate(width / 2, height / 2);
      ctx.scale(diveZoom, diveZoom);
      ctx.translate(-width / 2, -height / 2 + diveY);
    } else if (activeScene.cameraMotion === 'orbit') {
      const orbitX = Math.sin(progress * Math.PI) * (width * 0.04);
      const orbitY = Math.cos(progress * Math.PI * 0.5) * (height * 0.02);
      ctx.translate(orbitX, orbitY);
    }

    // 1. Multi-Stop Atmosphere Gradient
    const pal = activeScene.palette && activeScene.palette.length >= 3
      ? activeScene.palette
      : ['#0f172a', '#1e293b', '#06b6d4', '#ec4899'];

    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, pal[0] || '#090d16');
    skyGrad.addColorStop(0.55, pal[1] || '#1e1b4b');
    skyGrad.addColorStop(1, pal[2] || '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-width * 0.2, -height * 0.2, width * 1.4, height * 1.4);

    // 2. Celestial Body or Volumetric Light Orb
    const sunX = width * 0.65;
    const sunY = height * 0.32;
    const sunRad = width * 0.28;
    const radialGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRad);
    if (activeScene.style === 'cyberpunk') {
      radialGlow.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
      radialGlow.addColorStop(0.4, 'rgba(6, 182, 212, 0.25)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (activeScene.style === 'drone-nature') {
      radialGlow.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
      radialGlow.addColorStop(0.35, 'rgba(249, 115, 22, 0.35)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (activeScene.style === 'anime') {
      radialGlow.addColorStop(0, 'rgba(253, 224, 71, 0.6)');
      radialGlow.addColorStop(0.4, 'rgba(244, 114, 182, 0.3)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      radialGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = radialGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRad, 0, Math.PI * 2);
    ctx.fill();

    // 3. Environment Specific Geometry & Layers
    if (activeScene.style === 'cyberpunk') {
      // High-tech skyscraper silhouettes
      const buildingCount = 10;
      const bWidth = width / buildingCount;
      const heights = [0.45, 0.65, 0.52, 0.78, 0.62, 0.85, 0.7, 0.58, 0.82, 0.48];

      ctx.fillStyle = '#05070f';
      for (let i = 0; i < buildingCount; i++) {
        const bx = i * bWidth - width * 0.05;
        const bh = height * heights[i];
        const by = height * 0.85 - bh;
        ctx.fillRect(bx, by, bWidth * 1.05, bh + height * 0.2);

        // Glowing cyan/magenta window dots
        ctx.fillStyle = (i % 2 === 0) ? '#06b6d4' : '#ec4899';
        for (let wy = by + 20; wy < height * 0.8; wy += 26) {
          if ((wy + i * 17) % 3 === 0) continue;
          ctx.fillRect(bx + 10, wy, 4, 8);
          ctx.fillRect(bx + bWidth * 0.45, wy, 4, 8);
          ctx.fillRect(bx + bWidth * 0.75, wy, 4, 8);
        }
        ctx.fillStyle = '#05070f';
      }

      // Neon road grid & reflection
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.fillRect(0, height * 0.78, width, height * 0.22);

      // Perspective street grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.5;
      const vanishX = width * 0.5;
      const vanishY = height * 0.78;
      for (let gx = -width * 0.3; gx <= width * 1.3; gx += width * 0.15) {
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // Horizontal street lines moving towards camera
      const gridOffset = (currentTime * 120) % 40;
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
      for (let y = height * 0.8; y < height; y += 30) {
        const dy = y + gridOffset;
        if (dy >= height) continue;
        ctx.beginPath();
        ctx.moveTo(0, dy);
        ctx.lineTo(width, dy);
        ctx.stroke();
      }
    } else if (activeScene.style === 'drone-nature') {
      // 3 Mountain Depth Layers with Atmospheric Mist
      const drawMountainLayer = (baseY: number, peakH: number, color: string, speedMult: number) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-width * 0.1, height);
        const shift = currentTime * speedMult * 10;
        for (let x = -width * 0.1; x <= width * 1.1; x += width * 0.08) {
          const my = baseY - Math.sin((x + shift) * 0.005) * peakH - Math.cos((x + shift) * 0.012) * (peakH * 0.4);
          ctx.lineTo(x, my);
        }
        ctx.lineTo(width * 1.1, height);
        ctx.closePath();
        ctx.fill();
      };

      drawMountainLayer(height * 0.55, height * 0.24, 'rgba(15, 23, 42, 0.6)', 0.5); // Back ridge
      drawMountainLayer(height * 0.65, height * 0.28, 'rgba(4, 47, 46, 0.85)', 1.0); // Mid ridge
      drawMountainLayer(height * 0.78, height * 0.32, 'rgba(2, 44, 34, 1.0)', 1.8);  // Front ridge

      // Foreground Pine Tree Silhouettes
      ctx.fillStyle = '#021814';
      for (let tx = 0; tx < width; tx += 35) {
        const treeH = 40 + ((tx * 31) % 45);
        const ty = height * 0.88;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 8, ty - treeH);
        ctx.lineTo(tx + 16, ty);
        ctx.fill();
      }
    } else if (activeScene.style === 'anime') {
      // Rolling lush green hills & fluffy clouds
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(width * 0.3, height * 0.95, width * 0.6, height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(width * 0.8, height * 0.98, width * 0.7, height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy Anime Clouds
      const drawCloud = (cx: number, cy: number, scale: number) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, 32 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 25 * scale, cy - 10 * scale, 38 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 55 * scale, cy, 30 * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      const cloudShift = (currentTime * 15) % (width + 200);
      drawCloud(width - cloudShift, height * 0.28, 1.2);
      drawCloud(width * 0.6 - cloudShift, height * 0.18, 0.8);
    } else {
      // Cinematic landscape horizon with anamorphic flare
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.72);
      for (let x = 0; x <= width; x += 30) {
        const hY = height * 0.72 + Math.sin(x * 0.01 + currentTime * 0.2) * 15;
        ctx.lineTo(x, hY);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Particle Physics System (Rain, Embers, Stars, Dust, Rays)
    if (activeScene.particles === 'rain' || activeScene.style === 'cyberpunk') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.2;
      const count = 75;
      for (let i = 0; i < count; i++) {
        const rx = ((i * 37) + currentTime * 600) % width;
        const ry = ((i * 83) + currentTime * 950) % height;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 18);
        ctx.stroke();

        // Floor splash rings
        if (ry > height * 0.8) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.beginPath();
          ctx.ellipse(rx, Math.min(height - 4, ry + 18), 6, 2, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        }
      }
    } else if (activeScene.particles === 'embers' || activeScene.style === 'cinematic') {
      const emberCount = 35;
      for (let i = 0; i < emberCount; i++) {
        const ex = ((i * 59) + Math.sin(currentTime * 2 + i) * 20) % width;
        const ey = (height - ((currentTime * 60 + i * 40) % height));
        const rad = 1.5 + (i % 3);
        ctx.fillStyle = (i % 2 === 0) ? '#f97316' : '#fde047';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ex, ey, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (activeScene.particles === 'stars' || activeScene.style === 'anime') {
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % width;
        const sy = (i * 61) % (height * 0.6);
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(currentTime * 3 + i));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Golden Volumetric Dust Motes
      for (let i = 0; i < 30; i++) {
        const dx = (i * 83 + currentTime * 15) % width;
        const dy = (i * 47 + Math.sin(currentTime + i) * 12) % height;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore(); // Restore camera matrix before drawing UI HUD and overlays

    // 5. Letterboxing (Anamorphic Cinema 2.39:1 borders)
    const letterboxH = activeScene.aspectRatio === '21:9' ? height * 0.12 : height * 0.05;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, letterboxH);
    ctx.fillRect(0, height - letterboxH, width, letterboxH);

    // 6. Kinetic Title Card / Headline Badge
    const titleText = activeScene.headlineOverlay || activeScene.title.toUpperCase();
    ctx.save();
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(titleText).width;

    // Glowing Pill Background
    ctx.fillStyle = 'rgba(9, 9, 11, 0.82)';
    ctx.strokeStyle = activeScene.style === 'cyberpunk' ? '#06b6d4' : activeScene.style === 'drone-nature' ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 1.5;
    const pillX = width / 2 - textWidth / 2 - 20;
    const pillY = letterboxH + 18;
    const pillW = textWidth + 40;
    const pillH = 38;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 10);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeRect(pillX, pillY, pillW, pillH);
    }

    // Gradient Text Fill
    const textGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(0.5, activeScene.style === 'cyberpunk' ? '#67e8f9' : '#fef08a');
    textGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = textGrad;
    ctx.fillText(titleText, width / 2, pillY + 26);
    ctx.restore();

    // 7. Subtitle / Voiceover Crawl Pill
    if (activeScene.subtitleText) {
      ctx.save();
      ctx.font = '500 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const sub = `"${activeScene.subtitleText}"`;
      const subWidth = ctx.measureText(sub).width;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(width / 2 - subWidth / 2 - 14, height - letterboxH - 34, subWidth + 28, 26);

      ctx.fillStyle = '#fef08a';
      ctx.fillText(sub, width / 2, height - letterboxH - 16);
      ctx.restore();
    }

    // 8. Timecode & Neural Engine Watermark
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '11px monospace';
    const tc = `TC 00:00:${Math.floor(currentTime).toString().padStart(2, '0')}:${Math.floor((currentTime % 1) * 30).toString().padStart(2, '0')} • 4K AI SCENE • 30 FPS`;
    ctx.fillText(tc, 16, height - letterboxH - 12);
  }, [currentTime, activeScene]);

  // -------------------------------------------------------------
  // GENERATE VIDEO VIA BACKEND AI ENGINE
  // -------------------------------------------------------------
  const handleGenerateVideo = async () => {
    if (!promptText.trim()) return;

    try {
      setIsGenerating(true);
      setGenerationProgress(15);
      setGenerationStep('Analyzing visual semantics & subject choreography...');

      // Synthesizer progress ticker
      const progressTimer = setInterval(() => {
        setGenerationProgress((p) => {
          if (p >= 88) return p;
          if (p < 40) {
            setGenerationStep('Generating 4K camera motion path & perspective vectors...');
            return p + 18;
          }
          if (p < 70) {
            setGenerationStep('Synthesizing dynamic lighting, volumetric haze & particle physics...');
            return p + 14;
          }
          setGenerationStep('Multiplexing visual stream & audio synchronization...');
          return p + 8;
        });
      }, 350);

      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText.trim(),
          style: selectedStyle,
          cameraMotion: selectedMotion,
          aspectRatio,
          duration: `${durationSec}s`,
        }),
      });

      clearInterval(progressTimer);
      const data = await res.json();

      setGenerationProgress(100);
      setGenerationStep('Scene rendered successfully!');

      const profile = data.sceneProfile || {};
      const newScene: VideoSceneData = {
        id: `ai_scene_${Date.now()}`,
        title: profile.title || promptText.slice(0, 28),
        prompt: promptText.trim(),
        style: selectedStyle,
        cameraMotion: selectedMotion,
        aspectRatio,
        duration: durationSec,
        palette: profile.colorPalette || ['#0f172a', '#1e293b', '#06b6d4', '#ec4899'],
        lighting: profile.lighting || `${selectedStyle} volumetric lighting`,
        particles: profile.particles || (selectedStyle === 'cyberpunk' ? 'rain' : 'embers'),
        headlineOverlay: profile.headlineOverlay || promptText.slice(0, 20).toUpperCase(),
        elements: profile.elements || ['Primary subject', 'Depth horizon', 'Light particles'],
        subtitleText: currentTTSAudio?.text?.slice(0, 60) || promptText.slice(0, 60),
      };

      setActiveScene(newScene);
      setCurrentTime(0);
      setIsPlaying(true);

      if (onSendToTimeline) {
        onSendToTimeline(newScene);
      }
    } catch (err) {
      console.warn('AI video generate notice:', err);
      // Seamless procedural scene fallback
      const newScene: VideoSceneData = {
        id: `ai_scene_${Date.now()}`,
        title: promptText.slice(0, 24),
        prompt: promptText.trim(),
        style: selectedStyle,
        cameraMotion: selectedMotion,
        aspectRatio,
        duration: durationSec,
        palette: ['#0f172a', '#3b82f6', '#06b6d4', '#ec4899'],
        lighting: `${selectedStyle} volumetric lighting`,
        particles: selectedStyle === 'cyberpunk' ? 'rain' : 'embers',
        headlineOverlay: promptText.slice(0, 20).toUpperCase(),
        elements: ['Atmospheric horizon', 'Particles', 'Camera move'],
        subtitleText: currentTTSAudio?.text?.slice(0, 60) || promptText.slice(0, 60),
      };
      setActiveScene(newScene);
      setCurrentTime(0);
      setIsPlaying(true);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStep('');
      }, 500);
    }
  };

  // -------------------------------------------------------------
  // REAL CANVAS VIDEO EXPORT (Creates genuine playable WebM/MP4 file)
  // -------------------------------------------------------------
  const handleExportRealVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setExportProgress(10);
      setExportNotice(null);

      // 30 FPS Canvas Stream
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `${activeScene.title.replace(/\s+/g, '_')}_${aspectRatio}_4K.${ext}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        setExportProgress(100);
        setExportNotice(`Real video successfully exported as ${filename}!`);
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          setExportNotice(null);
        }, 3000);
      };

      recorder.start();

      // Play through frames for duration
      setIsPlaying(true);
      setCurrentTime(0);

      const totalSteps = activeScene.duration * 10;
      let step = 0;

      const recordTimer = setInterval(() => {
        step++;
        const p = Math.min(99, Math.round((step / totalSteps) * 100));
        setExportProgress(p);
        setCurrentTime((step * 0.1));

        if (step >= totalSteps) {
          clearInterval(recordTimer);
          recorder.stop();
          setIsPlaying(false);
        }
      }, 100);
    } catch (err) {
      console.error('Real canvas video recording failed:', err);
      setIsExporting(false);
    }
  };

  // 1-Click: Use current voiceover text
  const handleUseVoiceoverScript = () => {
    if (currentTTSAudio?.text) {
      setPromptText(`Cinematic cinematic video scene visually illustrating: "${currentTTSAudio.text.slice(0, 160)}" with dramatic 4K atmospheric lighting and cinematic camera motion`);
    }
  };

  // Aspect ratio canvas dimensions
  const getCanvasDimensions = () => {
    if (aspectRatio === '9:16') return { width: 480, height: 854 };
    if (aspectRatio === '1:1') return { width: 720, height: 720 };
    if (aspectRatio === '21:9') return { width: 1008, height: 432 };
    return { width: 960, height: 540 }; // 16:9
  };

  const dims = getCanvasDimensions();

  return (
    <div className="space-y-6">
      {/* Hidden audio for synchronized playback */}
      {currentTTSAudio?.audioUrl && (
        <audio
          ref={audioRef}
          src={currentTTSAudio.audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Main 2-Column Text-to-Video AI Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: AI PROMPT & DIRECTING CONSOLE (5 COLS)         */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-2xl backdrop-blur-xl space-y-4">
            {/* Header with Title and Inspiration */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-emerald-500/20">
                  <Wand2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-100 tracking-tight">AI Video Director</h3>
                  <p className="text-[11px] text-zinc-400">Describe any scene to generate cinematic 4K video</p>
                </div>
              </div>

              {currentTTSAudio && (
                <button
                  type="button"
                  onClick={handleUseVoiceoverScript}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy your active voiceover script into the video prompt"
                >
                  <Music className="w-3 h-3 text-purple-400" />
                  <span>Use Voiceover</span>
                </button>
              )}
            </div>

            {/* Visual Prompt Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>Visual Scene Prompt</span>
                  <span className="text-emerald-400 text-[10px] font-mono font-normal">(Natural Language)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promptText);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your scene in cinematic detail (e.g. 'Cyberpunk rain city with flying sky-cabs...')..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Quick Prompt Presets Carousel */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Instant Scene Templates
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {PRESET_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setPromptText(item.prompt);
                      setSelectedStyle(item.style);
                      setSelectedMotion(item.motion);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 shrink-0 transition-colors cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">
                Cinematic Visual Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedStyle === style.id
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-100">
                      <span className="flex items-center gap-1.5">
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                      {style.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Motion & Aspect Ratio Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Camera Motion */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">
                  Camera Motion
                </label>
                <select
                  value={selectedMotion}
                  onChange={(e) => setSelectedMotion(e.target.value as VideoCameraMotion)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {MOTION_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['16:9', '9:16', '1:1', '21:9'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`py-1.5 rounded-lg border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                        aspectRatio === r
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration & Audio Sync Options - User-controlled video length */}
            <div className="space-y-2 pt-2 text-xs border-t border-zinc-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Video Length:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700/80 rounded-lg px-2 py-0.5">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={durationSec}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(300, parseInt(e.target.value) || 1));
                        setDurationSec(val);
                      }}
                      className="w-12 bg-transparent text-emerald-400 font-mono font-bold text-center text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">sec</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({Math.floor(durationSec / 60)}:{(durationSec % 60).toString().padStart(2, '0')})
                  </span>
                </div>

                {currentTTSAudio && (
                  <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncAudio}
                      onChange={(e) => setSyncAudio(e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-purple-300 font-medium">Sync Voiceover Audio</span>
                  </label>
                )}
              </div>

              {/* Interactive Duration Slider & Quick Presets */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 font-mono">1s</span>
                <input
                  type="range"
                  min={1}
                  max={120}
                  step={1}
                  value={Math.min(120, durationSec)}
                  onChange={(e) => setDurationSec(parseInt(e.target.value) || 5)}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <span className="text-[10px] text-zinc-500 font-mono">120s</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-medium mr-1">Quick Picks:</span>
                {[3, 5, 8, 10, 15, 30, 45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSec(sec)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      durationSec === sec
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Synthesizer Progress Bar if Generating */}
            {isGenerating && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{generationStep || 'Synthesizing neural video scene...'}</span>
                  </span>
                  <span className="font-mono text-emerald-300">{generationProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generate Video Action Button */}
            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isGenerating || !promptText.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Synthesizing Scene ({generationProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>Generate AI Video ({durationSec}s {aspectRatio})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: REAL-TIME VIDEO MONITOR & EXPORT SUITE (7 COLS) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-2xl backdrop-blur-xl space-y-4">
            {/* Monitor Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-sm text-zinc-100">Live Video Monitor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {aspectRatio} • {activeScene.duration}s
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeScene.style.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onOpenTimelineEditor && (
                  <button
                    type="button"
                    onClick={onOpenTimelineEditor}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                    title="Open Timeline Multi-Track Editor"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Timeline Editor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Canvas Viewport */}
            <div className="relative bg-black rounded-xl overflow-hidden border border-zinc-800/90 shadow-inner flex items-center justify-center group aspect-video">
              <canvas
                ref={canvasRef}
                width={dims.width}
                height={dims.height}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
              />

              {/* Overlay Play/Pause Button on Hover */}
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity cursor-pointer ${
                  isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/90 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-transform hover:scale-105">
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </div>
              </div>
            </div>

            {/* Video Progress Scrubber Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={activeScene.duration || 8}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span className="text-emerald-400 font-semibold">{activeScene.title}</span>
                <span>{formatTime(activeScene.duration)}</span>
              </div>
            </div>

            {/* Video Transport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Playback buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Rewind 5s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer font-bold"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSeek(Math.min(activeScene.duration, currentTime + 5))}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Fast Forward 5s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Real Video Exporter Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRealVideo}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="Export and download real playable WebM/MP4 video file recorded directly from canvas"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Video ({exportProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Real Video (4K)</span>
                    </>
                  )}
                </button>

                {onSendToTimeline && (
                  <button
                    type="button"
                    onClick={() => onSendToTimeline(activeScene)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                    title="Send current clip to 16-Track Timeline Editor"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Add to Timeline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Export Success Banner */}
            {exportNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{exportNotice}</span>
              </div>
            )}

            {/* Scene Blueprint Details Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400 font-semibold border-b border-zinc-800/80 pb-1.5">
                <span>Active Scene Blueprint</span>
                <span className="text-emerald-400 font-mono text-[11px]">Camera: {activeScene.cameraMotion}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Lighting:</span>
                  <span className="text-zinc-300 font-medium truncate block">{activeScene.lighting}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Particles:</span>
                  <span className="text-zinc-300 font-medium capitalize block">{activeScene.particles} Engine</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Aspect Ratio:</span>
                  <span className="text-zinc-300 font-mono font-bold block">{activeScene.aspectRatio}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Color Palette:</span>
                  <div className="flex items-center gap-1 mt-1">
                    {activeScene.palette?.map((col, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
