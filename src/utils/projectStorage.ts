import { WfpProject, AspectRatioType } from '../types/project';

const STORAGE_PROJECTS_KEY = 'wfp_recent_projects_v2';

export const DEFAULT_SAMPLE_PROJECTS: WfpProject[] = [
  {
    format: 'WFP_JSON_V2',
    application: 'CineCraft Pro Studio',
    version: '16.0.0',
    id: 'wfp_proj_beach_cinematic',
    name: 'Beach Coastal Drone 4K',
    filename: 'beach_cinematic_4k.wfp',
    aspectRatio: '16:9',
    resolution: { width: 3840, height: 2160, label: '4K UHD (3840x2160)' },
    fps: 60,
    duration: 18.5,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    lastEdited: Date.now() - 1000 * 60 * 30,
    thumbnailUrl: '/assets/aistudio/Screenshot_20261029-194055_75debce0.jpg',
    thumbnailGradient: 'from-cyan-900 to-blue-950',
    sizeMb: 14.2,
    tags: ['Drone', '4K', 'Cinematic', 'Nature'],
    tracks: [
      { id: 't-v1', index: 0, type: 'video', name: 'Video 1', isVisible: true },
      { id: 't-v2', index: 1, type: 'video', name: 'Overlay / Titles', isVisible: true },
      { id: 't-a1', index: 2, type: 'audio', name: 'Voiceover', isMuted: false },
      { id: 't-a2', index: 3, type: 'audio', name: 'Background Ocean Music', isMuted: false },
    ],
    clips: [
      {
        id: 'c-beach-1',
        name: 'Beach',
        type: 'video',
        trackIndex: 0,
        startTime: 0,
        duration: 8.5,
        color: '#0284c7',
        thumbnailUrl: '/assets/aistudio/Screenshot_20261029-194055_75debce0.jpg',
        effect: 'Cinematic Teal & Orange',
      },
      {
        id: 'c-coast-2',
        name: 'Coastal Rocks Aerial',
        type: 'video',
        trackIndex: 0,
        startTime: 8.5,
        duration: 10.0,
        color: '#0ea5e9',
        effect: 'Slow Motion Ramp 0.8x',
      },
      {
        id: 'c-audio-1',
        name: 'Ocean Waves & Ambient Melodic',
        type: 'audio',
        trackIndex: 3,
        startTime: 0,
        duration: 18.5,
        volume: 0.85,
      },
    ],
  },
  {
    format: 'WFP_JSON_V2',
    application: 'CineCraft Pro Studio',
    version: '16.0.0',
    id: 'wfp_proj_reels_fashion',
    name: 'Streetwear Launch Reel',
    filename: 'streetwear_tiktok_reel.wfp',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920, label: 'FHD Vertical (1080x1920)' },
    fps: 30,
    duration: 12.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    lastEdited: Date.now() - 1000 * 60 * 60 * 4,
    thumbnailGradient: 'from-purple-900 via-pink-900 to-rose-950',
    sizeMb: 8.7,
    tags: ['Reels', 'TikTok', 'Fashion', 'Fast Cuts'],
    tracks: [
      { id: 't-v1', index: 0, type: 'video', name: 'Main Cut', isVisible: true },
      { id: 't-v2', index: 1, type: 'video', name: 'Animated Subtitles', isVisible: true },
      { id: 't-a1', index: 2, type: 'audio', name: 'BGM Beat Track', isMuted: false },
    ],
    clips: [
      {
        id: 'c-street-1',
        name: 'Urban Transition',
        type: 'video',
        trackIndex: 0,
        startTime: 0,
        duration: 6.0,
        color: '#d946ef',
        effect: 'Glitch Zoom Beat Cut',
      },
      {
        id: 'c-street-2',
        name: 'Outfit Showcase',
        type: 'video',
        trackIndex: 0,
        startTime: 6.0,
        duration: 6.0,
        color: '#ec4899',
      },
    ],
  },
  {
    format: 'WFP_JSON_V2',
    application: 'CineCraft Pro Studio',
    version: '16.0.0',
    id: 'wfp_proj_podcast_interview',
    name: 'Tech Founder Podcast Ep. 14',
    filename: 'podcast_interview_ep14.wfp',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080, label: 'FHD Widescreen (1920x1080)' },
    fps: 30,
    duration: 45.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    lastEdited: Date.now() - 1000 * 60 * 60 * 12,
    thumbnailGradient: 'from-amber-950 via-orange-950 to-stone-900',
    sizeMb: 24.1,
    tags: ['Podcast', 'Indian English', 'Interview', 'Voiceover'],
    tracks: [
      { id: 't-v1', index: 0, type: 'video', name: 'Host & Guest Cam', isVisible: true },
      { id: 't-a1', index: 2, type: 'audio', name: 'Aarav Voice Track', isMuted: false },
      { id: 't-a2', index: 3, type: 'audio', name: 'Intro Stinger', isMuted: false },
    ],
    clips: [
      {
        id: 'c-pod-1',
        name: 'Cold Open Hook',
        type: 'video',
        trackIndex: 0,
        startTime: 0,
        duration: 15.0,
        color: '#f59e0b',
      },
      {
        id: 'c-pod-2',
        name: 'Core AI Discussion',
        type: 'video',
        trackIndex: 0,
        startTime: 15.0,
        duration: 30.0,
        color: '#d97706',
      },
    ],
  },
  {
    format: 'WFP_JSON_V2',
    application: 'CineCraft Pro Studio',
    version: '16.0.0',
    id: 'wfp_proj_cinema_tokyo',
    name: 'Tokyo Neon Cyberpunk 21:9',
    filename: 'tokyo_neon_cyberpunk.wfp',
    aspectRatio: '21:9',
    resolution: { width: 3440, height: 1440, label: 'Ultrawide Cinema (3440x1440)' },
    fps: 24,
    duration: 22.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    lastEdited: Date.now() - 1000 * 60 * 60 * 26,
    thumbnailGradient: 'from-cyan-950 via-indigo-950 to-purple-950',
    sizeMb: 19.8,
    tags: ['Anamorphic', '21:9', 'Cyberpunk', 'VFX'],
    tracks: [
      { id: 't-v1', index: 0, type: 'video', name: 'Master Video', isVisible: true },
      { id: 't-v2', index: 1, type: 'video', name: 'Neon Glitch VFX', isVisible: true },
      { id: 't-a1', index: 2, type: 'audio', name: 'Synthwave Score', isMuted: false },
    ],
    clips: [
      {
        id: 'c-neon-1',
        name: 'Shinjuku Rain Alley',
        type: 'video',
        trackIndex: 0,
        startTime: 0,
        duration: 12.0,
        color: '#06b6d4',
        effect: 'Anamorphic Flare + Rain VFX',
      },
      {
        id: 'c-neon-2',
        name: 'Cyberpunk Skyline Pan',
        type: 'video',
        trackIndex: 0,
        startTime: 12.0,
        duration: 10.0,
        color: '#8b5cf6',
      },
    ],
  },
];

