import React, { useState } from 'react';
import { VoiceName, GeneratedAudio, DialogueLine, AccentCode, NeuralSpeaker } from '../types/tts';
import { VOICES, DIALOGUE_PRESETS, ACCENT_OPTIONS } from '../utils/presets';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import { base64ToAudioUrl, normalizeAudioClip } from '../utils/audio';
import {
  Users,
  Plus,
  Trash2,
  Volume2,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
} from 'lucide-react';

interface DialogueTTSProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
  geminiAvailable: boolean;
}

export const DialogueTTS: React.FC<DialogueTTSProps> = ({
  onAudioGenerated,
  geminiAvailable,
}) => {
  const [speakerA, setSpeakerA] = useState<NeuralSpeaker>(
    NEURAL_SPEAKERS.find((s) => s.id === 'aarav') || NEURAL_SPEAKERS[1]
  );
  const [speakerB, setSpeakerB] = useState<NeuralSpeaker>(
    NEURAL_SPEAKERS.find((s) => s.id === 'priya') || NEURAL_SPEAKERS[0]
  );

  const [lines, setLines] = useState<DialogueLine[]>(DIALOGUE_PRESETS[0].lines);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load sample dialogue
  const handleLoadPreset = (index: number) => {
    const preset = DIALOGUE_PRESETS[index];
    if (preset) {
      const matchA = NEURAL_SPEAKERS.find((s) => s.baseVoice === preset.voiceA) || speakerA;
      const matchB = NEURAL_SPEAKERS.find((s) => s.baseVoice === preset.voiceB) || speakerB;
      setSpeakerA(matchA);
      setSpeakerB(matchB);
      setLines(preset.lines);
      setErrorMsg(null);
    }
  };

  // Add line
  const handleAddLine = () => {
    const lastSpeaker = lines[lines.length - 1]?.speaker;
    const nextSpeaker = lastSpeaker === 'Speaker A' ? 'Speaker B' : 'Speaker A';
    setLines([
      ...lines,
      {
        id: `line-${Date.now()}`,
        speaker: nextSpeaker,
        text: '',
        style: '',
      },
    ]);
  };

  // Update line
  const handleUpdateLine = (id: string, updates: Partial<DialogueLine>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  // Delete line
  const handleDeleteLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  // Insert theatrical tags into a line
  const handleInsertTag = (id: string, tag: string) => {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const updatedText = line.text ? `${line.text} ${tag} ` : `${tag} `;
    handleUpdateLine(id, { text: updatedText });
  };

  // Synthesize Dialogue
  const handleSynthesizeDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setErrorMsg('Please enter dialogue lines with spoken text.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tts/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogue: validLines.map((l) => {
            const isA = l.speaker === 'Speaker A';
            const speakerObj = isA ? speakerA : speakerB;
            const fullStyle = `${speakerObj.name} (${speakerObj.accent}): ${speakerObj.stylePrompt}. ${l.style || ''}`;
            return {
              speaker: l.speaker,
              text: l.text.trim(),
              style: fullStyle,
            };
          }),
          voiceA: speakerA.baseVoice,
          voiceB: speakerB.baseVoice,
          accentA: speakerA.accent === 'Indian English' ? 'en-IN-tech' : 'en-US',
          accentB: speakerB.accent === 'Indian English' ? 'en-IN' : 'en-US',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize dialogue');
      }

      let finalBase64 = data.audioBase64;
      let finalUrl = base64ToAudioUrl(data.audioBase64, 'audio/wav');
      let normStats = data.normalizationStats;

      try {
        const norm = await normalizeAudioClip(finalBase64, -1.0);
        finalBase64 = norm.normalizedBase64;
        finalUrl = norm.normalizedUrl;
        normStats = norm.stats;
      } catch (e) {
        console.warn('Dialogue auto-normalize fallback:', e);
      }

      const previewText = validLines.map((l) => `${l.speaker === 'Speaker A' ? speakerA.name : speakerB.name}: ${l.text}`).join(' | ');

      const newAudio: GeneratedAudio = {
        id: `dialogue-${Date.now()}`,
        title: `Dialogue (${speakerA.name} & ${speakerB.name})`,
        text: previewText.slice(0, 100) + (previewText.length > 100 ? '...' : ''),
        audioBase64: finalBase64,
        audioUrl: finalUrl,
        voice: speakerA.baseVoice,
        voiceB: speakerB.baseVoice,
        speakerName: `${speakerA.name} & ${speakerB.name}`,
        accent: `${speakerA.flag} ${speakerA.name} + ${speakerB.flag} ${speakerB.name}`,
        mode: 'dialogue',
        timestamp: Date.now(),
        isNormalized: true,
        peakDb: -1.0,
        normalizationStats: normStats,
      };

      onAudioGenerated(newAudio);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dialogue synthesis failed';
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Dual-Speaker Neural Dialogue Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Direct two-person screenplays featuring Neural AI characters with backchanneling and natural pauses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 hidden md:inline">Presets:</span>
            {DIALOGUE_PRESETS.map((p, idx) => (
              <button
                key={p.title}
                onClick={() => handleLoadPreset(idx)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700/50"
              >
                {p.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Neural Speaker Assignment Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Speaker A */}
          <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${speakerA.avatarGradient} flex items-center justify-center text-white text-xs font-bold`}>
                  A
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Speaker A Character</span>
                  <p className="text-[10px] text-zinc-400">{speakerA.name} ({speakerA.flag} {speakerA.accent})</p>
                </div>
              </div>

              <select
                value={speakerA.id}
                onChange={(e) => {
                  const found = NEURAL_SPEAKERS.find((s) => s.id === e.target.value);
                  if (found) setSpeakerA(found);
                }}
                className="bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px]"
              >
                {NEURAL_SPEAKERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.flag} {s.name} ({s.accent} - {s.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Speaker B */}
          <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${speakerB.avatarGradient} flex items-center justify-center text-white text-xs font-bold`}>
                  B
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Speaker B Character</span>
                  <p className="text-[10px] text-zinc-400">{speakerB.name} ({speakerB.flag} {speakerB.accent})</p>
                </div>
              </div>

              <select
                value={speakerB.id}
                onChange={(e) => {
                  const found = NEURAL_SPEAKERS.find((s) => s.id === e.target.value);
                  if (found) setSpeakerB(found);
                }}
                className="bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[200px]"
              >
                {NEURAL_SPEAKERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.flag} {s.name} ({s.accent} - {s.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Screenplay Turn Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Dialogue Script Turns ({lines.length})
          </label>

          <button
            onClick={handleAddLine}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Turn</span>
          </button>
        </div>

        {lines.map((line) => {
          const isA = line.speaker === 'Speaker A';
          const activeSpeaker = isA ? speakerA : speakerB;

          return (
            <div
              key={line.id}
              className={`p-4 rounded-xl border transition-all ${
                isA
                  ? 'bg-zinc-900/80 border-emerald-900/40 hover:border-emerald-700/60'
                  : 'bg-zinc-900/80 border-purple-900/40 hover:border-purple-700/60'
              }`}
            >
              {/* Turn Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <select
                    value={line.speaker}
                    onChange={(e) =>
                      handleUpdateLine(line.id, {
                        speaker: e.target.value as 'Speaker A' | 'Speaker B',
                      })
                    }
                    className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                      isA
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                    }`}
                  >
                    <option value="Speaker A">{speakerA.flag} Speaker A ({speakerA.name})</option>
                    <option value="Speaker B">{speakerB.flag} Speaker B ({speakerB.name})</option>
                  </select>

                  <input
                    type="text"
                    value={line.style || ''}
                    onChange={(e) => handleUpdateLine(line.id, { style: e.target.value })}
                    placeholder={`Turn style for ${activeSpeaker.name} (e.g. Whispering, Excited)...`}
                    className="text-xs bg-zinc-950/60 border border-zinc-800 text-zinc-300 placeholder-zinc-600 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-64"
                  />
                </div>

                <button
                  onClick={() => handleDeleteLine(line.id)}
                  disabled={lines.length <= 1}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-20"
                  title="Delete line"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Input */}
              <textarea
                value={line.text}
                onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                placeholder={`What should ${activeSpeaker.name} say?`}
                rows={2}
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 resize-none font-normal"
              />

              {/* Theatrical tags shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1 text-[11px]">
                <span className="text-zinc-500 font-mono text-[10px] mr-1">Insert Cue:</span>
                {[
                  { tag: '<laugh>', label: '😆 <laugh>' },
                  { tag: '<gasp>', label: '😲 <gasp>' },
                  { tag: '<breath>', label: '💨 <breath>' },
                  { tag: '|mhm|', label: '💬 |mhm|' },
                  { tag: '|yeah|', label: '👍 |yeah|' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(line.id, item.tag)}
                    className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-[10px] border border-zinc-700/50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-end pt-2">
        <button
          onClick={handleSynthesizeDialogue}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-xl shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Directing {speakerA.name} & {speakerB.name}...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Generate Screenplay Audio ({speakerA.name} & {speakerB.name})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
