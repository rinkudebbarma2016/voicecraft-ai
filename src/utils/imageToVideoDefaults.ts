import { ImageToVideoPreset, ImageToVideoAtmosphere } from '../types/imageToVideo';

// High-fidelity SVG sample images rendered as base64 data URLs for instant loading
function createSampleSvg(gradientId: string, stop1: string, stop2: string, stop3: string, title: string, subtitle: string, iconShape: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${stop1}" />
        <stop offset="50%" stop-color="${stop2}" />
        <stop offset="100%" stop-color="${stop3}" />
      </linearGradient>
      <radialGradient id="${gradientId}-glow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
      </radialGradient>
      <filter id="${gradientId}-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" result="blur" />
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#${gradientId})" />
    <rect width="100%" height="100%" fill="url(#${gradientId}-glow)" />
    
    <!-- Background Horizon & Stars/Atmosphere -->
    <circle cx="200" cy="180" r="140" fill="${stop2}" opacity="0.3" filter="url(#${gradientId}-blur)" />
    <circle cx="1080" cy="540" r="220" fill="${stop1}" opacity="0.25" filter="url(#${gradientId}-blur)" />
    
    <!-- Stylized Horizon Mesh -->
    <path d="M0,520 Q320,440 640,500 T1280,480 L1280,720 L0,720 Z" fill="#000000" opacity="0.65" />
    <path d="M0,580 Q400,520 800,560 T1280,540 L1280,720 L0,720 Z" fill="#000000" opacity="0.85" />

    <!-- Center Scenic Visual Motif -->
    ${iconShape}

    <!-- Cinematic Overlay Text -->
    <rect x="60" y="580" width="400" height="80" rx="12" fill="#09090b" opacity="0.75" />
    <text x="84" y="622" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="1">${title}</text>
    <text x="84" y="646" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#a1a1aa">${subtitle}</text>
    <text x="1140" y="680" font-family="monospace" font-size="14" font-weight="700" fill="#10b981" letter-spacing="2">4K 60FPS</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_IMAGE_PRESETS: ImageToVideoPreset[] = [
  {
    id: 'cyberpunk-city',
    title: 'Neon Cyberpunk Metropolis',
    subtitle: 'Tokyo 2088 • Holographic Rain & Flying Cabs',
    motion: 'zoom-in',
    atmosphere: 'cyber-glitch',
    prompt: 'Low-angle slow dynamic push into towering neon skyscrapers with cascading rain, flying hovercars, and holographic billboards in 4K',
    aspectRatio: '16:9',
    duration: 5,
    sampleImage: createSampleSvg(
      'cp',
      '#4c0519',
      '#be123c',
      '#06b6d4',
      'NEON CYBERPUNK CITY',
      'Dynamic 3D Camera Push • Volumetric Rain',
      `<g opacity="0.9">
        <polygon points="640,160 560,540 720,540" fill="#06b6d4" opacity="0.8" />
        <polygon points="460,240 400,560 520,560" fill="#f43f5e" opacity="0.7" />
        <polygon points="820,220 760,560 880,560" fill="#a855f7" opacity="0.7" />
        <circle cx="640" cy="220" r="45" fill="#f43f5e" />
        <line x1="200" y1="360" x2="1080" y2="360" stroke="#06b6d4" stroke-width="2" opacity="0.4" stroke-dasharray="8 8" />
      </g>`
    ),
    thumbnailGradient: 'from-pink-600 via-rose-700 to-cyan-700',
    defaultFlowVectors: [
      { id: 'cp-v1', label: 'Cascading Rain', x: 0.5, y: 0.35, dx: -0.15, dy: 0.9, speed: 1.5, intensity: 0.85, category: 'water' },
      { id: 'cp-v2', label: 'Hovercar Traffic Drift', x: 0.25, y: 0.65, dx: 0.8, dy: -0.1, speed: 1.2, intensity: 0.75, category: 'subject' },
      { id: 'cp-v3', label: 'Neon Glow Pulse', x: 0.75, y: 0.3, dx: -0.2, dy: 0.3, speed: 0.8, intensity: 0.9, category: 'light' },
    ],
  },
  {
    id: 'alpine-lake',
    title: 'Majestic Alpine Lake',
    subtitle: 'Swiss Alps • Golden Sunrise & Misty Water',
    motion: 'ambient-flow',
    atmosphere: 'god-rays',
    prompt: 'Subtle water ripples flowing toward camera with golden sunrise rays cutting through alpine pine forest and mist',
    aspectRatio: '16:9',
    duration: 8,
    sampleImage: createSampleSvg(
      'alp',
      '#064e3b',
      '#047857',
      '#38bdf8',
      'MAJESTIC ALPINE LAKE',
      'Gentle Ambient Flow • Volumetric Sunbeams',
      `<g opacity="0.9">
        <polygon points="640,180 420,520 860,520" fill="#0f766e" opacity="0.8" />
        <polygon points="340,240 180,540 500,540" fill="#065f46" opacity="0.7" />
        <polygon points="940,220 780,540 1100,540" fill="#047857" opacity="0.7" />
        <circle cx="640" cy="180" r="60" fill="#fef08a" opacity="0.85" />
      </g>`
    ),
    thumbnailGradient: 'from-emerald-700 via-teal-800 to-sky-700',
    defaultFlowVectors: [
      { id: 'alp-v1', label: 'Water Ripple Flow', x: 0.5, y: 0.7, dx: 0.0, dy: 0.7, speed: 1.1, intensity: 0.8, category: 'water' },
      { id: 'alp-v2', label: 'Golden Sunbeams', x: 0.65, y: 0.25, dx: -0.5, dy: 0.6, speed: 0.5, intensity: 0.95, category: 'light' },
      { id: 'alp-v3', label: 'Mist Elevation', x: 0.3, y: 0.5, dx: 0.3, dy: -0.4, speed: 0.6, intensity: 0.6, category: 'particles' },
    ],
  },
  {
    id: 'anime-sakura',
    title: 'Cherry Blossom Shrine',
    subtitle: 'Kyoto Hillside • Drifting Petals & Sunlight',
    motion: 'pan-right',
    atmosphere: 'sakura-petals',
    prompt: 'Smooth cinematic pan across peaceful Japanese temple garden with pink cherry blossom petals gently drifting in the breeze',
    aspectRatio: '16:9',
    duration: 5,
    sampleImage: createSampleSvg(
      'sak',
      '#581c87',
      '#c026d3',
      '#f472b6',
      'SAKURA HILLSIDE SHRINE',
      'Tracking Pan • Drifting Blossom Petals',
      `<g opacity="0.9">
        <rect x="580" y="320" width="120" height="180" rx="4" fill="#be185d" />
        <polygon points="540,320 640,240 740,320" fill="#831843" />
        <circle cx="360" cy="240" r="70" fill="#f472b6" opacity="0.7" />
        <circle cx="920" cy="260" r="85" fill="#fbcfe8" opacity="0.6" />
      </g>`
    ),
    thumbnailGradient: 'from-purple-800 via-pink-700 to-rose-500',
    defaultFlowVectors: [
      { id: 'sak-v1', label: 'Petal Breeze Drift', x: 0.45, y: 0.4, dx: 0.75, dy: 0.3, speed: 0.9, intensity: 0.8, category: 'wind' },
      { id: 'sak-v2', label: 'Shrine Camera Track', x: 0.55, y: 0.6, dx: 0.5, dy: 0.0, speed: 0.7, intensity: 0.6, category: 'camera' },
    ],
  },
  {
    id: 'deep-space',
    title: 'Interstellar Nebula Gate',
    subtitle: 'Deep Cosmos • Cosmic Dust & Orbit Drift',
    motion: 'orbit',
    atmosphere: 'dust-particles',
    prompt: 'Slow 360 degree rotational orbital drift around glowing celestial nebula core with swirling cosmic dust motes',
    aspectRatio: '16:9',
    duration: 10,
    sampleImage: createSampleSvg(
      'spc',
      '#1e1b4b',
      '#4338ca',
      '#6366f1',
      'DEEP SPACE NEBULA',
      'Orbital Rotational Drift • Cosmic Stardust',
      `<g opacity="0.9">
        <circle cx="640" cy="360" r="160" fill="#6366f1" opacity="0.4" />
        <circle cx="640" cy="360" r="90" fill="#a5b4fc" opacity="0.7" />
        <circle cx="640" cy="360" r="40" fill="#ffffff" />
        <ellipse cx="640" cy="360" rx="300" ry="80" fill="none" stroke="#818cf8" stroke-width="4" transform="rotate(-25 640 360)" />
      </g>`
    ),
    thumbnailGradient: 'from-indigo-900 via-purple-900 to-slate-900',
    defaultFlowVectors: [
      { id: 'spc-v1', label: 'Nebula Vortex Swirl', x: 0.5, y: 0.5, dx: 0.7, dy: -0.6, speed: 0.8, intensity: 0.85, category: 'particles' },
      { id: 'spc-v2', label: 'Orbital Ring Rotation', x: 0.6, y: 0.45, dx: -0.6, dy: 0.5, speed: 1.0, intensity: 0.7, category: 'camera' },
    ],
  },
  {
    id: 'golden-portrait',
    title: 'Cinematic Fashion Portrait',
    subtitle: 'Studio Golden Hour • Parallax Depth & Lens Flare',
    motion: 'dolly-zoom',
    atmosphere: 'anamorphic-flare',
    prompt: 'Dramatic vertigo dolly zoom on high fashion studio portrait with horizontal anamorphic lens flare and depth separation',
    aspectRatio: '9:16',
    duration: 5,
    sampleImage: createSampleSvg(
      'gld',
      '#451a03',
      '#b45309',
      '#f59e0b',
      'CINEMATIC PORTRAIT',
      'Dolly Zoom Vertigo • Anamorphic Flare',
      `<g opacity="0.9">
        <circle cx="640" cy="300" r="100" fill="#d97706" opacity="0.9" />
        <path d="M520,540 Q640,400 760,540 Z" fill="#92400e" />
        <line x1="100" y1="300" x2="1180" y2="300" stroke="#fbbf24" stroke-width="3" opacity="0.6" />
      </g>`
    ),
    thumbnailGradient: 'from-amber-900 via-yellow-700 to-stone-900',
    defaultFlowVectors: [
      { id: 'gld-v1', label: 'Subject Focal Lock', x: 0.5, y: 0.42, dx: 0.0, dy: -0.1, speed: 0.4, intensity: 0.9, category: 'subject' },
      { id: 'gld-v2', label: 'Anamorphic Streak Sweep', x: 0.5, y: 0.45, dx: 0.9, dy: 0.0, speed: 1.2, intensity: 0.8, category: 'light' },
    ],
  },
  {
    id: 'desert-highway',
    title: 'Vintage 35mm Desert Run',
    subtitle: 'Mojave Canyon • Dust Particles & Zoom Out',
    motion: 'zoom-out',
    atmosphere: 'embers',
    prompt: 'Wide cinematic pull out revealing classic vehicle navigating red rock canyon highway at sunset with drifting embers',
    aspectRatio: '16:9',
    duration: 6,
    sampleImage: createSampleSvg(
      'des',
      '#7c2d12',
      '#c2410c',
      '#ea580c',
      'VINTAGE DESERT 35MM',
      'Cinematic Pull Out • Atmospheric Embers',
      `<g opacity="0.9">
        <polygon points="640,540 600,420 680,420" fill="#fed7aa" />
        <line x1="640" y1="420" x2="640" y2="720" stroke="#fb923c" stroke-width="4" stroke-dasharray="16 16" />
        <circle cx="640" cy="380" r="80" fill="#f97316" opacity="0.8" />
      </g>`
    ),
    thumbnailGradient: 'from-orange-950 via-amber-800 to-red-950',
    defaultFlowVectors: [
      { id: 'des-v1', label: 'Highway Perspective Pull', x: 0.5, y: 0.6, dx: 0.0, dy: 0.8, speed: 1.0, intensity: 0.85, category: 'camera' },
      { id: 'des-v2', label: 'Canyon Wind Embers', x: 0.35, y: 0.5, dx: 0.5, dy: -0.3, speed: 0.7, intensity: 0.6, category: 'wind' },
    ],
  },
];

export const MOTION_OPTIONS: Array<{
  id: ImageToVideoPreset['motion'];
  name: string;
  badge: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'zoom-in',
    name: 'Dynamic Push In',
    badge: 'Popular',
    desc: 'Cinematic forward camera push focusing into the subject center',
    icon: '🔍',
  },
  {
    id: 'zoom-out',
    name: 'Cinematic Pull Out',
    badge: 'Dramatic',
    desc: 'Reveals environmental depth and expands the epic landscape',
    icon: '🔭',
  },
  {
    id: 'pan-right',
    name: 'Tracking Pan Right',
    badge: 'Smooth',
    desc: 'Horizontal camera slider sweep from left to right',
    icon: '➡️',
  },
  {
    id: 'pan-left',
    name: 'Tracking Pan Left',
    badge: 'Smooth',
    desc: 'Horizontal camera slider sweep from right to left',
    icon: '⬅️',
  },
  {
    id: 'tilt-up',
    name: 'Crane Tilt Up',
    badge: 'Epic',
    desc: 'Vertical camera pedestal moving upward to reveal sky/horizon',
    icon: '⬆️',
  },
  {
    id: 'tilt-down',
    name: 'Pedestal Tilt Down',
    badge: 'Reveal',
    desc: 'Moves downward from sky to reveal foreground details',
    icon: '⬇️',
  },
  {
    id: 'orbit',
    name: '360° Orbit Drift',
    badge: '3D Parallax',
    desc: 'Rotational 3D drift around the central focal anchor',
    icon: '🔄',
  },
  {
    id: 'dolly-zoom',
    name: 'Vertigo Dolly Zoom',
    badge: 'Cinema VFX',
    desc: 'Subject maintains scale while background dramatically shifts',
    icon: '🎯',
  },
  {
    id: 'ambient-flow',
    name: 'Organic Ambient Flow',
    badge: 'Natural',
    desc: 'Gentle organic breathing with water/breeze wave displacement',
    icon: '🌊',
  },
  {
    id: 'static-glamour',
    name: 'Studio Light Sweep',
    badge: 'Subtle',
    desc: 'Stable tripod perspective with sweeping light and lens flare',
    icon: '✨',
  },
];

