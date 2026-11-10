import { VoiceOption, ScriptPreset, AccentOption } from '../types/tts';

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    code: 'en-IN',
    label: 'Indian English (Natural)',
    flag: '🇮🇳',
    region: 'India',
    description: 'Authentic Indian English cadence, warm inflection, and articulate phrasing',
  },
  {
    code: 'en-IN-tech',
    label: 'Indian English (Tech & Business)',
    flag: '🇮🇳',
    region: 'India',
    description: 'Crisp, confident Bangalore/Hyderabad corporate and engineering presentation style',
  },
  {
    code: 'en-IN-story',
    label: 'Indian English (Storyteller)',
    flag: '🇮🇳',
    region: 'India',
    description: 'Expressive and melodic Indian English narration for literature, folklore, and drama',
  },
  {
    code: 'en-US',
    label: 'American English',
    flag: '🇺🇸',
    region: 'North America',
    description: 'Standard General American accent with clear, modern projection',
  },
  {
    code: 'en-GB',
    label: 'British English',
    flag: '🇬🇧',
    region: 'United Kingdom',
    description: 'Refined Received Pronunciation with poised, classical delivery',
  },
  {
    code: 'en-AU',
    label: 'Australian English',
    flag: '🇦🇺',
    region: 'Australia',
    description: 'Friendly, warm, and natural conversational Australian intonation',
  },
  {
    code: 'global',
    label: 'Neutral Global',
    flag: '🌍',
    region: 'International',
    description: 'Balanced, accent-neutral international English delivery',
  },
];

export const VOICES: VoiceOption[] = [
  {
    name: 'Kore',
    displayName: 'Kore',
    gender: 'Female',
    tone: 'Firm & Articulate',
    description: 'Polished, clear, and balanced narrative voice. Ideal for audiobooks, documentaries, and news.',
    avatarColor: 'from-amber-500 to-rose-500',
    sampleText: 'Welcome to VoiceCraft AI. Let us transform your written ideas into living, expressive voiceovers.',
  },
  {
    name: 'Puck',
    displayName: 'Puck',
    gender: 'Male',
    tone: 'Lively & Youthful',
    description: 'High energy, enthusiastic, and bright. Perfect for commercials, explainers, and gaming content.',
    avatarColor: 'from-emerald-400 to-teal-600',
    sampleText: 'Hey everyone! Check this out, this brand new engine sounds so crisp and natural!',
  },
  {
    name: 'Fenrir',
    displayName: 'Fenrir',
    gender: 'Male',
    tone: 'Deep & Cinematic',
    description: 'Rich low-end timbre with commanding gravitas. Ideal for movie trailers, epic stories, and keynotes.',
    avatarColor: 'from-indigo-600 to-purple-800',
    sampleText: 'In a world where intelligence meets voice, silence is no longer an option.',
  },
  {
    name: 'Charon',
    displayName: 'Charon',
    gender: 'Male',
    tone: 'Calm & Thoughtful',
    description: 'Measured, contemplative, and soothing. Excellent for meditation, educational lectures, and essays.',
    avatarColor: 'from-blue-500 to-cyan-600',
    sampleText: 'Take a slow, deep breath. Focus your thoughts on the quiet stillness of the horizon.',
  },
  {
    name: 'Zephyr',
    displayName: 'Zephyr',
    gender: 'Female',
    tone: 'Gentle & Conversational',
    description: 'Warm, approachable, and friendly. Great for customer assistance, podcasts, and casual dialogue.',
    avatarColor: 'from-fuchsia-500 to-pink-600',
    sampleText: 'Hi there! I am happy to guide you through your day. What should we explore next?',
  },
];

