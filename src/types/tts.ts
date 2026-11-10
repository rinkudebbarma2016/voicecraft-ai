export type VoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Charon' | 'Zephyr';

export type AccentCode =
  | 'en-IN'
  | 'en-IN-tech'
  | 'en-IN-story'
  | 'en-US'
  | 'en-GB'
  | 'en-AU'
  | 'global';

export interface AccentOption {
  code: AccentCode;
  label: string;
  flag: string;
  region: string;
  description: string;
}

export interface VoiceOption {
  name: VoiceName;
  displayName: string;
  gender: 'Female' | 'Male';
  tone: string;
  description: string;
  avatarColor: string;
  sampleText: string;
}

export type VoiceCategory =
  | 'All'
  | 'Conversational'
  | 'Narration'
  | 'Characters'
  | 'Social Media'
  | 'Educational'
  | 'Advertisement'
  | 'Entertainment'
  | 'Indian English'
  | 'News & Business'
  | 'Narrative & Books'
  | 'Commercial & Social'
  | 'Characters & Drama';

export interface NeuralSpeaker {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: string;
  flag: string;
  language?: string;
  age: 'Young' | 'Middle Aged' | 'Mature';
  category: VoiceCategory;
  useCase: string;
  description: string;
  avatarGradient: string;
  baseVoice: VoiceName;
  stylePrompt: string;
  samplePhrase: string;
  tags: string[];
  usageCount?: string;
  badgeVerified?: boolean;
  yearsActive?: string;
  isFavorite?: boolean;
}

export interface VoiceSettings {
  stability: number; // 0 to 100
  clarity: number; // 0 to 100
  styleExaggeration: number; // 0 to 100
}

export interface AudioMetadata {
  title: string;
  artist: string;
  genre: string;
  album?: string;
  year?: string;
  comment?: string;
}

export interface PeakNormalizationStats {
  originalPeakLinear: number;
  originalPeakDb: number;
  targetPeakDb: number;
  targetPeakLinear: number;
  normalizedPeakDb: number;
  gainMultiplier: number;
  gainDb: number;
  clippingPrevented: boolean;
  sampleCount: number;
  duration?: number;
}

export interface GeneratedAudio {
  id: string;
  title: string;
  text: string;
  audioBase64: string;
  audioUrl: string;
  voice: string;
  speakerId?: string;
  speakerName?: string;
  voiceB?: string;
  mode: 'solo' | 'dialogue' | 'web-speech' | 'batch';
  style?: string;
  accent?: string;
  chunksCount?: number;
  totalWords?: number;
  targetDuration?: number;
  targetSpeedMultiplier?: number;
  timestamp: number;
  duration?: number;
  fileSize?: string;
  metadata?: AudioMetadata;
  isNormalized?: boolean;
  peakDb?: number;
  normalizationStats?: PeakNormalizationStats;
}

export interface DialogueLine {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  speakerLabel?: string;
  text: string;
  style?: string;
}

export interface ScriptPreset {
  id: string;
  title: string;
  category: 'Commercial' | 'Story' | 'Technical' | 'Meditation' | 'Dialogue' | 'Indian English';
  recommendedVoice: VoiceName;
  recommendedSpeakerId?: string;
  accent?: AccentCode;
  style: string;
  text: string;
  dialogue?: DialogueLine[];
}

export type AudioFilterMode =
  | 'none'
  | 'podcast'
  | 'music'
  | 'voiceover'
  | 'crisp-speech'
  | 'bass-boost'
  | 'vintage-radio'
  | 'broadcast'
  | 'warm-hall';

export interface AudioEqPreset {
  id: AudioFilterMode;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  lowGain: number;
  midGain: number;
  highGain: number;
}

export interface BatchQueueItem {
  id: string;
  title: string;
  text: string;
  speakerId: string;
  speakerName: string;
  baseVoice: VoiceName;
  accent: string;
  targetSeconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  audioResult?: GeneratedAudio;
  errorMessage?: string;
  wordsCount: number;
  estimatedSeconds: number;
}

// AI Chat Director Types
export interface ChatActionData {
  script?: string;
  suggestedSpeaker?: string;
  suggestedSpeakerName?: string;
  suggestedAccent?: string;
  targetSeconds?: number;
  style?: string;
  dialogueLines?: DialogueLine[];
  videoPrompt?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionData?: ChatActionData;
  isGeneratingAudio?: boolean;
  thoughtDurationSec?: number;
  thoughtSteps?: string[];
}

// Subscription & 7-Day Free Trial Types
export type PlanTier = 'free' | 'creator' | 'studio' | 'enterprise';

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  popular?: boolean;
  highlightPerk: string;
  features: string[];
}

export interface UserSubscription {
  tier: PlanTier;
  isTrialActive: boolean;
  trialStartDate: number;
  trialDaysTotal: number;
  trialDaysRemaining: number;
  billingInterval: 'monthly' | 'annual';
  status: 'trialing' | 'active' | 'free';
  unlockedFeatures: string[];
}

// Voice Cloning AI Types
export interface ClonedVoiceProfile {
  pitchHz: number;
  speakingRateWpm: number;
  timbreType: 'Warm & Resonant' | 'Crisp & Articulate' | 'Deep & Authoritative' | 'Bright & Airy' | 'Smooth & Melodic';
  resonance: string;
  detectedAccent: string;
  emotionBaseline: string;
  confidenceScore: number;
}

export interface ClonedVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  accent: string;
  flag: string;
  description: string;
  baseVoice: VoiceName;
  stylePrompt: string;
  timbreProfile: ClonedVoiceProfile;
  sampleAudioBase64?: string;
  sampleDurationSec?: number;
  sampleFileName?: string;
  createdAt: number;
  settings: VoiceSettings;
  tags: string[];
  isCustomClone?: boolean;
}

// AI Video Studio Types
export type VideoVisualPreset =
  | 'cinematic'
  | 'cyberpunk'
  | 'drone-nature'
  | 'anime'
  | 'vintage-film'
  | 'dark-noir';

export type VideoCameraMotion =
  | 'zoom-in'
  | 'pan-right'
  | 'drone-dive'
  | 'orbit'
  | 'static';

export interface VideoSceneData {
  id?: string;
  title: string;
  prompt: string;
  style: VideoVisualPreset;
  cameraMotion: VideoCameraMotion;
  aspectRatio: '16:9' | '9:16' | '4:5' | '1:1' | '21:9' | '4:3';
  duration: number; // in seconds
  palette: string[];
  lighting: string;
  particles: 'rain' | 'dust' | 'embers' | 'stars' | 'rays';
  headlineOverlay: string;
  elements: string[];
  audioUrl?: string;
  audioTitle?: string;
  subtitleText?: string;
}

