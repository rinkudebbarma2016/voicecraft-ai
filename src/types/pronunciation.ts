export type PronunciationCategory =
  | 'Tech & Code'
  | 'Names & Places'
  | 'Brand Names'
  | 'Medical / Science'
  | 'Acronyms'
  | 'Custom';

export type PhonemeAlphabet = 'respelling' | 'ipa' | 'cmu';

export interface PronunciationEntry {
  id: string;
  word: string; // The word as it appears in the script (e.g. "Kubernetes")
  phoneme: string; // Phonetic respelling or IPA (e.g. "koo-ber-NET-eez" or "/kjuːbərˈnɛtiːz/")
  alphabet: PhonemeAlphabet; // 'respelling' (default), 'ipa', 'cmu'
  category: PronunciationCategory;
  notes?: string; // Optional syllable stress or usage notes
  enabled: boolean; // Whether active in synthesis
  caseSensitive?: boolean;
  createdAt: number;
}
