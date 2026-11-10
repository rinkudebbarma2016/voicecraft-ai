import React, { useState, useEffect, useRef } from 'react';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import { NeuralSpeaker } from '../types/tts';
import {
  Search,
  Mic,
  Film,
  AudioWaveform,
  Bot,
  Layers,
  Scissors,
  Sparkles,
  Zap,
  FolderOpen,
  Sliders,
  Volume2,
  Clock,
  Compass,
  ArrowRight,
  BookOpen,
  Check,
  Tag,
  Grid,
  FileText,
  Wand2,
  FileCode,
  Tv,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSpeaker?: (speaker: NeuralSpeaker) => void;
  onOpenQuickTool?: (toolId: string) => void;
  onOpenPricing?: () => void;
  onOpenHistory?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSettings?: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Studio Tabs' | 'Neural Voices' | 'Audio & Video Tools' | 'Templates' | 'Actions';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectSpeaker,
  onOpenQuickTool,
  onOpenPricing,
  onOpenHistory,
  onOpenShortcuts,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable commands
  const allItems: PaletteItem[] = [
    // Tabs
    {
      id: 'tab-projects',
      category: 'Studio Tabs',
      title: 'Projects Hub & CineCraft Dashboard',
      subtitle: 'Open, save, and manage CineCraft .ccp & .wfp projects and templates',
      icon: <FolderOpen className="w-4 h-4 text-emerald-400" />,
      badge: 'Tab 1',
      action: () => {
        onNavigateTab('projects');
        onClose();
      },
    },
    {
      id: 'tab-solo',
      category: 'Studio Tabs',
      title: 'Solo Narrator TTS Studio',
      subtitle: 'Unlimited words speech synthesis with 25+ neural voices',
      icon: <Mic className="w-4 h-4 text-purple-400" />,
      badge: 'Tab 2',
      action: () => {
        onNavigateTab('solo');
        onClose();
      },
    },
    {
      id: 'tab-video',
      category: 'Studio Tabs',
      title: 'CineStudio Video Editor 16',
      subtitle: 'Multi-track timeline, visual layers, subtitles & aspect ratios',
      icon: <Film className="w-4 h-4 text-teal-400" />,
      badge: 'Tab 3',
      action: () => {
        onNavigateTab('video');
        onClose();
      },
    },
    {
      id: 'tab-flow-ai',
      category: 'Studio Tabs',
      title: 'VidsCraft AI - Storyboard & Video Creator',
      subtitle: 'Multi-scene sequencing, Google Vids AI tools, teleprompter & animations',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      badge: 'Tab 4',
      action: () => {
        onNavigateTab('image-to-video');
        onClose();
      },
    },
    {
      id: 'tab-video-to-text',
      category: 'Studio Tabs',
      title: 'Video to Text AI Studio',
      subtitle: 'Transcribe video speech, generate SRT/VTT subtitles, OCR & visual scene summaries',
      icon: <FileText className="w-4 h-4 text-teal-400" />,
      badge: 'NEW',
      action: () => {
        onNavigateTab('video-to-text');
        onClose();
      },
    },
    {
      id: 'tab-clone',
      category: 'Studio Tabs',
      title: 'Voice Clone AI Studio',
      subtitle: 'Acoustic timbre analysis & custom AI voice cloning',
      icon: <AudioWaveform className="w-4 h-4 text-pink-400" />,
      badge: 'Tab 5',
      action: () => {
        onNavigateTab('clone');
        onClose();
      },
    },
    {
      id: 'tab-chat',
      category: 'Studio Tabs',
      title: 'Chataipro (Frontier Intelligence)',
      subtitle: 'Our most powerful models and agents: o1-pro reasoning, Deep Research & Canvas',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      badge: 'PRO',
      action: () => {
        onNavigateTab('chat');
        onClose();
      },
    },
    {
      id: 'tab-batch',
      category: 'Studio Tabs',
      title: 'Batch Queue Studio',
      subtitle: 'Bulk file synthesis with pattern-based renaming & ZIP export',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      badge: 'Tab 7',
      action: () => {
        onNavigateTab('batch');
        onClose();
      },
    },
    {
      id: 'tab-image-editor',
      category: 'Studio Tabs',
      title: 'AI Image Editor Studio',
      subtitle: 'Generative prompt styling, 1-click neural LUTs, Before/After comparison',
      icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
      badge: 'NEW',
      action: () => {
        onNavigateTab('image-editor');
        onClose();
      },
    },
    {
      id: 'tab-json-to-video',
      category: 'Studio Tabs',
      title: 'AI Pro Studio (JSON to Video)',
      subtitle: 'Convert JSON timeline scripts into playable, rendered video',
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      badge: 'PRO',
      action: () => {
        onNavigateTab('json-to-video');
        onClose();
      },
    },
    {
      id: 'tab-watch-portal',
      category: 'Studio Tabs',
      title: 'Watch Online Video (YouTube Style)',
      subtitle: 'Stream trending online videos, tutorials, and YouTube links directly',
      icon: <Tv className="w-4 h-4 text-red-400" />,
      badge: 'WATCH',
      action: () => {
        onNavigateTab('watch-portal');
        onClose();
      },
    },
    {
      id: 'tab-docucraft',
      category: 'Studio Tabs',
      title: 'DocuCraft Suite (Smallpdf Tools)',
      subtitle: 'All-in-one PDF tools: Compress, Convert, Merge, Split, eSign, Watermark, and OCR',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      badge: 'TOOLS',
      action: () => {
        onNavigateTab('docucraft');
        onClose();
      },
    },

    // Audio & Video Tools
    {
      id: 'tool-audition-grid',
      category: 'Audio & Video Tools',
      title: '5-Second Multi-Voice Audition Grid',
      subtitle: 'Generate and listen to multiple voices simultaneously on your script',
      icon: <Grid className="w-4 h-4 text-indigo-400" />,
      badge: 'NEW',
      action: () => {
        onNavigateTab('solo');
        onClose();
      },
    },
    {
      id: 'tool-audio-extender',
      category: 'Audio & Video Tools',
      title: 'AI Audio Extender',
      subtitle: 'Seamless looping, acoustic reverb tails & ambient pads',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      action: () => {
        onOpenQuickTool?.('audio_extender');
        onClose();
      },
    },
    {
      id: 'tool-audio-trimmer',
      category: 'Audio & Video Tools',
      title: 'Precision Audio Trimmer',
      subtitle: 'Millisecond timecode precision audio waveform slicing',
      icon: <Scissors className="w-4 h-4 text-rose-400" />,
      action: () => {
        onOpenQuickTool?.('audio_trimmer');
        onClose();
      },
    },
    {
      id: 'tool-pronunciation',
      category: 'Audio & Video Tools',
      title: 'Pronunciation Dictionary',
      subtitle: 'Custom IPA phonemes & respellings for technical terms',
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      action: () => {
        onNavigateTab('solo');
        onClose();
      },
    },
    {
      id: 'tool-pattern-rename',
      category: 'Audio & Video Tools',
      title: 'Pattern-Based File Renamer',
      subtitle: 'Format batch filenames before bulk ZIP export (ProjectName_Counter)',
      icon: <Tag className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('batch');
        onClose();
      },
    },

    // Actions & Settings
    {
      id: 'action-history',
      category: 'Actions',
      title: 'Audio History Drawer',
      subtitle: 'View, audition, re-download, or trim previously generated audio',
      icon: <Clock className="w-4 h-4 text-zinc-300" />,
      action: () => {
        onOpenHistory?.();
        onClose();
      },
    },
    {
      id: 'action-shortcuts',
      category: 'Actions',
      title: 'Keyboard Shortcuts Cheat Sheet',
      subtitle: 'View all keyboard shortcuts and productivity hotkeys',
      icon: <Sliders className="w-4 h-4 text-amber-400" />,
      badge: '?',
      action: () => {
        onOpenShortcuts?.();
        onClose();
      },
    },
    {
      id: 'action-settings',
      category: 'Actions',
      title: 'Studio Preferences & Audio Quality',
      subtitle: 'Sample rate (24kHz / 48kHz), auto-normalization, export defaults',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      action: () => {
        onOpenSettings?.();
        onClose();
      },
    },
    {
      id: 'action-pricing',
      category: 'Actions',
      title: 'Subscription Plans & 7-Day Free Trial',
      subtitle: 'Unlock unlimited studio features, HD export & custom clones',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      badge: '7D Free',
      action: () => {
        onOpenPricing?.();
        onClose();
      },
    },

    // Neural Voices (Top voices)
    ...NEURAL_SPEAKERS.map((sp) => ({
      id: `voice-${sp.id}`,
      category: 'Neural Voices' as const,
      title: `${sp.flag} ${sp.name} (${sp.accent})`,
      subtitle: `${sp.category} • ${sp.useCase} • ${sp.gender}`,
      icon: (
        <div
          className={`w-5 h-5 rounded-md bg-gradient-to-br ${sp.avatarGradient} flex items-center justify-center text-white text-[10px] font-bold`}
        >
          {sp.name[0]}
        </div>
      ),
      badge: sp.accent.includes('Indian') ? '🇮🇳 IN' : 'AI Voice',
      action: () => {
        onSelectSpeaker?.(sp);
        onNavigateTab('solo');
        onClose();
      },
    })),
  ];

  // Filter items based on query
  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/60 shrink-0">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, voice (e.g. 'Ashish'), tool, or tab..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              ESC to close
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching commands or voices found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/60 text-white border border-purple-500/40 shadow-md ring-1 ring-purple-500/20'
                      : 'hover:bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-purple-400 translate-x-1' : 'text-zinc-600'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950/90 flex items-center justify-between text-[11px] text-zinc-500 px-4 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>VoiceCraft Studio Command Palette</span>
        </div>
      </div>
    </div>
  );
};
