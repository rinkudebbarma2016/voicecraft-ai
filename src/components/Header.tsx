import React, { useState, useEffect } from 'react';
import {
  Mic,
  Users,
  Zap,
  Clock,
  Radio,
  Layers,
  Film,
  Bot,
  Sparkles,
  AudioWaveform,
  FolderOpen,
  Menu,
  X,
  Compass,
  ChevronRight,
  Monitor,
  Smartphone,
  Laptop,
  Search,
  Keyboard,
  Sliders,
  FileText,
  Wand2,
  FileCode,
  Tv,
  LogOut,
  UserPlus,
  LogIn,
  Database,
} from 'lucide-react';
import { UserSubscription } from '../types/tts';
import { UserAccount } from './AuthModal';
import { AccountProfileMenu } from './AccountProfileMenu';

export type AppTabType =
  | 'projects'
  | 'solo'
  | 'dialogue'
  | 'batch'
  | 'video'
  | 'chat'
  | 'clone'
  | 'web-speech'
  | 'image-to-video'
  | 'video-to-text'
  | 'image-editor'
  | 'json-to-video'
  | 'watch-portal'
  | 'docucraft';

interface HeaderProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  historyCount: number;
  openHistory: () => void;
  geminiAvailable: boolean;
  subscription: UserSubscription;
  openPricing: () => void;
  openCommandPalette?: () => void;
  openShortcuts?: () => void;
  openSettings?: () => void;
  onOpenLiveDirector?: () => void;
  onOpenCloudDatabase?: () => void;
  currentUser?: UserAccount;
  accounts?: UserAccount[];
  onSwitchAccount?: (account: UserAccount) => void;
  onAddAccount?: (newAccount: UserAccount) => void;
  onOpenAuthModal?: (tab?: 'login' | 'signup') => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  openHistory,
  geminiAvailable,
  subscription,
  openPricing,
  openCommandPalette,
  openShortcuts,
  openSettings,
  onOpenLiveDirector,
  onOpenCloudDatabase,
  currentUser,
  accounts = [],
  onSwitchAccount = () => {},
  onAddAccount = () => {},
  onOpenAuthModal = () => {},
  onSignOut = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fallbackUser: UserAccount = {
    loginId: 'rinku_creator',
    email: 'rinkudebbarma2016@gmail.com',
    name: 'Rinku Debbarma',
    isLoggedIn: true,
    tier: 'Pro',
    cloudStorageUsedGb: 12.4,
    cloudStorageTotalGb: 15,
    joinedDate: 'October 2026',
    avatarBg: 'from-emerald-500 to-teal-400',
  };

  const activeUser = currentUser || fallbackUser;
  const activeAccountsList = accounts.length > 0 ? accounts : [fallbackUser];
  const isProPlan =
    subscription.tier === 'creator' ||
    subscription.tier === 'studio' ||
    subscription.tier === 'enterprise' ||
    activeUser.tier === 'Pro';

  // Close mobile menu on tab switch or ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTab = (tab: HeaderProps['activeTab']) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Studio tab metadata for drawer & navigation
  const studioTabs: Array<{
    id: HeaderProps['activeTab'];
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }> = [
    {
      id: 'projects',
      label: 'Projects Hub',
      sublabel: '.ccp & .wfp CineCraft Pro Dashboard',
      icon: <FolderOpen className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-300',
      badge: 'PRO',
    },
    {
      id: 'solo',
      label: 'Solo Narrator',
      sublabel: 'Unlimited Neural Text-to-Speech',
      icon: <Mic className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-300',
      badge: 'UNLIMITED',
    },
    {
      id: 'video',
      label: 'Video Editor 16',
      sublabel: 'Pro 4K Multi-Track Video Timeline',
      icon: <Film className="w-4 h-4 text-teal-400" />,
      color: 'border-teal-500/40 text-teal-300',
      badge: '16 PRO',
    },
    {
      id: 'image-to-video',
      label: 'VidsCraft Studio',
      sublabel: 'Upload Device Media, Storyboard & Video',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
      badge: 'VIDS AI',
    },
    {
      id: 'video-to-text',
      label: 'Video to Text',
      sublabel: 'AI Speech Transcription & Subtitles',
      icon: <FileText className="w-4 h-4 text-teal-400" />,
      color: 'border-teal-500/40 text-teal-300',
      badge: 'SUB/TXT',
    },
    {
      id: 'clone',
      label: 'Voice Clone AI',
      sublabel: 'Acoustic Timbre & Biometric Cloner',
      icon: <AudioWaveform className="w-4 h-4 text-pink-400" />,
      color: 'border-pink-500/40 text-pink-300',
      badge: 'NEURAL',
    },
    {
      id: 'chat',
      label: 'Chataipro',
      sublabel: 'Frontier Intelligence: Our most powerful models & agents',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-300',
      badge: 'PRO',
    },
    {
      id: 'dialogue',
      label: 'Dialogue Studio',
      sublabel: 'Multi-Speaker 2-Track Conversation',
      icon: <Users className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 'batch',
      label: 'Batch Queue',
      sublabel: 'Multi-script Bulk Synthesis',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-500/40 text-sky-300',
    },
    {
      id: 'image-editor',
      label: 'Image Editor AI',
      sublabel: 'Generative Styling, LUTs & Retouch',
      icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
      badge: 'IMG AI',
    },
    {
      id: 'json-to-video',
      label: 'AI Pro Studio',
      sublabel: 'Code, JSON & Programmatic Video Director',
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
      badge: 'PRO',
    },
    {
      id: 'watch-portal',
      label: 'Watch Online Video',
      sublabel: 'Cinema & Edge Stream Media Hub',
      icon: <Tv className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-300',
      badge: 'WATCH',
    },
    {
      id: 'docucraft',
      label: 'DocuCraft Suite',
      sublabel: 'Smallpdf Tools • All-in-One PDF & File Hub',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
      badge: 'TOOLS',
    },
    {
      id: 'web-speech',
      label: 'Local Web TTS',
      sublabel: 'Offline Browser Speech Engine',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      color: 'border-yellow-500/40 text-yellow-300',
    },
  ];

  const currentTabMeta = studioTabs.find((t) => t.id === activeTab) || studioTabs[0];

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none">
            <div
              onClick={() => handleSelectTab('projects')}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold ring-1 ring-white/20 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  onClick={() => handleSelectTab('projects')}
                  className="font-black text-sm sm:text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-zinc-100 to-emerald-300 bg-clip-text text-transparent cursor-pointer"
                >
                  VoiceCraft<span className="text-emerald-400 font-extrabold ml-0.5">AI</span>
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider hidden sm:inline ml-1">
                  Studio 16
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden xl:block leading-none mt-0.5 font-medium">
                Neural Voice Cloning & Video Studio
              </p>
            </div>
          </div>

          {/* Desktop Tab Navigation (Hidden on small screens, full row on laptop/computer) */}
          <nav className="hidden lg:flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80 shadow-inner overflow-x-auto scrollbar-thin max-w-full">
            <button
              onClick={() => handleSelectTab('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-zinc-800 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Projects Dashboard & Startup Hub (.wfp Files)"
            >
              <FolderOpen className={`w-3.5 h-3.5 ${activeTab === 'projects' ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>Projects</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700/60">
                .wfp
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('solo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'solo'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Narrator</span>
            </button>

            <button
              onClick={() => handleSelectTab('video')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-emerald-600 text-zinc-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-950/50 border border-emerald-500/40 bg-emerald-950/20'
              }`}
              title="Open Pro Multi-Track Video Editing Studio (v16 Features)"
            >
              <Film className={`w-3.5 h-3.5 ${activeTab === 'video' ? 'text-zinc-950' : 'text-emerald-400 animate-pulse'}`} />
              <span>Video Editor</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-black tracking-wider ${
                  activeTab === 'video'
                    ? 'bg-zinc-950/20 text-zinc-900 border border-zinc-950/30'
                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                }`}
              >
                16 PRO
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('image-to-video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'image-to-video'
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-zinc-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-300'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/30'
              }`}
              title="VidsCraft Studio - AI Storyboard & Video Creator"
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === 'image-to-video' ? 'text-zinc-950' : 'text-cyan-400 animate-pulse'}`} />
              <span>VidsCraft AI</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded uppercase font-black tracking-wider ${
                  activeTab === 'image-to-video'
                    ? 'bg-zinc-950/20 text-zinc-900 border border-zinc-950/30'
                    : 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                }`}
              >
                VIDS & 3D
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('video-to-text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'video-to-text'
                  ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-zinc-950 shadow-md shadow-teal-500/20 ring-1 ring-teal-300'
                  : 'text-teal-300 hover:text-white hover:bg-teal-950/40 border border-teal-500/30'
              }`}
              title="Video to Text - AI Speech Transcription & Subtitles"
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'video-to-text' ? 'text-zinc-950' : 'text-teal-400'}`} />
              <span>Video to Text</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded uppercase font-black tracking-wider ${
                  activeTab === 'video-to-text'
                    ? 'bg-zinc-950/20 text-zinc-900 border border-zinc-950/30'
                    : 'bg-teal-400/20 text-teal-200 border border-teal-400/30'
                }`}
              >
                SUB/TXT
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('clone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'clone'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm ring-1 ring-pink-400/50'
                  : 'text-pink-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <AudioWaveform className="w-3.5 h-3.5 text-pink-400" />
              <span>Voice Clone</span>
            </button>

            <button
              onClick={() => handleSelectTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Chataipro - Frontier intelligence: Our most powerful models and agents"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chataipro</span>
            </button>

            <button
              onClick={() => handleSelectTab('dialogue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'dialogue'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dialogue</span>
            </button>

            <button
              onClick={() => handleSelectTab('image-editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'image-editor'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                  : 'text-cyan-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="AI Image Editor - Generative Edit, LUTs & Retouch"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Image AI</span>
            </button>

            <button
              onClick={() => handleSelectTab('json-to-video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'json-to-video'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm ring-1 ring-amber-400/50'
                  : 'text-amber-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="AI Pro Studio - Code, JSON & Programmatic Video Engine"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Pro Studio</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                PRO
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('watch-portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'watch-portal'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-sm ring-1 ring-red-400/50'
                  : 'text-red-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Watch Online Video (Cinema & Edge Cloud Media Hub)"
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Watch Online</span>
            </button>

            <button
              onClick={() => handleSelectTab('docucraft')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'docucraft'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                  : 'text-cyan-300 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="DocuCraft Suite - Smallpdf Tools (Compress, Convert, Sign, OCR)"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>DocuCraft</span>
            </button>

            <button
              onClick={() => handleSelectTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'batch'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Batch</span>
            </button>
          </nav>

          {/* Active Mode Chip (Visible on Mobile & Tablet to show current workspace) */}
          <div className="flex lg:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            {currentTabMeta.icon}
            <span className="font-semibold text-zinc-200 truncate max-w-[110px] xs:max-w-[150px]">
              {currentTabMeta.label}
            </span>
          </div>

          {/* Right Action Controls: Search, Shortcuts, Settings, Trial, History & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Command Palette Button */}
            {openCommandPalette && (
              <button
                type="button"
                onClick={openCommandPalette}
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shadow-inner cursor-pointer"
                title="Search voices, tools & tabs (⌘K / Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] hidden xl:inline">Search...</span>
                <kbd className="px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[9px] text-zinc-400">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Shortcuts Help Button */}
            {openShortcuts && (
              <button
                type="button"
                onClick={openShortcuts}
                className="hidden sm:flex items-center justify-center p-2 rounded-lg sm:rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            {/* Studio Settings Button */}
            {openSettings && (
              <button
                type="button"
                onClick={openSettings}
                className="flex items-center justify-center p-2 rounded-lg sm:rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                title="Studio Preferences"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Gemini Live Real-time Voice Director Button */}
            {onOpenLiveDirector && (
              <button
                type="button"
                onClick={onOpenLiveDirector}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 via-teal-600/30 to-emerald-600/30 hover:from-cyan-600/50 hover:to-emerald-600/50 border border-cyan-500/50 text-cyan-200 text-xs font-bold transition shadow-sm cursor-pointer"
                title="Live Voice Director - Real-time conversational AI voice direction (Gemini Live API)"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Live Director</span>
              </button>
            )}

            {/* Cloud SQL PostgreSQL Database Library Button */}
            {onOpenCloudDatabase && (
              <button
                type="button"
                onClick={onOpenCloudDatabase}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition shadow-sm cursor-pointer"
                title="Cloud SQL PostgreSQL Database - View and manage saved videos & voice sessions"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Cloud SQL</span>
              </button>
            )}

            {/* Google / Gmail Login ID & Multi-Account Switcher (as in reference image) */}
            <AccountProfileMenu
              currentUser={activeUser}
              accounts={activeAccountsList}
              onSwitchAccount={onSwitchAccount}
              onAddAccount={onAddAccount}
              onOpenAuthModal={onOpenAuthModal}
              onSignOut={onSignOut}
            />

            {/* DIRECT VISIBLE LOGOUT BUTTON (Explicitly requested by user) */}
            {activeUser.isLoggedIn && activeUser.loginId !== 'guest_user' ? (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-xs group"
                title="Log Out of Apps Developer Studio Editor"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-extrabold transition cursor-pointer shadow-sm"
                  title="Create New Studio Account"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-semibold transition cursor-pointer shadow-sm"
                  title="Developer Studio Login"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              </div>
            )}

            {/* History Drawer Trigger */}
            <button
              onClick={openHistory}
              className="relative flex items-center justify-center p-2 rounded-lg sm:rounded-xl text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Generated Audio History"
            >
              <Clock className="w-4 h-4 text-zinc-400" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Mobile / Tablet Menu Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition cursor-pointer"
              title="Toggle Mobile Studio Menu"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Studios Slide-Down Drawer Modal */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 sm:top-16 z-50 bg-black/80 backdrop-blur-md animate-fade-in flex flex-col">
          <div className="bg-zinc-950 border-b border-zinc-800 max-h-[80vh] overflow-y-auto p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Select Creative Studio (Mobile & Computer)
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Grid of All 9 Studios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {studioTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        {tab.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <span>{tab.label}</span>
                          {tab.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-zinc-800 text-emerald-300 border border-zinc-700">
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">
                          {tab.sublabel}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Mobile Account Section with Log Out / Login */}
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center">
                    {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{activeUser.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">{activeUser.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {activeUser.tier || 'Pro'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                {activeUser.isLoggedIn && activeUser.loginId !== 'guest_user' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Studio</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuthModal('signup');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuthModal('login');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Quick Utility Actions */}
            <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs">
              {openCommandPalette && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCommandPalette();
                  }}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-medium">Search ⌘K</span>
                </button>
              )}
              {openShortcuts && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openShortcuts();
                  }}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-medium">Hotkeys (?)</span>
                </button>
              )}
              {openSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSettings();
                  }}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-medium">Settings</span>
                </button>
              )}
            </div>

            {/* Workspace Indicator */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-medium text-zinc-300">CineCraft Creative Workspace</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">v3.4 Production</span>
            </div>
          </div>

          {/* Backdrop click to dismiss */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Ergonomic Mobile Bottom App Dock (Always fixed at bottom for one-tap thumb navigation) */}
      <nav
        aria-label="Mobile Bottom App Bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        <button
          onClick={() => handleSelectTab('projects')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] transition ${
            activeTab === 'projects' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderOpen className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Projects</span>
        </button>

        <button
          onClick={() => handleSelectTab('solo')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] transition ${
            activeTab === 'solo' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mic className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Narrator</span>
        </button>

        <button
          onClick={() => handleSelectTab('video')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] transition ${
            activeTab === 'video'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Film className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold leading-none">Video 16</span>
        </button>

        <button
          onClick={() => handleSelectTab('image-to-video')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] transition ${
            activeTab === 'image-to-video' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Flow AI</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] text-zinc-400 hover:text-zinc-200 transition"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">All Tools</span>
        </button>
      </nav>
    </>
  );
};
