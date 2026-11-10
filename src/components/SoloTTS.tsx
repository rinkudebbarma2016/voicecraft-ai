import React, { useState, useEffect } from 'react';
import { VoiceName, GeneratedAudio, AccentCode, NeuralSpeaker, VoiceSettings, ClonedVoice } from '../types/tts';
import { VoiceDiscoveryStudio } from './VoiceDiscoveryStudio';
import { AccentSelector } from './AccentSelector';
import { DurationController } from './DurationController';
import { STYLE_PRESETS, SCRIPT_PRESETS, ACCENT_OPTIONS } from '../utils/presets';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import {
  calculateSpeechStats,
  base64ToAudioUrl,
  splitTextIntoChunks,
  concatenateWavBase64List,
  formatTime,
  normalizeAudioClip,
} from '../utils/audio';
import {
  Sparkles,
  Wand2,
  Trash2,
  FileText,
  Volume2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Layers,
  Infinity as InfinityIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Grid,
  Zap,
  ChevronDown,
  ChevronUp,
  Scissors,
  AudioWaveform,
} from 'lucide-react';
import { MultiVoicePreviewGrid } from './MultiVoicePreviewGrid';
import { PronunciationEntry } from '../types/pronunciation';
import {
  loadPronunciationDictionary,
  buildPronunciationPromptGuidance,
  detectDictionaryMatches,
  applyPronunciationToScript,
} from '../utils/pronunciationStorage';
import { PronunciationDictionarySection } from './PronunciationDictionarySection';
import { SentenceDirector } from './SentenceDirector';


interface SoloTTSProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
  geminiAvailable: boolean;
  onFallbackToWebSpeech: (text: string) => void;
  initialText?: string;
  initialSpeakerId?: string;
  initialDuration?: number;
  clonedVoices?: ClonedVoice[];
}

