import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Volume2,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sliders,
  Type,
} from 'lucide-react';
import { PronunciationEntry, PronunciationCategory, PhonemeAlphabet } from '../types/pronunciation';
import { DEFAULT_PRONUNCIATION_ENTRIES } from '../utils/pronunciationDefaults';
import {
  savePronunciationDictionary,
  playTestPhonemeAudio,
  detectDictionaryMatches,
  applyPronunciationToScript,
} from '../utils/pronunciationStorage';

interface PronunciationDictionarySectionProps {
  entries: PronunciationEntry[];
  onUpdateEntries: (entries: PronunciationEntry[]) => void;
  currentScriptText: string;
  onApplyToScript: (newScriptText: string) => void;
}

export const PronunciationDictionarySection: React.FC<PronunciationDictionarySectionProps> = ({
  entries,
  onUpdateEntries,
  currentScriptText,
  onApplyToScript,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form states
  const [formWord, setFormWord] = useState('');
  const [formPhoneme, setFormPhoneme] = useState('');
  const [formCategory, setFormCategory] = useState<PronunciationCategory>('Tech & Code');
  const [formAlphabet, setFormAlphabet] = useState<PhonemeAlphabet>('respelling');
  const [formNotes, setFormNotes] = useState('');
  const [formCaseSensitive, setFormCaseSensitive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Categories list
  const categories = [
    'All',
    'Tech & Code',
    'Names & Places',
    'Brand Names',
    'Medical / Science',
    'Acronyms',
    'Custom',
  ];

  // Matched terms in current script
  const scriptMatches = detectDictionaryMatches(currentScriptText, entries);

  // Filtered entries
  const filteredEntries = entries.filter((entry) => {
    const matchesCategory =
      selectedCategory === 'All' || entry.category === selectedCategory;
    const matchesSearch =
      entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phoneme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Toggle entry enabled
  const handleToggleEntry = (id: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e));
    onUpdateEntries(updated);
    savePronunciationDictionary(updated);
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    onUpdateEntries(updated);
    savePronunciationDictionary(updated);
    showToast('Deleted term from pronunciation dictionary');
  };

  // Reset to default dictionary
  const handleResetDefaults = () => {
    if (window.confirm('Reset pronunciation dictionary back to curated defaults? Custom entries will be replaced.')) {
      onUpdateEntries(DEFAULT_PRONUNCIATION_ENTRIES);
      savePronunciationDictionary(DEFAULT_PRONUNCIATION_ENTRIES);
      showToast('Dictionary restored to curated defaults');
    }
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setFormWord('');
    setFormPhoneme('');
    setFormCategory('Tech & Code');
    setFormAlphabet('respelling');
    setFormNotes('');
    setFormCaseSensitive(false);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (entry: PronunciationEntry) => {
    setEditingEntryId(entry.id);
    setFormWord(entry.word);
    setFormPhoneme(entry.phoneme);
    setFormCategory(entry.category);
    setFormAlphabet(entry.alphabet);
    setFormNotes(entry.notes || '');
    setFormCaseSensitive(!!entry.caseSensitive);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Save add/edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim()) {
      setFormError('Word / term cannot be empty');
      return;
    }
    if (!formPhoneme.trim()) {
      setFormError('Phonetic respelling cannot be empty');
      return;
    }

    if (editingEntryId) {
      // Update existing
      const updated = entries.map((item) =>
        item.id === editingEntryId
          ? {
              ...item,
              word: formWord.trim(),
              phoneme: formPhoneme.trim(),
              category: formCategory,
              alphabet: formAlphabet,
              notes: formNotes.trim() || undefined,
              caseSensitive: formCaseSensitive,
            }
          : item
      );
      onUpdateEntries(updated);
      savePronunciationDictionary(updated);
      showToast(`Updated "${formWord.trim()}"`);
    } else {
      // Add new
      const newEntry: PronunciationEntry = {
        id: `pr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        word: formWord.trim(),
        phoneme: formPhoneme.trim(),
        category: formCategory,
        alphabet: formAlphabet,
        notes: formNotes.trim() || undefined,
        caseSensitive: formCaseSensitive,
        enabled: true,
        createdAt: Date.now(),
      };
      const updated = [newEntry, ...entries];
      onUpdateEntries(updated);
      savePronunciationDictionary(updated);
      showToast(`Added "${formWord.trim()}" to dictionary`);
    }

    setIsAddModalOpen(false);
  };

  // Apply substitutions directly into active script
  const handleApplyScriptSubstitutions = () => {
    if (!currentScriptText.trim()) {
      showToast('No script text found to apply to');
      return;
    }
    const { transformedText, replacementCount } = applyPronunciationToScript(
      currentScriptText,
      entries
    );
    if (replacementCount === 0) {
      showToast('No matching dictionary terms found in current script');
      return;
    }
    onApplyToScript(transformedText);
    showToast(`Replaced ${replacementCount} word(s) with phonetic respellings in script!`);
  };

  // Export JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `voicecraft_pronunciation_dict_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported pronunciation dictionary JSON');
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge with existing avoiding duplicate IDs
          const existingIds = new Set(entries.map((x) => x.id));
          const newEntries = parsed.filter((item: PronunciationEntry) => item.word && item.phoneme);
          const combined = [
            ...entries,
            ...newEntries.filter((item) => !existingIds.has(item.id)),
          ];
          onUpdateEntries(combined);
          savePronunciationDictionary(combined);
          showToast(`Imported ${newEntries.length} pronunciation entries!`);
        } else {
          showToast('Invalid JSON dictionary format');
        }
      } catch (err) {
        showToast('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5 animate-fadeIn">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Pronunciation Dictionary</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  {entries.filter((e) => e.enabled).length} Active Phoneme Mappings
                </span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Define custom phonetic respellings for technical terms, foreign names, and brand names to ensure 100% pronunciation accuracy.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Custom Word</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            title="Export Dictionary as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            title="Import Dictionary JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer border border-zinc-700/60"
            title="Reset to Curated Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-purple-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Script Match Banner (If current script contains dictionary terms) */}
      {scriptMatches.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-purple-950/40 to-zinc-950 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{scriptMatches.length} Dictionary Term{scriptMatches.length > 1 ? 's' : ''} Detected in Your Script</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Auto-Pronouncing Active
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {scriptMatches.map((match) => (
                  <span
                    key={match.id}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/60 text-cyan-300 border border-cyan-500/30"
                  >
                    <strong>{match.word}</strong> → {match.phoneme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyScriptSubstitutions}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            title="Replace matching words directly with their phonetic respellings in the script textarea"
          >
            <span>Replace in Script</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search word, phonetic respelling, or notes..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEntries.length === 0 ? (
          <div className="col-span-full py-10 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 border-dashed space-y-2">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-xs font-semibold text-zinc-300">No pronunciation terms found</div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? `No mappings matching "${searchQuery}". Try adding it!`
                : 'Click "Add Custom Word" to define your first phonetic pronunciation mapping.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Term</span>
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isMatchedInScript = scriptMatches.some((m) => m.id === entry.id);
            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  entry.enabled
                    ? isMatchedInScript
                      ? 'bg-zinc-950/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                      : 'bg-zinc-950/80 border-zinc-800/90 hover:border-purple-500/50'
                    : 'bg-zinc-950/40 border-zinc-850 opacity-60'
                }`}
              >
                <div>
                  {/* Top Bar: Word & Category */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">{entry.word}</span>
                      {isMatchedInScript && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                          In Script
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                      {entry.category}
                    </span>
                  </div>

                  {/* Phonetic Respelling Box */}
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 my-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-300 font-semibold truncate">
                      <span className="text-zinc-500 font-normal">/</span>
                      <span>{entry.phoneme}</span>
                      <span className="text-zinc-500 font-normal">/</span>
                    </div>

                    {/* Instant Audio Preview Button */}
                    <button
                      type="button"
                      onClick={() => playTestPhonemeAudio(entry.phoneme)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={`Listen to phonetic pronunciation: ${entry.phoneme}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Syllable stress / Notes */}
                  {entry.notes && (
                    <p className="text-[10px] text-zinc-400 line-clamp-1 italic mb-2">
                      {entry.notes}
                    </p>
                  )}
                </div>

                {/* Footer Controls: Toggle, Edit, Delete */}
                <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={() => handleToggleEntry(entry.id)}
                      className="rounded accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {entry.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(entry)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-zinc-850 transition-colors cursor-pointer"
                      title="Edit Mapping"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-850 transition-colors cursor-pointer"
                      title="Delete Mapping"
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

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEntryId ? 'Edit Pronunciation Term' : 'Add Custom Pronunciation Term'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Map standard spelling to phonetic syllables for speech synthesis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Word Input */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-bold block">
                  Original Word / Term <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formWord}
                  onChange={(e) => setFormWord(e.target.value)}
                  placeholder="e.g. Kubernetes, PostgreSQL, Debbarma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-sm font-medium"
                />
                <span className="text-[10px] text-zinc-500">
                  The exact word or acronym as written in your video script
                </span>
              </div>

              {/* Phonetic Respelling Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-bold">
                    Phonetic Respelling / Pronunciation <span className="text-rose-400">*</span>
                  </label>
                  {formPhoneme && (
                    <button
                      type="button"
                      onClick={() => playTestPhonemeAudio(formPhoneme)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Audio</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formPhoneme}
                  onChange={(e) => setFormPhoneme(e.target.value)}
                  placeholder="e.g. koo-ber-NET-eez, post-gres-Q-L, deb-BAR-mah"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-cyan-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                />
                <span className="text-[10px] text-zinc-500">
                  Tip: Capitalize stressed syllables (e.g. "koo-ber-NET-eez", "WIN", "deb-BAR-mah")
                </span>
              </div>

              {/* Category & Alphabet Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PronunciationCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Tech & Code">Tech & Code</option>
                    <option value="Names & Places">Names & Places</option>
                    <option value="Brand Names">Brand Names</option>
                    <option value="Medical / Science">Medical / Science</option>
                    <option value="Acronyms">Acronyms</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold block">Alphabet Format</label>
                  <select
                    value={formAlphabet}
                    onChange={(e) => setFormAlphabet(e.target.value as PhonemeAlphabet)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="respelling">Phonetic Respelling (Hyphenated)</option>
                    <option value="ipa">IPA (/aɪ piː eɪ/)</option>
                    <option value="cmu">CMU Arpabet</option>
                  </select>
                </div>
              </div>

              {/* Usage Notes */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-semibold block">Notes & Syllable Stress (Optional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Primary stress on second syllable, Greek origin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Case Sensitive Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formCaseSensitive}
                  onChange={(e) => setFormCaseSensitive(e.target.checked)}
                  className="rounded accent-purple-500 cursor-pointer"
                />
                <span className="text-zinc-300 text-[11px]">
                  Case-sensitive match (e.g. match "SQL" but not "sql")
                </span>
              </label>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                >
                  {editingEntryId ? 'Save Changes' : 'Add to Dictionary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
