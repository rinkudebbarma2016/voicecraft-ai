import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  Sparkles,
  Layers,
  Check,
  Trash2,
  Volume2,
  Sliders,
  AudioWaveform,
  Activity,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  FileAudio,
  Radio,
  Share2,
  Download,
} from 'lucide-react';
import { ClonedVoice, GeneratedAudio } from '../types/tts';
import { base64ToAudioUrl, formatTime } from '../utils/audio';

interface VoiceCloningStudioProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
  onSendToSolo: (text: string, clonedSpeakerName: string, stylePrompt: string) => void;
  clonedVoices: ClonedVoice[];
  onSaveClonedVoice: (voice: ClonedVoice) => void;
  onDeleteClonedVoice: (id: string) => void;
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Phonetic Studio Calibration',
    text: 'The quick brown fox jumps over the lazy dog while crisp autumn leaves whisper in the wind across the ancient hills of Bangalore and Delhi.',
  },
  {
    title: 'Tech Keynote & Business',
    text: 'Our AI speech architecture processes neural voice vectors in real-time, delivering human-level intonation, natural breathing cadences, and flawless clarity.',
  },
  {
    title: 'Storytelling & Narration',
    text: 'Long ago in the quiet valleys of the Himalayas, the monks preserved manuscripts written in gold leaf, waiting for the traveler whose voice was prophesied.',
  },
];

