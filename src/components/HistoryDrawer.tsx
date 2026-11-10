import React, { useState } from 'react';
import { GeneratedAudio, AudioMetadata } from '../types/tts';
import {
  Play,
  Download,
  Trash2,
  X,
  Clock,
  FileAudio,
  Archive,
  Loader2,
  Check,
  Tag,
  Music,
  Disc,
  Calendar,
  MessageSquare,
  Sparkles,
  Info,
  Scissors,
} from 'lucide-react';
import { downloadTaggedAudioFile, injectWavMetadata } from '../utils/audio';
import JSZip from 'jszip';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedAudio[];
  onSelectAudio: (audio: GeneratedAudio) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onUpdateMetadata?: (id: string, metadata: AudioMetadata) => void;
  onOpenTrimmer?: (audio: GeneratedAudio) => void;
  onOpenExtender?: (audio: GeneratedAudio) => void;
  currentAudioId?: string;
}

const COMMON_GENRES = [
  'Voiceover',
  'Podcast',
  'Audiobook',
  'Narration',
  'Storytelling',
  'Commercial',
  'Meditation',
  'News / Tech',
];

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectAudio,
  onClearHistory,
  onDeleteItem,
  onUpdateMetadata,
  onOpenTrimmer,
  onOpenExtender,
  currentAudioId,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Metadata editor state
  const [editingAudio, setEditingAudio] = useState<GeneratedAudio | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editComment, setEditComment] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Open the ID3 tag editor for an audio clip
  const handleOpenMetadataEditor = (item: GeneratedAudio) => {
    setEditingAudio(item);
    setEditTitle(item.metadata?.title || item.title || 'Untitled Speech');
    setEditArtist(item.metadata?.artist || item.speakerName || item.voice || 'VoiceCraft AI');
    setEditGenre(item.metadata?.genre || 'Voiceover');
    setEditAlbum(item.metadata?.album || 'VoiceCraft AI Library');
    setEditYear(item.metadata?.year || new Date().getFullYear().toString());
    setEditComment(
      item.metadata?.comment ||
        (item.text.length > 200 ? item.text.slice(0, 197) + '...' : item.text)
    );
  };

  const handleCloseMetadataEditor = () => {
    setEditingAudio(null);
  };

  const handleSaveMetadata = (downloadAfter = false) => {
    if (!editingAudio) return;

    const newMetadata: AudioMetadata = {
      title: editTitle.trim() || editingAudio.title,
      artist: editArtist.trim() || editingAudio.speakerName || editingAudio.voice || 'VoiceCraft AI',
      genre: editGenre.trim() || 'Voiceover',
      album: editAlbum.trim() || 'VoiceCraft AI Library',
      year: editYear.trim() || new Date().getFullYear().toString(),
      comment: editComment.trim() || editingAudio.text.slice(0, 200),
    };

    if (onUpdateMetadata) {
      onUpdateMetadata(editingAudio.id, newMetadata);
    }

    const updatedAudio: GeneratedAudio = {
      ...editingAudio,
      title: newMetadata.title,
      metadata: newMetadata,
    };

    if (downloadAfter) {
      downloadTaggedAudioFile(updatedAudio);
    }

    setSavedNotice(`Tags saved for "${newMetadata.title}"!`);
    setTimeout(() => setSavedNotice(null), 3000);
    setEditingAudio(null);
  };

  // Export all audio clips as a single ZIP file with embedded ID3 metadata
  const handleExportAllZip = async () => {
    if (history.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();
      const folder = zip.folder('voicecraft_audio_clips') || zip;

      // Summary manifest and ID3 catalog
      let transcriptText = `VOICECRAFT AI AUDIO EXPORT MANIFEST (WITH EMBEDDED ID3 TAGS)\n`;
      transcriptText += `Export Date: ${new Date().toISOString()}\n`;
      transcriptText += `Total Audio Files: ${history.length}\n`;
      transcriptText += `Format: Lossless 24kHz WAV with RIFF INFO (INAM, IART, IGNR, IPRD, ICRD) & ID3v2.3 (TIT2, TPE1, TCON, TALB, TYER) tags\n`;
      transcriptText += `------------------------------------------------------\n\n`;

      const id3Catalog: Array<{
        file: string;
        title: string;
        artist: string;
        genre: string;
        album: string;
        year: string;
        transcript: string;
      }> = [];

      history.forEach((item, index) => {
        const fileNum = String(index + 1).padStart(2, '0');
        const effectiveMeta: AudioMetadata = item.metadata || {
          title: item.title || `Clip_${fileNum}`,
          artist: item.speakerName || item.voice || 'VoiceCraft AI',
          genre: 'Voiceover',
          album: 'VoiceCraft AI Library',
          year: new Date().getFullYear().toString(),
          comment: item.text.slice(0, 200),
        };

        const cleanTitle = (effectiveMeta.title || 'clip')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .slice(0, 30);
        const fileName = `${fileNum}_${cleanTitle}.wav`;

        // Inject ID3 tags into WAV binary buffer before writing to ZIP
        if (item.audioBase64) {
          const taggedWavBytes = injectWavMetadata(item.audioBase64, effectiveMeta);
          folder.file(fileName, taggedWavBytes);
        }

        id3Catalog.push({
          file: fileName,
          title: effectiveMeta.title,
          artist: effectiveMeta.artist,
          genre: effectiveMeta.genre,
          album: effectiveMeta.album || 'VoiceCraft AI Library',
          year: effectiveMeta.year || new Date().getFullYear().toString(),
          transcript: item.text,
        });

        transcriptText += `[${fileNum}] ${fileName}\n`;
        transcriptText += `ID3 Title:  ${effectiveMeta.title}\n`;
        transcriptText += `ID3 Artist: ${effectiveMeta.artist}\n`;
        transcriptText += `ID3 Genre:  ${effectiveMeta.genre}\n`;
        transcriptText += `ID3 Album:  ${effectiveMeta.album || 'VoiceCraft AI Library'}\n`;
        transcriptText += `ID3 Year:   ${effectiveMeta.year || new Date().getFullYear()}\n`;
        transcriptText += `Speaker:    ${item.speakerName || item.voice} ${item.voiceB ? `+ ${item.voiceB}` : ''}\n`;
        if (item.accent) transcriptText += `Accent:     ${item.accent}\n`;
        if (item.targetDuration) transcriptText += `Target Duration: ${item.targetDuration}s\n`;
        transcriptText += `Transcript:\n"${item.text}"\n`;
        transcriptText += `------------------------------------------------------\n\n`;
      });

      folder.file('transcripts.txt', transcriptText);
      folder.file('id3_metadata_catalog.json', JSON.stringify(id3Catalog, null, 2));

      // Generate the ZIP blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const zipFilename = `voicecraft_export_${timestamp}.zip`;

      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = zipFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create audio ZIP export:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-zinc-100">Audio History & Exports</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                title="Clear all"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast for Saved Metadata */}
        {savedNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{savedNotice}</span>
          </div>
        )}

        {/* Export All as ZIP Banner */}
        {history.length > 0 && (
          <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-purple-400" />
                <span>Single ZIP Package</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                All {history.length} WAV files with ID3 tags & manifest
              </p>
            </div>

            <button
              onClick={handleExportAllZip}
              disabled={isZipping}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                zipSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
              }`}
              title="Download all generated audio clips as a single ZIP file with embedded ID3 metadata"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : zipSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>ZIP Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* List of Clips */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
              <FileAudio className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
              <p className="text-sm font-medium">No audio generated yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                Generated clips in this session will appear here with ID3 tag editing.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isSelected = item.id === currentAudioId;
              const meta = item.metadata;
              const displayTitle = meta?.title || item.title;
              const displayArtist = meta?.artist || item.speakerName || item.voice;
              const displayGenre = meta?.genre || 'Voiceover';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-purple-500/60 ring-1 ring-purple-500/30'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {displayTitle}
                        </span>
                        {meta && (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 shrink-0"
                            title="ID3 metadata custom tagged"
                          >
                            TAGGED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                        <span className="text-zinc-500">Artist:</span> {displayArtist}
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">Genre:</span> {displayGenre}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 italic mb-2">
                    "{item.text}"
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                        {item.speakerName || item.voice} {item.voiceB ? `+ ${item.voiceB}` : ''}
                      </span>
                      {item.accent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                          {item.accent.split('(')[0]}
                        </span>
                      )}
                      {item.targetDuration && (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {item.targetDuration}s
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Play */}
                      <button
                        onClick={() => onSelectAudio(item)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Play in studio player"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>

                      {/* Precision Trim */}
                      {onOpenTrimmer && (
                        <button
                          onClick={() => onOpenTrimmer(item)}
                          className="px-2 py-1 rounded-lg bg-pink-950/50 hover:bg-pink-850 text-pink-300 border border-pink-700/40 text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                          title="Open in Precision Audio Trimmer (Shortcuts enabled)"
                        >
                          <Scissors className="w-3 h-3 text-pink-400" />
                          <span>Trim</span>
                        </button>
                      )}

                      {/* AI Audio Extender */}
                      {onOpenExtender && (
                        <button
                          onClick={() => onOpenExtender(item)}
                          className="px-2 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-850 text-cyan-300 border border-cyan-700/40 text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                          title="Open in AI Audio Extender (Stretch audio with seamless loops & tails)"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Extend</span>
                        </button>
                      )}

                      {/* Edit ID3 Tags */}
                      <button
                        onClick={() => handleOpenMetadataEditor(item)}
                        className="px-2 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-800/80 text-purple-300 border border-purple-700/40 text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                        title="Edit ID3 tags (Title, Artist, Genre, Album, Year) before export"
                      >
                        <Tag className="w-3 h-3 text-purple-400" />
                        <span>Tags</span>
                      </button>

                      {/* Download WAV with ID3 tags embedded */}
                      <button
                        onClick={() => downloadTaggedAudioFile(item)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 transition-colors"
                        title="Download WAV (with embedded ID3 & RIFF tags)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ID3 Metadata Tag Editor Modal */}
      {editingAudio && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-purple-500/40 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-zinc-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    Edit ID3 Audio Metadata
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      WAV Embedded
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Embed Title, Artist, Genre, Album & Comments directly into the WAV binary
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseMetadataEditor}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Compatibility Info Badge */}
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-start gap-2 text-[11px] text-purple-300">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Tags will be embedded as standard <strong>RIFF INFO</strong> (INAM, IART, IGNR) and{' '}
                <strong>ID3v2.3</strong> chunks so VLC, Apple Music/iTunes, Audacity, and Windows Media Player will display them upon export.
              </span>
            </div>

            {/* Input Fields Grid */}
            <div className="space-y-3 text-xs">
              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Track Title (INAM / TIT2)</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Episode 1 Intro - AI Revolution"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              {/* Artist / Speaker Input + Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Artist / Voice Actor (IART / TPE1)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {editingAudio.speakerName && (
                      <button
                        type="button"
                        onClick={() => setEditArtist(editingAudio.speakerName!)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                      >
                        Use "{editingAudio.speakerName}"
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="e.g. Priya Sharma (Indian Tech Narrator)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              {/* Genre Input + Quick Select Pills */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Genre / Category (IGNR / TCON)</span>
                </label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  placeholder="e.g. Podcast, Voiceover, Audiobook"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs mb-1.5"
                />
                {/* Common Genre Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGenre(g)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        editGenre === g
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Album & Year Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-purple-400" />
                    <span>Album / Project (IPRD / TALB)</span>
                  </label>
                  <input
                    type="text"
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                    placeholder="e.g. VoiceCraft AI Season 1"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Year (ICRD / TYER)</span>
                  </label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>

              {/* Comments / Transcript */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>Comment / Description (ICMT / COMM)</span>
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={2}
                  placeholder="Add transcript notes, description, or cue notes..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseMetadataEditor}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveMetadata(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-zinc-700"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Tags</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMetadata(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save & Export WAV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
