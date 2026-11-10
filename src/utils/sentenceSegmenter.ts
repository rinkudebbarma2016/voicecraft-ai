import { NeuralSpeaker } from '../types/tts';
import { NEURAL_SPEAKERS } from './neuralVoices';
import { concatenateWavBase64List, base64ToAudioUrl } from './audio';

export interface SentenceSegment {
  id: string;
  index: number;
  text: string;
  speakerId: string;
  style: string;
  speedMultiplier: number;
  audioBase64?: string;
  audioUrl?: string;
  isGenerating?: boolean;
  error?: string;
  estimatedSeconds?: number;
}

export const EMOTION_STYLE_PRESETS = [
  { id: 'natural', label: 'Natural & Balanced', prompt: 'Natural conversational pace, clear articulation, warm and engaging tone' },
  { id: 'authoritative', label: 'Authoritative & Confident', prompt: 'Deep authoritative executive cadence, steady confident tempo, definitive emphasis' },
  { id: 'enthusiastic', label: 'Excited & High Energy', prompt: 'Enthusiastic upbeat excitement, dynamic inflection, vibrant inspiring delivery' },
  { id: 'empathetic', label: 'Warm & Empathetic', prompt: 'Gentle empathetic warmth, reassuring soft cadence, compassionate delivery' },
  { id: 'dramatic', label: 'Dramatic & Intense', prompt: 'Dramatic cinematic gravitas, thoughtful pauses, compelling intensity' },
  { id: 'whisper', label: 'Intimate Whisper', prompt: 'Soft close-mic whisper, relaxed breathy intimacy, nuanced delicacy' },
  { id: 'inquisitive', label: 'Curious & Inquisitive', prompt: 'Curious rising inflection, thought-provoking cadence, engaging exploratory tone' },
  { id: 'urgent', label: 'Urgent & Fast', prompt: 'Crisp fast-paced urgency, punchy tempo, immediate call to action' },
];

/**
 * Splits continuous text into logical sentences/clauses based on punctuation
 * preserves punctuation at the end of sentences.
 */
export const splitTextIntoSentenceSegments = (
  rawText: string,
  defaultSpeakerId?: string,
  defaultStyle?: string
): SentenceSegment[] => {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Punctuation-based splitting: matches boundaries following ., !, ?, ;, or double newlines
  // Lookbehind for punctuation followed by space or newline, or clean sentence regex
  const regex = /[^.!?;\n]+(?:[.!?;]+["']?|\n+|$)/g;
  const rawMatches = trimmed.match(regex) || [trimmed];

  const speakerId = defaultSpeakerId || NEURAL_SPEAKERS[0].id;
  const style = defaultStyle || EMOTION_STYLE_PRESETS[0].prompt;

  const segments: SentenceSegment[] = [];
  let idx = 0;

  for (const match of rawMatches) {
    const clean = match.trim();
    if (!clean) continue;

    // Word count estimation for seconds (~145 wpm = ~2.4 words per second)
    const words = clean.split(/\s+/).filter(Boolean).length;
    const estimatedSeconds = Math.max(1, Math.round((words / 2.4) * 10) / 10);

    segments.push({
      id: `seg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      index: idx + 1,
      text: clean,
      speakerId,
      style,
      speedMultiplier: 1.0,
      estimatedSeconds,
    });
    idx++;
  }

  return segments;
};

/**
 * Synthesizes a single sentence segment via API
 */
export const synthesizeSentenceAudio = async (
  segment: SentenceSegment,
  speaker: NeuralSpeaker,
  accent = 'en-IN'
): Promise<{ audioBase64: string; audioUrl: string }> => {
  const tuningPrompt = `${speaker.stylePrompt}. Tone & Mood: ${segment.style}. Sentence pace speed: ${segment.speedMultiplier}x.`;

  const res = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: segment.text,
      voice: speaker.baseVoice,
      style: tuningPrompt,
      accent,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.audioBase64) {
    throw new Error(data.error || 'Failed to synthesize sentence audio');
  }

  const audioUrl = base64ToAudioUrl(data.audioBase64, 'audio/wav');
  return {
    audioBase64: data.audioBase64,
    audioUrl,
  };
};

/**
 * Combines all sentence segment audio base64 into a unified master audio take
 */
export const stitchSentenceAudios = (segments: SentenceSegment[]): { combinedBase64: string; audioUrl: string } => {
  const validBase64List = segments
    .filter((s) => Boolean(s.audioBase64))
    .map((s) => s.audioBase64 as string);

  if (validBase64List.length === 0) {
    throw new Error('No synthesized sentence audio segments available to combine');
  }

  const combinedBase64 = concatenateWavBase64List(validBase64List);
  const audioUrl = base64ToAudioUrl(combinedBase64, 'audio/wav');
  return { combinedBase64, audioUrl };
};
