import { AudioEqPreset, AudioFilterMode, AudioMetadata, GeneratedAudio } from '../types/tts';

// Convert base64 audio to Blob URL
export const base64ToAudioUrl = (base64Data: string, mimeType = 'audio/wav'): string => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
};

// Split text into semantic speech chunks (~140 words max per chunk)
export const splitTextIntoChunks = (text: string, maxWordsPerChunk = 140): string[] => {
  const clean = text.trim();
  if (!clean) return [];

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk) {
    return [clean];
  }

  const paragraphs = clean.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let currentChunkWords: string[] = [];

  for (const para of paragraphs) {
    const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [para];

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean);
      if (sentenceWords.length === 0) continue;

      if (currentChunkWords.length + sentenceWords.length > maxWordsPerChunk && currentChunkWords.length > 0) {
        chunks.push(currentChunkWords.join(' '));
        currentChunkWords = [];
      }

      if (sentenceWords.length > maxWordsPerChunk) {
        for (let i = 0; i < sentenceWords.length; i += maxWordsPerChunk) {
          chunks.push(sentenceWords.slice(i, i + maxWordsPerChunk).join(' '));
        }
      } else {
        currentChunkWords.push(...sentenceWords);
      }
    }
  }

  if (currentChunkWords.length > 0) {
    chunks.push(currentChunkWords.join(' '));
  }

  return chunks;
};

// Calculate approximate speech duration based on text word count (~145 wpm)
export const calculateSpeechStats = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, estimatedSeconds: 0, chunkCount: 0 };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = trimmed.length;
  // Average speaking pace ~145 words per minute
  const estimatedSeconds = Math.max(1, Math.round((words / 145) * 60));
  const chunkCount = Math.max(1, Math.ceil(words / 140));
  return { words, characters, estimatedSeconds, chunkCount };
};

// Format seconds into MM:SS
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Concatenate multiple base64 WAV strings into a single valid WAV base64 string
export const concatenateWavBase64List = (base64List: string[]): string => {
  if (base64List.length === 0) return '';
  if (base64List.length === 1) return base64List[0];

  const pcmList: Uint8Array[] = [];
  let totalPcmLength = 0;
  let firstHeader: Uint8Array | null = null;

  for (let i = 0; i < base64List.length; i++) {
    const binaryStr = atob(base64List[i]);
    const bytes = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j);
    }

    if (i === 0) {
      firstHeader = bytes.slice(0, 44);
    }

    // Standard WAV has 44 bytes header
    const pcmData = bytes.slice(44);
    pcmList.push(pcmData);
    totalPcmLength += pcmData.length;
  }

  if (!firstHeader) return base64List[0];

  const combinedBytes = new Uint8Array(44 + totalPcmLength);
  combinedBytes.set(firstHeader, 0);

  // Update sizes in header (little endian 32-bit uint)
  const totalFileSize = totalPcmLength + 36;
  const view = new DataView(combinedBytes.buffer);
  view.setUint32(4, totalFileSize, true); // ChunkSize
  view.setUint32(40, totalPcmLength, true); // Subchunk2Size

  let offset = 44;
  for (const pcm of pcmList) {
    combinedBytes.set(pcm, offset);
    offset += pcm.length;
  }

  // Convert combined bytes back to base64
  let binary = '';
  const len = combinedBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combinedBytes[i]);
  }
  return btoa(binary);
};