export const ATMOSPHERE_OPTIONS: Array<{
  id: ImageToVideoAtmosphere;
  name: string;
  icon: string;
}> = [
  { id: 'none', name: 'Clean (No Particles)', icon: '🚫' },
  { id: 'embers', name: 'Floating Embers & Sparks', icon: '🔥' },
  { id: 'rain', name: 'Cinematic Rain & Streaks', icon: '🌧️' },
  { id: 'dust-particles', name: 'Micro Dust Motes & Shimmer', icon: '✨' },
  { id: 'god-rays', name: 'Volumetric Sunbeams / God Rays', icon: '☀️' },
  { id: 'sakura-petals', name: 'Drifting Sakura Petals', icon: '🌸' },
  { id: 'cyber-glitch', name: 'Cyberpunk Scanlines & Glitch', icon: '⚡' },
  { id: 'anamorphic-flare', name: 'Anamorphic Blue Lens Flare', icon: '🎬' },
];

export const TRANSITION_OPTIONS = [
  { id: 'cross-dissolve', label: 'Cross Dissolve', icon: '✨' },
  { id: 'fade-black', label: 'Fade Through Black', icon: '🌑' },
  { id: 'slide-left', label: 'Slide Left', icon: '⏩' },
  { id: 'zoom-in', label: 'Zoom Transition', icon: '🔍' },
  { id: 'cut', label: 'Hard Cut', icon: '✂️' },
] as const;