export const STYLE_PRESETS = [
  {
    id: 'natural-narrator',
    label: 'Audiobook Narrator',
    style: 'Warm, engaging, and measured audiobook narrator with natural breathing',
    badge: 'Classic',
  },
  {
    id: 'cinematic-trailer',
    label: 'Cinematic Movie Trailer',
    style: 'Deep, dramatic, and intensely suspenseful epic movie trailer voiceover',
    badge: 'Epic',
  },
  {
    id: 'energetic-commercial',
    label: 'Energetic Commercial',
    style: 'Fast-paced, vibrant, upbeat, and charismatic commercial promoter',
    badge: 'Promo',
  },
  {
    id: 'meditation-guide',
    label: 'Mindfulness Meditation',
    style: 'Soft, whisper-soft, gentle, calming, and serene meditation instructor',
    badge: 'Calm',
  },
  {
    id: 'breaking-news',
    label: 'News Anchor',
    style: 'Crisp, urgent, formal, and authoritative broadcast television anchor',
    badge: 'Broadcast',
  },
  {
    id: 'tech-keynote',
    label: 'Executive Keynote',
    style: 'Confident, inspiring, forward-looking, and articulate visionary keynote speaker',
    badge: 'Tech',
  },
];

export const SCRIPT_PRESETS: ScriptPreset[] = [
  {
    id: 'india-upi-fintech',
    title: "🇮🇳 India's Unified Payments Interface Revolution",
    category: 'Indian English',
    recommendedVoice: 'Kore',
    accent: 'en-IN-tech',
    style: 'Clear, enthusiastic, articulate Indian tech presentation',
    text: "India's Unified Payments Interface, widely known as UPI, has revolutionized real-time retail payments across the entire nation. From bustling street vendors in Bengaluru to small mom-and-pop stores in rural villages, instant QR-code transactions now process over ten billion payment transfers each month. It represents one of the world's most successful public digital infrastructures, combining biometric authentication with open banking protocols to empower millions of citizens.",
  },
  {
    id: 'panchatantra-fable',
    title: '🇮🇳 The Panchatantra: The Loyal Mongoose',
    category: 'Indian English',
    recommendedVoice: 'Charon',
    accent: 'en-IN-story',
    style: 'Warm, rhythmic, expressive Indian storyteller with dramatic cadence',
    text: 'Long ago in ancient India, there lived a loving family who cared for a gentle mongoose as if he were their own child. One sunny afternoon, while the family was away in the mustard fields, a venomous black cobra slithered silently toward the infant cradle. With fierce courage, the brave mongoose defended the child and saved his life, proving that true loyalty knows no boundaries of speech or origin.',
  },
  {
    id: 'long-essay-cosmos',
    title: '📖 Unlimited Words Demo: The Grand Architecture of the Cosmos (Long Essay)',
    category: 'Story',
    recommendedVoice: 'Fenrir',
    accent: 'en-IN',
    style: 'Deep, contemplative, epic documentary narration with natural cadence',
    text: `Look up at the night sky on a clear evening, far away from city lights, and you are gazing directly into deep time. Every photon of starlight that strikes your eye began its silent journey across the cosmos millions, or even billions, of years ago. Our Milky Way galaxy is merely one sprawling spiral city of stars among at least two trillion galaxies scattered throughout the observable universe.

Within these swirling cosmic oceans, heavy elements such as carbon, nitrogen, oxygen, and iron are forged in the scorching thermonuclear hearts of dying giant stars. When these massive stars exhaust their fuel, they collapse and violently explode in luminous supernovae, scattering their enriched matter across interstellar nebulae. Over hundreds of millions of years, gravity patiently pulls these dusty molecular clouds together to condense into second-generation suns, orbiting rocky planets, and swirling liquid oceans.

In a very literal, astrophysical sense, every atom in your left hand came from a star, and the atoms in your right hand may well have originated in another. We are not separate from the universe examining it from the outside; we are the universe waking up and examining itself. As our space telescopes peer deeper into the cosmic dawn, we find ancient galaxies shining only three hundred million years after the Big Bang, defying our simplest models and beckoning us forward into the next frontier of human curiosity.`,
  },
  {
    id: 'super-product',
    title: 'Next-Gen Acoustic Headphones Promo',
    category: 'Commercial',
    recommendedVoice: 'Puck',
    accent: 'en-US',
    style: 'Enthusiastic, fast, stylish tech commercial voiceover',
    text: 'Meet the all-new AeroSound Pulse. Custom titanium drivers. 48-hour ultra battery life. And noise cancellation so immersive, the rest of the world simply fades away. Hear everything. Feel everything.',
  },
  {
    id: 'calm-morning',
    title: 'Morning Forest Walk Meditation',
    category: 'Meditation',
    recommendedVoice: 'Zephyr',
    accent: 'en-IN',
    style: 'Gentle, soothing, rhythmic, calm breathing meditation guide',
    text: 'Close your eyes. Picture morning sunlight gently filtering through tall pine branches. The cool forest breeze touches your skin. Inhale fresh, clean air for four counts... hold... and release.',
  },
  {
    id: 'tech-architecture',
    title: 'Distributed Systems & Latency',
    category: 'Technical',
    recommendedVoice: 'Kore',
    accent: 'en-IN-tech',
    style: 'Clear, authoritative, and articulate software engineering lecturer',
    text: 'In distributed computing, network latency is not a constant; it is a probability distribution. When designing consensus algorithms across geo-replicated clusters, minimizing round-trip handshakes is paramount for throughput.',
  },
  {
    id: 'pronunciation-tech-demo',
    title: 'Cloud DevOps & Names (Phonetics Demo)',
    category: 'Technical',
    recommendedVoice: 'Kore',
    accent: 'en-IN-tech',
    style: 'Articulate tech keynote speaker, confident and crisp',
    text: 'Welcome to the engineering briefing with lead architect Debbarma in Bengaluru. Today we are migrating our SaaS platform to Kubernetes and PostgreSQL, configuring reverse proxies via Nginx, and securing our API with OAuth and JWT tokens.',
  },
];

