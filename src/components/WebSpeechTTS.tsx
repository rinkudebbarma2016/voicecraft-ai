import React, { useState, useEffect } from 'react';
import { WebSpeechHelper, calculateSpeechStats } from '../utils/audio';
import { Zap, Play, Square, Pause, Globe, Filter, Infinity as InfinityIcon } from 'lucide-react';

interface WebSpeechTTSProps {
  initialText?: string;
}

export const WebSpeechTTS: React.FC<WebSpeechTTSProps> = ({ initialText = '' }) => {
  const [text, setText] = useState<string>(
    initialText ||
      "Namaste! This is instant local browser speech synthesis with full support for Indian English accents and unlimited words without any browser timeouts."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filterIndianOnly, setFilterIndianOnly] = useState<boolean>(false);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sentenceProgress, setSentenceProgress] = useState<{ current: number; total: number } | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const available = WebSpeechHelper.getVoices();
      setVoices(available);

      if (available.length > 0 && !selectedVoiceUri) {
        // Prioritize Indian English voice if available
        const indianVoice = available.find(
          (v) =>
            v.lang.toLowerCase() === 'en-in' ||
            v.lang.toLowerCase().includes('en_in') ||
            v.name.toLowerCase().includes('india')
        );
        const defaultVoice = indianVoice || available.find((v) => v.lang.startsWith('en')) || available[0];
        setSelectedVoiceUri(defaultVoice.voiceURI);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceUri]);

  // Update text if initialText passed from fallback
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const stats = calculateSpeechStats(text);

  // Filtered voice list
  const displayedVoices = filterIndianOnly
    ? voices.filter(
        (v) =>
          v.lang.toLowerCase() === 'en-in' ||
          v.lang.toLowerCase().includes('en_in') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi')
      )
    : voices;

  const indianVoiceCount = voices.filter(
    (v) =>
      v.lang.toLowerCase() === 'en-in' ||
      v.lang.toLowerCase().includes('en_in') ||
      v.name.toLowerCase().includes('india')
  ).length;

  const handleSpeak = () => {
    if (!text.trim()) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    const currentVoice = voices.find((v) => v.voiceURI === selectedVoiceUri) || null;

    setIsSpeaking(true);
    setIsPaused(false);

    WebSpeechHelper.speakUnlimited(
      text.trim(),
      currentVoice,
      rate,
      pitch,
      volume,
      (current, total) => {
        setSentenceProgress({ current, total });
      },
      () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSentenceProgress(null);
      },
      () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSentenceProgress(null);
      }
    );
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  };

  const handleStop = () => {
    WebSpeechHelper.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setSentenceProgress(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-orange-950/30 via-zinc-900/50 to-amber-950/30 border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-orange-100 flex items-center gap-2">
              <span>Zero-Latency Local Web Speech</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                🇮🇳 Indian English Supported
              </span>
            </h3>
            <p className="text-xs text-orange-300/80">
              Unlimited words queue: Automatically splits long articles and reads without stopping or timing out.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {indianVoiceCount > 0 && (
            <button
              onClick={() => setFilterIndianOnly(!filterIndianOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                filterIndianOnly
                  ? 'bg-orange-500 text-zinc-950 border-orange-400'
                  : 'bg-zinc-800 text-orange-300 border-orange-500/30 hover:bg-zinc-700'
              }`}
            >
              <span>🇮🇳 Indian Voices ({indianVoiceCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Text to Read Aloud (Unlimited Words)
            </label>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Queue streaming active</span>
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Enter or paste unlimited text here..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y"
          />

          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>
              {stats.words} words • {stats.characters} chars
            </span>
            <span>Est. {stats.estimatedSeconds}s</span>
          </div>
        </div>

        {/* Local Voice Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">
                Detected System Voice
              </label>
              {filterIndianOnly && (
                <span className="text-[10px] text-orange-400">Filtering Indian English</span>
              )}
            </div>

            <select
              value={selectedVoiceUri}
              onChange={(e) => setSelectedVoiceUri(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {displayedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders: Rate & Pitch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Speed / Rate</span>
                <span className="font-mono text-orange-400">{rate}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Pitch</span>
                <span className="font-mono text-orange-400">{pitch}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Live Sentence Queue Progress indicator */}
        {sentenceProgress && (
          <div className="p-3 bg-zinc-950 rounded-xl border border-orange-500/40 text-xs flex items-center justify-between">
            <span className="text-zinc-300">
              Speaking sentence <strong className="text-orange-400">{sentenceProgress.current}</strong> of {sentenceProgress.total}
            </span>
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500"
                style={{ width: `${Math.round((sentenceProgress.current / sentenceProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          {isSpeaking && (
            <>
              <button
                onClick={handlePause}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleStop}
                className="px-4 py-2.5 rounded-xl border border-red-900/60 bg-red-950/40 text-red-300 text-xs font-semibold hover:bg-red-900/60 transition-colors flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          <button
            onClick={handleSpeak}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSpeaking ? (isPaused ? 'Resume Playback' : 'Replay') : 'Instant Speak'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