export const DEFAULT_STORYBOARD_SCENES: import('../types/imageToVideo').StoryboardScene[] = [
  {
    id: 'scene-1',
    title: 'The Vision & Challenge',
    image: SAMPLE_IMAGE_PRESETS[0].sampleImage,
    imageName: SAMPLE_IMAGE_PRESETS[0].title,
    prompt: SAMPLE_IMAGE_PRESETS[0].prompt,
    narrationScript: 'In an era where technology moves at breakneck speed, teams need a smarter way to craft stories and communicate vision.',
    motion: 'zoom-in',
    atmosphere: 'cyber-glitch',
    duration: 5,
    transition: 'cross-dissolve',
    lowerThird: {
      enabled: true,
      headline: 'NEXT GENERATION AI VIDEO',
      subheadline: 'Multi-scene sequencing & smart teleprompter',
      position: 'bottom-left',
    },
  },
  {
    id: 'scene-2',
    title: 'Breakthrough Solution',
    image: SAMPLE_IMAGE_PRESETS[1].sampleImage,
    imageName: SAMPLE_IMAGE_PRESETS[1].title,
    prompt: SAMPLE_IMAGE_PRESETS[1].prompt,
    narrationScript: 'Introducing automated prompt-to-storyboard generation, giving every creator instant presentation power.',
    motion: 'pan-right',
    atmosphere: 'god-rays',
    duration: 5,
    transition: 'slide-left',
    lowerThird: {
      enabled: true,
      headline: 'STORYBOARD DIRECTOR',
      subheadline: 'Full creative control per scene',
      position: 'bottom-left',
    },
  },
  {
    id: 'scene-3',
    title: 'Global Impact & Call to Action',
    image: SAMPLE_IMAGE_PRESETS[2].sampleImage,
    imageName: SAMPLE_IMAGE_PRESETS[2].title,
    prompt: SAMPLE_IMAGE_PRESETS[2].prompt,
    narrationScript: 'From team pitches to social reels, transform raw ideas into studio-grade video presentations in seconds.',
    motion: 'orbit',
    atmosphere: 'embers',
    duration: 6,
    transition: 'fade-black',
    lowerThird: {
      enabled: true,
      headline: 'CREATE WITHOUT LIMITS',
      subheadline: 'Start building your next presentation today',
      position: 'center',
    },
  },
];

