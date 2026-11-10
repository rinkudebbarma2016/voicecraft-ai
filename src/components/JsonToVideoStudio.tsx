import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode,
  Play,
  Pause,
  RotateCcw,
  Film,
  Download,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Copy,
  Layers,
  Volume2,
  VolumeX,
  Type,
  Maximize2,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { WfpProject } from '../types/project';

interface JsonToVideoStudioProps {
  onSendToTimeline?: (project: Partial<WfpProject>) => void;
  onSendToImageToVideo?: (scene: any) => void;
  geminiAvailable?: boolean;
}

export interface VideoJsonScene {
  id: string;
  duration: number; // in seconds
  visual: {
    type: 'image' | 'solid' | 'gradient';
    url?: string;
    motion: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static';
    scale?: number;
  };
  narration?: string;
  subtitle?: string;
  transition?: 'cross-dissolve' | 'fade-to-black' | 'slide-left' | 'cut';
  colorGrade?: 'cinematic-teal' | 'cyberpunk-neon' | 'vintage-warm' | 'monochrome' | 'none';
}

export interface VideoJsonProject {
  projectTitle: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: number;
  audioTrack?: {
    voice: string;
    backgroundMusic?: string;
    musicVolume?: number;
  };
  scenes: VideoJsonScene[];
}

// Built-in JSON Video Project Presets
const SAMPLE_TEMPLATES: Record<string, { name: string; badge: string; data: VideoJsonProject }> = {
  viral_reel: {
    name: 'Viral TikTok/Reel Short (9:16)',
    badge: '9:16 Vertical',
    data: {
      projectTitle: 'Top 3 AI Breakthroughs in 2026',
      aspectRatio: '9:16',
      fps: 30,
      audioTrack: {
        voice: 'Puck',
        backgroundMusic: 'ambient-synth',
        musicVolume: 0.25,
      },
      scenes: [
        {
          id: 'sc_1',
          duration: 4.5,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
            motion: 'zoom-in',
          },
          narration: 'Number one: Neural video synthesis that generates 4K cinematic scenes in real time.',
          subtitle: '1. REAL-TIME 4K NEURAL VIDEO',
          transition: 'cross-dissolve',
          colorGrade: 'cyberpunk-neon',
        },
        {
          id: 'sc_2',
          duration: 4.5,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
            motion: 'pan-right',
          },
          narration: 'Number two: Quantum biometric voice cloning that sounds indistinguishable from real human actors.',
          subtitle: '2. BIOMETRIC VOICE TIMBRE',
          transition: 'cross-dissolve',
          colorGrade: 'cinematic-teal',
        },
        {
          id: 'sc_3',
          duration: 5.0,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
            motion: 'zoom-out',
          },
          narration: 'And number three: Automated JSON-to-video engines that direct entire films from pure code.',
          subtitle: '3. PROGRAMMATIC JSON FILMMAKING',
          transition: 'fade-to-black',
          colorGrade: 'vintage-warm',
        },
      ],
    },
  },
  tech_launch: {
    name: 'Tech Product Launch Showcase (16:9)',
    badge: '16:9 Widescreen',
    data: {
      projectTitle: 'AeroSound Pulse - Next-Gen Acoustics',
      aspectRatio: '16:9',
      fps: 60,
      audioTrack: {
        voice: 'Fenrir',
        backgroundMusic: 'tech-pulse',
        musicVolume: 0.3,
      },
      scenes: [
        {
          id: 'sc_launch_1',
          duration: 5.0,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
            motion: 'zoom-in',
          },
          narration: 'Introducing AeroSound Pulse. Crafted from aerospace titanium for uncompromised sonic clarity.',
          subtitle: 'AEROSOUND PULSE • TITANIUM DRIVERS',
          transition: 'cross-dissolve',
          colorGrade: 'cinematic-teal',
        },
        {
          id: 'sc_launch_2',
          duration: 5.0,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&q=80',
            motion: 'pan-left',
          },
          narration: 'Featuring intelligent spatial audio tracking and 48-hour continuous studio battery life.',
          subtitle: '48H BATTERY • SPATIAL AUDIO TRACKING',
          transition: 'cross-dissolve',
          colorGrade: 'none',
        },
      ],
    },
  },
  documentary: {
    name: 'Cinematic Nature Documentary (16:9)',
    badge: '16:9 Cinema',
    data: {
      projectTitle: 'Whispers of the Mountain Zenith',
      aspectRatio: '16:9',
      fps: 24,
      audioTrack: {
        voice: 'Aoede',
        backgroundMusic: 'cinematic-strings',
        musicVolume: 0.2,
      },
      scenes: [
        {
          id: 'sc_doc_1',
          duration: 6.0,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
            motion: 'zoom-in',
          },
          narration: 'High above the clouds, where ancient glaciers carve stone, silence speaks louder than thunder.',
          subtitle: 'ANCIENT GLACIAL HEIGHTS',
          transition: 'fade-to-black',
          colorGrade: 'vintage-warm',
        },
        {
          id: 'sc_doc_2',
          duration: 6.0,
          visual: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
            motion: 'pan-right',
          },
          narration: 'And in the golden evening light, the ocean whispers timeless secrets to the retreating tide.',
          subtitle: 'WHERE HORIZONS MEET',
          transition: 'cross-dissolve',
          colorGrade: 'cinematic-teal',
        },
      ],
    },
  },
};