export function getResolutionForAspect(ratio: AspectRatioType) {
  switch (ratio) {
    case '9:16':
      return { width: 1080, height: 1920, label: '1080 x 1920 (Vertical HD)' };
    case '1:1':
      return { width: 1080, height: 1080, label: '1080 x 1080 (Square)' };
    case '4:5':
      return { width: 1080, height: 1350, label: '1080 x 1350 (Instagram Portrait)' };
    case '21:9':
      return { width: 2560, height: 1080, label: '2560 x 1080 (Cinematic Ultrawide)' };
    case '4:3':
      return { width: 1440, height: 1080, label: '1440 x 1080 (Classic Standard)' };
    case '16:9':
    default:
      return { width: 1920, height: 1080, label: '1920 x 1080 (Widescreen Full HD)' };
  }
}

export function loadRecentProjects(): WfpProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load recent projects from localStorage:', e);
  }
  return DEFAULT_SAMPLE_PROJECTS;
}

export function saveRecentProject(project: WfpProject): WfpProject[] {
  const existing = loadRecentProjects();
  const filtered = existing.filter((p) => p.id !== project.id);
  const updated = [project, ...filtered];
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save recent projects to localStorage:', e);
  }
  return updated;
}

export function deleteRecentProject(projectId: string): WfpProject[] {
  const existing = loadRecentProjects();
  const updated = existing.filter((p) => p.id !== projectId);
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete recent project from localStorage:', e);
  }
  return updated;
}

export function exportProjectToWfp(project: WfpProject): void {
  const dataString = JSON.stringify(project, null, 2);
  const blob = new Blob([dataString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = project.filename.endsWith('.wfp') ? project.filename : `${project.filename}.wfp`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function parseWfpFile(file: File): Promise<WfpProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Flexible validation to support various .wfp schemas
        const aspect = (json.aspectRatio || '16:9') as AspectRatioType;
        const res = json.resolution || getResolutionForAspect(aspect);

        const project: WfpProject = {
          format: 'WFP_JSON_V2',
          application: 'CineCraft Pro Studio',
          version: '16.0.0',
          id: json.id || `wfp_${Date.now()}`,
          name: json.name || file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name.endsWith('.wfp') ? file.name : `${file.name}.wfp`,
          aspectRatio: aspect,
          resolution: res,
          fps: Number(json.fps) || 30,
          duration: Number(json.duration) || 15.0,
          createdAt: json.createdAt || Date.now(),
          lastEdited: Date.now(),
          thumbnailUrl: json.thumbnailUrl,
          thumbnailGradient: json.thumbnailGradient || 'from-emerald-950 via-teal-950 to-zinc-900',
          sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)) || 1.2,
          tracks: Array.isArray(json.tracks) ? json.tracks : [],
          clips: Array.isArray(json.clips) ? json.clips : [],
          tags: Array.isArray(json.tags) ? json.tags : ['Imported .wfp'],
        };

        resolve(project);
      } catch (err) {
        reject(new Error(`Invalid .wfp project file format: ${err instanceof Error ? err.message : 'Parse error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsText(file);
  });
}