export const AUDIO_EQ_PRESETS: AudioEqPreset[] = [
  {
    id: 'podcast',
    name: 'Podcast',
    tagline: 'Warm broadcast voice',
    description: 'Proximity low-end warmth (+3.5dB) with subtle mid presence (+1.5dB) for rich, intimate podcasting.',
    badge: 'Broadcast',
    lowGain: 3.5,
    midGain: 1.5,
    highGain: 1.0,
  },
  {
    id: 'music',
    name: 'Music',
    tagline: 'Dynamic smile EQ curve',
    description: 'Punchy sub-bass (+4.5dB), scooped mids (-2.0dB), and shimmering high air (+4.0dB) to blend with music tracks.',
    badge: 'Dynamic',
    lowGain: 4.5,
    midGain: -2.0,
    highGain: 4.0,
  },
  {
    id: 'voiceover',
    name: 'Voiceover',
    tagline: 'Focused studio dialogue',
    description: 'Tightly controlled low-end (+2.0dB) with prominent mid punch (+3.0dB) and articulate presence (+2.5dB).',
    badge: 'Studio Pro',
    lowGain: 2.0,
    midGain: 3.0,
    highGain: 2.5,
  },
  {
    id: 'crisp-speech',
    name: 'Crisp Speech',
    tagline: 'Maximum vocal articulation',
    description: 'Rolls off muddy boominess (-3.0dB) while elevating speech formants (+4.0dB) and consonant crispness (+5.0dB).',
    badge: 'Clarity',
    lowGain: -3.0,
    midGain: 4.0,
    highGain: 5.0,
  },
  {
    id: 'none',
    name: 'Flat',
    tagline: 'Transparent studio bypass',
    description: 'Zero equalization coloration (0dB across all bands). Pure raw neural speech output.',
    badge: 'Clean',
    lowGain: 0,
    midGain: 0,
    highGain: 0,
  },
  {
    id: 'bass-boost',
    name: 'Cinematic Bass',
    tagline: 'Deep resonant authority',
    description: 'Heavy low-frequency emphasis (+8.0dB) for dramatic movie trailers, deep basslines, and narration.',
    badge: 'Deep',
    lowGain: 8.0,
    midGain: 1.0,
    highGain: -1.0,
  },
  {
    id: 'vintage-radio',
    name: 'Vintage Radio',
    tagline: 'Bandpass lo-fi character',
    description: 'High-pass (-12dB) and low-pass (-8dB) cuts with heavy mid-band push (+9.0dB) for telephone / AM radio FX.',
    badge: 'Retro',
    lowGain: -12.0,
    midGain: 9.0,
    highGain: -8.0,
  },
  {
    id: 'warm-hall',
    name: 'Warm Acoustic',
    tagline: 'Natural room resonance',
    description: 'Gentle warmth across low and mid frequencies (+3dB low, +2dB mid) for natural storytelling ambiance.',
    badge: 'Spatial',
    lowGain: 3.0,
    midGain: 2.0,
    highGain: 1.0,
  },
];

// Web Audio API FX Manager for filters & EQ
export class AudioFxManager {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private isNormalized: boolean = false;

  connectElement(audioElement: HTMLAudioElement) {
    if (this.sourceNode) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);

    // 3-Band Equalizer filters
    this.lowFilter = this.audioCtx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 250;

    this.midFilter = this.audioCtx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1500;
    this.midFilter.Q.value = 1.0;

    this.highFilter = this.audioCtx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 4000;

    // Dynamics Compressor for Audio Normalization & Peak Leveling
    this.compressorNode = this.audioCtx.createDynamicsCompressor();
    if (this.isNormalized) {
      this.compressorNode.threshold.value = -22;
      this.compressorNode.knee.value = 24;
      this.compressorNode.ratio.value = 10;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;
    } else {
      this.compressorNode.threshold.value = 0;
      this.compressorNode.ratio.value = 1;
    }

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.isNormalized ? 1.35 : 1.0;

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    // Connect chain: Source -> Low -> Mid -> High -> Compressor -> Gain -> Analyser -> Destination
    this.sourceNode
      .connect(this.lowFilter)
      .connect(this.midFilter)
      .connect(this.highFilter)
      .connect(this.compressorNode)
      .connect(this.gainNode)
      .connect(this.analyser)
      .connect(this.audioCtx.destination);

    // Ensure audio context resumes reliably across all browsers and iframe permissions
    const unlockAudio = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    };
    audioElement.addEventListener('play', unlockAudio);
    audioElement.addEventListener('playing', unlockAudio);
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
  }

  setNormalization(enabled: boolean) {
    this.isNormalized = enabled;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.compressorNode || !this.gainNode) return;
    if (enabled) {
      this.compressorNode.threshold.value = -22;
      this.compressorNode.knee.value = 24;
      this.compressorNode.ratio.value = 10;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;
      this.gainNode.gain.value = 1.35;
    } else {
      this.compressorNode.threshold.value = 0;
      this.compressorNode.ratio.value = 1;
      this.gainNode.gain.value = 1.0;
    }
  }

  getNormalization(): boolean {
    return this.isNormalized;
  }

  getFrequencyData(targetArray?: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser) return null;
    const array = targetArray || new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.analyser.getByteFrequencyData(array);
    return array;
  }

  getTimeDomainData(targetArray?: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser) return null;
    const array = targetArray || new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    this.analyser.getByteTimeDomainData(array);
    return array;
  }


  applyFilterMode(mode: AudioFilterMode) {
    if (!this.lowFilter || !this.midFilter || !this.highFilter || !this.gainNode) return;

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const preset = AUDIO_EQ_PRESETS.find((p) => p.id === mode);
    if (preset) {
      this.lowFilter.gain.value = preset.lowGain;
      this.midFilter.gain.value = preset.midGain;
      this.highFilter.gain.value = preset.highGain;
      this.gainNode.gain.value = mode === 'vintage-radio' ? 1.1 : 1.0;
    } else {
      switch (mode) {
        case 'broadcast':
          this.lowFilter.gain.value = 4.0;
          this.midFilter.gain.value = -1.0;
          this.highFilter.gain.value = 4.0;
          this.gainNode.gain.value = 1.05;
          break;
        case 'none':
        default:
          this.lowFilter.gain.value = 0;
          this.midFilter.gain.value = 0;
          this.highFilter.gain.value = 0;
          this.gainNode.gain.value = 1.0;
          break;
      }
    }

    if (this.isNormalized) {
      this.gainNode.gain.value *= 1.35;
    }
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
}

