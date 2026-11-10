import React, { useState, useRef } from 'react';
import {
  BatchQueueItem,
  GeneratedAudio,
  NeuralSpeaker,
  VoiceName,
  AccentCode,
  AudioMetadata,
} from '../types/tts';
import { NEURAL_SPEAKERS } from '../utils/neuralVoices';
import { ACCENT_OPTIONS } from '../utils/presets';
import {
  calculateSpeechStats,
  base64ToAudioUrl,
  splitTextIntoChunks,
  concatenateWavBase64List,
  formatTime,
  downloadAudioFile,
  downloadTaggedAudioFile,
  injectWavMetadata,
  normalizeAudioClip,
} from '../utils/audio';
import {
  Layers,
  Upload,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Download,
  Archive,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Sliders,
  Sparkles,
  Scissors,
  Check,
  X,
  FileUp,
  Tag,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  BatchRenameSettings,
  DEFAULT_BATCH_RENAME_SETTINGS,
  generatePatternFilename,
} from '../utils/batchNaming';
import { BatchPatternRenamer } from './BatchPatternRenamer';

interface BatchQueueStudioProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
  geminiAvailable: boolean;
  onPlayAudioInPlayer: (audio: GeneratedAudio) => void;
}

export const BatchQueueStudio: React.FC<BatchQueueStudioProps> = ({
  onAudioGenerated,
  geminiAvailable,
  onPlayAudioInPlayer,
}) => {
  // Queue items state
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);

  // Batch execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const stopRequestedRef = useRef(false);

  // Global settings overrides
  const [globalSpeaker, setGlobalSpeaker] = useState<NeuralSpeaker>(NEURAL_SPEAKERS[0]);
  const [globalAccent, setGlobalAccent] = useState<AccentCode>('en-IN');

  // Bulk Paste Modal / Tool
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [splitMethod, setSplitMethod] = useState<'paragraph' | 'line' | 'delimiter'>('paragraph');
  const [customDelimiter, setCustomDelimiter] = useState('---');

  // Pattern-based rename settings state
  const [renameSettings, setRenameSettings] = useState<BatchRenameSettings>(
    DEFAULT_BATCH_RENAME_SETTINGS
  );
  const [showRenameModal, setShowRenameModal] = useState(false);

  // ZIP packaging state
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to create a new queue item
  const createQueueItem = (
    title: string,
    text: string,
    speaker = globalSpeaker,
    accent = globalAccent
  ): BatchQueueItem => {
    const stats = calculateSpeechStats(text);
    return {
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title || 'Untitled Audio Item',
      text: text.trim(),
      speakerId: speaker.id,
      speakerName: speaker.name,
      baseVoice: speaker.baseVoice,
      accent,
      status: 'pending',
      progress: 0,
      wordsCount: stats.words,
      estimatedSeconds: stats.estimatedSeconds,
    };
  };

  // 1. Handle File Upload (multiple .txt, .md, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchQueueItem[] = [];
    const readPromises: Promise<void>[] = [];

    Array.from(files).forEach((file) => {
      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string' && content.trim()) {
            const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
            newItems.push(createQueueItem(cleanTitle, content));
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsText(file);
      });
      readPromises.push(promise);
    });

    Promise.all(readPromises).then(() => {
      if (newItems.length > 0) {
        setQueue((prev) => [...prev, ...newItems]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  // 2. Handle Bulk Text Split & Add
  const handleBulkSplitAndAdd = () => {
    if (!bulkPasteText.trim()) return;

    let parts: string[] = [];
    if (splitMethod === 'paragraph') {
      parts = bulkPasteText.split(/\n\s*\n+/);
    } else if (splitMethod === 'line') {
      parts = bulkPasteText.split(/\n+/);
    } else {
      parts = bulkPasteText.split(customDelimiter);
    }

    const validParts = parts.map((p) => p.trim()).filter((p) => p.length > 5);
    if (validParts.length === 0) return;

    const newItems = validParts.map((content, idx) => {
      const preview = content.slice(0, 30).trim();
      const title = `Item ${queue.length + idx + 1}: ${preview}...`;
      return createQueueItem(title, content);
    });

    setQueue((prev) => [...prev, ...newItems]);
    setBulkPasteText('');
    setShowPasteModal(false);
  };

  // 3. Load Sample Batch
  const handleLoadSampleBatch = () => {
    const samples = [
      {
        title: '🇮🇳 India Fintech & UPI Overview',
        text: 'India’s Unified Payments Interface processes over ten billion real-time transactions each month across millions of retail merchants and mobile users.',
        speaker: NEURAL_SPEAKERS.find((s) => s.id === 'priya') || NEURAL_SPEAKERS[0],
      },
      {
        title: '🇮🇳 Bengaluru AI Architecture Update',
        text: 'We migrated our vector embeddings to high throughput streaming pipelines, cutting model latency down to forty milliseconds.',
        speaker: NEURAL_SPEAKERS.find((s) => s.id === 'aarav') || NEURAL_SPEAKERS[1],
      },
      {
        title: '🎧 Audio Headphones Ad Spot (15s)',
        text: 'AeroSound Pulse. Titanium drivers, active noise cancellation, and all-day comfort. Hear your world in pristine clarity.',
        speaker: NEURAL_SPEAKERS.find((s) => s.id === 'adam') || NEURAL_SPEAKERS[0],
      },
      {
        title: '📖 The Cosmos & Star Formation',
        text: 'Every heavy element coursing through our veins was once forged in the furnace of dying giant stars billions of years ago.',
        speaker: NEURAL_SPEAKERS.find((s) => s.id === 'rachel') || NEURAL_SPEAKERS[0],
      },
    ];

    const items = samples.map((s) => createQueueItem(s.title, s.text, s.speaker));
    setQueue((prev) => [...prev, ...items]);
  };

  // Apply Global Speaker to All Pending Items
  const handleApplyGlobalSpeaker = () => {
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'pending'
          ? {
              ...item,
              speakerId: globalSpeaker.id,
              speakerName: globalSpeaker.name,
              baseVoice: globalSpeaker.baseVoice,
              accent: globalAccent,
            }
          : item
      )
    );
  };

  // Single Item Synthesis Core
  const processSingleItem = async (item: BatchQueueItem): Promise<GeneratedAudio> => {
    const speakerObj =
      NEURAL_SPEAKERS.find((s) => s.id === item.speakerId) || globalSpeaker;
    const activeStyle = `${speakerObj.stylePrompt}. Accent: ${item.accent}.`;
    const textChunks = splitTextIntoChunks(item.text, 140);

    if (textChunks.length === 1) {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          voice: item.baseVoice,
          style: activeStyle,
          accent: item.accent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'TTS Synthesis failed');
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
        console.warn('Batch normalizer fallback:', e);
      }

      return {
        id: `batch-out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: item.title,
        text: item.text,
        audioBase64: finalBase64,
        audioUrl: finalUrl,
        voice: item.baseVoice,
        speakerId: item.speakerId,
        speakerName: item.speakerName,
        accent: item.accent,
        mode: 'batch',
        style: activeStyle,
        chunksCount: 1,
        totalWords: item.wordsCount,
        timestamp: Date.now(),
        duration: item.estimatedSeconds,
        isNormalized: true,
        peakDb: -1.0,
        normalizationStats: normStats,
        metadata: {
          title: item.title,
          artist: item.speakerName,
          genre: 'Voiceover',
          album: 'VoiceCraft AI Batch Queue',
          year: new Date().getFullYear().toString(),
          comment: item.text.slice(0, 200),
        },
      };
    } else {
      // Multi-chunk unlimited words
      const chunkAudioBase64List: string[] = [];
      const total = textChunks.length;

      for (let i = 0; i < total; i++) {
        const chunkRes = await fetch('/api/tts/chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textChunks[i],
            voice: item.baseVoice,
            style: activeStyle,
            accent: item.accent,
          }),
        });

        const chunkData = await chunkRes.json();
        if (!chunkRes.ok || !chunkData.audioBase64) {
          throw new Error(chunkData.error || `Failed chunk ${i + 1}/${total}`);
        }
        chunkAudioBase64List.push(chunkData.audioBase64);
      }

      const combinedBase64 = concatenateWavBase64List(chunkAudioBase64List);
      let finalBase64 = combinedBase64;
      let finalUrl = base64ToAudioUrl(combinedBase64, 'audio/wav');
      let normStats = undefined;

      try {
        const norm = await normalizeAudioClip(finalBase64, -1.0);
        finalBase64 = norm.normalizedBase64;
        finalUrl = norm.normalizedUrl;
        normStats = norm.stats;
      } catch (e) {
        console.warn('Batch multi-chunk normalizer fallback:', e);
      }

      return {
        id: `batch-out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: item.title,
        text: item.text,
        audioBase64: finalBase64,
        audioUrl: finalUrl,
        voice: item.baseVoice,
        speakerId: item.speakerId,
        speakerName: item.speakerName,
        accent: item.accent,
        mode: 'batch',
        style: activeStyle,
        chunksCount: total,
        totalWords: item.wordsCount,
        timestamp: Date.now(),
        duration: item.estimatedSeconds,
        isNormalized: true,
        peakDb: -1.0,
        normalizationStats: normStats,
        metadata: {
          title: item.title,
          artist: item.speakerName,
          genre: 'Voiceover',
          album: 'VoiceCraft AI Batch Queue',
          year: new Date().getFullYear().toString(),
          comment: item.text.slice(0, 200),
        },
      };
    }
  };

  // Start / Resume Batch Queue Processing
  const handleStartBatch = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsPaused(false);
    stopRequestedRef.current = false;

    // Get snapshot of pending items
    const pendingItems = queue.filter((i) => i.status === 'pending' || i.status === 'failed');

    for (const item of pendingItems) {
      if (stopRequestedRef.current) break;

      // Set item to processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', progress: 30 } : q))
      );

      try {
        const audioResult = await processSingleItem(item);

        // Notify parent app of new generated audio
        onAudioGenerated(audioResult);

        // Update item to completed
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'completed',
                  progress: 100,
                  audioResult,
                  errorMessage: undefined,
                }
              : q
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Batch item failed';
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'failed', progress: 0, errorMessage: errMsg }
              : q
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleStopBatch = () => {
    stopRequestedRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
  };

  // Retry a single failed item
  const handleRetryItem = async (itemId: string) => {
    const item = queue.find((q) => q.id === itemId);
    if (!item) return;

    setQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'processing', progress: 50 } : q))
    );

    try {
      const audioResult = await processSingleItem(item);
      onAudioGenerated(audioResult);

      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? { ...q, status: 'completed', progress: 100, audioResult, errorMessage: undefined }
            : q
        )
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Retry failed';
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: 'failed', progress: 0, errorMessage: errMsg } : q
        )
      );
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all items
  const handleClearAll = () => {
    if (isProcessing) handleStopBatch();
    setQueue([]);
  };

  // Apply renamed titles to queue items in-place
  const handleApplyToQueueTitles = (newTitlesMap: Record<string, string>) => {
    setQueue((prev) =>
      prev.map((item) =>
        newTitlesMap[item.id] ? { ...item, title: newTitlesMap[item.id] } : item
      )
    );
  };

  // Export all completed batch items as a single ZIP with pattern-based file naming
  const handleExportBatchZip = async () => {
    const completedItems = queue.filter((i) => i.status === 'completed' && i.audioResult?.audioBase64);
    if (completedItems.length === 0 || isZipping) return;

    setIsZipping(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();
      const folderName = (renameSettings.projectName || 'voicecraft_batch')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      const folder = zip.folder(folderName) || zip;

      let manifestText = `VOICECRAFT AI BATCH QUEUE EXPORT MANIFEST\n`;
      manifestText += `Export Date: ${new Date().toISOString()}\n`;
      manifestText += `Project Name: ${renameSettings.projectName}\n`;
      manifestText += `Naming Pattern: ${renameSettings.patternTemplate} (Start: ${renameSettings.startCounter}, Padding: ${renameSettings.counterPadding})\n`;
      manifestText += `Total Audio Files: ${completedItems.length}\n`;
      manifestText += `======================================================\n\n`;

      completedItems.forEach((item, index) => {
        const fileNum = String(index + 1).padStart(2, '0');
        // Generate filename using active pattern settings (e.g. ProjectName_Counter.wav)
        const fileName = generatePatternFilename(item, index, renameSettings);

        if (item.audioResult?.audioBase64) {
          const effectiveMeta: AudioMetadata = item.audioResult.metadata || {
            title: fileName.replace(/\.wav$/i, ''),
            artist: item.speakerName,
            genre: 'Voiceover',
            album: renameSettings.projectName || 'VoiceCraft AI Batch Queue',
            year: new Date().getFullYear().toString(),
            comment: item.text.slice(0, 200),
          };
          const taggedBytes = injectWavMetadata(item.audioResult.audioBase64, effectiveMeta);
          folder.file(fileName, taggedBytes);
        }

        manifestText += `[${fileNum}] ${fileName}\n`;
        manifestText += `Original Title: ${item.title}\n`;
        manifestText += `Speaker: ${item.speakerName} (${item.accent})\n`;
        manifestText += `Words: ${item.wordsCount} | Est. Duration: ${item.estimatedSeconds}s\n`;
        manifestText += `Script:\n"${item.text}"\n`;
        manifestText += `------------------------------------------------------\n\n`;
      });

      folder.file('batch_manifest.txt', manifestText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${folderName}_${timestamp}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create batch ZIP export:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Stats calculation
  const totalItems = queue.length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const failedCount = queue.filter((i) => i.status === 'failed').length;
  const totalWords = queue.reduce((acc, i) => acc + i.wordsCount, 0);
  const totalEstSeconds = queue.reduce((acc, i) => acc + i.estimatedSeconds, 0);
  const percentOverall = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.csv,.json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header & Ingestion Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Queue-Based Batch Audio Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bulk convert multiple text files or pasted lists into studio-quality WAV audio with Neural AI speakers.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLoadSampleBatch}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700/60"
            >
              Load Demo Batch
            </button>

            {queue.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>
        </div>

        {/* Ingestion Methods: Drag & Drop Files or Paste Text List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-purple-500/60 bg-zinc-950/40 hover:bg-zinc-900/40 rounded-xl p-5 text-center cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <FileUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Upload Text Files</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Select or drop multiple <code className="text-purple-400">.txt</code>,{' '}
              <code className="text-purple-400">.md</code>, or <code className="text-purple-400">.csv</code> files
            </p>
          </div>

          {/* Box 2: Bulk Paste List */}
          <div
            onClick={() => setShowPasteModal(true)}
            className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 bg-zinc-950/40 hover:bg-zinc-900/40 rounded-xl p-5 text-center cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Paste & Split List of Texts</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Paste long articles, transcripts, or numbered lists and split by paragraphs or lines
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-zinc-100">Paste Multiple Inputs to Split</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={bulkPasteText}
              onChange={(e) => setBulkPasteText(e.target.value)}
              placeholder="Paste multiple sentences, book chapters, or marketing slogans here..."
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Split Method Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Split by:</span>
                {(['paragraph', 'line', 'delimiter'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSplitMethod(method)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors border ${
                      splitMethod === method
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {method === 'paragraph' ? 'Blank Lines' : method === 'line' ? 'Each Line' : 'Delimiter'}
                  </button>
                ))}

                {splitMethod === 'delimiter' && (
                  <input
                    type="text"
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    placeholder="e.g. ---"
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-center text-zinc-200"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSplitAndAdd}
                  disabled={!bulkPasteText.trim()}
                  className="px-4 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  Split & Add Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Configuration & Queue Control Deck */}
      {queue.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Global Speaker Override */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">Default Speaker:</span>
                <select
                  value={globalSpeaker.id}
                  onChange={(e) => {
                    const found = NEURAL_SPEAKERS.find((s) => s.id === e.target.value);
                    if (found) setGlobalSpeaker(found);
                  }}
                  className="bg-zinc-950 text-zinc-200 text-xs border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {NEURAL_SPEAKERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.flag} {s.name} ({s.accent})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">Accent:</span>
                <select
                  value={globalAccent}
                  onChange={(e) => setGlobalAccent(e.target.value as AccentCode)}
                  className="bg-zinc-950 text-zinc-200 text-xs border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {ACCENT_OPTIONS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.flag} {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={handleApplyGlobalSpeaker}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 transition-colors"
                  title="Update all pending queue items with this speaker and accent"
                >
                  Apply to Pending ({pendingCount})
                </button>
              )}
            </div>

            {/* Right: Primary Batch Execution Controls */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
              {/* Pattern Rename Configuration Button */}
              <button
                type="button"
                onClick={() => setShowRenameModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/70 hover:border-purple-500/50 shadow-md transition-all active:scale-95 cursor-pointer group"
                title="Configure pattern-based file naming (e.g. ProjectName_Counter)"
              >
                <Tag className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Pattern Rename</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
                  {renameSettings.patternTemplate}
                </span>
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleExportBatchZip}
                  disabled={isZipping}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 shadow-md shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50"
                  title="Download all generated audio files as a single ZIP file"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating ZIP...</span>
                    </>
                  ) : zipSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ZIP Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Export Batch (.ZIP)</span>
                    </>
                  )}
                </button>
              )}

              {isProcessing ? (
                <button
                  onClick={handleStopBatch}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Stop Batch</span>
                </button>
              ) : (
                <button
                  onClick={handleStartBatch}
                  disabled={pendingCount === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Start Batch ({pendingCount} Pending)
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Queue Progress Bar & Telemetry */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span>
                  Total: <strong className="text-zinc-200">{totalItems}</strong> items
                </span>
                <span>
                  Completed: <strong className="text-emerald-400">{completedCount}</strong>
                </span>
                <span>
                  Pending: <strong className="text-purple-400">{pendingCount}</strong>
                </span>
                {failedCount > 0 && (
                  <span>
                    Failed: <strong className="text-rose-400">{failedCount}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span>Total Words: {totalWords}</span>
                <span>Est. Audio Time: ~{formatTime(totalEstSeconds)}</span>
                <span className="text-purple-400 font-bold">{percentOverall}%</span>
              </div>
            </div>

            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-300"
                style={{ width: `${percentOverall}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Queue Items Table / Cards */}
      <div className="space-y-3">
        {/* Pattern Rename Active Rule Banner */}
        {queue.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Export Filename Pattern:</span>
              <span className="font-mono text-purple-300 font-bold bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                {renameSettings.patternTemplate}
              </span>
              <span className="text-zinc-500 font-mono hidden md:inline">
                → e.g. <strong className="text-emerald-400 font-normal">{generatePatternFilename(queue[0], 0, renameSettings)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(true)}
                className="text-purple-400 hover:text-purple-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>Configure Pattern</span>
              </button>
            </div>
          </div>
        )}

        {queue.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-500">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
            <h4 className="text-sm font-semibold text-zinc-400">Queue is Empty</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Upload multiple text files, paste a bulk list, or click "Load Demo Batch" above to start converting audio in a single operation.
            </p>
          </div>
        ) : (
          queue.map((item, index) => {
            const isItemProcessing = item.status === 'processing';
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isItemProcessing
                    ? 'bg-zinc-900 border-purple-500/80 ring-1 ring-purple-500/40 shadow-lg'
                    : isCompleted
                    ? 'bg-zinc-900/70 border-emerald-900/40 hover:border-emerald-700/60'
                    : isFailed
                    ? 'bg-rose-950/20 border-rose-900/50'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 font-mono text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        setQueue((prev) =>
                          prev.map((q) => (q.id === item.id ? { ...q, title: e.target.value } : q))
                        )
                      }
                      className="text-xs sm:text-sm font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-purple-500 focus:outline-none max-w-xs sm:max-w-md"
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {isItemProcessing && (
                      <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Converting...</span>
                      </span>
                    )}

                    {isCompleted && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    )}

                    {isFailed && (
                      <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    )}

                    {item.status === 'pending' && (
                      <span className="text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Queued</span>
                      </span>
                    )}

                    {/* Delete Item button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isItemProcessing}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors disabled:opacity-20"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Excerpt */}
                <p className="text-xs text-zinc-400 line-clamp-2 italic mb-2.5 font-normal">
                  "{item.text}"
                </p>

                {/* Footer Controls & Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Per-item Speaker Selector */}
                    <select
                      value={item.speakerId}
                      disabled={isItemProcessing || isCompleted}
                      onChange={(e) => {
                        const s = NEURAL_SPEAKERS.find((sp) => sp.id === e.target.value);
                        if (s) {
                          setQueue((prev) =>
                            prev.map((q) =>
                              q.id === item.id
                                ? {
                                    ...q,
                                    speakerId: s.id,
                                    speakerName: s.name,
                                    baseVoice: s.baseVoice,
                                    accent: s.accent === 'Indian English' ? 'en-IN' : 'en-US',
                                  }
                                : q
                            )
                          );
                        }
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[11px] text-zinc-200 focus:outline-none disabled:opacity-50"
                    >
                      {NEURAL_SPEAKERS.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.flag} {sp.name}
                        </option>
                      ))}
                    </select>

                    <span className="text-[11px] text-zinc-500">
                      {item.wordsCount} words • ~{item.estimatedSeconds}s
                    </span>
                  </div>

                  {/* Actions for Completed / Failed Items */}
                  <div className="flex items-center gap-2">
                    {isFailed && (
                      <button
                        onClick={() => handleRetryItem(item.id)}
                        className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    {isCompleted && item.audioResult && (
                      <>
                        <button
                          onClick={() => onPlayAudioInPlayer(item.audioResult!)}
                          className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Audition</span>
                        </button>

                        <button
                          onClick={() => {
                            const customFilename = generatePatternFilename(item, index, renameSettings);
                            downloadTaggedAudioFile(item.audioResult!, customFilename);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                          title={`Download WAV as ${generatePatternFilename(item, index, renameSettings)}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pattern-Based Renaming & Bulk Export Rule Engine Modal */}
      <BatchPatternRenamer
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        settings={renameSettings}
        onUpdateSettings={setRenameSettings}
        queue={queue}
        onApplyToQueueTitles={handleApplyToQueueTitles}
        onExportZip={handleExportBatchZip}
        isZipping={isZipping}
      />
    </div>
  );
};
