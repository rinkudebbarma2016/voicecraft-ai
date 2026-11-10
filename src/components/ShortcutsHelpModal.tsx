import React from 'react';
import { X, Keyboard, Command, Play, Volume2, Sparkles, Sliders } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause active audio track in workstation player' },
    { key: '⌘K or Ctrl+K', desc: 'Open Command Palette to search voices, tools & tabs' },
    { key: 'T', desc: 'Open Precision Audio Trimmer on active audio' },
    { key: 'E', desc: 'Open AI Audio Extender (seamless loop & reverb tails)' },
    { key: 'N', desc: 'Open Post-Processing Audio Normalizer (-1dB Peak Standard)' },
    { key: '1 to 8', desc: 'Quick switch studio workspaces (Projects, Solo, Video, Flow AI, Clone, etc.)' },
    { key: 'Esc', desc: 'Close any open modal, dialog, or command palette' },
    { key: '?', desc: 'Open this Keyboard Shortcuts cheat sheet' },
  ];

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
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-zinc-400">Boost studio productivity with hotkeys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
            >
              <span className="text-zinc-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700/80 text-purple-300 font-mono text-[11px] font-bold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