// Browser Web Speech API Manager with unlimited words sentence-by-sentence queue
export class WebSpeechHelper {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static queue: string[] = [];
  private static isSpeakingQueue = false;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  static getIndianEnglishVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter(
      (v) =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase().includes('en_in') ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('hindi')
    );
  }

  static stop() {
    this.queue = [];
    this.isSpeakingQueue = false;
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Speak with unlimited length sentence chunking to prevent browser 15s timeout
  static speakUnlimited(
    text: string,
    voice: SpeechSynthesisVoice | null,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onProgress?: (currentSentence: number, totalSentences: number) => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ) {
    if (!this.synth) return;
    this.stop();

    // Split by sentence terminators for continuous reading
    const sentences = text
      .match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [text];

    this.queue = [...sentences];
    this.isSpeakingQueue = true;

    let index = 0;
    const total = sentences.length;

    const speakNext = () => {
      if (!this.isSpeakingQueue || index >= total || !this.synth) {
        this.isSpeakingQueue = false;
        if (onEnd) onEnd();
        return;
      }

      const sentenceText = this.queue[index];
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (onProgress) {
        onProgress(index + 1, total);
      }

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis utterance error', e);
        index++;
        speakNext();
      };

      this.synth.speak(utterance);
    };

    speakNext();
  }

  static speak(
    text: string,
    voice: SpeechSynthesisVoice | null,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ) {
    this.speakUnlimited(text, voice, rate, pitch, volume, undefined, onEnd, onError);
  }
}

