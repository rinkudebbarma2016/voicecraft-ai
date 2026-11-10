import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Apple,
  Smartphone,
  Globe,
  CheckCircle2,
  X,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Shield,
  Laptop,
} from 'lucide-react';

interface DownloadSoftwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopWindowFrame: boolean;
  onToggleDesktopFrame: (enabled: boolean) => void;
}

export const DownloadSoftwareModal: React.FC<DownloadSoftwareModalProps> = ({
  isOpen,
  onClose,
  isDesktopWindowFrame,
  onToggleDesktopFrame,
}) => {
  const [downloadStartedPlatform, setDownloadStartedPlatform] = useState<string | null>(null);

  if (!isOpen) return null;

  const platforms = [
    {
      id: 'windows',
      name: 'Windows 11 / 10',
      type: 'Desktop Software',
      icon: <Monitor className="w-6 h-6 text-cyan-400" />,
      badge: '64-bit Installer',
      version: 'v16.4.2 Pro',
      size: '142 MB',
      format: '.exe / .msi',
      details: 'DirectX 12, NVIDIA NVENC & Intel QuickSync hardware acceleration enabled.',
      downloadFilename: 'VoxCine-Studio-16-Pro-Windows-Setup.exe',
    },
    {
      id: 'apple',
      name: 'Apple macOS',
      type: 'Desktop Software',
      icon: <Apple className="w-6 h-6 text-zinc-100" />,
      badge: 'Apple Silicon & Intel',
      version: 'v16.4.2 Universal',
      size: '158 MB',
      format: '.dmg',
      details: 'Optimized for M1/M2/M3/M4 Max with Metal GPU rendering engine.',
      downloadFilename: 'VoxCine-Studio-16-Pro-macOS-Universal.dmg',
    },
    {
      id: 'android',
      name: 'Android Mobile & Tablet',
      type: 'Mobile App',
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      badge: 'Google Play & APK',
      version: 'v4.8 Mobile',
      size: '64 MB',
      format: '.apk / Play Store',
      details: 'Supports multi-track timeline, 4K export, and offline voiceover generation.',
      downloadFilename: 'VoxCine-Studio-Android-v4.8.apk',
    },
    {
      id: 'ios',
      name: 'iOS & iPadOS',
      type: 'Mobile & Tablet App',
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      badge: 'App Store & TestFlight',
      version: 'v4.8 iOS',
      size: '72 MB',
      format: 'App Store / PWA',
      details: 'Apple Pencil keyframing support, ProRes timeline, and iCloud project sync.',
      downloadFilename: 'VoxCine-Studio-iOS-Setup.mobileconfig',
    },
  ];

  const triggerFakeDownload = (platformName: string, filename: string) => {
    setDownloadStartedPlatform(platformName);
    // Create actual simulated installer download payload
    const dummyPayload = `VoxCine Studio Pro 16 - Standalone Package for ${platformName}\nVersion: 16.4.2-Release\nBuild Architecture: Universal Pro\nStatus: Verified Authenticode & Code-Signed`;
    const blob = new Blob([dummyPayload], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadStartedPlatform(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Download VoxCine Studio Pro</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  APPS & WEB
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Native applications for iOS, Android, Windows, and Apple macOS + Instant Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Both Apps and Website Mode Switcher Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Desktop Software Window Mode</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  NATIVE SIMULATION
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Switch between full browser website mode and desktop software frame with window controls & menus.
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleDesktopFrame(!isDesktopWindowFrame)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              isDesktopWindowFrame
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
            }`}
          >
            {isDesktopWindowFrame ? '✓ Desktop Frame Active' : 'Enable Desktop Frame'}
          </button>
        </div>

        {/* Notification when downloading */}
        {downloadStartedPlatform && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span>
              Downloading installer for <strong>{downloadStartedPlatform}</strong>. Check your browser downloads folder!
            </span>
          </div>
        )}

        {/* 4 Platforms Grid (Windows, Apple macOS, Android, iOS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:scale-105 transition-transform">
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-100">{p.name}</div>
                      <div className="text-[10px] text-zinc-400">{p.type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {p.badge}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">{p.details}</p>

                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                  <span>Version: {p.version}</span>
                  <span>•</span>
                  <span>Size: {p.size}</span>
                  <span>•</span>
                  <span>{p.format}</span>
                </div>
              </div>

              <button
                onClick={() => triggerFakeDownload(p.name, p.downloadFilename)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download for {p.name.split(' ')[0]}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Web App & PWA Instant Access */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-zinc-200">Cloud Web Edition: </span>
              <span className="text-zinc-400 text-[11px]">
                Always up to date in any Chromium, Safari, or Firefox browser. Zero install required.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer"
          >
            Stay on Web
          </button>
        </div>
      </div>
    </div>
  );
};
