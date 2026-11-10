import React, { useRef } from 'react';
import {
  Plus,
  FolderOpen,
  Sparkles,
  Scissors,
  Mic2,
  Monitor,
  Zap,
  Music2,
  Clock,
  Trash2,
  ArrowRight,
  Film,
  Layers,
  Check,
  Video,
} from 'lucide-react';

export interface RecentWfpProject {
  id: string;
  name: string;
  filename: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  resolution: string;
  duration: string;
  lastEdited: string;
  thumbnailGradient: string;
  thumbnailBgImg?: string;
  sizeMb: number;
}

interface CineStartupDashboardProps {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9') => void;
  onNewProject: () => void;
  onOpenProject: (file?: File) => void;
  onOpenQuickTool: (toolId: string) => void;
  onOpenRecentProject: (proj: RecentWfpProject) => void;
  onDeleteRecentProject: (id: string) => void;
  recentProjects: RecentWfpProject[];
}

export const CineStartupDashboard: React.FC<CineStartupDashboardProps> = ({
  aspectRatio,
  setAspectRatio,
  onNewProject,
  onOpenProject,
  onOpenQuickTool,
  onOpenRecentProject,
  onDeleteRecentProject,
  recentProjects,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectOptions: Array<{
    ratio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
    label: string;
    sublabel: string;
    boxClass: string;
  }> = [
    {
      ratio: '16:9',
      label: '16:9 Widescreen',
      sublabel: 'YouTube, TV, Landscape',
      boxClass: 'w-8 h-4.5',
    },
    {
      ratio: '9:16',
      label: '9:16 Portrait',
      sublabel: 'Reels, TikTok, Shorts',
      boxClass: 'w-4.5 h-8',
    },
    {
      ratio: '1:1',
      label: '1:1 Square',
      sublabel: 'Instagram, Feed Post',
      boxClass: 'w-6 h-6',
    },
    {
      ratio: '4:3',
      label: '4:3 Standard',
      sublabel: 'Classic, iPad, Retro',
      boxClass: 'w-7 h-5.5',
    },
    {
      ratio: '21:9',
      label: '21:9 Cinema',
      sublabel: 'Ultrawide Feature Film',
      boxClass: 'w-9 h-4',
    },
  ];

  const quickTools = [
    {
      id: 'text_to_video',
      title: 'Text-to-Video AI',
      desc: 'Prompt to 4K cinematic scene',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 hover:border-emerald-400',
    },
    {
      id: 'smart_cutout',
      title: 'Smart Cutout',
      desc: 'AI portrait & green screen matting',
      icon: <Scissors className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 hover:border-cyan-400',
    },
    {
      id: 'vocal_remover',
      title: 'Vocal Remover',
      desc: 'Isolate speech, acapella & BGM',
      icon: <Mic2 className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 hover:border-purple-400',
    },
    {
      id: 'screen_recorder',
      title: 'Screen Recorder',
      desc: 'PC display, webcam & audio capture',
      icon: <Monitor className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 hover:border-amber-400',
    },
    {
      id: 'instant_mode',
      title: 'Instant Mode',
      desc: 'Auto-edit highlight reels in seconds',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 hover:border-rose-400',
    },
    {
      id: 'auto_beat_sync',
      title: 'Auto Beat Sync',
      desc: 'Cut video to background music rhythm',
      icon: <Music2 className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/40 hover:border-indigo-400',
    },
  ];

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenProject(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn select-none">
      {/* Hidden File Input for .wfp projects */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".wfp,.cine,.proj,.json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Section: Aspect Ratio Selector upfront */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Select Project Aspect Ratio</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Current: {aspectRatio}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Set target video dimensions upfront before entering the multi-track editor.
            </p>
          </div>
        </div>

        {/* Aspect Ratio Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {aspectOptions.map((opt) => {
            const isSelected = aspectRatio === opt.ratio;
            return (
              <button
                key={opt.ratio}
                onClick={() => setAspectRatio(opt.ratio)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-400/50'
                    : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`border-2 rounded ${opt.boxClass} ${
                      isSelected ? 'border-emerald-400 bg-emerald-500/20' : 'border-zinc-600 bg-zinc-900'
                    }`}
                  />
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-zinc-100">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500">{opt.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Actions: Large New Project and Open Project Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* New Project - Big Hero Button */}
        <button
          onClick={onNewProject}
          className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 p-8 text-zinc-950 shadow-2xl shadow-emerald-500/20 text-left transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950/15 backdrop-blur-sm flex items-center justify-center text-zinc-950 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="text-xs font-mono font-black uppercase px-3 py-1 rounded-full bg-zinc-950/20 text-zinc-950">
                Resolution: 1920 x 1080 • {aspectRatio}
              </span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">New Project</h2>
              <p className="text-xs sm:text-sm font-semibold opacity-85 mt-1">
                Launch the professional 16-track video editor with AI tools, keyframing, and cinema audio mixer.
              </p>
            </div>
          </div>
          {/* Decorative Corner Glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
        </button>

        {/* Open Project Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 p-8 flex flex-col justify-between text-left transition-all active:scale-[0.99] cursor-pointer shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              .wfp / .cine
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              Open Project
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Resume an existing project file or import footage from your local drive.
            </p>
          </div>
        </button>
      </div>

      {/* Quick Tools Shortcuts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Quick AI & Creative Tools</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Instant Launch
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onOpenQuickTool(tool.id)}
              className={`p-3.5 rounded-2xl bg-gradient-to-b ${tool.color} border text-left transition-all flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-md`}
            >
              <div className="mb-3 p-2 rounded-xl bg-zinc-950/60 w-fit group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <div>
                <div className="font-bold text-xs text-zinc-100 group-hover:text-white transition-colors">
                  {tool.title}
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{tool.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects Section: Chronological list of .wfp project files */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Recent Projects (.wfp)</h3>
            <span className="text-xs text-zinc-500">({recentProjects.length} saved)</span>
          </div>
          <button
            onClick={() => onNewProject()}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Start Fresh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {recentProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onOpenRecentProject(proj)}
              className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 shadow-md"
            >
              {/* Thumbnail Container */}
              <div className="w-full h-28 rounded-xl overflow-hidden relative border border-zinc-800/80 bg-zinc-900">
                {proj.thumbnailBgImg ? (
                  <img
                    src={proj.thumbnailBgImg}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-tr ${proj.thumbnailGradient} flex items-center justify-center`}
                  >
                    <Film className="w-8 h-8 text-white/50 group-hover:scale-110 transition-transform" />
                  </div>
                )}
                {/* Duration Badge */}
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-zinc-200">
                  {proj.duration}
                </span>
                {/* Aspect Badge */}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-emerald-400 font-mono">
                  {proj.aspectRatio}
                </span>
              </div>

              {/* Title & Metadata */}
              <div>
                <div className="font-bold text-xs text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                  {proj.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-0.5">
                  <span className="font-mono text-zinc-400">{proj.filename}</span>
                  <span>{proj.sizeMb} MB</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Edited {proj.lastEdited}</div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                <span className="text-[10px] text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                  <span>Resume</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRecentProject(proj.id);
                  }}
                  className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Remove from recent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