// Download WAV helper
export const downloadAudioFile = (audioUrl: string, filename = 'voicecraft_speech.wav') => {
  const anchor = document.createElement('a');
  anchor.href = audioUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

// Text encoder for metadata chunks
const textEncoder = new TextEncoder();

// Build RIFF INFO subchunk: 4-byte ID + uint32LE length + null-terminated string + optional padding byte
function createRiffInfoSubchunk(id: string, text: string): Uint8Array {
  const encoded = textEncoder.encode(text + '\0');
  const pad = encoded.length % 2 !== 0 ? 1 : 0;
  const chunk = new Uint8Array(8 + encoded.length + pad);
  for (let i = 0; i < 4; i++) {
    chunk[i] = id.charCodeAt(i);
  }
  const view = new DataView(chunk.buffer);
  view.setUint32(4, encoded.length, true);
  chunk.set(encoded, 8);
  if (pad) {
    chunk[8 + encoded.length] = 0;
  }
  return chunk;
}

// Build standard RIFF LIST INFO chunk (parsed by Windows Media Player, Audacity, VLC, etc.)
export function buildRiffInfoChunk(metadata: AudioMetadata): Uint8Array {
  const subchunks: Uint8Array[] = [];
  if (metadata.title) subchunks.push(createRiffInfoSubchunk('INAM', metadata.title));
  if (metadata.artist) subchunks.push(createRiffInfoSubchunk('IART', metadata.artist));
  if (metadata.genre) subchunks.push(createRiffInfoSubchunk('IGNR', metadata.genre));
  if (metadata.album) subchunks.push(createRiffInfoSubchunk('IPRD', metadata.album));
  if (metadata.year) subchunks.push(createRiffInfoSubchunk('ICRD', metadata.year));
  if (metadata.comment) subchunks.push(createRiffInfoSubchunk('ICMT', metadata.comment));
  subchunks.push(createRiffInfoSubchunk('ISFT', 'VoiceCraft AI Audio'));

  let innerLength = 4; // 'INFO' string
  for (const sc of subchunks) {
    innerLength += sc.length;
  }

  const listChunk = new Uint8Array(8 + innerLength);
  // 'LIST'
  listChunk[0] = 0x4c;
  listChunk[1] = 0x49;
  listChunk[2] = 0x53;
  listChunk[3] = 0x54;
  const view = new DataView(listChunk.buffer);
  view.setUint32(4, innerLength, true);
  // 'INFO'
  listChunk[8] = 0x49;
  listChunk[9] = 0x4e;
  listChunk[10] = 0x46;
  listChunk[11] = 0x4f;

  let offset = 12;
  for (const sc of subchunks) {
    listChunk.set(sc, offset);
    offset += sc.length;
  }
  return listChunk;
}

// Build ID3v2.3 frame: 4-byte ID + 4-byte BE size + 2-byte flags + 1-byte encoding (0x03 for UTF-8) + text
function createId3Frame(id: string, text: string): Uint8Array {
  const textBytes = textEncoder.encode(text);
  const frameLength = 1 + textBytes.length; // 1 byte encoding + text
  const frame = new Uint8Array(10 + frameLength);
  for (let i = 0; i < 4; i++) {
    frame[i] = id.charCodeAt(i);
  }
  const view = new DataView(frame.buffer);
  view.setUint32(4, frameLength, false); // Big endian size
  frame[8] = 0x00;
  frame[9] = 0x00; // flags
  frame[10] = 0x03; // UTF-8 encoding
  frame.set(textBytes, 11);
  return frame;
}

// Build ID3v2.3 COMM frame
function createId3CommentFrame(comment: string): Uint8Array {
  const commentBytes = textEncoder.encode(comment);
  const langBytes = textEncoder.encode('eng');
  const frameLength = 1 + 3 + 1 + commentBytes.length;
  const frame = new Uint8Array(10 + frameLength);
  const id = 'COMM';
  for (let i = 0; i < 4; i++) {
    frame[i] = id.charCodeAt(i);
  }
  const view = new DataView(frame.buffer);
  view.setUint32(4, frameLength, false);
  frame[8] = 0x00;
  frame[9] = 0x00;
  frame[10] = 0x03; // UTF-8
  frame.set(langBytes, 11);
  frame[14] = 0x00; // short description delimiter
  frame.set(commentBytes, 15);
  return frame;
}

// Build ID3v2 RIFF chunk ('id3 ')
export function buildId3WavChunk(metadata: AudioMetadata): Uint8Array {
  const frames: Uint8Array[] = [];
  if (metadata.title) frames.push(createId3Frame('TIT2', metadata.title));
  if (metadata.artist) frames.push(createId3Frame('TPE1', metadata.artist));
  if (metadata.genre) frames.push(createId3Frame('TCON', metadata.genre));
  if (metadata.album) frames.push(createId3Frame('TALB', metadata.album));
  if (metadata.year) frames.push(createId3Frame('TYER', metadata.year));
  if (metadata.comment) frames.push(createId3CommentFrame(metadata.comment));

  let framesSize = 0;
  for (const f of frames) {
    framesSize += f.length;
  }

  // ID3v2 header: 10 bytes ('ID3', 0x03, 0x00, 0x00, 4 syncsafe bytes)
  const id3Data = new Uint8Array(10 + framesSize);
  id3Data[0] = 0x49; // 'I'
  id3Data[1] = 0x44; // 'D'
  id3Data[2] = 0x33; // '3'
  id3Data[3] = 0x03; // version 2.3
  id3Data[4] = 0x00;
  id3Data[5] = 0x00; // flags

  // Syncsafe integer for framesSize (7 bits per byte)
  id3Data[6] = (framesSize >> 21) & 0x7f;
  id3Data[7] = (framesSize >> 14) & 0x7f;
  id3Data[8] = (framesSize >> 7) & 0x7f;
  id3Data[9] = framesSize & 0x7f;

  let offset = 10;
  for (const f of frames) {
    id3Data.set(f, offset);
    offset += f.length;
  }

  // Wrap inside WAV 'id3 ' RIFF chunk (4 bytes 'id3 ', 4 bytes LE size, data, optional pad byte)
  const pad = id3Data.length % 2 !== 0 ? 1 : 0;
  const chunk = new Uint8Array(8 + id3Data.length + pad);
  chunk[0] = 0x69;
  chunk[1] = 0x64;
  chunk[2] = 0x33;
  chunk[3] = 0x20; // 'id3 '
  const view = new DataView(chunk.buffer);
  view.setUint32(4, id3Data.length, true);
  chunk.set(id3Data, 8);
  if (pad) {
    chunk[8 + id3Data.length] = 0;
  }
  return chunk;
}

// Injects RIFF INFO and ID3 metadata tags into a WAV buffer/base64
export function injectWavMetadata(wavInput: Uint8Array | string, metadata: AudioMetadata): Uint8Array {
  let rawBytes: Uint8Array;
  if (typeof wavInput === 'string') {
    const binaryStr = atob(wavInput);
    rawBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      rawBytes[i] = binaryStr.charCodeAt(i);
    }
  } else {
    rawBytes = wavInput;
  }

  if (rawBytes.length < 44) {
    return rawBytes;
  }

  // Verify RIFF WAVE header
  const isRiff =
    rawBytes[0] === 0x52 && rawBytes[1] === 0x49 && rawBytes[2] === 0x46 && rawBytes[3] === 0x46;
  const isWave =
    rawBytes[8] === 0x57 && rawBytes[9] === 0x41 && rawBytes[10] === 0x56 && rawBytes[11] === 0x45;
  if (!isRiff || !isWave) {
    return rawBytes;
  }

  // Generate chunks
  const riffInfoChunk = buildRiffInfoChunk(metadata);
  const id3Chunk = buildId3WavChunk(metadata);

  // Combine original WAV + new metadata chunks
  const totalLength = rawBytes.length + riffInfoChunk.length + id3Chunk.length;
  const result = new Uint8Array(totalLength);
  result.set(rawBytes, 0);
  result.set(riffInfoChunk, rawBytes.length);
  result.set(id3Chunk, rawBytes.length + riffInfoChunk.length);

  // Update RIFF total size at bytes 4..7 (fileSize - 8)
  const view = new DataView(result.buffer);
  view.setUint32(4, totalLength - 8, true);

  return result;
}

