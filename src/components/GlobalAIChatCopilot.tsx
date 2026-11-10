import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  X,
  Send,
  MessageSquare,
  Wand2,
  Film,
  Mic,
  Users,
  Compass,
  ArrowRight,
  Check,
  Smartphone,
  Clock,
  Layers,
  ChevronDown,
  Move,
  GripHorizontal,
} from 'lucide-react';
import { ImageToVideoAspectRatio } from '../types/imageToVideo';

interface GlobalAIChatCopilotProps {
  currentTab: string;
  onNavigateToTab: (tab: string, data?: any) => void;
  geminiAvailable: boolean;
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  videoConfig?: {
    prompt?: string;
    aspectRatio?: ImageToVideoAspectRatio;
    sceneDuration?: number;
    motion?: string;
    atmosphere?: string;
    suggestedScenes?: any[];
  };
  audioConfig?: {
    script?: string;
    speakerId?: string;
    speakerName?: string;
    accent?: string;
    targetSeconds?: number;
    style?: string;
  };
}

export const GlobalAIChatCopilot: React.FC<GlobalAIChatCopilotProps> = ({
  currentTab,
  onNavigateToTab,
  geminiAvailable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'video' | 'voice' | 'creative'>('video');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-asking-ai',
      role: 'assistant',
      content: `Hi! I am Asking AI, your personal AI director across all studios.

You can ask me anything — e.g. "Create a Portrait (9:16) video with 3 scenes", "Generate an AI image edit prompt", "Convert JSON timeline to video", or "Write a 15-second commercial script". You can also drag and move this window anywhere on your screen. What would you like to create?`,
      timestamp: Date.now(),
      videoConfig: {
        aspectRatio: '9:16',
        sceneDuration: 8,
        motion: 'zoom-in',
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Draggable position coordinates
  const [buttonPos, setButtonPos] = useState<{ x: number; y: number } | null>(null);
  const [windowPos, setWindowPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  // Handle Drag for the Floating Launcher Button
  const handleButtonMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const currentX = buttonPos ? buttonPos.x : window.innerWidth - 170;
    const currentY = buttonPos ? buttonPos.y : window.innerHeight - 75;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: currentX,
      origY: currentY,
      moved: false,
    };
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.moved = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 170, dragStartRef.current.origX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.origY + dy));
      setButtonPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleButtonTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentX = buttonPos ? buttonPos.x : window.innerWidth - 170;
    const currentY = buttonPos ? buttonPos.y : window.innerHeight - 75;
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: currentX,
      origY: currentY,
      moved: false,
    };
    isDraggingRef.current = true;

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const t = moveEvent.touches[0];
      const dx = t.clientX - dragStartRef.current.startX;
      const dy = t.clientY - dragStartRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.moved = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 170, dragStartRef.current.origX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.origY + dy));
      setButtonPos({ x: newX, y: newY });
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  // Handle Drag for the Open Window Header
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const currentX = windowPos ? windowPos.x : Math.max(10, window.innerWidth - 440);
    const currentY = windowPos ? windowPos.y : Math.max(10, window.innerHeight - 620);
    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, currentX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, currentY + dy));
      setWindowPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentX = windowPos ? windowPos.x : Math.max(10, window.innerWidth - 440);
    const currentY = windowPos ? windowPos.y : Math.max(10, window.innerHeight - 620);
    const startX = touch.clientX;
    const startY = touch.clientY;

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const t = moveEvent.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 320, currentX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, currentY + dy));
      setWindowPos({ x: newX, y: newY });
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isLoading) return;

    const userMsg: CopilotMessage = {
      id: 'u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const p = text.toLowerCase();
      const isVideoQuery =
        p.includes('video') ||
        p.includes('portrait') ||
        p.includes('aspect') ||
        p.includes('duration') ||
        p.includes('scene') ||
        p.includes('storyboard') ||
        p.includes('motion') ||
        p.includes('camera') ||
        p.includes('image') ||
        p.includes('reel') ||
        p.includes('tiktok') ||
        p.includes('9:16') ||
        p.includes('4:5');

      if (isVideoQuery || activeMode === 'video') {
        const res = await fetch('/api/video/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'assistant',
            content: data.reply || `I set up your video configuration for: "${text}"`,
            timestamp: Date.now(),
            videoConfig: {
              prompt: data.actionData?.prompt,
              aspectRatio: data.actionData?.aspectRatio || (p.includes('portrait') ? '9:16' : '16:9'),
              sceneDuration: data.actionData?.sceneDuration || 8,
              motion: data.actionData?.motion || 'zoom-in',
              atmosphere: data.actionData?.atmosphere || 'none',
              suggestedScenes: data.actionData?.suggestedScenes,
            },
          },
        ]);
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'assistant',
            content: data.reply || `Here is your production script for: "${text}"`,
            timestamp: Date.now(),
            audioConfig: {
              script: data.actionData?.script,
              speakerName: data.actionData?.speakerName,
              accent: data.actionData?.accent,
              targetSeconds: data.actionData?.targetSeconds,
            },
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          content: `I've prepared your configuration for "${text}". Click below to open in studio.`,
          timestamp: Date.now(),
          videoConfig: {
            prompt: text,
            aspectRatio: text.toLowerCase().includes('portrait') ? '9:16' : '16:9',
            sceneDuration: 8,
            motion: 'zoom-in',
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToStudio = (msg: CopilotMessage) => {
    if (msg.videoConfig) {
      onNavigateToTab('image-to-video', {
        prompt: msg.videoConfig.prompt,
        aspectRatio: msg.videoConfig.aspectRatio,
        duration: msg.videoConfig.sceneDuration,
        motion: msg.videoConfig.motion,
        scenes: msg.videoConfig.suggestedScenes,
      });
      setIsOpen(false);
    } else if (msg.audioConfig?.script) {
      onNavigateToTab('solo', {
        text: msg.audioConfig.script,
        speakerName: msg.audioConfig.speakerName,
        targetDuration: msg.audioConfig.targetSeconds,
      });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Draggable Floating Launcher Button */}
      {!isOpen && (
        <div
          style={
            buttonPos
              ? { left: `${buttonPos.x}px`, top: `${buttonPos.y}px` }
              : { right: '20px', bottom: '20px' }
          }
          className="fixed z-40 select-none cursor-move"
          onMouseDown={handleButtonMouseDown}
          onTouchStart={handleButtonTouchStart}
        >
          <button
            type="button"
            onClick={() => {
              if (!dragStartRef.current.moved) {
                setIsOpen(true);
              }
            }}
            className="group px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 border border-emerald-400/40"
            title="Asking AI - Click to open, drag to move anywhere"
          >
            <div className="relative pointer-events-none">
              <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="tracking-wide pointer-events-none font-bold">Asking AI</span>
            <GripHorizontal className="w-3.5 h-3.5 text-emerald-200/60 pointer-events-none" />
          </button>
        </div>
      )}

      {/* Draggable Open Asking AI Window */}
      {isOpen && (
        <div
          style={
            windowPos
              ? { left: `${windowPos.x}px`, top: `${windowPos.y}px` }
              : { right: '20px', bottom: '20px' }
          }
          className="fixed z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl"
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleHeaderMouseDown}
            onTouchStart={handleHeaderTouchStart}
            className="px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between cursor-move select-none"
            title="Drag to move Asking AI anywhere"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Asking AI
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Active Context: <span className="text-emerald-400 font-semibold">{currentTab}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline mr-1 flex items-center gap-0.5">
                <Move className="w-3 h-3 text-zinc-400" />
                Drag
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                title="Close Asking AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveMode('video')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  activeMode === 'video'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🎬 Video AI
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('voice')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  activeMode === 'voice'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🎙️ Voiceover AI
              </button>
            </div>
            <span className="text-[10px] text-zinc-500">Prompt what you want</span>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800/60 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {activeMode === 'video' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSend('Make this Portrait 9:16 reel with 10s duration')}
                    className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-cyan-500 text-[10px] text-zinc-300 hover:text-cyan-200 cursor-pointer"
                  >
                    📱 Portrait (9:16) Reel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Configure aspect ratio to Portrait 4:5 for Instagram feed')}
                    className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-cyan-500 text-[10px] text-zinc-300 hover:text-cyan-200 cursor-pointer"
                  >
                    📸 Portrait (4:5) Post
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Set scene duration to 15 seconds with slow zoom')}
                    className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-cyan-500 text-[10px] text-zinc-300 hover:text-cyan-200 cursor-pointer"
                  >
                    ⏱️ 15s Scene Duration
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSend('Write a 30s tech product launch commercial for Fenrir')}
                    className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500 text-[10px] text-zinc-300 hover:text-purple-200 cursor-pointer"
                  >
                    🚀 Tech Commercial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Write a suspenseful thriller opening narration for Puck')}
                    className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-purple-500 text-[10px] text-zinc-300 hover:text-purple-200 cursor-pointer"
                  >
                    🎭 Thriller Script
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-zinc-950 font-bold'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Action Cards */}
                    {msg.videoConfig && (
                      <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <Film className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Aspect Ratio:</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {msg.videoConfig.aspectRatio || '16:9'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyToStudio(msg)}
                          className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-cyan-600/30 mt-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Apply to VidsCraft AI</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {msg.audioConfig?.script && (
                      <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                          <span>Voiceover Script Ready</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyToStudio(msg)}
                          className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-purple-600/30 mt-1"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Send to Solo Narrator TTS</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                <Bot className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="animate-pulse">Asking AI thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
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
                placeholder={
                  activeMode === 'video'
                    ? 'Ask Asking AI (e.g. Portrait 9:16, 8s scene, slow zoom)...'
                    : 'Ask Asking AI (e.g. Write a 20s tech script for Aarav)...'
                }
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 shadow-md shadow-emerald-600/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
