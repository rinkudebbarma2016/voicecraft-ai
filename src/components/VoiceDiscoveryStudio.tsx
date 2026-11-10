import React, { useState, useEffect, useRef } from 'react';
import {
  NeuralSpeaker,
  VoiceCategory,
  VoiceSettings,
  ClonedVoice,
  GeneratedAudio,
} from '../types/tts';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import { WebSpeechHelper, base64ToAudioUrl } from '../utils/audio';
import {
  Search,
  Sliders,
  Check,
  User,
  Radio,
  Play,
  Pause,
  Plus,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Volume2,
  Download,
  Sparkles,
  Info,
  X,
  Mic,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
  Languages,
  Headphones,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface VoiceDiscoveryStudioProps {
  selectedSpeaker: NeuralSpeaker;
  onSelectSpeaker: (speaker: NeuralSpeaker) => void;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  clonedVoices?: ClonedVoice[];
  onAudioGenerated?: (audio: GeneratedAudio) => void;
  onNavigateTab?: (tab: 'solo' | 'dialogue' | 'video' | 'batch' | 'clone' | 'chat') => void;
}

const LANGUAGES = [
  'All Languages',
  'Hindi',
  'English (Indian)',
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
];

const CATEGORIES: Array<{ id: VoiceCategory; label: string; icon: string }> = [
  { id: 'All', label: 'All Voices', icon: '✨' },
  { id: 'Conversational', label: 'Conversational', icon: '💬' },
  { id: 'Narration', label: 'Narration', icon: '📖' },
  { id: 'Characters', label: 'Characters', icon: '🎭' },
  { id: 'Social Media', label: 'Social Media', icon: '📱' },
  { id: 'Educational', label: 'Educational', icon: '🎓' },
  { id: 'Advertisement', label: 'Advertisement', icon: '📢' },
  { id: 'Entertainment', label: 'Entertainment', icon: '🍿' },
];

export const VoiceDiscoveryStudio: React.FC<VoiceDiscoveryStudioProps> = ({
  selectedSpeaker,
  onSelectSpeaker,
  voiceSettings,
  onVoiceSettingsChange,
  clonedVoices = [],
  onAudioGenerated,
  onNavigateTab,
}) => {
  // Navigation tabs: Explore vs My Voices
  const [activeTab, setActiveTab] = useState<'explore' | 'my-voices'>('explore');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory>('All');
  const [selectedGender, setSelectedGender] = useState<'All' | 'Female' | 'Male'>('All');
  const [selectedAge, setSelectedAge] = useState<'All' | 'Young' | 'Middle Aged' | 'Mature'>('All');

  // Favorites / Saved Voices
  const [savedVoiceIds, setSavedVoiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voicecraft_saved_voices') || localStorage.getItem('voxstudio_saved_voices');
      return saved ? JSON.parse(saved) : ['ashish', 'vikrant', 'monika_sogam', 'priya'];
    } catch {
      return ['ashish', 'vikrant', 'monika_sogam', 'priya'];
    }
  });

  // Docked Preview Player State
  const [previewSpeaker, setPreviewSpeaker] = useState<NeuralSpeaker>(selectedSpeaker);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewText, setPreviewText] = useState(
    'Welcome to our next-generation neural voice catalog. Real-time pitch, cadence, and emotion.'
  );
  const [isGeneratingCustomPreview, setIsGeneratingCustomPreview] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  // Settings Panel
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [detailsSpeaker, setDetailsSpeaker] = useState<NeuralSpeaker | null>(null);

  const previewAudioElRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  // Toggle favorite
  const toggleSaveVoice = (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    setSavedVoiceIds((prev) => {
      const exists = prev.includes(voiceId);
      const updated = exists ? prev.filter((id) => id !== voiceId) : [...prev, voiceId];
      try {
        localStorage.setItem('voicecraft_saved_voices', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favorites:', err);
      }
      return updated;
    });
  };

  // Convert cloned voices to NeuralSpeaker items
  const clonedSpeakers: NeuralSpeaker[] = clonedVoices.map((c) => ({
    id: c.id,
    name: c.name,
    gender: c.gender === 'Female' ? 'Female' : 'Male',
    accent: c.accent,
    flag: c.flag,
    language: c.accent.includes('Hindi') ? 'Hindi' : 'English (Indian)',
    age: 'Young',
    category: c.accent.includes('Indian') ? 'Indian English' : 'Conversational',
    useCase: `AI Cloned Voice (${c.timbreProfile?.timbreType || 'Resonant'})`,
    description: c.description || `AI Cloned Profile • ${c.timbreProfile?.pitchHz || 140} Hz`,
    avatarGradient: 'from-pink-500 via-purple-600 to-indigo-600',
    baseVoice: c.baseVoice,
    stylePrompt: c.stylePrompt,
    samplePhrase: 'Hello! This is my cloned AI voice synthesized with neural timbre vectors.',
    tags: ['AI Clone', ...(c.tags || [])],
    usageCount: '1.2K',
    badgeVerified: true,
    yearsActive: 'New',
  }));

  const allVoices: NeuralSpeaker[] = [...clonedSpeakers, ...NEURAL_SPEAKERS];

  // Filtered voice list
  const filteredVoices = allVoices.filter((v) => {
    // My Voices Tab filter
    if (activeTab === 'my-voices') {
      const isSaved = savedVoiceIds.includes(v.id);
      const isCustomClone = clonedVoices.some((c) => c.id === v.id);
      if (!isSaved && !isCustomClone) return false;
    }

    // Language filter
    if (selectedLanguage !== 'All Languages') {
      if (selectedLanguage === 'Hindi' && v.language !== 'Hindi' && !v.accent.includes('Hindi')) {
        return false;
      }
      if (selectedLanguage.includes('Indian') && !v.accent.includes('Indian') && v.language !== 'English (Indian)') {
        return false;
      }
      if (selectedLanguage.includes('US') && !v.accent.includes('American') && !v.accent.includes('US')) {
        return false;
      }
      if (selectedLanguage.includes('UK') && !v.accent.includes('British') && !v.accent.includes('UK')) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'All') {
      if (v.category !== selectedCategory && !v.tags.includes(selectedCategory)) {
        return false;
      }
    }

    // Gender filter
    if (selectedGender !== 'All' && v.gender !== selectedGender) {
      return false;
    }

    // Age filter
    if (selectedAge !== 'All' && v.age !== selectedAge) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchDesc = v.description.toLowerCase().includes(q);
      const matchAccent = v.accent.toLowerCase().includes(q);
      const matchTags = v.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchAccent && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // Play voice sample
  const handlePlayVoiceSample = (e: React.MouseEvent, speaker: NeuralSpeaker) => {
    e.stopPropagation();
    setPreviewSpeaker(speaker);

    if (isPlayingPreview && previewSpeaker.id === speaker.id) {
      WebSpeechHelper.stop();
      if (previewAudioElRef.current) previewAudioElRef.current.pause();
      setIsPlayingPreview(false);
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      return;
    }

    setIsPlayingPreview(true);
    setPreviewTime(0);

    // Speak sample phrase
    const pitch = speaker.gender === 'Female' ? 1.1 : 0.95;
    WebSpeechHelper.speak(
      speaker.samplePhrase,
      null,
      1.0,
      pitch,
      1.0,
      () => {
        setIsPlayingPreview(false);
        if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      }
    );

    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    previewTimerRef.current = window.setInterval(() => {
      setPreviewTime((prev) => (prev >= 13 ? 0 : prev + 1));
    }, 1000);
  };

  // Synthesize custom inline preview text via backend TTS
  const handleGenerateCustomPreview = async () => {
    if (!previewText.trim()) return;
    try {
      setIsGeneratingCustomPreview(true);
      const res = await fetch('/api/tts/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText.trim(),
          voice: previewSpeaker.baseVoice,
          style: previewSpeaker.stylePrompt,
          accent: previewSpeaker.accent.includes('Indian') ? 'en-IN' : 'en-US',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to preview');
      }

      const url = base64ToAudioUrl(data.audioBase64);
      setCustomAudioUrl(url);

      if (previewAudioElRef.current) {
        previewAudioElRef.current.pause();
      }
      const el = new Audio(url);
      previewAudioElRef.current = el;
      el.onplay = () => setIsPlayingPreview(true);
      el.onpause = () => setIsPlayingPreview(false);
      el.onended = () => setIsPlayingPreview(false);
      el.play().catch(() => setIsPlayingPreview(false));

      // Pass up to player if handler exists
      if (onAudioGenerated) {
        onAudioGenerated({
          id: `preview_${Date.now()}`,
          title: `${previewSpeaker.name} (Live Preview)`,
          text: previewText,
          audioBase64: data.audioBase64,
          audioUrl: url,
          voice: previewSpeaker.baseVoice,
          speakerName: previewSpeaker.name,
          mode: 'solo',
          timestamp: Date.now(),
          duration: 5,
        });
      }
    } catch (err) {
      console.warn('Custom preview synthesis error:', err);
      // Fallback to Web Speech
      const pitch = previewSpeaker.gender === 'Female' ? 1.1 : 0.95;
      WebSpeechHelper.speak(
        previewText,
        null,
        1.0,
        pitch,
        1.0,
        () => setIsPlayingPreview(false)
      );
      setIsPlayingPreview(true);
    } finally {
      setIsGeneratingCustomPreview(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-28 animate-fadeIn">
      {/* Omni Creative Suite Bar (Image 2) */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            What would you like to create?
          </h2>
          <p className="text-xs text-zinc-400">
            Select a neural voice, prompt your video script, or launch any creative tool below.
          </p>
        </div>

        {/* Central Omni Input Bar */}
        <div className="max-w-2xl mx-auto relative flex items-center bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 shadow-inner focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40 transition-all">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-bold shrink-0 mr-2 shadow-sm">
            +
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voices by name, accent, character, or role (e.g. 'Ashish', 'Monika', 'Cricket', 'Storyteller')..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-zinc-400 hover:text-white mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase mr-2 hidden sm:inline">
            v4 Neural
          </span>
          <button
            onClick={() => onNavigateTab && onNavigateTab('chat')}
            className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer"
            title="Launch AI Director Chat"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Creative Action Service Badges (Image 2) */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap pt-1 text-xs">
          <button
            onClick={() => onNavigateTab && onNavigateTab('solo')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-500/20 transition-all shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Speech</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('clone')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-pink-500/20 transition-all shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Voice Clone</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('video')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all shadow-sm">
              <VideoIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Video Studio</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('batch')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Batch Queue</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('dialogue')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500/20 transition-all shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Dubbing & Dialogue</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('chat')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[11px]">Audiobooks</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Image 1: Filter Sidebar on Left, Voice List on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl h-fit">
          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-purple-400" />
              <span>Language</span>
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Categories Filter (Image 1: Conversational, Narration, Characters, Social Media, etc.) */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-400" />
                <span>Categories</span>
              </span>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                  {selectedCategory === cat.id && (
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-1.5 border-t border-zinc-800/80 pt-4">
            <label className="text-xs font-bold text-zinc-300">Gender</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['All', 'Female', 'Male'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors cursor-pointer ${
                    selectedGender === g
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age Filter */}
          <div className="space-y-1.5 border-t border-zinc-800/80 pt-4">
            <label className="text-xs font-bold text-zinc-300">Age</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['All', 'Young', 'Middle Aged', 'Mature'] as const).map((age) => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                    selectedAge === age
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Stability & Clarity Slider Trigger */}
          <div className="border-t border-zinc-800/80 pt-4">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Fine-Tune Sliders</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSettingsPanel ? 'rotate-180' : ''}`} />
            </button>

            {showSettingsPanel && (
              <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Stability</span>
                    <span className="font-mono text-purple-300">{voiceSettings.stability}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={voiceSettings.stability}
                    onChange={(e) =>
                      onVoiceSettingsChange({ ...voiceSettings, stability: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Clarity & Similarity</span>
                    <span className="font-mono text-pink-300">{voiceSettings.clarity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={voiceSettings.clarity}
                    onChange={(e) =>
                      onVoiceSettingsChange({ ...voiceSettings, clarity: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Top Bar Tabs (Explore vs My Voices), Search, and Voice Cards */}
        <section className="lg:col-span-9 space-y-4">
          {/* Top Bar with Explore / My Voices and Search (Image 1) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-2 sm:p-2.5 rounded-2xl border border-zinc-800 shadow-md">
            {/* Explore vs My Voices Tabs */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab('my-voices')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'my-voices'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>My voices</span>
                <span className="px-1.5 py-0.2 bg-zinc-800 rounded-full text-[10px] text-zinc-300">
                  {savedVoiceIds.length + clonedVoices.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voices..."
                className="w-full pl-9 pr-8 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Voice Cards List (Image 1 layout) */}
          <div className="space-y-2">
            {filteredVoices.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                <User className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-300">No voices match your filters</h4>
                <p className="text-xs text-zinc-500">
                  Try clearing your search query or selecting "All Languages" and "All Categories".
                </p>
              </div>
            ) : (
              filteredVoices.map((speaker) => {
                const isSelected = selectedSpeaker.id === speaker.id;
                const isPlaying = isPlayingPreview && previewSpeaker.id === speaker.id;
                const isSaved = savedVoiceIds.includes(speaker.id);

                return (
                  <div
                    key={speaker.id}
                    onClick={() => {
                      onSelectSpeaker(speaker);
                      setPreviewSpeaker(speaker);
                    }}
                    className={`group p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/70 shadow-lg ring-1 ring-purple-500/30'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    {/* Left: Avatar, Name, Accent & Stats */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Play Button or Avatar */}
                      <button
                        type="button"
                        onClick={(e) => handlePlayVoiceSample(e, speaker)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer relative overflow-hidden bg-gradient-to-tr ${speaker.avatarGradient}`}
                        title={isPlaying ? 'Pause Sample' : 'Play Sample Audio'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-current animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        )}
                        {speaker.badgeVerified && (
                          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-[7px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>

                      {/* Info & Badges */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-purple-300 transition-colors">
                            {speaker.name}
                          </h4>
                          {speaker.badgeVerified && (
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {speaker.flag} {speaker.accent}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-1 italic max-w-xl">
                          "{speaker.samplePhrase}"
                        </p>

                        {/* Metadata Pills: Years Active & Usage Count (Image 1) */}
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-zinc-500 font-mono">
                          {speaker.yearsActive && <span>{speaker.yearsActive}</span>}
                          {speaker.usageCount && (
                            <span className="flex items-center gap-0.5 text-zinc-400">
                              <span>👥</span>
                              <span>{speaker.usageCount}</span>
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {speaker.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons (Use, Add, Details) */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* "+ Add" / Saved toggle (Image 1) */}
                      <button
                        type="button"
                        onClick={(e) => toggleSaveVoice(e, speaker.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                        title={isSaved ? 'Remove from My voices' : 'Add to My voices'}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px]">Saved</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Add</span>
                          </>
                        )}
                      </button>

                      {/* "Use" Primary Button (Image 1) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSpeaker(speaker);
                          setPreviewSpeaker(speaker);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                            : 'bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-200'
                        }`}
                      >
                        {isSelected ? 'Active Voice' : 'Use'}
                      </button>

                      {/* Info Tooltip Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsSpeaker(speaker);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        title="Voice Details & Acoustic Specs"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Bottom Docked Live Voice Player & Immediate Preview Deck (Image 1) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-4 sm:px-8 py-2.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Active Voice & Timecode */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={(e) => handlePlayVoiceSample(e, previewSpeaker)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow bg-gradient-to-tr ${previewSpeaker.avatarGradient}`}
          >
            {isPlayingPreview ? (
              <Pause className="w-4 h-4 text-white fill-current animate-pulse" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate max-w-[200px] sm:max-w-xs">
                {previewSpeaker.name}
              </span>
              <span className="w-3 h-3 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-[7px] font-bold">
                ✓
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span>0:{previewTime < 10 ? `0${previewTime}` : previewTime} / 0:13</span>
              <span>•</span>
              <span className="text-purple-300">{previewSpeaker.accent}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Inline Preview Text Input (Image 1) */}
        <div className="flex items-center gap-2 flex-1 max-w-xl w-full">
          <div className="relative flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-inner">
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Enter text to preview..."
              className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerateCustomPreview}
            disabled={isGeneratingCustomPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Generate custom preview audio for this voice"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Right: Quick Use & Download */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectSpeaker(previewSpeaker)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Apply Voice
          </button>
        </div>
      </div>

      {/* Voice Details Modal */}
      {detailsSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${detailsSpeaker.avatarGradient} text-xl shadow-md`}>
                  {detailsSpeaker.flag}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{detailsSpeaker.name}</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-[8px] font-bold">
                      ✓
                    </span>
                  </h4>
                  <p className="text-xs text-purple-300">{detailsSpeaker.accent}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsSpeaker(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Use Case</span>
                <p className="text-zinc-200 font-medium mt-0.5">{detailsSpeaker.useCase}</p>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Description</span>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">{detailsSpeaker.description}</p>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Neural Prompt Directive</span>
                <p className="text-zinc-400 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 mt-0.5">
                  "{detailsSpeaker.stylePrompt}"
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {detailsSpeaker.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  onSelectSpeaker(detailsSpeaker);
                  setDetailsSpeaker(null);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Select {detailsSpeaker.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