export const VoiceCloningStudio: React.FC<VoiceCloningStudioProps> = ({
  onAudioGenerated,
  onSendToSolo,
  clonedVoices,
  onSaveClonedVoice,
  onDeleteClonedVoice,
}) => {
  // Navigation inside studio
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'library'>('create');
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedAudioBase64, setUploadedAudioBase64] = useState<string | null>(null);
  const [uploadedAudioDuration, setUploadedAudioDuration] = useState<number>(0);

  // Form State
  const [voiceName, setVoiceName] = useState('My Voice Clone');
  const [voiceGender, setVoiceGender] = useState<'Female' | 'Male' | 'Neutral'>('Female');

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedProfile, setAnalyzedProfile] = useState<ClonedVoice | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Audition / Testing State
  const [auditionText, setAuditionText] = useState(
    'Hello! This is a real-time speech test generated from my cloned AI acoustic profile.'
  );
  const [selectedLibraryVoice, setSelectedLibraryVoice] = useState<ClonedVoice | null>(
    clonedVoices[0] || null
  );
  const [isSynthesizingTest, setIsSynthesizingTest] = useState(false);
  const [testAudioBase64, setTestAudioBase64] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Refs for media recording & audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const testAudioElRef = useRef<HTMLAudioElement | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Ensure library voice is selected if available
  useEffect(() => {
    if (!selectedLibraryVoice && clonedVoices.length > 0) {
      setSelectedLibraryVoice(clonedVoices[0]);
    }
  }, [clonedVoices, selectedLibraryVoice]);

  // Handle Live Mic Recording
  const startRecording = async () => {
    try {
      setAnalysisError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio Context for visualizer
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      liveAudioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      liveAnalyserRef.current = analyser;

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setRecordedAudioBase64(base64Data);
          setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);

      // Timer
      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      // Start live canvas animation
      drawLiveWaveform();
    } catch (err) {
      console.error('Microphone access failed:', err);
      setAnalysisError('Could not access microphone. Please check browser permissions or upload an audio file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Draw real-time VU frequency visualizer during mic recording
  const drawLiveWaveform = () => {
    const canvas = liveCanvasRef.current;
    const analyser = liveAnalyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const grad = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#6366f1');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, Math.max(2, barWidth - 2), barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // Handle Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const b64 = result.split(',')[1];
      setUploadedAudioBase64(b64);

      // Estimate duration with Audio element
      const tempAudio = new Audio(result);
      tempAudio.onloadedmetadata = () => {
        setUploadedAudioDuration(Math.round(tempAudio.duration) || 8);
      };
    };
    reader.readAsDataURL(file);
  };

  // Run AI Acoustic Fingerprinting & Voice Cloning
  const handleAnalyzeVoice = async () => {
    const activeBase64 = inputMode === 'record' ? recordedAudioBase64 : uploadedAudioBase64;
    const activeDuration = inputMode === 'record' ? Math.max(recordDuration, 3) : Math.max(uploadedAudioDuration, 3);
    const activeFileName = inputMode === 'record' ? 'mic_sample.wav' : uploadedFileName || 'sample.wav';

    if (!activeBase64) {
      setAnalysisError(
        inputMode === 'record'
          ? 'Please record at least 3 seconds of speech first.'
          : 'Please select an audio file to clone.'
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const res = await fetch('/api/voice-clone/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: activeBase64,
          audioDuration: activeDuration,
          audioFileName: activeFileName,
          sampleTranscript: SAMPLE_SCRIPTS[selectedScriptIndex].text,
          detectedMimeType: 'audio/wav',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.profile) {
        throw new Error(data.error || 'Failed to analyze acoustic properties');
      }

      const p = data.profile;
      const newClone: ClonedVoice = {
        id: `clone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: voiceName.trim() || 'My Voice Clone',
        gender: p.gender || voiceGender,
        accent: p.detectedAccent || 'Indian English',
        flag: p.flag || '🇮🇳',
        description: `AI Cloned Voice • ${p.timbreType || 'Resonant'} • ${p.pitchHz || 140} Hz • ${p.detectedAccent || 'Indian English'}`,
        baseVoice: p.baseVoice || (voiceGender === 'Female' ? 'Kore' : 'Puck'),
        stylePrompt: p.stylePrompt || `Authentic ${p.detectedAccent || 'Indian English'} cloned voice with ${p.timbreType || 'warm'} timbre and clear diction.`,
        timbreProfile: {
          pitchHz: p.pitchHz || 140,
          speakingRateWpm: p.speakingRateWpm || 145,
          timbreType: p.timbreType || 'Warm & Resonant',
          resonance: p.resonance || 'Rich Chest Register',
          detectedAccent: p.detectedAccent || 'Indian English',
          emotionBaseline: p.emotionBaseline || 'Articulate & Poised',
          confidenceScore: p.confidenceScore || 96,
        },
        sampleAudioBase64: activeBase64,
        sampleDurationSec: activeDuration,
        sampleFileName: activeFileName,
        createdAt: Date.now(),
        settings: {
          stability: p.recommendedSettings?.stability || 80,
          clarity: p.recommendedSettings?.clarity || 88,
          styleExaggeration: p.recommendedSettings?.styleExaggeration || 25,
        },
        tags: ['Custom Clone', p.detectedAccent?.split(' ')[0] || 'Indian English', p.timbreType?.split(' ')[0] || 'Warm'],
        isCustomClone: true,
      };

      setAnalyzedProfile(newClone);
      onSaveClonedVoice(newClone);
      setSelectedLibraryVoice(newClone);
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      setAnalysisError((err as Error).message || 'Voice analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Instant Test Audition Synthesis for Cloned Voice
  const handleSynthesizeTest = async (voiceToTest?: ClonedVoice) => {
    const targetVoice = voiceToTest || selectedLibraryVoice || analyzedProfile;
    if (!targetVoice) return;

    try {
      setIsSynthesizingTest(true);
      const res = await fetch('/api/voice-clone/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: auditionText,
          baseVoice: targetVoice.baseVoice,
          stylePrompt: targetVoice.stylePrompt,
          settings: targetVoice.settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to synthesize test phrase');
      }

      setTestAudioBase64(data.audioBase64);
      const testUrl = base64ToAudioUrl(data.audioBase64);

      if (testAudioElRef.current) {
        testAudioElRef.current.pause();
      }
      const el = new Audio(testUrl);
      testAudioElRef.current = el;
      el.onplay = () => setIsPlayingTest(true);
      el.onpause = () => setIsPlayingTest(false);
      el.onended = () => setIsPlayingTest(false);
      el.play().catch(() => setIsPlayingTest(false));

      // Also create GeneratedAudio to add to history/player
      const generated: GeneratedAudio = {
        id: `clone_test_${Date.now()}`,
        title: `${targetVoice.name} (Clone Audition)`,
        text: auditionText,
        audioBase64: data.audioBase64,
        audioUrl: testUrl,
        voice: targetVoice.baseVoice,
        speakerName: targetVoice.name,
        mode: 'solo',
        style: targetVoice.stylePrompt,
        accent: targetVoice.accent,
        timestamp: Date.now(),
        duration: data.duration || 6,
        metadata: {
          title: `${targetVoice.name} (Clone Audition)`,
          artist: targetVoice.name,
          genre: 'Voice Clone',
          album: 'VoiceCraft AI Clones',
          year: new Date().getFullYear().toString(),
          comment: `Cloned AI Voice: ${targetVoice.accent} (${targetVoice.timbreProfile?.timbreType || 'Warm'})`,
        },
      };
      onAudioGenerated(generated);
    } catch (err: unknown) {
      console.error('Audition synthesis error:', err);
      setAnalysisError('Cloned voice test synthesis failed: ' + ((err as Error).message || 'Server error'));
    } finally {
      setIsSynthesizingTest(false);
    }
  };

  const toggleTestPlayback = () => {
    if (!testAudioElRef.current) return;
    if (isPlayingTest) {
      testAudioElRef.current.pause();
      setIsPlayingTest(false);
    } else {
      testAudioElRef.current.play().catch(() => setIsPlayingTest(false));
      setIsPlayingTest(true);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-pink-950/70 border border-purple-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Next-Gen Voice Cloning AI</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                🇮🇳 Indian English & Global Accents
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Zero-Shot Timbre Profiling
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Voice Cloning Studio & Acoustic Biometrics
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Clone your voice or any reference speaker in seconds using just 5 to 15 seconds of audio. Our neural engine analyzes fundamental pitch (Hz), vocal resonance, cadence, and dialect nuances to synthesize unlimited speech.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-xl shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveSubTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSubTab === 'create'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Clone New Voice</span>
            </button>

            <button
              onClick={() => setActiveSubTab('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSubTab === 'library'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Voice Library ({clonedVoices.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Views */}
      {activeSubTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Audio Sample Capture & Upload */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Mode Selector */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <AudioWaveform className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Step 1: Provide Voice Sample</h3>
                </div>
                <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    onClick={() => setInputMode('record')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      inputMode === 'record' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Mic</span>
                  </button>
                  <button
                    onClick={() => setInputMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      inputMode === 'upload' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                  </button>
                </div>
              </div>

              {/* Mode A: Live Mic Recording */}
              {inputMode === 'record' ? (
                <div className="space-y-4">
                  {/* Teleprompter Script Helper */}
                  <div className="bg-zinc-950/70 rounded-xl p-4 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-pink-400" />
                        <span>Recommended Calibration Script</span>
                      </span>
                      <div className="flex gap-1">
                        {SAMPLE_SCRIPTS.map((s, idx) => (
                          <button
                            key={s.title}
                            onClick={() => setSelectedScriptIndex(idx)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              selectedScriptIndex === idx
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Sample {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-200 italic font-serif leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                      "{SAMPLE_SCRIPTS[selectedScriptIndex].text}"
                    </p>
                  </div>

                  {/* Real-time Visualizer Canvas */}
                  <div className="relative w-full h-24 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={liveCanvasRef}
                      width={500}
                      height={96}
                      className="w-full h-full block"
                    />
                    {!isRecording && !recordedAudioUrl && (
                      <div className="absolute text-xs text-zinc-500 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-zinc-600" />
                        <span>Click "Start Recording" and read aloud for 5-15 seconds</span>
                      </div>
                    )}
                    {isRecording && (
                      <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-red-950/80 border border-red-500/50 px-2.5 py-0.5 rounded-full text-red-300 text-xs font-mono font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>{formatTime(recordDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Mic Transport Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Recording Microphone</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs sm:text-sm border border-zinc-700 shadow transition-all cursor-pointer animate-pulse"
                      >
                        <MicOff className="w-4 h-4 text-red-400" />
                        <span>Stop Recording ({recordDuration}s)</span>
                      </button>
                    )}

                    {recordedAudioUrl && !isRecording && (
                      <div className="flex items-center gap-2">
                        <audio src={recordedAudioUrl} controls className="h-8 max-w-[200px]" />
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{recordDuration}s Sample Ready</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Mode B: Audio File Upload */
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-zinc-700 hover:border-purple-500/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/50 transition-all">
                    <input
                      type="file"
                      accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-200">
                        {uploadedFileName ? uploadedFileName : 'Click or drag & drop audio sample'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports WAV, MP3, M4A, FLAC, OGG (5 - 60 seconds recommended)
                      </p>
                    </div>
                  </label>

                  {uploadedFileName && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs">
                      <span className="text-purple-300 font-medium truncate max-w-sm">
                        📁 {uploadedFileName} (~{uploadedAudioDuration}s)
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" /> Ready for AI Analysis
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Voice Metadata & Naming */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-100">Step 2: Profile Settings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Clone Name</label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g. My Voice, Aarav Clone, Executive CEO"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Speaker Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Female', 'Male', 'Neutral'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setVoiceGender(g)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          voiceGender === g
                            ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Notice */}
              {analysisError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                  {analysisError}
                </div>
              )}

              {/* Action Button: Run Voice Cloning */}
              <button
                onClick={handleAnalyzeVoice}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Acoustic Fingerprint & Timbre Vectors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Acoustic Fingerprint & Clone Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: AI Analysis Result & Instant Audition */}
          <div className="lg:col-span-5 space-y-6">
            {analyzedProfile ? (
              <div className="bg-gradient-to-b from-purple-950/50 to-zinc-900/90 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analyzedProfile.flag}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{analyzedProfile.name}</h4>
                      <p className="text-[11px] text-purple-300">{analyzedProfile.accent}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {analyzedProfile.timbreProfile.confidenceScore}% Acoustic Match
                  </span>
                </div>

                {/* Acoustic Specs Card */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Pitch (F0)</span>
                    <p className="font-mono font-bold text-purple-300 text-sm mt-0.5">
                      {analyzedProfile.timbreProfile.pitchHz} Hz
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Speaking Pace</span>
                    <p className="font-mono font-bold text-emerald-300 text-sm mt-0.5">
                      {analyzedProfile.timbreProfile.speakingRateWpm} WPM
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Timbre Type</span>
                    <p className="font-semibold text-zinc-200 text-xs mt-0.5 truncate">
                      {analyzedProfile.timbreProfile.timbreType}
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Base Engine Voice</span>
                    <p className="font-semibold text-pink-300 text-xs mt-0.5">
                      {analyzedProfile.baseVoice}
                    </p>
                  </div>
                </div>

                {/* Neural Style Prompt */}
                <div className="bg-zinc-950/90 p-3 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Neural Style Directive
                  </span>
                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    "{analyzedProfile.stylePrompt}"
                  </p>
                </div>

                {/* Instant Audition Box */}
                <div className="space-y-3 pt-2 border-t border-purple-500/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Audition Cloned Voice</span>
                    </span>
                    {isPlayingTest && (
                      <span className="text-emerald-400 font-mono text-[10px] animate-pulse">
                        Playing Test...
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={auditionText}
                    onChange={(e) => setAuditionText(e.target.value)}
                    placeholder="Enter test text to synthesize..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSynthesizeTest(analyzedProfile)}
                      disabled={isSynthesizingTest}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSynthesizingTest ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Synthesize Audio</span>
                        </>
                      )}
                    </button>

                    {testAudioBase64 && (
                      <button
                        onClick={toggleTestPlayback}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                        title={isPlayingTest ? 'Pause' : 'Replay'}
                      >
                        {isPlayingTest ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onSendToSolo(auditionText, analyzedProfile.name, analyzedProfile.stylePrompt)}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Send to Solo Narrator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">Acoustic Biometric Profile</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Record or upload a voice sample on the left, then click "Extract Acoustic Fingerprint" to view vocal pitch, cadence, and timbre analysis here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Cloned Voices Library Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Saved Voice Clones & Profiles</h3>
              <p className="text-xs text-zinc-400">
                Custom voice clones appear in your Narrator, Dialogue, and Batch selectors across VoiceCraft AI.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('create')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Clone Another Voice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clonedVoices.map((voice) => (
              <div
                key={voice.id}
                className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-md shadow-purple-500/20">
                        {voice.flag}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{voice.name}</span>
                          {voice.isCustomClone && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
                              Custom
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-zinc-400">{voice.accent}</span>
                      </div>
                    </div>

                    {voice.isCustomClone && (
                      <button
                        onClick={() => onDeleteClonedVoice(voice.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete Clone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Timbre & Pitch Tags */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      {voice.timbreProfile?.pitchHz || 140} Hz
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                      {voice.timbreProfile?.speakingRateWpm || 145} WPM
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {voice.timbreProfile?.timbreType || 'Resonant'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 italic">
                    "{voice.stylePrompt}"
                  </p>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedLibraryVoice(voice);
                      handleSynthesizeTest(voice);
                    }}
                    disabled={isSynthesizingTest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Audition</span>
                  </button>

                  <button
                    onClick={() => onSendToSolo(auditionText, voice.name, voice.stylePrompt)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Use in Narrator</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
