/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, AppTabType } from './components/Header';
import { SoloTTS } from './components/SoloTTS';
import { DialogueTTS } from './components/DialogueTTS';
import { BatchQueueStudio } from './components/BatchQueueStudio';
import { CineVideoStudio } from './components/CineVideoStudio';
import { ProjectManagementDashboard } from './components/ProjectManagementDashboard';
import { WfpProject } from './types/project';
import { WebSpeechTTS } from './components/WebSpeechTTS';
import { AudioPlayer } from './components/AudioPlayer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ChatAIStudio } from './components/ChatAIStudio';
import { SubscriptionModal } from './components/SubscriptionModal';
import { VoiceCloningStudio } from './components/VoiceCloningStudio';
import { AudioTrimmerModal } from './components/AudioTrimmerModal';
import { AudioExtenderModal } from './components/AudioExtenderModal';
import { ImageToVideoStudio } from './components/ImageToVideoStudio';
import { VideoToTextStudio } from './components/VideoToTextStudio';
import { ImageEditorAIStudio } from './components/ImageEditorAIStudio';
import { JsonToVideoStudio } from './components/JsonToVideoStudio';
import { OnlineVideoPortalStudio } from './components/OnlineVideoPortalStudio';
import { DocuCraftSuite } from './components/DocuCraftSuite';
import { GlobalAIChatCopilot } from './components/GlobalAIChatCopilot';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { StudioSettingsModal } from './components/StudioSettingsModal';
import { AuthModal, UserAccount } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { LiveVoiceDirectorModal } from './components/LiveVoiceDirectorModal';
import { CloudDatabaseModal } from './components/CloudDatabaseModal';
import { GeneratedAudio, AudioMetadata, UserSubscription, ClonedVoice, NeuralSpeaker } from './types/tts';
import { ImageToVideoAspectRatio, ImageToVideoMotion, ImageToVideoAtmosphere, StoryboardScene } from './types/imageToVideo';
import { generateDemoChimeAudio } from './utils/audio';
import { Mic, Users, Zap, Layers, Sparkles, Film, Bot, Star, ShieldCheck, AudioWaveform, Scissors } from 'lucide-react';

const STORAGE_SUB_KEY = 'voicecraft_subscription';
const STORAGE_CLONES_KEY = 'voicecraft_cloned_voices';
const STORAGE_ACCOUNTS_KEY = 'voicecraft_user_accounts';
const STORAGE_ACTIVE_LOGIN_ID = 'voicecraft_active_login_id';

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    loginId: 'rinku_creator',
    email: 'rinkudebbarma2016@gmail.com',
    name: 'Rinku Debbarma',
    isLoggedIn: true,
    tier: 'Pro',
    cloudStorageUsedGb: 1.8,
    cloudStorageTotalGb: 5000,
    joinedDate: 'October 2026',
    avatarBg: 'from-emerald-500 to-teal-400',
    isGoogleAccount: true,
  },
  {
    loginId: 'rinku_studio',
    email: 'rinku.studio@gmail.com',
    name: 'Rinku Debbarma (Creative Studio)',
    isLoggedIn: true,
    tier: 'Pro',
    cloudStorageUsedGb: 1.8,
    cloudStorageTotalGb: 5000,
    joinedDate: 'November 2026',
    avatarBg: 'from-cyan-500 to-blue-500',
    isGoogleAccount: true,
  },
];

