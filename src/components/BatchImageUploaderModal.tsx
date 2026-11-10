import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Sliders,
  Check,
  Upload,
} from 'lucide-react';
import {
  StoryboardScene,
  ImageToVideoMotion,
  ImageToVideoAtmosphere,
} from '../types/imageToVideo';

interface BatchImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScenes: (scenes: StoryboardScene[]) => void;
  defaultDuration?: number;
}

interface PendingImageItem {
  id: string;
  dataUrl: string;
  name: string;
  duration: number;
  motion: ImageToVideoMotion;
  atmosphere: ImageToVideoAtmosphere;
  transition: 'cut' | 'cross-dissolve' | 'slide-left' | 'fade-black' | 'zoom-in';
  prompt: string;
  narrationScript: string;
}

const SAMPLE_PRESET_IMAGES = [
  {
    name: 'Cyberpunk Neon Metropolis',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
    prompt: 'Ultra-detailed cyberpunk city with glowing holograms and reflective rain puddles',
  },
  {
    name: 'Misty Alpine Valley',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    prompt: 'Epic sunrise piercing through morning mist in high mountain peaks',
  },
  {
    name: 'Artisan Coffee Roastery',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    prompt: 'Freshly roasted coffee beans with warm morning volumetric sun rays',
  },
  {
    name: 'Tokyo Rain Street',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
    prompt: 'Reflective Tokyo avenue at night with neon lights and gentle rain ripples',
  },
];

