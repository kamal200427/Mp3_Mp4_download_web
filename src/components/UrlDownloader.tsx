import React, { useState } from 'react';
import {
  Search,
  Clipboard,
  X,
  Play,
  Download,
  CheckCircle2,
  Loader2,
  Film,
  Music,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DownloadFormatCategory, DownloadOption, ParsedMediaInfo } from '../types/media';
import { getAvailableDownloadOptions, parseMediaUrl, SAMPLE_LINKS, SampleVideoLink } from '../utils/socialParser';
import { addToHistory, processSocialDownload, triggerFileDownload } from '../services/downloadService';

interface UrlDownloaderProps {
  onMediaProcessed?: () => void;
  onSendToMp3Converter?: (media: ParsedMediaInfo) => void;
}

export const UrlDownloader: React.FC<UrlDownloaderProps> = ({
  onMediaProcessed,
  onSendToMp3Converter,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaInfo, setMediaInfo] = useState<ParsedMediaInfo | null>(null);
  const [downloadCategory, setDownloadCategory] = useState<DownloadFormatCategory>('video');

  // Download state tracking
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        handleAnalyze(text);
      }
    } catch {
      // Permission issue fallback
    }
  };

  const handleAnalyze = async (urlToTest?: string) => {
    const targetUrl = (urlToTest || urlInput).trim();
    if (!targetUrl) {
      setErrorMessage('Please enter or paste a valid video URL');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const parsed = await parseMediaUrl(targetUrl);
      setMediaInfo(parsed);
    } catch {
      setErrorMessage('Could not analyze this URL. Check format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (sample: SampleVideoLink) => {
    setUrlInput(sample.url);
    handleAnalyze(sample.url);
  };

  const handleDownload = async (option: DownloadOption) => {
    if (!mediaInfo || downloadingId) return;

    setDownloadingId(option.id);
    setDownloadProgress(10);
    setDownloadStatusText('Starting download stream...');

    try {
      const result = await processSocialDownload(mediaInfo, option.id, (percent, msg) => {
        setDownloadProgress(percent);
        setDownloadStatusText(msg);
      });

      triggerFileDownload(result.blob, result.filename);

      // Record to history
      addToHistory({
        title: mediaInfo.title,
        type: 'download',
        platform: mediaInfo.platform,
        format: option.extension.toUpperCase(),
        quality: option.quality,
        fileSize: option.estimatedSize,
        thumbnail: mediaInfo.thumbnail,
      });

      if (onMediaProcessed) {
        onMediaProcessed();
      }
    } catch {
      setDownloadStatusText('Download failed. Please try again.');
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(0);
        setDownloadStatusText('');
      }, 2000);
    }
  };

  const options = mediaInfo ? getAvailableDownloadOptions(mediaInfo) : [];
  const filteredOptions = options.filter((opt) => opt.category === downloadCategory);

  return (
    <div className="space-y-8">
      {/* Search & URL Input Section */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-balance">
              Paste Any Video Link to Preview & Download
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Download YouTube, TikTok, Instagram, Twitter, Vimeo, and Facebook videos in high-definition MP4 or extract pure MP3 audio.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative mt-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xl">
              <div className="flex items-center gap-2 w-full px-3 py-1">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                  placeholder="Paste YouTube, TikTok, Instagram or direct MP4 link here..."
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
                />

                {urlInput && (
                  <button
                    onClick={() => {
                      setUrlInput('');
                      setMediaInfo(null);
                    }}
                    className="p-1 hover:text-white text-slate-400 transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handlePaste}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shrink-0"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>

              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !urlInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 shadow-md shadow-indigo-600/30 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Get Video</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-rose-400 text-xs mt-2 text-left">{errorMessage}</p>
            )}
          </div>

          {/* Quick 1-Click Sample Links */}
          <div className="pt-2">
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Test Links:
              </span>
              {SAMPLE_LINKS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(sample)}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60 transition-colors whitespace-nowrap"
                >
                  {sample.badge}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Result & Live Player Preview Section */}
      {mediaInfo && (
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 lg:p-8 space-y-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Live Player / Video Preview */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                {mediaInfo.platform === 'youtube' && mediaInfo.embedUrl ? (
                  <iframe
                    src={mediaInfo.embedUrl}
                    title={mediaInfo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : mediaInfo.platform === 'vimeo' && mediaInfo.embedUrl ? (
                  <iframe
                    src={mediaInfo.embedUrl}
                    title={mediaInfo.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : mediaInfo.directVideoUrl ? (
                  <video
                    src={mediaInfo.directVideoUrl}
                    controls
                    playsInline
                    poster={mediaInfo.thumbnail}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={mediaInfo.thumbnail}
                      alt={mediaInfo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <a
                        href={mediaInfo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-indigo-600/90 text-white rounded-full hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                      >
                        <Play className="w-6 h-6 fill-white" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Video metadata row - Zero Pill Rule */}
              <div className="space-y-1.5 pt-1">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white line-clamp-2">
                  {mediaInfo.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{mediaInfo.author}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-400 font-medium">{mediaInfo.platformName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{mediaInfo.duration}</span>
                  {mediaInfo.views && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{mediaInfo.views}</span>
                    </>
                  )}
                  {mediaInfo.likes && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{mediaInfo.likes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Converter Bridge Action */}
              <div className="pt-2">
                <button
                  onClick={() => onSendToMp3Converter && onSendToMp3Converter(mediaInfo)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 underline decoration-indigo-400/50 underline-offset-4"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Send this media directly to the MP4 to MP3 Audio Trimmer</span>
                </button>
              </div>
            </div>

            {/* Right Column: Download Options Matrix */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold text-white">
                  Available Download Formats
                </h3>
                <p className="text-xs text-slate-400">
                  Select your desired format and quality to download directly to your device.
                </p>
              </div>

              {/* Format Filter Tabs (Interactive Segmented Control) */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDownloadCategory('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    downloadCategory === 'video'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Video (MP4)</span>
                </button>
                <button
                  onClick={() => setDownloadCategory('audio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    downloadCategory === 'audio'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Audio (MP3)</span>
                </button>
                <button
                  onClick={() => setDownloadCategory('thumbnail')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    downloadCategory === 'thumbnail'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Cover Art</span>
                </button>
              </div>

              {/* Download Options List */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredOptions.map((opt) => {
                  const isThisDownloading = downloadingId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] font-medium text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.2 rounded">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                          <span>{opt.bitrateOrRes}</span>
                          <span aria-hidden="true">·</span>
                          <span>{opt.estimatedSize}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => handleDownload(opt)}
                          disabled={!!downloadingId}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                            isThisDownloading
                              ? 'bg-indigo-700 text-white cursor-wait'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95'
                          }`}
                        >
                          {isThisDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{downloadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Toast / Feedback if downloading */}
              {downloadingId && (
                <div className="p-3.5 bg-indigo-950/70 border border-indigo-800/80 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-indigo-200">
                    <span className="font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {downloadStatusText || 'Processing media download...'}
                    </span>
                    <span className="font-mono tabular-nums font-bold">
                      {downloadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* External source notice */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Direct stream demuxing</span>
                <a
                  href={mediaInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open Original</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Pillars Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Film className="w-4 h-4" />
          </div>
          <h4 className="font-display font-semibold text-white text-sm">
            High Definition 1080p & 4K
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Preserve crystal-clear video resolution with original audio bitrates up to 60fps for uninterrupted viewing.
          </p>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Music className="w-4 h-4" />
          </div>
          <h4 className="font-display font-semibold text-white text-sm">
            Studio 320 kbps MP3 Extraction
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extract pure MP3 tracks encoded with professional LAME algorithms for rich acoustic fidelity and speech clarity.
          </p>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="font-display font-semibold text-white text-sm">
            Universal Social Media Support
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compatible with YouTube Videos & Shorts, TikTok trends, Instagram Reels, X clips, Vimeo HD, and direct MP4 streams.
          </p>
        </div>
      </section>
    </div>
  );
};