// Download WAV with embedded ID3 & RIFF INFO metadata tags
export const downloadTaggedAudioFile = (
  audio: GeneratedAudio,
  customFilename?: string
) => {
  const effectiveMetadata: AudioMetadata = audio.metadata || {
    title: audio.title || 'Untitled Audio',
    artist: audio.speakerName || audio.voice || 'VoiceCraft AI',
    genre: 'Voiceover',
    album: 'VoiceCraft AI Recordings',
    year: new Date().getFullYear().toString(),
    comment: audio.text ? audio.text.slice(0, 200) : '',
  };

  const taggedBytes = injectWavMetadata(audio.audioBase64, effectiveMetadata);
  const blob = new Blob([taggedBytes as unknown as BlobPart], { type: 'audio/wav' });
  const blobUrl = URL.createObjectURL(blob);

  const cleanTitle = (effectiveMetadata.title || 'audio')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);
  const filename = customFilename || `${cleanTitle}.wav`;

  downloadAudioFile(blobUrl, filename);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
};

// Format seconds into precise MM:SS.mmm timecode for precision trimming
export const formatTimecodeMs = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00.000';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 100 ? (ms < 10 ? '00' : '0') : ''}${ms}`;
};

// Convert AudioBuffer to standard 16-bit PCM WAV ArrayBuffer
export const audioBufferToWav = (buffer: AudioBuffer): Uint8Array => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const totalSamples = buffer.length;
  const dataSize = totalSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM 16-bit samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < totalSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      // scale to 16-bit signed integer [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Uint8Array(arrayBuffer);
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Slice audio losslessly given start and end timestamps in seconds
export const sliceWavAudio = async (
  base64Audio: string,
  startSec: number,
  endSec: number
): Promise<{ base64: string; duration: number }> => {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const decodedBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));

  const sampleRate = decodedBuffer.sampleRate;
  const totalDuration = decodedBuffer.duration;

  const safeStart = Math.max(0, Math.min(startSec, totalDuration));
  const safeEnd = Math.max(safeStart + 0.05, Math.min(endSec, totalDuration));

  const startSample = Math.floor(safeStart * sampleRate);
  const endSample = Math.floor(safeEnd * sampleRate);
  const frameCount = endSample - startSample;

  const slicedBuffer = audioCtx.createBuffer(
    decodedBuffer.numberOfChannels,
    frameCount,
    sampleRate
  );

  for (let c = 0; c < decodedBuffer.numberOfChannels; c++) {
    const sourceChannelData = decodedBuffer.getChannelData(c);
    const destChannelData = slicedBuffer.getChannelData(c);
    for (let i = 0; i < frameCount; i++) {
      destChannelData[i] = sourceChannelData[startSample + i];
    }
  }

  const wavUint8 = audioBufferToWav(slicedBuffer);
  
  // Convert Uint8Array to base64
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < wavUint8.length; i += chunkSize) {
    const sub = wavUint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  const resultBase64 = btoa(binary);

  try {
    audioCtx.close();
  } catch {
    // Ignore close errors
  }

  return {
    base64: resultBase64,
    duration: slicedBuffer.duration,
  };
};

