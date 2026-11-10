import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Film,
  Sparkles,
  Layers,
  Wand2,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  RefreshCw,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Monitor,
  Eye,
  EyeOff,
  Trash2,
  Zap,
  Clock,
  Radio,
  Image as ImageIcon,
  ArrowRight,
  Plus,
  Mic,
  MicOff,
  Wind,
  Droplets,
  Sun,
  Compass,
  Crosshair,
  Activity,
  SlidersHorizontal,
  FileText,
  Music,
  Send,
  FolderOpen,
  Video,
  FileAudio,
  Images,
} from 'lucide-react';
import {
  ImageToVideoItem,
  ImageToVideoMotion,
  ImageToVideoAtmosphere,
  ImageToVideoAspectRatio,
  ImageToVideoPreset,
  FlowVector,
  GeminiFlowAnalysis,
  StoryboardScene,
  AudioDuckingConfig,
  DeviceMediaAsset,
} from '../types/imageToVideo';
import {
  SAMPLE_IMAGE_PRESETS,
  MOTION_OPTIONS,
  ATMOSPHERE_OPTIONS,
  TRANSITION_OPTIONS,
  DEFAULT_STORYBOARD_SCENES,
  VIDS_TEMPLATES,
} from '../utils/imageToVideoDefaults';
import {
  generateImageToVideo,
  generateMultiSceneVideo,
  loadImage,
  renderMotionFrame,
  drawFlowVectorOverlay,
  getDimensionsForAspect,
} from '../utils/videoRecorderEngine';
import { GeneratedAudio, VideoSceneData } from '../types/tts';
import { formatTime } from '../utils/audio';
import { HelpMeCreateModal } from './HelpMeCreateModal';
import { TeleprompterModal } from './TeleprompterModal';
import { BatchImageUploaderModal } from './BatchImageUploaderModal';
import { VideoAIChatDrawer } from './VideoAIChatDrawer';
import { ThreeSpatialStudio } from './ThreeSpatialStudio';

const STORAGE_KEY = 'vidscraft_video_history';

// Cross-browser speech recognition support
type SpeechRecognitionType = any;
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionType;
    webkitSpeechRecognition?: SpeechRecognitionType;
  }
}

interface ImageToVideoStudioProps {
  currentTTSAudio: GeneratedAudio | null;
  geminiAvailable: boolean;
  onSendToTimeline?: (scene: VideoSceneData, videoUrl?: string) => void;
  onSendToAudioPlayer?: (audio: GeneratedAudio) => void;
  onOpenTimelineEditor?: () => void;
  prefillConfig?: {
    prompt?: string;
    aspectRatio?: ImageToVideoAspectRatio;
    duration?: number;
    motion?: ImageToVideoMotion;
    atmosphere?: ImageToVideoAtmosphere;
    scenes?: StoryboardScene[];
  };
  onSendToVideoToText?: (videoUrl: string, videoName?: string) => void;
}

