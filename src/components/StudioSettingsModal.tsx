import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, Sparkles, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StudioPreferences {
  sampleRate: '24000' | '48000';
  audioFormat: 'wav' | 'mp3_sim';
  autoNormalize: boolean;
  autoScrollToTake: boolean;
  darkOledTheme: boolean;
  hapticFeedback: boolean;
}

const STORAGE_SETTINGS_KEY = 'voicecraft_studio_preferences';

const DEFAULT_PREFERENCES: StudioPreferences = {
  sampleRate: '24000',
  audioFormat: 'wav',
  autoNormalize: true,
  autoScrollToTake: true,
  darkOledTheme: true,
  hapticFeedback: true,
};

export const StudioSettingsModal: React.FC<StudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [prefs, setPrefs] = useState<StudioPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }, [prefs]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Studio Preferences</h3>
              <p className="text-[11px] text-zinc-400">Audio rendering, master output & studio behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Sample Rate */}
          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <label className="font-semibold text-zinc-200 block">
              Audio Synthesis Master Sample Rate
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, sampleRate: '24000' })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  prefs.sampleRate === '24000'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-xs">24 kHz Lossless</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Studio standard (Fastest)</div>
              </button>

              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, sampleRate: '48000' })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  prefs.sampleRate === '48000'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-xs">48 kHz Ultra HD</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Broadcast cinema master</div>
              </button>
            </div>
          </div>

          {/* Audio Normalization Default */}
          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200 block">
                Automatic Peak Normalization & Limiter
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Automatically level output audio loudness to -1.0 dB True Peak across takes
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.autoNormalize}
              onChange={(e) => setPrefs({ ...prefs, autoNormalize: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-700 cursor-pointer"
            />
          </div>

          {/* Auto-scroll to generated take */}
          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200 block">
                Auto-Focus Workstation Player on Generate
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Automatically loads fresh speech into the top deck with live waveform analyzer
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.autoScrollToTake}
              onChange={(e) => setPrefs({ ...prefs, autoScrollToTake: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-700 cursor-pointer"
            />
          </div>

          {/* Dark / OLED Theme */}
          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200 block">
                Deep OLED Studio Theme
              </span>
              <span className="text-[11px] text-zinc-500 block">
                True pitch-black background with vibrant purple and emerald studio accents
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.darkOledTheme}
              onChange={(e) => setPrefs({ ...prefs, darkOledTheme: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-700 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleReset}
            className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-purple-600/25"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