const DEFAULT_CLONED_VOICES: ClonedVoice[] = [
  {
    id: 'clone_vikram',
    name: 'Vikram',
    gender: 'Male',
    accent: 'Indian English (Bengaluru Tech)',
    flag: '🇮🇳',
    description: 'AI Cloned Voice • Resonant Baritone • 138 Hz • Bengaluru Tech',
    baseVoice: 'Puck',
    stylePrompt: 'Vikram cloned profile: Resonant baritone Indian English accent, punchy tech founder cadence, measured pauses and authoritative clarity',
    timbreProfile: {
      pitchHz: 138,
      speakingRateWpm: 148,
      timbreType: 'Warm & Resonant',
      resonance: 'Rich Chest Register',
      detectedAccent: 'Indian English (Bengaluru Tech)',
      emotionBaseline: 'Confident & Strategic',
      confidenceScore: 98,
    },
    createdAt: Date.now() - 86400000,
    settings: { stability: 82, clarity: 90, styleExaggeration: 20 },
    tags: ['Indian English', 'Tech Founder', 'Keynote'],
    isCustomClone: false,
  },
  {
    id: 'clone_meera',
    name: 'Dr. Meera',
    gender: 'Female',
    accent: 'Indian English (Melodic Storyteller)',
    flag: '🇮🇳',
    description: 'AI Cloned Voice • Melodic & Lyrical • 195 Hz • Narrative',
    baseVoice: 'Kore',
    stylePrompt: 'Dr. Meera cloned profile: Warm lyrical Indian English accent, poetic cadence, nuanced emotional warmth and crystal-clear pronunciation',
    timbreProfile: {
      pitchHz: 195,
      speakingRateWpm: 136,
      timbreType: 'Smooth & Melodic',
      resonance: 'Melodic Head-Chest Blend',
      detectedAccent: 'Indian English (Urban Delhi)',
      emotionBaseline: 'Poised & Empathetic',
      confidenceScore: 97,
    },
    createdAt: Date.now() - 172800000,
    settings: { stability: 85, clarity: 92, styleExaggeration: 30 },
    tags: ['Indian English', 'Audiobooks', 'Podcast Host'],
    isCustomClone: false,
  },
  {
    id: 'clone_marcus',
    name: 'Marcus Vance',
    gender: 'Male',
    accent: 'British Received Pronunciation',
    flag: '🇬🇧',
    description: 'AI Cloned Voice • Deep Authoritative • 110 Hz • London Executive',
    baseVoice: 'Charon',
    stylePrompt: 'Marcus Vance cloned profile: Deep authoritative British RP delivery, prestigious documentary cadence with crisp BBC enunciation',
    timbreProfile: {
      pitchHz: 110,
      speakingRateWpm: 128,
      timbreType: 'Deep & Authoritative',
      resonance: 'Deep Sub-glottal Chest',
      detectedAccent: 'British Received Pronunciation',
      emotionBaseline: 'Executive & Serious',
      confidenceScore: 96,
    },
    createdAt: Date.now() - 259200000,
    settings: { stability: 88, clarity: 94, styleExaggeration: 15 },
    tags: ['British RP', 'Executive', 'Documentary'],
    isCustomClone: false,
  },
];

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: 'creator',
  isTrialActive: false,
  trialStartDate: Date.now() - 86400000,
  trialDaysTotal: 0,
  trialDaysRemaining: 0,
  billingInterval: 'annual',
  status: 'active',
  unlockedFeatures: [
    'neural-voices',
    'indian-english',
    'voice-cloning-ai',
    'audio-trimmer',
    'audio-normalizer-1db',
    'ai-chat-director',
    'id3-metadata',
    'batch-queue',
    'cine-video-studio',
    'lossless-wav',
    'commercial-license',
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTabType>('projects');
  const [currentWfpProject, setCurrentWfpProject] = useState<WfpProject | null>(null);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean>(true);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(() => {
    try {
      return generateDemoChimeAudio();
    } catch {
      return null;
    }
  });
  const [history, setHistory] = useState<GeneratedAudio[]>(() => {
    try {
      const demo = generateDemoChimeAudio();
      return [demo];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [fallbackText, setFallbackText] = useState<string>('');

  // Pre-fill state for cross-tab transfers from AI Chat Director
  const [soloPrefill, setSoloPrefill] = useState<{
    text?: string;
    speakerId?: string;
    targetDuration?: number;
  }>({});

  // Pre-fill state for ImageToVideo Studio from Global Copilot or Chat
  const [videoPrefill, setVideoPrefill] = useState<{
    prompt?: string;
    aspectRatio?: ImageToVideoAspectRatio;
    duration?: number;
    motion?: ImageToVideoMotion;
    atmosphere?: ImageToVideoAtmosphere;
    scenes?: StoryboardScene[];
  }>({});

  // Pre-fill state for Video to Text Transcriber
  const [videoToTextPrefill, setVideoToTextPrefill] = useState<{
    url?: string;
    name?: string;
  }>({});

  // Audio Trimmer Modal State for History & Global Access
  const [isTrimmerModalOpen, setIsTrimmerModalOpen] = useState<boolean>(false);
  const [trimmerAudio, setTrimmerAudio] = useState<GeneratedAudio | null>(null);

  // Audio Extender Modal State for History & Quick Tools Access
  const [isExtenderModalOpen, setIsExtenderModalOpen] = useState<boolean>(false);
  const [extenderAudio, setExtenderAudio] = useState<GeneratedAudio | null>(null);

  // Command Palette, Shortcuts, and Settings Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLiveDirectorOpen, setIsLiveDirectorOpen] = useState<boolean>(false);
  const [isCloudDatabaseOpen, setIsCloudDatabaseOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts Listener (⌘K, ?, 1-8 tab keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === '1') {
        setActiveTab('projects');
      } else if (e.key === '2') {
        setActiveTab('solo');
      } else if (e.key === '3') {
        setActiveTab('video');
      } else if (e.key === '4') {
        setActiveTab('image-to-video');
      } else if (e.key === '5') {
        setActiveTab('clone');
      } else if (e.key === '6') {
        setActiveTab('chat');
      } else if (e.key === '7') {
        setActiveTab('dialogue');
      } else if (e.key === '8') {
        setActiveTab('batch');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Page Title & Context
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      projects: 'Projects Hub & Templates',
      solo: 'Solo Narrator TTS',
      video: 'CineStudio Video Editor 16',
      'image-to-video': 'VidsCraft AI Storyboards & Video',
      clone: 'Voice Clone AI Studio',
      chat: 'Chataipro – Frontier Intelligence',
      dialogue: 'Dialogue Studio',
      batch: 'Batch Queue Studio',
      'web-speech': 'Local Web Speech',
      'watch-portal': 'Watch Online Video',
      docucraft: 'DocuCraft Suite',
    };
    const tabName = tabTitles[activeTab] || 'Studio';
    const projName = currentWfpProject?.name ? ` • ${currentWfpProject.name}` : '';
    document.title = `VoiceCraft AI – ${tabName}${projName}`;
  }, [activeTab, currentWfpProject]);

  // Cloned Voices State
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLONES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_CLONED_VOICES;
  });

  const handleSaveClonedVoice = (newVoice: ClonedVoice) => {
    setClonedVoices((prev) => {
      const updated = [newVoice, ...prev.filter((v) => v.id !== newVoice.id)];
      try {
        localStorage.setItem(STORAGE_CLONES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save cloned voices:', e);
      }
      return updated;
    });
  };

  const handleDeleteClonedVoice = (id: string) => {
    setClonedVoices((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem(STORAGE_CLONES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save cloned voices:', e);
      }
      return updated;
    });
  };

  const handleSendCloneToSolo = (text: string, clonedSpeakerName: string, stylePrompt: string) => {
    setSoloPrefill({
      text,
      speakerId: clonedSpeakerName.toLowerCase().replace(/\s+/g, '_'),
    });
    setActiveTab('solo');
  };

  const handleOpenTrimmerForAudio = (item: GeneratedAudio) => {
    setTrimmerAudio(item);
    setIsTrimmerModalOpen(true);
  };

  const handleOpenExtenderForAudio = (item: GeneratedAudio) => {
    setExtenderAudio(item);
    setIsExtenderModalOpen(true);
  };

  // Subscription State with 7-Day Free Trial
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SUB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isTrialActive && parsed.trialStartDate) {
          const daysPassed = Math.floor((Date.now() - parsed.trialStartDate) / (1000 * 60 * 60 * 24));
          const remaining = Math.max(0, 7 - daysPassed);
          parsed.trialDaysRemaining = remaining;
        }
        if (parsed.tier === 'free' || !parsed.tier) {
          return DEFAULT_SUBSCRIPTION;
        }
        return {
          ...parsed,
          unlockedFeatures: parsed.unlockedFeatures?.includes('audio-normalizer-1db')
            ? parsed.unlockedFeatures
            : [...(parsed.unlockedFeatures || []), 'audio-normalizer-1db'],
        };
      }
    } catch {
      // Fall through to default
    }
    return DEFAULT_SUBSCRIPTION;
  });

  const handleUpdateSubscription = (newSub: UserSubscription) => {
    setSubscription(newSub);
    try {
      localStorage.setItem(STORAGE_SUB_KEY, JSON.stringify(newSub));
    } catch (err) {
      console.warn('Failed to save subscription:', err);
    }
  };

  // Google & Gmail Multi-Account State Management
  const [accountsList, setAccountsList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load accounts:', e);
    }
    return DEFAULT_ACCOUNTS;
  });

  const [activeLoginId, setActiveLoginId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_LOGIN_ID);
      if (savedId) return savedId;
    } catch {}
    return 'rinku_creator';
  });

  const currentUser =
    accountsList.find((a) => a.loginId === activeLoginId) ||
    accountsList[0] ||
    DEFAULT_ACCOUNTS[0];

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'profile'>('login');
  const [authBannerToast, setAuthBannerToast] = useState<string | null>(null);

  const handleSwitchAccount = (account: UserAccount) => {
    setActiveLoginId(account.loginId);
    try {
      localStorage.setItem(STORAGE_ACTIVE_LOGIN_ID, account.loginId);
    } catch (e) {
      console.warn(e);
    }
    setAuthBannerToast(`✓ Switched to account: ${account.name} (${account.email})`);
    setTimeout(() => setAuthBannerToast(null), 3500);
  };

  const handleAddAccount = (newAccount: UserAccount) => {
    setAccountsList((prev) => {
      const filtered = prev.filter((a) => a.loginId !== newAccount.loginId);
      const updated = [...filtered, newAccount];
      try {
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    setActiveLoginId(newAccount.loginId);
    try {
      localStorage.setItem(STORAGE_ACTIVE_LOGIN_ID, newAccount.loginId);
    } catch {}

    if (newAccount.isLoggedIn && newAccount.loginId !== 'guest_user') {
      setAuthBannerToast(`✓ Welcome to Apps Developer Studio, ${newAccount.name}! Account active.`);
      setTimeout(() => setAuthBannerToast(null), 4000);
    }
  };

  const handleUpdateCurrentUser = (updatedUser: UserAccount) => {
    setAccountsList((prev) => {
      const updated = prev.map((a) =>
        a.loginId === updatedUser.loginId ? updatedUser : a
      );
      try {
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSignOut = () => {
    // Explicitly set active user to logged out
    setAccountsList((prev) =>
      prev.map((acc) => (acc.loginId === activeLoginId ? { ...acc, isLoggedIn: false } : acc))
    );
    const guest: UserAccount = {
      loginId: 'guest_user',
      email: 'guest@voxcine.local',
      name: 'Guest Studio User',
      isLoggedIn: false,
      tier: 'Free',
      cloudStorageUsedGb: 0.2,
      cloudStorageTotalGb: 5,
      joinedDate: 'November 2026',
      avatarBg: 'from-zinc-600 to-zinc-500',
    };
    handleAddAccount(guest);
    setActiveLoginId('guest_user');
    try {
      localStorage.setItem(STORAGE_ACTIVE_LOGIN_ID, 'guest_user');
    } catch {}
    setAuthBannerToast('🔒 You have successfully logged out of Apps Developer Studio. You can log in or create an account anytime.');
    setTimeout(() => setAuthBannerToast(null), 4500);
  };

  // Check server status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.geminiAvailable === 'boolean') {
          setGeminiAvailable(data.geminiAvailable);
        }
      })
      .catch((err) => {
        console.warn('Failed to check backend status:', err);
      });
  }, []);

  const handleAudioGenerated = (audio: GeneratedAudio) => {
    // Ensure default metadata is present
    const audioWithMeta: GeneratedAudio = {
      ...audio,
      metadata: audio.metadata || {
        title: audio.title || 'Untitled Audio',
        artist: audio.speakerName || audio.voice || 'VoiceCraft AI',
        genre: 'Voiceover',
        album: 'VoiceCraft AI Library',
        year: new Date().getFullYear().toString(),
        comment: audio.text ? audio.text.slice(0, 200) : '',
      },
    };
    setCurrentAudio(audioWithMeta);
    setHistory((prev) => [audioWithMeta, ...prev]);
  };

  const handleUpdateAudioMetadata = (id: string, metadata: AudioMetadata) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, metadata, title: metadata.title || item.title } : item
      )
    );
    if (currentAudio?.id === id) {
      setCurrentAudio((prev) =>
        prev ? { ...prev, metadata, title: metadata.title || prev.title } : null
      );
    }
  };

  const handleFallbackToWebSpeech = (text: string) => {
    setFallbackText(text);
    setActiveTab('web-speech');
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentAudio?.id === id) {
      setCurrentAudio(null);
    }
  };

  const handleNavigateFromChat = (
    tab: 'solo' | 'dialogue' | 'video' | 'batch' | 'image-to-video',
    data?: any
  ) => {
    if (tab === 'solo' && data) {
      setSoloPrefill({
        text: data.text,
        speakerId: data.speakerId,
        targetDuration: data.targetDuration,
      });
    } else if (tab === 'image-to-video' && data) {
      setVideoPrefill(data);
    }
    setActiveTab(tab);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* 7-Day Free Trial Persistent Banner */}
      {subscription.isTrialActive && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-emerald-950 border-b border-purple-500/30 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs flex items-center justify-between text-zinc-200">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-amber-300">Free Trial:</span>
              <span className="hidden md:inline text-zinc-300">
                Full access to Creator Pro (25+ Neural voice artists, Indian English, AI Director & Lossless WAV).
              </span>
              <span className="font-semibold text-emerald-400">
                {subscription.trialDaysRemaining} days remaining
              </span>
            </div>

            <button
              onClick={() => setIsPricingOpen(true)}
              className="text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white underline decoration-amber-400/60 underline-offset-2 shrink-0 cursor-pointer"
            >
              Plan Details
            </button>
          </div>
        </div>
      )}

      {/* Global Auth Notification Toast (Login, Logout, Account Created) */}
      {authBannerToast && (
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-teal-950 border-b border-emerald-500/50 px-4 py-2 text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg animate-fadeIn z-50">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{authBannerToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthBannerToast(null)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        openHistory={() => setIsHistoryOpen(true)}
        geminiAvailable={geminiAvailable}
        subscription={subscription}
        openPricing={() => setIsPricingOpen(true)}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        openShortcuts={() => setIsShortcutsOpen(true)}
        openSettings={() => setIsSettingsOpen(true)}
        onOpenLiveDirector={() => setIsLiveDirectorOpen(true)}
        onOpenCloudDatabase={() => setIsCloudDatabaseOpen(true)}
        currentUser={currentUser}
        accounts={accountsList}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
        onOpenAuthModal={(tab) => {
          if (tab) setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Body (pb-28 on mobile gives clearance above bottom dock) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-4 sm:space-y-6 pb-28 lg:pb-8">
        {/* Workstation Audio Player (Active playback deck with Real-Time Waveform Analyzer) */}
        <section aria-label="Audio Playback Workstation">
          <AudioPlayer
            currentAudio={currentAudio}
            onAudioTrimmed={handleAudioGenerated}
            onAudioExtended={handleAudioGenerated}
            onAudioNormalized={handleAudioGenerated}
            onSendToTimeline={(ext) => {
              handleAudioGenerated(ext);
              setActiveTab('video');
            }}
          />
        </section>

        {/* Studio Workspace Content */}
        <div className="transition-all">
          {activeTab === 'chat' && (
            <ChatAIStudio
              onAudioGenerated={handleAudioGenerated}
              geminiAvailable={geminiAvailable}
              onNavigateToTab={handleNavigateFromChat}
              onOpenPricing={() => setIsPricingOpen(true)}
              isTrialActive={subscription.isTrialActive}
            />
          )}

          {activeTab === 'solo' && (
            <SoloTTS
              onAudioGenerated={handleAudioGenerated}
              geminiAvailable={geminiAvailable}
              onFallbackToWebSpeech={handleFallbackToWebSpeech}
              initialText={soloPrefill.text}
              initialSpeakerId={soloPrefill.speakerId}
              initialDuration={soloPrefill.targetDuration}
              clonedVoices={clonedVoices}
            />
          )}

          {activeTab === 'clone' && (
            <VoiceCloningStudio
              onAudioGenerated={handleAudioGenerated}
              onSendToSolo={handleSendCloneToSolo}
              clonedVoices={clonedVoices}
              onSaveClonedVoice={handleSaveClonedVoice}
              onDeleteClonedVoice={handleDeleteClonedVoice}
            />
          )}

          {activeTab === 'dialogue' && (
            <DialogueTTS
              onAudioGenerated={handleAudioGenerated}
              geminiAvailable={geminiAvailable}
            />
          )}

          {activeTab === 'batch' && (
            <BatchQueueStudio
              onAudioGenerated={handleAudioGenerated}
              geminiAvailable={geminiAvailable}
              onPlayAudioInPlayer={(audio) => setCurrentAudio(audio)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectManagementDashboard
              currentProject={currentWfpProject}
              currentAudio={currentAudio}
              onAudioExtended={handleAudioGenerated}
              onEnterWorkspace={(project) => {
                setCurrentWfpProject(project);
                setActiveTab('video');
              }}
              onOpenQuickTool={(toolId) => {
                if (toolId === 'audio_extender') {
                  setExtenderAudio(currentAudio);
                  setIsExtenderModalOpen(true);
                } else if (toolId === 'image_to_video' || toolId === 'image-to-video') {
                  setActiveTab('image-to-video');
                } else {
                  setActiveTab('video');
                }
              }}
            />
          )}

          {activeTab === 'image-to-video' && (
            <ImageToVideoStudio
              currentTTSAudio={currentAudio}
              geminiAvailable={geminiAvailable}
              prefillConfig={videoPrefill}
              onSendToTimeline={(scene, videoUrl) => {
                setActiveTab('video');
              }}
              onSendToAudioPlayer={(audio) => setCurrentAudio(audio)}
              onOpenTimelineEditor={() => setActiveTab('video')}
              onSendToVideoToText={(videoUrl, videoName) => {
                setVideoToTextPrefill({ url: videoUrl, name: videoName });
                setActiveTab('video-to-text');
              }}
            />
          )}

          {activeTab === 'video-to-text' && (
            <VideoToTextStudio
              initialVideoUrl={videoToTextPrefill.url}
              initialVideoName={videoToTextPrefill.name}
              onSendToSoloTTS={(text) => {
                setSoloPrefill({ text });
                setActiveTab('solo');
              }}
              onSendToDialogue={() => {
                setActiveTab('dialogue');
              }}
              onSendToVidsCraft={(prompt, narrationScript) => {
                setVideoPrefill({
                  prompt,
                  scenes: [
                    {
                      id: 'sc_trans_' + Date.now(),
                      title: 'Transcribed Scene 1',
                      image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
                      imageName: 'Transcribed Video Scene',
                      prompt,
                      narrationScript,
                      motion: 'zoom-in',
                      atmosphere: 'none',
                      duration: 8,
                      transition: 'cross-dissolve',
                    },
                  ],
                });
                setActiveTab('image-to-video');
              }}
              onSendToTimeline={() => {
                setActiveTab('video');
              }}
            />
          )}

          {activeTab === 'video' && (
            <CineVideoStudio
              currentTTSAudio={currentAudio}
              geminiAvailable={geminiAvailable}
              onSendToPlayer={(audio) => setCurrentAudio(audio)}
              initialProject={currentWfpProject}
              onReturnToDashboard={() => setActiveTab('projects')}
              onOpenImageToVideo={() => setActiveTab('image-to-video')}
            />
          )}

          {activeTab === 'image-editor' && (
            <ImageEditorAIStudio
              geminiAvailable={geminiAvailable}
              onSendToImageToVideo={(imageUrl, prompt) => {
                setVideoPrefill({
                  prompt,
                  scenes: [
                    {
                      id: 'sc_edit_' + Date.now(),
                      title: 'Edited AI Scene',
                      image: imageUrl,
                      imageName: 'AI Edited Image',
                      prompt: prompt || 'Cinematic scene',
                      narrationScript: 'Cinematic visual scene crafted in AI Image Editor.',
                      motion: 'zoom-in',
                      atmosphere: 'none',
                      duration: 8,
                      transition: 'cross-dissolve',
                    },
                  ],
                });
                setActiveTab('image-to-video');
              }}
              onSendToTimeline={() => {
                setActiveTab('video');
              }}
            />
          )}

          {activeTab === 'json-to-video' && (
            <JsonToVideoStudio
              geminiAvailable={geminiAvailable}
              onSendToTimeline={(project) => {
                setCurrentWfpProject(project as any);
                setActiveTab('video');
              }}
              onSendToImageToVideo={() => {
                setActiveTab('image-to-video');
              }}
            />
          )}

          {activeTab === 'watch-portal' && (
            <OnlineVideoPortalStudio
              onRemixInVidsCraft={(prompt, motion) => {
                setVideoPrefill({
                  prompt,
                  motion: (motion?.includes('zoom') ? 'zoom-in' : 'pan-left') as any,
                  scenes: [
                    {
                      id: 'sc_remix_' + Date.now(),
                      title: 'Remixed Famous Scene',
                      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=80',
                      imageName: 'Viral Scene Blueprint',
                      prompt,
                      narrationScript: 'Recreated from viral AI movie masterpiece.',
                      motion: 'zoom-in',
                      atmosphere: 'cyber-glitch',
                      duration: 8,
                      transition: 'cross-dissolve',
                    },
                  ],
                });
                setActiveTab('image-to-video');
              }}
              onSendToTimeline={() => {
                setActiveTab('video');
              }}
            />
          )}

          {activeTab === 'web-speech' && (
            <WebSpeechTTS initialText={fallbackText} />
          )}

          {activeTab === 'docucraft' && (
            <DocuCraftSuite />
          )}
        </div>

        {/* Feature Highlights Grid at Bottom */}
        <section className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs text-zinc-400">
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-purple-900/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">AI Director Chat</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Chat assistant that scripts, matches voice actors & executes instant audio takes.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-amber-900/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">7 Days Free Trial</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Risk-free trial with zero credit card required. Upgrade or cancel anytime.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-emerald-900/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">CineStudio Pro AI Video</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Multi-track timeline, AI text-to-video, subtitles & cinematic camera motions.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-orange-900/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0 text-base">
              🇮🇳
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">Authentic Indian English</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Priya, Aarav, Ananya & Rohan voices with Bangalore tech delivery and natural prosody.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-cyan-900/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">Batch Queue & ID3</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Bulk convert text files with embedded ID3 metadata tags and 1-click ZIP export.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-pink-900/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 shrink-0 font-bold text-sm">
              ∞
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-0.5">Unlimited Words</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Paste full essays and books without truncation. Auto-stitched into unified WAVs.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectAudio={(item) => {
          setCurrentAudio(item);
          setIsHistoryOpen(false);
        }}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        onUpdateMetadata={handleUpdateAudioMetadata}
        onOpenTrimmer={handleOpenTrimmerForAudio}
        onOpenExtender={handleOpenExtenderForAudio}
        currentAudioId={currentAudio?.id}
      />

      {/* Standalone Audio Trimmer Modal with Full Keyboard Shortcuts */}
      <AudioTrimmerModal
        isOpen={isTrimmerModalOpen}
        onClose={() => setIsTrimmerModalOpen(false)}
        audio={trimmerAudio || currentAudio}
        onSaveTrimmedAudio={handleAudioGenerated}
      />

      {/* Standalone AI Audio Extender Modal with Seamless Loops & Tails */}
      <AudioExtenderModal
        isOpen={isExtenderModalOpen}
        onClose={() => setIsExtenderModalOpen(false)}
        audio={extenderAudio || currentAudio}
        onSaveExtendedAudio={handleAudioGenerated}
        onSendToTimeline={(ext) => {
          handleAudioGenerated(ext);
          setActiveTab('video');
        }}
      />

      {/* Subscription & 7-Day Free Trial Modal */}
      <SubscriptionModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        subscription={subscription}
        onUpdateSubscription={handleUpdateSubscription}
      />

      {/* Global Quick Command Palette (⌘K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectSpeaker={(speaker: NeuralSpeaker) => {
          setSoloPrefill({
            speakerId: speaker.id,
          });
          setActiveTab('solo');
        }}
        onOpenQuickTool={(toolId) => {
          if (toolId === 'audio_extender') {
            setExtenderAudio(currentAudio);
            setIsExtenderModalOpen(true);
          } else if (toolId === 'audio_trimmer') {
            if (currentAudio) {
              setTrimmerAudio(currentAudio);
              setIsTrimmerModalOpen(true);
            }
          }
        }}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (?) */}
      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Studio Preferences & Audio Quality Modal */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Google & Gmail Login ID Account Manager Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateCurrentUser}
        initialTab={authModalTab}
      />

      {/* Gemini Live Real-Time Voice Director Modal */}
      <LiveVoiceDirectorModal
        isOpen={isLiveDirectorOpen}
        onClose={() => setIsLiveDirectorOpen(false)}
        onApplyDirectorPrompt={(prompt, cameraMotion) => {
          setActiveTab('image-to-video');
          setVideoPrefill({
            prompt,
            motion: (cameraMotion as any) || 'zoom-in',
          });
        }}
      />

      {/* Cloud SQL PostgreSQL Database Library Modal */}
      <CloudDatabaseModal
        isOpen={isCloudDatabaseOpen}
        onClose={() => setIsCloudDatabaseOpen(false)}
        onLoadVideoToPlayer={(videoUrl, title) => {
          setActiveTab('image-to-video');
        }}
      />

      {/* Asking AI - Universal Floating Studio Director for prompt-driven creation everywhere */}
      <GlobalAIChatCopilot
        currentTab={activeTab}
        geminiAvailable={geminiAvailable}
        onNavigateToTab={(tab, data) => {
          setActiveTab(tab as any);
          if (tab === 'image-to-video' && data) {
            setVideoPrefill(data);
          } else if (tab === 'solo' && data) {
            setSoloPrefill(data);
          }
        }}
      />

      {/* Studio Global Footer */}
      <footer className="border-t border-zinc-900 py-4 mb-16 lg:mb-0 text-center text-xs text-zinc-600">
        VoiceCraft AI • Unlimited Words Free Text-to-Speech Studio, AI Voice Director & Multi-Track Video Studio
      </footer>
    </div>
    </AuthProvider>
  );
}
