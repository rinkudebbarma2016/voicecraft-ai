import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Play,
  Pause,
  Sparkles,
  Volume2,
  Trash2,
  Plus,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  Layers,
  Wand2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { NeuralSpeaker, GeneratedAudio } from '../types/tts';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import {
  SentenceSegment,
  EMOTION_STYLE_PRESETS,
  splitTextIntoSentenceSegments,
  synthesizeSentenceAudio,
  stitchSentenceAudios,
} from '../utils/sentenceSegmenter';
import { formatTime } from '../utils/audio';

interface SentenceDirectorProps {
  initialText: string;
  defaultSpeaker: NeuralSpeaker;
  onUpdateMainText: (text: string) => void;
  onAudioGenerated: (audio: GeneratedAudio) => void;
  geminiAvailable: boolean;
  onFallbackToWebSpeech: (text: string) => void;
}

export const SentenceDirector: React.FC<SentenceDirectorProps> = ({
  initialText,
  defaultSpeaker,
  onUpdateMainText,
  onAudioGenerated,
  geminiAvailable,
  onFallbackToWebSpeech,
}) => {
  const [segments, setSegments] = useState<SentenceSegment[]>(() =>
    splitTextIntoSentenceSegments(initialText, defaultSpeaker.id)
  );

  const [activeAuditionId, setActiveAuditionId] = useState<string | null>(null);
  const [isPlayingFullSequence, setIsPlayingFullSequence] = useState<boolean>(false);
  const [isSynthesizingMaster, setIsSynthesizingMaster] = useState<boolean>(false);
  const [masterProgress, setMasterProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync if initial text changes and we don't have segments yet
  useEffect(() => {
    if (segments.length === 0 && initialText.trim()) {
      setSegments(splitTextIntoSentenceSegments(initialText, defaultSpeaker.id));
    }
  }, [initialText, defaultSpeaker.id]);

  // Re-split from current parent text
  const handleResplit = () => {
    const fresh = splitTextIntoSentenceSegments(initialText, defaultSpeaker.id);
    setSegments(fresh);
    setSuccessNotice(`Auto-split script into ${fresh.length} logical sentence segments!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Update single segment field
  const handleUpdateSegment = (id: string, updates: Partial<SentenceSegment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates, audioBase64: updates.text || updates.speakerId || updates.style ? undefined : seg.audioBase64, audioUrl: updates.text || updates.speakerId || updates.style ? undefined : seg.audioUrl } : seg))
    );
  };

  // Add new sentence segment
  const handleAddSegment = () => {
    const nextIdx = segments.length + 1;
    const newSeg: SentenceSegment = {
      id: `seg-${Date.now()}-${nextIdx}`,
      index: nextIdx,
      text: 'New sentence script segment here.',
      speakerId: defaultSpeaker.id,
      style: EMOTION_STYLE_PRESETS[0].prompt,
      speedMultiplier: 1.0,
      estimatedSeconds: 2.0,
    };
    setSegments((prev) => [...prev, newSeg]);
  };

  // Remove segment
  const handleRemoveSegment = (id: string) => {
    setSegments((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, index: idx + 1 }));
    });
  };

  // Audition single sentence
  const handleAuditionSentence = async (segment: SentenceSegment) => {
    if (activeAuditionId === segment.id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setActiveAuditionId(null);
      return;
    }

    if (!geminiAvailable) {
      onFallbackToWebSpeech(segment.text);
      return;
    }

    setErrorNotice(null);

    // If audio already generated, play it immediately
    if (segment.audioUrl) {
      playAudioUrl(segment.audioUrl, segment.id);
      return;
    }

    // Synthesize on the fly
    handleUpdateSegment(segment.id, { isGenerating: true });
    try {
      const spk = NEURAL_SPEAKERS.find((s: NeuralSpeaker) => s.id === segment.speakerId) || defaultSpeaker;
      const result = await synthesizeSentenceAudio(segment, spk, spk.accent === 'Indian English' ? 'en-IN' : 'en-US');
      handleUpdateSegment(segment.id, {
        audioBase64: result.audioBase64,
        audioUrl: result.audioUrl,
        isGenerating: false,
      });
      playAudioUrl(result.audioUrl, segment.id);
    } catch (err: any) {
      handleUpdateSegment(segment.id, { isGenerating: false, error: err.message });
      setErrorNotice(`Sentence #${segment.index} notice: ${err.message}`);
    }
  };

  const playAudioUrl = (url: string, id: string) => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    const audio = audioPlayerRef.current;
    audio.src = url;
    audio.onended = () => setActiveAuditionId(null);
    audio.onerror = () => setActiveAuditionId(null);
    audio.play();
    setActiveAuditionId(id);
  };

  // Master Take Synthesis: generate missing sentence audios and stitch into one unified take
  const handleSynthesizeMasterTake = async () => {
    if (segments.length === 0) {
      setErrorNotice('No sentence segments available.');
      return;
    }

    if (!geminiAvailable) {
      onFallbackToWebSpeech(segments.map((s) => s.text).join(' '));
      return;
    }

    setIsSynthesizingMaster(true);
    setErrorNotice(null);

    const workingSegments = [...segments];

    try {
      for (let i = 0; i < workingSegments.length; i++) {
        const seg = workingSegments[i];
        setMasterProgress({ current: i + 1, total: workingSegments.length });

        if (!seg.audioBase64) {
          handleUpdateSegment(seg.id, { isGenerating: true });
          const spk = NEURAL_SPEAKERS.find((s: NeuralSpeaker) => s.id === seg.speakerId) || defaultSpeaker;
          const res = await synthesizeSentenceAudio(seg, spk, spk.accent === 'Indian English' ? 'en-IN' : 'en-US');
          seg.audioBase64 = res.audioBase64;
          seg.audioUrl = res.audioUrl;
          handleUpdateSegment(seg.id, {
            audioBase64: res.audioBase64,
            audioUrl: res.audioUrl,
            isGenerating: false,
          });
        }
      }

      // Stitch all audios together
      const { combinedBase64, audioUrl } = stitchSentenceAudios(workingSegments);
      const combinedText = workingSegments.map((s) => s.text).join(' ');
      const totalWords = combinedText.split(/\s+/).filter(Boolean).length;
      const totalEstimatedSeconds = workingSegments.reduce(
        (sum, s) => sum + (s.estimatedSeconds || 2),
        0
      );

      // Push to main project audio
      onAudioGenerated({
        id: `master-sentence-${Date.now()}`,
        title: `Sentence-Tuned Master Take (${workingSegments.length} sentences)`,
        text: combinedText,
        audioBase64: combinedBase64,
        audioUrl,
        voice: defaultSpeaker.baseVoice,
        speakerId: defaultSpeaker.id,
        speakerName: `${workingSegments.length} Tuned Sentences`,
        accent: `${defaultSpeaker.flag} Multi-Tone Master`,
        mode: 'solo',
        style: `Sentence Director with individual styles across ${workingSegments.length} segments`,
        chunksCount: workingSegments.length,
        totalWords,
        timestamp: Date.now(),
        duration: totalEstimatedSeconds,
      });

      // Update parent script
      onUpdateMainText(combinedText);

      setSuccessNotice(
        `Master take created! Stitched ${workingSegments.length} tuned sentences into a single unified master audio track.`
      );
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error('Master synthesis error:', err);
      setErrorNotice(err.message || 'Failed to synthesize master take');
    } finally {
      setIsSynthesizingMaster(false);
      setMasterProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-purple-950/60 via-zinc-900 to-indigo-950/50 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30">
              <Scissors className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold text-white">
              Sentence Director • Per-Sentence Style & Voice Tuning
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50">
              {segments.length} Sentences
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Automatically splits script by punctuation. Assign unique neural actors, vocal styles, and emotions per sentence, then audition and fuse into a master track.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResplit}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition border border-zinc-700"
            title="Re-split text based on latest script"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            Re-Split Script
          </button>

          <button
            type="button"
            onClick={handleAddSegment}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-purple-300 hover:text-white flex items-center gap-1.5 transition border border-purple-500/30"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            Add Sentence
          </button>

          <button
            type="button"
            onClick={handleSynthesizeMasterTake}
            disabled={isSynthesizingMaster || segments.length === 0}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
          >
            {isSynthesizingMaster ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing ({masterProgress?.current}/{masterProgress?.total})...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Fuse Master Take
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notices */}
      {errorNotice && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Sentence Rows Grid */}
      <div className="space-y-3">
        {segments.map((seg) => {
          const assignedSpeaker =
            NEURAL_SPEAKERS.find((s: NeuralSpeaker) => s.id === seg.speakerId) || defaultSpeaker;
          const isCurrentAudition = activeAuditionId === seg.id;

          return (
            <div
              key={seg.id}
              className={`bg-zinc-900/90 border transition-all rounded-xl p-3.5 shadow-sm ${
                isCurrentAudition
                  ? 'border-purple-500/80 ring-1 ring-purple-500/40 bg-purple-950/20'
                  : 'border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              {/* Header: Sentence index + Speaker dropdown + Emotion chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/70">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-950/80 border border-purple-700/60 text-purple-300 font-bold text-xs flex items-center justify-center">
                    {seg.index}
                  </span>

                  {/* Speaker Selector */}
                  <div className="relative">
                    <select
                      value={seg.speakerId}
                      onChange={(e) => handleUpdateSegment(seg.id, { speakerId: e.target.value })}
                      className="bg-zinc-950 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-purple-500 pr-7 appearance-none cursor-pointer"
                    >
                      {NEURAL_SPEAKERS.map((s: NeuralSpeaker) => (
                        <option key={s.id} value={s.id}>
                          {s.flag} {s.name} ({s.gender}, {s.accent.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-2 pointer-events-none" />
                  </div>

                  <span className="text-[11px] text-zinc-400 font-mono">
                    ~{seg.estimatedSeconds}s
                  </span>
                </div>

                {/* Right controls: Audition + Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAuditionSentence(seg)}
                    disabled={seg.isGenerating}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isCurrentAudition
                        ? 'bg-purple-600 text-white'
                        : seg.audioUrl
                        ? 'bg-purple-950/80 border border-purple-700/60 text-purple-300 hover:bg-purple-900'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                    title={seg.audioUrl ? 'Re-listen to tuned sentence' : 'Synthesize & listen to sentence'}
                  >
                    {seg.isGenerating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                        Rendering...
                      </>
                    ) : isCurrentAudition ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Playing
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        {seg.audioUrl ? 'Replay' : 'Audition'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSegment(seg.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition"
                    title="Delete sentence"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable sentence text */}
              <div className="mb-2.5">
                <textarea
                  value={seg.text}
                  onChange={(e) => handleUpdateSegment(seg.id, { text: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg p-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Emotion / Vocal Tone Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 flex items-center gap-1">
                  <Sliders className="w-2.5 h-2.5 text-purple-400" />
                  Tone:
                </span>
                {EMOTION_STYLE_PRESETS.map((preset) => {
                  const isSelected = seg.style === preset.prompt;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleUpdateSegment(seg.id, { style: preset.prompt })}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition font-medium ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
