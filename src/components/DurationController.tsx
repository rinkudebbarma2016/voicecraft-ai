import React, { useState } from 'react';
import { Clock, Wand2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Gauge } from 'lucide-react';
import { formatTime } from '../utils/audio';

interface DurationControllerProps {
  currentWords: number;
  naturalEstimatedSeconds: number;
  targetSeconds: number | null;
  onTargetSecondsChange: (seconds: number | null) => void;
  onFitScriptToTime: (targetSeconds: number) => Promise<void>;
  isFittingScript: boolean;
  requiredSpeedMultiplier: number;
}

const DURATION_PRESETS = [
  { label: '15s', seconds: 15, tag: 'Reel Hook' },
  { label: '30s', seconds: 30, tag: 'Ad / Spot' },
  { label: '45s', seconds: 45, tag: 'Promo' },
  { label: '1m', seconds: 60, tag: 'Standard' },
  { label: '1m 30s', seconds: 90, tag: 'Explainer' },
  { label: '2m', seconds: 120, tag: 'Story' },
  { label: '3m', seconds: 180, tag: 'Podcast' },
  { label: '5m', seconds: 300, tag: 'Keynote' },
];

export const DurationController: React.FC<DurationControllerProps> = ({
  currentWords,
  naturalEstimatedSeconds,
  targetSeconds,
  onTargetSecondsChange,
  onFitScriptToTime,
  isFittingScript,
  requiredSpeedMultiplier,
}) => {
  const [customMinutes, setCustomMinutes] = useState<number>(() => {
    return targetSeconds ? Math.floor(targetSeconds / 60) : 1;
  });
  const [customSecs, setCustomSecs] = useState<number>(() => {
    return targetSeconds ? targetSeconds % 60 : 0;
  });

  const isTargetActive = targetSeconds !== null && targetSeconds > 0;

  const handleCustomTimeApply = (mins: number, secs: number) => {
    const total = Math.max(5, mins * 60 + secs);
    onTargetSecondsChange(total);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = Math.max(0, parseInt(e.target.value) || 0);
    setCustomMinutes(mins);
    handleCustomTimeApply(mins, customSecs);
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const secs = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
    setCustomSecs(secs);
    handleCustomTimeApply(customMinutes, secs);
  };

  // Difference in seconds between natural text read time and target
  const diff = isTargetActive ? naturalEstimatedSeconds - targetSeconds : 0;
  // Ideal word count for target duration at 145 wpm
  const targetWordsIdeal = isTargetActive ? Math.round((targetSeconds / 60) * 145) : currentWords;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Audio Duration & Choice Time Pacing
          </label>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Set your exact target length in seconds or minutes — 100% free with unlimited words.
          </p>
        </div>

        {/* Mode Switcher: Natural vs Target Choice */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => onTargetSecondsChange(null)}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              !isTargetActive
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Natural Time (~{formatTime(naturalEstimatedSeconds)})
          </button>
          <button
            type="button"
            onClick={() => {
              const defaultTarget = customMinutes * 60 + customSecs || 60;
              onTargetSecondsChange(defaultTarget);
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              isTargetActive
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Target Choice Time</span>
          </button>
        </div>
      </div>

      {isTargetActive ? (
        <div className="space-y-4">
          {/* Quick Choice Duration Pills */}
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block mb-2">
              Select Preset Duration:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {DURATION_PRESETS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => {
                      setCustomMinutes(Math.floor(preset.seconds / 60));
                      setCustomSecs(preset.seconds % 60);
                      onTargetSecondsChange(preset.seconds);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{preset.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Exact Minutes & Seconds Inputs */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-300">Custom Choice Time:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={customMinutes}
                  onChange={handleMinutesChange}
                  className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-center font-mono text-sm text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-xs text-zinc-400">mins</span>

                <span className="text-zinc-600 font-bold px-1">:</span>

                <input
                  type="number"
                  min={0}
                  max={59}
                  value={customSecs}
                  onChange={handleSecondsChange}
                  className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-center font-mono text-sm text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-xs text-zinc-400">secs</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-800/40">
                Total: {targetSeconds} seconds ({formatTime(targetSeconds)})
              </span>
            </div>

            {/* Fit Script to Time Button */}
            <button
              type="button"
              onClick={() => onFitScriptToTime(targetSeconds)}
              disabled={isFittingScript || currentWords === 0}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 active:scale-95 transition-all disabled:opacity-50"
              title="Automatically expand or condense text so spoken audio hits exact duration"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isFittingScript ? 'Adapting Script...' : 'Fit Script to Choice Time (AI)'}</span>
            </button>
          </div>

          {/* Time Pacing Metrics & Diagnostic Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Box 1: Target vs Natural */}
            <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">
                Duration Target
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-cyan-300">{formatTime(targetSeconds)}</span>
                <span className="text-[11px] text-zinc-400">
                  (Natural text: ~{formatTime(naturalEstimatedSeconds)})
                </span>
              </div>
            </div>

            {/* Box 2: Word Count Budget */}
            <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">
                Optimal Script Length
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-zinc-200">~{targetWordsIdeal} words</span>
                <span className="text-[11px] text-zinc-400">(Current: {currentWords})</span>
              </div>
            </div>

            {/* Box 3: Required Speaking Pace */}
            <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">
                Playback Speed Sync
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-base font-bold ${
                    requiredSpeedMultiplier > 1.25 || requiredSpeedMultiplier < 0.8
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {requiredSpeedMultiplier.toFixed(2)}x
                </span>
                <span className="text-[10px] text-zinc-400">
                  {requiredSpeedMultiplier === 1
                    ? 'Exact natural match'
                    : requiredSpeedMultiplier > 1
                    ? 'Slightly faster pace'
                    : 'Relaxed slower pace'}
                </span>
              </div>
            </div>
          </div>

          {/* Helpful guidance note */}
          {Math.abs(diff) > 10 && (
            <div className="flex items-center justify-between p-2.5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-[11px] text-cyan-300">
              <span>
                💡 Your text currently reads in ~{formatTime(naturalEstimatedSeconds)}. To hit your{' '}
                <strong>{formatTime(targetSeconds)}</strong> target perfectly, click{' '}
                <strong>"Fit Script to Choice Time (AI)"</strong> to let Gemini adapt the text length.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Natural Duration Mode View */
        <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60 flex flex-wrap items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Speaking at natural human cadence (~145 words/minute):{' '}
              <strong className="text-zinc-200 font-mono">
                {formatTime(naturalEstimatedSeconds)}
              </strong>{' '}
              ({naturalEstimatedSeconds} seconds)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onTargetSecondsChange(60)}
            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 text-[11px]"
          >
            <span>Need audio to last an exact duration? Set target time</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
