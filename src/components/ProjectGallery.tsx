import React, { useState } from 'react';
import {
  Film,
  Clock,
  Play,
  Download,
  Trash2,
  Copy,
  Search,
  Grid,
  List,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Video,
  FileCheck,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { WfpProject, AspectRatioType } from '../types/project';
import { exportProjectToWfp } from '../utils/projectStorage';

interface ProjectGalleryProps {
  projects: WfpProject[];
  onOpenProject: (project: WfpProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject?: (project: WfpProject) => void;
  onNewProjectClick?: () => void;
  selectedProjectId?: string | null;
  onSelectProject?: (project: WfpProject) => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  onNewProjectClick,
  selectedProjectId,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAspectFilter, setSelectedAspectFilter] = useState<'all' | AspectRatioType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Filter projects based on search query and aspect ratio
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAspect =
      selectedAspectFilter === 'all' || project.aspectRatio === selectedAspectFilter;

    return matchesSearch && matchesAspect;
  });

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search recent projects by name, tags, or .wfp filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Aspect Ratio Filter Badges & Grid/List Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            {(['all', '16:9', '9:16', '1:1', '21:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSelectedAspectFilter(ratio)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedAspectFilter === ratio
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {ratio === 'all' ? 'All Aspect Ratios' : ratio}
              </button>
            ))}
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Visual Gallery"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Detailed List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 border-dashed space-y-3">
          <Film className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-300">No matching .wfp projects found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No projects found matching "${searchQuery}". Try a different keyword.`
              : 'Create a new project or import a .wfp project file to get started.'}
          </p>
          {onNewProjectClick && (
            <button
              onClick={onNewProjectClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Project</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Thumbnail Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProjects.map((project) => {
            const isHovered = hoveredProjectId === project.id;
            const isSelected = selectedProjectId === project.id;
            return (
              <div
                key={project.id}
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
                className={`group relative rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-850/95 border-2 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/40'
                    : 'bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/60 hover:shadow-emerald-950/30'
                }`}
                onClick={() => {
                  if (onSelectProject) {
                    onSelectProject(project);
                  } else {
                    onOpenProject(project);
                  }
                }}
                onDoubleClick={() => onOpenProject(project)}
              >
                {/* Visual Thumbnail Window */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-3">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-tr ${project.thumbnailGradient} flex flex-col items-center justify-center p-3 text-center`}
                    >
                      <Film className="w-10 h-10 text-white/40 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
                        {project.aspectRatio} • {project.fps} FPS
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-zinc-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                        ACTIVE CONTEXT
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 font-mono border border-emerald-500/30">
                      {project.aspectRatio}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-semibold text-zinc-300 font-mono">
                      {project.fps}fps
                    </span>
                  </div>

                  {/* Top Right: Resolution Badge */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-medium text-cyan-300 border border-cyan-500/20">
                    {project.resolution.width}x{project.resolution.height}
                  </span>

                  {/* Bottom Badges: Duration & Tracks Count */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-mono text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      {formatDuration(project.duration)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/85 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-400" />
                      {project.clips.length} clips
                    </span>
                  </div>

                  {/* Quick Play/Resume Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center transition-opacity duration-200 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transform group-hover:scale-105 transition-transform">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Session</span>
                    </div>
                  </div>
                </div>

                {/* Card Information */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {project.name}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {project.sizeMb}MB
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-mono text-zinc-500 truncate max-w-[130px]" title={project.filename}>
                      {project.filename}
                    </span>
                    <span className="text-zinc-500 shrink-0">
                      {formatRelativeTime(project.lastEdited)}
                    </span>
                  </div>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800/70 text-zinc-400 border border-zinc-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 mt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(project);
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Export .wfp */}
                    <button
                      type="button"
                      onClick={() => exportProjectToWfp(project)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Download .wfp project file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    {onDuplicateProject && (
                      <button
                        type="button"
                        onClick={() => onDuplicateProject(project)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Duplicate project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
          {filteredProjects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            return (
              <div
                key={project.id}
                onClick={() => {
                  if (onSelectProject) onSelectProject(project);
                  else onOpenProject(project);
                }}
                onDoubleClick={() => onOpenProject(project)}
                className={`p-3.5 transition-colors flex items-center justify-between gap-4 cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                    : 'hover:bg-zinc-850/80'
                }`}
              >
              {/* Left: Thumbnail & Main Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800 relative">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-tr ${project.thumbnailGradient} flex items-center justify-center`}>
                      <Film className="w-4 h-4 text-white/50" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-zinc-300">
                    {project.aspectRatio}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                      {project.name}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 hidden sm:inline">
                      {project.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                    <span className="font-mono text-emerald-400">{formatDuration(project.duration)}</span>
                    <span>•</span>
                    <span>{project.resolution.label}</span>
                    <span>•</span>
                    <span>{project.clips.length} clips</span>
                    <span>•</span>
                    <span className="text-zinc-500">Edited {formatRelativeTime(project.lastEdited)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onOpenProject(project)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportProjectToWfp(project)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Download .wfp"
                >
                  <Download className="w-4 h-4" />
                </button>
                {onDuplicateProject && (
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(project)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteProject(project.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
    </div>
  );
};
