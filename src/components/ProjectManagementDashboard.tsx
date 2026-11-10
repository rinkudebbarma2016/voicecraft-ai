import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRight,
  Film,
  Layers,
  Check,
  Video,
  Upload,
  Download,
  AlertCircle,
  FileCode,
  Laptop,
  Smartphone,
  Apple,
  User,
  ShieldCheck,
  Search,
  LayoutTemplate,
  CheckCircle2,
  Eye,
  ShoppingBag,
  SlidersHorizontal,
  Bookmark,
  AudioWaveform,
} from 'lucide-react';
import { WfpProject, AspectRatioType, TemplateCategory, WfpProjectTemplate } from '../types/project';
import { GeneratedAudio } from '../types/tts';
import {
  loadRecentProjects,
  saveRecentProject,
  deleteRecentProject,
  parseWfpFile,
  getResolutionForAspect,
  exportProjectToWfp,
} from '../utils/projectStorage';
import { STARTER_TEMPLATES, instantiateTemplateProject } from '../utils/projectTemplates';
import { ProjectGallery } from './ProjectGallery';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { AudioExtenderModal } from './AudioExtenderModal';

interface ProjectManagementDashboardProps {
  onEnterWorkspace: (project: WfpProject) => void;
  onOpenQuickTool?: (toolId: string) => void;
  onOpenAuthModal?: () => void;
  onOpenDownloadModal?: () => void;
  currentProject?: WfpProject | null;
  currentAudio?: GeneratedAudio | null;
  onAudioExtended?: (audio: GeneratedAudio) => void;
}

