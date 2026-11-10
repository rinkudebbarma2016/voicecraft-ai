import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Database,
  ArrowRight,
  Radio,
  RefreshCw,
  Check,
  Disc,
  Clock,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LiveVoiceDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDirectorPrompt?: (prompt: string, cameraMotion?: string) => void;
}

interface TranscriptEntry {
  speaker: 'user' | 'director';
  text: string;
  timestamp: string;
}

export const LiveVoiceDirectorModal: React.FC<LiveVoiceDirectorModalProps> = ({
  isOpen,
  onClose,
  onApplyDirectorPrompt,
}) => {
  const { currentUser, getIdToken } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [directorSpeaking, setDirectorSpeaking] = useState<boolean>(false);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentTextDraft, setCurrentTextDraft] = useState<string>('');
  const [dbSaveStatus, setDbSaveStatus] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);

  // Audio Context and WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioEnergyRef = useRef<number>(0);

  // Initialize and connect WebSocket to /live
  useEffect(() => {
    if (!isOpen) {
      handleDisconnect();
      return;
    }

    startLiveSession();

    return () => {
      handleDisconnect();
    };
  }, [isOpen]);

  // Session duration timer
  useEffect(() => {
    if (isConnected) {
      timerIntervalRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isConnected]);

  // Visualizer loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      animFrameRef.current = requestAnimationFrame(renderWave);
      phase += 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const energy = audioEnergyRef.current;
      const baseAmp = directorSpeaking ? 28 : isConnected && !isMicMuted ? 14 : 4;
      const amp = baseAmp + energy * 30;

      // Draw glowing gradient wave
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let x = 0; x < width; x += 3) {
        const rad = (x / width) * Math.PI * 4 + phase;
        const y = centerY + Math.sin(rad) * amp * Math.sin((x / width) * Math.PI);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = directorSpeaking ? '#06b6d4' : '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = directorSpeaking ? '#22d3ee' : '#34d399';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    renderWave();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, directorSpeaking, isConnected, isMicMuted]);

  // Convert Float32Array (-1.0 to 1.0) to 16-bit Int16 PCM base64
  const floatTo16BitPcmBase64 = (floats: Float32Array): string => {
    const buffer = new ArrayBuffer(floats.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert base64 Int16 PCM to Float32Array
  const base64ToInt16Floats = (base64: string): Float32Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16View = new Int16Array(bytes.buffer);
    const floats = new Float32Array(int16View.length);
    for (let i = 0; i < int16View.length; i++) {
      floats[i] = int16View[i] / 32768.0;
    }
    return floats;
  };

  // Play queued 24kHz audio from Gemini Live
  const playAudioChunk = (audioCtx: AudioContext, base64: string) => {
    try {
      const floatData = base64ToInt16Floats(base64);
      const audioBuffer = audioCtx.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setDirectorSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setDirectorSpeaking(false);
        }
      };
    } catch (err) {
      console.error('Failed to play Gemini Live audio chunk:', err);
    }
  };

  // Interrupt and immediately stop Gemini speech
  const handleInterrupt = () => {
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setDirectorSpeaking(false);
  };

  const startLiveSession = async () => {
    try {
      // Connect WebSocket to /live on current host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Audio contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // Mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;

      const sourceNode = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives ~256ms audio packet at 16kHz
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      sourceNode.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!isMicMuted && ws.readyState === WebSocket.OPEN) {
          const channel = e.inputBuffer.getChannelData(0);

          // Calculate energy for visualizer
          let sum = 0;
          for (let i = 0; i < channel.length; i++) {
            sum += Math.abs(channel[i]);
          }
          audioEnergyRef.current = sum / channel.length;

          const base64 = floatTo16BitPcmBase64(channel);
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onopen = () => {
        setIsConnected(true);
        setTranscripts((prev) => [
          ...prev,
          {
            speaker: 'director',
            text: 'CineStudio Live Voice Director ready! Speak into your microphone to pitch video ideas or direct camera motions in real-time.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.interrupted) {
            handleInterrupt();
          }
          if (msg.audio) {
            playAudioChunk(outputCtx, msg.audio);
          }
          if (msg.text) {
            setCurrentTextDraft((prev) => {
              const updated = (prev + ' ' + msg.text).trim();
              return updated;
            });
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'director') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: (last.text + ' ' + msg.text).trim() },
                ];
              }
              return [
                ...prev,
                {
                  speaker: 'director',
                  text: msg.text.trim(),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          }
        } catch (err) {
          console.error('WS receive error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err: any) {
      console.error('Could not initialize Live Voice Director:', err);
      alert('Could not access microphone or connect to Gemini Live: ' + (err?.message || err));
      onClose();
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    handleInterrupt();
    setIsConnected(false);
  };

  // Save session transcript to Cloud SQL database
  const handleSaveToCloudSql = async () => {
    setIsSavingDb(true);
    setDbSaveStatus(null);
    try {
      const token = await getIdToken();
      const fullTranscript = transcripts
        .map((t) => `${t.speaker === 'director' ? 'Director' : 'Creator'} (${t.timestamp}): ${t.text}`)
        .join('\n\n');

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: currentUser?.uid || 'anonymous',
          title: `Voice Direction Session (${Math.round(sessionDuration)}s)`,
          summary: transcripts[transcripts.length - 1]?.text?.slice(0, 160) || 'Creative Session',
          transcript: fullTranscript || 'Voice conversation session',
          durationSeconds: sessionDuration,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDbSaveStatus('Saved session to Cloud SQL PostgreSQL database!');
        setTimeout(() => setDbSaveStatus(null), 3500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Save to DB error:', err);
      alert('Failed to save session to Cloud SQL: ' + (err?.message || err));
    } finally {
      setIsSavingDb(false);
    }
  };

  // Apply director prompt directly into video studio
  const handleApplyToStudio = () => {
    const directorTexts = transcripts
      .filter((t) => t.speaker === 'director')
      .map((t) => t.text)
      .join(' ');

    const promptCandidate = directorTexts.slice(-240) || 'Cinematic scene directed via Gemini Live Voice Director';
    if (onApplyDirectorPrompt) {
      onApplyDirectorPrompt(promptCandidate, 'zoom-in');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Gemini Live Voice Director
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Low-latency, real-time bidirectional voice conversation & creative direction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="relative h-28 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 flex flex-col items-center justify-center border-b border-zinc-800/80 px-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={90}
            className="w-full max-w-lg h-20"
          />

          <div className="absolute bottom-2 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                directorSpeaking
                  ? 'bg-cyan-400 animate-ping'
                  : isConnected && !isMicMuted
                  ? 'bg-emerald-400'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-300">
              {directorSpeaking
                ? 'Gemini Live Speaking...'
                : isMicMuted
                ? 'Microphone Muted'
                : isConnected
                ? 'Listening to your voice (Speak naturally)...'
                : 'Connecting to Gemini Live API...'}
            </span>
          </div>
        </div>

        {/* Live Conversation Transcript */}
        <div className="p-4 max-h-72 min-h-48 overflow-y-auto space-y-3 scrollbar-thin">
          {transcripts.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Say something like: <span className="text-cyan-400 font-medium">"Help me brainstorm an epic drone flyover scene for a sunset alpine lake"</span>
            </div>
          ) : (
            transcripts.map((entry, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs max-w-[85%] ${
                  entry.speaker === 'director'
                    ? 'bg-cyan-950/40 border border-cyan-800/50 text-cyan-100 mr-auto'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 ml-auto'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold uppercase tracking-wider text-cyan-400">
                    {entry.speaker === 'director' ? 'Gemini Live Director' : 'You'}
                  </span>
                  <span>{entry.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Save confirmation notification */}
        {dbSaveStatus && (
          <div className="mx-4 mb-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{dbSaveStatus}</span>
          </div>
        )}

        {/* Bottom Interactive Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                isMicMuted
                  ? 'bg-red-600/80 text-white hover:bg-red-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMicMuted ? 'Unmute Mic' : 'Mic Active'}</span>
            </button>

            {/* Save to Cloud SQL Database */}
            <button
              type="button"
              disabled={isSavingDb || transcripts.length === 0}
              onClick={handleSaveToCloudSql}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Save conversation record to PostgreSQL Cloud SQL database"
            >
              {isSavingDb ? (
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Database className="w-4 h-4 text-indigo-400" />
              )}
              <span>Save to Cloud SQL</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct to Video Studio */}
            <button
              type="button"
              disabled={transcripts.length === 0}
              onClick={handleApplyToStudio}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/25 transition cursor-pointer disabled:opacity-50"
            >
              <Film className="w-4 h-4" />
              <span>Apply Idea to Video Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