export const ImageToVideoStudio: React.FC<ImageToVideoStudioProps> = ({
  currentTTSAudio,
  geminiAvailable,
  onSendToTimeline,
  onSendToAudioPlayer,
  onOpenTimelineEditor,
  prefillConfig,
  onSendToVideoToText,
}) => {
  // Mode: Multi-Scene Storyboard (Google Vids style) vs Single Shot vs 3D Spatial
  const [studioMode, setStudioMode] = useState<'storyboard' | 'single-shot' | '3d-spatial'>('storyboard');

  // Multi-Scene Storyboard Scenes
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>(DEFAULT_STORYBOARD_SCENES);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  // Modals (Google Vids AI flagship features)
  const [showHelpMeCreate, setShowHelpMeCreate] = useState<boolean>(false);
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(false);
  const [showBatchImageModal, setShowBatchImageModal] = useState<boolean>(false);
  const [showAIChatDrawer, setShowAIChatDrawer] = useState<boolean>(false);

  // Audio Ducking & Music Layer Config (Google Vids feature)
  const [audioDucking, setAudioDucking] = useState<AudioDuckingConfig>({
    enabled: true,
    duckingPercent: 70,
    bgMusicPreset: 'cinematic-uplift',
    bgMusicVolume: 0.25,
    voiceVolume: 1.0,
  });

  // Source Image state (active scene or single shot)
  const [sourceImage, setSourceImage] = useState<string>(SAMPLE_IMAGE_PRESETS[0].sampleImage);
  const [sourceImageName, setSourceImageName] = useState<string>('Neon Cyberpunk Metropolis');

  // Video Config State
  const [motion, setMotion] = useState<ImageToVideoMotion>('zoom-in');
  const [motionSpeed, setMotionSpeed] = useState<number>(1.0);
  const [atmosphere, setAtmosphere] = useState<ImageToVideoAtmosphere>('cyber-glitch');
  const [aspectRatio, setAspectRatio] = useState<ImageToVideoAspectRatio>('16:9');
  const [duration, setDuration] = useState<number>(5);
  const [fps, setFps] = useState<number>(30);
  const [prompt, setPrompt] = useState<string>(SAMPLE_IMAGE_PRESETS[0].prompt);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [selectedAudioType, setSelectedAudioType] = useState<'tts' | 'cyber' | 'cinematic' | 'space' | 'rain'>('tts');

  // Vector Motion Dynamics State
  const [promptFidelity, setPromptFidelity] = useState<number>(0.92);
  const [flowVectors, setFlowVectors] = useState<FlowVector[]>(SAMPLE_IMAGE_PRESETS[0].defaultFlowVectors || []);
  const [flowAnalysis, setFlowAnalysis] = useState<GeminiFlowAnalysis | null>(null);
  const [showFlowGrid, setShowFlowGrid] = useState<boolean>(true);
  const [activeVectorId, setActiveVectorId] = useState<string | null>(null);
  const [isAnalyzingFlow, setIsAnalyzingFlow] = useState<boolean>(false);
  const [activeStageTab, setActiveStageTab] = useState<number>(1);

  // Voice Prompt Dictation State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Generation & Player State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [currentVideo, setCurrentVideo] = useState<ImageToVideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);

  // AI Prompting Place: prompt input and video generation engine
  const [aiVideoPrompt, setAiVideoPrompt] = useState<string>('');
  const [isAiPromptBarOpen, setIsAiPromptBarOpen] = useState<boolean>(true);
  const [aiSceneCount, setAiSceneCount] = useState<number>(3);
  const [aiMotionPreference, setAiMotionPreference] = useState<string>('auto');
  const [aiAtmospherePreference, setAiAtmospherePreference] = useState<string>('auto');
  const [aiSceneDuration, setAiSceneDuration] = useState<number>(5);
  const [isAiProcessingPrompt, setIsAiProcessingPrompt] = useState<boolean>(false);
  const [aiPromptFeedback, setAiPromptFeedback] = useState<string | null>(null);
  const aiPromptInputRef = useRef<HTMLInputElement | null>(null);

  // Live Canvas Preview during setup
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const deviceMediaInputRef = useRef<HTMLInputElement | null>(null);
  const deviceAudioInputRef = useRef<HTMLInputElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAnimFrameRef = useRef<number | null>(null);
  const previewStartTimeRef = useRef<number>(Date.now());
  const activeImgRef = useRef<HTMLImageElement | null>(null);

  // Device Media Ingestion States (Uploading place for Images, Videos, Audio)
  const [deviceAssets, setDeviceAssets] = useState<DeviceMediaAsset[]>(() => {
    try {
      const saved = localStorage.getItem('vidscraft_device_assets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [showDeviceLibrary, setShowDeviceLibrary] = useState<boolean>(false);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [customAudioTrack, setCustomAudioTrack] = useState<{ url: string; name: string; duration?: number } | null>(() => {
    try {
      const saved = localStorage.getItem('vidscraft_custom_audio');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isPlayingCustomAudio, setIsPlayingCustomAudio] = useState<boolean>(false);

  // Sync device assets to localStorage
  useEffect(() => {
    try {
      const serializable = deviceAssets.slice(-25).map((a) => ({
        ...a,
        blob: undefined,
      }));
      localStorage.setItem('vidscraft_device_assets', JSON.stringify(serializable));
    } catch {}
  }, [deviceAssets]);

  // Sync custom audio to localStorage
  useEffect(() => {
    try {
      if (customAudioTrack) {
        localStorage.setItem('vidscraft_custom_audio', JSON.stringify(customAudioTrack));
      } else {
        localStorage.removeItem('vidscraft_custom_audio');
      }
    } catch {}
  }, [customAudioTrack]);

  // History Gallery State
  const [history, setHistory] = useState<ImageToVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Keep active scene synchronized with preview
  const currentActiveScene = storyboardScenes[activeSceneIndex] || storyboardScenes[0];

  // 3D Camera Depth & Perspective Intensity States (Single-shot fallback and active scene bindings)
  const [singleShotZDepth, setSingleShotZDepth] = useState<number>(1.8);
  const [singleShotFov, setSingleShotFov] = useState<number>(48);
  const [singleShotCurvature, setSingleShotCurvature] = useState<number>(0.35);

  const activeZDepth = studioMode === 'storyboard' ? (currentActiveScene?.zDepthMove ?? 1.8) : singleShotZDepth;
  const activeFov = studioMode === 'storyboard' ? (currentActiveScene?.perspectiveIntensity ?? 48) : singleShotFov;
  const activeCurvature = studioMode === 'storyboard' ? (currentActiveScene?.depthCurvature ?? 0.35) : singleShotCurvature;

  const handleUpdateDepthSettings = (updates: { zDepthMove?: number; perspectiveIntensity?: number; depthCurvature?: number }) => {
    if (studioMode === 'storyboard') {
      handleUpdateActiveScene(updates);
    }
    if (updates.zDepthMove !== undefined) setSingleShotZDepth(updates.zDepthMove);
    if (updates.perspectiveIntensity !== undefined) setSingleShotFov(updates.perspectiveIntensity);
    if (updates.depthCurvature !== undefined) setSingleShotCurvature(updates.depthCurvature);
  };

  useEffect(() => {
    if (studioMode === 'storyboard' && currentActiveScene) {
      setSourceImage(currentActiveScene.image);
      setSourceImageName(currentActiveScene.imageName || currentActiveScene.title);
      setMotion(currentActiveScene.motion);
      setAtmosphere(currentActiveScene.atmosphere);
      setPrompt(currentActiveScene.prompt);
      setDuration(currentActiveScene.duration);
      if (currentActiveScene.zDepthMove !== undefined) setSingleShotZDepth(currentActiveScene.zDepthMove);
      if (currentActiveScene.perspectiveIntensity !== undefined) setSingleShotFov(currentActiveScene.perspectiveIntensity);
      if (currentActiveScene.depthCurvature !== undefined) setSingleShotCurvature(currentActiveScene.depthCurvature);
    }
  }, [activeSceneIndex, studioMode]);

  // Check speech recognition capability on mount
  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechAPI) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceTranscriptFeedback('Listening... speak your animation prompt aloud');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setPrompt(currentTranscript);
            setVoiceTranscriptFeedback(`Heard: "${currentTranscript}"`);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          setVoiceTranscriptFeedback('Voice input paused');
          setTimeout(() => setVoiceTranscriptFeedback(''), 4000);
        };

        recognition.onend = () => {
          setIsListening(false);
          setTimeout(() => setVoiceTranscriptFeedback(''), 3000);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Handle incoming prefillConfig from AI Copilot or Chat Director
  useEffect(() => {
    if (!prefillConfig) return;
    if (prefillConfig.prompt) {
      setPrompt(prefillConfig.prompt);
    }
    if (prefillConfig.aspectRatio) {
      setAspectRatio(prefillConfig.aspectRatio);
    }
    if (prefillConfig.duration) {
      setDuration(prefillConfig.duration);
    }
    if (prefillConfig.motion) {
      setMotion(prefillConfig.motion);
    }
    if (prefillConfig.atmosphere) {
      setAtmosphere(prefillConfig.atmosphere);
    }
    if (prefillConfig.scenes && prefillConfig.scenes.length > 0) {
      setStoryboardScenes(prefillConfig.scenes);
      setActiveSceneIndex(0);
      setStudioMode('storyboard');
    }
  }, [prefillConfig]);

  // Toggle voice recognition
  const toggleVoiceListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech-to-text dictation is supported in modern Chrome, Edge, and Safari browsers.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  // Save history to localStorage
  const saveToHistory = (item: ImageToVideoItem) => {
    setHistory((prev) => {
      const cleanItem = { ...item, videoBlob: undefined };
      const updated = [cleanItem, ...prev.filter((i) => i.id !== item.id)].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (currentVideo?.id === id) {
      setCurrentVideo(null);
    }
  };

  // Pre-load current source image into HTMLImageElement for real-time live preview
  useEffect(() => {
    let cancelled = false;
    loadImage(sourceImage)
      .then((img) => {
        if (!cancelled) activeImgRef.current = img;
      })
      .catch((err) => console.warn('Could not load image for live preview:', err));

    return () => {
      cancelled = true;
    };
  }, [sourceImage]);

  // Live continuous interactive preview loop on canvas
  useEffect(() => {
    if (currentVideo) return;

    let isRunning = true;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    previewStartTimeRef.current = Date.now();
    const dims = getDimensionsForAspect(aspectRatio, 'hd');
    canvas.width = dims.width;
    canvas.height = dims.height;

    const particles: any[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * dims.width,
        y: Math.random() * dims.height,
        size: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: atmosphere === 'rain' ? 12 : atmosphere === 'embers' ? -2 : 0.5,
        opacity: 0.3 + Math.random() * 0.5,
        rotation: 0,
        rotSpeed: 0.02,
        color: atmosphere === 'embers' ? '#f59e0b' : '#38bdf8',
      });
    }

    const loop = () => {
      if (!isRunning) return;
      const now = Date.now();
      const elapsed = (now - previewStartTimeRef.current) / 1000;
      const t = (elapsed % duration) / duration;

      if (activeImgRef.current) {
        renderMotionFrame(
          ctx,
          activeImgRef.current,
          t,
          dims.width,
          dims.height,
          motion,
          motionSpeed,
          atmosphere,
          particles,
          flowVectors,
          promptFidelity,
          activeZDepth,
          activeFov
        );

        // Render Lower Third overlay preview if active in storyboard scene
        if (studioMode === 'storyboard' && currentActiveScene?.lowerThird?.enabled) {
          ctx.save();
          const margin = dims.width * 0.04;
          const boxWidth = dims.width * 0.45;
          const boxHeight = dims.height * 0.12;
          const boxY =
            currentActiveScene.lowerThird.position === 'top-banner'
              ? margin
              : dims.height - boxHeight - margin;
          const boxX =
            currentActiveScene.lowerThird.position === 'center'
              ? (dims.width - boxWidth) / 2
              : margin;

          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
          ctx.fill();

          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(boxX, boxY, 6, boxHeight);

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(dims.height * 0.032)}px system-ui, sans-serif`;
          ctx.fillText(
            currentActiveScene.lowerThird.headline,
            boxX + 24,
            boxY + boxHeight * 0.48,
            boxWidth - 40
          );

          ctx.fillStyle = '#a1a1aa';
          ctx.font = `500 ${Math.round(dims.height * 0.02)}px system-ui, sans-serif`;
          ctx.fillText(
            currentActiveScene.lowerThird.subheadline,
            boxX + 24,
            boxY + boxHeight * 0.82,
            boxWidth - 40
          );
          ctx.restore();
        }

        // Render visual vector field overlay if enabled
        if (showFlowGrid && flowVectors.length > 0) {
          drawFlowVectorOverlay(ctx, flowVectors, dims.width, dims.height, activeVectorId);
        }
      }

      previewAnimFrameRef.current = requestAnimationFrame(loop);
    };

    previewAnimFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (previewAnimFrameRef.current) {
        cancelAnimationFrame(previewAnimFrameRef.current);
      }
    };
  }, [
    sourceImage,
    motion,
    motionSpeed,
    atmosphere,
    aspectRatio,
    duration,
    currentVideo,
    flowVectors,
    showFlowGrid,
    activeVectorId,
    promptFidelity,
    studioMode,
    currentActiveScene,
  ]);

  // =========================================================================
  // COMPREHENSIVE DEVICE MEDIA INGESTION (IMAGES, VIDEOS, AUDIO)
  // =========================================================================
  const processDeviceFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const audioFiles = fileList.filter(
      (f) => f.type.toLowerCase().startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i)
    );
    const videoFiles = fileList.filter(
      (f) => f.type.toLowerCase().startsWith('video/') || f.name.match(/\.(mp4|webm|mov|m4v)$/i)
    );
    const imageFiles = fileList.filter(
      (f) => f.type.toLowerCase().startsWith('image/') || f.name.match(/\.(png|jpe?g|webp|svg|gif|avif|bmp)$/i)
    );

    let imagesCount = 0;
    let videosCount = 0;
    let audioCount = 0;

    // 1. Audio Track Ingestion
    audioFiles.forEach((file) => {
      audioCount++;
      const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const audioUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        const dur = Math.round(tempAudio.duration) || 30;
        const newAsset: DeviceMediaAsset = {
          id: `asset_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: fileNameClean || file.name,
          type: 'audio',
          url: audioUrl,
          sizeBytes: file.size,
          duration: dur,
          uploadedAt: Date.now(),
        };
        setDeviceAssets((prev) => [newAsset, ...prev]);
        setCustomAudioTrack({
          url: audioUrl,
          name: fileNameClean || file.name,
          duration: dur,
        });
        setIncludeAudio(true);
      };
    });

    // 2. Video Clip Ingestion
    videoFiles.forEach((file) => {
      videosCount++;
      const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const videoUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.src = videoUrl;
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.currentTime = 0.5;

      tempVideo.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        let posterUrl = '';
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          posterUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        const vidDuration = Math.max(2, Math.min(60, Math.round(tempVideo.duration) || 5));
        const newAsset: DeviceMediaAsset = {
          id: `asset_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: fileNameClean || file.name,
          type: 'video',
          url: videoUrl,
          dataUrl: posterUrl,
          sizeBytes: file.size,
          duration: vidDuration,
          dimensions: { width: tempVideo.videoWidth || 1920, height: tempVideo.videoHeight || 1080 },
          uploadedAt: Date.now(),
        };
        setDeviceAssets((prev) => [newAsset, ...prev]);

        setStoryboardScenes((prev) => {
          const nextIndex = prev.length + 1;
          const newScene: StoryboardScene = {
            id: `scene-vid-${Date.now()}-${nextIndex}`,
            title: fileNameClean || `Video Clip #${nextIndex}`,
            image: posterUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
            imageName: fileNameClean,
            mediaType: 'video',
            videoUrl: videoUrl,
            prompt: `Video B-roll clip: ${fileNameClean}`,
            narrationScript: `Spoken presentation voiceover for ${fileNameClean}...`,
            motion: 'zoom-in',
            atmosphere: 'none',
            duration: vidDuration,
            transition: 'cross-dissolve',
            lowerThird: {
              enabled: true,
              headline: fileNameClean.toUpperCase().slice(0, 24),
              subheadline: 'Device Video B-Roll',
              position: 'bottom-left',
            },
          };
          return [...prev, newScene];
        });
      };
    });

    // 3. Multi-Image Ingestion (Supports single or multiple images seamlessly!)
    if (imageFiles.length > 0) {
      imagesCount = imageFiles.length;
      const readPromises = imageFiles.map(
        (file) =>
          new Promise<{ file: File; dataUrl: string; name: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = (e.target?.result as string) || '';
              const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
              resolve({ file, dataUrl, name: fileNameClean });
            };
            reader.readAsDataURL(file);
          })
      );

      const loadedImages = await Promise.all(readPromises);

      // Register all into device assets
      const newAssets: DeviceMediaAsset[] = loadedImages.map((img, idx) => ({
        id: `asset_img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: img.name || img.file.name,
        type: 'image',
        url: img.dataUrl,
        dataUrl: img.dataUrl,
        sizeBytes: img.file.size,
        uploadedAt: Date.now(),
      }));
      setDeviceAssets((prev) => [...newAssets, ...prev]);

      if (loadedImages.length === 1 && studioMode === 'single-shot') {
        // Single image in single-shot mode
        setSourceImage(loadedImages[0].dataUrl);
        setSourceImageName(loadedImages[0].name);
      } else {
        // Multiple images uploaded OR storyboard mode: assemble ALL images into storyboard
        const motions: ImageToVideoMotion[] = ['zoom-in', 'pan-right', 'orbit', 'tilt-up', 'dolly-zoom'];
        const atmospheres: ImageToVideoAtmosphere[] = ['none', 'dust-particles', 'god-rays', 'cyber-glitch'];

        setStoryboardScenes((prev) => {
          const startingIndex = prev.length;
          const newScenes: StoryboardScene[] = loadedImages.map((img, idx) => {
            const sceneNum = startingIndex + idx + 1;
            return {
              id: `scene-img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              title: img.name || `Scene #${sceneNum}`,
              image: img.dataUrl,
              imageName: img.name,
              mediaType: 'image',
              prompt: `Cinematic visual for ${img.name}`,
              narrationScript: `Spoken presentation voiceover for ${img.name}...`,
              motion: motions[idx % motions.length],
              atmosphere: atmospheres[idx % atmospheres.length],
              duration: duration || 5,
              transition: 'cross-dissolve',
              lowerThird: {
                enabled: true,
                headline: img.name.toUpperCase().slice(0, 24),
                subheadline: `Scene Visual ${sceneNum}`,
                position: 'bottom-left',
              },
            };
          });
          return [...prev, ...newScenes];
        });

        // Auto switch to storyboard mode if multiple images were added
        setStudioMode('storyboard');
        setActiveSceneIndex(storyboardScenes.length);
      }
    }

    const parts: string[] = [];
    if (imagesCount > 0) parts.push(`${imagesCount} image${imagesCount > 1 ? 's' : ''}`);
    if (videosCount > 0) parts.push(`${videosCount} video clip${videosCount > 1 ? 's' : ''}`);
    if (audioCount > 0) parts.push(`${audioCount} audio track${audioCount > 1 ? 's' : ''}`);

    if (imagesCount > 1) {
      setUploadNotification(`🎉 Added ${imagesCount} images as consecutive scenes in your Storyboard timeline!`);
    } else {
      setUploadNotification(`Ingested from device: ${parts.join(', ') || 'media files'}`);
    }
    setTimeout(() => setUploadNotification(null), 4500);
    setCurrentVideo(null);
  };

  // Batch insert all uploaded device images into storyboard timeline
  const handleInsertAllDeviceImagesToStoryboard = () => {
    const imageAssets = deviceAssets.filter((a) => a.type === 'image');
    if (imageAssets.length === 0) return;

    const motions: ImageToVideoMotion[] = ['zoom-in', 'pan-right', 'orbit', 'tilt-up', 'dolly-zoom'];
    const atmospheres: ImageToVideoAtmosphere[] = ['none', 'dust-particles', 'god-rays', 'cyber-glitch'];

    setStoryboardScenes((prev) => {
      const startingIndex = prev.length;
      const newScenes: StoryboardScene[] = imageAssets.map((asset, idx) => {
        const sceneNum = startingIndex + idx + 1;
        return {
          id: `scene-img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          title: asset.name || `Scene #${sceneNum}`,
          image: asset.dataUrl || asset.url,
          imageName: asset.name,
          mediaType: 'image',
          prompt: `Presentation scene for ${asset.name}`,
          narrationScript: `Spoken presentation voiceover for ${asset.name}...`,
          motion: motions[idx % motions.length],
          atmosphere: atmospheres[idx % atmospheres.length],
          duration: duration || 5,
          transition: 'cross-dissolve',
          lowerThird: {
            enabled: true,
            headline: asset.name.toUpperCase().slice(0, 24),
            subheadline: `Scene Visual ${sceneNum}`,
            position: 'bottom-left',
          },
        };
      });
      return [...prev, ...newScenes];
    });

    setStudioMode('storyboard');
    setActiveSceneIndex(storyboardScenes.length);
    setCurrentVideo(null);
    setUploadNotification(`Added all ${imageAssets.length} images to Storyboard timeline!`);
    setTimeout(() => setUploadNotification(null), 4000);
  };

  const handleDeviceFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processDeviceFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDeviceAudioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processDeviceFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDeleteDeviceAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeviceAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleInsertAssetToScene = (asset: DeviceMediaAsset) => {
    if (asset.type === 'audio') {
      setCustomAudioTrack({
        url: asset.url,
        name: asset.name,
        duration: asset.duration,
      });
      setIncludeAudio(true);
      setUploadNotification(`Custom audio track "${asset.name}" active!`);
      setTimeout(() => setUploadNotification(null), 3000);
      return;
    }

    if (studioMode === 'single-shot') {
      setSourceImage(asset.dataUrl || asset.url);
      setSourceImageName(asset.name);
      setCurrentVideo(null);
    } else {
      const nextIndex = storyboardScenes.length + 1;
      const newScene: StoryboardScene = {
        id: `scene-${Date.now()}-${nextIndex}`,
        title: asset.name,
        image: asset.dataUrl || asset.url,
        imageName: asset.name,
        mediaType: asset.type,
        videoUrl: asset.type === 'video' ? asset.url : undefined,
        prompt: `Presentation scene for ${asset.name}`,
        narrationScript: `Spoken presentation voiceover for ${asset.name}...`,
        motion: 'zoom-in',
        atmosphere: 'none',
        duration: asset.duration || 5,
        transition: 'cross-dissolve',
        lowerThird: {
          enabled: true,
          headline: asset.name.toUpperCase().slice(0, 24),
          subheadline: asset.type === 'video' ? 'Video B-Roll Clip' : 'Presentation Visual',
          position: 'bottom-left',
        },
      };
      setStoryboardScenes((prev) => [...prev, newScene]);
      setActiveSceneIndex(storyboardScenes.length);
      setCurrentVideo(null);
    }
  };

  // Google Vids AI Voiceover Narration Sync
  const handleSynthesizeSceneVoiceover = (sceneIdx: number) => {
    const sc = storyboardScenes[sceneIdx];
    if (!sc || !sc.narrationScript?.trim()) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sc.narrationScript);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    // Auto-calculate speech duration: ~140 wpm
    const words = sc.narrationScript.trim().split(/\s+/).filter(Boolean);
    const estimatedSeconds = Math.max(3, Math.min(60, Math.ceil((words.length / 140) * 60)));
    handleUpdateActiveScene({ duration: estimatedSeconds });
    setDuration(estimatedSeconds);
    setUploadNotification(`AI voiceover synthesized! Synced duration to ${estimatedSeconds}s.`);
    setTimeout(() => setUploadNotification(null), 4000);
  };

  // Add Preset Scene to Storyboard (+)
  const handleAddPresetScene = (preset: ImageToVideoPreset) => {
    const nextIndex = storyboardScenes.length + 1;
    const newScene: StoryboardScene = {
      id: `scene-${Date.now()}-${nextIndex}`,
      title: preset.title,
      image: preset.sampleImage,
      imageName: preset.title,
      prompt: preset.prompt,
      narrationScript: `Explore ${preset.title}: ${preset.subtitle}.`,
      motion: preset.motion,
      atmosphere: preset.atmosphere,
      duration: preset.duration || 5,
      transition: 'cross-dissolve',
      lowerThird: {
        enabled: true,
        headline: preset.title.toUpperCase(),
        subheadline: preset.subtitle,
        position: 'bottom-left',
      },
    };

    setStoryboardScenes((prev) => [...prev, newScene]);
    setActiveSceneIndex(storyboardScenes.length);
    setCurrentVideo(null);
  };

  // Update active scene field
  const handleUpdateActiveScene = (updates: Partial<StoryboardScene>) => {
    setStoryboardScenes((prev) =>
      prev.map((s, idx) => (idx === activeSceneIndex ? { ...s, ...updates } : s))
    );
  };

  // Delete scene from storyboard
  const handleDeleteScene = (idxToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (storyboardScenes.length <= 1) {
      alert('Your storyboard must contain at least one scene.');
      return;
    }
    setStoryboardScenes((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    if (activeSceneIndex >= idxToDelete && activeSceneIndex > 0) {
      setActiveSceneIndex(activeSceneIndex - 1);
    }
    setCurrentVideo(null);
  };

  // Move scene left/right
  const handleMoveScene = (index: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= storyboardScenes.length) return;

    const updated = [...storyboardScenes];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setStoryboardScenes(updated);
    setActiveSceneIndex(newIndex);
  };

  // AI Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/video/enhance-motion-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, motion, atmosphere }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        if (studioMode === 'storyboard') {
          handleUpdateActiveScene({ prompt: data.enhancedPrompt });
        }
      }
    } catch (err) {
      console.warn('Enhance prompt notice:', err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // AI Prompting Engine: Interprets prompt, coordinates scenes, and creates video as requested
  const handleCreateVideoFromPrompt = async (promptText: string, autoSynthesize: boolean = true) => {
    if (!promptText.trim()) return;
    setIsAiProcessingPrompt(true);
    setAiPromptFeedback(`AI analyzing prompt: "${promptText.slice(0, 50)}..."`);

    const lower = promptText.toLowerCase();

    // Thematic preset selection based on user prompt
    let matchedPreset = SAMPLE_IMAGE_PRESETS[0]; // cyberpunk default
    if (
      lower.includes('nature') ||
      lower.includes('mountain') ||
      lower.includes('lake') ||
      lower.includes('forest') ||
      lower.includes('tree') ||
      lower.includes('river') ||
      lower.includes('sunrise') ||
      lower.includes('landscape')
    ) {
      matchedPreset = SAMPLE_IMAGE_PRESETS[1]; // alpine lake
    } else if (
      lower.includes('anime') ||
      lower.includes('sakura') ||
      lower.includes('japan') ||
      lower.includes('cherry') ||
      lower.includes('shrine') ||
      lower.includes('temple') ||
      lower.includes('manga')
    ) {
      matchedPreset = SAMPLE_IMAGE_PRESETS[2]; // sakura shrine
    } else if (
      lower.includes('space') ||
      lower.includes('galaxy') ||
      lower.includes('nebula') ||
      lower.includes('star') ||
      lower.includes('planet') ||
      lower.includes('cosmic') ||
      lower.includes('astronaut')
    ) {
      matchedPreset = SAMPLE_IMAGE_PRESETS[3]; // deep space
    } else if (
      lower.includes('fashion') ||
      lower.includes('portrait') ||
      lower.includes('person') ||
      lower.includes('face') ||
      lower.includes('model') ||
      lower.includes('beauty')
    ) {
      matchedPreset = SAMPLE_IMAGE_PRESETS[4]; // golden portrait
    } else if (
      lower.includes('desert') ||
      lower.includes('car') ||
      lower.includes('highway') ||
      lower.includes('vehicle') ||
      lower.includes('road') ||
      lower.includes('drive') ||
      lower.includes('chase')
    ) {
      matchedPreset = SAMPLE_IMAGE_PRESETS[5] || SAMPLE_IMAGE_PRESETS[0]; // desert highway
    }

    // Camera motion determined from prompt
    let selectedMotion: ImageToVideoMotion = 'zoom-in';
    if (aiMotionPreference !== 'auto') {
      selectedMotion = aiMotionPreference as ImageToVideoMotion;
    } else if (lower.includes('orbit') || lower.includes('360') || lower.includes('circle')) {
      selectedMotion = 'orbit';
    } else if (lower.includes('pan') || lower.includes('slide') || lower.includes('track')) {
      selectedMotion = 'pan-right';
    } else if (lower.includes('dolly') || lower.includes('vertigo')) {
      selectedMotion = 'dolly-zoom';
    } else if (lower.includes('drone') || lower.includes('dive') || lower.includes('aerial') || lower.includes('out')) {
      selectedMotion = 'zoom-out';
    } else if (lower.includes('tilt') || lower.includes('up')) {
      selectedMotion = 'tilt-up';
    } else if (lower.includes('slow') || lower.includes('ambient') || lower.includes('calm')) {
      selectedMotion = 'ambient-flow';
    }

    // Atmosphere determined from prompt
    let selectedAtmosphere: ImageToVideoAtmosphere = 'dust-particles';
    if (aiAtmospherePreference !== 'auto') {
      selectedAtmosphere = aiAtmospherePreference as ImageToVideoAtmosphere;
    } else if (lower.includes('rain') || lower.includes('storm') || lower.includes('water')) {
      selectedAtmosphere = 'rain';
    } else if (
      lower.includes('ray') ||
      lower.includes('sun') ||
      lower.includes('light') ||
      lower.includes('golden')
    ) {
      selectedAtmosphere = 'god-rays';
    } else if (
      lower.includes('fire') ||
      lower.includes('ember') ||
      lower.includes('lava') ||
      lower.includes('spark')
    ) {
      selectedAtmosphere = 'embers';
    } else if (
      lower.includes('sakura') ||
      lower.includes('petal') ||
      lower.includes('flower')
    ) {
      selectedAtmosphere = 'sakura-petals';
    } else if (
      lower.includes('neon') ||
      lower.includes('glitch') ||
      lower.includes('cyber')
    ) {
      selectedAtmosphere = 'cyber-glitch';
    }

    const count = Math.max(2, Math.min(6, aiSceneCount));
    const motionSequence: ImageToVideoMotion[] = [
      selectedMotion,
      selectedMotion === 'zoom-in' ? 'pan-right' : 'zoom-in',
      'orbit',
      'zoom-out',
      'ambient-flow',
      'dolly-zoom',
    ];

    const startIndex = SAMPLE_IMAGE_PRESETS.indexOf(matchedPreset);
    const generatedScenes: StoryboardScene[] = Array.from({ length: count }).map((_, idx) => {
      const presetForScene =
        SAMPLE_IMAGE_PRESETS[(startIndex + idx) % SAMPLE_IMAGE_PRESETS.length];
      const motion = motionSequence[idx % motionSequence.length];
      return {
        id: `sc_ai_${Date.now()}_${idx + 1}`,
        title: `${promptText.slice(0, 24)} • Part ${idx + 1}`,
        image: presetForScene.sampleImage,
        imageName: `${promptText.slice(0, 20)} Shot ${idx + 1}`,
        prompt: `${promptText} (Act ${idx + 1}: ${motion} camera move, ${selectedAtmosphere})`,
        narrationScript: `In Scene ${idx + 1}, the video depicts: ${promptText}.`,
        motion: motion,
        atmosphere: selectedAtmosphere,
        duration: aiSceneDuration,
        transition: idx === 0 ? 'fade-black' : 'cross-dissolve',
        lowerThird: {
          enabled: true,
          headline: promptText.toUpperCase().slice(0, 20),
          subheadline: `Scene ${idx + 1} • ${motion.toUpperCase()}`,
          position: 'bottom-left',
        },
      };
    });

    setStoryboardScenes(generatedScenes);
    setActiveSceneIndex(0);
    setPrompt(promptText);
    setMotion(selectedMotion);
    setAtmosphere(selectedAtmosphere);
    setDuration(aiSceneDuration);

    setAiPromptFeedback(
      `AI acted on your prompt! Created ${count} scenes with ${selectedMotion} motion & ${selectedAtmosphere}.`
    );
    setIsAiProcessingPrompt(false);

    if (autoSynthesize) {
      setTimeout(() => {
        handleGenerateMultiSceneVideo();
      }, 350);
    }
  };

  // Full Multi-Scene Video Synthesis (Google Vids AI Multi-Scene sequence)
  const handleGenerateMultiSceneVideo = async () => {
    if (storyboardScenes.length === 0) return;
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationPhase('Pre-loading storyboard keyframe imagery & audio tracks...');

    try {
      const totalDuration = storyboardScenes.reduce((sum, s) => sum + s.duration, 0);

      // Audio track sync (Custom Device Audio Track or TTS Audio)
      let audioTrackUrl: string | undefined;
      if (includeAudio) {
        if (customAudioTrack?.url) {
          audioTrackUrl = customAudioTrack.url;
        } else if (currentTTSAudio?.audioUrl) {
          audioTrackUrl = currentTTSAudio.audioUrl;
        }
      }

      const result = await generateMultiSceneVideo({
        scenes: storyboardScenes,
        aspectRatio,
        fps,
        audioUrl: audioTrackUrl,
        onProgress: (p, sceneIdx, totalScenes) => {
          setGenerationProgress(p);
          setGenerationPhase(
            `Rendering Scene ${sceneIdx} of ${totalScenes} (${Math.round(p)}% complete)...`
          );
        },
      });

      setGenerationProgress(100);
      setGenerationPhase('Complete! Multi-scene video ready for presentation.');

      const newItem: ImageToVideoItem = {
        id: 'v_multi_' + Date.now(),
        title: `VidsCraft Presentation (${storyboardScenes.length} Scenes)`,
        prompt: storyboardScenes.map((s) => s.title).join(' • '),
        sourceImage: storyboardScenes[0].image,
        sourceImageName: storyboardScenes[0].title,
        videoUrl: result.videoUrl,
        videoBlob: result.videoBlob,
        motion: 'ambient-flow',
        motionSpeed: 1.0,
        aspectRatio,
        duration: result.duration,
        fps,
        atmosphere: 'dust-particles',
        resolution: `${result.width}x${result.height} (${aspectRatio})`,
        hasAudio: Boolean(audioTrackUrl),
        audioTitle: audioTrackUrl ? (currentTTSAudio?.title || 'Voiceover Sync') : undefined,
        engine: 'neural-motion-canvas',
        promptFidelity,
        createdAt: Date.now(),
        sizeBytes: result.videoBlob.size,
      };

      setCurrentVideo(newItem);
      saveToHistory(newItem);
    } catch (err: any) {
      console.error('Multi-scene render error:', err);
      alert('Notice: ' + (err?.message || 'Failed to render multi-scene video.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Single Scene Video Synthesis
  const handleGenerateSingleVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationPhase('Synthesizing neural motion dynamics...');

    try {
      let audioTrackUrl: string | undefined;
      if (includeAudio) {
        if (customAudioTrack?.url) {
          audioTrackUrl = customAudioTrack.url;
        } else if (currentTTSAudio?.audioUrl) {
          audioTrackUrl = currentTTSAudio.audioUrl;
        }
      }

      const result = await generateImageToVideo({
        sourceImage,
        motion,
        motionSpeed,
        atmosphere,
        aspectRatio,
        duration,
        fps,
        flowVectors,
        promptFidelity,
        audioUrl: audioTrackUrl,
        zDepthMove: singleShotZDepth,
        perspectiveIntensity: singleShotFov,
        onProgress: (p) => {
          setGenerationProgress(10 + Math.round(p * 0.88));
          setGenerationPhase(`Encoding video frames: ${Math.round(p)}%`);
        },
      });

      setGenerationProgress(100);
      setGenerationPhase('Video ready!');

      const newItem: ImageToVideoItem = {
        id: 'v_' + Date.now(),
        title: sourceImageName || 'VidsCraft Animated Scene',
        prompt,
        sourceImage,
        sourceImageName,
        videoUrl: result.videoUrl,
        videoBlob: result.videoBlob,
        motion,
        motionSpeed,
        aspectRatio,
        duration,
        fps,
        atmosphere,
        resolution: `${result.width}x${result.height} (${aspectRatio})`,
        hasAudio: Boolean(audioTrackUrl),
        audioTitle: audioTrackUrl ? (currentTTSAudio?.title || 'Voiceover Sync') : undefined,
        engine: 'neural-motion-canvas',
        promptFidelity,
        createdAt: Date.now(),
        sizeBytes: result.videoBlob.size,
      };

      setCurrentVideo(newItem);
      saveToHistory(newItem);
    } catch (err: any) {
      console.error('Video generation error:', err);
      alert('Notice: ' + (err?.message || 'Failed to render video.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Video playback controls
  const togglePlay = () => {
    if (!videoPlayerRef.current) return;
    if (videoPlayerRef.current.paused) {
      videoPlayerRef.current.play();
      setIsPlaying(true);
    } else {
      videoPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Download Video File
  const handleDownloadVideo = () => {
    if (!currentVideo?.videoUrl) return;
    const a = document.createElement('a');
    a.href = currentVideo.videoUrl;
    a.download = `${currentVideo.title.toLowerCase().replace(/\s+/g, '_')}_vidscraft_${currentVideo.aspectRatio.replace(':', 'x')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Send to CineStudio Multi-Track Timeline
  const handleSendToTimeline = () => {
    if (!currentVideo) return;
    const sceneData: VideoSceneData = {
      id: currentVideo.id,
      title: currentVideo.title,
      prompt: currentVideo.prompt,
      style: 'cinematic',
      cameraMotion: currentVideo.motion === 'zoom-out' ? 'zoom-in' : (currentVideo.motion as any),
      aspectRatio: currentVideo.aspectRatio,
      duration: currentVideo.duration,
      palette: ['#0f172a', '#38bdf8', '#06b6d4', '#f59e0b'],
      lighting: 'VidsCraft Neural Grade',
      particles: currentVideo.atmosphere === 'embers' ? 'embers' : currentVideo.atmosphere === 'rain' ? 'rain' : 'dust',
      headlineOverlay: currentVideo.title.toUpperCase(),
      elements: [currentVideo.title, 'Multi-Scene Storyboard Track', `${currentVideo.motion} Choreography`],
      audioUrl: currentVideo.hasAudio ? currentTTSAudio?.audioUrl : undefined,
    };

    if (onSendToTimeline) {
      onSendToTimeline(sceneData, currentVideo.videoUrl);
    } else if (onOpenTimelineEditor) {
      onOpenTimelineEditor();
    }
  };

  // Aggregate narration script across all storyboard scenes for teleprompter
  const combinedNarrationScript = storyboardScenes
    .map((s, idx) => `[Scene ${idx + 1}: ${s.title}]\n${s.narrationScript}`)
    .join('\n\n');

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100 p-4 md:p-6 lg:p-8">
      {/* Hidden File Inputs for Device Ingestion */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif,image/*"
        className="hidden"
        onChange={handleDeviceFileInput}
      />
      <input
        ref={deviceMediaInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleDeviceFileInput}
      />
      <input
        ref={deviceAudioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleDeviceAudioInput}
      />
      {customAudioTrack && (
        <audio
          ref={customAudioRef}
          src={customAudioTrack.url}
          onEnded={() => setIsPlayingCustomAudio(false)}
          className="hidden"
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Upload Notification Toast */}
        {uploadNotification && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{uploadNotification}</span>
            </div>
            <button
              onClick={() => setUploadNotification(null)}
              className="text-emerald-400 hover:text-white text-xs cursor-pointer ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header & VidsCraft Studio Creative Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-black text-sm">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                VidsCraft AI Studio
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Google Vids Suite
                </span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Multi-scene video & presentation creator. Ingest photos, video B-roll clips and custom audio tracks from your device with auto-teleprompter scripts and animated lower thirds.
            </p>
          </div>

          {/* Google Vids AI Primary Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* PROMINENT DEVICE UPLOAD BUTTON */}
            <button
              onClick={() => deviceMediaInputRef.current?.click()}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer ring-1 ring-emerald-400/40"
              title="Upload photos, video clips, or audio tracks directly from your device"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </button>

            {/* PROMINENT ADD MULTIPLE IMAGES BUTTON */}
            <button
              onClick={() => setShowBatchImageModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-lg shadow-blue-600/25 active:scale-95 cursor-pointer ring-1 ring-blue-400/40"
              title="Add multiple images at once to create a multi-scene presentation video"
            >
              <Images className="w-3.5 h-3.5 text-white" />
              <span>+ Add Multiple Images</span>
            </button>

            {/* DEVICE MEDIA ASSETS DRAWER TOGGLE */}
            <button
              onClick={() => setShowDeviceLibrary((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                showDeviceLibrary
                  ? 'bg-zinc-800 text-emerald-300 border-emerald-500/80 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600'
              }`}
              title="View your uploaded device media library"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Device Assets ({deviceAssets.length})</span>
            </button>

            {/* Chat AI Video Director Button */}
            <button
              onClick={() => setShowAIChatDrawer(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer ring-1 ring-purple-400/40"
              title="Chat with AI Video Director to configure prompts, portrait aspect ratios, custom durations & scenes"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Chat AI Director</span>
            </button>

            {/* AI Video Prompter Studio Button */}
            <button
              onClick={() => {
                setIsAiPromptBarOpen((prev) => !prev);
                aiPromptInputRef.current?.focus();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Prompt AI to craft scenes and synthesize video as you want"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Prompter</span>
            </button>

            {/* Help Me Create (Google Vids Flagship AI Tool) */}
            <button
              onClick={() => setShowHelpMeCreate(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
              title="Generate a multi-scene presentation storyboard from a text prompt"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Help Me Create</span>
            </button>

            {/* Teleprompter & Recording Booth */}
            <button
              onClick={() => setShowTeleprompter(true)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-cyan-500 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Open auto-scrolling teleprompter & read-along booth"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Teleprompter</span>
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  setStudioMode('storyboard');
                  setCurrentVideo(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  studioMode === 'storyboard'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Storyboard ({storyboardScenes.length})
              </button>
              <button
                onClick={() => {
                  setStudioMode('single-shot');
                  setCurrentVideo(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  studioMode === 'single-shot'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Single Shot
              </button>
              <button
                onClick={() => {
                  setStudioMode('3d-spatial');
                  setCurrentVideo(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  studioMode === '3d-spatial'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-purple-300 hover:text-white'
                }`}
                title="Interactive Three.js 3D Spatial Stage with camera orbit, depth parallax & 3D video recording"
              >
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span>3D Spatial Stage</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* EXPANDABLE DEVICE MEDIA ASSETS SHELF / LIBRARY                 */}
        {/* ============================================================== */}
        {showDeviceLibrary && (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Device Uploaded Media Assets ({deviceAssets.length})
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Ready to insert into your video presentation
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter Pills */}
                <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                  {(['all', 'image', 'video', 'audio'] as const).map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setDeviceFilter(ft)}
                      className={`px-2.5 py-0.5 rounded capitalize transition font-medium ${
                        deviceFilter === ft
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
                {deviceAssets.some((a) => a.type === 'image') && (
                  <button
                    onClick={handleInsertAllDeviceImagesToStoryboard}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition shadow-sm shadow-blue-600/30"
                    title="Insert all uploaded device images as consecutive scenes in your storyboard"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Insert All Images ({deviceAssets.filter((a) => a.type === 'image').length})</span>
                  </button>
                )}
                <button
                  onClick={() => setShowBatchImageModal(true)}
                  className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition"
                  title="Open batch image uploader to add multiple photos"
                >
                  <Images className="w-3.5 h-3.5" />
                  <span>+ Multiple Images</span>
                </button>
                <button
                  onClick={() => deviceMediaInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload More</span>
                </button>
                <button
                  onClick={() => setShowDeviceLibrary(false)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Asset Cards Grid */}
            {deviceAssets.length === 0 ? (
              <div
                onClick={() => deviceMediaInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-xl bg-zinc-950/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center"
              >
                <Upload className="w-8 h-8 text-emerald-400" />
                <p className="text-xs font-bold text-zinc-200">
                  No device files uploaded yet
                </p>
                <p className="text-[11px] text-zinc-500 max-w-sm">
                  Click here or drag & drop images (PNG, JPG, WEBP), video clips (MP4, WEBM), or audio tracks (MP3, WAV) from your computer or phone.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1">
                {deviceAssets
                  .filter((a) => deviceFilter === 'all' || a.type === deviceFilter)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleInsertAssetToScene(asset)}
                      className="group relative bg-zinc-950 border border-zinc-800 hover:border-emerald-500/80 rounded-xl p-2 cursor-pointer transition flex flex-col gap-1.5 shadow-sm"
                      title={`Click to add ${asset.name} to storyboard`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
                        {asset.type === 'image' && (
                          <img
                            src={asset.dataUrl || asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        )}
                        {asset.type === 'video' && (
                          <>
                            {asset.dataUrl ? (
                              <img
                                src={asset.dataUrl}
                                alt={asset.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <Video className="w-6 h-6 text-cyan-400" />
                            )}
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono text-white">
                              {asset.duration ? `${asset.duration}s` : 'VIDEO'}
                            </span>
                          </>
                        )}
                        {asset.type === 'audio' && (
                          <div className="flex flex-col items-center justify-center p-2 text-cyan-400">
                            <Music className="w-6 h-6 mb-1 animate-pulse" />
                            <span className="text-[9px] font-mono text-zinc-400">
                              {asset.duration ? `${asset.duration}s` : 'AUDIO'}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-1 left-1 px-1 py-0.2 bg-emerald-600 text-white rounded text-[8px] font-mono font-bold uppercase">
                          {asset.type}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-zinc-200 truncate group-hover:text-emerald-300">
                          {asset.name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                          <span>{Math.round((asset.sizeBytes || 0) / 1024)} KB</span>
                          <span className="text-emerald-400 font-semibold group-hover:underline">
                            + Insert
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDeviceAsset(asset.id, e)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-black/80 text-zinc-400 hover:text-red-400 transition"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MULTI-SCENE STORYBOARD STRIP WITH AI PROMPTING PLACE           */}
        {/* ============================================================== */}
        {studioMode === 'storyboard' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Multi-Scene Storyboard Sequence
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  {storyboardScenes.length} Keyframe Scenes •{' '}
                  {storyboardScenes.reduce((sum, s) => sum + s.duration, 0)}s Total
                </span>
              </div>

              {/* ======================================================== */}
              {/* AI PROMPTING PLACE (Replaces '+ Add Keyframe Images (+)') */}
              {/* ======================================================== */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex items-center">
                  <input
                    ref={aiPromptInputRef}
                    type="text"
                    value={aiVideoPrompt}
                    onChange={(e) => setAiVideoPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateVideoFromPrompt(
                          aiVideoPrompt || 'Epic cinematic futuristic neon city with slow camera zoom in 4K',
                          true
                        );
                      }
                    }}
                    placeholder="✨ AI Prompt Place: Prompt what video you want..."
                    className="w-60 sm:w-72 md:w-80 bg-zinc-950 border border-cyan-500/50 focus:border-cyan-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none shadow-inner"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none" />
                </div>

                <button
                  type="button"
                  disabled={isAiProcessingPrompt}
                  onClick={() =>
                    handleCreateVideoFromPrompt(
                      aiVideoPrompt || 'Epic cinematic futuristic neon city with slow camera zoom in 4K',
                      true
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="AI acts on prompt and synthesizes video immediately"
                >
                  {isAiProcessingPrompt ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isAiProcessingPrompt ? 'AI Acting...' : 'Create from Prompt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBatchImageModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer"
                  title="Add multiple images at once to create consecutive scenes"
                >
                  <Images className="w-3.5 h-3.5" />
                  <span>+ Multiple Images</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiPromptBarOpen(!isAiPromptBarOpen)}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    isAiPromptBarOpen
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                  title="Toggle Full AI Prompting Command Center & Controls"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* EXPANDABLE AI VIDEO PROMPTING COMMAND CENTER             */}
            {/* ======================================================== */}
            {isAiPromptBarOpen && (
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-cyan-500/30 shadow-inner space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Video Prompt Command Center</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-normal">
                      • AI acts according to your prompt
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Describe subjects, motion, lighting & themes
                  </span>
                </div>

                {/* Quick Presets Prompt Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
                    Prompt Ideas:
                  </span>
                  {[
                    { label: '🏙️ Cyberpunk Neon City', text: 'Towering neon skyscrapers in rain, flying vehicles and holographic billboards, slow zoom' },
                    { label: '🏔️ Alpine Lake Sunrise', text: 'Golden sunrise rays over misty alpine mountain lake and evergreen pines, slow pan' },
                    { label: '🌸 Cherry Blossom Shrine', text: 'Ancient Japanese hill temple with floating pink sakura petals, tracking pan' },
                    { label: '🚀 Deep Space Nebula', text: 'Glowing cosmic nebula stardust with orbital rotational camera sweep in 4K' },
                    { label: '🏎️ Desert Supercar Drift', text: 'Classic sports car drifting through red rock desert canyon highway, cinematic zoom' },
                    { label: '✨ Fashion Studio Vertigo', text: 'High-end studio fashion model with anamorphic lens flare and dramatic dolly zoom' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiVideoPrompt(preset.text);
                        handleCreateVideoFromPrompt(preset.text, false);
                      }}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-cyan-950 border border-zinc-800 hover:border-cyan-500/50 text-[10px] text-zinc-300 hover:text-cyan-300 whitespace-nowrap transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Prompt Tuning Controls Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-900 text-xs">
                  {/* Scenes Count */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Scenes Count</label>
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      {[2, 3, 4, 5].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setAiSceneCount(cnt)}
                          className={`flex-1 py-0.5 text-[10px] font-bold rounded transition ${
                            aiSceneCount === cnt
                              ? 'bg-cyan-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera Motion Choice */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Camera Motion</label>
                    <select
                      value={aiMotionPreference}
                      onChange={(e) => setAiMotionPreference(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="auto">Auto (AI Decides)</option>
                      <option value="zoom-in">Zoom In</option>
                      <option value="pan-right">Pan Right</option>
                      <option value="orbit">Orbit 360°</option>
                      <option value="dolly-zoom">Dolly Zoom</option>
                      <option value="zoom-out">Zoom Out</option>
                      <option value="tilt-up">Tilt Up</option>
                      <option value="ambient-flow">Ambient Flow</option>
                    </select>
                  </div>

                  {/* Atmosphere Choice */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Atmosphere & FX</label>
                    <select
                      value={aiAtmospherePreference}
                      onChange={(e) => setAiAtmospherePreference(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="auto">Auto (AI Decides)</option>
                      <option value="rain">Rain & Storm</option>
                      <option value="god-rays">Volumetric Sun Rays</option>
                      <option value="embers">Floating Embers</option>
                      <option value="dust-particles">Cinematic Dust</option>
                      <option value="sakura-petals">Sakura Petals</option>
                      <option value="cyber-glitch">Cyber Neon Glow</option>
                    </select>
                  </div>

                  {/* Duration Per Scene */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Duration Per Scene</label>
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      {[3, 5, 8, 10].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setAiSceneDuration(sec)}
                          className={`flex-1 py-0.5 text-[10px] font-bold rounded transition ${
                            aiSceneDuration === sec
                              ? 'bg-cyan-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Prompt Feedback / Success Alert */}
                {aiPromptFeedback && (
                  <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{aiPromptFeedback}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiPromptFeedback(null)}
                      className="text-zinc-400 hover:text-white ml-2 text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Horizontal Storyboard Keyframe Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {storyboardScenes.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;
                return (
                  <div
                    key={scene.id}
                    onClick={() => {
                      setActiveSceneIndex(idx);
                      setCurrentVideo(null);
                    }}
                    className={`shrink-0 w-48 bg-zinc-950 border rounded-xl p-2.5 transition-all cursor-pointer relative group ${
                      isActive
                        ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Scene Image Thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-2 border border-zinc-800">
                      <img
                        src={scene.image}
                        alt={scene.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white font-mono">
                        #{idx + 1}
                      </span>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                        {scene.duration}s
                      </span>
                    </div>

                    {/* Scene Title & Motion */}
                    <div className="text-xs font-semibold text-zinc-100 truncate mb-1">
                      {scene.title}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span className="capitalize text-cyan-400">{scene.motion}</span>
                      <span className="text-zinc-500">→ {scene.transition}</span>
                    </div>

                    {/* Move, 3D & Delete Hover Controls */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/85 rounded-md p-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSceneIndex(idx);
                          setStudioMode('3d-spatial');
                          setCurrentVideo(null);
                        }}
                        className="px-1.5 py-0.5 rounded bg-purple-600/80 hover:bg-purple-500 text-[9px] font-black text-white flex items-center gap-0.5"
                        title="View and stage this keyframe in 3D Spatial Stage"
                      >
                        3D
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleMoveScene(idx, 'left', e)}
                          className="p-1 hover:text-cyan-400"
                          title="Move scene left"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < storyboardScenes.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleMoveScene(idx, 'right', e)}
                          className="p-1 hover:text-cyan-400"
                          title="Move scene right"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteScene(idx, e)}
                        className="p-1 hover:text-red-400"
                        title="Delete scene"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* ======================================================== */}
              {/* AI PROMPTING SCENE CARD (Replaces '+ Add Images (+)' card)*/}
              {/* ======================================================== */}
              <div
                onClick={() => {
                  setIsAiPromptBarOpen(true);
                  aiPromptInputRef.current?.focus();
                }}
                className="shrink-0 w-44 h-28 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-zinc-950 hover:from-cyan-950/60 hover:to-purple-950/50 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group text-center p-3 shadow-lg hover:shadow-cyan-500/10"
                title="Click to prompt AI to generate and add a new scene according to your prompt"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-cyan-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-cyan-200 group-hover:text-white">
                  + AI Prompt Place
                </span>
                <span className="text-[9px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                  Prompt to create video
                </span>
              </div>

              {/* ======================================================== */}
              {/* UPLOAD FROM DEVICE SCENE CARD                            */}
              {/* ======================================================== */}
              <div
                onClick={() => deviceMediaInputRef.current?.click()}
                className="shrink-0 w-44 h-28 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-zinc-950 hover:from-emerald-950/60 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group text-center p-3 shadow-lg hover:shadow-emerald-500/10"
                title="Upload photos, videos, or audio tracks directly from your device"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-emerald-500/30">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-emerald-200 group-hover:text-white">
                  + Upload from Device
                </span>
                <span className="text-[9px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                  Images, Videos & Audio
                </span>
              </div>

              {/* ======================================================== */}
              {/* BATCH MULTIPLE IMAGES SCENE CARD                         */}
              {/* ======================================================== */}
              <div
                onClick={() => setShowBatchImageModal(true)}
                className="shrink-0 w-44 h-28 border-2 border-dashed border-blue-500/60 hover:border-blue-400 bg-gradient-to-br from-blue-950/40 via-sky-950/30 to-zinc-950 hover:from-blue-950/60 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group text-center p-3 shadow-lg hover:shadow-blue-500/10"
                title="Select multiple images from your device to assemble consecutive video scenes"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-blue-500/30">
                  <Images className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-blue-200 group-hover:text-white">
                  + Add Multiple Images
                </span>
                <span className="text-[9px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                  Batch select photos & art
                </span>
              </div>

              {/* ======================================================== */}
              {/* CUSTOM AUDIO SOUNDTRACK / VOICEOVER CARD                 */}
              {/* ======================================================== */}
              <div
                onClick={() => deviceAudioInputRef.current?.click()}
                className={`shrink-0 w-44 h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group text-center p-3 shadow-lg ${
                  customAudioTrack
                    ? 'border-cyan-500/80 bg-cyan-950/40 hover:bg-cyan-950/60'
                    : 'border-zinc-800 hover:border-cyan-500/50 bg-zinc-950/60 hover:bg-zinc-900/60'
                }`}
                title="Upload custom background music or voiceover audio from device (MP3, WAV, M4A)"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-cyan-500/30">
                  <Music className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-cyan-200 group-hover:text-white truncate max-w-[130px]">
                  {customAudioTrack ? customAudioTrack.name : '+ Add Audio Track'}
                </span>
                <span className="text-[9px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                  {customAudioTrack ? `${customAudioTrack.duration || 30}s • Click to swap` : 'MP3, WAV, M4A from device'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Studio Grid: Left Column Controls, Right Column Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Scene Tuning, Motion, Transitions, Narration (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Active Scene Settings / Prompt Area */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  {studioMode === 'storyboard' ? `Scene #${activeSceneIndex + 1} Prompt & Visuals` : 'Animation Prompt'}
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAIChatDrawer(true)}
                    className="text-[11px] font-medium text-purple-300 hover:text-purple-200 flex items-center gap-1 px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 transition cursor-pointer"
                    title="Open Chat AI Video Director"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Chat AI</span>
                  </button>
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt || !prompt.trim()}
                    className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 transition cursor-pointer"
                  >
                    <Wand2 className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                    {isEnhancingPrompt ? 'Expanding...' : 'AI Expand'}
                  </button>
                </div>
              </div>

              {/* Text Area with Embedded Dictation Mic */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (studioMode === 'storyboard') {
                      handleUpdateActiveScene({ prompt: e.target.value });
                    }
                  }}
                  placeholder="e.g. Dynamic slow zoom into the glowing horizon with floating micro particles and cinematic lighting..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-lg p-3 pr-10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
                />

                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title="Speak prompt aloud"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Storyboard Scene Narration Script Box */}
              {studioMode === 'storyboard' && currentActiveScene && (
                <div className="space-y-1 pt-1 border-t border-zinc-800/70">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1 font-semibold text-zinc-300">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Narration Voiceover Script (Scene #{activeSceneIndex + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTeleprompter(true)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Teleprompter
                    </button>
                  </div>
                  <textarea
                    value={currentActiveScene.narrationScript}
                    onChange={(e) => handleUpdateActiveScene({ narrationScript: e.target.value })}
                    rows={2}
                    placeholder="Narration script spoken during this scene..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSynthesizeSceneVoiceover(activeSceneIndex)}
                        className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 flex items-center gap-1 transition cursor-pointer font-medium"
                        title="Synthesize AI voiceover narration and auto-sync scene duration"
                      >
                        <Volume2 className="w-3 h-3 text-cyan-400" />
                        <span>Synthesize Voiceover</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const words = currentActiveScene.narrationScript.trim().split(/\s+/).filter(Boolean);
                          const sec = Math.max(3, Math.min(60, Math.ceil((words.length / 140) * 60)));
                          handleUpdateActiveScene({ duration: sec });
                          setDuration(sec);
                          setUploadNotification(`Scene duration synced to ${sec}s based on script length.`);
                          setTimeout(() => setUploadNotification(null), 3000);
                        }}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 transition cursor-pointer"
                        title="Auto-calculate duration based on script words (~140 wpm)"
                      >
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Sync Duration</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {currentActiveScene.narrationScript.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Motion & Scene Transitions */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Camera Choreography</span>
                  <span className="text-[11px] font-mono text-cyan-400">{motionSpeed}x Speed</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTION_OPTIONS.slice(0, 6).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setMotion(opt.id);
                        if (studioMode === 'storyboard') {
                          handleUpdateActiveScene({ motion: opt.id });
                        }
                      }}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        motion === opt.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="font-semibold">{opt.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scene Transition Selector (When in Storyboard mode) */}
              {studioMode === 'storyboard' && currentActiveScene && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 block">
                    Transition to Next Scene
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {TRANSITION_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleUpdateActiveScene({ transition: t.id as any })}
                        className={`p-1.5 rounded-lg border text-center text-[10px] font-semibold transition ${
                          currentActiveScene.transition === t.id
                            ? 'border-cyan-500 bg-cyan-950 text-cyan-300 ring-1 ring-cyan-500/40'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div>{t.icon}</div>
                        <div className="truncate mt-0.5">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 3D CAMERA DEPTH & PERSPECTIVE INTENSITY CONTROL          */}
              {/* ======================================================== */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3D Camera Depth & Perspective</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-800/60">
                      WebGL 3D
                    </span>
                    {studioMode !== '3d-spatial' && (
                      <button
                        type="button"
                        onClick={() => setStudioMode('3d-spatial')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                        title="Open interactive 3D WebGL stage"
                      >
                        Launch 3D Stage →
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Fine-tune Z-axis travel push-in/pull-back, lens foreshortening perspective angle, and spatial 3D display curvature for {studioMode === 'storyboard' ? `Scene #${activeSceneIndex + 1}` : 'this scene'}.
                </p>

                {/* 1. Z-Axis Camera Depth Movement */}
                <div className="space-y-1.5 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300 flex items-center gap-1">
                      <span>Z-Axis Movement (Depth Travel)</span>
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {activeZDepth > 0 ? `+${activeZDepth.toFixed(1)}` : activeZDepth.toFixed(1)} Depth
                      <span className="text-[10px] text-zinc-500 font-normal ml-1">
                        ({activeZDepth > 2.0 ? 'Deep Push-In' : activeZDepth > 0 ? 'Push-In' : activeZDepth < 0 ? 'Pull-Back' : 'Static'})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="5.0"
                    step="0.1"
                    value={activeZDepth}
                    onChange={(e) => handleUpdateDepthSettings({ zDepthMove: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>-3.0 (Far Pull-Back)</span>
                    <span>0.0 (Zero Travel)</span>
                    <span>+5.0 (Extreme Push)</span>
                  </div>
                </div>

                {/* 2. Perspective Intensity (Camera Lens FOV) */}
                <div className="space-y-1.5 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300 flex items-center gap-1">
                      <span>Perspective Intensity (Lens FOV)</span>
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {activeFov}° Angle
                      <span className="text-[10px] text-zinc-500 font-normal ml-1">
                        ({activeFov < 40 ? 'Telephoto' : activeFov <= 55 ? 'Natural' : 'Ultra-Wide'})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="85"
                    step="1"
                    value={activeFov}
                    onChange={(e) => handleUpdateDepthSettings({ perspectiveIntensity: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>30° (Telephoto Flat)</span>
                    <span>50° (Natural)</span>
                    <span>85° (Ultra-Wide Foreshortened)</span>
                  </div>
                </div>

                {/* 3. 3D Spatial Screen Curvature */}
                <div className="space-y-1.5 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300 flex items-center gap-1">
                      <span>3D Spatial Curvature (Relief)</span>
                    </span>
                    <span className="font-mono text-pink-400 font-bold">
                      {Math.round(activeCurvature * 100)}% Curve
                      <span className="text-[10px] text-zinc-500 font-normal ml-1">
                        ({activeCurvature === 0 ? 'Flat Screen' : activeCurvature <= 0.4 ? 'Curved' : 'IMAX Depth'})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={activeCurvature}
                    onChange={(e) => handleUpdateDepthSettings({ depthCurvature: parseFloat(e.target.value) })}
                    className="w-full accent-pink-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>0% (Cinema Flat)</span>
                    <span>50% (Curved Display)</span>
                    <span>100% (IMAX Arc)</span>
                  </div>
                </div>

                {/* Quick Depth Presets */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Quick Depth Presets</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { label: 'Deep Plunge', z: 3.8, fov: 68, curve: 0.45, hint: 'Push + Wide' },
                      { label: 'Cinema 3D', z: 1.5, fov: 48, curve: 0.25, hint: 'Natural depth' },
                      { label: 'IMAX Curve', z: 2.2, fov: 75, curve: 0.75, hint: 'Wide + Arc' },
                      { label: 'Pull-Back', z: -2.0, fov: 80, curve: 0.15, hint: 'Reveal zoom' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          handleUpdateDepthSettings({
                            zDepthMove: preset.z,
                            perspectiveIntensity: preset.fov,
                            depthCurvature: preset.curve,
                          })
                        }
                        className="p-1.5 rounded-lg border border-zinc-800 hover:border-cyan-500/50 bg-zinc-950 hover:bg-zinc-900 text-left transition cursor-pointer"
                      >
                        <div className="text-[11px] font-bold text-zinc-200">{preset.label}</div>
                        <div className="text-[9px] text-zinc-500 truncate">{preset.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio Selector with Prominent Portrait Support */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <span>Aspect Ratio</span>
                    {aspectRatio === '9:16' && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                        Portrait Reel
                      </span>
                    )}
                    {aspectRatio === '4:5' && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40">
                        Portrait Feed
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {aspectRatio === '9:16'
                      ? '9:16 Portrait (1080x1920)'
                      : aspectRatio === '4:5'
                      ? '4:5 Portrait (1080x1350)'
                      : aspectRatio === '16:9'
                      ? '16:9 Landscape (1920x1080)'
                      : aspectRatio === '1:1'
                      ? '1:1 Square (1080x1080)'
                      : '21:9 Ultrawide (2560x1080)'}
                  </span>
                </div>

                {/* Aspect Ratio Quick Visual Buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title="Portrait 9:16 (Reels, TikTok, Shorts, Stories)"
                  >
                    <div className="w-3.5 h-5 rounded-xs border-2 border-current" />
                    <span className="text-[10px] font-bold">9:16 Portrait</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('4:5')}
                    className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aspectRatio === '4:5'
                        ? 'border-pink-500 bg-pink-950/60 text-pink-300 ring-2 ring-pink-500/30'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title="Portrait 4:5 (Instagram Feed & Social Carousel)"
                  >
                    <div className="w-4 h-5 rounded-xs border-2 border-current" />
                    <span className="text-[10px] font-bold">4:5 Portrait</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title="Landscape 16:9 (YouTube, Presentation, Cinema)"
                  >
                    <div className="w-5 h-3.5 rounded-xs border-2 border-current" />
                    <span className="text-[10px] font-bold">16:9 Land</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aspectRatio === '1:1'
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title="Square 1:1 (Instagram Post, Square Video)"
                  >
                    <div className="w-4 h-4 rounded-xs border-2 border-current" />
                    <span className="text-[10px] font-bold">1:1 Square</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('21:9')}
                    className={`py-2 px-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      aspectRatio === '21:9'
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title="Ultrawide 21:9 (Anamorphic Cinema Film)"
                  >
                    <div className="w-5.5 h-2.5 rounded-xs border-2 border-current" />
                    <span className="text-[10px] font-bold">21:9 Wide</span>
                  </button>
                </div>
              </div>

              {/* Scene Duration According to Your Choice */}
              <div className="pt-2 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {studioMode === 'storyboard'
                        ? `Scene #${activeSceneIndex + 1} Duration`
                        : 'Video Duration'}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400">User Set Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={duration}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
                        setDuration(val);
                        if (studioMode === 'storyboard') {
                          handleUpdateActiveScene({ duration: val });
                        }
                      }}
                      className="w-16 bg-zinc-950 border border-cyan-500/60 rounded px-2 py-0.5 text-xs text-center text-cyan-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-zinc-400 font-semibold">sec</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 font-mono">1s</span>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={Math.min(60, duration)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDuration(val);
                      if (studioMode === 'storyboard') {
                        handleUpdateActiveScene({ duration: val });
                      }
                    }}
                    className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">60s</span>
                </div>

                {/* Quick Duration Preset Choice Chips */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    {[3, 5, 8, 10, 15, 20, 30, 45, 60].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setDuration(s);
                          if (studioMode === 'storyboard') {
                            handleUpdateActiveScene({ duration: s });
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                          duration === s
                            ? 'bg-cyan-600 text-white font-bold shadow-xs'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>

                  {/* Apply to All Scenes in Storyboard */}
                  {studioMode === 'storyboard' && storyboardScenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStoryboardScenes((prev) => prev.map((s) => ({ ...s, duration })));
                      }}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      title="Apply current duration to every scene in the storyboard"
                    >
                      Apply {duration}s to all {storyboardScenes.length} scenes
                    </button>
                  )}
                </div>
              </div>

              {/* Frame Rate & Render Quality */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Frame Rate</span>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="24">24 FPS Film</option>
                  <option value="30">30 FPS Standard</option>
                  <option value="60">60 FPS Ultra-Smooth</option>
                </select>
              </div>

              {/* Lower Thirds Overlay Controls (Google Vids feature) */}
              {studioMode === 'storyboard' && currentActiveScene && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">Lower Third Title Card</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-cyan-400">
                      <input
                        type="checkbox"
                        checked={currentActiveScene.lowerThird?.enabled ?? false}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            lowerThird: {
                              enabled: e.target.checked,
                              headline: currentActiveScene.lowerThird?.headline || currentActiveScene.title.toUpperCase(),
                              subheadline: currentActiveScene.lowerThird?.subheadline || 'Key Takeaway Overview',
                              position: currentActiveScene.lowerThird?.position || 'bottom-left',
                            },
                          })
                        }
                        className="rounded accent-cyan-500 cursor-pointer"
                      />
                      Enable Overlay
                    </label>
                  </div>

                  {currentActiveScene.lowerThird?.enabled && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={currentActiveScene.lowerThird.headline}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            lowerThird: {
                              ...currentActiveScene.lowerThird!,
                              headline: e.target.value,
                            },
                          })
                        }
                        placeholder="Headline / Title..."
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={currentActiveScene.lowerThird.subheadline}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            lowerThird: {
                              ...currentActiveScene.lowerThird!,
                              subheadline: e.target.value,
                            },
                          })
                        }
                        placeholder="Subtitle / Role..."
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Generate Button */}
            <button
              onClick={
                studioMode === 'storyboard'
                  ? handleGenerateMultiSceneVideo
                  : handleGenerateSingleVideo
              }
              disabled={isGenerating}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                isGenerating
                  ? 'bg-zinc-800 cursor-not-allowed text-zinc-400'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/25 active:scale-[0.99]'
              }`}
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              {isGenerating
                ? 'Synthesizing VidsCraft Video...'
                : studioMode === 'storyboard'
                ? `Synthesize ${storyboardScenes.length}-Scene Master Video`
                : 'Generate 4K Video Scene'}
            </button>
          </div>

          {/* RIGHT COLUMN: Video Viewport & History (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Monitor Stage: Live Canvas vs Rendered Video Player */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
              {/* Status Bar */}
              <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-semibold text-zinc-200">
                    {currentVideo ? 'Exported Master Video' : 'Real-Time VidsCraft Viewport'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {aspectRatio} • {fps} FPS
                  </span>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => {
                      setStudioMode(studioMode === '3d-spatial' ? 'storyboard' : '3d-spatial');
                      setCurrentVideo(null);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      studioMode === '3d-spatial'
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30'
                    }`}
                    title="Toggle Three.js 3D Spatial Stage Viewport"
                  >
                    <Sparkles className="w-3 h-3 text-purple-300" />
                    <span>{studioMode === '3d-spatial' ? 'Exit 3D' : '✦ 3D Stage'}</span>
                  </button>
                  {currentVideo && (
                    <button
                      onClick={() => setCurrentVideo(null)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Live Canvas
                    </button>
                  )}
                  <span className="text-[11px] font-semibold text-cyan-400 font-mono">
                    {studioMode === '3d-spatial' ? '3D WEBGL' : currentVideo ? 'RENDERED' : 'LIVE 60FPS'}
                  </span>
                </div>
              </div>

              {/* Viewport Frame with Reactive Device Drag-and-Drop Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOver(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processDeviceFiles(e.dataTransfer.files);
                  }
                }}
                className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden transition-all ${
                  isDraggingOver ? 'ring-4 ring-emerald-500 ring-inset' : ''
                }`}
              >
                {/* Drag-and-Drop Reactive Overlay */}
                {isDraggingOver && (
                  <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-emerald-400">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 animate-bounce">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-white mb-1">
                      Drop Files to Ingest from Device
                    </p>
                    <p className="text-xs text-emerald-200 max-w-sm">
                      Upload Photos (PNG, JPG, WEBP), Video B-Roll (MP4, WEBM), or Audio Tracks (MP3, WAV)
                    </p>
                  </div>
                )}

                {studioMode === '3d-spatial' ? (
                  <ThreeSpatialStudio
                    sourceImage={currentActiveScene ? currentActiveScene.image : sourceImage}
                    sourceImageName={currentActiveScene ? currentActiveScene.title : sourceImageName}
                    aspectRatio={aspectRatio}
                    duration={duration}
                    prompt={prompt}
                    headline={currentActiveScene?.lowerThird?.headline || sourceImageName}
                    subheadline={currentActiveScene?.lowerThird?.subheadline || 'Spatial 3D Neural Viewport'}
                    zDepthMove={activeZDepth}
                    perspectiveIntensity={activeFov}
                    depthCurvature={activeCurvature}
                    onDepthConfigChange={({ zDepthMove, perspectiveIntensity, depthCurvature }) => {
                      handleUpdateDepthSettings({ zDepthMove, perspectiveIntensity, depthCurvature });
                    }}
                    onAddSceneToStoryboard={(newScene) => {
                      setStoryboardScenes((prev) => [...prev, newScene]);
                      setActiveSceneIndex(storyboardScenes.length);
                      setStudioMode('storyboard');
                    }}
                    onExportVideoRecorded={(videoUrl, title) => {
                      const videoItem: ImageToVideoItem = {
                        id: 'video_3d_' + Date.now(),
                        title,
                        prompt,
                        sourceImage: currentActiveScene ? currentActiveScene.image : sourceImage,
                        sourceImageName,
                        videoUrl,
                        motion: 'orbit',
                        motionSpeed: 1.0,
                        aspectRatio,
                        duration,
                        fps,
                        atmosphere: 'dust-particles',
                        resolution: `${aspectRatio} 3D WebGL`,
                        hasAudio: false,
                        engine: 'neural-motion-canvas',
                        promptFidelity,
                        createdAt: Date.now(),
                      };
                      setCurrentVideo(videoItem);
                      saveToHistory(videoItem);
                    }}
                  />
                ) : currentVideo ? (
                  <video
                    ref={videoPlayerRef}
                    src={currentVideo.videoUrl}
                    loop={isLooping}
                    muted={isMuted}
                    autoPlay
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full object-contain bg-black"
                  />
                )}

                {/* Progress Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                      <Compass className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-base font-bold text-white mb-1">
                      VidsCraft AI Rendering
                    </div>
                    <div className="text-xs text-cyan-300 font-medium mb-3 max-w-sm">
                      {generationPhase}
                    </div>
                    <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-200"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 mt-2 font-semibold">
                      {generationProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Device Ingestion & Custom Audio Bar */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-semibold">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Device Upload Place:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => deviceMediaInputRef.current?.click()}
                    className="px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Upload images or video clips from device"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Media</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBatchImageModal(true)}
                    className="px-3 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Add multiple images at once to create a multi-scene presentation video"
                  >
                    <Images className="w-3.5 h-3.5" />
                    <span>+ Multiple Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deviceAudioInputRef.current?.click()}
                    className="px-3 py-1 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Upload background music or custom voiceover audio (MP3, WAV, M4A)"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Add Audio Track</span>
                  </button>
                </div>

                {/* Active Custom Audio Track Badge */}
                {customAudioTrack && (
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded-lg">
                    <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-[11px] text-zinc-200 truncate max-w-[150px] font-medium">
                      {customAudioTrack.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {customAudioTrack.duration ? `${customAudioTrack.duration}s` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (customAudioRef.current) {
                          if (isPlayingCustomAudio) {
                            customAudioRef.current.pause();
                            setIsPlayingCustomAudio(false);
                          } else {
                            customAudioRef.current.play();
                            setIsPlayingCustomAudio(true);
                          }
                        }
                      }}
                      className="text-cyan-400 hover:text-cyan-300 ml-1 cursor-pointer"
                      title={isPlayingCustomAudio ? 'Pause Audio' : 'Preview Audio'}
                    >
                      {isPlayingCustomAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAudioTrack(null);
                        localStorage.removeItem('vidscraft_custom_audio');
                      }}
                      className="text-zinc-500 hover:text-red-400 ml-1 text-xs cursor-pointer font-bold"
                      title="Remove audio track"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Video Player Action Footer */}
              {currentVideo && (
                <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (videoPlayerRef.current) {
                          videoPlayerRef.current.currentTime = 0;
                          videoPlayerRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                      title="Replay from start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadVideo}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Video
                    </button>

                    <button
                      onClick={handleSendToTimeline}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Send to Timeline Editor 16
                    </button>

                    {onSendToVideoToText && (
                      <button
                        onClick={() => onSendToVideoToText(currentVideo.videoUrl, currentVideo.title)}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
                        title="Transcribe spoken dialogue and extract text from this generated video"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Transcribe to Text
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preset Starters Strip */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Quick Preset Starters (Click (+) to add to Storyboard)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_IMAGE_PRESETS.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-cyan-500/60 transition group flex flex-col justify-between"
                  >
                    <div className="text-[11px] font-semibold text-white truncate mb-1">
                      {p.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddPresetScene(p)}
                      className="w-full mt-1 py-1 rounded bg-zinc-900 hover:bg-cyan-600 text-zinc-300 hover:text-white text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add to Storyboard
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Vids Help Me Create Modal */}
      <HelpMeCreateModal
        isOpen={showHelpMeCreate}
        onClose={() => setShowHelpMeCreate(false)}
        onApplyStoryboard={(scenes) => {
          setStoryboardScenes(scenes);
          setActiveSceneIndex(0);
          setStudioMode('storyboard');
          setCurrentVideo(null);
        }}
      />

      {/* Google Vids Auto-Scrolling Teleprompter Modal */}
      <TeleprompterModal
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        scriptText={combinedNarrationScript}
        currentVoiceName={currentTTSAudio?.speakerName || 'Voiceover Track'}
      />

      {/* Batch Image Uploader Modal for Multiple Images with Plus Icon */}
      <BatchImageUploaderModal
        isOpen={showBatchImageModal}
        onClose={() => setShowBatchImageModal(false)}
        defaultDuration={duration}
        onAddScenes={(newScenes) => {
          setStoryboardScenes((prev) => [...prev, ...newScenes]);
          setActiveSceneIndex(storyboardScenes.length);
          setStudioMode('storyboard');
          setCurrentVideo(null);
        }}
      />

      {/* Dedicated Video Chat AI Director Drawer */}
      <VideoAIChatDrawer
        isOpen={showAIChatDrawer}
        onClose={() => setShowAIChatDrawer(false)}
        currentAspectRatio={aspectRatio}
        currentDuration={duration}
        currentMotion={motion}
        currentAtmosphere={atmosphere}
        currentPrompt={prompt}
        onApplyConfig={(config) => {
          if (config.prompt) {
            setPrompt(config.prompt);
            if (studioMode === 'storyboard') {
              handleUpdateActiveScene({ prompt: config.prompt });
            }
          }
          if (config.aspectRatio) {
            setAspectRatio(config.aspectRatio);
          }
          if (config.duration) {
            setDuration(config.duration);
            if (studioMode === 'storyboard') {
              handleUpdateActiveScene({ duration: config.duration });
            }
          }
          if (config.motion) {
            setMotion(config.motion);
            if (studioMode === 'storyboard') {
              handleUpdateActiveScene({ motion: config.motion });
            }
          }
          if (config.atmosphere) {
            setAtmosphere(config.atmosphere);
            if (studioMode === 'storyboard') {
              handleUpdateActiveScene({ atmosphere: config.atmosphere });
            }
          }
          if (config.scenes && config.scenes.length > 0) {
            setStoryboardScenes(config.scenes);
            setActiveSceneIndex(0);
            setStudioMode('storyboard');
          }
          setCurrentVideo(null);
        }}
      />
    </div>
  );
};
