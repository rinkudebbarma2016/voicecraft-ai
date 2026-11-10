import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  Film,
  Check,
  ChevronRight,
  Clock,
  Layers,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { StoryboardScene, VidsTemplatePreset } from '../types/imageToVideo';
import { VIDS_TEMPLATES, SAMPLE_IMAGE_PRESETS } from '../utils/imageToVideoDefaults';

interface HelpMeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStoryboard: (scenes: StoryboardScene[]) => void;
}

export const HelpMeCreateModal: React.FC<HelpMeCreateModalProps> = ({
  isOpen,
  onClose,
  onApplyStoryboard,
}) => {
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(VIDS_TEMPLATES[0].id);
  const [targetDuration, setTargetDuration] = useState<number>(30); // seconds
  const [tone, setTone] = useState<string>('inspiring');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedScenes, setGeneratedScenes] = useState<StoryboardScene[] | null>(null);

  if (!isOpen) return null;

  const handleGenerateOutline = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Find matching template or build tailored storyboard from topic
      const template = VIDS_TEMPLATES.find((t) => t.id === selectedTemplateId) || VIDS_TEMPLATES[0];

      const cleanTopic = topicPrompt.trim() || 'Next Generation Innovation';

      const customizedScenes: StoryboardScene[] = [
        {
          id: `gen-1-${Date.now()}`,
          title: `Introduction: ${cleanTopic.slice(0, 28)}`,
          image: SAMPLE_IMAGE_PRESETS[0].sampleImage,
          imageName: SAMPLE_IMAGE_PRESETS[0].title,
          prompt: `Cinematic wide angle opening for ${cleanTopic}, vibrant lighting and dynamic depth`,
          narrationScript: `Welcome to our latest briefing on ${cleanTopic}. Today, we explore how forward-thinking teams are achieving new heights.`,
          motion: 'zoom-in',
          atmosphere: 'cyber-glitch',
          duration: Math.round(targetDuration / 3),
          transition: 'cross-dissolve',
          lowerThird: {
            enabled: true,
            headline: cleanTopic.toUpperCase().slice(0, 24),
            subheadline: 'Vision & Strategic Overview',
            position: 'bottom-left',
          },
        },
        {
          id: `gen-2-${Date.now()}`,
          title: `Core Breakthrough & Value`,
          image: SAMPLE_IMAGE_PRESETS[1].sampleImage,
          imageName: SAMPLE_IMAGE_PRESETS[1].title,
          prompt: `High-energy visual representation of breakthrough speed, elegant fluid motion, and crisp details`,
          narrationScript: `By removing operational friction, projects that once took weeks now come together seamlessly in minutes.`,
          motion: 'pan-right',
          atmosphere: 'god-rays',
          duration: Math.round(targetDuration / 3),
          transition: 'slide-left',
          lowerThird: {
            enabled: true,
            headline: 'SPEED & PRECISION',
            subheadline: 'Streamlined visual production',
            position: 'bottom-left',
          },
        },
        {
          id: `gen-3-${Date.now()}`,
          title: `Future Horizon & Call to Action`,
          image: SAMPLE_IMAGE_PRESETS[4].sampleImage,
          imageName: SAMPLE_IMAGE_PRESETS[4].title,
          prompt: `Futuristic glowing horizon with inspiring sunrise lighting and celebratory atmosphere`,
          narrationScript: `The future is here. Take the first step and craft your story with our complete creative studio.`,
          motion: 'orbit',
          atmosphere: 'embers',
          duration: Math.round(targetDuration / 3),
          transition: 'fade-black',
          lowerThird: {
            enabled: true,
            headline: 'DISCOVER MORE',
            subheadline: 'Start building your presentation today',
            position: 'center',
          },
        },
      ];

      setGeneratedScenes(customizedScenes);
      setIsGenerating(false);
    }, 600);
  };

  const handleApply = () => {
    if (generatedScenes && generatedScenes.length > 0) {
      onApplyStoryboard(generatedScenes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Help Me Create • AI Storyboard Generator</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold uppercase">
                  Google Vids Tool
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Transform any prompt or brief into a complete multi-scene video storyboard with scripts and camera choreography.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!generatedScenes ? (
            <>
              {/* Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  What is your video about?
                </label>
                <textarea
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="e.g. A 30-second product launch for an AI voice assistant that makes work 10x faster..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Template Style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                  Select Presentation Template Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VIDS_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedTemplateId === tmpl.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/30'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {tmpl.badge}
                        </span>
                        <span className="text-[10px] text-zinc-500">{tmpl.scenes.length} Scenes</span>
                      </div>
                      <div className="font-semibold text-xs text-white truncate">{tmpl.title}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                        {tmpl.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone & Target Duration Options */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tone & Delivery</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="inspiring">Dynamic & Inspiring</option>
                    <option value="corporate">Executive & Professional</option>
                    <option value="casual">Friendly & Conversational</option>
                    <option value="urgent">Fast-Paced & Punchy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Video Duration</label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="15">15 Seconds (Social Teaser)</option>
                    <option value="30">30 Seconds (Standard Pitch)</option>
                    <option value="45">45 Seconds (Detailed Explainer)</option>
                    <option value="60">60 Seconds (Full Presentation)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Generated Storyboard Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Generated {generatedScenes.length}-Scene Storyboard
                </span>
                <button
                  onClick={() => setGeneratedScenes(null)}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Edit Prompt
                </button>
              </div>

              <div className="space-y-3">
                {generatedScenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex gap-3.5 items-start"
                  >
                    <img
                      src={scene.image}
                      alt={scene.title}
                      className="w-20 h-14 object-cover rounded-lg shrink-0 border border-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          Scene {idx + 1}: {scene.title}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                          {scene.duration}s • {scene.motion}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 italic mb-1.5 line-clamp-2">
                        "{scene.narrationScript}"
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>Transition: {scene.transition}</span>
                        {scene.lowerThird?.enabled && (
                          <span className="text-purple-400">• Lower Third: {scene.lowerThird.headline}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>

          {!generatedScenes ? (
            <button
              onClick={handleGenerateOutline}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Crafting Storyboard...' : 'Generate AI Storyboard'}</span>
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Storyboard Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
