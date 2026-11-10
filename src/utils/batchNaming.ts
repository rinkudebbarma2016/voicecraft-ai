import { BatchQueueItem } from '../types/tts';

export interface BatchRenameSettings {
  patternTemplate: string;
  projectName: string;
  startCounter: number;
  counterPadding: number;
  separator: string;
  casing: 'as-is' | 'lowercase' | 'uppercase';
  sanitizeSpecialChars: boolean;
}

export const DEFAULT_BATCH_RENAME_SETTINGS: BatchRenameSettings = {
  patternTemplate: '{project}_{counter:2}',
  projectName: 'VoiceCraft_Project',
  startCounter: 1,
  counterPadding: 2,
  separator: '_',
  casing: 'as-is',
  sanitizeSpecialChars: true,
};

export interface RenamePreset {
  id: string;
  label: string;
  template: string;
  example: string;
  icon: string;
}

export const RENAME_PRESETS: RenamePreset[] = [
  {
    id: 'project_counter',
    label: 'Project_Counter',
    template: '{project}_{counter:2}',
    example: 'VoiceCraft_01.wav',
    icon: '🏷️',
  },
  {
    id: 'counter_title',
    label: 'Counter_Title',
    template: '{counter:2}_{title}',
    example: '01_IntroScene.wav',
    icon: '🔢',
  },
  {
    id: 'project_speaker_counter',
    label: 'Project_Speaker_Counter',
    template: '{project}_{speaker}_{counter:2}',
    example: 'VoiceCraft_Ashish_01.wav',
    icon: '🎙️',
  },
  {
    id: 'title_speaker',
    label: 'Title_Speaker',
    template: '{title}_{speaker}',
    example: 'IntroScene_Ashish.wav',
    icon: '📁',
  },
  {
    id: 'speaker_counter_title',
    label: 'Speaker_Counter_Title',
    template: '{speaker}_{counter:2}_{title}',
    example: 'Ashish_01_IntroScene.wav',
    icon: '👤',
  },
  {
    id: 'project_title_date',
    label: 'Project_Title_Date',
    template: '{project}_{title}_{date}',
    example: 'VoiceCraft_Intro_2026-11-03.wav',
    icon: '📅',
  },
];

export const TOKEN_VARIABLES: Array<{ token: string; label: string; desc: string }> = [
  { token: '{project}', label: 'Project Name', desc: 'Custom project or series title' },
  { token: '{counter:2}', label: 'Counter (01)', desc: '2-digit zero-padded index' },
  { token: '{counter:3}', label: 'Counter (001)', desc: '3-digit zero-padded index' },
  { token: '{title}', label: 'Original Title', desc: 'Sanitized queue item title' },
  { token: '{speaker}', label: 'Speaker Name', desc: 'Neural voice name (e.g. Ashish)' },
  { token: '{voice}', label: 'Base Voice', desc: 'Base engine voice (e.g. Kore)' },
  { token: '{accent}', label: 'Accent Code', desc: 'Language / accent code' },
  { token: '{date}', label: 'Date', desc: 'Current date (YYYY-MM-DD)' },
  { token: '{words}', label: 'Words Count', desc: 'Number of words in item' },
];

/**
 * Generates a pattern-based filename for a given batch item and index
 */
export function generatePatternFilename(
  item: {
    title?: string;
    speakerName?: string;
    baseVoice?: string;
    accent?: string;
    wordsCount?: number;
  },
  index: number,
  settings: BatchRenameSettings,
  includeExtension = true
): string {
  const counterVal = (settings.startCounter || 1) + index;
  const padLength = Math.max(1, Math.min(6, settings.counterPadding || 2));
  const defaultPaddedCounter = String(counterVal).padStart(padLength, '0');

  const cleanProject = (settings.projectName || 'Project')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim() || 'Project';

  const cleanTitle = (item.title || 'audio_item')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim() || 'audio_item';

  const cleanSpeaker = (item.speakerName || 'speaker')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  const cleanVoice = (item.baseVoice || 'voice')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();

  const cleanAccent = (item.accent || 'accent')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  const dateStr = new Date().toISOString().slice(0, 10);
  const wordsStr = String(item.wordsCount || 0);

  let template = settings.patternTemplate || '{project}_{counter:2}';

  // Replace explicit padded counter tokens like {counter:3}, {index:4}
  template = template.replace(/\{(?:counter|index):(\d+)\}/gi, (_, digitStr) => {
    const customPad = parseInt(digitStr, 10) || padLength;
    return String(counterVal).padStart(customPad, '0');
  });

  // Replace standard tokens
  template = template.replace(/\{project\}/gi, cleanProject);
  template = template.replace(/\{counter\}/gi, defaultPaddedCounter);
  template = template.replace(/\{index\}/gi, defaultPaddedCounter);
  template = template.replace(/\{title\}/gi, cleanTitle);
  template = template.replace(/\{speaker\}/gi, cleanSpeaker);
  template = template.replace(/\{voice\}/gi, cleanVoice);
  template = template.replace(/\{accent\}/gi, cleanAccent);
  template = template.replace(/\{date\}/gi, dateStr);
  template = template.replace(/\{words\}/gi, wordsStr);

  // Sanitize illegal filesystem characters
  if (settings.sanitizeSpecialChars) {
    template = template.replace(/[\\/:*?"<>|]/g, '_');
  }

  // Apply casing
  if (settings.casing === 'lowercase') {
    template = template.toLowerCase();
  } else if (settings.casing === 'uppercase') {
    template = template.toUpperCase();
  }

  // Remove multiple adjacent underscores and trim edges
  let safeName = template.replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '').trim();
  if (!safeName) safeName = `audio_${defaultPaddedCounter}`;

  // Extension management
  if (safeName.toLowerCase().endsWith('.wav')) {
    safeName = safeName.slice(0, -4);
  }

  return includeExtension ? `${safeName}.wav` : safeName;
}
