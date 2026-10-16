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
    <>
      {/* Top Header - Compact, single row, strict contract */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
            </div>
            <button
              onClick={() => setActiveTab('downloader')}
              className="text-left font-display text-lg sm:text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap"
            >
              Omni<span className="text-indigo-400">Stream</span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop/Tablet) */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              aria-label="Supported Sites Guide"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Supported Sites</span>
              <span className="sm:hidden text-xs">Help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pattern 1: Mobile Fixed Bottom Tab Bar (Thumb Zone Navigation) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe shadow-2xl"
      >
        <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-1">
          <button
            onClick={() => setActiveTab('downloader')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors relative ${
              activeTab === 'downloader' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-1">Downloader</span>
            {activeTab === 'downloader' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mp4-to-mp3')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors relative ${
              activeTab === 'mp4-to-mp3' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-1">MP4→MP3</span>
            {activeTab === 'mp4-to-mp3' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mp3-to-mp4')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors relative ${
              activeTab === 'mp3-to-mp4' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-1">MP3→MP4</span>
            {activeTab === 'mp3-to-mp4' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors relative ${
              activeTab === 'history' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FolderDown className="w-5 h-5" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1">Library</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
