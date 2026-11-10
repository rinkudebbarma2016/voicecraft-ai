import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Download,
  Check,
  X,
  Volume2,
  Sliders,
  AudioWaveform,
  Film,
  Layers,
  ArrowRight,
  RefreshCw,
  Repeat,
  Radio,
  Zap,
} from 'lucide-react';
import { GeneratedAudio } from '../types/tts';
import { base64ToAudioUrl, formatTime } from '../utils/audio';
import { extendAudioWav, AudioExtendMode, ExtendAudioResult } from '../utils/audioExtender';

interface AudioExtenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio: GeneratedAudio | null;
  onSaveExtendedAudio: (extendedAudio: GeneratedAudio) => void;
  onSendToTimeline?: (extendedAudio: GeneratedAudio) => void;
}

export const AudioExtenderModal: React.FC<AudioExtenderModalProps> = ({
  isOpen,
  onClose,
  audio,
  onSaveExtendedAudio,
  onSendToTimeline,
}) => {
  const [mode, setMode] = useState<AudioExtendMode>('seamless_loop');
  const [originalDuration, setOriginalDuration] = useState<number>(10);
  const [targetDuration, setTargetDuration] = useState<number>(25);
  const [crossfadeSec, setCrossfadeSec] = useState<number>(0.8);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [previewResult, setPreviewResult] = useState<ExtendAudioResult | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    const timer = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize source duration when modal opens or audio changes
  useEffect(() => {
    if (!isOpen || !audio) return;

    const baseDur = audio.duration || 8;
    setOriginalDuration(baseDur);
    // Default target: base + 15 seconds
    const defaultTarget = Math.max(baseDur + 5, Math.round(baseDur * 2.2));
    setTargetDuration(defaultTarget);
    setPreviewResult(null);
    setCurrentTime(0);
    setIsPlaying(false);

    // Auto-generate initial preview extension
    handleGenerateExtension(defaultTarget, mode, crossfadeSec);
  }, [isOpen, audio]);

  // Audio element management
  useEffect(() => {
    if (!previewResult && !audio) return;

    const currentUrl = previewResult?.audioUrl || (audio ? base64ToAudioUrl(audio.audioBase64) : '');
    if (!currentUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const el = new Audio(currentUrl);
    audioRef.current = el;

    el.ontimeupdate = () => {
      setCurrentTime(el.currentTime);
    };

    el.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      el.pause();
      el.src = '';
    };
  }, [previewResult, audio]);

  // Generate / Render Extended Audio
  const handleGenerateExtension = async (
    targetSec = targetDuration,
    extendMode = mode,
    crossfade = crossfadeSec
  ) => {
    if (!audio) return;
    setIsProcessing(true);
    try {
      const result = await extendAudioWav(audio.audioBase64, {
        targetDurationSec: targetSec,
        mode: extendMode,
        crossfadeSec: crossfade,
      });
      setPreviewResult(result);
      setCurrentTime(0);
      showToast(`Audio extended to ${result.duration.toFixed(1)}s (+${result.extensionAddedSec}s)`);
    } catch (err) {
      console.error('Extension error:', err);
      showToast('Extension failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Play / Pause toggle
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Draw Waveform Canvas with Dual-Zone Highlighting (Original vs Extended Zone)
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const totalDur = previewResult ? previewResult.duration : targetDuration;
    const origRatio = Math.min(1.0, originalDuration / totalDur);
    const origWidth = width * origRatio;

    // Draw background zones
    // Original zone (dark purple/emerald)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(0, 0, origWidth, height);

    // Extended zone (cyan/teal glowing)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fillRect(origWidth, 0, width - origWidth, height);

    // Crossfade marker line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(origWidth, 0);
    ctx.lineTo(origWidth, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waveform bars
    const barCount = 100;
    const barWidth = width / barCount - 1.5;
    const midY = height / 2;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 1.5);
      const isOriginalZone = x < origWidth;
      
      // Seeded synthetic peaks
      const progress = i / barCount;
      const decayEnvelope = isOriginalZone ? 1.0 : Math.exp(-(progress - origRatio) * 1.5);
      const noise = Math.sin(i * 12.3) * 0.3 + Math.cos(i * 7.1) * 0.4 + 0.5;
      const barHeight = Math.max(4, Math.min(height * 0.85, noise * (height * 0.7) * decayEnvelope));

      if (isOriginalZone) {
        ctx.fillStyle = '#10b981'; // Original = Emerald
      } else {
        ctx.fillStyle = '#06b6d4'; // Extended = Cyan
      }

      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    }

    // Playhead laser
    const playheadX = (currentTime / totalDur) * width;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead top marker
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(playheadX, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [currentTime, originalDuration, targetDuration, previewResult]);

  // Presets handler
  const handleApplyPreset = (addedSec: number) => {
    const newTarget = Math.max(originalDuration + 1, Math.round(originalDuration + addedSec));
    setTargetDuration(newTarget);
    handleGenerateExtension(newTarget, mode, crossfadeSec);
  };

  // Save Extended Audio
  const handleSave = () => {
    if (!audio || !previewResult) return;
    const updatedAudio: GeneratedAudio = {
      ...audio,
      id: `${audio.id}_ext_${Date.now()}`,
      title: `${audio.title || 'Audio'} (+${previewResult.extensionAddedSec}s Extended)`,
      duration: previewResult.duration,
      audioBase64: previewResult.base64,
      audioUrl: previewResult.audioUrl,
      timestamp: Date.now(),
      targetDuration: previewResult.duration,
      metadata: {
        title: audio.metadata?.title ? `${audio.metadata.title} (Extended)` : 'Extended Audio',
        artist: audio.metadata?.artist || 'VoiceCraft AI',
        album: audio.metadata?.album || 'Studio 16 Pro Suite',
        year: audio.metadata?.year || new Date().getFullYear().toString(),
        genre: audio.metadata?.genre || 'Broadcast Audio',
        comment: `Extended via VoiceCraft Studio 16 (${mode}, +${previewResult.extensionAddedSec}s)`,
      },
    };

    onSaveExtendedAudio(updatedAudio);
    showToast('Saved extended audio to player & history!');
    setTimeout(() => onClose(), 600);
  };

  // Send directly to Timeline
  const handleSendTimeline = () => {
    if (!audio || !previewResult) return;
    const updatedAudio: GeneratedAudio = {
      ...audio,
      id: `clip_ext_${Date.now()}`,
      title: `${audio.title || 'Audio'} (Extended ${previewResult.duration.toFixed(1)}s)`,
      duration: previewResult.duration,
      audioBase64: previewResult.base64,
      audioUrl: previewResult.audioUrl,
    };
    if (onSendToTimeline) {
      onSendToTimeline(updatedAudio);
      showToast('Inserted extended track into Timeline!');
      setTimeout(() => onClose(), 600);
    }
  };

  if (!isOpen || !audio) return null;

  const currentDuration = previewResult ? previewResult.duration : targetDuration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-zinc-900 via-cyan-950/40 to-emerald-950/40 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Audio Extender</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Studio DSP
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Extend speech, BGM, or Foley to match video length with seamless crossfades & ambient tails.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-500 text-zinc-950 text-xs font-bold px-4 py-2 text-center animate-fadeIn">
            {notification}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 text-xs">
          {/* Dual-Zone Visual Waveform */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Original: {originalDuration.toFixed(1)}s
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Extension: +{(currentDuration - originalDuration).toFixed(1)}s
                </span>
              </div>
              <span className="text-zinc-300 font-bold">
                Total: {currentDuration.toFixed(1)}s
              </span>
            </div>

            {/* Canvas Waveform Display */}
            <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 p-3 h-32 flex flex-col justify-between overflow-hidden shadow-inner">
              <canvas
                ref={waveformCanvasRef}
                width={600}
                height={90}
                className="w-full h-24 block"
              />

              {/* Progress Scrubber */}
              <input
                type="range"
                min={0}
                max={currentDuration || 1}
                step={0.05}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Transport Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Extended Preview</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentTime(0);
                    if (audioRef.current) audioRef.current.currentTime = 0;
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title="Rewind"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="font-mono text-zinc-400 text-[11px]">
                <span className="text-cyan-300 font-bold">{formatTime(currentTime)}</span>
                <span> / {formatTime(currentDuration)}</span>
              </div>
            </div>
          </div>

          {/* Quick Extension Presets */}
          <div className="space-y-2">
            <label className="text-zinc-400 font-bold block">Quick Target Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: '+5s Short', sec: 5 },
                { label: '+10s Scene', sec: 10 },
                { label: '+15s Reel', sec: 15 },
                { label: '+30s Full', sec: 30 },
                { label: '2x Double', sec: originalDuration },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p.sec)}
                  className="px-3 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold transition-all cursor-pointer text-center"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Duration Slider */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-200">Target Duration</span>
                <p className="text-[11px] text-zinc-400">Drag to precisely set final audio timestamp</p>
              </div>
              <div className="flex items-center gap-1.5 font-mono bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-700/80">
                <span className="text-base font-bold text-cyan-300">{targetDuration}</span>
                <span className="text-zinc-400">seconds</span>
              </div>
            </div>

            <input
              type="range"
              min={Math.ceil(originalDuration + 1)}
              max={Math.max(120, Math.ceil(originalDuration * 4))}
              step={1}
              value={targetDuration}
              onChange={(e) => setTargetDuration(parseInt(e.target.value))}
              onMouseUp={() => handleGenerateExtension(targetDuration, mode, crossfadeSec)}
              onTouchEnd={() => handleGenerateExtension(targetDuration, mode, crossfadeSec)}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Extension Algorithm Mode Selector */}
          <div className="space-y-2">
            <label className="text-zinc-400 font-bold block">Extension Algorithm</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'seamless_loop' as AudioExtendMode,
                  title: 'Seamless Beat & Loop Match',
                  desc: 'Equal-power crossfade loops without clicks. Best for BGM, drums & beds.',
                  icon: <Repeat className="w-4 h-4 text-emerald-400" />,
                },
                {
                  id: 'ambient_tail' as AudioExtendMode,
                  title: 'Cinematic Ambient Tail',
                  desc: 'Atmospheric resonant decay drone. Perfect for scene ends & voice stings.',
                  icon: <Sparkles className="w-4 h-4 text-purple-400" />,
                },
                {
                  id: 'time_stretch' as AudioExtendMode,
                  title: 'Pitch-Preserved Time Stretch',
                  desc: 'Granular phase vocoder stretches speed while maintaining natural tone.',
                  icon: <Clock className="w-4 h-4 text-cyan-400" />,
                },
                {
                  id: 'ai_continuation' as AudioExtendMode,
                  title: 'AI Continuation & Variation',
                  desc: 'Cadence variation extension maintaining vocal harmonics & groove.',
                  icon: <Radio className="w-4 h-4 text-amber-400" />,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    handleGenerateExtension(targetDuration, m.id, crossfadeSec);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    mode === m.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-zinc-900 shrink-0">{m.icon}</div>
                  <div>
                    <div className="font-bold text-zinc-200">{m.title}</div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Crossfade Smoothness Slider */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-zinc-200">Crossfade Smoothing</span>
              <p className="text-[11px] text-zinc-400">Transition window between loop boundaries</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={crossfadeSec}
                onChange={(e) => setCrossfadeSec(parseFloat(e.target.value))}
                onMouseUp={() => handleGenerateExtension(targetDuration, mode, crossfadeSec)}
                onTouchEnd={() => handleGenerateExtension(targetDuration, mode, crossfadeSec)}
                className="w-28 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 font-bold w-12 text-right">{crossfadeSec}s</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => handleGenerateExtension(targetDuration, mode, crossfadeSec)}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-render DSP</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onSendToTimeline && (
              <button
                onClick={handleSendTimeline}
                disabled={isProcessing || !previewResult}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Send to Video Timeline</span>
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={isProcessing || !previewResult}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Extended Audio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
