import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  X,
  Sliders,
  Check,
  ArrowRight,
  Layers,
  Film,
  Clock,
  Smartphone,
  Monitor,
  Maximize2,
  Zap,
  Mic,
  Plus,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import {
  ImageToVideoAspectRatio,
  ImageToVideoMotion,
  ImageToVideoAtmosphere,
  StoryboardScene,
} from '../types/imageToVideo';

interface VideoAIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAspectRatio: ImageToVideoAspectRatio;
  currentDuration: number;
  currentMotion: ImageToVideoMotion;
  currentAtmosphere: ImageToVideoAtmosphere;
  currentPrompt: string;
  onApplyConfig: (config: {
    prompt?: string;
    aspectRatio?: ImageToVideoAspectRatio;
    duration?: number;
    motion?: ImageToVideoMotion;
    atmosphere?: ImageToVideoAtmosphere;
    scenes?: StoryboardScene[];
  }) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionData?: {
    prompt?: string;
    aspectRatio?: ImageToVideoAspectRatio;
    sceneDuration?: number;
    motion?: ImageToVideoMotion;
    atmosphere?: ImageToVideoAtmosphere;
    narrationScript?: string;
    suggestedScenes?: Array<{
      title: string;
      prompt: string;
      duration: number;
      motion: string;
      narrationScript: string;
    }>;
  };
}

const QUICK_PROMPTS = [
  {
    icon: '📱',
    label: 'Portrait 9:16 Reel (15s)',
    prompt: 'Make this video a vertical Portrait (9:16) reel for TikTok & Instagram with 15s total duration and smooth zoom-in camera movement.',
  },
  {
    icon: '📸',
    label: 'Portrait 4:5 Post (8s)',
    prompt: 'Configure aspect ratio to Portrait (4:5) for Instagram feed post with 8s scene duration and volumetric light beams.',
  },
  {
    icon: '⏱️',
    label: 'Set Custom Duration to 12s',
    prompt: 'Change my scene duration to exactly 12 seconds with dynamic slow pan-right camera choreography.',
  },
  {
    icon: '🎬',
    label: 'Generate 3-Scene Storyboard (+)',
    prompt: 'Create a 3-scene cinematic commercial storyboard with establishing shot, product detail, and inspiring closing.',
  },
  {
    icon: '🌧️',
    label: 'Cyberpunk Rain & Drift',
    prompt: 'Turn this into an atmospheric night scene with reflective neon rain puddles and subtle ambient-flow vector dynamics.',
  },
  {
    icon: '☕',
    label: 'Artisan Coffee Teaser',
    prompt: 'Write a coffee brewing video sequence in Portrait (9:16) with warm sun rays, 6s per scene, and slow zoom.',
  },
];

