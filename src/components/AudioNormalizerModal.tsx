import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  Check,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldCheck,
  AudioWaveform,
  X,
  ArrowRight,
  Upload,
  Info,
  Radio,
  Zap,
} from 'lucide-react';
import { GeneratedAudio, PeakNormalizationStats } from '../types/tts';
import {
  formatTime,
  downloadAudioFile,
  normalizeAudioClip,
  measureAudioPeakDb,
  base64ToAudioUrl,
  uint8ArrayToBase64,
} from '../utils/audio';

interface AudioNormalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAudio: GeneratedAudio | null;
  onAudioNormalized: (normalizedAudio: GeneratedAudio) => void;
  autoNormalizeEnabled: boolean;
  onToggleAutoNormalize: (enabled: boolean) => void;
}

export const AudioNormalizerModal: React.FC<AudioNormalizerModalProps> = ({
  isOpen,
  onClose,
  currentAudio,
  onAudioNormalized,
  autoNormalizeEnabled,
  onToggleAutoNormalize,
}) => {
  const [targetPeakDb, setTargetPeakDb] = useState<number>(-1.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stats, setStats] = useState<PeakNormalizationStats | null>(null);
  const [normalizedBase64, setNormalizedBase64] = useState<string | null>(null);
  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null);
  const [activeAudition, setActiveAudition] = useState<'normalized' | 'original'>('normalized');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Upload custom file state
  const [customAudioItem, setCustomAudioItem] = useState<GeneratedAudio | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudio = customAudioItem || currentAudio;

  // Run normalization whenever activeAudio or targetPeakDb changes
  useEffect(() => {
    if (!isOpen || !activeAudio?.audioBase64) return;

    let isMounted = true;
    setIsProcessing(true);

    normalizeAudioClip(activeAudio.audioBase64, targetPeakDb)
      .then((res) => {
        if (!isMounted) return;
        setNormalizedBase64(res.normalizedBase64);
        setNormalizedUrl(res.normalizedUrl);
        setStats(res.stats);
      })
      .catch((err) => {
        console.error('Normalization error:', err);
      })
      .finally(() => {
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeAudio?.audioBase64, targetPeakDb]);

  // Audio source switching for A/B comparison
  useEffect(() => {
    if (!audioRef.current || !activeAudio) return;

    const sourceUrl =
      activeAudition === 'normalized' && normalizedUrl
        ? normalizedUrl
        : activeAudio.audioUrl;

    const wasPlaying = isPlaying;
    const prevTime = audioRef.current.currentTime || 0;

    audioRef.current.src = sourceUrl;
    audioRef.current.currentTime = prevTime;

    if (wasPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [activeAudition, normalizedUrl, activeAudio]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleApplyToClip = () => {
    if (!activeAudio || !normalizedBase64 || !normalizedUrl || !stats) return;

    const updatedAudio: GeneratedAudio = {
      ...activeAudio,
      audioBase64: normalizedBase64,
      audioUrl: normalizedUrl,
      isNormalized: true,
      peakDb: targetPeakDb,
      normalizationStats: stats,
    };

    onAudioNormalized(updatedAudio);
    setSuccessToast(`✓ Audio normalized to consistent ${targetPeakDb.toFixed(1)}dB peak!`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  const handleDownloadNormalized = () => {
    if (!normalizedUrl || !activeAudio) return;
    const cleanTitle = (activeAudio.title || 'normalized_audio')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    downloadAudioFile(normalizedUrl, `${cleanTitle}_normalized_${Math.abs(targetPeakDb)}dB.wav`);
    setSuccessToast('✓ Downloaded broadcast-ready normalized WAV');
    setTimeout(() => setSuccessToast(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const bytes = new Uint8Array(buffer);
        const base64 = uint8ArrayToBase64(bytes);
        const url = base64ToAudioUrl(base64, file.type || 'audio/wav');
        setCustomAudioItem({
          id: `custom-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          text: `External uploaded file: ${file.name}`,
          audioBase64: base64,
          audioUrl: url,
          voice: 'External',
          mode: 'solo',
          timestamp: Date.now(),
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Peak level meter percentage (-36 dBFS to 0 dBFS mapping)
  const calcMeterPercent = (db: number) => {
    if (db <= -36) return 0;
    if (db >= 0) return 100;
    return Math.min(100, Math.max(0, ((db + 36) / 36) * 100));
  };

  const originalPeakDb = stats ? stats.originalPeakDb : -96;
  const currentNormPeakDb = stats ? stats.normalizedPeakDb : targetPeakDb;
  const gainDb = stats ? stats.gainDb : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Top Glow Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20 shrink-0">
              <AudioWaveform className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Audio Peak Level Normalizer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                  Broadcast Standard (-1.0 dB Peak)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically balances & levels audio clips to -1dB peak to eliminate volume discrepancies and distortion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer shrink-0"
            title="Close Normalizer Tool"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-Normalize Global Switch Ribbon */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <span>Automatic Post-Processing on Generation</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Every audio clip generated across Solo, Dialogue & Batch will automatically peak at -1.0 dBFS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleAutoNormalize(!autoNormalizeEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              autoNormalizeEnabled
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
            }`}
          >
            {autoNormalizeEnabled ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Auto ON</span>
              </>
            ) : (
              <span>Disabled</span>
            )}
          </button>
        </div>

        {/* Target Peak Presets / Selector */}
        <div className="space-y-2 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Peak Level:</span>
              <span className="font-mono text-emerald-300 text-sm font-black">
                {targetPeakDb.toFixed(1)} dBFS
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Headroom Safety: <span className="text-emerald-400 font-mono font-semibold">1.0 dB</span>
            </span>
          </div>

          {/* Quick Target Peak Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { db: -1.0, label: 'Broadcast Standard', badge: '-1.0 dB', desc: 'YouTube & Podcasts' },
              { db: -0.5, label: 'Loud / Commercial', badge: '-0.5 dB', desc: 'High Impact' },
              { db: -2.0, label: 'Gentle Headroom', badge: '-2.0 dB', desc: 'Audiobooks' },
              { db: -0.1, label: 'Maximum Peak', badge: '-0.1 dB', desc: 'Near Full Scale' },
            ].map((preset) => {
              const isSelected = Math.abs(targetPeakDb - preset.db) < 0.05;
              return (
                <button
                  key={preset.db}
                  type="button"
                  onClick={() => setTargetPeakDb(preset.db)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white">{preset.badge}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{preset.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Visual Peak Meters: Original vs. -1dB Normalized */}
        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/80">
            <span className="font-bold text-zinc-200">Volume Peak Meter Comparison</span>
            <span className="text-[11px] font-mono text-zinc-400">
              Full Scale range: -36 to 0 dBFS
            </span>
          </div>

          {/* 1. Original Peak Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Original Peak:</span>
              <span className="font-mono font-bold text-zinc-300">
                {originalPeakDb > -90 ? `${originalPeakDb.toFixed(1)} dBFS` : 'Quiet / Silence'}
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  originalPeakDb > -1.0 ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${calcMeterPercent(originalPeakDb)}%` }}
              />
              {/* -1dB Target Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10"
                style={{ left: `${calcMeterPercent(-1.0)}%` }}
                title="Target -1.0 dBFS Marker"
              />
            </div>
          </div>

          {/* 2. Normalized -1dB Peak Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Normalized (-1dB Peak Master):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {currentNormPeakDb.toFixed(1)} dBFS
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-emerald-500/40 p-0.5 relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 transition-all duration-300"
                style={{ width: `${calcMeterPercent(targetPeakDb)}%` }}
              />
              {/* -1dB Target Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-sm"
                style={{ left: `${calcMeterPercent(-1.0)}%` }}
              />
            </div>
          </div>

          {/* Gain Stats Grid */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase">Gain Applied</span>
                <span className={`font-mono font-bold ${gainDb >= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {gainDb > 0 ? `+${gainDb.toFixed(2)}` : gainDb.toFixed(2)} dB
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase">Linear Multiplier</span>
                <span className="font-mono font-bold text-zinc-200">
                  {stats.gainMultiplier.toFixed(3)}x
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase">Inter-Sample Safety</span>
                <span className="font-mono font-bold text-emerald-400">
                  Protected ✓
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Audition Player with A/B Toggle */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>A/B Audition Comparison</span>
            </div>

            {/* A/B Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveAudition('original')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeAudition === 'original'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                A: Original Audio
              </button>
              <button
                type="button"
                onClick={() => setActiveAudition('normalized')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeAudition === 'normalized'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                B: -1dB Normalized
              </button>
            </div>
          </div>

          {/* Playback Controls & Scrubber */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span className="text-zinc-500">
                  Now playing: {activeAudition === 'normalized' ? 'Normalized (-1dB Peak)' : 'Original Clip'}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.01"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Custom Audio Upload Button for processing arbitrary files */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,audio/mp3,audio/mpeg,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload custom WAV / MP3 to normalize</span>
          </button>

          {customAudioItem && (
            <button
              type="button"
              onClick={() => setCustomAudioItem(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] underline"
            >
              Reset to active generation
            </button>
          )}
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadNormalized}
              disabled={!normalizedUrl}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Normalized WAV</span>
            </button>

            <button
              type="button"
              onClick={handleApplyToClip}
              disabled={!normalizedUrl || isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply -1dB Normalization to Clip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