export const SoloTTS: React.FC<SoloTTSProps> = ({
  onAudioGenerated,
  geminiAvailable,
  onFallbackToWebSpeech,
  initialText,
  initialSpeakerId,
  initialDuration,
  clonedVoices = [],
}) => {
  const [text, setText] = useState<string>(
    initialText || SCRIPT_PRESETS[0].text // India UPI fintech text by default
  );

  // Neural AI Speaker selection (Default: Ashish / Priya - Indian English)
  const [selectedSpeaker, setSelectedSpeaker] = useState<NeuralSpeaker>(() => {
    if (initialSpeakerId) {
      const found = NEURAL_SPEAKERS.find((s) => s.id.toLowerCase() === initialSpeakerId.toLowerCase());
      if (found) return found;
    }
    return NEURAL_SPEAKERS[0];
  });

  useEffect(() => {
    if (initialText) setText(initialText);
    if (initialDuration) setTargetSeconds(initialDuration);
    if (initialSpeakerId) {
      const sp = NEURAL_SPEAKERS.find((s) => s.id.toLowerCase() === initialSpeakerId.toLowerCase());
      if (sp) {
        setSelectedSpeaker(sp);
        setVoice(sp.baseVoice);
      }
    }
  }, [initialText, initialSpeakerId, initialDuration]);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 50,
    clarity: 75,
    styleExaggeration: 0,
  });

  const [voice, setVoice] = useState<VoiceName>(NEURAL_SPEAKERS[0].baseVoice);
  const [accent, setAccent] = useState<AccentCode>('en-IN');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_PRESETS[0].style);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isFittingScript, setIsFittingScript] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Target duration choice in seconds (null = natural speed based on words)
  const [targetSeconds, setTargetSeconds] = useState<number | null>(null);

  // Auto-normalize post-processing toggle (-1.0 dBFS standard)
  const [autoNormalizePeak, setAutoNormalizePeak] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voicecraft_auto_normalize_peak');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleAutoNormalizePeak = () => {
    const next = !autoNormalizePeak;
    setAutoNormalizePeak(next);
    try {
      localStorage.setItem('voicecraft_auto_normalize_peak', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Pronunciation Dictionary, Sentence Director & Audition Sub-Tab navigation
  const [soloSubTab, setSoloSubTab] = useState<'script' | 'sentence-director' | 'preview-grid' | 'dictionary'>('script');
  const [showInlinePreviewGrid, setShowInlinePreviewGrid] = useState<boolean>(true);
  const [pronunciationEntries, setPronunciationEntries] = useState<PronunciationEntry[]>(() =>
    loadPronunciationDictionary()
  );

  // Multi-chunk progress tracking for unlimited words
  const [progressStatus, setProgressStatus] = useState<{
    currentChunk: number;
    totalChunks: number;
    percent: number;
  } | null>(null);

  const stats = calculateSpeechStats(text);
  const chunks = splitTextIntoChunks(text, 140);
  const activeMatches = detectDictionaryMatches(text, pronunciationEntries);

  // Speed multiplier to hit target seconds
  const requiredSpeedMultiplier =
    targetSeconds && stats.estimatedSeconds > 0
      ? Math.max(0.5, Math.min(2.5, stats.estimatedSeconds / targetSeconds))
      : 1.0;

  // Handle speaker change
  const handleSelectSpeaker = (speaker: NeuralSpeaker) => {
    setSelectedSpeaker(speaker);
    setVoice(speaker.baseVoice);
    if (speaker.accent === 'Indian English') {
      setAccent('en-IN');
    }
    setSuccessNotice(`Selected ${speaker.name} (${speaker.accent})`);
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  // Apply script preset
  const handleLoadPreset = (presetId: string) => {
    const found = SCRIPT_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setText(found.text);
      setVoice(found.recommendedVoice);
      if (found.accent) {
        setAccent(found.accent);
      }
      // If preset has matching speaker, select it
      if (found.recommendedSpeakerId) {
        const matched = NEURAL_SPEAKERS.find((s) => s.id === found.recommendedSpeakerId);
        if (matched) setSelectedSpeaker(matched);
      }
      setSelectedStyle(found.style);
      setCustomStyle('');
      setErrorMsg(null);
      setSuccessNotice(null);
    }
  };

  // AI Script Polish
  const handlePolishScript = async () => {
    if (!text.trim()) return;
    setIsPolishing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tts/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetTone: `${selectedSpeaker.name} persona: ${selectedSpeaker.stylePrompt}. ${
            customStyle || selectedStyle || 'natural voiceover'
          }`,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not polish script automatically');
      }

      const data = await res.json();
      if (data.enhancedText) {
        setText(data.enhancedText);
        setSuccessNotice('Script polished for natural speech prosody & pauses.');
        setTimeout(() => setSuccessNotice(null), 3500);
      }
    } catch (err: unknown) {
      console.warn('Script polish warning:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  // Adapt text to match exact choice time
  const handleFitScriptToTime = async (seconds: number) => {
    if (!text.trim() || seconds <= 0) return;
    setIsFittingScript(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tts/fit-to-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetSeconds: seconds,
          accent: `${selectedSpeaker.name} (${selectedSpeaker.accent})`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to adapt script to duration');
      }

      const data = await res.json();
      if (data.adaptedText) {
        setText(data.adaptedText);
        setSuccessNotice(
          `Script adapted! Now ${data.actualWords} words (~${formatTime(
            data.estimatedSeconds
          )}) to match your ${formatTime(seconds)} goal.`
        );
        setTimeout(() => setSuccessNotice(null), 5000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fit script';
      setErrorMsg(msg);
    } finally {
      setIsFittingScript(false);
    }
  };

  // Generate TTS Audio with unlimited words & target duration pacing
  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMsg('Please enter some text to speak.');
      return;
    }

    if (!geminiAvailable) {
      onFallbackToWebSpeech(text);
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    // Build rich style prompt incorporating Neural speaker style + voice tuning
    const userDirection = customStyle.trim() || selectedStyle;
    const tuningNotes = `Stability ${voiceSettings.stability}%, Clarity ${voiceSettings.clarity}%, Exaggeration ${voiceSettings.styleExaggeration}%`;
    let activeStyle = `${selectedSpeaker.stylePrompt}. Tone: ${userDirection}. (${tuningNotes})`;

    // Inject Pronunciation Dictionary guidance for detected terms
    const pronunciationGuidance = buildPronunciationPromptGuidance(pronunciationEntries, text);
    if (pronunciationGuidance) {
      activeStyle = `${activeStyle}. ${pronunciationGuidance}`;
    }

    if (targetSeconds) {
      activeStyle = `${activeStyle}. Paced to fit an exact target duration of approximately ${targetSeconds} seconds (${formatTime(
        targetSeconds
      )}).`;
    }

    const textChunks = splitTextIntoChunks(text, 140);

    try {
      // If single chunk (short text), fast direct path
      if (textChunks.length === 1) {
        setProgressStatus({ currentChunk: 1, totalChunks: 1, percent: 50 });
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            voice: selectedSpeaker.baseVoice,
            style: activeStyle,
            accent,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.code === 'NO_API_KEY') {
            onFallbackToWebSpeech(text);
            return;
          }
          throw new Error(data.error || 'Failed to synthesize audio');
        }

        let finalBase64 = data.audioBase64;
        let finalUrl = base64ToAudioUrl(data.audioBase64, 'audio/wav');
        let normStats = data.normalizationStats;

        if (autoNormalizePeak) {
          try {
            const norm = await normalizeAudioClip(finalBase64, -1.0);
            finalBase64 = norm.normalizedBase64;
            finalUrl = norm.normalizedUrl;
            normStats = norm.stats;
          } catch (e) {
            console.warn('Auto normalization fallback:', e);
          }
        }

        onAudioGenerated({
          id: `tts-${Date.now()}`,
          title: `${selectedSpeaker.flag} [${selectedSpeaker.name}] ${text.slice(0, 24).trim()}...`,
          text: text.trim(),
          audioBase64: finalBase64,
          audioUrl: finalUrl,
          voice: selectedSpeaker.baseVoice,
          speakerId: selectedSpeaker.id,
          speakerName: selectedSpeaker.name,
          accent: `${selectedSpeaker.flag} ${selectedSpeaker.accent}`,
          mode: 'solo',
          style: activeStyle,
          targetDuration: targetSeconds || undefined,
          targetSpeedMultiplier: targetSeconds ? requiredSpeedMultiplier : undefined,
          chunksCount: 1,
          totalWords: stats.words,
          timestamp: Date.now(),
          duration: targetSeconds || stats.estimatedSeconds,
          isNormalized: autoNormalizePeak,
          peakDb: -1.0,
          normalizationStats: normStats,
        });
      } else {
        // Multi-chunk path for unlimited words with live progress indicator
        const chunkAudioBase64List: string[] = [];
        const total = textChunks.length;

        for (let i = 0; i < total; i++) {
          setProgressStatus({
            currentChunk: i + 1,
            totalChunks: total,
            percent: Math.round(((i + 1) / total) * 100),
          });

          const chunkRes = await fetch('/api/tts/chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: textChunks[i],
              voice: selectedSpeaker.baseVoice,
              style: activeStyle,
              accent,
            }),
          });

          const chunkData = await chunkRes.json();
          if (!chunkRes.ok || !chunkData.audioBase64) {
            throw new Error(
              `Failed to synthesize part ${i + 1} of ${total}: ${chunkData.error || 'Unknown'}`
            );
          }

          chunkAudioBase64List.push(chunkData.audioBase64);
        }

        // Seamlessly combine all chunks into one continuous WAV file
        const combinedBase64 = concatenateWavBase64List(chunkAudioBase64List);
        let finalBase64 = combinedBase64;
        let finalUrl = base64ToAudioUrl(combinedBase64, 'audio/wav');
        let normStats = undefined;

        if (autoNormalizePeak) {
          try {
            const norm = await normalizeAudioClip(finalBase64, -1.0);
            finalBase64 = norm.normalizedBase64;
            finalUrl = norm.normalizedUrl;
            normStats = norm.stats;
          } catch (e) {
            console.warn('Auto normalization fallback:', e);
          }
        }

        onAudioGenerated({
          id: `tts-${Date.now()}`,
          title: `${selectedSpeaker.flag} [${selectedSpeaker.name}] ${text.slice(0, 24).trim()}... (${total} parts)`,
          text: text.trim(),
          audioBase64: finalBase64,
          audioUrl: finalUrl,
          voice: selectedSpeaker.baseVoice,
          speakerId: selectedSpeaker.id,
          speakerName: selectedSpeaker.name,
          accent: `${selectedSpeaker.flag} ${selectedSpeaker.accent}`,
          mode: 'solo',
          style: activeStyle,
          targetDuration: targetSeconds || undefined,
          targetSpeedMultiplier: targetSeconds ? requiredSpeedMultiplier : undefined,
          chunksCount: total,
          totalWords: stats.words,
          timestamp: Date.now(),
          duration: targetSeconds || stats.estimatedSeconds,
          isNormalized: autoNormalizePeak,
          peakDb: -1.0,
          normalizationStats: normStats,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Speech synthesis failed';
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
      setProgressStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 100% Free & Unlimited Words Guarantee Callout */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-emerald-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wide">
                100% Free & Unlimited Text-to-Speech
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                Neural Voice Discovery & Studio
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80">
              No word caps, no character limits, zero cost. Stitches unlimited words into a single continuous lossless WAV file.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/20">
          <InfinityIcon className="w-4 h-4" />
          <span>Unlimited Words • Free Forever</span>
        </div>
      </div>

      {/* Solo Studio Sub-Tabs: Script & Voice vs. 5s Audition Grid vs. Pronunciation Dictionary */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setSoloSubTab('script')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              soloSubTab === 'script'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script & Voice Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setSoloSubTab('preview-grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              soloSubTab === 'preview-grid'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>5s Multi-Voice Audition Grid</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Simultaneous Play
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSoloSubTab('dictionary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              soloSubTab === 'dictionary'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Pronunciation Dictionary</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {pronunciationEntries.filter((e) => e.enabled).length} Terms
            </span>
            {activeMatches.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 animate-pulse font-bold">
                {activeMatches.length} in script
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Post-Processing -1dB Peak Normalizer Toggle */}
          <button
            type="button"
            onClick={toggleAutoNormalizePeak}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              autoNormalizePeak
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Post-Processing Tool: Automatically normalizes volume levels of generated clips to consistent -1dB peak"
          >
            <AudioWaveform className={`w-3.5 h-3.5 ${autoNormalizePeak ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline">Post-Processing:</span>
            <span>-1dB Peak</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                autoNormalizePeak ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {autoNormalizePeak ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: 5s Multi-Voice Audition Grid Tab View */}
      {soloSubTab === 'preview-grid' ? (
        <div className="space-y-4">
          <MultiVoicePreviewGrid
            currentScriptText={text}
            selectedSpeaker={selectedSpeaker}
            onCommitSpeaker={(sp) => {
              handleSelectSpeaker(sp);
              setSuccessNotice(`✓ Voice committed: ${sp.name} (${sp.accent}) is now your active synthesizer voice.`);
              setTimeout(() => setSuccessNotice(null), 4000);
            }}
            voiceSettings={voiceSettings}
            customStyle={customStyle}
            selectedStyle={selectedStyle}
            pronunciationGuidance={buildPronunciationPromptGuidance(pronunciationEntries, text)}
          />

          {/* Quick Action Return to Studio CTA */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>
                Committed speaker <strong className="text-purple-300 font-bold">{selectedSpeaker.name}</strong> will be used for your full script synthesis.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSoloSubTab('script')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <span>Proceed with {selectedSpeaker.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : soloSubTab === 'dictionary' ? (
        <div className="space-y-4">
          <PronunciationDictionarySection
            entries={pronunciationEntries}
            onUpdateEntries={setPronunciationEntries}
            currentScriptText={text}
            onApplyToScript={(newText) => {
              setText(newText);
              setSuccessNotice('Phonetic respellings applied to your script!');
              setTimeout(() => setSuccessNotice(null), 3500);
            }}
          />

          {/* Quick Return to Script Editor CTA */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>
                Phoneme mappings will be automatically applied to your speech generation in{' '}
                <strong className="text-white">Script & Voice Studio</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSoloSubTab('script')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <span>Back to Script Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : soloSubTab === 'sentence-director' ? (
        <div className="space-y-4">
          <SentenceDirector
            initialText={text}
            defaultSpeaker={selectedSpeaker}
            onUpdateMainText={(newText) => setText(newText)}
            onAudioGenerated={onAudioGenerated}
            geminiAvailable={geminiAvailable}
            onFallbackToWebSpeech={onFallbackToWebSpeech}
          />

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>
                Finished tuning individual sentences? You can return to the full script or synthesize the master take directly.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSoloSubTab('script')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <span>Back to Script Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Script Editor Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        {/* Top Controls: Preset selector and Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Script & Text
            </label>

            {/* Presets dropdown */}
            <div className="relative">
              <select
                onChange={(e) => handleLoadPreset(e.target.value)}
                defaultValue=""
                className="bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer hover:bg-zinc-800"
              >
                <option value="" disabled>
                  Load Template Script...
                </option>
                {SCRIPT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick India Demo Button */}
            <button
              type="button"
              onClick={() => handleLoadPreset('india-upi-fintech')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-950/50 text-orange-300 border border-orange-700/50 hover:bg-orange-900/50 transition-colors flex items-center gap-1.5"
            >
              <span>🇮🇳 Indian English</span>
            </button>

            {/* Quick Long Demo Button */}
            <button
              type="button"
              onClick={() => handleLoadPreset('long-essay-cosmos')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/50 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5"
            >
              <InfinityIcon className="w-3 h-3 text-indigo-400" />
              <span>500+ Words</span>
            </button>

            {/* AI Script Polish */}
            {geminiAvailable && (
              <button
                type="button"
                onClick={handlePolishScript}
                disabled={isPolishing || !text.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 transition-colors disabled:opacity-50"
                title="Optimize pauses, phrasing and contractions for speech"
              >
                {isPolishing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                ) : (
                  <Wand2 className="w-3 h-3 text-purple-400" />
                )}
                <span>Polish Script</span>
              </button>
            )}

            {/* Sentence Director (Per-Sentence Style & Voice Tuning) Toggle */}
            <button
              type="button"
              onClick={() => setSoloSubTab('sentence-director')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer bg-purple-950/60 text-purple-300 border-purple-800/60 hover:bg-purple-900/60"
              title="Split script by punctuation for individual voice & tone tuning per sentence"
            >
              <Scissors className="w-3.5 h-3.5 text-purple-400" />
              <span>Sentence Director</span>
              <span className="text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded">
                Tuner
              </span>
            </button>

            {/* 5s Multi-Voice Audition Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowInlinePreviewGrid(!showInlinePreviewGrid)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showInlinePreviewGrid
                  ? 'bg-indigo-950/70 text-indigo-200 border-indigo-500/60 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
              }`}
              title="Toggle 5-second multi-voice audition grid"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              <span>5s Audition Grid</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded">
                Simultaneous
              </span>
            </button>

            {/* Pronunciation Dictionary Toggle */}
            <button
              type="button"
              onClick={() => setSoloSubTab('dictionary')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeMatches.length > 0
                  ? 'bg-purple-950/70 text-purple-200 border-purple-500/60 hover:bg-purple-900/60 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
              }`}
              title="Open Pronunciation Dictionary to map custom phonemes"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Dictionary</span>
              {activeMatches.length > 0 ? (
                <span className="text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded border border-purple-500/40">
                  {activeMatches.length} in script
                </span>
              ) : (
                <span className="text-[10px] font-mono text-zinc-400">
                  {pronunciationEntries.filter((e) => e.enabled).length}
                </span>
              )}
            </button>

            {/* Clear Text */}
            <button
              type="button"
              onClick={() => setText('')}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg text-xs transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste as many words as you want! Completely free with unlimited words. Long texts, articles, and chapters are automatically segmented and seamlessly stitched together into one continuous audio file..."
            rows={6}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-sm sm:text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-y font-normal leading-relaxed"
          />
        </div>

        {/* Metrics & Unlimited Words Indicator */}
        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 mt-2 px-1">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-zinc-300">{stats.words}</strong> words
            </span>
            <span>
              <strong className="text-zinc-300">{stats.characters}</strong> chars
            </span>
            <span>
              Natural Duration:{' '}
              <strong className="text-purple-400">
                {formatTime(stats.estimatedSeconds)} ({stats.estimatedSeconds}s)
              </strong>
            </span>
            {chunks.length > 1 && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Layers className="w-3.5 h-3.5" />
                <span>{chunks.length} auto-stitched audio segments</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unlimited Words Mode Active (Free)</span>
          </div>
        </div>

        {/* Active Pronunciation Matches Badge Strip */}
        {activeMatches.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-zinc-950 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-zinc-200 font-bold whitespace-nowrap">
                {activeMatches.length} Dictionary Term{activeMatches.length === 1 ? '' : 's'} Detected:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeMatches.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/60 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                  >
                    <strong className="text-white">{m.word}</strong>
                    <span className="text-zinc-400">→</span>
                    <span className="text-cyan-300">{m.phoneme}</span>
                  </span>
                ))}
                {activeMatches.length > 4 && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    +{activeMatches.length - 4} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const { transformedText, replacementCount } = applyPronunciationToScript(
                    text,
                    pronunciationEntries
                  );
                  setText(transformedText);
                  setSuccessNotice(`Replaced ${replacementCount} word(s) with phonetic respellings in script!`);
                  setTimeout(() => setSuccessNotice(null), 3500);
                }}
                className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                title="Substitute terms with phonetic spelling in editor"
              >
                Replace in text
              </button>
              <button
                type="button"
                onClick={() => setSoloSubTab('dictionary')}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold cursor-pointer border border-zinc-700/60"
              >
                Manage Dictionary
              </button>
            </div>
          </div>
        )}

        {/* Success toast notification */}
        {successNotice && (
          <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </div>

      {/* 5-Second Multi-Voice Audition Grid (Inline Studio Panel) */}
      {showInlinePreviewGrid && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Multi-Voice Audition Studio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Simultaneous Audition Available
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowInlinePreviewGrid(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Hide Grid</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <MultiVoicePreviewGrid
            currentScriptText={text}
            selectedSpeaker={selectedSpeaker}
            onCommitSpeaker={(sp) => {
              handleSelectSpeaker(sp);
              setSuccessNotice(`✓ Voice committed: ${sp.name} (${sp.accent}) is now your active synthesizer voice.`);
              setTimeout(() => setSuccessNotice(null), 4000);
            }}
            voiceSettings={voiceSettings}
            customStyle={customStyle}
            selectedStyle={selectedStyle}
            pronunciationGuidance={buildPronunciationPromptGuidance(pronunciationEntries, text)}
          />
        </div>
      )}

      {!showInlinePreviewGrid && (
        <button
          type="button"
          onClick={() => setShowInlinePreviewGrid(true)}
          className="w-full p-3.5 rounded-2xl bg-zinc-900/60 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-zinc-900 text-zinc-300 text-xs font-medium flex items-center justify-between transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
              <Grid className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white block">
                Open Multi-Voice 5-Second Audition Grid
              </span>
              <span className="text-[11px] text-zinc-400">
                Audition & listen to multiple voices simultaneously on a 5-second preview of your script before synthesizing
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-indigo-400 font-semibold text-xs">
            <span>Expand Audition Grid</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Target Audio Duration & Choice Time Pacing Controller */}
      <DurationController
        currentWords={stats.words}
        naturalEstimatedSeconds={stats.estimatedSeconds}
        targetSeconds={targetSeconds}
        onTargetSecondsChange={(secs) => setTargetSeconds(secs)}
        onFitScriptToTime={handleFitScriptToTime}
        isFittingScript={isFittingScript}
        requiredSpeedMultiplier={requiredSpeedMultiplier}
      />

      {/* Neural Voice Discovery Studio: Categories, Languages & Sliders */}
      <VoiceDiscoveryStudio
        selectedSpeaker={selectedSpeaker}
        onSelectSpeaker={handleSelectSpeaker}
        voiceSettings={voiceSettings}
        onVoiceSettingsChange={setVoiceSettings}
        clonedVoices={clonedVoices}
        onAudioGenerated={onAudioGenerated}
      />

      {/* Speech Style & Performance Direction */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Vocal Emotion & Delivery Style
          </label>
          <span className="text-[11px] text-zinc-500">Fine-tune vocal cadence</span>
        </div>

        {/* Style Presets Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STYLE_PRESETS.map((p) => {
            const isActive = !customStyle && selectedStyle === p.style;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(p.style);
                  setCustomStyle('');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-purple-950/60 border-purple-500/70 text-purple-200 ring-1 ring-purple-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                <div className="font-medium truncate">{p.label}</div>
                <div className="text-[10px] text-zinc-500 mt-1 capitalize">{p.badge}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Style Input */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Custom style or acting notes:</span>
            {customStyle && (
              <button
                onClick={() => setCustomStyle('')}
                className="text-[11px] text-purple-400 hover:underline"
              >
                Reset to preset
              </button>
            )}
          </div>
          <input
            type="text"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder="e.g. Warm Indian documentary narrator with quiet reverence, or high energy cricket commentary..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Multi-chunk Generation Progress Bar */}
      {isGenerating && progressStatus && (
        <div className="p-4 bg-zinc-900 border border-purple-500/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>
                Synthesizing unlimited speech segment {progressStatus.currentChunk} of{' '}
                {progressStatus.totalChunks}...
              </span>
            </span>
            <span className="font-mono text-purple-400 font-bold">{progressStatus.percent}%</span>
          </div>

          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progressStatus.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            Segments are automatically converted into pristine 24kHz lossless WAV and seamlessly concatenated into a single audio file.
          </p>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => onFallbackToWebSpeech(text)}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-900 rounded-lg text-white font-medium text-[11px] shrink-0 transition-colors"
          >
            Try Instant Web Speech
          </button>
        </div>
      )}

      {/* Main Generate CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            Speaker: <strong className="text-purple-300">{selectedSpeaker.name}</strong> ({selectedSpeaker.accent}) • Target Length:{' '}
            <strong className="text-cyan-300">
              {targetSeconds
                ? `${formatTime(targetSeconds)} (${targetSeconds}s)`
                : `Natural (~${formatTime(stats.estimatedSeconds)})`}
            </strong>{' '}
            • 100% Free
          </span>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={isGenerating || !text.trim()}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 shadow-xl shadow-purple-600/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Speech ({selectedSpeaker.name})...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>
                Synthesize Speech ({selectedSpeaker.name} • {stats.words} words
                {targetSeconds ? ` • ${formatTime(targetSeconds)} target` : ''}
                {chunks.length > 1 ? ` • ${chunks.length} parts` : ''})
              </span>
            </>
          )}
        </button>
      </div>
      </>
      )}
    </div>
  );
};
