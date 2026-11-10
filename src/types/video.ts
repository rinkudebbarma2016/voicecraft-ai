export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type VideoFilterType =
  | 'none'
  | 'cinematic-warm'
  | 'cyber-neon'
  | 'vhs-retro'
  | 'noir-bw'
  | 'teal-orange'
  | 'matrix-green';

export type TransitionType = 'none' | 'cross-dissolve' | 'fade-black' | 'slide-left' | 'glitch';

export interface SceneProfile {
  title: string;
  colorPalette: string[];
  lighting: string;
  mood: string;
  elements: string[];
  motionKeywords: string[];
  headlineOverlay: string;
}

export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'subtitle' | 'music';
  trackId: 'V1' | 'A1' | 'A2' | 'T1';
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  speed: number;
  volume: number; // 0 to 1
  sourceUrl?: string; // video/audio url (or data url)
  isProcedural?: boolean;
  sceneProfile?: SceneProfile;
  filter?: VideoFilterType;
  transition?: TransitionType;
  text?: string;
  textColor?: string;
  textBg?: string;
  textPosition?: 'bottom' | 'center' | 'top';
  textStyle?: 'bold-caption' | 'cinematic-title' | 'neon-glow' | 'minimal-modern';
}

export interface StockBroll {
  id: string;
  title: string;
  category: string;
  thumbnailGradient: string;
  aspectRatio: VideoAspectRatio;
  duration: number;
  sceneProfile: SceneProfile;
  prompt: string;
}

export interface StockAudioTrack {
  id: string;
  title: string;
  genre: string;
  duration: number;
  mood: string;
  bpm: number;
  synthType: 'lofi' | 'ambient' | 'epic' | 'fusion' | 'tech';
}