// Helper to convert Uint8Array to base64 string
export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
};

// Helper to convert base64 string to Uint8Array
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Directly finds the 'data' chunk in a RIFF WAV file
export const findWavDataChunk = (bytes: Uint8Array): { offset: number; size: number } | null => {
  if (bytes.length < 44) return null;
  // Check 'RIFF' and 'WAVE'
  if (
    bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 || bytes[9] !== 0x41 || bytes[10] !== 0x56 || bytes[11] !== 0x45
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      return {
        offset: offset + 8,
        size: Math.min(chunkSize, bytes.length - (offset + 8)),
      };
    }

    // Move to next chunk, accounting for word alignment (chunks are padded to even byte boundary)
    const paddedSize = chunkSize + (chunkSize % 2);
    offset += 8 + paddedSize;
  }

  return null;
};

// Measures the absolute peak level of audio in dBFS (decibels relative to full scale)
export const measureAudioPeakDb = (
  wavInput: Uint8Array | string
): { peakDb: number; peakLinear: number; isClipped: boolean; maxSample: number } => {
  const bytes = typeof wavInput === 'string' ? base64ToUint8Array(wavInput) : wavInput;
  const dataInfo = findWavDataChunk(bytes);

  if (!dataInfo || dataInfo.size < 2) {
    return { peakDb: -96, peakLinear: 0, isClipped: false, maxSample: 0 };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sampleCount = Math.floor(dataInfo.size / 2);
  let maxAbs = 0;

  for (let i = 0; i < sampleCount; i++) {
    const s = Math.abs(view.getInt16(dataInfo.offset + i * 2, true));
    if (s > maxAbs) maxAbs = s;
  }

  const peakLinear = maxAbs / 32767;
  const peakDb = maxAbs > 0 ? Math.max(-96, 20 * Math.log10(peakLinear)) : -96;

  return {
    peakDb: Math.round(peakDb * 100) / 100,
    peakLinear,
    isClipped: maxAbs >= 32760,
    maxSample: maxAbs,
  };
};

/**
 * Normalizes 16-bit PCM WAV audio to a consistent target peak (default -1.0 dBFS).
 * This is the broadcast mastering standard (EBU R128 / ITU-R BS.1770 / Spotify / YouTube)
 * to avoid inter-sample clipping on lossy encoders while guaranteeing uniform volume.
 */
import { PeakNormalizationStats } from '../types/tts';

export const normalizeWavToPeakDb = (
  wavInput: Uint8Array | string,
  targetPeakDb: number = -1.0
): {
  normalizedBytes: Uint8Array;
  normalizedBase64: string;
  stats: PeakNormalizationStats;
} => {
  const bytes = typeof wavInput === 'string' ? base64ToUint8Array(wavInput) : wavInput;
  const dataInfo = findWavDataChunk(bytes);

  if (!dataInfo || dataInfo.size < 2) {
    // Return copy as-is if not valid WAV
    const copy = new Uint8Array(bytes);
    const base64 = typeof wavInput === 'string' ? wavInput : uint8ArrayToBase64(copy);
    return {
      normalizedBytes: copy,
      normalizedBase64: base64,
      stats: {
        originalPeakLinear: 0,
        originalPeakDb: -96,
        targetPeakDb,
        targetPeakLinear: Math.pow(10, targetPeakDb / 20),
        normalizedPeakDb: -96,
        gainMultiplier: 1.0,
        gainDb: 0,
        clippingPrevented: false,
        sampleCount: 0,
      },
    };
  }

  // Create clone of bytes to avoid mutating input buffer
  const outBytes = new Uint8Array(bytes.length);
  outBytes.set(bytes);
  const view = new DataView(outBytes.buffer, outBytes.byteOffset, outBytes.byteLength);

  const sampleCount = Math.floor(dataInfo.size / 2);
  let maxAbs = 0;

  // Pass 1: Find maximum peak
  for (let i = 0; i < sampleCount; i++) {
    const s = Math.abs(view.getInt16(dataInfo.offset + i * 2, true));
    if (s > maxAbs) maxAbs = s;
  }

  const targetLinear = Math.pow(10, targetPeakDb / 20); // ~0.89125 for -1.0 dBFS
  const targetMaxSample = targetLinear * 32767; // ~29204 for -1.0 dBFS

  let gainMultiplier = 1.0;
  let originalPeakDb = -96;
  let originalPeakLinear = 0;

  if (maxAbs > 0) {
    originalPeakLinear = maxAbs / 32767;
    originalPeakDb = Math.max(-96, 20 * Math.log10(originalPeakLinear));
    gainMultiplier = targetMaxSample / maxAbs;
  }

  // Pass 2: Apply gain with rounding and hard limiter clamping [-32768, 32767]
  if (maxAbs > 0 && Math.abs(gainMultiplier - 1.0) > 0.0001) {
    for (let i = 0; i < sampleCount; i++) {
      const pos = dataInfo.offset + i * 2;
      const s = view.getInt16(pos, true);
      const scaled = Math.round(s * gainMultiplier);
      const clamped = Math.max(-32768, Math.min(32767, scaled));
      view.setInt16(pos, clamped, true);
    }
  }

  const gainDb = Math.round(20 * Math.log10(gainMultiplier) * 100) / 100;
  const normalizedBase64 = uint8ArrayToBase64(outBytes);

  return {
    normalizedBytes: outBytes,
    normalizedBase64,
    stats: {
      originalPeakLinear: Math.round(originalPeakLinear * 1000) / 1000,
      originalPeakDb: Math.round(originalPeakDb * 100) / 100,
      targetPeakDb,
      targetPeakLinear: Math.round(targetLinear * 1000) / 1000,
      normalizedPeakDb: targetPeakDb,
      gainMultiplier: Math.round(gainMultiplier * 10000) / 10000,
      gainDb,
      clippingPrevented: originalPeakDb > targetPeakDb,
      sampleCount,
    },
  };
};

/**
 * Fallback Web Audio normalizer for non-standard WAV or compressed audio
 */
export const normalizeAudioViaWebAudio = async (
  base64Audio: string,
  targetPeakDb: number = -1.0
): Promise<{ normalizedBase64: string; stats: PeakNormalizationStats }> => {
  const bytes = base64ToUint8Array(base64Audio);
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const numChannels = decodedBuffer.numberOfChannels;
    const length = decodedBuffer.length;

    // Find peak across all channels
    let maxAbs = 0;
    for (let c = 0; c < numChannels; c++) {
      const data = decodedBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const val = Math.abs(data[i]);
        if (val > maxAbs) maxAbs = val;
      }
    }

    const targetLinear = Math.pow(10, targetPeakDb / 20);
    const originalPeakDb = maxAbs > 0 ? Math.max(-96, 20 * Math.log10(maxAbs)) : -96;
    const gainMultiplier = maxAbs > 0 ? targetLinear / maxAbs : 1.0;

    // Create normalized buffer
    const normalizedBuffer = audioCtx.createBuffer(
      numChannels,
      length,
      decodedBuffer.sampleRate
    );

    for (let c = 0; c < numChannels; c++) {
      const src = decodedBuffer.getChannelData(c);
      const dest = normalizedBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        dest[i] = Math.max(-1.0, Math.min(1.0, src[i] * gainMultiplier));
      }
    }

    const wavBytes = audioBufferToWav(normalizedBuffer);
    const normalizedBase64 = uint8ArrayToBase64(wavBytes);
    const gainDb = Math.round(20 * Math.log10(gainMultiplier) * 100) / 100;

    return {
      normalizedBase64,
      stats: {
        originalPeakLinear: Math.round(maxAbs * 1000) / 1000,
        originalPeakDb: Math.round(originalPeakDb * 100) / 100,
        targetPeakDb,
        targetPeakLinear: Math.round(targetLinear * 1000) / 1000,
        normalizedPeakDb: targetPeakDb,
        gainMultiplier: Math.round(gainMultiplier * 10000) / 10000,
        gainDb,
        clippingPrevented: originalPeakDb > targetPeakDb,
        sampleCount: length,
        duration: decodedBuffer.duration,
      },
    };
  } finally {
    try {
      audioCtx.close();
    } catch {
      // ignore
    }
  }
};