export const ProjectManagementDashboard: React.FC<ProjectManagementDashboardProps> = ({
  onEnterWorkspace,
  onOpenQuickTool,
  onOpenAuthModal,
  onOpenDownloadModal,
  currentProject,
  currentAudio,
  onAudioExtended,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  const [projects, setProjects] = useState<WfpProject[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'all' | 'templates' | 'recent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [previewTemplate, setPreviewTemplate] = useState<WfpProjectTemplate | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [isExtenderOpen, setIsExtenderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProject, setSelectedProject] = useState<WfpProject | null>(() => currentProject || null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Load recent projects on mount
  useEffect(() => {
    setProjects(loadRecentProjects());
  }, []);

  // Sync selectedProject whenever currentProject changes from outside
  useEffect(() => {
    if (currentProject) {
      setSelectedProject(currentProject);
      setAspectRatio(currentProject.aspectRatio);
    }
  }, [currentProject]);

  // Dynamically set page title and SEO meta tags based on selected/active project name
  useEffect(() => {
    const DEFAULT_PAGE_TITLE = 'VoiceCraft AI – Text to Speech, AI Voice Cloning & Video Studio';
    const activeProject = selectedProject || currentProject;

    if (activeProject && activeProject.name && activeProject.name.trim()) {
      const cleanName = activeProject.name.trim();
      const projectTitle = `${cleanName} • CineStudio Pro 16 Project | VoiceCraft AI`;
      document.title = projectTitle;

      // Update meta description tag for enhanced SEO context during active session
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Active project session: "${cleanName}" (${activeProject.aspectRatio} • ${activeProject.resolution.label || '1080p'}) in CineStudio Pro 16 & VoiceCraft AI workstation.`
        );
      }

      // Update OpenGraph Title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', projectTitle);
      }

      // Update Twitter Card Title
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', projectTitle);
      }
    } else if (previewTemplate) {
      const templateTitle = `${previewTemplate.name} (Template Starter) • CineStudio Pro 16 | VoiceCraft AI`;
      document.title = templateTitle;
    } else {
      const defaultDashboardTitle = 'Project Management Dashboard • CineStudio Pro 16 (.wfp Hub) | VoiceCraft AI';
      document.title = defaultDashboardTitle;
    }

    return () => {
      document.title = DEFAULT_PAGE_TITLE;
    };
  }, [selectedProject, currentProject, previewTemplate]);

  const aspectOptions: Array<{
    ratio: AspectRatioType;
    label: string;
    sublabel: string;
    iconBoxClass: string;
    popular?: boolean;
  }> = [
    {
      ratio: '16:9',
      label: '16:9 Widescreen',
      sublabel: 'YouTube, TV, Landscape',
      iconBoxClass: 'w-8 h-4.5',
      popular: true,
    },
    {
      ratio: '9:16',
      label: '9:16 Portrait',
      sublabel: 'Reels, TikTok, Shorts',
      iconBoxClass: 'w-4.5 h-8',
      popular: true,
    },
    {
      ratio: '1:1',
      label: '1:1 Square',
      sublabel: 'Instagram Feed, Square',
      iconBoxClass: 'w-6 h-6',
    },
    {
      ratio: '4:5',
      label: '4:5 Portrait',
      sublabel: 'Instagram Portrait',
      iconBoxClass: 'w-5.5 h-7',
    },
    {
      ratio: '21:9',
      label: '21:9 Cinema',
      sublabel: 'Ultrawide Feature Film',
      iconBoxClass: 'w-9 h-4',
    },
    {
      ratio: '4:3',
      label: '4:3 Standard',
      sublabel: 'Classic, iPad, TV',
      iconBoxClass: 'w-7 h-5.5',
    },
  ];

  const categories: TemplateCategory[] = [
    'All',
    'Podcasts',
    'Documentary',
    'Commercial & Ads',
    'Social & Shorts',
    'Tutorials & Tech',
  ];

  const quickTools = [
    {
      id: 'image_to_video',
      title: 'Image to Video AI',
      desc: 'Animate photos with 3D camera & unlimited 4K',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/50 hover:border-emerald-400',
    },
    {
      id: 'text_to_video',
      title: 'AI Text-to-Video',
      desc: 'Prompt to cinematic 4K scene',
      icon: <Film className="w-5 h-5 text-teal-400" />,
      color: 'from-teal-500/15 via-emerald-500/10 to-transparent border-teal-500/40 hover:border-teal-400',
    },
    {
      id: 'smart_cutout',
      title: 'Smart Cutout',
      desc: 'AI portrait & green screen matting',
      icon: <Scissors className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/15 via-blue-500/10 to-transparent border-cyan-500/40 hover:border-cyan-400',
    },
    {
      id: 'vocal_remover',
      title: 'Vocal Remover',
      desc: 'Isolate voice, acapella & BGM',
      icon: <Mic2 className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/15 via-pink-500/10 to-transparent border-purple-500/40 hover:border-purple-400',
    },
    {
      id: 'screen_recorder',
      title: 'Screen Recorder',
      desc: 'Record display, webcam & mic',
      icon: <Monitor className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/40 hover:border-amber-400',
    },
    {
      id: 'instant_mode',
      title: 'Instant Mode',
      desc: 'Auto-edit highlight reels fast',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/15 via-red-500/10 to-transparent border-rose-500/40 hover:border-rose-400',
    },
    {
      id: 'auto_beat_sync',
      title: 'Auto Beat Sync',
      desc: 'Cut timeline to music rhythm',
      icon: <Music2 className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/15 via-violet-500/10 to-transparent border-indigo-500/40 hover:border-indigo-400',
    },
    {
      id: 'audio_extender',
      title: 'AI Audio Extender',
      desc: 'Extend speech & BGM with seamless loops',
      icon: <AudioWaveform className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/15 via-teal-500/10 to-transparent border-cyan-500/40 hover:border-cyan-400',
    },
  ];

  // Filter templates by category and search
  const filteredTemplates = STARTER_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.tags.some((tag) => tag.toLowerCase().includes(templateSearchQuery.toLowerCase())) ||
      tpl.category.toLowerCase().includes(templateSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Create a brand new project with the selected aspect ratio
  const handleCreateNewProject = () => {
    const res = getResolutionForAspect(aspectRatio);
    const newProject: WfpProject = {
      format: 'WFP_JSON_V2',
      application: 'CineCraft Pro Studio',
      version: '16.0.0',
      id: `wfp_${Date.now()}`,
      name: `Untitled Project (${aspectRatio})`,
      filename: `untitled_project_${Date.now().toString().slice(-4)}.wfp`,
      aspectRatio,
      resolution: {
        width: res.width,
        height: res.height,
        label: res.label,
      },
      fps: 30,
      duration: 15.0,
      createdAt: Date.now(),
      lastEdited: Date.now(),
      thumbnailGradient: 'from-emerald-950 via-teal-950 to-zinc-950',
      sizeMb: 1.0,
      tags: ['New Project', aspectRatio],
      tracks: [
        { id: 'track_v1', index: 0, type: 'video', name: 'Video 1', isVisible: true, isLocked: false },
        { id: 'track_v2', index: 1, type: 'video', name: 'Overlay / Titles', isVisible: true, isLocked: false },
        { id: 'track_a1', index: 2, type: 'audio', name: 'Voiceover / Mic', isMuted: false, isLocked: false },
        { id: 'track_a2', index: 3, type: 'audio', name: 'Background Music', isMuted: false, isLocked: false },
      ],
      clips: [],
    };

    const updated = saveRecentProject(newProject);
    setProjects(updated);
    setSelectedProject(newProject);
    onEnterWorkspace(newProject);
  };

  // Renames the currently active project and syncs SEO title & storage
  const handleSaveRenamedProject = () => {
    if (!selectedProject || !editingNameValue.trim()) return;
    const updated: WfpProject = {
      ...selectedProject,
      name: editingNameValue.trim(),
      lastEdited: Date.now(),
    };
    const saved = saveRecentProject(updated);
    setProjects(saved);
    setSelectedProject(updated);
    setIsEditingProjectName(false);
  };

  // Instantiates a template and launches directly into the timeline workspace
  const handleUseTemplate = (template: WfpProjectTemplate) => {
    const projectInstance = instantiateTemplateProject(template);
    const updated = saveRecentProject(projectInstance);
    setProjects(updated);
    setSelectedProject(projectInstance);
    if (previewTemplate) {
      setPreviewTemplate(null);
    }
    onEnterWorkspace(projectInstance);
  };

  // Open an existing project from the gallery
  const handleOpenExistingProject = (project: WfpProject) => {
    const updatedProject = {
      ...project,
      lastEdited: Date.now(),
    };
    const updated = saveRecentProject(updatedProject);
    setProjects(updated);
    setSelectedProject(updatedProject);
    onEnterWorkspace(updatedProject);
  };

  // Process uploaded .wfp file
  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setIsProcessingFile(true);
    try {
      const parsed = await parseWfpFile(file);
      const updated = saveRecentProject(parsed);
      setProjects(updated);
      setSelectedProject(parsed);
      onEnterWorkspace(parsed);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse project file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = deleteRecentProject(projectId);
    setProjects(updated);
  };

  const handleDuplicateProject = (project: WfpProject) => {
    const cloned: WfpProject = {
      ...project,
      id: `wfp_${Date.now()}`,
      name: `${project.name} (Copy)`,
      filename: project.filename.replace(/\.wfp$/, '_copy.wfp'),
      createdAt: Date.now(),
      lastEdited: Date.now(),
    };
    const updated = saveRecentProject(cloned);
    setProjects(updated);
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mic2':
        return <Mic2 className="w-5 h-5 text-purple-400" />;
      case 'Film':
        return <Film className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-rose-400" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-cyan-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-orange-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn select-none">
      {/* Hidden file input for .wfp projects */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".wfp,.json,.cine"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />

      {/* AI Audio Extender Modal */}
      <AudioExtenderModal
        isOpen={isExtenderOpen}
        onClose={() => setIsExtenderOpen(false)}
        audio={currentAudio || null}
        onSaveExtendedAudio={(extended) => {
          if (onAudioExtended) onAudioExtended(extended);
        }}
        onSendToTimeline={() => {
          setIsExtenderOpen(false);
          if (onOpenQuickTool) onOpenQuickTool('video');
        }}
      />

      {/* Top Banner: Desktop & Mobile Apps Download + Account Quick Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/40 border border-zinc-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                CineStudio Pro 16 • Project Hub
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                .wfp Format
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Desktop software & web suite. Multi-track 4K video editing, AI tools & audio synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/70"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Login ID & Account</span>
            </button>
          )}

          {onOpenDownloadModal && (
            <button
              onClick={onOpenDownloadModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Desktop & Mobile Apps</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 uppercase font-black">
                iOS / Win / Mac / Android
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Active Project Session Context Card (Dynamic Page Title & SEO Context) */}
      {(selectedProject || currentProject) && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-teal-950/70 border border-emerald-500/40 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Active Project Session Context
              </span>
              <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                {(selectedProject || currentProject)?.aspectRatio} • {(selectedProject || currentProject)?.resolution.label} • {(selectedProject || currentProject)?.fps} FPS
              </span>
            </div>

            {isEditingProjectName ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  className="bg-zinc-950 border border-emerald-500 text-sm font-bold text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRenamedProject();
                    if (e.key === 'Escape') setIsEditingProjectName(false);
                  }}
                />
                <button
                  onClick={handleSaveRenamedProject}
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingProjectName(false)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 pt-0.5">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {(selectedProject || currentProject)?.name}
                </h3>
                <button
                  onClick={() => {
                    setEditingNameValue((selectedProject || currentProject)?.name || '');
                    setIsEditingProjectName(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
                  title="Rename active project"
                >
                  Rename
                </button>
              </div>
            )}

            {/* Live SEO Page Title Indicator */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5 flex-wrap">
              <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SEO Page Title:</span>
              </span>
              <span className="font-mono text-zinc-200 truncate max-w-lg bg-black/50 px-2 py-0.5 rounded border border-zinc-800">
                {(selectedProject || currentProject)?.name} • CineStudio Pro 16 Project | VoiceCraft AI
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hidden md:inline">
                og:title & meta description synced
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setSelectedProject(null)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
              title="Clear active project context and return to general hub title"
            >
              Clear Context
            </button>
            <button
              onClick={() => {
                const target = selectedProject || currentProject;
                if (target) handleOpenExistingProject(target);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Resume in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation View Switcher (All Hub / Templates / Recent Projects) */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setDashboardTab('all')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              dashboardTab === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Overview & Canvas</span>
          </button>
          <button
            onClick={() => setDashboardTab('templates')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              dashboardTab === 'templates'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" />
            <span>Templates</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 font-mono">
              {STARTER_TEMPLATES.length}
            </span>
          </button>
          <button
            onClick={() => setDashboardTab('recent')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              dashboardTab === 'recent'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Recent</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {projects.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-mono text-emerald-400 font-bold">.ccp / .wfp Studio Hub</span>
          <span>•</span>
          <span>CineCraft Pro v16</span>
        </div>
      </div>

      {/* Error Message if file parse failed */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs text-red-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Aspect Ratio Selector upfront (Shown in 'all' view) */}
      {(dashboardTab === 'all' || dashboardTab === 'recent') && (
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select Project Aspect Ratio Upfront</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active: {aspectRatio}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Configure target canvas dimensions and orientation before launching the editor.
              </p>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto">
              {getResolutionForAspect(aspectRatio).label}
            </div>
          </div>

          {/* Aspect Ratio Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {aspectOptions.map((opt) => {
              const isSelected = aspectRatio === opt.ratio;
              return (
                <button
                  key={opt.ratio}
                  onClick={() => setAspectRatio(opt.ratio)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/50'
                      : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`border-2 rounded transition-colors ${opt.iconBoxClass} ${
                        isSelected ? 'border-emerald-400 bg-emerald-500/20' : 'border-zinc-600 bg-zinc-900'
                      }`}
                    />
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : opt.popular ? (
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Popular</span>
                    ) : null}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-100">{opt.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{opt.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 2: Primary Actions: Large New Project and Open Project Buttons */}
      {(dashboardTab === 'all' || dashboardTab === 'recent') && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Large "New Project" Button */}
          <button
            onClick={handleCreateNewProject}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 p-8 text-zinc-950 shadow-2xl shadow-emerald-500/25 text-left transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950/15 backdrop-blur-sm flex items-center justify-center text-zinc-950 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 stroke-[3]" />
                </div>
                <span className="text-xs font-mono font-black uppercase px-3 py-1 rounded-full bg-zinc-950/20 text-zinc-950">
                  Preset: {aspectRatio} • {getResolutionForAspect(aspectRatio).width}x{getResolutionForAspect(aspectRatio).height}
                </span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">New Project</h2>
                <p className="text-xs sm:text-sm font-semibold opacity-90 mt-1 max-w-xl">
                  Open the multi-track timeline workspace with {aspectRatio} canvas, AI speech-to-video, safe zones, trimming, and audio effects.
                </p>
              </div>
            </div>
            {/* Decorative Corner Glow */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          </button>

          {/* "Open Project" Button & Drag Drop Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group rounded-3xl bg-zinc-900/90 border p-8 flex flex-col justify-between text-left transition-all active:scale-[0.99] cursor-pointer shadow-xl ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-400'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                .wfp / .cine
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span>Open Project</span>
                {isProcessingFile && <span className="text-xs text-emerald-400 animate-pulse">(Loading...)</span>}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Click to choose a <span className="text-emerald-300 font-semibold">.wfp</span> project file, or drag and drop it here to resume editing.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: Quick AI & Creative Tools Shortcuts (Shown in 'all') */}
      {dashboardTab === 'all' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Quick Creative & AI Tools</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                One-Click Launch
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {quickTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'audio_extender') {
                    setIsExtenderOpen(true);
                  } else if (onOpenQuickTool) {
                    onOpenQuickTool(tool.id);
                  }
                }}
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
        </section>
      )}

      {/* STEP 4: TEMPLATES SECTION - Pre-configured .wfp project starters */}
      {(dashboardTab === 'all' || dashboardTab === 'templates') && (
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Pre-Configured .wfp Starter Templates</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Saves Setup Time
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Jumpstart your editing with production-ready timelines: Podcast Episode, Documentary, Ad Campaign, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                placeholder="Search templates (e.g. podcast, ad)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9.5 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {templateSearchQuery && (
                <button
                  onClick={() => setTemplateSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 shadow-md font-bold'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              return (
                <div
                  key={template.id}
                  className="group rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-emerald-500/50 p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/20 hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header Banner & Visual Icon */}
                    <div
                      className={`h-28 rounded-xl bg-gradient-to-tr ${template.thumbnailGradient} p-3 flex flex-col justify-between relative overflow-hidden mb-3 border border-zinc-800/80`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                          {getTemplateIcon(template.iconName)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30 font-bold">
                            {template.aspectRatio}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300">
                            {template.duration}s
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/60 text-purple-300 border border-purple-500/30">
                          {template.setupTimeSaved}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {template.resolution.label}
                        </span>
                      </div>

                      {/* Ambient Glow */}
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                    </div>

                    {/* Template Title & Category */}
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {template.name}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Pre-configured Highlights List */}
                    <div className="space-y-1.5 my-3 pt-2 border-t border-zinc-850">
                      {template.keyFeatures.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tracks & Clips Counter Info */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-850 mb-3">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>{template.tracks.length} Tracks Configured</span>
                      </span>
                      <span>{template.clips.length} Pre-timed Clips</span>
                    </div>
                  </div>

                  {/* Actions: Use Template vs Preview Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-800"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUseTemplate(template)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 5: Recent Projects Visual Gallery */}
      {(dashboardTab === 'all' || dashboardTab === 'recent') && (
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Recent Projects (.wfp)</h3>
              <span className="text-xs text-zinc-400 font-mono">({projects.length} saved sessions)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-zinc-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import .wfp File</span>
              </button>
              <button
                onClick={handleCreateNewProject}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>+ New Blank Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visual Gallery Component */}
          <ProjectGallery
            projects={projects}
            selectedProjectId={selectedProject?.id || currentProject?.id || null}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              setAspectRatio(proj.aspectRatio);
            }}
            onOpenProject={handleOpenExistingProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onNewProjectClick={handleCreateNewProject}
          />
        </section>
      )}
    </div>
  );
};
