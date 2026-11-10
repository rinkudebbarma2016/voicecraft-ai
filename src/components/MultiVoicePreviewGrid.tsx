import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeuralSpeaker, VoiceSettings } from '../types/tts';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import { base64ToAudioUrl } from '../utils/audio';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Check,
  CheckCircle2,
  Sparkles,
  Loader2,
  RefreshCw,
  Sliders,
  Layers,
  Zap,
  Grid,
  Radio,
  X,
  Plus,
  Headphones,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Music,
} from 'lucide-react';

interface MultiVoicePreviewGridProps {
  currentScriptText: string;
  selectedSpeaker: NeuralSpeaker;
  onCommitSpeaker: (speaker: NeuralSpeaker) => void;
  voiceSettings: VoiceSettings;
  customStyle?: string;
  selectedStyle?: string;
  pronunciationGuidance?: string;
}

interface VoicePreviewItem {
  speakerId: string;
  speaker: NeuralSpeaker;
  audioUrl: string | null;
  audioBase64: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  volume: number;
  isMuted: boolean;
}

// Quick presets for fast auditioning
const PRESET_COLLECTIONS: Array<{ label: string; icon: string; ids: string[] }> = [
  {
    label: 'Indian English Suite',
    icon: '🇮🇳',
    ids: ['ashish', 'vikrant', 'monika_sogam', 'priya'],
  },
  {
    label: 'Global Narrators',
    icon: '🌐',
    ids: ['fenrir', 'kore', 'zephyr', 'charon'],
  },
  {
    label: 'Youth & Tech',
    icon: '⚡',
    ids: ['aarav', 'puck', 'ananya', 'ashish'],
  },
  {
    label: 'Top 6 Studio Mix',
    icon: '⭐',
    ids: ['ashish', 'vikrant', 'monika_sogam', 'priya', 'fenrir', 'kore'],
  },
];

