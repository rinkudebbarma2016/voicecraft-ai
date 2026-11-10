import React, { useState } from 'react';
import { BatchQueueItem } from '../types/tts';
import {
  BatchRenameSettings,
  RENAME_PRESETS,
  TOKEN_VARIABLES,
  generatePatternFilename,
} from '../utils/batchNaming';
import {
  FileText,
  Sliders,
  Check,
  X,
  Sparkles,
  Archive,
  Copy,
  CheckCircle2,
  HelpCircle,
  Hash,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderDown,
} from 'lucide-react';

interface BatchPatternRenamerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BatchRenameSettings;
  onUpdateSettings: (settings: BatchRenameSettings) => void;
  queue: BatchQueueItem[];
  onApplyToQueueTitles: (newTitlesMap: Record<string, string>) => void;
  onExportZip: () => void;
  isZipping: boolean;
}

export const BatchPatternRenamer: React.FC<BatchPatternRenamerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  queue,
  onApplyToQueueTitles,
  onExportZip,
  isZipping,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewLimit, setPreviewLimit] = useState<number>(8);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyPreset = (template: string) => {
    onUpdateSettings({
      ...settings,
      patternTemplate: template,
    });
    showToast(`Applied pattern: ${template}`);
  };

  const handleInsertToken = (token: string) => {
    const current = settings.patternTemplate;
    const separator = current && !current.endsWith('_') && !current.endsWith('-') ? '_' : '';
    const updated = `${current}${separator}${token}`;
    onUpdateSettings({
      ...settings,
      patternTemplate: updated,
    });
  };

  const handleCopyFilename = (filename: string, idx: number) => {
    navigator.clipboard.writeText(filename);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplyToTitles = () => {
    const map: Record<string, string> = {};
    queue.forEach((item, idx) => {
      // Get safe name without .wav extension
      const nameWithoutExt = generatePatternFilename(item, idx, settings, false);
      map[item.id] = nameWithoutExt;
    });
    onApplyToQueueTitles(map);
    showToast(`Applied pattern names to ${queue.length} queue item titles!`);
  };

  // Completed items count
  const completedCount = queue.filter((i) => i.status === 'completed').length;

  // Generate example for active settings
  const primaryExample = generatePatternFilename(
    queue[0] || {
      title: 'Demo_Scene',
      speakerName: 'Ashish',
      baseVoice: 'Kore',
      accent: 'en-IN',
      wordsCount: 24,
    },
    0,
    settings
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex items-start justify-between gap-4 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pattern-Based File Renaming & Bulk Export
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Rule Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically format file names before bulk ZIP export (e.g.{' '}
                <code className="text-purple-300 font-mono">ProjectName_Counter</code> or{' '}
                <code className="text-indigo-300 font-mono">01_Title_Speaker</code>).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Quick Naming Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {RENAME_PRESETS.map((p) => {
                const isActive = settings.patternTemplate === p.template;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.template)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/40 shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                      <span>{p.icon}</span>
                      <span className="truncate">{p.label.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1 truncate">
                      {p.example}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Grid: Project Name, Pattern Template & Counter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            {/* Project Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Project Name / Prefix</span>
                <span className="text-[10px] text-zinc-500 font-mono">{'{project}'}</span>
              </label>
              <input
                type="text"
                value={settings.projectName}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    projectName: e.target.value,
                  })
                }
                placeholder="e.g. Podcast_Episode_1, AdCampaign_2026, Audiobook"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
              <span className="text-[10px] text-zinc-500 block">
                Replaces <code className="text-purple-400">{'{project}'}</code> in your export files.
              </span>
            </div>

            {/* Pattern Template Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Filename Pattern Template</span>
                <span className="text-[10px] text-emerald-400 font-mono">.wav included</span>
              </label>
              <input
                type="text"
                value={settings.patternTemplate}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    patternTemplate: e.target.value,
                  })
                }
                placeholder="e.g. {project}_{counter:2}_{speaker}"
                className="w-full bg-zinc-950 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-purple-200 font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-[10px] text-zinc-500 block">
                Type custom variables or click the chips below to insert.
              </span>
            </div>

            {/* Counter Configuration */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-zinc-300">
                  Counter Formatting & Casing Options
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Start Counter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[11px]">Start Count:</span>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={settings.startCounter}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          startCounter: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-center text-zinc-200 font-mono"
                    />
                  </div>

                  {/* Counter Padding */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[11px]">Zero Padding:</span>
                    <select
                      value={settings.counterPadding}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          counterPadding: parseInt(e.target.value, 10),
                        })
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono cursor-pointer"
                    >
                      <option value={1}>1 Digit (1, 2, 3)</option>
                      <option value={2}>2 Digits (01, 02)</option>
                      <option value={3}>3 Digits (001, 002)</option>
                      <option value={4}>4 Digits (0001, 0002)</option>
                    </select>
                  </div>

                  {/* Casing */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[11px]">Casing:</span>
                    <select
                      value={settings.casing}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          casing: e.target.value as 'as-is' | 'lowercase' | 'uppercase',
                        })
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 cursor-pointer"
                    >
                      <option value="as-is">Preserve (As-is)</option>
                      <option value="lowercase">lowercase_snake</option>
                      <option value="uppercase">UPPERCASE_SNAKE</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Variable Injection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Insert Dynamic Placeholder Variables</span>
              <span className="text-[10px] text-zinc-500">Click to append to template</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TOKEN_VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => handleInsertToken(v.token)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/30 text-zinc-300 hover:text-purple-200 transition-all font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  title={v.desc}
                >
                  <span className="text-purple-400 font-bold">+</span>
                  <span>{v.token}</span>
                  <span className="text-[9px] text-zinc-500 font-sans ml-1">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Result Highlight Banner */}
          <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-zinc-950 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Output Pattern Preview
              </span>
              <div className="font-mono text-sm sm:text-base font-bold text-white tracking-wide break-all">
                {primaryExample}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleCopyFilename(primaryExample, -1)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedIndex === -1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Name</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Full Queue Mapping Table Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Generated Export Filenames Table ({queue.length} Items in Queue)
              </span>

              {queue.length > 5 && (
                <button
                  type="button"
                  onClick={() => setPreviewLimit(previewLimit === 8 ? 50 : 8)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                >
                  {previewLimit === 8 ? `Show All (${queue.length})` : 'Show Less'}
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500">
                Queue is currently empty. Add or load batch items to see live filename mappings.
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/70">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Original Item Title</th>
                        <th className="py-2.5 px-3">Speaker</th>
                        <th className="py-2.5 px-3">Exported WAV Filename</th>
                        <th className="py-2.5 px-3 w-16 text-center">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {queue.slice(0, previewLimit).map((item, idx) => {
                        const filename = generatePatternFilename(item, idx, settings);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-900/50 transition-colors group"
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-zinc-500 font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-zinc-200 max-w-[200px] truncate">
                              {item.title}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px]">
                                {item.speakerName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 truncate max-w-[320px]">
                              {filename}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleCopyFilename(filename, idx)}
                                className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
                                title="Copy filename"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Apply Names to Queue Button */}
            <button
              type="button"
              onClick={handleApplyToTitles}
              disabled={queue.length === 0}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700/60 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Rename active queue items with the formatted titles"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>Apply to Queue Titles</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Done & Save
            </button>

            {/* Direct Export ZIP with Pattern Names Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onExportZip();
              }}
              disabled={completedCount === 0 || isZipping}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isZipping ? (
                <span>Exporting ZIP...</span>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Export ZIP with Pattern ({completedCount} Ready)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
