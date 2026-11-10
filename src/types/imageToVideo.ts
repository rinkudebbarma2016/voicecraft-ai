export type ImageToVideoMotion =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'orbit'
  | 'dolly-zoom'
  | 'ambient-flow'
  | 'static-glamour';

export type ImageToVideoAtmosphere =
  | 'none'
  | 'embers'
  | 'rain'
  | 'dust-particles'
  | 'god-rays'
  | 'sakura-petals'
  | 'cyber-glitch'
  | 'anamorphic-flare';

export type ImageToVideoAspectRatio = '16:9' | '9:16' | '4:5' | '1:1' | '21:9';

export interface FlowVector {
  id: string;
  label: string;
  x: number; // 0.0 to 1.0 (normalized coordinate)
  y: number; // 0.0 to 1.0 (normalized coordinate)
  dx: number; // -1.0 to 1.0 directional displacement
  dy: number; // -1.0 to 1.0 directional displacement
  speed: number; // 0.2 to 2.5
  intensity: number; // 0.1 to 1.0
  category: 'water' | 'wind' | 'subject' | 'camera' | 'light' | 'particles';
}

export interface FlowStage {
  stage: number;
  name: string;
  timeRange: string; // e.g. "0.0s - 1.5s"
  description: string;
  cameraEffect: string;
  dynamicEffect: string;
}

export interface GeminiFlowAnalysis {
  detectedSubjects: string[];
  promptDirectives: string[];
  primaryFlowDirection: string;
  flowVectors: FlowVector[];
  stages: FlowStage[];
  promptFidelityScore: number; // 0 to 100
  directorNotes: string;
  suggestedMotion: ImageToVideoMotion;
  suggestedAtmosphere: ImageToVideoAtmosphere;
}

export interface ImageToVideoItem {
  id: string;
  title: string;
  prompt: string;
  sourceImage: string; // Base64 or Data URL
  sourceImageName?: string;
  videoUrl: string;
  videoBlob?: Blob;
  motion: ImageToVideoMotion;
  motionSpeed: number; // 0.5 to 2.0
  aspectRatio: ImageToVideoAspectRatio;
  duration: number; // seconds (3, 5, 8, 10, 15)
  fps: number; // 24, 30, 60
  atmosphere: ImageToVideoAtmosphere;
  resolution: string; // e.g. "1080p (1920x1080)"
  hasAudio: boolean;
  audioTitle?: string;
  engine: 'gemini-omni' | 'google-flow-ai' | 'neural-motion-canvas';
  promptFidelity: number; // 0.0 to 1.0 (steerability)
  flowAnalysis?: GeminiFlowAnalysis;
  flowVectors?: FlowVector[];
  createdAt: number;
  sizeBytes?: number;
}

export interface DeviceMediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  dataUrl?: string;
  blob?: Blob;
  sizeBytes: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  uploadedAt: number;
}

export interface StoryboardScene {
  id: string;
  title: string;
  image: string;
  imageName: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  prompt: string;
  narrationScript: string;
  speakerId?: string;
  motion: ImageToVideoMotion;
  atmosphere: ImageToVideoAtmosphere;
  duration: number; // seconds
  transition: 'cut' | 'cross-dissolve' | 'slide-left' | 'fade-black' | 'zoom-in';
  lowerThird?: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    position: 'bottom-left' | 'center' | 'top-banner';
  };
  // 3D Camera Depth & Perspective Controls
  zDepthMove?: number; // Z-axis travel offset (-3.0 to +5.0, default 1.5)
  perspectiveIntensity?: number; // Perspective FOV in degrees (30 to 85, default 50)
  depthCurvature?: number; // 3D spatial screen curvature (0.0 flat to 1.0 IMAX curved, default 0.35)
  audioUrl?: string;
  audioName?: string;
  audioBase64?: string;
}

export interface TeleprompterConfig {
  isOpen: boolean;
  wpm: number;
  fontSize: number;
  isPlaying: boolean;
  currentLineIndex: number;
  mirrorMode: boolean;
}

export interface AudioDuckingConfig {
  enabled: boolean;
  duckingPercent: number; // e.g. 70%
  bgMusicPreset: 'tech-minimal' | 'cinematic-uplift' | 'lofi-calm' | 'driving-corporate' | 'none';
  bgMusicVolume: number;
  voiceVolume: number;
}

export interface VidsTemplatePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  aspectRatio: ImageToVideoAspectRatio;
  scenes: StoryboardScene[];
}

export interface ImageToVideoPreset {
  id: string;
  title: string;
  subtitle: string;
  motion: ImageToVideoMotion;
  atmosphere: ImageToVideoAtmosphere;
  prompt: string;
  aspectRatio: ImageToVideoAspectRatio;
  duration: number;
  sampleImage: string;
  thumbnailGradient: string;
  defaultFlowVectors?: FlowVector[];
}