export const MultiVoicePreviewGrid: React.FC<MultiVoicePreviewGridProps> = ({
  currentScriptText,
  selectedSpeaker,
  onCommitSpeaker,
  voiceSettings,
  customStyle,
  selectedStyle,
  pronunciationGuidance,
}) => {
  // Extract roughly 12-15 words (~5.0 seconds of natural speech) from the script
  const getInitialSnippet = (raw: string) => {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return 'VoiceCraft Studio delivers hyper-realistic neural speech with cinematic emotion and clarity.';
    }
    // Take first 12-15 words
    const slice = words.slice(0, 14).join(' ');
    // Ensure clean sentence termination for natural 5-second flow
    return slice.replace(/[,;:]$/, '') + '.';
  };

  const [previewSnippet, setPreviewSnippet] = useState<string>(() =>
    getInitialSnippet(currentScriptText)
  );
  const [isEditingSnippet, setIsEditingSnippet] = useState(false);

  // Selected candidate speaker IDs (defaults to Top 4 Indian & Global voices including currently selected)
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>(() => {
    const base = ['ashish', 'vikrant', 'monika_sogam', 'priya'];
    if (!base.includes(selectedSpeaker.id)) {
      base.unshift(selectedSpeaker.id);
    }
    return base.slice(0, 4);
  });

  // Previews map keyed by speaker ID
  const [previews, setPreviews] = useState<Record<string, VoicePreviewItem>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [soloMode, setSoloMode] = useState(false); // If true, playing one pauses others
  const [notice, setNotice] = useState<string | null>(null);

  // Audio HTML elements map
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Clean up audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach((el) => {
        el.pause();
        el.src = '';
      });
      audioElementsRef.current = {};
    };
  }, []);

  // Sync preview snippet when parent text updates if user hasn't manually customized it
  useEffect(() => {
    if (!isEditingSnippet && currentScriptText) {
      setPreviewSnippet(getInitialSnippet(currentScriptText));
    }
  }, [currentScriptText, isEditingSnippet]);

  // Handle preset selection
  const handleApplyPreset = (presetIds: string[]) => {
    // Stop any active playback
    stopAllAudio();
    setSelectedVoiceIds(presetIds);
  };

  // Toggle single voice selection
  const handleToggleVoiceSelection = (id: string) => {
    stopAllAudio();
    if (selectedVoiceIds.includes(id)) {
      if (selectedVoiceIds.length <= 1) {
        showToast('At least 1 voice must remain selected.');
        return;
      }
      setSelectedVoiceIds((prev) => prev.filter((v) => v !== id));
    } else {
      if (selectedVoiceIds.length >= 8) {
        showToast('Maximum 8 voices can be auditioned simultaneously for optimal performance.');
        return;
      }
      setSelectedVoiceIds((prev) => [...prev, id]);
    }
  };

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Build audio element for a given voice preview
  const setupAudioElement = useCallback((speakerId: string, url: string) => {
    if (audioElementsRef.current[speakerId]) {
      audioElementsRef.current[speakerId].pause();
      audioElementsRef.current[speakerId].src = '';
    }

    const audio = new Audio(url);
    audio.preload = 'auto';

    audio.onended = () => {
      setPreviews((prev) => {
        if (!prev[speakerId]) return prev;
        return {
          ...prev,
          [speakerId]: {
            ...prev[speakerId],
            isPlaying: false,
            currentTime: 0,
          },
        };
      });
      checkIfAllEnded();
    };

    audio.ontimeupdate = () => {
      setPreviews((prev) => {
        if (!prev[speakerId]) return prev;
        return {
          ...prev,
          [speakerId]: {
            ...prev[speakerId],
            currentTime: audio.currentTime,
            duration: audio.duration || 5.0,
          },
        };
      });
    };

    audio.onerror = () => {
      setPreviews((prev) => {
        if (!prev[speakerId]) return prev;
        return {
          ...prev,
          [speakerId]: {
            ...prev[speakerId],
            isPlaying: false,
            error: 'Audio playback failed',
          },
        };
      });
    };

    audioElementsRef.current[speakerId] = audio;
  }, []);

  const checkIfAllEnded = () => {
    const isAnyStillPlaying = Object.values(audioElementsRef.current).some(
      (el) => !el.paused && !el.ended
    );
    if (!isAnyStillPlaying) {
      setIsPlayingAll(false);
    }
  };

  // Generate 5-second previews in parallel for all selected voices
  const handleGeneratePreviews = async () => {
    if (selectedVoiceIds.length === 0) return;
    stopAllAudio();
    setIsGeneratingAll(true);

    const initialMap: Record<string, VoicePreviewItem> = { ...previews };
    selectedVoiceIds.forEach((id) => {
      const sp = NEURAL_SPEAKERS.find((s) => s.id === id);
      if (sp) {
        initialMap[id] = {
          speakerId: id,
          speaker: sp,
          audioUrl: initialMap[id]?.audioUrl || null,
          audioBase64: initialMap[id]?.audioBase64 || null,
          isLoading: true,
          isPlaying: false,
          currentTime: 0,
          duration: 5.0,
          error: null,
          volume: 1.0,
          isMuted: false,
        };
      }
    });
    setPreviews(initialMap);

    const snippetText = previewSnippet.trim() || 'Welcome to VoiceCraft Studio neural voice auditioning.';

    // Run parallel calls
    const promises = selectedVoiceIds.map(async (speakerId) => {
      const speaker = NEURAL_SPEAKERS.find((s) => s.id === speakerId);
      if (!speaker) return;

      const userDirection = customStyle?.trim() || selectedStyle || 'natural speech';
      const tuningNotes = `Stability ${voiceSettings.stability}%, Clarity ${voiceSettings.clarity}%`;
      let styleDesc = `${speaker.stylePrompt}. Tone: ${userDirection}. (${tuningNotes}). Target 5-second punchy preview snippet.`;
      if (pronunciationGuidance) {
        styleDesc = `${styleDesc}. ${pronunciationGuidance}`;
      }

      try {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: snippetText,
            voice: speaker.baseVoice,
            style: styleDesc,
            accent: speaker.accent === 'Indian English' ? 'en-IN' : 'global',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || 'Preview synthesis failed');
        }

        const url = base64ToAudioUrl(data.audioBase64, 'audio/wav');
        setupAudioElement(speakerId, url);

        setPreviews((prev) => ({
          ...prev,
          [speakerId]: {
            speakerId,
            speaker,
            audioUrl: url,
            audioBase64: data.audioBase64,
            isLoading: false,
            isPlaying: false,
            currentTime: 0,
            duration: data.duration || 5.0,
            error: null,
            volume: 1.0,
            isMuted: false,
          },
        }));
      } catch (err: unknown) {
        const errStr = err instanceof Error ? err.message : 'Failed to generate';
        setPreviews((prev) => ({
          ...prev,
          [speakerId]: {
            speakerId,
            speaker,
            audioUrl: null,
            audioBase64: null,
            isLoading: false,
            isPlaying: false,
            currentTime: 0,
            duration: 5.0,
            error: errStr,
            volume: 1.0,
            isMuted: false,
          },
        }));
      }
    });

    await Promise.allSettled(promises);
    setIsGeneratingAll(false);
    showToast(`Generated 5s previews for ${selectedVoiceIds.length} voices!`);
  };

  // Play / Pause a single voice
  const handleTogglePlay = (speakerId: string) => {
    const audio = audioElementsRef.current[speakerId];
    if (!audio) return;

    if (audio.paused) {
      if (soloMode) {
        // Pause all other audio
        Object.entries(audioElementsRef.current).forEach(([otherId, otherAudio]) => {
          if (otherId !== speakerId) {
            otherAudio.pause();
            setPreviews((prev) => ({
              ...prev,
              [otherId]: prev[otherId] ? { ...prev[otherId], isPlaying: false } : prev[otherId],
            }));
          }
        });
      }
      audio.play().then(() => {
        setPreviews((prev) => ({
          ...prev,
          [speakerId]: { ...prev[speakerId], isPlaying: true },
        }));
      }).catch((e) => console.warn('Audio play error:', e));
    } else {
      audio.pause();
      setPreviews((prev) => ({
        ...prev,
        [speakerId]: { ...prev[speakerId], isPlaying: false },
      }));
      checkIfAllEnded();
    }
  };

  // Play ALL previews simultaneously
  const handlePlayAllSimultaneously = () => {
    let playCount = 0;
    selectedVoiceIds.forEach((id) => {
      const audio = audioElementsRef.current[id];
      if (audio && previews[id]?.audioUrl) {
        audio.currentTime = 0;
        audio.play().then(() => {
          setPreviews((prev) => ({
            ...prev,
            [id]: { ...prev[id], isPlaying: true, currentTime: 0 },
          }));
        }).catch((e) => console.warn('Simultaneous play error:', e));
        playCount++;
      }
    });

    if (playCount > 0) {
      setIsPlayingAll(true);
      showToast(`Playing ${playCount} voices simultaneously`);
    } else {
      showToast('Generate previews first before playing.');
    }
  };

  // Stop all audio
  const stopAllAudio = () => {
    Object.entries(audioElementsRef.current).forEach(([id, audio]) => {
      audio.pause();
      audio.currentTime = 0;
      setPreviews((prev) => ({
        ...prev,
        [id]: prev[id] ? { ...prev[id], isPlaying: false, currentTime: 0 } : prev[id],
      }));
    });
    setIsPlayingAll(false);
  };

  // Toggle Mute per voice
  const handleToggleMute = (speakerId: string) => {
    const audio = audioElementsRef.current[speakerId];
    if (!audio) return;
    const currentlyMuted = previews[speakerId]?.isMuted || false;
    audio.muted = !currentlyMuted;
    setPreviews((prev) => ({
      ...prev,
      [speakerId]: { ...prev[speakerId], isMuted: !currentlyMuted },
    }));
  };

  // Commit selected voice
  const handleCommitVoice = (speaker: NeuralSpeaker) => {
    stopAllAudio();
    onCommitSpeaker(speaker);
    showToast(`✓ Voice Committed: ${speaker.name} (${speaker.accent}) is now your active synthesizer voice.`);
  };

  const hasAnyAudioGenerated = selectedVoiceIds.some((id) => previews[id]?.audioUrl);

  return (
    <div className="bg-zinc-900/90 border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-sm">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header & Feature Tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25">
              <Grid className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Voice 5-Second Preview Grid
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                Simultaneous Audition
              </span>
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Compare multiple neural speakers side-by-side or play them simultaneously on a short ~5-second snippet of your text before committing.
          </p>
        </div>

        {/* Current Active Speaker Badge */}
        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs shrink-0">
          <span className="text-zinc-400">Current Voice:</span>
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <span>{selectedSpeaker.flag}</span>
            <span>{selectedSpeaker.name}</span>
            <span className="text-[10px] text-zinc-500 font-normal">({selectedSpeaker.accent})</span>
          </div>
        </div>
      </div>

      {/* Script Audition Snippet Bar */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <Headphones className="w-3.5 h-3.5 text-purple-400" />
            <span>5-Second Audition Snippet:</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({previewSnippet.trim().split(/\s+/).length} words • ~5.0s preview)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingSnippet(!isEditingSnippet)}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
          >
            {isEditingSnippet ? 'Done Editing' : 'Customize Snippet'}
          </button>
        </div>

        {isEditingSnippet ? (
          <div className="space-y-1.5">
            <textarea
              rows={2}
              value={previewSnippet}
              onChange={(e) => setPreviewSnippet(e.target.value)}
              placeholder="Enter ~12-15 words to audition across multiple voices..."
              className="w-full bg-zinc-900 border border-purple-500/40 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-2 text-[10px] text-zinc-500">
              <span>Tip: 12-15 words is ideal for a fast ~5-second voice comparison.</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 italic font-sans leading-relaxed">
            "{previewSnippet}"
          </p>
        )}
      </div>

      {/* Presets & Voice Selectors */}
      <div className="space-y-3 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Select Voices to Audition ({selectedVoiceIds.length}/8)
          </span>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 mr-1">Audition Presets:</span>
            {PRESET_COLLECTIONS.map((preset) => {
              const isSelected =
                preset.ids.length === selectedVoiceIds.length &&
                preset.ids.every((id) => selectedVoiceIds.includes(id));
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.ids)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/40'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Selection Chips */}
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-950/40 rounded-xl border border-zinc-800/50">
          {NEURAL_SPEAKERS.map((sp) => {
            const isSelected = selectedVoiceIds.includes(sp.id);
            const isCurrentActive = selectedSpeaker.id === sp.id;
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => handleToggleVoiceSelection(sp.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/30 shadow-sm'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{sp.flag}</span>
                <span>{sp.name}</span>
                {isCurrentActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Currently selected voice" />
                )}
                {isSelected && <Check className="w-3 h-3 text-purple-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Action & Playback Bar */}
      <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3 relative z-10 shadow-inner">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Generate Button */}
          <button
            type="button"
            onClick={handleGeneratePreviews}
            disabled={isGeneratingAll || selectedVoiceIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating {selectedVoiceIds.length} Previews...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Generate 5s Previews ({selectedVoiceIds.length} Voices)</span>
              </>
            )}
          </button>

          {/* Master Play All Simultaneously Button */}
          <button
            type="button"
            onClick={isPlayingAll ? stopAllAudio : handlePlayAllSimultaneously}
            disabled={!hasAnyAudioGenerated || isGeneratingAll}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              isPlayingAll
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isPlayingAll ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Stop Simultaneous Playback</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All Simultaneously</span>
              </>
            )}
          </button>

          {/* Master Stop Button */}
          {hasAnyAudioGenerated && (
            <button
              type="button"
              onClick={stopAllAudio}
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700/60 cursor-pointer transition-colors"
            >
              Stop All
            </button>
          )}
        </div>

        {/* Solo vs Multi Listen Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloMode}
              onChange={(e) => setSoloMode(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-900 border-zinc-700 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-zinc-300">
              Solo Audition Mode (Auto-pause others on play)
            </span>
          </label>
        </div>
      </div>

      {/* Toast Notice */}
      {notice && (
        <div className="p-2.5 bg-purple-950/80 border border-purple-500/40 rounded-xl text-purple-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of Candidate Voice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
        {selectedVoiceIds.map((speakerId) => {
          const speaker = NEURAL_SPEAKERS.find((s) => s.id === speakerId);
          if (!speaker) return null;

          const preview = previews[speakerId];
          const isCurrentActive = selectedSpeaker.id === speaker.id;
          const isPlaying = preview?.isPlaying || false;
          const isLoading = preview?.isLoading || false;
          const hasAudio = Boolean(preview?.audioUrl);
          const currentTime = preview?.currentTime || 0;
          const duration = preview?.duration || 5.0;
          const progressPercent = Math.min(100, (currentTime / (duration || 5.0)) * 100);

          return (
            <div
              key={speakerId}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isCurrentActive
                  ? 'bg-zinc-900/90 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xl'
                  : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/70'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Speaker Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${speaker.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 relative`}
                    >
                      {speaker.name[0]}
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {speaker.flag}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white leading-tight">
                          {speaker.name}
                        </span>
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block">
                        {speaker.accent} • {speaker.gender}
                      </span>
                    </div>
                  </div>

                  {/* Remove from selection button */}
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceSelection(speaker.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
                    title="Remove from audition grid"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speaker Persona Tags */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                    {speaker.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-500/30">
                    {speaker.useCase}
                  </span>
                </div>

                {/* Animated Mini Waveform Visualizer & Status */}
                <div className="h-10 bg-zinc-900/90 rounded-xl px-3 flex items-center justify-between border border-zinc-800/60">
                  <div className="flex items-center gap-1">
                    {isPlaying ? (
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1 bg-purple-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
                        <span className="w-1 bg-indigo-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-5" />
                        <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite] h-4" />
                        <span className="w-1 bg-purple-400 rounded-full animate-[bounce_0.7s_ease-in-out_infinite] h-2" />
                        <span className="w-1 bg-indigo-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-30">
                        <span className="w-1 bg-zinc-500 rounded-full h-2" />
                        <span className="w-1 bg-zinc-500 rounded-full h-3" />
                        <span className="w-1 bg-zinc-500 rounded-full h-2" />
                        <span className="w-1 bg-zinc-500 rounded-full h-4" />
                        <span className="w-1 bg-zinc-500 rounded-full h-1" />
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-zinc-400 ml-1.5">
                      {hasAudio
                        ? `${currentTime.toFixed(1)}s / ${(duration || 5.0).toFixed(1)}s`
                        : isLoading
                        ? 'Synthesizing...'
                        : 'Ready to generate'}
                    </span>
                  </div>

                  {/* Individual Mute Toggle */}
                  {hasAudio && (
                    <button
                      type="button"
                      onClick={() => handleToggleMute(speaker.id)}
                      className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                      title={preview?.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {preview?.isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Progress Scrubber */}
                {hasAudio && (
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-100"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Error message if synthesis failed */}
                {preview?.error && (
                  <div className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{preview.error}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Play & Commit Action */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                {/* Play / Pause Audition Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePlay(speaker.id)}
                  disabled={!hasAudio || isLoading}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                      : hasAudio
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-800/60 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{hasAudio ? 'Audition 5s' : 'Generate First'}</span>
                    </>
                  )}
                </button>

                {/* Commit / Select Button */}
                <button
                  type="button"
                  onClick={() => handleCommitVoice(speaker)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isCurrentActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-400'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                  }`}
                  title={isCurrentActive ? 'Already chosen as active speaker' : 'Commit this voice for full synthesis'}
                >
                  {isCurrentActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Committed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Commit Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
