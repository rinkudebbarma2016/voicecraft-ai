import React, { useState } from 'react';
import { VOICES } from '../utils/presets';
import { VoiceName, VoiceOption } from '../types/tts';
import { Volume2, Check, Sparkles, User } from 'lucide-react';
import { WebSpeechHelper } from '../utils/audio';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  label?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  label = 'Select Voice Character',
}) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const handlePlayPreview = (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();
    if (playingVoice === voice.name) {
      WebSpeechHelper.stop();
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voice.name);
    // Find closest browser voice for instant audio preview
    const available = WebSpeechHelper.getVoices();
    const matchedVoice = available.find((v) =>
      voice.gender === 'Female' ? v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Zira')
        : v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('George')
    ) || available[0] || null;

    WebSpeechHelper.speak(
      voice.sampleText,
      matchedVoice,
      voice.gender === 'Male' ? 0.95 : 1.0,
      voice.name === 'Fenrir' ? 0.75 : voice.name === 'Puck' ? 1.2 : 1.0,
      1.0,
      () => setPlayingVoice(null),
      () => setPlayingVoice(null)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          {label}
        </label>
        <span className="text-[11px] text-zinc-500">Gemini 3.8 Neural Voices</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.name;
          const isPreviewing = playingVoice === voice.name;

          return (
            <div
              key={voice.name}
              onClick={() => onSelectVoice(voice.name)}
              className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-zinc-800/90 border-purple-500/80 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
              }`}
            >
              {/* Header inside card */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-100 flex items-center gap-1">
                        {voice.displayName}
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 inline" />}
                      </div>
                      <span className="text-[10px] text-zinc-400 capitalize">{voice.gender}</span>
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePlayPreview(e, voice)}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      isPreviewing
                        ? 'bg-purple-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                    }`}
                    title="Audition Voice"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-pulse' : ''}`} />
                  </button>
                </div>

                <div className="text-[11px] font-medium text-purple-300/90 mb-1">
                  {voice.tone}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>
              </div>

              {/* Status bar */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-mono">24kHz Audio</span>
                {isSelected ? (
                  <span className="text-purple-400 font-medium">Selected</span>
                ) : (
                  <span className="text-zinc-500 group-hover:text-zinc-300">Audition</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
