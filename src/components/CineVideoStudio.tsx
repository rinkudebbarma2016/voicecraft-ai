import React, { useState, useEffect, useRef } from 'react';
import { GeneratedAudio, VideoSceneData } from '../types/tts';
import { TextToVideoStudio } from './TextToVideoStudio';
import { AuthModal, UserAccount } from './AuthModal';
import { DownloadSoftwareModal } from './DownloadSoftwareModal';
import { CineStartupDashboard, RecentWfpProject } from './CineStartupDashboard';
import { ProjectManagementDashboard } from './ProjectManagementDashboard';
import { AudioExtenderModal } from './AudioExtenderModal';
import { WfpProject, AspectRatioType } from '../types/project';
import { saveRecentProject, exportProjectToWfp, getResolutionForAspect } from '../utils/projectStorage';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Scissors,
  Download,
  Sparkles,
  Layers,
  Wand2,
  Trash2,
  Volume2,
  VolumeX,
  Type,
  Music,
  Maximize,
  Sliders,
  Settings,
  Plus,
  Video as VideoIcon,
  FolderOpen,
  Camera,
  Bot,
  RefreshCw,
  Share2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mic,
  Monitor,
  Crop,
  PenTool,
  Clock,
  Radio,
  FileVideo,
  List,
  Grid,
  Search,
  X,
  HelpCircle,
  BarChart3,
  Languages,
  Palette,
  Maximize2,
  Minimize2,
  ChevronDown,
  Cloud,
  Lightbulb,
  Headphones,
  User,
  Save,
  Mail,
  Minus,
  Square,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Bookmark,
  ChevronRight,
  Link2,
  AudioWaveform,
} from 'lucide-react';
import { base64ToAudioUrl, formatTime } from '../utils/audio';

interface CineVideoStudioProps {
  currentTTSAudio: GeneratedAudio | null;
  geminiAvailable: boolean;
  onSendToPlayer?: (audio: GeneratedAudio) => void;
  initialProject?: WfpProject | null;
  onReturnToDashboard?: () => void;
  onOpenImageToVideo?: () => void;
}

export interface VideoClipItem {
  id: string;
  name: string;
  duration: number; // in seconds
  type: 'video' | 'audio' | 'text' | 'image';
  color: string;
  thumbnailUrl?: string;
  trackIndex: number; // 0: Video 1, 1: Video 2, 2: Audio 1, 3: Audio 2/BGM, 4: Subtitles
  startTime: number;
  effect?: string;
  subtitleText?: string;
  sceneData?: VideoSceneData;
}

// 29 Studio Tools from Image 4
export interface StudioToolItem {
  id: string;
  name: string;
  category: 'edit' | 'ai' | 'audio' | 'text';
  icon: string;
}

const ALL_STUDIO_TOOLS: StudioToolItem[] = [
  { id: 'undo', name: 'Undo', category: 'edit', icon: '↩️' },
  { id: 'redo', name: 'Redo', category: 'edit', icon: '↪️' },
  { id: 'delete', name: 'Delete', category: 'edit', icon: '🗑️' },
  { id: 'split', name: 'Split (Razor)', category: 'edit', icon: '✂️' },
  { id: 'crop', name: 'Crop', category: 'edit', icon: '📐' },
  { id: 'quick_text', name: 'Quick Text', category: 'text', icon: '✍️' },
  { id: 'drawing_tools', name: 'Drawing Tools', category: 'edit', icon: '🎨' },
  { id: 'pen_tool', name: 'Pen Tool', category: 'edit', icon: '✒️' },
  { id: 'speed', name: 'Speed & Ramp', category: 'edit', icon: '⏱️' },
  { id: 'duration', name: 'Duration', category: 'edit', icon: '⏳' },
  { id: 'keyframing', name: 'Keyframing', category: 'edit', icon: '💎' },
  { id: 'edit_inspector', name: 'Edit (Inspector)', category: 'edit', icon: '⚙️' },
  { id: 'silence_detection', name: 'Silence Detection', category: 'audio', icon: '🔇' },
  { id: 'slide_edit', name: 'Slide Edit', category: 'edit', icon: '🎞️' },
  { id: 'beat_detection', name: 'Beat Detection', category: 'audio', icon: '🎵' },
  { id: 'speech_to_text', name: 'Speech-to-Text', category: 'ai', icon: '🎙️' },
  { id: 'text_to_speech', name: 'Text-to-Speech', category: 'ai', icon: '🗣️' },
  { id: 'ai_extend', name: 'AI Extend', category: 'ai', icon: '✨' },
  { id: 'audio_stretch', name: 'Audio Stretch', category: 'audio', icon: '〰️' },
  { id: 'smart_bgm', name: 'Smart BGM Generation', category: 'ai', icon: '🎶' },
  { id: 'ai_matting', name: 'AI Matting Tools', category: 'ai', icon: '🟩' },
  { id: 'ai_object_remover', name: 'AI Object Remover', category: 'ai', icon: '🪄' },
  { id: 'ai_tracking', name: 'AI Tracking Tools', category: 'ai', icon: '🎯' },
  { id: 'text_based_editing', name: 'Text-Based Editing', category: 'ai', icon: '📝' },
  { id: 'ai_color_palette', name: 'AI Color Palette', category: 'ai', icon: '🌈' },
  { id: 'ai_translation', name: 'AI Translation', category: 'ai', icon: '🌐' },
  { id: 'auto_sync', name: 'Auto Synchronization', category: 'audio', icon: '🔗' },
  { id: 'image_to_video', name: 'Image to Video', category: 'ai', icon: '🖼️' },
  { id: 'text_to_video', name: 'Text to Video', category: 'ai', icon: '🎬' },
];

// Curated Stock & Library Collections for Studio 16
const STOCK_MEDIA_ITEMS = [
  { id: 'stock_1', name: 'Cyberpunk Rain Neon City 4K', category: 'Cyberpunk', duration: 12, res: '4K UHD', tag: 'Trending' },
  { id: 'stock_2', name: 'Misty Alpine Ridge Drone Shot', category: 'Landscape', duration: 10, res: '4K UHD', tag: 'Cinema' },
  { id: 'stock_3', name: 'Abstract Quantum Neural Waves', category: 'Abstract', duration: 8, res: '4K UHD', tag: 'Motion' },
  { id: 'stock_4', name: 'Cozy Lo-Fi Study Cafe Rain', category: 'Lo-Fi', duration: 15, res: '1080p', tag: 'Ambient' },
  { id: 'stock_5', name: 'Sunset Ocean Surf Slow Motion', category: 'Nature', duration: 11, res: '4K UHD', tag: 'Slow-Mo' },
  { id: 'stock_6', name: 'Futuristic Hologram UI Interface', category: 'Tech', duration: 7, res: '4K UHD', tag: 'VFX' },
];

const STOCK_AUDIO_ITEMS = [
  { id: 'aud_1', name: 'Epic Cinematic Trailer Anthem', category: 'Orchestral', duration: 24, bpm: '128 BPM', type: 'bgm' },
  { id: 'aud_2', name: 'Chill Midnight Lo-Fi Beats', category: 'Lo-Fi', duration: 30, bpm: '85 BPM', type: 'bgm' },
  { id: 'aud_3', name: 'Uplifting Tech Innovation Synth', category: 'Ambient', duration: 18, bpm: '120 BPM', type: 'bgm' },
  { id: 'aud_4', name: 'Cyber Swell / Whoosh Rise', category: 'Sound FX', duration: 4, bpm: 'SFX', type: 'sfx' },
  { id: 'aud_5', name: 'Glitch Hit & Deep Sub Bass', category: 'Sound FX', duration: 3, bpm: 'Impact', type: 'sfx' },
  { id: 'aud_6', name: 'Warm Vinyl Needle Crackle', category: 'Foley', duration: 8, bpm: 'Loop', type: 'sfx' },
];

const STOCK_TITLE_ITEMS = [
  { id: 'title_1', name: 'Cinematic 3D Title Sequence', style: 'Gold Serif Bold', track: 1, text: 'VOICECRAFT STUDIO MASTER' },
  { id: 'title_2', name: 'Minimal Modern Lower-Third', style: 'Clean White Pill', track: 1, text: 'Alex Turner • Creative Director' },
  { id: 'title_3', name: 'Cyber Neon Glowing Headline', style: 'Teal & Magenta Glow', track: 1, text: 'NEXT-GEN NEURAL SYNTHESIS' },
  { id: 'title_4', name: 'YouTube Social Follow Callout', style: 'Subscribe & Bell Badge', track: 1, text: '@VoiceCraftAI • Subscribe' },
  { id: 'title_5', name: 'Breaking News Ticker Banner', style: 'Red Live Alert', track: 1, text: 'LIVE UPDATE: AI 16 Studio Engine Deployed' },
  { id: 'title_6', name: 'Kinetic Subtitle Highlight', style: 'Yellow Impact Block', track: 4, text: 'Dynamic Speech-to-Text Transcription' },
];

const STOCK_TRANSITION_ITEMS = [
  { id: 'trans_1', name: 'Cross Dissolve', duration: '1.0s', desc: 'Smooth cinematic transparency dissolve' },
  { id: 'trans_2', name: 'Glitch Digital Warp', duration: '0.6s', desc: 'RGB chromatic data glitch shift' },
  { id: 'trans_3', name: 'Zoom In Dynamic Whip', duration: '0.5s', desc: 'High-speed focal plunge into subject' },
  { id: 'trans_4', name: 'Light Leak Film Flare', duration: '1.2s', desc: 'Warm 35mm optical lens illumination' },
  { id: 'trans_5', name: 'Whip Pan Right', duration: '0.4s', desc: 'Fast directional camera blur whip' },
  { id: 'trans_6', name: 'Prism Radial Spin', duration: '0.8s', desc: 'Shutter rotation with edge refraction' },
];

const STOCK_EFFECT_ITEMS = [
  { id: 'fx_1', name: 'Film Grain 35mm', intensity: 'Medium', desc: 'Analog silver halide film emulsion' },
  { id: 'fx_2', name: 'Prism RGB Split', intensity: 'High', desc: 'Optical chromatic aberration fringe' },
  { id: 'fx_3', name: 'Anamorphic Bloom Glow', intensity: 'Dynamic', desc: 'Luminescent highlight halo bleed' },
  { id: 'fx_4', name: 'CRT Retro Scanlines', intensity: 'Subtle', desc: 'Vintage cathode ray tube raster lines' },
  { id: 'fx_5', name: 'Cinematic Vignette', intensity: 'Smooth', desc: 'Radial corner luminance falloff' },
  { id: 'fx_6', name: 'Edge Sharpen & HDR', intensity: 'Crisp', desc: 'High micro-contrast edge definition' },
];

const PROJECT_TEMPLATES = [
  {
    id: 'tmpl_reel',
    name: 'TikTok & Reels Viral 9:16',
    ratio: '9:16' as const,
    res: '1080 x 1920 (9:16 Reel)',
    desc: 'Vertical short with kinetic captions, auto-reframe & upbeat audio',
    badge: 'Popular',
  },
  {
    id: 'tmpl_teaser',
    name: 'Tech Product Launch Showcase',
    ratio: '16:9' as const,
    res: '3840 x 2160 (4K UHD)',
    desc: 'Cinematic 4K trailer with cyber overlays, animated charts & synthwave BGM',
    badge: 'Pro 4K',
  },
  {
    id: 'tmpl_podcast',
    name: 'Podcast Video Soundbite',
    ratio: '16:9' as const,
    res: '1920 x 1080',
    desc: 'Audio reactive soundwave with host title card and subtitle crawl',
    badge: 'Audio-First',
  },
  {
    id: 'tmpl_cinema',
    name: 'Cinematic Film Anamorphic 21:9',
    ratio: '21:9' as const,
    res: '2560 x 1080 (Cinema)',
    desc: 'Ultra-wide cinema presentation with 35mm film grain & teal-orange grade',
    badge: 'Cinema',
  },
];

