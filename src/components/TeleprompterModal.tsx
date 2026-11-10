import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Type,
  Volume2,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowDown,
  Check,
  Eye,
} from 'lucide-react';

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  onUpdateScript?: (newScript: string) => void;
  currentVoiceName?: string;
  onSynthesizeAudio?: (text: string) => void;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  scriptText,
  onUpdateScript,
  currentVoiceName = 'Neural Speaker',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(140);
  const [fontSize, setFontSize] = useState<number>(36);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Words count & estimated duration
  const words = scriptText.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const estimatedTotalSeconds = totalWords > 0 ? Math.round((totalWords / wpm) * 60) : 0;

  // Auto-scroll loop based on WPM
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        // Pixels per second based on font size and WPM
        // At 36px font, 1 line ~ 50px high, avg 8 words per line
        const linesPerMinute = wpm / 7.5;
        const pixelsPerSecond = (linesPerMinute * (fontSize * 1.4)) / 60;

        el.scrollTop += pixelsPerSecond * dt;

        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) {
          const prog = Math.min(100, Math.round((el.scrollTop / maxScroll) * 100));
          setScrollProgress(prog);

          if (el.scrollTop >= maxScroll) {
            setIsPlaying(false);
          }
        }
      }

      setElapsedSeconds((prev) => prev + dt);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, wpm, fontSize]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setWpm((w) => Math.min(260, w + 10));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setWpm((w) => Math.max(70, w - 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    setScrollProgress(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col text-white animate-fade-in select-none">
      {/* Top Teleprompter Toolbar */}
      <div className="h-16 px-6 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">VidsCraft Teleprompter & Recording Booth</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold uppercase">
                Google Vids Feature
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {totalWords} words • Target: ~{Math.floor(estimatedTotalSeconds / 60)}m {estimatedTotalSeconds % 60}s • Space to Play/Pause
            </p>
          </div>
        </div>

        {/* Speed & Font Controls */}
        <div className="flex items-center gap-4">
          {/* WPM Speed Slider */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-zinc-400 font-medium">Speed:</span>
            <input
              type="range"
              min="70"
              max="240"
              step="5"
              value={wpm}
              onChange={(e) => setWpm(parseInt(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-bold w-12 text-right">{wpm} WPM</span>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <Type className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5" />
            {[24, 32, 40, 52].map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  fontSize === size
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>

          {/* Mirror Mode (For Glass Prompters) */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isMirrored
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Mirror horizontally for glass teleprompter mirrors"
          >
            Mirror: {isMirrored ? 'ON' : 'OFF'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Teleprompter Read-along Canvas */}
      <div className="flex-1 relative overflow-hidden flex flex-col justify-center">
        {/* Eye-line Reading Anchor Marker */}
        <div className="absolute top-1/3 left-0 right-0 h-24 border-y border-cyan-500/20 bg-cyan-950/10 pointer-events-none z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400/80">
              EYE-LEVEL READ LINE
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {Math.floor(elapsedSeconds)}s elapsed
          </span>
        </div>

        {/* Scrolling Script Text Viewport */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto px-12 sm:px-24 md:px-36 lg:px-48 pt-[35vh] pb-[50vh] text-center font-sans tracking-wide leading-relaxed scrollbar-none transition-transform duration-100 ${
            isMirrored ? '-scale-x-100' : ''
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {scriptText ? (
            <p className="text-zinc-100 font-semibold drop-shadow-lg max-w-4xl mx-auto">
              {scriptText}
            </p>
          ) : (
            <div className="text-zinc-500 text-xl font-normal">
              No narration script detected. Type or add scenes in your storyboard to begin teleprompting!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Control Pod */}
      <div className="h-20 bg-zinc-950/95 border-t border-zinc-800/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-32 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 font-bold">{scrollProgress}%</span>
        </div>

        {/* Center Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
            title="Rewind to top"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause (Space)</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Scroll & Prompt (Space)</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Feedback / Close */}
        <div className="text-right">
          <span className="text-xs text-zinc-400 block">Voice Track</span>
          <span className="text-xs text-cyan-400 font-semibold">{currentVoiceName}</span>
        </div>
      </div>
    </div>
  );
};
