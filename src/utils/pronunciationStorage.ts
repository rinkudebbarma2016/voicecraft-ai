import { PronunciationEntry } from '../types/pronunciation';
import { DEFAULT_PRONUNCIATION_ENTRIES } from './pronunciationDefaults';

const STORAGE_KEY = 'voicecraft_pronunciation_dict';

/**
 * Loads pronunciation dictionary from localStorage, falling back to curated defaults
 */
export function loadPronunciationDictionary(): PronunciationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load pronunciation dictionary from storage:', err);
  }
  return DEFAULT_PRONUNCIATION_ENTRIES;
}

/**
 * Saves pronunciation dictionary to localStorage
 */
export function savePronunciationDictionary(entries: PronunciationEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save pronunciation dictionary:', err);
  }
}

/**
 * Detects which dictionary entries match the words in the given script
 */
export function detectDictionaryMatches(
  scriptText: string,
  entries: PronunciationEntry[]
): PronunciationEntry[] {
  if (!scriptText || !scriptText.trim()) return [];

  const activeEntries = entries.filter((e) => e.enabled && e.word.trim());
  const matched: PronunciationEntry[] = [];

  for (const entry of activeEntries) {
    const word = entry.word.trim();
    // Escape regex special chars
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = entry.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`\\b${escaped}\\b`, flags);

    if (regex.test(scriptText)) {
      matched.push(entry);
    }
  }

  return matched;
}

/**
 * Replaces matched dictionary terms in the script with their phonetic respellings
 */
export function applyPronunciationToScript(
  scriptText: string,
  entries: PronunciationEntry[]
): { transformedText: string; replacementCount: number } {
  let result = scriptText;
  let count = 0;

  const activeEntries = entries.filter((e) => e.enabled && e.word.trim() && e.phoneme.trim());

  for (const entry of activeEntries) {
    const word = entry.word.trim();
    const phoneme = entry.phoneme.trim();
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = entry.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`\\b${escaped}\\b`, flags);

    const matches = result.match(regex);
    if (matches && matches.length > 0) {
      count += matches.length;
      result = result.replace(regex, phoneme);
    }
  }

  return { transformedText: result, replacementCount: count };
}

/**
 * Builds a natural pronunciation instruction string for the Gemini style prompt
 * e.g., "Pronunciation Guide: Pronounce 'Kubernetes' as 'koo-ber-NET-eez', 'PostgreSQL' as 'post-gres-Q-L'."
 */
export function buildPronunciationPromptGuidance(
  entries: PronunciationEntry[],
  scriptText?: string
): string {
  // If scriptText provided, prioritize matches found in script
  let targetEntries = entries.filter((e) => e.enabled && e.word.trim() && e.phoneme.trim());

  if (scriptText && scriptText.trim()) {
    const scriptMatches = detectDictionaryMatches(scriptText, targetEntries);
    if (scriptMatches.length > 0) {
      targetEntries = scriptMatches;
    }
  }

  if (targetEntries.length === 0) return '';

  const rules = targetEntries
    .slice(0, 12) // Limit to top 12 to maintain concise prompt length
    .map((e) => `pronounce "${e.word}" as "${e.phoneme}"`)
    .join(', ');

  return `Pronunciation Guide: ${rules}.`;
}

/**
 * Test vocalizes a word with phonetic respelling using Web Speech API for instant instant feedback
 */
export function playTestPhonemeAudio(phonemeOrWord: string, voiceName?: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(phonemeOrWord);
  utterance.rate = 0.9; // Slightly slower for clear pronunciation listening
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const matchedVoice = voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('english')) || voices[0];
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}
