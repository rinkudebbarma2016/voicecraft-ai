import React, { useEffect, useRef, useState } from 'react';
import { AudioFxManager } from '../utils/audio';
import {
  Activity,
  BarChart2,
  Maximize2,
  Minimize2,
  Palette,
  Radio,
  Zap,
} from 'lucide-react';

export type VisualizerMode = 'bars' | 'oscilloscope' | 'mirror';
export type VisualizerTheme = 'neon' | 'gold' | 'emerald' | 'glacier';

interface WaveformAnalyzerProps {
  fxManager: AudioFxManager | null;
  isPlaying: boolean;
  voiceName?: string;
  sampleRate?: number;
}

export const WaveformAnalyzer: React.FC<WaveformAnalyzerProps> = ({
  fxManager,
  isPlaying,
  voiceName = 'AI Voice',
  sampleRate = 24000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Peak hold state
  const peaksRef = useRef<number[]>([]);
  const peakHoldCountRef = useRef<number[]>([]);

  // Modes & Customization
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [theme, setTheme] = useState<VisualizerTheme>('neon');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Live Telemetry Readouts
  const [peakDb, setPeakDb] = useState<number>(-90);
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [dominantFreq, setDominantFreq] = useState<string>('0 Hz');

  // Palette color definitions
  const THEME_COLORS: Record<
    VisualizerTheme,
    {
      gradient: [string, string, string];
      stroke: string;
      glow: string;
      peak: string;
      grid: string;
    }
  > = {
    neon: {
      gradient: ['#c084fc', '#e879f9', '#38bdf8'],
      stroke: '#e879f9',
      glow: 'rgba(232, 121, 249, 0.5)',
      peak: '#38bdf8',
      grid: 'rgba(168, 85, 247, 0.12)',
    },
    gold: {
      gradient: ['#fbbf24', '#f59e0b', '#fb7185'],
      stroke: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.5)',
      peak: '#ffffff',
      grid: 'rgba(245, 158, 11, 0.12)',
    },
    emerald: {
      gradient: ['#34d399', '#10b981', '#06b6d4'],
      stroke: '#34d399',
      glow: 'rgba(52, 211, 153, 0.5)',
      peak: '#a7f3d0',
      grid: 'rgba(16, 185, 129, 0.12)',
    },
    glacier: {
      gradient: ['#38bdf8', '#818cf8', '#c084fc'],
      stroke: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.5)',
      peak: '#ffffff',
      grid: 'rgba(56, 189, 248, 0.12)',
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasResolution = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round((isExpanded ? 144 : 80) * dpr);
      }
    };
    updateCanvasResolution();
    window.addEventListener('resize', updateCanvasResolution);

    let freqBuffer: Uint8Array<ArrayBuffer> | null = null;
    let timeBuffer: Uint8Array<ArrayBuffer> | null = null;

    let lastTelemetryUpdate = 0;

    const render = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const currentTheme = THEME_COLORS[theme];

      // Clear with dark studio background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle dB grid lines
      ctx.strokeStyle = currentTheme.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const gridLevels = [0.25, 0.5, 0.75];
      for (const level of gridLevels) {
        const y = Math.floor(height * level);
        ctx.beginPath();
        ctx.moveTo(36, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw dB scale text on the left margin
      ctx.fillStyle = '#52525b';
      ctx.font = '9px monospace';
      ctx.fillText('-12dB', 4, Math.floor(height * 0.25) + 3);
      ctx.fillText('-24dB', 4, Math.floor(height * 0.5) + 3);
      ctx.fillText('-48dB', 4, Math.floor(height * 0.75) + 3);

      const analyser = fxManager?.analyser;

      if (analyser && isPlaying) {
        const binCount = analyser.frequencyBinCount;
        if (!freqBuffer || freqBuffer.length !== binCount) {
          freqBuffer = new Uint8Array(new ArrayBuffer(binCount));
          timeBuffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        }

        if (freqBuffer && timeBuffer) {
          analyser.getByteFrequencyData(freqBuffer);
          analyser.getByteTimeDomainData(timeBuffer);
        }

        // Update live telemetry every 120ms
        if (timestamp - lastTelemetryUpdate > 120) {
          lastTelemetryUpdate = timestamp;

          let maxVal = 0;
          let maxBin = 0;
          let sumSquares = 0;

          for (let i = 0; i < binCount; i++) {
            const val = freqBuffer[i];
            if (val > maxVal) {
              maxVal = val;
              maxBin = i;
            }
            const norm = (val - 128) / 128;
            sumSquares += norm * norm;
          }

          const rms = Math.min(1, Math.sqrt(sumSquares / binCount) * 2.5);
          setRmsVolume(rms);

          // Calculate dB
          const db = maxVal > 0 ? Math.round(20 * Math.log10(maxVal / 255)) : -90;
          setPeakDb(db);

          // Dominant frequency in Hz (Nyquist = sampleRate / 2)
          const freqHz = Math.round((maxBin / binCount) * (sampleRate / 2));
          let category = 'Sub-Bass';
          if (freqHz > 100 && freqHz <= 250) category = 'Bass';
          else if (freqHz > 250 && freqHz <= 1000) category = 'Vocal Fundamental';
          else if (freqHz > 1000 && freqHz <= 4000) category = 'Vocal Clarity';
          else if (freqHz > 4000) category = 'Treble / Air';

          setDominantFreq(`${freqHz} Hz (${category})`);
        }
      }

      const usableWidth = width - 40;
      const leftOffset = 40;

      // MODE 1: FFT Spectrum Bars with floating peak caps
      if (mode === 'bars') {
        const barCount = 44;
        const barWidth = Math.max(3, (usableWidth / barCount) - 2);
        const barSpacing = (usableWidth - barCount * barWidth) / (barCount - 1);

        // Initialize peaks array if needed
        if (peaksRef.current.length !== barCount) {
          peaksRef.current = new Array(barCount).fill(0);
          peakHoldCountRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          let magnitude = 0;

          if (freqBuffer && isPlaying) {
            // Logarithmic frequency bin mapping
            const binIndex = Math.min(
              freqBuffer.length - 1,
              Math.floor(Math.pow(i / barCount, 1.4) * (freqBuffer.length * 0.85))
            );
            magnitude = (freqBuffer[binIndex] || 0) / 255;
          } else if (isPlaying) {
            // Smooth natural simulated speech fallback
            const t = timestamp / 200 + i * 0.35;
            magnitude = Math.max(0.08, (Math.sin(t) * 0.35 + 0.5) * (1 - (i / barCount) * 0.4));
          } else {
            magnitude = 0.04; // Idle resting line
          }

          const barMaxH = height - 18;
          const barHeight = Math.max(3, magnitude * barMaxH);
          const x = leftOffset + i * (barWidth + barSpacing);
          const y = height - barHeight - 14;

          // Peak hold logic
          if (barHeight >= (peaksRef.current[i] || 0)) {
            peaksRef.current[i] = barHeight;
            peakHoldCountRef.current[i] = 10;
          } else {
            if ((peakHoldCountRef.current[i] || 0) > 0) {
              peakHoldCountRef.current[i]!--;
            } else {
              peaksRef.current[i] = Math.max(3, (peaksRef.current[i] || 0) - 1.2);
            }
          }

          // Gradient color for bars
          const grad = ctx.createLinearGradient(0, y, 0, height - 14);
          grad.addColorStop(0, currentTheme.gradient[0]);
          grad.addColorStop(0.5, currentTheme.gradient[1]);
          grad.addColorStop(1, currentTheme.gradient[2]);

          ctx.fillStyle = isPlaying ? grad : '#27272a';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();

          // Render peak hold caps
          if (isPlaying && peaksRef.current[i] && peaksRef.current[i]! > 5) {
            const peakY = height - peaksRef.current[i]! - 16;
            ctx.fillStyle = currentTheme.peak;
            ctx.fillRect(x, Math.max(2, peakY), barWidth, 2);
          }
        }
      }

      // MODE 2: Oscilloscope Waveform (Time Domain)
      else if (mode === 'oscilloscope') {
        const centerY = (height - 14) / 2;

        // Draw center zero-crossing line
        ctx.strokeStyle = '#27272a';
        ctx.beginPath();
        ctx.moveTo(leftOffset, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = isPlaying ? currentTheme.stroke : '#3f3f46';
        ctx.lineWidth = isPlaying ? 2.2 : 1.5;
        ctx.shadowColor = isPlaying ? currentTheme.glow : 'transparent';
        ctx.shadowBlur = isPlaying ? 8 : 0;

        const points = 120;
        const sliceWidth = usableWidth / (points - 1);

        for (let i = 0; i < points; i++) {
          let v = 0.5;

          if (timeBuffer && isPlaying) {
            const index = Math.floor((i / points) * timeBuffer.length);
            v = (timeBuffer[index] || 128) / 255;
          } else if (isPlaying) {
            const t = timestamp / 160 + i * 0.15;
            v = 0.5 + (Math.sin(t) * 0.28 + Math.cos(t * 1.8) * 0.12);
          }

          const y = centerY + (v - 0.5) * (height - 24) * 0.85;
          const x = leftOffset + i * sliceWidth;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 3: Mirrored Stereo Spectrum
      else if (mode === 'mirror') {
        const barCount = 36;
        const barWidth = Math.max(3, (usableWidth / barCount) - 2);
        const barSpacing = (usableWidth - barCount * barWidth) / (barCount - 1);
        const centerY = (height - 14) / 2;

        for (let i = 0; i < barCount; i++) {
          let magnitude = 0;

          if (freqBuffer && isPlaying) {
            const binIndex = Math.min(
              freqBuffer.length - 1,
              Math.floor(Math.pow(i / barCount, 1.3) * (freqBuffer.length * 0.8))
            );
            magnitude = (freqBuffer[binIndex] || 0) / 255;
          } else if (isPlaying) {
            const t = timestamp / 180 + i * 0.3;
            magnitude = Math.max(0.08, (Math.sin(t) * 0.3 + 0.45));
          } else {
            magnitude = 0.05;
          }

          const halfHeight = Math.max(2, magnitude * ((height - 28) / 2));
          const x = leftOffset + i * (barWidth + barSpacing);

          // Top half
          const grad = ctx.createLinearGradient(0, centerY - halfHeight, 0, centerY);
          grad.addColorStop(0, currentTheme.gradient[0]);
          grad.addColorStop(1, currentTheme.gradient[1]);

          ctx.fillStyle = isPlaying ? grad : '#27272a';
          ctx.beginPath();
          ctx.roundRect(x, centerY - halfHeight, barWidth, halfHeight, 1.5);
          ctx.fill();

          // Bottom reflection half
          ctx.fillStyle = isPlaying ? `${currentTheme.gradient[2]}55` : '#18181b';
          ctx.beginPath();
          ctx.roundRect(x, centerY + 1, barWidth, halfHeight * 0.75, 1.5);
          ctx.fill();
        }
      }

      // Bottom Frequency Range Markers
      ctx.fillStyle = '#71717a';
      ctx.font = '9px monospace';
      const markers = [
        { label: '60Hz', pos: 0.06 },
        { label: '250Hz', pos: 0.22 },
        { label: '1kHz', pos: 0.48 },
        { label: '4kHz', pos: 0.74 },
        { label: '12kHz', pos: 0.94 },
      ];

      for (const m of markers) {
        const x = leftOffset + usableWidth * m.pos;
        ctx.fillText(m.label, x, height - 3);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateCanvasResolution);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fxManager, isPlaying, mode, theme, sampleRate, isExpanded]);

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 overflow-hidden shadow-inner">
      {/* Visualizer Top Control Strip */}
      <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Mode Switchers */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>Waveform Analyzer</span>
          </span>

          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 ml-1">
            <button
              type="button"
              onClick={() => setMode('bars')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'bars'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="FFT Frequency Spectrum"
            >
              Spectrum
            </button>
            <button
              type="button"
              onClick={() => setMode('oscilloscope')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'oscilloscope'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Time-Domain Oscilloscope"
            >
              Oscilloscope
            </button>
            <button
              type="button"
              onClick={() => setMode('mirror')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'mirror'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Dual Mirrored Spectrum"
            >
              Mirrored
            </button>
          </div>
        </div>

        {/* Right: Theme Switcher & Expand */}
        <div className="flex items-center gap-2">
          {/* Color Palettes */}
          <div className="flex items-center gap-1">
            {(['neon', 'gold', 'emerald', 'glacier'] as VisualizerTheme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  t === 'neon'
                    ? 'bg-fuchsia-500'
                    : t === 'gold'
                    ? 'bg-amber-400'
                    : t === 'emerald'
                    ? 'bg-emerald-400'
                    : 'bg-sky-400'
                } ${theme === t ? 'scale-125 ring-2 ring-white/40 border-white' : 'border-zinc-700 opacity-60 hover:opacity-100'}`}
                title={`Theme: ${t}`}
              />
            ))}
          </div>

          {/* Toggle Expand Height */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
            title={isExpanded ? 'Compact View' : 'Expanded Studio View'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main High-DPI Canvas */}
      <div className={`relative w-full ${isExpanded ? 'h-36' : 'h-20'} transition-all duration-200`}>
        <canvas
          ref={canvasRef}
          width={680}
          height={isExpanded ? 144 : 80}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Live Audio Telemetry Strip */}
      <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[10px]">PEAK:</span>
            <span
              className={`font-bold ${
                peakDb > -6 ? 'text-rose-400' : peakDb > -18 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isPlaying ? `${peakDb} dB` : '-INF dB'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[10px]">RMS:</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden inline-block align-middle">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${isPlaying ? Math.round(rmsVolume * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <span className="text-zinc-500 text-[10px]">DOMINANT:</span>
            <span className="text-purple-300">{isPlaying ? dominantFreq : 'Idle'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
          <span>{voiceName}</span>
          <span>•</span>
          <span>{(sampleRate / 1000).toFixed(1)} kHz / 16-Bit Mono</span>
        </div>
      </div>
    </div>
  );
};