/**
 * Universal Post-Processing Tool: Normalizes any audio clip to -1dB peak.
 * Runs fast binary PCM normalization first, falls back to Web Audio if needed.
 */
export const normalizeAudioClip = async (
  base64Audio: string,
  targetPeakDb: number = -1.0
): Promise<{ normalizedBase64: string; normalizedUrl: string; stats: PeakNormalizationStats }> => {
  try {
    // Try lightning fast binary PCM normalizer
    const result = normalizeWavToPeakDb(base64Audio, targetPeakDb);
    // Verify peak
    if (result.stats.sampleCount > 0) {
      const normalizedUrl = base64ToAudioUrl(result.normalizedBase64, 'audio/wav');
      return {
        normalizedBase64: result.normalizedBase64,
        normalizedUrl,
        stats: result.stats,
      };
    }
  } catch (err) {
    console.warn('Binary normalization fallback to Web Audio:', err);
  }

  // Fallback to Web Audio
  const webResult = await normalizeAudioViaWebAudio(base64Audio, targetPeakDb);
  const normalizedUrl = base64ToAudioUrl(webResult.normalizedBase64, 'audio/wav');
  return {
    normalizedBase64: webResult.normalizedBase64,
    normalizedUrl,
    stats: webResult.stats,
  };
};

