import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Sliders,
  Copy,
  Check,
  Music,
  Scissors,
  AudioWaveform,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { GeneratedAudio, AudioFilterMode } from '../types/tts';
import {
  formatTime,
  downloadAudioFile,
  downloadTaggedAudioFile,
  AudioFxManager,
  AUDIO_EQ_PRESETS,
} from '../utils/audio';
import { WaveformAnalyzer } from './WaveformAnalyzer';
import { AudioTrimmerModal } from './AudioTrimmerModal';
import { AudioExtenderModal } from './AudioExtenderModal';
import { AudioNormalizerModal } from './AudioNormalizerModal';

interface AudioPlayerProps {
  currentAudio: GeneratedAudio | null;
  onFilterChange?: (filter: AudioFilterMode) => void;
  onAudioTrimmed?: (audio: GeneratedAudio) => void;
  onAudioExtended?: (audio: GeneratedAudio) => void;
  onAudioNormalized?: (audio: GeneratedAudio) => void;
  onSendToTimeline?: (audio: GeneratedAudio) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentAudio,
  onFilterChange,
  onAudioTrimmed,
  onAudioExtended,
  onAudioNormalized,
  onSendToTimeline,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fxManagerRef = useRef<AudioFxManager | null>(null);
  const presetsDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [filterMode, setFilterMode] = useState<AudioFilterMode>('none');
  const [copied, setCopied] = useState(false);
  const [showEqMenu, setShowEqMenu] = useState(false);
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);
  const [isExtenderOpen, setIsExtenderOpen] = useState(false);
  const [isNormalizerModalOpen, setIsNormalizerModalOpen] = useState(false);
  const [isNormalized, setIsNormalized] = useState(true);
  const [autoNormalizeEnabled, setAutoNormalizeEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voicecraft_auto_normalize_peak');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const handleToggleAutoNormalize = (enabled: boolean) => {
    setAutoNormalizeEnabled(enabled);
    try {
      localStorage.setItem('voicecraft_auto_normalize_peak', JSON.stringify(enabled));
    } catch {
      // ignore
    }
  };

  // Close audio presets dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (presetsDropdownRef.current && !presetsDropdownRef.current.contains(e.target as Node)) {
        setShowEqMenu(false);
      }
    };
    if (showEqMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showEqMenu]);

  // Toggle Audio Normalization (Automatic Volume Leveling across generated clips)
  const toggleNormalization = () => {
    const next = !isNormalized;
    setIsNormalized(next);
    fxManagerRef.current?.setNormalization(next);
  };

  // Keyboard shortcut listener: press T to open precision audio trimmer, press E to open AI audio extender
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if ((e.key === 't' || e.key === 'T') && !isTrimmerOpen && currentAudio) {
        e.preventDefault();
        setIsTrimmerOpen(true);
      } else if ((e.key === 'e' || e.key === 'E') && !isExtenderOpen && currentAudio) {
        e.preventDefault();
        setIsExtenderOpen(true);
      } else if ((e.key === 'n' || e.key === 'N') && !isNormalizerModalOpen && currentAudio) {
        e.preventDefault();
        setIsNormalizerModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isTrimmerOpen, isExtenderOpen, isNormalizerModalOpen, currentAudio]);

  // Initialize FX Manager
  useEffect(() => {
    fxManagerRef.current = new AudioFxManager();
  }, []);

  // Update audio source when currentAudio changes
  useEffect(() => {
    if (audioRef.current && currentAudio?.audioUrl) {
      audioRef.current.src = currentAudio.audioUrl;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      setCurrentTime(0);

      // Connect FX manager & apply normalization
      try {
        fxManagerRef.current?.connectElement(audioRef.current);
        fxManagerRef.current?.setNormalization(isNormalized);
        fxManagerRef.current?.applyFilterMode(filterMode);
        fxManagerRef.current?.resume();
      } catch (e) {
        console.warn('WebAudio FX init notice:', e);
      }

      // Auto play on new generation
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [currentAudio]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    fxManagerRef.current?.resume();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          fxManagerRef.current?.resume();
        })
        .catch((e) => console.error('Audio play error:', e));
    }
  };

  // Time scrubbing
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      Math.max(audioRef.current.currentTime + seconds, 0),
      duration || 9999
    );
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Audio filter mode preset selection
  const handleSelectFilter = (mode: AudioFilterMode) => {
    setFilterMode(mode);
    fxManagerRef.current?.applyFilterMode(mode);
    onFilterChange?.(mode);
    setShowEqMenu(false);
  };

  const handleCopyBase64 = async () => {
    if (!currentAudio?.audioBase64) return;
    try {
      await navigator.clipboard.writeText(`data:audio/wav;base64,${currentAudio.audioBase64}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    downloadTaggedAudioFile(currentAudio);
  };

  if (!currentAudio) {
    return (
      <div className="bg-zinc-900/60 rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
        <p className="text-sm font-medium text-zinc-400">Audio Workstation Ready</p>
        <p className="text-xs text-zinc-500 mt-1">
          Select a Neural AI speaker, enter your text, and synthesize to see the real-time visual waveform spectrum analyzer.
        </p>
      </div>
    );
  }

  const activePreset = AUDIO_EQ_PRESETS.find((p) => p.id === filterMode);
  const primaryPresets = AUDIO_EQ_PRESETS.filter((p) =>
    ['podcast', 'music', 'voiceover', 'crisp-speech', 'none'].includes(p.id)
  );
  const creativePresets = AUDIO_EQ_PRESETS.filter(
    (p) => !['podcast', 'music', 'voiceover', 'crisp-speech', 'none'].includes(p.id)
  );

  return (
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-3.5 sm:p-5 shadow-2xl relative backdrop-blur-xl space-y-3 sm:space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Top Details Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-semibold text-zinc-100 text-xs sm:text-sm tracking-tight">
              {currentAudio.title || 'Generated Audio Clip'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Speaker: {currentAudio.speakerName || currentAudio.voice} {currentAudio.voiceB ? `+ ${currentAudio.voiceB}` : ''}
            </span>
            {currentAudio.accent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-300 border border-orange-500/30">
                {currentAudio.accent}
              </span>
            )}
            {currentAudio.targetDuration && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span>⏱️ Choice Time: {formatTime(currentAudio.targetDuration)} ({currentAudio.targetDuration}s)</span>
              </span>
            )}
            {currentAudio.targetSpeedMultiplier && Math.abs(currentAudio.targetSpeedMultiplier - 1.0) > 0.05 && (
              <button
                type="button"
                onClick={() => handleSpeedChange(currentAudio.targetSpeedMultiplier!)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 transition-colors"
                title="Lock playback to match exact target duration"
              >
                Sync Time ({currentAudio.targetSpeedMultiplier.toFixed(2)}x)
              </button>
            )}
            {currentAudio.chunksCount && currentAudio.chunksCount > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {currentAudio.chunksCount} Parts Concatenated
              </span>
            )}
            {currentAudio.metadata?.genre && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950/80 text-purple-300 border border-purple-600/30 font-medium">
                🏷️ {currentAudio.metadata.genre}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic max-w-xl">
            "{currentAudio.text}"
          </p>
        </div>

        {/* Audio Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          {/* Audio Normalization Toggle Button */}
          <button
            onClick={toggleNormalization}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isNormalized
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200 hover:bg-zinc-750'
            }`}
            title={
              isNormalized
                ? 'Audio Normalization: ACTIVE (Automatically levels and compresses volume across generated clips to consistent broadcast loudness)'
                : 'Audio Normalization: OFF (Click to level and balance volume across all audio clips)'
            }
          >
            <AudioWaveform className={`w-3.5 h-3.5 ${isNormalized ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="hidden xs:inline">Normalization</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                isNormalized ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {isNormalized ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Audio Presets Dropdown */}
          <div className="relative" ref={presetsDropdownRef}>
            <button
              type="button"
              onClick={() => setShowEqMenu(!showEqMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                filterMode !== 'none'
                  ? 'bg-purple-950/70 text-purple-200 border-purple-500/50 shadow-purple-500/10'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:text-zinc-100 hover:bg-zinc-750'
              }`}
              title="Audio Presets: Apply pre-configured equalization settings (Podcast, Music, Voiceover, Crisp Speech)"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Presets</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  filterMode !== 'none'
                    ? 'bg-purple-500/30 text-purple-200 font-bold border border-purple-500/30'
                    : 'bg-zinc-700/80 text-zinc-300'
                }`}
              >
                {activePreset?.name || 'Flat'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  showEqMenu ? 'rotate-180 text-purple-400' : ''
                }`}
              />
            </button>

            {showEqMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-96 bg-zinc-900/98 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-3 pt-2 pb-2.5 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100 tracking-tight">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Audio Equalization Presets</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      DSP frequency filtering for professional voice & media
                    </p>
                  </div>
                  {filterMode !== 'none' && (
                    <button
                      type="button"
                      onClick={() => handleSelectFilter('none')}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 transition-colors cursor-pointer"
                      title="Reset to Flat / Clean Bypass"
                    >
                      Bypass (Flat)
                    </button>
                  )}
                </div>

                {/* Preset List */}
                <div className="max-h-[390px] overflow-y-auto space-y-1.5 py-2 pr-1 custom-scrollbar">
                  {/* Primary Studio & Vocal Presets */}
                  <div className="px-3 pt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Equalization Profiles</span>
                  </div>

                  {primaryPresets.map((preset) => {
                    const isSelected = filterMode === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectFilter(preset.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/10 ring-1 ring-purple-500/30'
                            : 'text-zinc-300 hover:bg-zinc-800/70 border-transparent hover:border-zinc-750'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100 text-[13px]">{preset.name}</span>
                            {preset.badge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wide ${
                                  preset.id === 'podcast'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : preset.id === 'music'
                                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                    : preset.id === 'voiceover'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : preset.id === 'crisp-speech'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}
                              >
                                {preset.badge}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                              <Check className="w-3 h-3 text-purple-400" />
                              Active
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Frequency Curve Gains */}
                        <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              preset.lowGain > 0
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/20'
                                : preset.lowGain < 0
                                ? 'bg-blue-950/60 text-blue-300 border border-blue-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                            }`}
                          >
                            Low: {preset.lowGain > 0 ? `+${preset.lowGain}` : preset.lowGain}dB
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              preset.midGain > 0
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20'
                                : preset.midGain < 0
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                            }`}
                          >
                            Mid: {preset.midGain > 0 ? `+${preset.midGain}` : preset.midGain}dB
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              preset.highGain > 0
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/20'
                                : preset.highGain < 0
                                ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                            }`}
                          >
                            High: {preset.highGain > 0 ? `+${preset.highGain}` : preset.highGain}dB
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Creative / Acoustic Coloration Presets */}
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Acoustic Character Profiles
                  </div>

                  {creativePresets.map((preset) => {
                    const isSelected = filterMode === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectFilter(preset.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/10'
                            : 'text-zinc-300 hover:bg-zinc-800/70 border-transparent hover:border-zinc-750'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100 text-[13px]">{preset.name}</span>
                            {preset.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wide bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {preset.badge}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                              <Check className="w-3 h-3 text-purple-400" />
                              Active
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                            Low: {preset.lowGain > 0 ? `+${preset.lowGain}` : preset.lowGain}dB
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                            Mid: {preset.midGain > 0 ? `+${preset.midGain}` : preset.midGain}dB
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                            High: {preset.highGain > 0 ? `+${preset.highGain}` : preset.highGain}dB
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Precision Audio Trimmer (T) */}
          <button
            onClick={() => setIsTrimmerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-pink-300 bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/40 transition-colors cursor-pointer shadow-sm"
            title="Open Precision Audio Trimmer (Keyboard Shortcut: T)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trim</span>
            <kbd className="px-1 py-0.2 bg-zinc-800 rounded text-[9px] text-zinc-300 font-mono hidden md:inline">T</kbd>
          </button>

          {/* AI Audio Extender (E) */}
          <button
            onClick={() => setIsExtenderOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 transition-colors cursor-pointer shadow-sm"
            title="Open AI Audio Extender & Duration Stretch (Keyboard Shortcut: E)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Extend</span>
            <kbd className="px-1 py-0.2 bg-zinc-800 rounded text-[9px] text-zinc-300 font-mono hidden md:inline">E</kbd>
          </button>

          {/* Post-Processing -1dB Peak Normalizer Tool (N) */}
          <button
            onClick={() => setIsNormalizerModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              currentAudio.isNormalized
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                : 'bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-750 border-zinc-700/70'
            }`}
            title="Post-Processing Tool: Normalize audio volume to consistent -1dB peak (Shortcut: N)"
          >
            <AudioWaveform className={`w-3.5 h-3.5 ${currentAudio.isNormalized ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>-1dB Normalizer</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                currentAudio.isNormalized ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {currentAudio.isNormalized ? '-1dB' : 'TOOL'}
            </span>
            <kbd className="px-1 py-0.2 bg-zinc-850 rounded text-[9px] text-zinc-400 font-mono hidden md:inline">N</kbd>
          </button>

          {/* Copy Base64 */}
          <button
            onClick={handleCopyBase64}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-lg text-xs transition-colors"
            title="Copy Base64 Audio URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download WAV */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            title="Download Studio WAV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export WAV</span>
          </button>
        </div>
      </div>

      {/* Active EQ Preset & Normalization Status Strip */}
      {(filterMode !== 'none' || isNormalized) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {filterMode !== 'none' && activePreset && (
              <div className="flex items-center gap-1.5 text-purple-300">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-400">Audio Preset:</span>
                <span className="font-semibold text-purple-200">{activePreset.name}</span>
                <span className="text-[10px] font-mono bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-300">
                  L: {activePreset.lowGain > 0 ? `+${activePreset.lowGain}` : activePreset.lowGain}dB | M: {activePreset.midGain > 0 ? `+${activePreset.midGain}` : activePreset.midGain}dB | H: {activePreset.highGain > 0 ? `+${activePreset.highGain}` : activePreset.highGain}dB
                </span>
              </div>
            )}
            {isNormalized && (
              <div className="flex items-center gap-1.5 text-emerald-300 border-l border-zinc-800 pl-3">
                <AudioWaveform className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-400">Normalization:</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Dynamic Leveling Active
                </span>
              </div>
            )}
          </div>
          {filterMode !== 'none' && (
            <button
              type="button"
              onClick={() => handleSelectFilter('none')}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Reset to Flat
            </button>
          )}
        </div>
      )}

      {/* Real-Time Visual Waveform & Spectrum Analyzer */}
      <WaveformAnalyzer
        fxManager={fxManagerRef.current}
        isPlaying={isPlaying}
        voiceName={currentAudio.speakerName || currentAudio.voice}
        sampleRate={24000}
      />

      {/* Progress Scrubber Bar */}
      <div className="space-y-1 pt-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
        />
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>
            {formatTime(duration)}
            {currentAudio.targetDuration ? ` (Target: ${formatTime(currentAudio.targetDuration)})` : ''}
          </span>
        </div>
      </div>

      {/* Master Audio Transport & Deck Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Fast Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Multiplier Pill */}
        <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800 text-[11px]">
          <span className="text-zinc-500 px-2 font-mono">Speed</span>
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                playbackRate === rate ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 min-w-[130px]">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Audio Trimmer Modal with Full Keyboard Shortcuts */}
      <AudioTrimmerModal
        isOpen={isTrimmerOpen}
        onClose={() => setIsTrimmerOpen(false)}
        audio={currentAudio}
        onSaveTrimmedAudio={(trimmed) => {
          if (onAudioTrimmed) {
            onAudioTrimmed(trimmed);
          }
        }}
      />

      {/* AI Audio Extender Modal with Seamless Loops & Ambient Tails */}
      <AudioExtenderModal
        isOpen={isExtenderOpen}
        onClose={() => setIsExtenderOpen(false)}
        audio={currentAudio}
        onSaveExtendedAudio={(extended) => {
          if (onAudioExtended) {
            onAudioExtended(extended);
          } else if (onAudioTrimmed) {
            onAudioTrimmed(extended);
          }
        }}
        onSendToTimeline={onSendToTimeline}
      />

      {/* Audio Peak Normalizer Post-Processing Modal (-1.0 dBFS Broadcast Standard) */}
      <AudioNormalizerModal
        isOpen={isNormalizerModalOpen}
        onClose={() => setIsNormalizerModalOpen(false)}
        currentAudio={currentAudio}
        onAudioNormalized={(normalized) => {
          if (onAudioNormalized) {
            onAudioNormalized(normalized);
          } else if (onAudioTrimmed) {
            onAudioTrimmed(normalized);
          }
        }}
        autoNormalizeEnabled={autoNormalizeEnabled}
        onToggleAutoNormalize={handleToggleAutoNormalize}
      />
    </div>
  );
};
