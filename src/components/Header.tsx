import React from 'react';
import { Download, Film, Music, FolderDown, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'downloader' | 'mp4-to-mp3' | 'mp3-to-mp4' | 'history';
  setActiveTab: (tab: 'downloader' | 'mp4-to-mp3' | 'mp3-to-mp4' | 'history') => void;
  onOpenGuide: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenGuide,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Download className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <button
            onClick={() => setActiveTab('downloader')}
            className="text-left font-display text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap"
          >
            Omni<span className="text-indigo-400">Stream</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-sm font-medium">
          <button
            onClick={() => setActiveTab('downloader')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'downloader'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Downloader</span>
          </button>

          <button
            onClick={() => setActiveTab('mp4-to-mp3')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'mp4-to-mp3'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>MP4 to MP3</span>
          </button>

          <button
            onClick={() => setActiveTab('mp3-to-mp4')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'mp3-to-mp4'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>MP3 to MP4</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>Library</span>
            {historyCount > 0 && (
              <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-mono">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Supported Sites</span>
            <span className="sm:hidden">Help</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex items-center justify-around gap-1 mt-2.5 pt-2 border-t border-slate-900 text-xs">
        <button
          onClick={() => setActiveTab('downloader')}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md ${
            activeTab === 'downloader' ? 'text-indigo-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Downloader</span>
        </button>
        <button
          onClick={() => setActiveTab('mp4-to-mp3')}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md ${
            activeTab === 'mp4-to-mp3' ? 'text-indigo-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>MP4→MP3</span>
        </button>
        <button
          onClick={() => setActiveTab('mp3-to-mp4')}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md ${
            activeTab === 'mp3-to-mp4' ? 'text-indigo-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>MP3→MP4</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md ${
            activeTab === 'history' ? 'text-indigo-400 font-medium' : 'text-slate-400'
          }`}
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span>Library ({historyCount})</span>
        </button>
      </div>
    </header>
  );
};