export const BatchImageUploaderModal: React.FC<BatchImageUploaderModalProps> = ({
  isOpen,
  onClose,
  onAddScenes,
  defaultDuration = 5,
}) => {
  const [pendingImages, setPendingImages] = useState<PendingImageItem[]>([]);
  const [globalDuration, setGlobalDuration] = useState<number>(defaultDuration);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|svg|gif|avif|bmp)$/i)
    );
    if (validFiles.length === 0) return;

    const readPromises = validFiles.map(
      (file) =>
        new Promise<{ file: File; dataUrl: string; name: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = (e.target?.result as string) || '';
            const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            resolve({ file, dataUrl, name: fileNameClean });
          };
          reader.readAsDataURL(file);
        })
    );

    const results = await Promise.all(readPromises);
    const motions: ImageToVideoMotion[] = ['zoom-in', 'pan-right', 'orbit', 'tilt-up', 'dolly-zoom'];

    setPendingImages((prev) => {
      const startIdx = prev.length;
      const newItems: PendingImageItem[] = results.map((res, idx) => ({
        id: 'img_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
        dataUrl: res.dataUrl,
        name: res.name || `Scene Image #${startIdx + idx + 1}`,
        duration: globalDuration,
        motion: motions[(startIdx + idx) % motions.length],
        atmosphere: 'none',
        transition: 'cross-dissolve',
        prompt: `Cinematic high-fidelity motion visual: ${res.name}`,
        narrationScript: `Spoken presentation narration for ${res.name}...`,
      }));
      return [...prev, ...newItems];
    });
  };

  const handleAddSamplePreset = (preset: (typeof SAMPLE_PRESET_IMAGES)[0]) => {
    const newId = 'sample_' + Math.random().toString(36).substring(2, 9);
    setPendingImages((prev) => [
      ...prev,
      {
        id: newId,
        dataUrl: preset.url,
        name: preset.name,
        duration: globalDuration,
        motion: prev.length % 2 === 0 ? 'zoom-in' : 'pan-right',
        atmosphere: 'none',
        transition: 'cross-dissolve',
        prompt: preset.prompt,
        narrationScript: `Narrating ${preset.name}...`,
      },
    ]);
  };

  const handleApplyGlobalDuration = (dur: number) => {
    setGlobalDuration(dur);
    setPendingImages((prev) => prev.map((item) => ({ ...item, duration: dur })));
  };

  const handleUpdateItem = (id: string, updates: Partial<PendingImageItem>) => {
    setPendingImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setPendingImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= pendingImages.length) return;
    const copy = [...pendingImages];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setPendingImages(copy);
  };

  const handleFinish = () => {
    if (pendingImages.length === 0) return;

    const convertedScenes: StoryboardScene[] = pendingImages.map((p, idx) => ({
      id: 'sc_' + Date.now() + '_' + idx,
      title: p.name || `Scene #${idx + 1}`,
      image: p.dataUrl,
      imageName: p.name,
      prompt: p.prompt,
      narrationScript: p.narrationScript,
      motion: p.motion,
      atmosphere: p.atmosphere,
      duration: p.duration,
      transition: p.transition,
      lowerThird: {
        enabled: true,
        headline: p.name.toUpperCase(),
        subheadline: `${p.duration}s Scene • ${p.motion}`,
        position: 'bottom-left',
      },
    }));

    onAddScenes(convertedScenes);
    setPendingImages([]);
    onClose();
  };

  const totalCalculatedDuration = pendingImages.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Add Multiple Keyframe Images (+)
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/30 font-mono">
                  {pendingImages.length} Image{pendingImages.length === 1 ? '' : 's'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Select multiple pictures to assemble a seamless multi-shot video presentation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Drag & Drop Zone with Big Plus Icon */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/30'
                : 'border-zinc-700 hover:border-cyan-500/60 hover:bg-zinc-950/50 bg-zinc-950/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10 border border-cyan-500/40">
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">
                Click to browse or drag & drop multiple images here
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                PNG, JPG, WEBP, AVIF • Choose 2 or more images to build your video sequence
              </div>
            </div>
          </div>

          {/* Quick Preset Samples to Add (+) */}
          <div>
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or click (+) to add cinematic sample images:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSamplePreset(preset)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 transition group text-left cursor-pointer"
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-300">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Plus className="w-3 h-3 text-cyan-400" /> Add to list
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Global Duration Setter Choice */}
          {pendingImages.length > 0 && (
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Default Scene Duration:
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {globalDuration}s per image
                </span>
                <span className="text-xs text-zinc-500">
                  (Total video: ~{totalCalculatedDuration}s)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[3, 5, 7, 8, 10, 12, 15].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleApplyGlobalDuration(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      globalDuration === s
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Images List */}
          {pendingImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">
                  Image Sequence ({pendingImages.length})
                </span>
                <span>Drag to reorder or tune individual duration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingImages.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex gap-3 relative group"
                  >
                    {/* Image Preview */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Image Meta Controls */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-cyan-500"
                        placeholder="Scene Title"
                      />

                      {/* Duration Choice for this scene */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400 text-[11px]">Duration:</span>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={item.duration}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              duration: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)),
                            })
                          }
                          className="w-14 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-center text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-zinc-500 text-[11px]">sec</span>
                      </div>

                      {/* Transition & Motion Pickers */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={item.motion}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              motion: e.target.value as ImageToVideoMotion,
                            })
                          }
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-300 focus:outline-none"
                        >
                          <option value="zoom-in">Zoom In</option>
                          <option value="zoom-out">Zoom Out</option>
                          <option value="pan-right">Pan Right</option>
                          <option value="pan-left">Pan Left</option>
                          <option value="ambient-flow">Ambient Flow</option>
                        </select>

                        <select
                          value={item.transition}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              transition: e.target.value as any,
                            })
                          }
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-300 focus:outline-none"
                        >
                          <option value="cross-dissolve">Dissolve</option>
                          <option value="cut">Cut</option>
                          <option value="slide-left">Slide</option>
                          <option value="zoom-in">Zoom</option>
                          <option value="fade-black">Fade</option>
                        </select>
                      </div>
                    </div>

                    {/* Move & Delete Buttons */}
                    <div className="flex flex-col justify-between items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-0.5">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'left')}
                            className="p-1 hover:text-cyan-400 text-zinc-500"
                            title="Move up/left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < pendingImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'right')}
                            className="p-1 hover:text-cyan-400 text-zinc-500"
                            title="Move down/right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="text-xs text-zinc-400">
            {pendingImages.length === 0 ? (
              <span>Add at least 1 image to proceed</span>
            ) : (
              <span className="font-medium text-cyan-300">
                Ready to assemble {pendingImages.length} scenes (~{totalCalculatedDuration}s total duration)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={pendingImages.length === 0}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Add All to Video Studio (+)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