/**
 * Post-processes a GeneratedAudio object by normalizing its audio to -1dB peak
 */
export const normalizeGeneratedAudio = async (
  audio: GeneratedAudio,
  targetPeakDb: number = -1.0
): Promise<GeneratedAudio> => {
  const { normalizedBase64, normalizedUrl, stats } = await normalizeAudioClip(
    audio.audioBase64,
    targetPeakDb
  );

  return {
    ...audio,
    audioBase64: normalizedBase64,
    audioUrl: normalizedUrl,
    isNormalized: true,
    peakDb: targetPeakDb,
    normalizationStats: stats,
  };
};

// Generates an instant, audible studio chime audio clip for initial testing (pre-normalized to -1dB peak)
export const generateDemoChimeAudio = (): GeneratedAudio => {
  const sampleRate = 44100;
  const duration = 2.2;
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  const notes = [329.63, 415.3, 493.88, 659.25];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    notes.forEach((freq, noteIdx) => {
      const noteDelay = noteIdx * 0.16;
      if (t >= noteDelay) {
        const noteT = t - noteDelay;
        const decay = Math.exp(-noteT * 3.0);
        sample += Math.sin(2 * Math.PI * freq * noteT) * decay * 0.35;
      }
    });

    const envelope = Math.min(1, t * 25) * Math.max(0, 1 - t / duration);
    const clamped = Math.max(-1, Math.min(1, sample * envelope));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(44 + i * 2, int16, true);
  }

  const rawBytes = new Uint8Array(buffer);
  // Post-process to exact -1.0 dB peak
  const { normalizedBytes, normalizedBase64, stats } = normalizeWavToPeakDb(rawBytes, -1.0);
  const blob = new Blob([normalizedBytes as unknown as BlobPart], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);

  return {
    id: 'demo-welcome-chime',
    title: 'VoiceCraft AI Studio 16 Pro Demo',
    text: 'Welcome to VoiceCraftAI.com – Studio 16 Pro. Audio Normalization to -1dB Peak, Real-Time Waveform Analyzer, and Neural Voice synthesis ready for testing.',
    voice: 'Puck',
    speakerId: 'spk_ashish',
    speakerName: 'VoiceCraft Studio',
    accent: '🇮🇳 Indian English / Broadcast Master',
    mode: 'solo',
    style: 'Broadcast Master Chime with -1dB Peak Normalization',
    audioBase64: normalizedBase64,
    audioUrl,
    duration: 2.2,
    totalWords: 18,
    chunksCount: 1,
    timestamp: Date.now(),
    isNormalized: true,
    peakDb: -1.0,
    normalizationStats: stats,
    metadata: {
      title: 'VoiceCraft AI Studio 16 Pro Demo',
      artist: 'VoiceCraft AI',
      album: 'Studio 16 Pro Audio Suite',
      genre: 'Broadcast Audio',
      year: new Date().getFullYear().toString(),
      comment: 'Broadcast Master Chime normalized to -1dB peak level',
    },
  };
};


