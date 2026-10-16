import React, { useState } from 'react';
import {
  FolderDown,
  Film,
  Music,
  Trash2,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { HistoryItem } from '../types/media';
import { clearHistory, removeFromHistory, triggerFileDownload } from '../services/downloadService';

interface DownloadHistoryProps {
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  onGoToDownloader: () => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  history,
  setHistory,
  onGoToDownloader,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio'>('all');

  const handleDelete = (id: string) => {
    const updated = removeFromHistory(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your download library history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const filteredItems = history.filter((item) => {
    if (filter === 'video') return item.format.includes('MP4') || item.type === 'mp3-to-mp4';
    if (filter === 'audio') return item.format.includes('MP3') || item.type === 'mp4-to-mp3';
    return true;
  });

  const videoCount = history.filter((i) => i.format.includes('MP4') || i.type === 'mp3-to-mp4').length;
  const audioCount = history.filter((i) => i.format.includes('MP3') || i.type === 'mp4-to-mp3').length;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <FolderDown className="w-4 h-4" />
            <span>Local Storage Library</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Downloads & Conversion Library
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Quickly access and re-download your processed files from this session.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 rounded-lg transition-colors self-start sm:self-auto shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Library</span>
          </button>
        )}
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
          <div className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Total</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {history.length}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
          <div className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 truncate">
            <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">MP4 Videos</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {videoCount}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
          <div className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 truncate">
            <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">MP3 Audios</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {audioCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs (Responsive full width on phone) */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-full sm:w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({history.length})
        </button>
        <button
          onClick={() => setFilter('video')}
          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center ${
            filter === 'video'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Videos ({videoCount})
        </button>
        <button
          onClick={() => setFilter('audio')}
          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center ${
            filter === 'audio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Audio ({audioCount})
        </button>
      </div>

      {/* Item List / Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
            <FolderDown className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-white">
              No files in this filter yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Download any video from YouTube, extract MP3 audio, or render an MP4 visualizer to see items here.
            </p>
          </div>
          <button
            onClick={onGoToDownloader}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Go to Downloader</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isVideo = item.format.includes('MP4') || item.type === 'mp3-to-mp4';

            return (
              <div
                key={item.id}
                className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : isVideo ? (
                      <Film className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Music className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span className="font-semibold text-indigo-400">{item.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.quality}</span>
                      {item.fileSize && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{item.fileSize}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      alert(`File "${item.title}.${item.format.toLowerCase()}" is archived in your session.`);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
                    title="Download again"
                    aria-label="Download again"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 active:bg-rose-950/50 rounded-lg transition-colors"
                    title="Delete item"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