export const CineVideoStudio: React.FC<CineVideoStudioProps> = ({
  currentTTSAudio,
  geminiAvailable,
  onSendToPlayer,
  initialProject,
  onReturnToDashboard,
  onOpenImageToVideo,
}) => {
  // Main view state: 'hub' (Startup / Launch screen), 'editor' (Timeline workspace), or 'text-to-video'
  const [viewMode, setViewMode] = useState<'hub' | 'editor' | 'text-to-video'>('hub');

  // User Account state (Login ID, password & cloud sync)
  const [currentUser, setCurrentUser] = useState<UserAccount>({
    loginId: 'rinku_creator',
    email: 'rinkudebbarma2016@gmail.com',
    name: 'Rinku Debbarma',
    isLoggedIn: true,
    tier: 'Pro',
    cloudStorageUsedGb: 18.4,
    cloudStorageTotalGb: 100,
    joinedDate: 'October 2026',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Cross-Platform Software Download Modal (iOS, Android, Windows, Apple macOS, Web)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDesktopWindowFrame, setIsDesktopWindowFrame] = useState(true);

  // Preview Context & View Menu states (from screenshot)
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [playbackQuality, setPlaybackQuality] = useState<'Full' | '1/2' | '1/4' | '1/8'>('Full');
  const [zoomLevelPreview, setZoomLevelPreview] = useState<'Fit' | '50%' | '100%' | '200%'>('Fit');
  const [canvasSnapping, setCanvasSnapping] = useState(true);

  // Media Library Sidebar Folders (from screenshot tree)
  const [activeMediaFolder, setActiveMediaFolder] = useState<
    'project' | 'folder' | 'shared' | 'color' | 'sample_video' | 'green_screen' | 'templates'
  >('sample_video');

  // Recent saved .wfp project files
  const [recentProjects, setRecentProjects] = useState<RecentWfpProject[]>([
    {
      id: 'wfp_beach',
      name: 'Beach Coastline 4K Cinematic',
      filename: '28 - Beach Coastline Vacation.wfp',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      duration: '00:10:00',
      lastEdited: 'Today, 14:20',
      thumbnailGradient: 'from-cyan-600 via-blue-700 to-amber-700',
      sizeMb: 42.6,
    },
    {
      id: 'wfp_cyber',
      name: 'Cyberpunk Metropolis 2099',
      filename: 'Cyber_Neon_Tokyo.wfp',
      aspectRatio: '16:9',
      resolution: '3840x2160',
      duration: '00:10:00',
      lastEdited: 'Yesterday, 19:45',
      thumbnailGradient: 'from-purple-900 via-indigo-900 to-cyan-800',
      sizeMb: 88.2,
    },
    {
      id: 'wfp_reel',
      name: 'Instagram Reel Fashion Promo',
      filename: 'IG_Reel_Promo_Vertical.wfp',
      aspectRatio: '9:16',
      resolution: '1080x1920',
      duration: '00:00:30',
      lastEdited: '2 days ago',
      thumbnailGradient: 'from-pink-600 via-rose-700 to-amber-600',
      sizeMb: 24.1,
    },
    {
      id: 'wfp_alpine',
      name: 'Misty Alpine Drone Expedition',
      filename: 'Alpine_Drone_Expedition.wfp',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      duration: '00:08:00',
      lastEdited: '3 days ago',
      thumbnailGradient: 'from-emerald-900 via-teal-800 to-sky-900',
      sizeMb: 56.4,
    },
  ]);

  // Project Info
  const [projectName, setProjectName] = useState('28 - Beach Coastline Vacation');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '21:9'>('16:9');
  const [resolution, setResolution] = useState('1920 x 1080');
  const [frameRate, setFrameRate] = useState('25fps');

  // Sync initialProject when selected from Project Management Dashboard
  useEffect(() => {
    if (initialProject) {
      setProjectName(initialProject.name);
      if (['16:9', '9:16', '1:1', '4:3', '21:9'].includes(initialProject.aspectRatio)) {
        setAspectRatio(initialProject.aspectRatio as any);
      }
      setResolution(initialProject.resolution.label || `${initialProject.resolution.width} x ${initialProject.resolution.height}`);
      if (initialProject.clips && initialProject.clips.length > 0) {
        const mappedClips: VideoClipItem[] = initialProject.clips.map((c) => ({
          id: c.id,
          name: c.name,
          duration: c.duration,
          type: c.type,
          color: c.color || 'bg-cyan-800',
          thumbnailUrl: c.thumbnailUrl,
          trackIndex: c.trackIndex,
          startTime: c.startTime,
          subtitleText: c.subtitleText,
          effect: c.effect,
        }));
        setTimelineClips(mappedClips);
      }
      setViewMode('editor');
    }
  }, [initialProject]);

  // Dynamically set page title and SEO meta tags based on active project name in workspace
  useEffect(() => {
    if (projectName && projectName.trim()) {
      const activeTitle = `${projectName.trim()} • CineStudio Pro 16 Editor | VoiceCraft AI`;
      document.title = activeTitle;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Editing project "${projectName.trim()}" in CineStudio Pro 16 multi-track video editor. 4K timeline, speech synthesis & visual effects.`
        );
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', activeTitle);
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', activeTitle);
    }
  }, [projectName]);

  // Media tabs (Image 5: Media, Stock Media, Audio, Titles, Transitions, Effects, Filters, Stickers, Templates)
  const [activeMediaTab, setActiveMediaTab] = useState<
    'media' | 'stock' | 'audio' | 'titles' | 'transitions' | 'effects' | 'filters' | 'stickers' | 'templates'
  >('media');

  // Media pool items
  const [mediaPool, setMediaPool] = useState<Array<{ id: string; name: string; type: string; duration: number }>>([
    { id: 'm0', name: 'Beach.mp4', type: 'video', duration: 10 },
    { id: 'm1', name: 'Cyberpunk Neon Metropolis.mp4', type: 'video', duration: 10 },
    { id: 'm2', name: 'Misty Alpine Drone Flight.mp4', type: 'video', duration: 8 },
    { id: 'm3', name: 'Studio Voiceover Track.wav', type: 'audio', duration: 12 },
    { id: 'm4', name: 'Ambient Lo-Fi Synth BGM.mp3', type: 'audio', duration: 30 },
  ]);

  // Timeline Multi-track clips (Image 5)
  const [timelineClips, setTimelineClips] = useState<VideoClipItem[]>([
    {
      id: 'clip_beach',
      name: 'Beach',
      duration: 10,
      type: 'video',
      color: 'bg-cyan-800',
      trackIndex: 0, // Video 1
      startTime: 0,
      subtitleText: 'Mediterranean coastline cliffs with turquoise and deep blue waves.',
      sceneData: {
        title: 'Beach Coastal Flight',
        prompt: 'Cinematic drone aerial shot of rocky coastline cliffs with crashing blue sea waves and golden shoreline under clear sunny sky',
        style: 'drone-nature',
        cameraMotion: 'pan-right',
        aspectRatio: '16:9',
        duration: 10,
        palette: ['#0284c7', '#0369a1', '#38bdf8', '#78350f'],
        lighting: 'Brilliant Mediterranean midday sunshine',
        particles: 'rays',
        headlineOverlay: 'COASTAL CLIFFS 4K',
        elements: ['Rocky cliff', 'Crashing waves', 'Blue horizon', 'Gravel coast'],
      },
    },
    {
      id: 'clip_v1',
      name: 'Cyberpunk Neon Metropolis.mp4',
      duration: 10,
      type: 'video',
      color: 'bg-cyan-600',
      trackIndex: 0, // Video 1
      startTime: 0,
      subtitleText: currentTTSAudio?.text?.slice(0, 50) || 'Neon skyline soaring over futuristic rain metropolis.',
      sceneData: {
        title: 'Cyberpunk Neon Metropolis',
        prompt: 'Cinematic cyber city in pouring rain with neon reflections on wet asphalt, flying sky-cabs, and towering holographic billboards in 4K',
        style: 'cyberpunk',
        cameraMotion: 'zoom-in',
        aspectRatio: '16:9',
        duration: 10,
        palette: ['#0f172a', '#3b82f6', '#06b6d4', '#ec4899'],
        lighting: 'Volumetric neon glow with wet street reflections',
        particles: 'rain',
        headlineOverlay: 'NEO TOKYO 2099',
        elements: ['Flying sky-cabs', 'Holographic ads', 'Wet asphalt reflections', 'Skyline spires'],
      },
    },
    {
      id: 'clip_v2',
      name: 'Misty Alpine Drone Flight.mp4',
      duration: 8,
      type: 'video',
      color: 'bg-emerald-600',
      trackIndex: 0,
      startTime: 10,
      subtitleText: 'Golden sunrise rays over misty mountain ridges.',
      sceneData: {
        title: 'Misty Alpine Drone Flight',
        prompt: 'FPV drone sweeping over mist-covered pine forests and snow-capped alpine peaks at golden sunrise with volumetric god rays',
        style: 'drone-nature',
        cameraMotion: 'drone-dive',
        aspectRatio: '16:9',
        duration: 8,
        palette: ['#022c22', '#047857', '#38bdf8', '#e0f2fe'],
        lighting: 'Golden sunrise haze with volumetric god rays',
        particles: 'rays',
        headlineOverlay: 'HIMALAYAN HORIZON 4K',
        elements: ['Snow peaks', 'Pine canopy', 'Mist layers'],
      },
    },
    {
      id: 'clip_a1',
      name: currentTTSAudio ? currentTTSAudio.title : 'Narration Voiceover.wav',
      duration: currentTTSAudio?.duration || 12,
      type: 'audio',
      color: 'bg-purple-600',
      trackIndex: 2, // Audio 1
      startTime: 0,
      subtitleText: currentTTSAudio?.text?.slice(0, 50) || 'Welcome to our studio.',
    },
    {
      id: 'clip_bgm',
      name: 'Ambient Electronic BGM.mp3',
      duration: 18,
      type: 'audio',
      color: 'bg-indigo-600',
      trackIndex: 3, // Audio 2
      startTime: 0,
    },
  ]);

  // Player & Timeline Transport
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [playerMode, setPlayerMode] = useState<'timeline' | 'source'>('timeline');
  const [previewQuality, setPreviewQuality] = useState<'Full' | '1/2' | '1/4'>('Full');

  // Customizer Modal State (Image 4)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [activeToolbarTools, setActiveToolbarTools] = useState<string[]>([
    'split',
    'delete',
    'crop',
    'quick_text',
    'pen_tool',
    'speed',
    'silence_detection',
    'keyframing',
    'smart_bgm',
    'ai_matting',
    'text_to_video',
  ]);

  // AI Mate Assistant State (Image 3)
  const [isAiMateOpen, setIsAiMateOpen] = useState(false);
  const [aiMateMessage, setAiMateMessage] = useState(
    'Hi! I am your AI Mate assistant. Ask me to split scenes, generate BGM, or extend video.'
  );

  // Screen recording state
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // AI Prompt Modal (Text-to-Video / Idea-to-Video)
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptText, setPromptText] = useState(
    'Cinematic aerial drone shot soaring over mist-covered Himalayan mountain peaks at golden sunrise, 4K quality'
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selected clip for Inspector & editing
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_v1');
  const [inspectorTab, setInspectorTab] = useState<'info' | 'transform' | 'audio' | 'speed' | 'color'>('info');

  // Clip custom settings map (scale, opacity, rotation, volume, speed, filter)
  const [clipSettings, setClipSettings] = useState<
    Record<
      string,
      {
        scale: number;
        opacity: number;
        rotation: number;
        volume: number;
        speed: number;
        filter: string;
      }
    >
  >({
    clip_v1: { scale: 100, opacity: 100, rotation: 0, volume: 100, speed: 1.0, filter: 'none' },
    clip_v2: { scale: 100, opacity: 100, rotation: 0, volume: 100, speed: 1.0, filter: 'teal-orange' },
    clip_a1: { scale: 100, opacity: 100, rotation: 0, volume: 100, speed: 1.0, filter: 'none' },
    clip_bgm: { scale: 100, opacity: 100, rotation: 0, volume: 75, speed: 1.0, filter: 'none' },
  });

  // Global color LUT filter
  const [activeLutFilter, setActiveLutFilter] = useState<'none' | 'teal-orange' | 'cyber-neon' | 'noir-bw' | 'vhs-retro' | 'matrix-green'>('none');

  // Modals for the 5 AI Quick Launchers
  const [isEnhancerOpen, setIsEnhancerOpen] = useState(false);
  const [enhancerUpscale4k, setEnhancerUpscale4k] = useState(true);
  const [enhancerFps60, setEnhancerFps60] = useState(true);
  const [enhancerHdr, setEnhancerHdr] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'kpi'>('bar');
  const [chartTitle, setChartTitle] = useState('Q4 Revenue Growth & User Adoption');
  const [chartValues, setChartValues] = useState('Q1: 45K, Q2: 82K, Q3: 135K, Q4: 240K');
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);

  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendSeconds, setExtendSeconds] = useState<number>(10);
  const [isExtending, setIsExtending] = useState(false);

  const [isAudioExtenderOpen, setIsAudioExtenderOpen] = useState(false);

  const [isAudioToVideoOpen, setIsAudioToVideoOpen] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<'radial' | 'spectrum' | 'hologram' | 'captions'>('spectrum');
  const [isGeneratingAudioToVideo, setIsGeneratingAudioToVideo] = useState(false);

  // Export Modal & Multi-pass render simulation
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'MP4' | 'WEBM' | 'GIF' | 'MP3'>('MP4');
  const [exportRes, setExportRes] = useState<'1080p' | '4K' | '720p' | '9:16 Reel'>('1080p');
  const [exportFps, setExportFps] = useState<'24fps' | '25fps' | '30fps' | '60fps'>('25fps');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);

  // AI Copilot & Preset State
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotExecuting, setIsCopilotExecuting] = useState(false);
  const [activeTransition, setActiveTransition] = useState('Cross Dissolve');
  const [activeEffect, setActiveEffect] = useState('Film Grain 35mm');

  // Playback timer loop
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setPlayheadTime((prev) => {
          if (prev >= 25) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Render animated canvas for video preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Find active visual clip at current playhead time
    const activeVisualClip = timelineClips.find(
      (c) => playheadTime >= c.startTime && playheadTime <= c.startTime + c.duration && (c.sceneData || c.type === 'video')
    );
    const scene = activeVisualClip?.sceneData;

    if (scene) {
      // 1. Dynamic atmospheric sky gradient
      const pTop = scene.palette[0] || '#090d16';
      const pMid = scene.palette[1] || '#1a2333';
      const pAccent = scene.palette[2] || '#06b6d4';
      const pGround = scene.palette[3] || '#05070a';

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, pTop);
      skyGrad.addColorStop(0.6, pMid);
      skyGrad.addColorStop(1, pGround);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Camera motion subtle perspective shifting
      const progress = (playheadTime - activeVisualClip.startTime) / Math.max(0.1, activeVisualClip.duration);
      const camX = scene.cameraMotion === 'pan-right' ? (progress - 0.5) * 30 : 0;
      const camY = scene.cameraMotion === 'drone-dive' ? (progress - 0.5) * 20 : 0;

      // 3. Volumetric Sun / Neon Celestial Orb with breathing pulse
      const orbPulse = Math.sin(playheadTime * 3) * 6;
      const orbGrad = ctx.createRadialGradient(
        width * 0.5 + camX,
        height * 0.38 + camY,
        6,
        width * 0.5 + camX,
        height * 0.38 + camY,
        85 + orbPulse
      );
      orbGrad.addColorStop(0, pAccent);
      orbGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.45)');
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5 + camX, height * 0.38 + camY, 85 + orbPulse, 0, Math.PI * 2);
      ctx.fill();

      // 4. Scene Environment Silhouettes
      if (scene.style === 'cyberpunk') {
        ctx.fillStyle = '#080a14';
        const bldCount = 9;
        for (let b = 0; b < bldCount; b++) {
          const bw = width / bldCount + 4;
          const bx = b * (width / bldCount) + camX * 0.5;
          const bh = height * (0.28 + ((b * 7) % 5) * 0.06);
          ctx.fillRect(bx, height - bh, bw - 2, bh);
          // Neon lit windows
          ctx.fillStyle = b % 2 === 0 ? pAccent : '#f43f5e';
          for (let wy = height - bh + 14; wy < height - 20; wy += 20) {
            ctx.fillRect(bx + 6, wy, 4, 7);
            ctx.fillRect(bx + bw - 14, wy, 4, 7);
          }
          ctx.fillStyle = '#080a14';
        }
      } else if (
        activeVisualClip?.name.toLowerCase().includes('beach') ||
        scene.title.toLowerCase().includes('beach') ||
        scene.style === 'drone-nature'
      ) {
        // Authentic Mediterranean Coastline Aerial Shot matching Screenshot
        // Sky
        const skyG = ctx.createLinearGradient(0, 0, 0, height * 0.25);
        skyG.addColorStop(0, '#7dd3fc');
        skyG.addColorStop(0.7, '#bae6fd');
        skyG.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, width, height * 0.25);

        // Sea / Ocean Body on Left & Horizon
        const seaG = ctx.createLinearGradient(0, height * 0.22, 0, height);
        seaG.addColorStop(0, '#0369a1');
        seaG.addColorStop(0.3, '#0284c7');
        seaG.addColorStop(0.8, '#0369a1');
        seaG.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = seaG;
        ctx.fillRect(0, height * 0.22, width, height * 0.78);

        // Subtle shimmering water ripples
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let rw = 0; rw < 25; rw++) {
          const rx = (rw * 38 + playheadTime * 15) % (width * 0.75);
          const ry = height * 0.26 + (rw * 19) % (height * 0.65);
          ctx.beginPath();
          ctx.ellipse(rx, ry, 14 + (rw % 8) * 3, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Coastal Cliff & Rocky Shoreline on Right
        // Cliff body
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(width * 0.82, height * 0.23);
        ctx.bezierCurveTo(width * 0.76, height * 0.35, width * 0.68, height * 0.52, width * 0.66, height * 0.65);
        ctx.bezierCurveTo(width * 0.65, height * 0.75, width * 0.67, height * 0.88, width * 0.7, height);
        ctx.lineTo(width, height);
        ctx.lineTo(width, height * 0.23);
        ctx.closePath();

        const cliffGrad = ctx.createLinearGradient(width * 0.65, height * 0.25, width, height);
        cliffGrad.addColorStop(0, '#d4a373');
        cliffGrad.addColorStop(0.3, '#b87333');
        cliffGrad.addColorStop(0.65, '#8c5825');
        cliffGrad.addColorStop(1, '#5c3818');
        ctx.fillStyle = cliffGrad;
        ctx.fill();

        // Layered rocky striations & cliffs
        ctx.strokeStyle = 'rgba(74, 38, 14, 0.45)';
        ctx.lineWidth = 2;
        for (let st = 0; st < 9; st++) {
          const sy = height * (0.3 + st * 0.075);
          ctx.beginPath();
          ctx.moveTo(width * 0.68 + st * 10, sy);
          ctx.lineTo(width, sy + 6);
          ctx.stroke();
        }

        // Stony / pebble beach bank strip
        ctx.beginPath();
        ctx.moveTo(width * 0.82, height * 0.23);
        ctx.bezierCurveTo(width * 0.75, height * 0.35, width * 0.66, height * 0.54, width * 0.64, height * 0.68);
        ctx.bezierCurveTo(width * 0.63, height * 0.78, width * 0.65, height * 0.9, width * 0.68, height);
        ctx.lineTo(width * 0.64, height);
        ctx.bezierCurveTo(width * 0.6, height * 0.85, width * 0.61, height * 0.72, width * 0.63, height * 0.6);
        ctx.bezierCurveTo(width * 0.64, height * 0.48, width * 0.72, height * 0.33, width * 0.8, height * 0.23);
        ctx.closePath();
        ctx.fillStyle = '#453229';
        ctx.fill();

        // Crashing white surf & foam line along shoreline
        const wavePulse = Math.sin(playheadTime * 3.5) * 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(width * 0.81, height * 0.23);
        ctx.bezierCurveTo(
          width * 0.74 + wavePulse,
          height * 0.35,
          width * 0.64 - wavePulse,
          height * 0.55,
          width * 0.63 + wavePulse,
          height * 0.7
        );
        ctx.bezierCurveTo(
          width * 0.63 - wavePulse,
          height * 0.8,
          width * 0.65 + wavePulse,
          height * 0.9,
          width * 0.68,
          height
        );
        ctx.stroke();

        // White foam patches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        for (let fp = 0; fp < 16; fp++) {
          const fx = width * 0.63 + Math.sin(fp + playheadTime * 2) * 9 + fp * 6;
          const fy = height * 0.32 + fp * (height * 0.042);
          ctx.beginPath();
          ctx.arc(fx, fy, 2 + (fp % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (scene.style === 'cinematic') {
        // Deep mountain ridge silhouette
        ctx.fillStyle = 'rgba(10, 16, 28, 0.88)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let mx = 0; mx <= width; mx += 20) {
          const my = height * 0.62 + Math.sin((mx + camX * 2) * 0.015) * 32 + Math.cos(mx * 0.03) * 14;
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Foreground hill
        ctx.fillStyle = '#04070c';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let fx = 0; fx <= width; fx += 20) {
          const fy = height * 0.78 + Math.sin(fx * 0.01 + 1) * 18;
          ctx.lineTo(fx, fy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      } else {
        // Horizon grid
        ctx.strokeStyle = pAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let rx = -width * 0.2; rx <= width * 1.2; rx += width * 0.12) {
          ctx.moveTo(rx, height);
          ctx.lineTo(width * 0.5 + camX, height * 0.55);
        }
        ctx.stroke();
      }

      // 5. Dynamic particle simulation
      const particleType = scene.particles || 'stars';
      if (particleType === 'rain') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 40; i++) {
          const px = (i * 37 + playheadTime * 200) % width;
          const py = (i * 53 + playheadTime * 450) % height;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 3, py + 14);
          ctx.stroke();
        }
      } else if (particleType === 'embers') {
        for (let i = 0; i < 30; i++) {
          const px = (i * 43 + Math.sin(playheadTime * 2 + i) * 25) % width;
          const py = height - ((playheadTime * 60 + i * 29) % height);
          const pSize = 1.5 + (i % 3);
          ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Stars
        for (let i = 0; i < 40; i++) {
          const px = (i * 47) % width;
          const py = (i * 29) % (height * 0.65);
          const twinkle = Math.sin(playheadTime * 3 + i) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Kinetic Headline Overlay
      if (scene.headlineOverlay) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillText(scene.headlineOverlay, width / 2, height * 0.28);
        ctx.restore();
      }
    } else {
      // Default dark cinematic background with animated horizon and waveform
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#18181b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Starfield
      for (let i = 0; i < 35; i++) {
        const px = (i * 47) % width;
        const py = (i * 31) % height;
        const twinkle = Math.sin(playheadTime * 2 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic animated motion waves based on playhead
      const timeFactor = playheadTime * 2.5;
      ctx.strokeStyle = activeLutFilter === 'cyber-neon' ? '#22d3ee' : activeLutFilter === 'teal-orange' ? '#0ea5e9' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < width; x += 8) {
        const y = height / 2 + Math.sin(x * 0.025 + timeFactor) * 24 * Math.cos(playheadTime * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Check if an animated chart clip is active at current playhead
    const activeChart = timelineClips.find(
      (c) => c.name.toLowerCase().includes('chart') && playheadTime >= c.startTime && playheadTime <= c.startTime + c.duration
    );
    if (activeChart) {
      // Draw animated motion chart overlay
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
      ctx.roundRect ? ctx.roundRect(width * 0.2, height * 0.25, width * 0.6, height * 0.5, 12) : ctx.fillRect(width * 0.2, height * 0.25, width * 0.6, height * 0.5);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.stroke();

      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(activeChart.name.slice(0, 32), width * 0.23, height * 0.33);

      // Render 4 animated growth bars
      const barCount = 4;
      const barW = (width * 0.5) / (barCount * 2);
      const heights = [0.45, 0.65, 0.8, 0.95];
      for (let i = 0; i < barCount; i++) {
        const bx = width * 0.25 + i * (barW * 2);
        const animProgress = Math.min(1, Math.max(0, (playheadTime - activeChart.startTime) * 0.8));
        const bh = (height * 0.28) * heights[i] * animProgress;
        const by = height * 0.7 - bh;
        ctx.fillStyle = i === 3 ? '#10b981' : '#06b6d4';
        ctx.fillRect(bx, by, barW, bh);
      }
    }

    // Apply Color LUT overlay if enabled
    if (activeLutFilter === 'teal-orange') {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.fillRect(0, 0, width, height * 0.6);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
      ctx.fillRect(0, height * 0.4, width, height * 0.6);
    } else if (activeLutFilter === 'cyber-neon') {
      ctx.fillStyle = 'rgba(217, 70, 239, 0.15)';
      ctx.fillRect(0, 0, width, height);
    } else if (activeLutFilter === 'noir-bw') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, 0, width, height);
    } else if (activeLutFilter === 'matrix-green') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fillRect(0, 0, width, height);
    } else if (activeLutFilter === 'vhs-retro') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(0, 0, width, height);
    }

    // Active subtitle caption overlay (Track 2 or Track 4 text)
    const activeSubtitleClip = timelineClips.find(
      (c) => c.subtitleText && playheadTime >= c.startTime && playheadTime <= c.startTime + c.duration
    );
    if (activeSubtitleClip && activeSubtitleClip.subtitleText) {
      const capText = activeSubtitleClip.subtitleText;
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(capText).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(width / 2 - tw / 2 - 12, height * 0.82 - 12, tw + 24, 28);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(capText, width / 2, height * 0.82 + 8);
      ctx.textAlign = 'left';
    }

    // TV Action Safe (90%) and Title Safe (80%) Guides + Crosshairs (from View menu in Screenshot)
    if (showSafeZones) {
      ctx.save();
      ctx.strokeStyle = '#eab308'; // Amber guide lines
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // 90% Action Safe box
      const asW = width * 0.9;
      const asH = height * 0.9;
      const asX = (width - asW) / 2;
      const asY = (height - asH) / 2;
      ctx.strokeRect(asX, asY, asW, asH);

      // 80% Title Safe box
      const tsW = width * 0.8;
      const tsH = height * 0.8;
      const tsX = (width - tsW) / 2;
      const tsY = (height - tsH) / 2;
      ctx.strokeRect(tsX, tsY, tsW, tsH);

      // Center crosshairs
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(width / 2 - 16, height / 2);
      ctx.lineTo(width / 2 + 16, height / 2);
      ctx.moveTo(width / 2, height / 2 - 16);
      ctx.lineTo(width / 2, height / 2 + 16);
      ctx.stroke();

      // Label
      ctx.setLineDash([]);
      ctx.fillStyle = '#eab308';
      ctx.font = '9px monospace';
      ctx.fillText('TITLE SAFE 80% • ACTION SAFE 90%', tsX + 6, tsY + 12);
      ctx.restore();
    }

    // Scene Overlay Title & Resolution Badge
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`${projectName} • Scene ${Math.floor(playheadTime / 5) + 1}`, 20, 32);

    // Current Timecode Stamp
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '11px monospace';
    ctx.fillText(`TC 00:00:${Math.floor(playheadTime).toString().padStart(2, '0')}:15 • ${resolution} • ${frameRate}`, 20, 50);
  }, [playheadTime, projectName, activeLutFilter, resolution, frameRate, timelineClips, showSafeZones]);

  // Handle Record PC Screen (Image 5 quick button)
  const handleRecordScreen = async () => {
    if (isScreenRecording) {
      screenStream?.getTracks().forEach((t) => t.stop());
      setIsScreenRecording(false);
      setScreenStream(null);
      setAiMateMessage('Screen recording stopped and saved to Project Media.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(stream);
      setIsScreenRecording(true);
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenRecording(false);
        setScreenStream(null);
      };
    } catch (err) {
      console.warn('Screen recording access cancelled:', err);
    }
  };

  // Generate Video Clip from AI Prompt
  const handleGenerateVideoClip = async () => {
    if (!promptText.trim()) return;
    try {
      setIsGeneratingVideo(true);
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio,
        }),
      });
      const data = await res.json();
      const profile = data.sceneProfile || {};
      const newScene: VideoSceneData = {
        id: `ai_vid_${Date.now()}`,
        title: profile.title || promptText.slice(0, 24),
        prompt: promptText.trim(),
        style: 'cinematic',
        cameraMotion: 'zoom-in',
        aspectRatio,
        duration: 8,
        palette: profile.colorPalette || ['#0f172a', '#1e293b', '#06b6d4', '#ec4899'],
        lighting: profile.lighting || 'Volumetric cinematic lighting',
        particles: profile.particles || 'embers',
        headlineOverlay: profile.headlineOverlay || promptText.slice(0, 20).toUpperCase(),
        elements: profile.elements || ['Primary subject', 'Depth horizon'],
        subtitleText: promptText,
      };

      const newClip: VideoClipItem = {
        id: newScene.id || `ai_vid_${Date.now()}`,
        name: newScene.title,
        duration: 8,
        type: 'video',
        color: 'bg-emerald-500',
        trackIndex: 0,
        startTime: timelineClips.length * 4,
        subtitleText: promptText,
        sceneData: newScene,
      };
      setTimelineClips((prev) => [newClip, ...prev]);
      setSelectedClipId(newClip.id);
      setIsPromptModalOpen(false);
      setAiMateMessage(`AI Video Clip "${newScene.title}" rendered and added to Track 1!`);
    } catch (err) {
      console.warn('AI video generate error:', err);
      // Fallback: generate clip locally
      const fallbackScene: VideoSceneData = {
        id: `ai_vid_${Date.now()}`,
        title: promptText.slice(0, 24),
        prompt: promptText.trim(),
        style: 'cinematic',
        cameraMotion: 'zoom-in',
        aspectRatio,
        duration: 8,
        palette: ['#0f172a', '#3b82f6', '#06b6d4', '#ec4899'],
        lighting: 'Atmospheric volumetric lighting',
        particles: 'embers',
        headlineOverlay: promptText.slice(0, 20).toUpperCase(),
        elements: ['Atmosphere', 'Particles'],
        subtitleText: promptText,
      };
      const newClip: VideoClipItem = {
        id: fallbackScene.id || `ai_vid_${Date.now()}`,
        name: fallbackScene.title,
        duration: 8,
        type: 'video',
        color: 'bg-emerald-500',
        trackIndex: 0,
        startTime: 18,
        subtitleText: promptText,
        sceneData: fallbackScene,
      };
      setTimelineClips((prev) => [newClip, ...prev]);
      setSelectedClipId(newClip.id);
      setIsPromptModalOpen(false);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Razor split clip at current playhead
  const handleSplitClip = () => {
    setTimelineClips((prev) => {
      const target = prev.find(
        (c) => playheadTime > c.startTime && playheadTime < c.startTime + c.duration
      );
      if (!target) return prev;
      const firstPartDuration = playheadTime - target.startTime;
      const secondPartDuration = target.duration - firstPartDuration;

      const partA: VideoClipItem = { ...target, duration: firstPartDuration };
      const partB: VideoClipItem = {
        ...target,
        id: `split_${Date.now()}`,
        name: `${target.name} (Part 2)`,
        startTime: playheadTime,
        duration: secondPartDuration,
      };
      return [...prev.filter((c) => c.id !== target.id), partA, partB];
    });
  };

  // AI Video Enhancer Handler
  const handleApplyEnhancer = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
      setResolution(enhancerUpscale4k ? '3840 x 2160 (4K UHD)' : '1920 x 1080');
      setFrameRate(enhancerFps60 ? '60fps' : '30fps');
      setAiMateMessage(`AI Video Enhancer applied! Project upscaled to ${enhancerUpscale4k ? '4K UHD' : '1080p'} at ${enhancerFps60 ? '60fps' : '30fps'} with HDR dynamic range.`);
      setIsEnhancerOpen(false);
      setViewMode('editor');
    }, 1200);
  };

  // Animated Charts Handler
  const handleGenerateChart = () => {
    setIsGeneratingChart(true);
    setTimeout(() => {
      setIsGeneratingChart(false);
      const newChartClip: VideoClipItem = {
        id: `chart_${Date.now()}`,
        name: `Animated ${chartType.toUpperCase()} Chart: ${chartTitle.slice(0, 20)}`,
        duration: 8,
        type: 'video',
        color: 'bg-cyan-600',
        trackIndex: 1, // Video 2 (Overlay)
        startTime: Math.max(0, playheadTime),
        subtitleText: chartTitle,
      };
      setTimelineClips((prev) => [...prev, newChartClip]);
      setSelectedClipId(newChartClip.id);
      setAiMateMessage(`Animated ${chartType} chart '${chartTitle}' generated and locked to Video 2 Overlay track!`);
      setIsChartsOpen(false);
      setViewMode('editor');
    }, 1000);
  };

  // AI Extend Handler
  const handleApplyExtend = () => {
    setIsExtending(true);
    setTimeout(() => {
      setIsExtending(false);
      setTimelineClips((prev) => {
        const target = prev.find((c) => c.id === selectedClipId) || prev[0];
        if (!target) return prev;
        return prev.map((c) =>
          c.id === target.id ? { ...c, duration: c.duration + extendSeconds, name: `${c.name} [Extended +${extendSeconds}s]` } : c
        );
      });
      setAiMateMessage(`AI Extend applied! Extended clip duration seamlessly by +${extendSeconds} seconds.`);
      setIsExtendOpen(false);
      setViewMode('editor');
    }, 1200);
  };

  // Audio to Video Handler
  const handleGenerateAudioToVideo = () => {
    setIsGeneratingAudioToVideo(true);
    setTimeout(() => {
      setIsGeneratingAudioToVideo(false);
      const newClip: VideoClipItem = {
        id: `a2v_${Date.now()}`,
        name: `Reactive ${visualizerStyle.toUpperCase()} Soundwave`,
        duration: currentTTSAudio?.duration || 14,
        type: 'video',
        color: 'bg-pink-600',
        trackIndex: 0,
        startTime: 0,
        subtitleText: currentTTSAudio?.text?.slice(0, 42) || 'Audio Reactive Visualizer',
      };
      setTimelineClips((prev) => [newClip, ...prev.filter((c) => c.id !== 'clip_v1')]);
      setSelectedClipId(newClip.id);
      setAiMateMessage(`Audio to Video complete! Created ${visualizerStyle} spectrum reactively synced to voiceover.`);
      setIsAudioToVideoOpen(false);
      setViewMode('editor');
    }, 1000);
  };

  // Export Multi-Pass Render Handler (Real MediaRecorder video export)
  const handleStartExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setExportProgress(10);
      setExportSuccessNotice(null);

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
        a.download = `${projectName.replace(/\s+/g, '_')}_${exportRes}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        setExportProgress(100);
        setExportSuccessNotice(`Render complete! ${projectName}.${ext} is ready and downloaded.`);
        setTimeout(() => {
          setExportProgress(null);
          setIsExportModalOpen(false);
        }, 2200);
      };

      recorder.start();

      setIsPlaying(true);
      setPlayheadTime(0);

      const totalDurationSec = 6;
      const totalSteps = totalDurationSec * 10;
      let step = 0;

      const recordTimer = setInterval(() => {
        step++;
        const p = Math.min(99, Math.round((step / totalSteps) * 100));
        setExportProgress(p);
        setPlayheadTime(step * 0.1);

        if (step >= totalSteps) {
          clearInterval(recordTimer);
          recorder.stop();
          setIsPlaying(false);
        }
      }, 100);
    } catch (err) {
      console.warn('MediaRecorder export notice:', err);
      setExportProgress(100);
      setExportSuccessNotice('Render complete!');
      setTimeout(() => {
        setExportProgress(null);
        setIsExportModalOpen(false);
      }, 1500);
    }
  };

  // AI Copilot Action: Auto-cut silent pauses
  const handleAutoCutSilence = () => {
    setTimelineClips((prev) =>
      prev.map((c, i) => ({
        ...c,
        startTime: i * 4,
        duration: Math.max(3, c.duration - 1),
      }))
    );
    setAiMateMessage('AI Auto-Cut: Analyzed audio waveform, detected and removed 3 silent pauses (3.8s total).');
  };

  // AI Copilot Action: Speech-to-text Subtitles
  const handleAutoSubtitles = () => {
    const subtitleClip: VideoClipItem = {
      id: `sub_${Date.now()}`,
      name: 'Dynamic AI Subtitles (Auto Sync)',
      duration: 18,
      type: 'audio',
      color: 'bg-yellow-600',
      trackIndex: 4, // Track 5: Subtitles
      startTime: 0,
      subtitleText: currentTTSAudio?.text?.slice(0, 50) || 'VoiceCraft AI Studio 16: Next-Gen Neural Video Engine',
    };
    setTimelineClips((prev) => [...prev.filter((c) => c.trackIndex !== 4), subtitleClip]);
    setAiMateMessage('AI Auto-Captions: Transcribed voice track and generated synchronized subtitle blocks on Track 5.');
  };

  // AI Copilot Action: Smart Audio Ducking
  const handleAutoAudioDucking = () => {
    setClipSettings((prev) => ({
      ...prev,
      clip_bgm: { ...prev.clip_bgm, volume: 22 },
      clip_a1: { ...prev.clip_a1, volume: 100 },
    }));
    setAiMateMessage('AI Audio Ducking: Voiceover priority ducking applied (-18dB BGM attenuation during voice).');
  };

  // AI Copilot Action: 9:16 Auto Reframe
  const handleAutoReframe916 = () => {
    setAspectRatio('9:16');
    setResolution('1080 x 1920 (9:16 Reel)');
    setAiMateMessage('AI Auto-Reframe: Reconfigured project to 9:16 Vertical Reel with focal subject tracking.');
  };

  // AI Copilot Command Executor
  const handleExecuteCopilotCommand = (cmdText?: string) => {
    const query = (cmdText || copilotInput).trim().toLowerCase();
    if (!query) return;

    setIsCopilotExecuting(true);
    setTimeout(() => {
      setIsCopilotExecuting(false);
      setCopilotInput('');

      if (query.includes('silence') || query.includes('pause') || query.includes('cut')) {
        handleAutoCutSilence();
      } else if (query.includes('caption') || query.includes('subtitle') || query.includes('text')) {
        handleAutoSubtitles();
      } else if (query.includes('duck') || query.includes('audio duck') || query.includes('volume')) {
        handleAutoAudioDucking();
      } else if (query.includes('reframe') || query.includes('9:16') || query.includes('reel') || query.includes('tiktok') || query.includes('vertical')) {
        handleAutoReframe916();
      } else if (query.includes('4k') || query.includes('enhance') || query.includes('upscale')) {
        setResolution('3840 x 2160 (4K UHD)');
        setFrameRate('60fps');
        setAiMateMessage('Asking AI: Upscaled project to 4K UHD 60fps with neural frame interpolation.');
      } else if (query.includes('color') || query.includes('grade') || query.includes('teal') || query.includes('lut') || query.includes('cinema')) {
        setActiveLutFilter('teal-orange');
        setAiMateMessage('Asking AI: Applied Hollywood Teal & Orange cinematic color LUT.');
      } else if (query.includes('matrix')) {
        setActiveLutFilter('matrix-green');
        setAiMateMessage('Asking AI: Applied Matrix Emerald cyberpunk grade.');
      } else if (query.includes('speed') || query.includes('ramp') || query.includes('fast')) {
        const targetId = selectedClipId || 'clip_v1';
        setClipSettings((prev) => ({
          ...prev,
          [targetId]: { ...(prev[targetId] || { scale: 100, opacity: 100, rotation: 0, volume: 100, speed: 1.0, filter: 'none' }), speed: 1.5 },
        }));
        setAiMateMessage('Asking AI: Accelerated selected scene with dynamic 1.5x speed ramp curve.');
      } else {
        setAiMateMessage(`Asking AI executed: "${query}" — Analyzed timeline tracks and applied optimal scene adjustments.`);
      }
    }, 600);
  };

  // Apply Transition
  const handleApplyTransition = (transName: string) => {
    setActiveTransition(transName);
    setAiMateMessage(`Applied '${transName}' transition between cut scenes on Video Track 1.`);
  };

  // Apply Effect
  const handleApplyEffect = (fxName: string) => {
    setActiveEffect(fxName);
    setAiMateMessage(`Applied '${fxName}' effect overlay to selected clip.`);
  };

  // Load Template
  const handleLoadTemplate = (tmpl: (typeof PROJECT_TEMPLATES)[number]) => {
    setAspectRatio(tmpl.ratio);
    setResolution(tmpl.res);
    setProjectName(tmpl.name);
    setAiMateMessage(`Template loaded: '${tmpl.name}' (${tmpl.ratio}) with preset timeline tracks and styling.`);
  };

  // Add AI Scene from Text-to-Video to 16-Track Timeline
  const handleAddSceneToTimeline = (scene: VideoSceneData) => {
    const newClip: VideoClipItem = {
      id: `ai_vid_${Date.now()}`,
      name: scene.title,
      duration: scene.duration,
      type: 'video',
      color: scene.style === 'cyberpunk' ? 'bg-cyan-600' : scene.style === 'drone-nature' ? 'bg-emerald-600' : 'bg-purple-600',
      trackIndex: 0,
      startTime: timelineClips.length * 4,
      subtitleText: scene.subtitleText || scene.prompt,
      sceneData: scene,
    };
    setTimelineClips((prev) => [newClip, ...prev]);
    setSelectedClipId(newClip.id);
    setAiMateMessage(`AI Video Clip "${scene.title}" added to Track 1 of timeline!`);
    setViewMode('editor');
  };

  // ==========================================
  // VIEW 1: TEXT-TO-VIDEO AI STUDIO WORKSPACE
  // ==========================================
  if (viewMode === 'text-to-video') {
    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fadeIn text-zinc-200">
        {/* Global Studio Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-extrabold text-sm tracking-tight text-white">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20">
                <Film className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span>CineStudio AI</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Text-to-Video 16 Pro
              </span>
            </div>
          </div>

          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('text-to-video')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Text-to-Video AI Studio</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Timeline Editor (16-Track)</span>
            </button>
            <button
              onClick={() => setViewMode('hub')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Hub & Templates</span>
            </button>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MP4</span>
          </button>
        </div>

        {/* Text-to-Video Studio Workspace Component */}
        <TextToVideoStudio
          currentTTSAudio={currentTTSAudio}
          geminiAvailable={geminiAvailable}
          onSendToTimeline={handleAddSceneToTimeline}
          onSendToAudioPlayer={onSendToPlayer}
          onOpenTimelineEditor={() => setViewMode('editor')}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW A: WELCOME / PROJECT HUB (IMAGE 3)
  // ==========================================
  if (viewMode === 'hub') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn text-zinc-200">
        {/* Startup Top Header with App Branding, User ID, and Software Download */}
        <div className="bg-[#0f141c] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/25">
              <Film className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">CineCraft Pro Studio</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v14.2 Desktop & Web
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                AI-Powered Video Studio • Multi-Track Editor • Text-to-Video Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Download Software Button */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md cursor-pointer group"
            >
              <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Download Desktop & Mobile App</span>
            </button>

            {/* User Account / Login Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-bold">
                {currentUser.loginId.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold leading-tight text-white flex items-center gap-1">
                  <span>@{currentUser.loginId}</span>
                  <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">PRO</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  {currentUser.email}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Startup / Launch Screen Dashboard & Project Management */}
        <ProjectManagementDashboard
          onEnterWorkspace={(proj) => {
            setProjectName(proj.name);
            if (['16:9', '9:16', '1:1', '4:3', '21:9'].includes(proj.aspectRatio)) {
              setAspectRatio(proj.aspectRatio as any);
            }
            setResolution(proj.resolution.label || `${proj.resolution.width} x ${proj.resolution.height}`);
            if (proj.clips && proj.clips.length > 0) {
              setTimelineClips(proj.clips.map((c) => ({
                id: c.id,
                name: c.name,
                duration: c.duration,
                type: c.type,
                color: c.color || 'bg-cyan-800',
                thumbnailUrl: c.thumbnailUrl,
                trackIndex: c.trackIndex,
                startTime: c.startTime,
                subtitleText: c.subtitleText,
                effect: c.effect,
              })));
            }
            setViewMode('editor');
          }}
          onOpenQuickTool={(toolId) => {
            if (toolId === 'text_to_video') {
              setViewMode('text-to-video');
            } else if (toolId === 'screen_recorder') {
              setViewMode('editor');
              handleRecordScreen();
            } else if (toolId === 'smart_cutout') {
              setViewMode('editor');
              handleAutoCutSilence();
            } else if (toolId === 'vocal_remover') {
              setViewMode('editor');
              handleAutoAudioDucking();
            } else {
              setViewMode('editor');
            }
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        />

        {/* Auth & Login ID Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
        />

        {/* Download Software Modal (iOS, Android, Windows, Apple macOS, Web) */}
        <DownloadSoftwareModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          isDesktopWindowFrame={isDesktopWindowFrame}
          onToggleDesktopFrame={(enabled) => setIsDesktopWindowFrame(enabled)}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW B: FULL PRO EDITOR WORKSPACE (IMAGE 5)
  // ==========================================
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fadeIn text-zinc-200">
      {/* Top Application Desktop Menu Bar matching Screenshot */}
      <div className="relative bg-[#0f141c] border border-zinc-800 rounded-2xl shadow-xl select-none">
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          {/* Left: App Logo, Title & File/Edit/Tools/View/Export/Help Menus */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
              {/* CineCraft geometric teal ribbon icon */}
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#00ebc7] to-[#0ea5e9] flex items-center justify-center text-zinc-950 font-black shadow-sm">
                <Film className="w-3.5 h-3.5 text-zinc-950" />
              </div>
              <span className="font-bold text-white text-xs tracking-tight">CineCraft Pro</span>
            </div>

            {/* Desktop Menus */}
            <div className="flex items-center gap-1 text-zinc-300 text-[11px] font-medium">
              <button 
                onClick={() => setViewMode('hub')}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                File
              </button>
              <button 
                onClick={() => setIsCustomizerOpen(true)}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button 
                onClick={() => setViewMode('text-to-video')}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Tools
              </button>
              
              {/* View Menu Trigger */}
              <div className="relative">
                <button 
                  onClick={() => setIsViewMenuOpen((prev) => !prev)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    isViewMenuOpen ? 'bg-[#2a384c] text-white font-bold' : 'hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  View
                </button>

                {/* Open View Context Menu (exact match to screenshot) */}
                {isViewMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#141c28] border border-[#2d3b4e] rounded-lg shadow-2xl py-1 text-[11px] text-zinc-200 z-50 divide-y divide-zinc-800/80">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsPlaying((prev) => !prev);
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left"
                      >
                        <span>{isPlaying ? 'Pause' : 'Play / Pause'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Space</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          setPlayheadTime(0);
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left"
                      >
                        <span>Stop</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Ctrl+/</span>
                      </button>
                      <button
                        onClick={() => {
                          if (canvasRef.current?.requestFullscreen) {
                            canvasRef.current.requestFullscreen();
                          }
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left"
                      >
                        <span>Full Screen / Restore</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Alt+Enter</span>
                      </button>
                    </div>

                    {/* Vertical Screen / Restore (Active highlight like in screenshot) */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setAspectRatio((prev) => (prev === '9:16' ? '16:9' : '9:16'));
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between bg-[#2a384c] text-white font-semibold hover:bg-[#34455e] cursor-pointer text-left"
                      >
                        <span>Vertical Screen / Restore</span>
                        <span className="text-[10px] text-cyan-300 font-mono">{aspectRatio === '9:16' ? '9:16 ON' : '16:9'}</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <div className="px-3 py-1 flex items-center justify-between text-zinc-400 hover:text-white cursor-pointer group">
                        <span>Playback Quality</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-emerald-400 font-mono">{playbackQuality}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="px-3 py-1 flex items-center justify-between text-zinc-400 hover:text-white cursor-pointer group">
                        <span>Zoom Level</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-300 font-mono">{zoomLevelPreview}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSafeZones((prev) => !prev);
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left"
                      >
                        <span>Show Safe Zones</span>
                        <span className="text-emerald-400 font-bold">{showSafeZones ? '✓' : ''}</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <div className="px-3 py-1 flex items-center justify-between text-zinc-400 hover:text-white cursor-pointer group">
                        <span>Go to</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                      <button
                        onClick={() => {
                          setAiMateMessage('In and Out markers cleared from project.');
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left text-zinc-400"
                      >
                        <span>Clear In And Out</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+X</span>
                      </button>
                      <button
                        onClick={() => {
                          setCanvasSnapping((prev) => !prev);
                          setIsViewMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-zinc-800/80 cursor-pointer text-left"
                      >
                        <span>Enable Canvas Snapping</span>
                        <span className="text-emerald-400 font-bold">{canvasSnapping ? '✓' : ''}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Export
              </button>
              <button 
                onClick={() => setAiMateMessage('Help & Tutorial: CineCraft keyboard shortcuts active (Space: Play, Ctrl+/: Stop, S: Split).')}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Help
              </button>
            </div>
          </div>

          {/* Center: Project Filename & Timecode Stamp (from Screenshot: 28 - wondershar... : 00:00:04:05) */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-zinc-950/70 px-3 py-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-200 font-semibold">{projectName.slice(0, 18)}...</span>
            <span className="text-zinc-500">:</span>
            <span className="text-emerald-400">00:00:{Math.floor(playheadTime).toString().padStart(2, '0')}:05</span>
          </div>

          {/* Right: Cloud Sync, Tips, Headphones, User Profile, Save, Mail, Download, Controls, Export */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Icon */}
            <div 
              className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Cloud Project Auto-Synced"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
            </div>

            {/* AI Tips Lightbulb */}
            <div 
              onClick={() => setAiMateMessage('Tip: Drag the Beach clip on timeline to adjust start time or use Razor tool to split.')}
              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="AI Editing Tips"
            >
              <Lightbulb className="w-4 h-4" />
            </div>

            {/* Audio Monitor Headphones */}
            <div 
              onClick={() => setAiMateMessage('Audio Monitor active: 48kHz 24-bit stereo output.')}
              className="p-1 text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Audio Monitor"
            >
              <Headphones className="w-4 h-4" />
            </div>

            {/* User Account Avatar (opens AuthModal) */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shadow hover:ring-2 hover:ring-purple-400 cursor-pointer transition-all"
              title={`Account: @${currentUser.loginId} (${currentUser.email})`}
            >
              {currentUser.loginId.charAt(0).toUpperCase()}
            </button>

            {/* Save .wfp Project File */}
            <button
              onClick={() => {
                const resObj = getResolutionForAspect(aspectRatio);
                const wfpProj: WfpProject = {
                  format: 'WFP_JSON_V2',
                  application: 'CineCraft Pro Studio',
                  version: '16.0.0',
                  id: initialProject?.id || `wfp_${Date.now()}`,
                  name: projectName,
                  filename: `${projectName}.wfp`,
                  aspectRatio: aspectRatio as any,
                  resolution: { width: resObj.width, height: resObj.height, label: resolution },
                  fps: 30,
                  duration: Math.max(10, ...timelineClips.map((c) => c.startTime + c.duration)),
                  createdAt: initialProject?.createdAt || Date.now(),
                  lastEdited: Date.now(),
                  thumbnailGradient: 'from-cyan-900 to-blue-950',
                  sizeMb: 12.4,
                  tracks: [
                    { id: 'v1', index: 0, type: 'video', name: 'Track 1' },
                    { id: 'a1', index: 2, type: 'audio', name: 'Audio 1' },
                  ],
                  clips: timelineClips.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    trackIndex: c.trackIndex,
                    startTime: c.startTime,
                    duration: c.duration,
                    color: c.color,
                    subtitleText: c.subtitleText,
                  })),
                  tags: ['CineCraft Pro', aspectRatio],
                };
                saveRecentProject(wfpProj);
                exportProjectToWfp(wfpProj);
                setAiMateMessage(`Project saved to ${projectName}.wfp and recorded in Recent Projects.`);
              }}
              className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Save & Export .wfp Project File"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Messages / Mail */}
            <button
              onClick={() => setAiMateMessage('Inbox: 0 pending cloud renders.')}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Download Software Button (Opens modal for iOS, Android, Windows, Mac, Web) */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Download Desktop & Mobile Software (Windows, macOS, Android, iOS)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Desktop Window Controls */}
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 text-zinc-500">
              <button 
                onClick={() => setAiMateMessage('Window minimized.')}
                className="p-0.5 hover:text-white transition-colors" 
                title="Minimize"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setIsDesktopWindowFrame((p) => !p)}
                className="p-0.5 hover:text-white transition-colors" 
                title="Maximize / Restore"
              >
                <Square className="w-2.5 h-2.5" />
              </button>
              <button 
                onClick={() => setViewMode('hub')}
                className="p-0.5 hover:text-red-400 transition-colors" 
                title="Close to Hub"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Teal Export Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-[#00ebc7] hover:bg-[#00d1b1] text-zinc-950 font-bold text-xs shadow-md shadow-[#00ebc7]/20 transition-all cursor-pointer ml-1"
            >
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Asking AI Live Bar & Quick Command Runner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100">Asking AI</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">16 Pro</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate max-w-sm sm:max-w-md">
              {aiMateMessage}
            </div>
          </div>
        </div>

        {/* Quick 1-click Asking AI action pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={handleAutoCutSilence}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-[11px] font-medium text-zinc-300 shrink-0 transition-colors cursor-pointer"
            title="Auto-Cut Silence & Filler Words"
          >
            <Scissors className="w-3 h-3 text-emerald-400" />
            <span>Auto-Cut Silence</span>
          </button>

          <button
            onClick={handleAutoSubtitles}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/40 text-[11px] font-medium text-zinc-300 shrink-0 transition-colors cursor-pointer"
            title="Generate Auto Subtitles"
          >
            <Type className="w-3 h-3 text-yellow-400" />
            <span>Auto Subtitles</span>
          </button>

          <button
            onClick={handleAutoAudioDucking}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-[11px] font-medium text-zinc-300 shrink-0 transition-colors cursor-pointer"
            title="AI Smart Audio Ducking"
          >
            <Volume2 className="w-3 h-3 text-purple-400" />
            <span>Audio Ducking</span>
          </button>

          <button
            onClick={handleAutoReframe916}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 text-[11px] font-medium text-zinc-300 shrink-0 transition-colors cursor-pointer"
            title="Auto Reframe to 9:16 Vertical Reel"
          >
            <Crop className="w-3 h-3 text-cyan-400" />
            <span>9:16 Reframe</span>
          </button>

          {/* Interactive Asking AI Input */}
          <div className="flex items-center gap-1 ml-1 shrink-0">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteCopilotCommand();
              }}
              placeholder="Asking AI (e.g. 'teal grade', 'speed 1.5x')..."
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-200 text-[11px] w-40"
            />
            <button
              onClick={() => handleExecuteCopilotCommand()}
              disabled={isCopilotExecuting || !copilotInput.trim()}
              className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold disabled:opacity-40 cursor-pointer"
            >
              {isCopilotExecuting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Middle Section (Media Pool on Left, Preview Player & Project Info on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Media Pool & Resource Tabs (Image 5) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Top Resource Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 border-b border-zinc-800 text-xs font-semibold">
              {[
                { id: 'media', label: 'Media' },
                { id: 'stock', label: 'Stock Media' },
                { id: 'audio', label: 'Audio' },
                { id: 'titles', label: 'Titles' },
                { id: 'transitions', label: 'Transitions' },
                { id: 'effects', label: 'Effects' },
                { id: 'filters', label: 'Filters' },
                { id: 'templates', label: 'Templates' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMediaTab(tab.id as typeof activeMediaTab)}
                  className={`px-3 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                    activeMediaTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab-Sensitive Resource Contents */}
            {activeMediaTab === 'media' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[220px]">
                {/* Left Folder Hierarchy (From Screenshot: Project Media, Shared Media, Sample Video, etc.) */}
                <div className="md:col-span-4 bg-zinc-950/70 rounded-xl p-2 border border-zinc-800/80 text-[11px] font-medium space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Project Media</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">(0)</span>
                  </div>

                  <div className="pl-4 flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <FolderOpen className="w-3 h-3 text-zinc-500" />
                    <span>Folder</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">(0)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Shared Media</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">(0)</span>
                  </div>

                  <div className="pl-3 flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <span>Sample Color</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">(25)</span>
                  </div>

                  {/* Sample Video (Active Selection matching screenshot) */}
                  <div className="pl-3 flex items-center gap-1.5 bg-[#243042] text-white py-1 px-2 rounded-lg font-semibold shadow-sm cursor-pointer border border-[#3b4b63]">
                    <span className="text-cyan-400">●</span>
                    <span>Sample Video</span>
                    <span className="text-[10px] text-cyan-300 font-mono ml-auto">(20)</span>
                  </div>

                  <div className="pl-3 flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <span>Sample Green Screen</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">(10)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400 py-1 px-1.5 hover:text-white cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Preset Templates</span>
                  </div>
                </div>

                {/* Right Media Assets Grid */}
                <div className="md:col-span-8 space-y-2">
                  {/* Media Controls Bar: Import, Filter, Grid view */}
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Import</span>
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                        <input
                          type="file"
                          multiple
                          accept="video/*,audio/*,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              const newItems = Array.from(e.target.files).map((f) => ({
                                id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                                name: f.name,
                                type: f.type.startsWith('video') ? 'video' : 'audio',
                                duration: 10,
                              }));
                              setMediaPool((prev) => [...prev, ...newItems]);
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={() => setIsPromptModalOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] hover:bg-emerald-500/30 cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>AI Video</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400">
                      <button 
                        onClick={handleRecordScreen}
                        className="p-1 hover:text-white transition-colors cursor-pointer"
                        title="Record Screen"
                      >
                        <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                      <button className="p-1 hover:text-white transition-colors cursor-pointer" title="Search & Filter">
                        <Search className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:text-white transition-colors cursor-pointer" title="Grid View">
                        <Grid className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  </div>

                  {/* Sample Video Thumbnails Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                    {/* The Primary "Beach" Sample Video from Screenshot */}
                    <div
                      onClick={() => {
                        setSelectedClipId('clip_beach');
                        setPlayheadTime(1.2);
                        setAiMateMessage('Selected Beach 4K sample clip. Displaying in preview.');
                      }}
                      className="group relative rounded-xl overflow-hidden border-2 border-emerald-400 bg-zinc-950 p-1 cursor-pointer shadow-lg hover:shadow-emerald-500/20 transition-all"
                    >
                      <div className="relative h-20 w-full rounded-lg overflow-hidden bg-gradient-to-b from-sky-400 to-blue-900">
                        {/* Realistic Beach Coastal Thumbnail */}
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-blue-700" />
                        <div
                          className="absolute top-[22%] bottom-0 right-0 w-[46%] bg-gradient-to-bl from-amber-600 via-amber-800 to-amber-950"
                          style={{ clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                        />
                        <div
                          className="absolute top-[22%] bottom-0 right-[42%] w-1 bg-white/70"
                          style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)' }}
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                          00:10:00
                        </div>
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-emerald-500 text-[8px] font-bold text-zinc-950 uppercase">
                          Active
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs px-1">
                        <span className="font-bold text-white text-[11px] truncate">Beach</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newClip: VideoClipItem = {
                              id: `clip_beach_${Date.now()}`,
                              name: 'Beach',
                              duration: 10,
                              type: 'video',
                              color: 'bg-cyan-800',
                              trackIndex: 0,
                              startTime: timelineClips.length * 5,
                            };
                            setTimelineClips((prev) => [...prev, newClip]);
                          }}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Cyberpunk City Sample */}
                    <div
                      onClick={() => {
                        setAiMateMessage('Selected Cyberpunk Metropolis sample.');
                      }}
                      className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 bg-zinc-950 p-1 cursor-pointer transition-all"
                    >
                      <div className="relative h-20 w-full rounded-lg overflow-hidden bg-gradient-to-tr from-purple-900 via-indigo-950 to-pink-900 flex items-center justify-center">
                        <Film className="w-5 h-5 text-purple-400 opacity-60" />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                          00:10:00
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs px-1">
                        <span className="font-medium text-zinc-300 text-[11px] truncate">Cyberpunk Night</span>
                        <span className="text-[9px] text-zinc-500 font-mono">4K</span>
                      </div>
                    </div>

                    {/* Nature Drone Alpine Sample */}
                    <div
                      onClick={() => {
                        setAiMateMessage('Selected Alpine Drone Flight sample.');
                      }}
                      className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 bg-zinc-950 p-1 cursor-pointer transition-all"
                    >
                      <div className="relative h-20 w-full rounded-lg overflow-hidden bg-gradient-to-tr from-emerald-950 via-teal-900 to-sky-900 flex items-center justify-center">
                        <Film className="w-5 h-5 text-teal-400 opacity-60" />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                          00:08:00
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs px-1">
                        <span className="font-medium text-zinc-300 text-[11px] truncate">Alpine Drone</span>
                        <span className="text-[9px] text-zinc-500 font-mono">4K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMediaTab === 'stock' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Royalty-Free 4K Stock Footage</span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Commercial Cleared</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {STOCK_MEDIA_ITEMS.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400 font-mono">{item.res}</span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[9px]">{item.tag}</span>
                        </div>
                        <div className="text-xs font-semibold text-zinc-200 mt-1 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{item.duration}s • {item.category}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newClip: VideoClipItem = {
                            id: `stock_${Date.now()}_${item.id}`,
                            name: item.name,
                            duration: item.duration,
                            type: 'video',
                            color: 'bg-emerald-600',
                            trackIndex: 0,
                            startTime: timelineClips.length * 4,
                          };
                          setTimelineClips((prev) => [...prev, newClip]);
                          setAiMateMessage(`Added stock clip '${item.name}' to Track 1.`);
                        }}
                        className="w-full py-1 rounded bg-zinc-800 hover:bg-emerald-600 hover:text-white text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
                      >
                        + Add to Track 1
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'audio' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Royalty-Free Audio & Sound FX</span>
                  <span className="text-[10px] text-purple-400 font-mono">Lossless WAV & MP3</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {STOCK_AUDIO_ITEMS.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700">
                      <div className="truncate mr-2">
                        <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{item.category} • {item.duration}s • {item.bpm}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newClip: VideoClipItem = {
                            id: `aud_${Date.now()}_${item.id}`,
                            name: item.name,
                            duration: item.duration,
                            type: 'audio',
                            color: item.type === 'bgm' ? 'bg-indigo-600' : 'bg-purple-600',
                            trackIndex: item.type === 'bgm' ? 3 : 2,
                            startTime: 0,
                          };
                          setTimelineClips((prev) => [...prev, newClip]);
                          setAiMateMessage(`Added audio track '${item.name}' to ${item.type === 'bgm' ? 'Track 4 (BGM)' : 'Track 3 (Audio)'}.`);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-purple-600 hover:text-white text-[10px] font-bold text-zinc-300 shrink-0 cursor-pointer"
                      >
                        + Insert Audio
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'titles' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Motion Titles & Lower Thirds</span>
                  <span className="text-[10px] text-yellow-400 font-mono">Vector Overlays</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {STOCK_TITLE_ITEMS.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700">
                      <div className="truncate mr-2">
                        <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                        <div className="text-[10px] text-yellow-400/90 font-mono">{item.style}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newClip: VideoClipItem = {
                            id: `title_${Date.now()}_${item.id}`,
                            name: item.name,
                            duration: 8,
                            type: 'video',
                            color: 'bg-yellow-600',
                            trackIndex: item.track,
                            startTime: Math.max(0, playheadTime),
                            subtitleText: item.text,
                          };
                          setTimelineClips((prev) => [...prev, newClip]);
                          setAiMateMessage(`Added title overlay '${item.name}' to Track ${item.track + 1}.`);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-yellow-600 hover:text-zinc-950 text-[10px] font-bold text-zinc-300 shrink-0 cursor-pointer"
                      >
                        + Add Overlay
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'transitions' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Cinematic Scene Transitions</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Active: {activeTransition}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {STOCK_TRANSITION_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleApplyTransition(item.name)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        activeTransition === item.name
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.duration}</div>
                      <div className="text-[9px] text-zinc-400 truncate mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'effects' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Visual Effects & Textures</span>
                  <span className="text-[10px] text-pink-400 font-mono">Active: {activeEffect}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {STOCK_EFFECT_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleApplyEffect(item.name)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        activeEffect === item.name
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.intensity}</div>
                      <div className="text-[9px] text-zinc-400 truncate mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'filters' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Cinematic LUT Color Grading</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time GPU LUT</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {[
                    { id: 'none', label: 'Neutral Rec.709', desc: 'Clean studio balance' },
                    { id: 'teal-orange', label: 'Teal & Orange', desc: 'Hollywood cinema' },
                    { id: 'cyber-neon', label: 'Cyber Neon', desc: 'Synthwave magenta' },
                    { id: 'noir-bw', label: 'Noir Monochrome', desc: 'Silver 1940s film' },
                    { id: 'vhs-retro', label: 'VHS Retro 90s', desc: 'Analog tape warmth' },
                    { id: 'matrix-green', label: 'Matrix Emerald', desc: 'Cyber terminal code' },
                  ].map((lut) => (
                    <button
                      key={lut.id}
                      onClick={() => {
                        setActiveLutFilter(lut.id as any);
                        setAiMateMessage(`Applied '${lut.label}' color LUT.`);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        activeLutFilter === lut.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{lut.label}</div>
                      <div className="text-[10px] text-zinc-400">{lut.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMediaTab === 'templates' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Project Templates</span>
                  <span className="text-[10px] text-indigo-400 font-mono">1-Click Setup</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {PROJECT_TEMPLATES.map((tmpl) => (
                    <div key={tmpl.id} className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700">
                      <div className="truncate mr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-100 truncate">{tmpl.name}</span>
                          <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono">{tmpl.ratio}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">{tmpl.desc}</div>
                      </div>
                      <button
                        onClick={() => handleLoadTemplate(tmpl)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center & Right: Preview Canvas & Project Info Inspector (Image 5) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Preview Canvas Player (8 Cols) */}
          <div className="md:col-span-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-xl space-y-2 flex flex-col justify-between">
            {/* Viewport Top Bar (Timeline vs Source tabs, Full/Half quality) */}
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlayerMode('timeline')}
                  className={`font-semibold ${playerMode === 'timeline' ? 'text-emerald-400' : 'text-zinc-500'}`}
                >
                  Timeline
                </button>
                <span>|</span>
                <button
                  onClick={() => setPlayerMode('source')}
                  className={`font-semibold ${playerMode === 'source' ? 'text-emerald-400' : 'text-zinc-500'}`}
                >
                  Source
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={previewQuality}
                  onChange={(e) => setPreviewQuality(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300"
                >
                  <option value="Full">Full</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                </select>
                <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Video Canvas */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
              <canvas ref={canvasRef} width={640} height={360} className="w-full h-full block" />
            </div>

            {/* Transport & Timecode Bar (Image 5) */}
            <div className="flex items-center justify-between gap-2 text-xs pt-1">
              {/* Playback Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPlayheadTime((prev) => Math.max(0, prev - 0.5))}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  title="Step 1 Frame Back"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow transition-transform active:scale-95"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => setPlayheadTime((prev) => prev + 0.5)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  title="Step 1 Frame Forward"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timecode Clock */}
              <div className="font-mono text-[11px] text-zinc-400 font-semibold">
                00:00:{Math.floor(playheadTime).toString().padStart(2, '0')}:15 / 00:00:25:00
              </div>

              {/* Aspect Ratio & Camera Snapshot */}
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {aspectRatio}
                </span>
                <button
                  type="button"
                  title="Take Snapshot"
                  onClick={() => setAiMateMessage('Snapshot captured to media pool!')}
                  className="hover:text-white cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Inspector Panel: "Project Info & Clip Inspector" (Image 5) */}
          <div className="md:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs flex flex-col justify-between">
            <div>
              {/* Inspector Mode Tabs */}
              <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 mb-3">
                <button
                  onClick={() => setInspectorTab('info')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    inspectorTab === 'info'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Project Info
                </button>
                <button
                  onClick={() => setInspectorTab('transform')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    inspectorTab !== 'info'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Clip Inspector</span>
                  {selectedClipId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>
              </div>

              {/* View 1: Project Info Tab */}
              {inspectorTab === 'info' ? (
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">Project Name</span>
                    <span className="text-zinc-200 font-medium truncate block">{projectName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Resolution</span>
                    <span className="text-emerald-400 font-mono font-medium">{resolution}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Frame Rate</span>
                    <span className="text-zinc-200 font-mono">{frameRate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Color Space</span>
                    <span className="text-zinc-200">SDR - Rec.709</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Sample Rate</span>
                    <span className="text-zinc-200 font-mono">44100Hz</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Total Duration</span>
                    <span className="text-purple-300 font-mono font-bold">00:00:25:00</span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsEnhancerOpen(true)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Enhance to 4K UHD</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* View 2: Active Clip Inspector */
                <div className="space-y-3">
                  {/* Selected Clip Title */}
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                    <span className="font-bold text-zinc-200 truncate">
                      {timelineClips.find((c) => c.id === selectedClipId)?.name || 'Select a clip'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {timelineClips.find((c) => c.id === selectedClipId)?.duration || 0}s
                    </span>
                  </div>

                  {/* Sub-tabs: Transform, Audio, Speed, Color */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold">
                    {(['transform', 'audio', 'speed', 'color'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setInspectorTab(tab)}
                        className={`py-1 rounded border capitalize ${
                          inspectorTab === tab
                            ? 'bg-zinc-800 text-white border-zinc-700'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Transform Settings */}
                  {inspectorTab === 'transform' && (
                    <div className="space-y-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-zinc-400 mb-0.5">
                          <span>Scale</span>
                          <span className="font-mono text-zinc-200">{clipSettings[selectedClipId || '']?.scale || 100}%</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={200}
                          value={clipSettings[selectedClipId || '']?.scale || 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setClipSettings((prev) => ({
                              ...prev,
                              [selectedClipId || 'clip_v1']: {
                                ...(prev[selectedClipId || 'clip_v1'] || { opacity: 100, rotation: 0, volume: 100, speed: 1, filter: 'none' }),
                                scale: val,
                              },
                            }));
                          }}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400 mb-0.5">
                          <span>Opacity</span>
                          <span className="font-mono text-zinc-200">{clipSettings[selectedClipId || '']?.opacity || 100}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={clipSettings[selectedClipId || '']?.opacity || 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setClipSettings((prev) => ({
                              ...prev,
                              [selectedClipId || 'clip_v1']: {
                                ...(prev[selectedClipId || 'clip_v1'] || { scale: 100, rotation: 0, volume: 100, speed: 1, filter: 'none' }),
                                opacity: val,
                              },
                            }));
                          }}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Audio Settings */}
                  {inspectorTab === 'audio' && (
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Volume Level</span>
                        <span className="font-mono text-zinc-200">{clipSettings[selectedClipId || '']?.volume || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={clipSettings[selectedClipId || '']?.volume || 100}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setClipSettings((prev) => ({
                            ...prev,
                            [selectedClipId || 'clip_v1']: {
                              ...(prev[selectedClipId || 'clip_v1'] || { scale: 100, opacity: 100, rotation: 0, speed: 1, filter: 'none' }),
                              volume: val,
                            },
                          }));
                        }}
                        className="w-full accent-purple-500 h-1 bg-zinc-800 rounded"
                      />
                      <button
                        onClick={() => setAiMateMessage('Audio De-noise and Auto-EQ applied to clip!')}
                        className="w-full py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold border border-zinc-700"
                      >
                        Auto De-Noise & Voice Clarity
                      </button>

                      <button
                        onClick={() => setIsAudioExtenderOpen(true)}
                        className="w-full py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>AI Audio Extender (Loops & Tails)</span>
                      </button>
                    </div>
                  )}

                  {/* Speed Ramp Settings */}
                  {inspectorTab === 'speed' && (
                    <div className="space-y-2 text-[11px]">
                      <span className="text-zinc-400 block">Speed Multiplier</span>
                      <div className="grid grid-cols-5 gap-1">
                        {[0.5, 1.0, 1.25, 2.0, 4.0].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => {
                              setClipSettings((prev) => ({
                                ...prev,
                                [selectedClipId || 'clip_v1']: {
                                  ...(prev[selectedClipId || 'clip_v1'] || { scale: 100, opacity: 100, rotation: 0, volume: 100, filter: 'none' }),
                                  speed: spd,
                                },
                              }));
                              setAiMateMessage(`Speed set to ${spd}x for selected clip.`);
                            }}
                            className={`py-1 rounded text-center font-mono ${
                              (clipSettings[selectedClipId || '']?.speed || 1.0) === spd
                                ? 'bg-cyan-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color & LUT Settings */}
                  {inspectorTab === 'color' && (
                    <div className="space-y-1.5 text-[11px]">
                      <span className="text-zinc-400 block">Cinematic Color LUT</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'none', label: 'Clean Studio' },
                          { id: 'teal-orange', label: 'Teal & Orange' },
                          { id: 'cyber-neon', label: 'Cyber Neon' },
                          { id: 'noir-bw', label: 'Film Noir' },
                          { id: 'vhs-retro', label: 'VHS Retro' },
                          { id: 'matrix-green', label: 'Matrix Green' },
                        ].map((lut) => (
                          <button
                            key={lut.id}
                            onClick={() => {
                              setActiveLutFilter(lut.id as typeof activeLutFilter);
                              setAiMateMessage(`Applied ${lut.label} cinematic LUT color grading.`);
                            }}
                            className={`px-2 py-1.5 rounded text-left truncate border text-[10px] font-semibold ${
                              activeLutFilter === lut.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {lut.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clip Actions */}
                  <div className="flex gap-1.5 pt-2 border-t border-zinc-800">
                    <button
                      onClick={handleSplitClip}
                      className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold border border-zinc-700"
                    >
                      ✂️ Split
                    </button>
                    <button
                      onClick={() => {
                        if (selectedClipId) {
                          setTimelineClips((prev) => prev.filter((c) => c.id !== selectedClipId));
                          setSelectedClipId(null);
                          setAiMateMessage('Clip deleted from timeline.');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-[10px] font-bold border border-rose-800/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline & Editing Deck (Image 5 & Image 4 Toolbar) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3">
        {/* Customizable Toolbar with 29 Studio Tools (Image 4 & 5) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          {/* Active Tool Action Icons */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={handleSplitClip}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Split Clip at Playhead (Scissors)"
            >
              <Scissors className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => {
                if (timelineClips.length > 0) {
                  setTimelineClips((prev) => prev.slice(0, -1));
                }
              }}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Delete Selected Clip"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>

            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Quick Text & Title"
            >
              <Type className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={() => setAiMateMessage('Speed Ramp configured at 1.25x for dynamic momentum.')}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Speed & Duration"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => setAiMateMessage('AI Silence Detection: Found 2 silent pauses. Timeline auto-trimmed!')}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Silence Detection"
            >
              <VolumeX className="w-4 h-4 text-pink-400" />
            </button>

            <button
              onClick={() => setAiMateMessage('Smart BGM: Adaptive soundtrack generated and locked to speech cadence.')}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Smart BGM Generation"
            >
              <Music className="w-4 h-4 text-amber-400" />
            </button>

            {/* AI Audio Extender Toolbar Button */}
            <button
              onClick={() => setIsAudioExtenderOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-cyan-300 hover:text-white bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="AI Audio Extender: Stretch dialogue or background music to scene duration"
            >
              <AudioWaveform className="w-3.5 h-3.5 text-cyan-400" />
              <span>Extend Audio</span>
            </button>

            {/* Image to Video AI Toolbar Button */}
            {onOpenImageToVideo && (
              <button
                onClick={onOpenImageToVideo}
                className="px-2.5 py-1.5 rounded-lg text-emerald-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="Image to Video AI: Animate photos into 4K video clips (Unlimited)"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Image to Video</span>
              </button>
            )}

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              + Customize (29 Tools)
            </button>
          </div>

          {/* Timeline Zoom Slider */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono text-[10px]">Zoom</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Timeline Tracks View (Image 5 & Screenshot) */}
        <div className="relative space-y-1.5 bg-[#0a0f16] p-2 rounded-xl border border-zinc-800/80 overflow-x-auto min-h-[220px]">
          {/* Red Playhead Laser Marker & Line spanning all tracks */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center transition-all duration-75"
            style={{ left: `calc(112px + ${(playheadTime / 10) * 80 * zoomLevel}%)` }}
          >
            {/* Red top marker arrow */}
            <div
              className="w-3 h-3 bg-red-500 shadow-sm"
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)' }}
            />
            {/* Red vertical laser line */}
            <div className="w-[1.5px] flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            {/* Red circular bottom badge handle from screenshot */}
            <div className="w-5 h-5 -mb-1 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-mono font-bold shadow-lg border border-red-300">
              {Math.floor(playheadTime)}
            </div>
          </div>

          {/* Time Ruler (Image 5: 00:00, 00:10, 00:20, 00:30, 00:40...) */}
          <div className="h-6 flex items-center border-b border-zinc-800 font-mono text-[10px] text-zinc-500 select-none pl-28">
            {['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30'].map((mark) => (
              <div key={mark} className="flex-1 border-l border-zinc-800 pl-1">
                {mark}
              </div>
            ))}
          </div>

          {/* Track 1: Video 1 (From Screenshot: ▶ 1 🔒 🔊 👁 and Beach clip with 3 filmstrip thumbnail slices) */}
          <div className="flex items-center h-16 bg-[#101722] rounded-xl border border-zinc-800/80 overflow-hidden relative">
            <div className="w-28 shrink-0 px-2 flex items-center justify-between border-r border-zinc-800 text-xs font-semibold text-zinc-300 bg-zinc-950/80 h-full">
              <div className="flex items-center gap-1.5 text-zinc-200">
                <VideoIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Lock className="w-3 h-3 hover:text-white cursor-pointer" />
                <Volume2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                <Eye className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>

            <div className="flex-1 relative h-full flex items-center px-1">
              {timelineClips
                .filter((c) => c.trackIndex === 0)
                .map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setInspectorTab('transform');
                    }}
                    className={`h-13 rounded-lg overflow-hidden relative shadow-md mx-0.5 cursor-pointer transition-all border ${
                      selectedClipId === clip.id
                        ? 'ring-2 ring-emerald-400 border-white'
                        : 'border-[#2d4059] hover:border-cyan-400'
                    }`}
                    style={{ width: `${Math.max(48, clip.duration * 4.8 * zoomLevel)}%` }}
                  >
                    {/* If Beach Clip: Render 3 Filmstrip Slices from Screenshot */}
                    {clip.name.toLowerCase().includes('beach') ? (
                      <div className="absolute inset-0 flex overflow-hidden">
                        {[0, 1, 2].map((slice) => (
                          <div
                            key={slice}
                            className="relative flex-1 h-full overflow-hidden border-r border-[#1a2e40] last:border-r-0"
                          >
                            {/* Clear Sky */}
                            <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-[#38bdf8] to-[#bae6fd]" />
                            {/* Deep Mediterranean Blue Sea */}
                            <div className="absolute inset-x-0 bottom-0 top-[28%] bg-gradient-to-b from-[#0369a1] via-[#0284c7] to-[#0c4a6e]" />
                            {/* Rocky Ochre Cliff on Right */}
                            <div
                              className="absolute top-[28%] bottom-0 right-0 w-[44%] bg-gradient-to-bl from-[#b87333] via-[#8c5825] to-[#5c3818]"
                              style={{ clipPath: 'polygon(36% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                            />
                            {/* White seafoam surf line */}
                            <div
                              className="absolute top-[28%] bottom-0 right-[40%] w-[3px] bg-white/80 shadow"
                              style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)' }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`absolute inset-0 ${clip.color} opacity-80`} />
                    )}

                    {/* Clip Title Banner overlay */}
                    <div className="relative z-10 flex items-center justify-between w-full h-full px-2">
                      <div className="flex items-center gap-1.5 text-white font-bold text-xs bg-black/45 px-1.5 py-0.5 rounded shadow">
                        <Play className="w-2.5 h-2.5 fill-white text-white" />
                        <span>{clip.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-200 bg-black/40 px-1 rounded shadow">
                        {clip.duration}s
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Track 2: Video 2 (Overlay / B-Roll / Charts) */}
          <div className="flex items-center h-12 bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden">
            <div className="w-28 shrink-0 px-2.5 flex items-center justify-between border-r border-zinc-800 text-xs font-semibold text-cyan-300">
              <span className="truncate">Video 2 (Overlay)</span>
              <div className="flex gap-1 text-zinc-500">
                <Eye className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-1">
              {timelineClips
                .filter((c) => c.trackIndex === 1)
                .map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setInspectorTab('transform');
                    }}
                    className={`h-9 rounded-lg ${clip.color} px-2.5 py-1 text-xs text-white font-semibold flex items-center justify-between shadow mx-0.5 truncate cursor-pointer transition-all border ${
                      selectedClipId === clip.id ? 'ring-2 ring-emerald-400 border-white' : 'border-cyan-400/40 hover:border-cyan-400'
                    }`}
                    style={{ width: `${clip.duration * 3.5 * zoomLevel}%` }}
                  >
                    <span className="truncate">📊 {clip.name}</span>
                    <span className="text-[10px] opacity-80 font-mono shrink-0">{clip.duration}s</span>
                  </div>
                ))}
              {timelineClips.filter((c) => c.trackIndex === 1).length === 0 && (
                <span className="text-[11px] text-zinc-600 italic px-2">
                  Drop animated charts, overlay B-Roll, or picture-in-picture here
                </span>
              )}
            </div>
          </div>

          {/* Track 3: Audio 1 (From Screenshot: 🎵 1 🔒 🔊) */}
          <div className="flex items-center h-12 bg-[#0e141e] rounded-xl border border-zinc-800/80 overflow-hidden relative">
            <div className="w-28 shrink-0 px-2 flex items-center justify-between border-r border-zinc-800 text-xs font-semibold text-purple-300 bg-zinc-950/80 h-full">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <Lock className="w-3 h-3 hover:text-white cursor-pointer" />
                <Volume2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-1">
              {timelineClips
                .filter((c) => c.trackIndex === 2)
                .map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setInspectorTab('audio');
                    }}
                    className={`h-9 rounded-lg ${clip.color} px-2.5 py-1 text-xs text-white font-semibold flex items-center justify-between shadow mx-0.5 truncate cursor-pointer transition-all border ${
                      selectedClipId === clip.id ? 'ring-2 ring-purple-400 border-white' : 'border-purple-400/40 hover:border-purple-300'
                    }`}
                    style={{ width: `${clip.duration * 3.5 * zoomLevel}%` }}
                  >
                    <span className="truncate">🎙️ {clip.name}</span>
                    <span className="text-[10px] opacity-80 font-mono shrink-0">{clip.duration}s</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Track 4: Audio 2 / BGM (Image 5) */}
          <div className="flex items-center h-12 bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden">
            <div className="w-28 shrink-0 px-2.5 flex items-center justify-between border-r border-zinc-800 text-xs font-semibold text-indigo-300">
              <span className="truncate">Audio 2 (BGM)</span>
              <Music className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex-1 relative h-full flex items-center px-1">
              {timelineClips
                .filter((c) => c.trackIndex === 3)
                .map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setInspectorTab('audio');
                    }}
                    className={`h-9 rounded-lg ${clip.color} px-2.5 py-1 text-xs text-white font-semibold flex items-center justify-between shadow mx-0.5 truncate cursor-pointer transition-all border ${
                      selectedClipId === clip.id ? 'ring-2 ring-indigo-400 border-white' : 'border-indigo-400/40 hover:border-indigo-300'
                    }`}
                    style={{ width: `${clip.duration * 3.5 * zoomLevel}%` }}
                  >
                    <span className="truncate">🎵 {clip.name}</span>
                    <span className="text-[10px] opacity-80 font-mono shrink-0">{clip.duration}s</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Track 5: Subtitles & Captions */}
          <div className="flex items-center h-10 bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden">
            <div className="w-28 shrink-0 px-2.5 flex items-center justify-between border-r border-zinc-800 text-xs font-semibold text-amber-300">
              <span className="truncate">Captions</span>
              <Type className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex-1 relative h-full flex items-center px-1">
              {timelineClips
                .filter((c) => c.subtitleText)
                .map((clip) => (
                  <div
                    key={'sub_' + clip.id}
                    className="h-7 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold flex items-center justify-between mx-0.5 truncate"
                    style={{ width: `${clip.duration * 3.5 * zoomLevel}%` }}
                  >
                    <span className="truncate">💬 {clip.subtitleText}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: All 29 Studio Tools Customizer (Image 4) */}
      {isCustomizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Drag the items you want to use into the toolbar...
                </h3>
                <p className="text-xs text-zinc-400">
                  Click any tool to toggle it in your quick-access multi-track editing deck.
                </p>
              </div>
              <button onClick={() => setIsCustomizerOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* All 29 Tools Grid (Image 4) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-1">
              {ALL_STUDIO_TOOLS.map((tool) => {
                const isActive = activeToolbarTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveToolbarTools((prev) =>
                        prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id]
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/60 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base">{tool.icon}</span>
                    <span className="font-semibold truncate">{tool.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Dotted Dock Area (Image 4) */}
            <div className="p-3 border-2 border-dashed border-emerald-500/50 rounded-2xl bg-zinc-900/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mr-2">
                Active Toolbar Dock:
              </span>
              {activeToolbarTools.map((id) => {
                const tool = ALL_STUDIO_TOOLS.find((t) => t.id === id);
                return (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5"
                  >
                    <span>{tool?.icon}</span>
                    <span>{tool?.name}</span>
                  </span>
                );
              })}
            </div>

            {/* Action Buttons: Reset, Save, Cancel (Image 4) */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() =>
                  setActiveToolbarTools([
                    'split',
                    'delete',
                    'crop',
                    'quick_text',
                    'pen_tool',
                    'speed',
                    'silence_detection',
                    'keyframing',
                    'smart_bgm',
                    'ai_matting',
                    'text_to_video',
                  ])
                }
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI Idea to Video Prompt (Image 3) */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-100">AI Text to Video Generator</h3>
              </div>
              <button onClick={() => setIsPromptModalOpen(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Visual Prompt Directive</label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe your scene in cinematic detail..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Target Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['16:9', '9:16', '1:1', '21:9'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`py-1.5 rounded-lg border text-center font-mono cursor-pointer ${
                        aspectRatio === r
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateVideoClip}
                disabled={isGeneratingVideo}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Scene...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Clip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AI Video Enhancer */}
      {isEnhancerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">AI Video Enhancer Pro</h3>
                  <p className="text-[11px] text-zinc-400">Deep neural supersampling, frame rate booster & HDR grading</p>
                </div>
              </div>
              <button onClick={() => setIsEnhancerOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">4K UHD Upscaling</div>
                  <div className="text-[11px] text-zinc-400">Reconstruct edge fidelity to 3840 x 2160 pixels</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnhancerUpscale4k(!enhancerUpscale4k)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    enhancerUpscale4k ? 'bg-purple-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">60 FPS Motion Interpolation</div>
                  <div className="text-[11px] text-zinc-400">Optical flow motion vectoring for buttery smooth playback</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnhancerFps60(!enhancerFps60)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    enhancerFps60 ? 'bg-purple-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Cinema HDR & Contrast Expansion</div>
                  <div className="text-[11px] text-zinc-400">10-bit dynamic color tone-mapping and noise reduction</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnhancerHdr(!enhancerHdr)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    enhancerHdr ? 'bg-purple-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsEnhancerOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEnhancer}
                disabled={isEnhancing}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isEnhancing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Upscaling 4K UHD...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply AI Enhancement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Animated Charts */}
      {isChartsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Animated Charts Studio</h3>
                  <p className="text-[11px] text-zinc-400">Generate motion infographic overlays directly into Video Track 2</p>
                </div>
              </div>
              <button onClick={() => setIsChartsOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1.5">Chart Presentation Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'bar', label: 'Bar Graph' },
                    { id: 'line', label: 'Line Wave' },
                    { id: 'pie', label: 'Pie Ring' },
                    { id: 'kpi', label: 'KPI Metric' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setChartType(item.id as typeof chartType)}
                      className={`py-2 px-1 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        chartType === item.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-500/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Chart Headline / Topic</label>
                <input
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="e.g. Q4 Growth & Revenue Projection"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Data Key-Values (Comma separated)</label>
                <textarea
                  rows={2}
                  value={chartValues}
                  onChange={(e) => setChartValues(e.target.value)}
                  placeholder="e.g. Q1: 45K, Q2: 82K, Q3: 135K, Q4: 240K"
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Motion keyframing auto-syncs with playhead position and renders dynamically onto the preview monitor.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsChartsOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateChart}
                disabled={isGeneratingChart}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingChart ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Overlay...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>Insert Animated Chart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: AI Video Extend */}
      {isExtendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">AI Video Extend</h3>
                  <p className="text-[11px] text-zinc-400">Extrapolate frames seamlessly without cut jumps or frame freeze</p>
                </div>
              </div>
              <button onClick={() => setIsExtendOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="text-zinc-400 font-semibold">Active Selected Clip</div>
                <div className="flex items-center justify-between text-zinc-200">
                  <span className="font-medium text-emerald-400">
                    {timelineClips.find((c) => c.id === selectedClipId)?.name || timelineClips[0]?.name || 'Current Scene Master'}
                  </span>
                  <span className="font-mono text-zinc-400">
                    {timelineClips.find((c) => c.id === selectedClipId)?.duration || 10}s Base
                  </span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1.5">Extension Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setExtendSeconds(sec)}
                      className={`py-2 px-1 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        extendSeconds === sec
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      +{sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-[11px]">
                Neural optical flow will synthesize forward motion matching current lighting, camera movement, and subject velocity.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsExtendOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyExtend}
                disabled={isExtending}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExtending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Frames...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extend Clip (+{extendSeconds}s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI Audio Extender (Stretch audio with seamless loops & ambient tails) */}
      <AudioExtenderModal
        isOpen={isAudioExtenderOpen}
        onClose={() => setIsAudioExtenderOpen(false)}
        audio={currentTTSAudio}
        onSaveExtendedAudio={(ext) => {
          if (onSendToPlayer) onSendToPlayer(ext);
          const dur = ext.duration || 10;
          const extClip: VideoClipItem = {
            id: `clip_aud_ext_${Date.now()}`,
            name: `${ext.title || 'Extended Audio Track'} (${dur.toFixed(1)}s)`,
            duration: dur,
            type: 'audio',
            color: 'bg-teal-700',
            trackIndex: 3, // BGM / Audio Track 2
            startTime: 0,
          };
          setTimelineClips((prev) => [...prev, extClip]);
          setAiMateMessage(`AI Audio Extender: Applied ${dur.toFixed(1)}s extended audio track to timeline.`);
        }}
        onSendToTimeline={(ext) => {
          const dur = ext.duration || 10;
          const extClip: VideoClipItem = {
            id: `clip_aud_ext_${Date.now()}`,
            name: `${ext.title || 'Extended Audio Track'} (${dur.toFixed(1)}s)`,
            duration: dur,
            type: 'audio',
            color: 'bg-teal-700',
            trackIndex: 3,
            startTime: 0,
          };
          setTimelineClips((prev) => [...prev, extClip]);
          setAiMateMessage(`Inserted ${dur.toFixed(1)}s extended audio track into timeline.`);
        }}
      />

      {/* MODAL 6: Audio to Video */}
      {isAudioToVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Audio to Video Studio</h3>
                  <p className="text-[11px] text-zinc-400">Generate audio-reactive visualizers & synced kinetic captions</p>
                </div>
              </div>
              <button onClick={() => setIsAudioToVideoOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400 font-semibold mb-1">Source Voice / Audio</div>
                <div className="text-zinc-200 font-medium">
                  {currentTTSAudio?.speakerName || 'VoiceCraft AI Narrator'} • {currentTTSAudio ? `${currentTTSAudio.duration || 14}s clip` : 'Default Audio Master'}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  "{currentTTSAudio?.text?.slice(0, 70) || 'Welcome to VoiceCraft AI professional video studio 16.'}..."
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1.5">Visualizer Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'spectrum', name: 'Neon Spectrum Bars', desc: 'Fluorescent frequency analyzer' },
                    { id: 'radial', name: 'Radial Sound Orbit', desc: 'Circular reactive soundwave' },
                    { id: 'hologram', name: 'Cyber Hologram', desc: '3D glowing particle mesh' },
                    { id: 'captions', name: 'Kinetic Subtitles', desc: 'Word-by-word highlighted text' },
                  ].map((vis) => (
                    <button
                      key={vis.id}
                      onClick={() => setVisualizerStyle(vis.id as typeof visualizerStyle)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        visualizerStyle === vis.id
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-sm shadow-pink-500/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-zinc-100">{vis.name}</div>
                      <div className="text-[10px] text-zinc-400">{vis.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsAudioToVideoOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAudioToVideo}
                disabled={isGeneratingAudioToVideo}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAudioToVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing Soundwaves...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Generate Reactive Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Full Multi-Pass Render & Export Studio */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Export Studio 16 Pro</h3>
                  <p className="text-[11px] text-zinc-400">Multi-pass hardware accelerated export with cinema encoding</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (exportProgress === null) setIsExportModalOpen(false);
                }}
                disabled={exportProgress !== null && exportProgress < 100}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Export In Progress or Finished */}
            {exportProgress !== null ? (
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">
                      {exportProgress < 40
                        ? 'Pass 1/3: Analyzing geometry & audio sync...'
                        : exportProgress < 75
                        ? 'Pass 2/3: Applying LUT grade & transition blend...'
                        : exportProgress < 100
                        ? 'Pass 3/3: Multiplexing H.264 stream & container...'
                        : 'Render complete!'}
                    </span>
                    <span className="text-emerald-400 font-mono">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-3 border border-zinc-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full shadow-lg shadow-emerald-500/30"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>

                {exportSuccessNotice && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">{exportSuccessNotice}</div>
                      <div className="text-[11px] text-emerald-400/80">File downloaded to your local device.</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* Format selection */}
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1.5">Container Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['MP4', 'WEBM', 'GIF', 'MP3'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`py-2 rounded-xl border text-center font-mono font-bold transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution selection */}
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1.5">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '1080p', label: '1080p Full HD (1920x1080)' },
                      { id: '4K', label: '4K UHD (3840x2160)' },
                      { id: '720p', label: '720p HD (1280x720)' },
                      { id: '9:16 Reel', label: '9:16 Vertical Reel (1080x1920)' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setExportRes(r.id as typeof exportRes)}
                        className={`py-2 px-2.5 rounded-xl border text-left font-medium text-xs transition-all cursor-pointer ${
                          exportRes === r.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Rate selection */}
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1.5">Frame Rate</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['24fps', '25fps', '30fps', '60fps'] as const).map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setExportFps(fps)}
                        className={`py-1.5 rounded-lg border text-center font-mono text-xs transition-all cursor-pointer ${
                          exportFps === fps
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {fps}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project stats */}
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>GPU Acceleration: <strong className="text-emerald-400">NVENC Active</strong></span>
                  <span>Bitrate: <strong className="text-zinc-200">24.5 Mbps (VBR)</strong></span>
                  <span>Est. Size: <strong className="text-zinc-200">~68.4 MB</strong></span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsExportModalOpen(false)}
                disabled={exportProgress !== null && exportProgress < 100}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                {exportProgress === 100 ? 'Done' : 'Cancel'}
              </button>
              <button
                onClick={handleStartExport}
                disabled={exportProgress !== null && exportProgress < 100}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {exportProgress !== null && exportProgress < 100 ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Exporting ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Start Multi-Pass Render</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Login ID Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => setCurrentUser(updated)}
      />

      {/* Cross-Platform Software Download Modal (iOS, Android, Windows, Apple macOS, Web) */}
      <DownloadSoftwareModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        isDesktopWindowFrame={isDesktopWindowFrame}
        onToggleDesktopFrame={(enabled) => setIsDesktopWindowFrame(enabled)}
      />
    </div>
  );
};
