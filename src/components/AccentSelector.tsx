import React from 'react';
import { ACCENT_OPTIONS } from '../utils/presets';
import { AccentCode } from '../types/tts';
import { Globe, Sparkles, Check } from 'lucide-react';

interface AccentSelectorProps {
  selectedAccent: AccentCode;
  onSelectAccent: (accent: AccentCode) => void;
  label?: string;
}

export const AccentSelector: React.FC<AccentSelectorProps> = ({
  selectedAccent,
  onSelectAccent,
  label = 'Accent & Cadence',
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-orange-400" />
          {label}
        </label>
        <span className="text-[11px] text-zinc-500">
          Selected: <strong className="text-zinc-300">{ACCENT_OPTIONS.find((a) => a.code === selectedAccent)?.label}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ACCENT_OPTIONS.map((accent) => {
          const isSelected = selectedAccent === accent.code;
          const isIndian = accent.code.startsWith('en-IN');

          return (
            <button
              key={accent.code}
              type="button"
              onClick={() => onSelectAccent(accent.code)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative group ${
                isSelected
                  ? isIndian
                    ? 'bg-orange-950/40 border-orange-500/80 text-orange-100 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                    : 'bg-purple-950/40 border-purple-500/80 text-purple-100 ring-1 ring-purple-500/50 shadow-md shadow-purple-500/10'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{accent.flag}</span>
                    <span className="text-xs font-semibold truncate">{accent.label.split('(')[0].trim()}</span>
                  </div>
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${isIndian ? 'text-orange-400' : 'text-purple-400'}`}
                    />
                  )}
                </div>

                <div className="text-[10px] text-zinc-400 font-medium">
                  {accent.label.includes('(') ? `(${accent.label.split('(')[1]}` : accent.region}
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1.5 group-hover:text-zinc-400">
                {accent.description}
              </p>

              {isIndian && (
                <div className="absolute top-1 right-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
