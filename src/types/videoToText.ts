export interface VideoTranscriptSegment {
  id: string;
  start: number; // in seconds
  end: number; // in seconds
  timestamp: string; // e.g. "00:04"
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface VideoSceneAnalysis {
  timestamp: string;
  startSec: number;
  title: string;
  visualDescription: string;
  detectedText?: string;
}

export interface VideoToTextResult {
  fullTranscript: string;
  segments: VideoTranscriptSegment[];
  summary: string[];
  keyTopics: string[];
  onScreenText: string[];
  scenes: VideoSceneAnalysis[];
  srtSubtitles: string;
  vttSubtitles: string;
  wordCount: number;
  durationSeconds: number;
  detectedLanguage: string;
  speakerCount: number;
}