export const VideoAIChatDrawer: React.FC<VideoAIChatDrawerProps> = ({
  isOpen,
  onClose,
  currentAspectRatio,
  currentDuration,
  currentMotion,
  currentAtmosphere,
  currentPrompt,
  onApplyConfig,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: `Hello! I am your VidsCraft AI Video Director & Choreographer.
      
Tell me what you want to create — e.g. "make it portrait 9:16 with 8s scene duration", "create a 3-scene coffee story", or "apply slow zoom with rain particles". I'll configure your studio and assemble storyboard scenes with 1 click!`,
      timestamp: Date.now(),
      actionData: {
        aspectRatio: currentAspectRatio,
        sceneDuration: currentDuration,
        motion: currentMotion,
        atmosphere: currentAtmosphere,
        prompt: currentPrompt,
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/video/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4),
          currentConfig: {
            aspectRatio: currentAspectRatio,
            duration: currentDuration,
            motion: currentMotion,
            atmosphere: currentAtmosphere,
            prompt: currentPrompt,
          },
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Configured video settings according to your request.',
        timestamp: Date.now(),
        actionData: data.actionData,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Video chat request notice:', err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          content: `I've configured your video request for "${text}". You can apply these camera and duration parameters right into the studio.`,
          timestamp: Date.now(),
          actionData: {
            prompt: text,
            aspectRatio: text.toLowerCase().includes('portrait') || text.includes('9:16') ? '9:16' : currentAspectRatio,
            sceneDuration: 8,
            motion: 'zoom-in',
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (msgId: string, actionData?: ChatMessage['actionData']) => {
    if (!actionData) return;

    let convertedScenes: StoryboardScene[] | undefined = undefined;
    if (actionData.suggestedScenes && actionData.suggestedScenes.length > 0) {
      convertedScenes = actionData.suggestedScenes.map((s, idx) => ({
        id: 'sc_chat_' + Date.now() + '_' + idx,
        title: s.title || `Scene #${idx + 1}`,
        image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
        imageName: s.title,
        prompt: s.prompt,
        narrationScript: s.narrationScript || '',
        motion: (s.motion as ImageToVideoMotion) || 'zoom-in',
        atmosphere: actionData.atmosphere || 'none',
        duration: s.duration || actionData.sceneDuration || 5,
        transition: 'cross-dissolve',
        lowerThird: {
          enabled: true,
          headline: (s.title || '').toUpperCase(),
          subheadline: `${s.duration || 5}s • ${s.motion || 'zoom-in'}`,
          position: 'bottom-left',
        },
      }));
    }

    onApplyConfig({
      prompt: actionData.prompt,
      aspectRatio: actionData.aspectRatio,
      duration: actionData.sceneDuration,
      motion: actionData.motion,
      atmosphere: actionData.atmosphere,
      scenes: convertedScenes,
    });

    setAppliedId(msgId);
    setTimeout(() => setAppliedId(null), 3000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Chat AI Video Director
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">Give prompts for aspect ratio, duration, motion & scenes</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-zinc-900/40 border-b border-zinc-800/80 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qp.prompt)}
              className="px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-cyan-950 hover:border-cyan-500/40 border border-zinc-700/60 text-zinc-300 hover:text-cyan-200 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{qp.icon}</span>
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const hasAction = Boolean(
            msg.actionData &&
              (msg.actionData.aspectRatio ||
                msg.actionData.sceneDuration ||
                msg.actionData.motion ||
                msg.actionData.prompt ||
                msg.actionData.suggestedScenes)
          );

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                  isAssistant
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    : 'bg-cyan-600 text-white font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Structured Video Action Card */}
                {isAssistant && hasAction && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/90 space-y-2">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      Suggested Video Configuration
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {msg.actionData?.aspectRatio && (
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-400">Aspect Ratio:</span>
                          <span className="font-semibold text-cyan-300">
                            {msg.actionData.aspectRatio === '9:16'
                              ? 'Portrait (9:16)'
                              : msg.actionData.aspectRatio === '4:5'
                              ? 'Portrait (4:5)'
                              : msg.actionData.aspectRatio}
                          </span>
                        </div>
                      )}

                      {msg.actionData?.sceneDuration && (
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-400">Scene Duration:</span>
                          <span className="font-semibold text-cyan-300">
                            {msg.actionData.sceneDuration}s
                          </span>
                        </div>
                      )}

                      {msg.actionData?.motion && (
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-400">Motion:</span>
                          <span className="font-semibold text-cyan-300 capitalize">
                            {msg.actionData.motion}
                          </span>
                        </div>
                      )}

                      {msg.actionData?.atmosphere && msg.actionData.atmosphere !== 'none' && (
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-400">Atmosphere:</span>
                          <span className="font-semibold text-cyan-300 capitalize">
                            {msg.actionData.atmosphere}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Suggested Scenes Strip */}
                    {msg.actionData?.suggestedScenes && msg.actionData.suggestedScenes.length > 0 && (
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                        <div className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>
                            {msg.actionData.suggestedScenes.length} Storyboard Scenes Ready (+)
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {msg.actionData.suggestedScenes.map((s) => s.title).join(' • ')}
                        </div>
                      </div>
                    )}

                    {/* 1-Click Apply Button */}
                    <button
                      type="button"
                      onClick={() => handleApply(msg.id, msg.actionData)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        appliedId === msg.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                      }`}
                    >
                      {appliedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Video Studio!</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply to Video Studio</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
            <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="animate-pulse">Directing video choreography...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Portrait 9:16, 8s duration, slow zoom..."
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 shadow-md shadow-cyan-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