export const JsonToVideoStudio: React.FC<JsonToVideoStudioProps> = ({
  onSendToTimeline,
  onSendToImageToVideo,
  geminiAvailable = true,
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('viral_reel');
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(SAMPLE_TEMPLATES.viral_reel.data, null, 2)
  );
  const [parsedProject, setParsedProject] = useState<VideoJsonProject | null>(
    SAMPLE_TEMPLATES.viral_reel.data
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Playback engine state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Calculate total duration from scenes
  const totalDuration =
    parsedProject?.scenes.reduce((acc, sc) => acc + (sc.duration || 5), 0) || 14;

  // Validate and parse JSON whenever input changes
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        throw new Error('JSON must contain a "scenes" array');
      }
      setParsedProject(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  // Preload scene images for smooth canvas playback
  useEffect(() => {
    if (!parsedProject?.scenes) return;

    parsedProject.scenes.forEach((sc) => {
      if (sc.visual?.url && !preloadedImagesRef.current.has(sc.visual.url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = sc.visual.url;
        preloadedImagesRef.current.set(sc.visual.url, img);
      }
    });
  }, [parsedProject]);

  // Load Preset Template
  const handleLoadTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const data = SAMPLE_TEMPLATES[key].data;
    const formatted = JSON.stringify(data, null, 2);
    setJsonText(formatted);
    setParsedProject(data);
    setJsonError(null);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Upload custom .json file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonChange(content);
    };
    reader.readAsText(file);
  };

  // Download project as .json
  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsedProject?.projectTitle || 'video_project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Playback Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Determine current active scene based on currentTime
  useEffect(() => {
    if (!parsedProject?.scenes) return;

    let accumulated = 0;
    for (let i = 0; i < parsedProject.scenes.length; i++) {
      accumulated += parsedProject.scenes[i].duration;
      if (currentTime <= accumulated) {
        setCurrentSceneIndex(i);
        break;
      }
    }
  }, [currentTime, parsedProject]);

  // Render Frame onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsedProject) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions based on aspect ratio
    const isVertical = parsedProject.aspectRatio === '9:16';
    const isSquare = parsedProject.aspectRatio === '1:1';
    const width = isVertical ? 720 : isSquare ? 1080 : 1280;
    const height = isVertical ? 1280 : isSquare ? 1080 : 720;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear frame
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const activeScene = parsedProject.scenes[currentSceneIndex];
    if (!activeScene) return;

    // Calculate progress within current scene (0 to 1)
    let sceneStartTime = 0;
    for (let i = 0; i < currentSceneIndex; i++) {
      sceneStartTime += parsedProject.scenes[i].duration;
    }
    const sceneElapsed = Math.max(0, currentTime - sceneStartTime);
    const sceneProgress = Math.min(1, sceneElapsed / (activeScene.duration || 5));

    // Draw visual
    const imgUrl = activeScene.visual?.url;
    const img = imgUrl ? preloadedImagesRef.current.get(imgUrl) : null;

    if (img && img.complete) {
      ctx.save();

      // Camera Motion (Ken Burns effect)
      let scale = 1.0;
      let dx = 0;
      let dy = 0;

      if (activeScene.visual.motion === 'zoom-in') {
        scale = 1.0 + sceneProgress * 0.15;
      } else if (activeScene.visual.motion === 'zoom-out') {
        scale = 1.15 - sceneProgress * 0.15;
      } else if (activeScene.visual.motion === 'pan-right') {
        dx = -sceneProgress * 40;
        scale = 1.08;
      } else if (activeScene.visual.motion === 'pan-left') {
        dx = sceneProgress * 40;
        scale = 1.08;
      }

      // Color Grade Filters on canvas
      if (activeScene.colorGrade === 'cinematic-teal') {
        ctx.filter = 'contrast(115%) saturate(120%) hue-rotate(345deg)';
      } else if (activeScene.colorGrade === 'cyberpunk-neon') {
        ctx.filter = 'contrast(130%) saturate(145%) hue-rotate(310deg)';
      } else if (activeScene.colorGrade === 'vintage-warm') {
        ctx.filter = 'contrast(105%) saturate(95%) sepia(20%)';
      } else if (activeScene.colorGrade === 'monochrome') {
        ctx.filter = 'grayscale(100%) contrast(140%)';
      } else {
        ctx.filter = 'none';
      }

      // Center & scale draw
      ctx.translate(width / 2 + dx, height / 2 + dy);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);

      ctx.restore();
    } else {
      // Solid/Gradient placeholder
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#3f3f46';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Scene ${currentSceneIndex + 1} Loading Visual...`, width / 2, height / 2);
    }

    // Dark gradient vignette overlay for cinematic contrast
    const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);

    // Draw Subtitle Typography
    if (activeScene.subtitle) {
      ctx.save();
      const fontSize = isVertical ? 32 : 28;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15'; // Vibrant gold/yellow kinetic subtitle
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;

      const subY = isVertical ? height * 0.82 : height * 0.88;
      ctx.fillText(activeScene.subtitle.toUpperCase(), width / 2, subY);

      // Narration script secondary line
      if (activeScene.narration) {
        ctx.font = `500 ${isVertical ? 20 : 18}px system-ui, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        const narY = subY + (isVertical ? 36 : 30);
        ctx.fillText(`"${activeScene.narration}"`, width / 2, narY);
      }
      ctx.restore();
    }

    // Top watermark / Title header
    ctx.save();
    ctx.font = '700 14px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${parsedProject.projectTitle} • SCENE ${currentSceneIndex + 1}/${parsedProject.scenes.length}`, 30, 40);
    ctx.restore();
  }, [currentTime, currentSceneIndex, parsedProject]);

  // Export Video using MediaRecorder & Canvas
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    setIsExporting(true);
    setExportProgress(10);
    setCurrentTime(0);
    setIsPlaying(false);

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${parsedProject?.projectTitle || 'json_video'}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      recorder.start();
      setIsPlaying(true);

      // Wait for playback to complete
      const durationMs = (totalDuration + 0.5) * 1000;
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
        setIsPlaying(false);
      }, durationMs);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  // Scale video scenes duration to user's desired length
  const handleScaleDuration = (targetSec: number) => {
    if (!parsedProject || parsedProject.scenes.length === 0) return;
    const currentTotal = totalDuration || 1;
    const ratio = targetSec / currentTotal;
    const updatedScenes = parsedProject.scenes.map((sc) => ({
      ...sc,
      duration: Math.max(1, parseFloat(((sc.duration || 4) * ratio).toFixed(1))),
    }));
    const updatedProject = {
      ...parsedProject,
      scenes: updatedScenes,
    };
    setJsonText(JSON.stringify(updatedProject, null, 2));
    setParsedProject(updatedProject);
  };

  // Export to CineCraft Pro Timeline (.ccp / .wfp)
  const handleExportToCineCraft = () => {
    if (!parsedProject || !onSendToTimeline) return;

    onSendToTimeline({
      name: parsedProject.projectTitle,
      aspectRatio: parsedProject.aspectRatio,
      duration: totalDuration,
      tracks: [
        {
          id: 'track_v1',
          index: 0,
          name: 'JSON Video Scenes',
          type: 'video',
          isVisible: true,
          isMuted: false,
          isLocked: false,
        },
      ],
      clips: parsedProject.scenes.map((sc, i) => ({
        id: `clip_sc_${i}`,
        name: sc.subtitle || `Scene ${i + 1}`,
        type: 'video',
        trackIndex: 0,
        startTime: i * 5,
        duration: sc.duration,
        color: '#06b6d4',
        sourceUrl: sc.visual.url,
      })),
    });
  };

  return (
    <div className="space-y-4">
      {/* Studio Header Bar */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 font-bold">
            <FileCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Pro Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                AI PRO STUDIO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Professional JSON project timelines, programmatic camera scripting, neural voiceovers & cinematic video rendering
            </p>
          </div>
        </div>

        {/* Global Studio Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import JSON</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export JSON</span>
          </button>

          {onSendToTimeline && (
            <button
              type="button"
              onClick={handleExportToCineCraft}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Open in CineCraft Pro Timeline"
            >
              <Film className="w-3.5 h-3.5" />
              <span>To CineCraft Pro</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isExporting || Boolean(jsonError)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/25 transition disabled:opacity-40 cursor-pointer"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering WebM Video...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Video (WebM)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Controlled Video Duration Bar */}
      <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white">Video Duration:</span>{' '}
            <span className="text-amber-300 font-mono font-bold">{totalDuration}s</span>{' '}
            <span className="text-zinc-500 text-[11px] font-mono">
              ({Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-400">Scale Video To:</span>
          {[10, 15, 30, 45, 60, 90, 120].map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => handleScaleDuration(target)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer ${
                Math.round(totalDuration) === target
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
              }`}
            >
              {target}s
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <input
              type="number"
              min={3}
              max={300}
              placeholder="Custom"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (val > 0) handleScaleDuration(val);
                }
              }}
              className="w-16 px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded-lg text-center font-mono text-xs text-amber-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-zinc-500 font-mono">↵ Enter</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Editor vs Live Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Interactive JSON Code Editor */}
        <div className="lg:col-span-6 space-y-3">
          {/* Template Selector Bar */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5 shrink-0">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              Load JSON Preset:
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {Object.entries(SAMPLE_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLoadTemplate(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    selectedTemplateKey === key
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Code Textarea & Error Indicator */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-lg relative flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-400 text-[11px]">timeline_project.json</span>
                {jsonError ? (
                  <span className="px-2 py-0.2 rounded-full bg-red-950 text-red-400 border border-red-800/60 text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Syntax Error</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Valid JSON • {parsedProject?.scenes.length} Scenes</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    const obj = JSON.parse(jsonText);
                    setJsonText(JSON.stringify(obj, null, 2));
                  } catch {}
                }}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer font-mono"
              >
                Format / Beautify
              </button>
            </div>

            {/* Editor Code Textarea */}
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="flex-1 w-full bg-zinc-900/90 font-mono text-xs text-amber-200/90 p-3 rounded-xl border border-zinc-800 focus:border-amber-500 focus:outline-none resize-none leading-relaxed overflow-y-auto"
              spellCheck={false}
            />

            {/* Error Message Box */}
            {jsonError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-[11px] text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-mono">{jsonError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Video Player & Timeline Scrubber */}
        <div className="lg:col-span-6 space-y-3">
          {/* Video Player Box */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-[520px]">
            {/* Player Header */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <span className="font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>{parsedProject?.projectTitle || 'Untitled Video'}</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {parsedProject?.aspectRatio} • {parsedProject?.fps || 30} FPS
              </span>
            </div>

            {/* Center Canvas Player */}
            <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[380px] w-auto max-w-full rounded-xl shadow-2xl border border-zinc-800/80 object-contain"
              />
            </div>

            {/* Timeline Controls & Scrubber */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {/* Progress Slider */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-400 font-bold min-w-[48px]">
                  {currentTime.toFixed(1)}s
                </span>
                <input
                  type="range"
                  min="0"
                  max={totalDuration || 1}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <span className="text-zinc-500 min-w-[48px] text-right">
                  {totalDuration.toFixed(1)}s
                </span>
              </div>

              {/* Player Button Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTime(0)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                    title="Rewind to Start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Active Scene Tracker */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  {parsedProject?.scenes.map((sc, i) => (
                    <button
                      key={sc.id || i}
                      type="button"
                      onClick={() => {
                        let t = 0;
                        for (let j = 0; j < i; j++) t += parsedProject.scenes[j].duration;
                        setCurrentTime(t);
                      }}
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        currentSceneIndex === i
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Scene {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
