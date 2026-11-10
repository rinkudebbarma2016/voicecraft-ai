import React, { useEffect, useState } from 'react';
import {
  Database,
  X,
  Play,
  Trash2,
  RefreshCw,
  Film,
  Radio,
  Clock,
  Sparkles,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadVideoToPlayer?: (videoUrl: string, title: string) => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  isOpen,
  onClose,
  onLoadVideoToPlayer,
}) => {
  const { currentUser, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'videos' | 'conversations'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDatabaseRecords();
    }
  }, [isOpen, activeTab]);

  const loadDatabaseRecords = async () => {
    setIsLoading(true);
    try {
      const token = await getIdToken();
      const userId = currentUser?.uid || 'anonymous';

      if (activeTab === 'videos') {
        const res = await fetch(`/api/videos?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.videos) setVideos(data.videos);
      } else {
        const res = await fetch(`/api/conversations?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.conversations) setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load records from Cloud SQL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video from Cloud SQL?')) return;
    try {
      const token = await getIdToken();
      const userId = currentUser?.uid || 'anonymous';
      await fetch(`/api/videos/${id}?userId=${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-zinc-950 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  PostgreSQL Cloud SQL Database
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold uppercase">
                  Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Persistent relational storage for videos & Gemini Live voice sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'videos'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Saved Videos ({videos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'conversations'
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Live Voice Sessions ({conversations.length})</span>
            </button>
          </div>

          <button
            onClick={loadDatabaseRecords}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 flex-1 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Querying Cloud SQL PostgreSQL instance...</p>
            </div>
          ) : activeTab === 'videos' ? (
            videos.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No videos saved to PostgreSQL yet. Animate an image using Gemini Omni Flash or CineStudio and click "Save to Cloud SQL"!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition flex flex-col justify-between group"
                  >
                    <div>
                      {vid.sourceImage ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-black">
                          <img
                            src={vid.sourceImage}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-cyan-300 font-bold border border-cyan-800">
                            {vid.model || 'gemini-omni-1.2-flash'}
                          </div>
                        </div>
                      ) : null}
                      <h4 className="text-xs font-bold text-white mb-1 truncate">{vid.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">{vid.prompt || 'Cinematic Video'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
                      <span>{vid.duration}s • {vid.aspectRatio}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onLoadVideoToPlayer) {
                              onLoadVideoToPlayer(vid.videoUrl, vid.title);
                            }
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                          title="Delete from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : conversations.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No voice director conversations recorded yet. Launch the Gemini Live Voice Director to start a session!
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition cursor-pointer"
                  onClick={() => setSelectedConvo(convo)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{convo.title}</span>
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {convo.durationSeconds}s duration
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{convo.summary || convo.transcript}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Convo Modal View */}
        {selectedConvo && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{selectedConvo.title}</span>
              <button
                onClick={() => setSelectedConvo(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close Transcript
              </button>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg max-h-40 overflow-y-auto text-xs text-zinc-300 font-mono whitespace-pre-wrap scrollbar-thin">
              {selectedConvo.transcript}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
