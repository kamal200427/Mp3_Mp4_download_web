import React from 'react';
import { X, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';

interface PlatformGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformGuideModal: React.FC<PlatformGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const platforms = [
    {
      name: 'YouTube & Shorts',
      domain: 'youtube.com / youtu.be',
      instructions:
        'Open YouTube, click "Share" below the video or Short, then click "Copy link". Alternatively, copy the browser URL address directly.',
      badge: 'Video & Audio',
    },
    {
      name: 'TikTok',
      domain: 'tiktok.com',
      instructions:
        'Open the TikTok video, tap the arrow "Share" button on the right-hand panel, then tap "Copy Link".',
      badge: 'Video & Audio',
    },
    {
      name: 'Instagram Reels & Posts',
      domain: 'instagram.com',
      instructions:
        'Tap the paper plane or three dots menu on any Instagram Reel or video post, and choose "Copy link".',
      badge: 'Video & Audio',
    },
    {
      name: 'X (Twitter)',
      domain: 'x.com / twitter.com',
      instructions:
        'Click the share icon below the post with the video and select "Copy link to post".',
      badge: 'Video & Audio',
    },
    {
      name: 'Vimeo',
      domain: 'vimeo.com',
      instructions:
        'Copy the URL from the browser navigation bar or click the paper-plane share icon on the Vimeo video player.',
      badge: 'HD Video & Audio',
    },
    {
      name: 'Direct MP4 / WebM Streams',
      domain: 'any website (*.mp4, *.webm)',
      instructions:
        'Right click on any video online and choose "Copy Video Address" or paste any direct CDN link.',
      badge: 'Lossless Raw',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Supported Platforms & Link Guide
              </h3>
              <p className="text-xs text-slate-400">
                How to copy video links for fast downloading and conversion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {platforms.map((p, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                  <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800/40">
                    {p.domain}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {p.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {p.instructions}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            For personal media archiving and creative educational use.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