export const VIDS_TEMPLATES: import('../types/imageToVideo').VidsTemplatePreset[] = [
  {
    id: 'product-pitch',
    title: 'Product Launch & Feature Pitch',
    category: 'Marketing',
    description: '3-scene high energy walkthrough highlighting customer problem, core solution, and launch call to action.',
    badge: 'MOST POPULAR',
    aspectRatio: '16:9',
    scenes: DEFAULT_STORYBOARD_SCENES,
  },
  {
    id: 'executive-update',
    title: 'Executive Briefing & Quarterly Review',
    category: 'Corporate',
    description: 'Clean professional presentation with executive summary, milestone metrics, and forward-looking roadmap.',
    badge: 'EXECUTIVE',
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'exec-1',
        title: 'Executive Summary',
        image: SAMPLE_IMAGE_PRESETS[3].sampleImage,
        imageName: 'Deep Space Horizon',
        prompt: 'Clean modern corporate background with subtle depth and ambient particles',
        narrationScript: 'Welcome everyone. Today we are reviewing our quarterly milestones and strategic direction for Q4.',
        motion: 'zoom-in',
        atmosphere: 'dust-particles',
        duration: 5,
        transition: 'cross-dissolve',
        lowerThird: {
          enabled: true,
          headline: 'Q4 EXECUTIVE BRIEFING',
          subheadline: 'Key Milestones & Growth Trajectory',
          position: 'bottom-left',
        },
      },
      {
        id: 'exec-2',
        title: 'Performance & Revenue',
        image: SAMPLE_IMAGE_PRESETS[1].sampleImage,
        imageName: 'Emerald Forest',
        prompt: 'Cinematic glowing data streams and uplifting morning horizon',
        narrationScript: 'We achieved 140% YoY expansion, driven by widespread adoption of automated content pipelines.',
        motion: 'tilt-up',
        atmosphere: 'god-rays',
        duration: 5,
        transition: 'slide-left',
        lowerThird: {
          enabled: true,
          headline: '+140% YEAR-OVER-YEAR',
          subheadline: 'Rapid adoption across enterprise teams',
          position: 'bottom-left',
        },
      },
      {
        id: 'exec-3',
        title: 'Next Horizon Roadmap',
        image: SAMPLE_IMAGE_PRESETS[4].sampleImage,
        imageName: 'Quantum AI Core',
        prompt: 'Futuristic geometric neural core with pulsating energy rings',
        narrationScript: 'Thank you for your tireless dedication. Let us review the primary objectives for the upcoming quarter.',
        motion: 'orbit',
        atmosphere: 'cyber-glitch',
        duration: 5,
        transition: 'fade-black',
        lowerThird: {
          enabled: true,
          headline: 'THE ROAD AHEAD',
          subheadline: 'Accelerating into next quarter',
          position: 'center',
        },
      },
    ],
  },
  {
    id: 'social-short',
    title: 'Viral Social Short & TikTok Reel',
    category: 'Social Media',
    description: 'Fast-paced vertical 9:16 format designed to hook viewers in the first 2 seconds.',
    badge: '9:16 VERTICAL',
    aspectRatio: '9:16',
    scenes: [
      {
        id: 'short-1',
        title: 'The Hook',
        image: SAMPLE_IMAGE_PRESETS[0].sampleImage,
        imageName: 'Cyberpunk Metropolis',
        prompt: 'Fast push into neon rain with vibrant colors',
        narrationScript: 'Stop scrolling! Here is the AI tool that is replacing entire video editing setups.',
        motion: 'dolly-zoom',
        atmosphere: 'cyber-glitch',
        duration: 3,
        transition: 'zoom-in',
        lowerThird: {
          enabled: true,
          headline: 'WAIT FOR THIS...',
          subheadline: 'The secret workflow you need to know',
          position: 'top-banner',
        },
      },
      {
        id: 'short-2',
        title: 'The Reveal',
        image: SAMPLE_IMAGE_PRESETS[4].sampleImage,
        imageName: 'Quantum AI Core',
        prompt: 'Dynamic orbit around glowing quantum computer',
        narrationScript: 'You can type a single sentence, and it generates the entire storyboard, script, and camera angles automatically.',
        motion: 'orbit',
        atmosphere: 'embers',
        duration: 4,
        transition: 'slide-left',
        lowerThird: {
          enabled: true,
          headline: 'ONE-CLICK STORYBOARDS',
          subheadline: 'Auto script + video sequencing',
          position: 'bottom-left',
        },
      },
      {
        id: 'short-3',
        title: 'Call to Action',
        image: SAMPLE_IMAGE_PRESETS[1].sampleImage,
        imageName: 'Emerald Waterfall',
        prompt: 'Wide sweeping landscape with golden sunlight',
        narrationScript: 'Save this post right now and try it for free on your next project!',
        motion: 'pan-left',
        atmosphere: 'god-rays',
        duration: 3,
        transition: 'fade-black',
        lowerThird: {
          enabled: true,
          headline: 'TAP SAVE & TRY IT',
          subheadline: 'Link in bio for instant access',
          position: 'center',
        },
      },
    ],
  },
];