export const DIALOGUE_PRESETS = [
  {
    title: "🇮🇳 Bengaluru Startup Tech Debrief",
    voiceA: 'Puck' as const,
    voiceB: 'Kore' as const,
    accentA: 'en-IN-tech' as const,
    accentB: 'en-IN-tech' as const,
    lines: [
      {
        id: '1',
        speaker: 'Speaker A' as const,
        speakerLabel: 'Rohan (Tech Lead)',
        text: 'Did you check the new microservice latency after the deployment? <gasp> The P99 dropped straight down to twelve milliseconds!',
        style: 'Excited Indian tech engineer, rapid and enthusiastic',
      },
      {
        id: '2',
        speaker: 'Speaker B' as const,
        speakerLabel: 'Pooja (Principal Architect)',
        text: "Arre that's fantastic Rohan! |yeah| But did you stress-test the database connection pooling under Diwali peak load?",
        style: 'Insightful, articulate Indian software architect, confident and smiling',
      },
      {
        id: '3',
        speaker: 'Speaker A' as const,
        speakerLabel: 'Rohan',
        text: 'Yes absolutely! |mhm|, <laugh> we simulated five million concurrent checkouts and the cluster remained completely rock solid!',
        style: 'Delighted and proud, natural laughter',
      },
      {
        id: '4',
        speaker: 'Speaker B' as const,
        speakerLabel: 'Pooja',
        text: '<breath> Brilliant work team. Chai is definitely on me today!',
        style: 'Warm, joyful celebration tone',
      },
    ],
  },
  {
    title: 'The AI Breakthrough Debate',
    voiceA: 'Puck' as const,
    voiceB: 'Kore' as const,
    accentA: 'en-US' as const,
    accentB: 'en-IN' as const,
    lines: [
      {
        id: '1',
        speaker: 'Speaker A' as const,
        speakerLabel: 'Alex (Tech Founder)',
        text: 'Did you see the latest speech benchmarks? <gasp> The latency dropped below one hundred milliseconds!',
        style: 'Excited, rapid, enthusiastic tech founder',
      },
      {
        id: '2',
        speaker: 'Speaker B' as const,
        speakerLabel: 'Elena (Research Scientist)',
        text: "That's impressive, |yeah| but what about nuanced conversational prosody and natural pauses?",
        style: 'Thoughtful, articulate, analytical research scientist with Indian English accent',
      },
      {
        id: '3',
        speaker: 'Speaker A' as const,
        speakerLabel: 'Alex',
        text: 'It handles backchanneling naturally! Listen: |mhm|, <laugh> it even laughs when making a witty remark!',
        style: 'Delighted, laughing casually',
      },
      {
        id: '4',
        speaker: 'Speaker B' as const,
        speakerLabel: 'Elena',
        text: '<breath> Alright, I admit it. We are officially living in the future.',
        style: 'Satisfied, warm, and smiling tone',
      },
    ],
  },
];
