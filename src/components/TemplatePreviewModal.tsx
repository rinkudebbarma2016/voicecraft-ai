import React from 'react';
import {
  X,
  Play,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  Film,
  Mic2,
  Zap,
  Monitor,
  ShoppingBag,
  Volume2,
  Type,
  Video as VideoIcon,
  Maximize2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { WfpProjectTemplate } from '../types/project';

interface TemplatePreviewModalProps {
  template: WfpProjectTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: WfpProjectTemplate) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  if (!isOpen || !template) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mic2':
        return <Mic2 className="w-6 h-6 text-purple-400" />;
      case 'Film':
        return <Film className="w-6 h-6 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-rose-400" />;
      case 'Monitor':
        return <Monitor className="w-6 h-6 text-cyan-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-6 h-6 text-orange-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getClipIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-yellow-400" />;
      case 'audio':
        return <Volume2 className="w-3.5 h-3.5 text-pink-400" />;
      case 'video':
      default:
        return <VideoIcon className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 bg-gradient-to-r ${template.thumbnailGradient} border-b border-zinc-800 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
              {renderIcon(template.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {template.badge}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {template.setupTimeSaved}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/50 text-zinc-300 border border-zinc-700">
                  {template.aspectRatio} • {template.resolution.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{template.name}</h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                {template.description}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Key Advantages / Features */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Included In This Template
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {template.keyFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-configured Tracks & Timeline Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Pre-Configured Tracks ({template.tracks.length}) & Clips ({template.clips.length})</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-400">
                Duration: {template.duration}s • {template.fps} FPS
              </span>
            </div>

            {/* Track Layers Visualization */}
            <div className="space-y-2 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800">
              {template.tracks.map((track) => {
                const trackClips = template.clips.filter((c) => c.trackIndex === track.index);
                return (
                  <div
                    key={track.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                          {track.type.toUpperCase()} #{track.index + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-200">{track.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {trackClips.length} {trackClips.length === 1 ? 'clip' : 'clips'}
                      </span>
                    </div>

                    {/* Clip timeline bars preview */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                      {trackClips.map((clip) => (
                        <div
                          key={clip.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 shrink-0"
                          style={{
                            backgroundColor: `${clip.color || '#3b82f6'}22`,
                            borderColor: `${clip.color || '#3b82f6'}66`,
                            color: clip.color || '#93c5fd',
                          }}
                        >
                          {getClipIcon(clip.type)}
                          <span className="truncate max-w-[140px]">{clip.name}</span>
                          <span className="text-[9px] opacity-75 font-mono">
                            {clip.startTime}s-{clip.startTime + clip.duration}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Platforms & Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500">Best for: </span>
              <span className="text-zinc-200 font-semibold">{template.targetPlatform}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => onUseTemplate(template)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Load Template into Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
