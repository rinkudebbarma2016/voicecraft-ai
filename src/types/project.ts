export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:3' | '21:9' | '4:5';

export interface WfpClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image';
  trackIndex: number;
  startTime: number; // in seconds
  duration: number; // in seconds
  color?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  subtitleText?: string;
  effect?: string;
  volume?: number;
  speed?: number;
}

export interface WfpTrack {
  id: string;
  index: number;
  type: 'video' | 'audio' | 'overlay';
  name: string;
  isMuted?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface WfpProject {
  format: 'WFP_JSON_V2';
  application: 'CineCraft Pro Studio' | 'Wondershare Filmora / CineStudio Pro';
  version: '16.0.0';
  id: string;
  name: string;
  filename: string;
  aspectRatio: AspectRatioType;
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  fps: number;
  duration: number; // in seconds
  createdAt: number;
  lastEdited: number;
  thumbnailUrl?: string;
  thumbnailGradient: string;
  sizeMb: number;
  tracks: WfpTrack[];
  clips: WfpClip[];
  tags: string[];
}

export type TemplateCategory =
  | 'All'
  | 'Podcasts'
  | 'Documentary'
  | 'Commercial & Ads'
  | 'Social & Shorts'
  | 'Tutorials & Tech';

export interface WfpProjectTemplate {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, 'All'>;
  description: string;
  aspectRatio: AspectRatioType;
  resolution: {
    width: number;
    height: number;
    label: string;
  };
  duration: number; // in seconds
  fps: number;
  thumbnailGradient: string;
  iconName: string;
  badge: string;
  setupTimeSaved: string;
  targetPlatform: string;
  keyFeatures: string[];
  tags: string[];
  tracks: WfpTrack[];
  clips: WfpClip[];
}
