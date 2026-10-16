import React from 'react';
import { Download, Film, Music, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: 'downloader' | 'mp4-to-mp3' | 'mp3-to-mp4') => void;
  onOpenGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenGuide }) => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 py-10 px-4 lg:px-8 mt-16 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white font-display font-semibold">
            <Download className="w-4 h-4 text-indigo-400" />
            <span>OmniStream Media Studio</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span>In-browser social media video & audio workstation</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <button
            onClick={() => onSelectTab('downloader')}
            className="hover:text-slate-200 transition-colors"
          >
            Video Downloader
          </button>
          <button
            onClick={() => onSelectTab('mp4-to-mp3')}
            className="hover:text-slate-200 transition-colors"
          >
            MP4 to MP3
          </button>
          <button
            onClick={() => onSelectTab('mp3-to-mp4')}
            className="hover:text-slate-200 transition-colors"
          >
            MP3 to MP4
          </button>
          <button
            onClick={onOpenGuide}
            className="hover:text-slate-200 transition-colors"
          >
            Supported Sites
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Client-side audio/video processing</span>
        </div>
      </div>
    </footer>
  );
};
