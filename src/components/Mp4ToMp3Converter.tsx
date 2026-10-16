import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Music,
  Film,
  Play,
  Pause,
  Download,
  Scissors,
  Volume2,
  Sliders,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AudioConversionSettings } from '../types/media';
import {
  decodeAudioFromFile,
  encodeToMp3,
  encodeToWav,
  extractWaveformData,
  generateDemoAudioBuffer,
  processAudioBuffer,
} from '../utils/audioConverter';
import { addToHistory, triggerFileDownload } from '../services/downloadService';

export const Mp4ToMp3Converter: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState('sample_video.mp4');

  const [decodedAudioBuffer, setDecodedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);

  // Trimming & Settings
  const [settings, setSettings] = useState<AudioConversionSettings>({
    format: 'mp3',
    bitrate: 320,
    sampleRate: 44100,
    volumeBoost: 1.0,
    fadeIn: false,
    fadeOut: false,
    trimStart: 0,
    trimEnd: 0,
  });

  // Preview Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioPlaybackTime, setAudioPlaybackTime] = useState(0);

  // Conversion Progress State
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionPhase, setConversionPhase] = useState('');
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (file: File) => {
    setVideoFile(file);
    setVideoFileName(file.name);
    const vUrl = URL.createObjectURL(file);
    setVideoUrl(vUrl);
    setConvertedBlob(null);
    setConvertedUrl(null);

    setIsConverting(true);
    setConversionProgress(20);
    setConversionPhase('Decoding video audio track...');

    try {
      const buffer = await decodeAudioFromFile(file);
      setDecodedAudioBuffer(buffer);
      setDuration(buffer.duration);
      setSettings((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: buffer.duration,
      }));

      const peaks = extractWaveformData(buffer, 120);
      setWaveformData(peaks);
    } catch {
      alert('Could not decode audio from this video. Please try another MP4/WebM file.');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
      setConversionPhase('');
    }
  };

  const handleUseSample = async () => {
    setIsConverting(true);
    setConversionPhase('Generating high-fidelity sample audio...');
    setConversionProgress(30);

    const sampleBuffer = generateDemoAudioBuffer(12);
    setDecodedAudioBuffer(sampleBuffer);
    setDuration(sampleBuffer.duration);
    setVideoFileName('Cosmic_Drift_Sample.mp4');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

    setSettings((prev) => ({
      ...prev,
      trimStart: 0,
      trimEnd: sampleBuffer.duration,
    }));

    const peaks = extractWaveformData(sampleBuffer, 120);
    setWaveformData(peaks);

    setIsConverting(false);
    setConversionProgress(0);
    setConversionPhase('');
  };

  const handleToggleAudioPreview = () => {
    if (!decodedAudioBuffer) return;

    if (isPlayingAudio) {
      if (audioSourceNodeRef.current) {
        audioSourceNodeRef.current.stop();
      }
      setIsPlayingAudio(false);
    } else {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = decodedAudioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = settings.volumeBoost;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      const offset = settings.trimStart || 0;
      const durationPlay = Math.max(0.1, settings.trimEnd - settings.trimStart);

      source.start(0, offset, durationPlay);
      audioSourceNodeRef.current = source;
      setIsPlayingAudio(true);

      source.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  };

  const handleConvert = async () => {
    if (!decodedAudioBuffer) return;

    setIsConverting(true);
    setConversionProgress(10);
    setConversionPhase('Applying audio trimming & volume normalization...');

    try {
      await new Promise((r) => setTimeout(r, 100));
      const processedBuffer = processAudioBuffer(decodedAudioBuffer, settings);

      let blob: Blob;
      if (settings.format === 'mp3') {
        setConversionPhase('Encoding high-bitrate LAME MP3...');
        blob = await encodeToMp3(processedBuffer, settings.bitrate, (pct) => {
          setConversionProgress(pct);
        });
      } else {
        setConversionPhase('Encoding 16-bit PCM WAV...');
        blob = encodeToWav(processedBuffer);
        setConversionProgress(100);
      }

      setConvertedBlob(blob);
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);

      const baseName = videoFileName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseName}_audio.${settings.format}`;

      addToHistory({
        title: baseName,
        type: 'mp4-to-mp3',
        format: settings.format.toUpperCase(),
        quality: `${settings.bitrate} kbps`,
        fileSize: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
      });

      triggerFileDownload(blob, finalFileName);
    } catch {
      alert('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
      setConversionPhase('');
    }
  };

  const trimmedDuration = Math.max(0, settings.trimEnd - settings.trimStart);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Music className="w-4 h-4" />
            <span>Fast In-Browser Video to Audio Extractor</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            MP4 to MP3 Audio Converter & Trimmer
          </h1>
          <p className="text-slate-400 text-sm">
            Upload any MP4, WebM, or MOV video file to extract studio-grade MP3 audio (up to 320 kbps) with custom waveform trimming and volume boost.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Video Uploader & Preview */}
        <div className="lg:col-span-7 space-y-6">
          {!decodedAudioBuffer ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-8 lg:p-12 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*,audio/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files && target.files[0]) {
                    handleFileUpload(target.files[0]);
                  }
                };
                input.click();
              }}
            >
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold text-white">
                    Drop your MP4 Video Here
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supports MP4, WebM, MOV, MKV, AVI and Audio files
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors">
                    Browse Local File
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseSample();
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 mx-auto font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>No file on hand? Try with instant Sample Video</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded Media & Player */
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white truncate max-w-xs">
                    {videoFileName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDecodedAudioBuffer(null);
                    setVideoUrl(null);
                    setConvertedBlob(null);
                    setConvertedUrl(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change File</span>
                </button>
              </div>

              {/* Video Player */}
              {videoUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Waveform Trimmer View */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Visual Audio Trimmer</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-400">
                    Trimmed: <span className="text-indigo-300 font-bold">{formatTime(trimmedDuration)}</span> / {formatTime(duration)}
                  </div>
                </div>

                {/* Interactive Waveform Canvas Display */}
                <div className="relative h-20 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-between gap-0.5 overflow-hidden">
                  {waveformData.map((peak, idx) => {
                    const progressRatio = idx / waveformData.length;
                    const isInsideTrim =
                      progressRatio >= settings.trimStart / duration &&
                      progressRatio <= settings.trimEnd / duration;

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all ${
                          isInsideTrim ? 'bg-indigo-500' : 'bg-slate-700/50'
                        }`}
                        style={{ height: `${Math.max(8, peak * 100)}%` }}
                      />
                    );
                  })}
                </div>

                {/* Dual Sliders for Trimming */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      Start Time: <span className="text-white font-mono">{formatTime(settings.trimStart)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={settings.trimStart}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < settings.trimEnd) {
                          setSettings((p) => ({ ...p, trimStart: val }));
                        }
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      End Time: <span className="text-white font-mono">{formatTime(settings.trimEnd)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={settings.trimEnd}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > settings.trimStart) {
                          setSettings((p) => ({ ...p, trimEnd: val }));
                        }
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Audio preview playback button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleToggleAudioPreview}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Stop Audio Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-200" />
                        <span>Listen to Trimmed Selection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Audio Output Settings & Conversion Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display text-base font-semibold text-white">
                Audio Conversion Settings
              </h3>
            </div>

            {/* Target Format */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Target Audio Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, format: 'mp3' }))}
                  className={`py-2.5 px-3 min-h-[44px] text-xs font-semibold rounded-lg border transition-all text-center flex items-center justify-center ${
                    settings.format === 'mp3'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  MP3 (Standard Audio)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, format: 'wav' }))}
                  className={`py-2.5 px-3 min-h-[44px] text-xs font-semibold rounded-lg border transition-all text-center flex items-center justify-center ${
                    settings.format === 'wav'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  WAV (Lossless PCM)
                </button>
              </div>
            </div>

            {/* MP3 Bitrate */}
            {settings.format === 'mp3' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  Audio Bitrate Quality
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[320, 256, 192, 128].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSettings((p) => ({ ...p, bitrate: b as any }))}
                      className={`py-2.5 px-1 min-h-[44px] text-xs font-mono font-semibold rounded-lg border transition-all text-center flex items-center justify-center active:scale-95 ${
                        settings.bitrate === b
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b}k
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  320 kbps offers the highest studio acoustic clarity.
                </p>
              </div>
            )}

            {/* Volume Boost */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Volume Normalization
                </span>
                <span className="font-mono text-indigo-300 font-semibold">
                  {Math.round(settings.volumeBoost * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={settings.volumeBoost}
                onChange={(e) => setSettings((p) => ({ ...p, volumeBoost: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Fade Options */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
              <label className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 border border-slate-800 rounded-lg text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={settings.fadeIn}
                  onChange={(e) => setSettings((p) => ({ ...p, fadeIn: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300 font-medium">Fade In (1.5s)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 border border-slate-800 rounded-lg text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={settings.fadeOut}
                  onChange={(e) => setSettings((p) => ({ ...p, fadeOut: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300 font-medium">Fade Out (1.5s)</span>
              </label>
            </div>

            {/* Convert CTA */}
            <div className="pt-3">
              <button
                onClick={handleConvert}
                disabled={isConverting || !decodedAudioBuffer}
                className="w-full py-3.5 px-4 min-h-[48px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm active:scale-[0.98]"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing ({conversionProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Extract & Download {settings.format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Conversion Progress Bar */}
            {isConverting && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span>{conversionPhase}</span>
                  <span className="font-mono font-bold">{conversionProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Converted Audio Player Result */}
            {convertedUrl && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/80 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Conversion Successful! Download Ready</span>
                </div>
                <audio src={convertedUrl} controls className="w-full h-9" />
                <button
                  onClick={() => {
                    if (convertedBlob) {
                      const baseName = videoFileName.replace(/\.[^/.]+$/, '');
                      triggerFileDownload(convertedBlob, `${baseName}_audio.${settings.format}`);
                    }
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-download Converted File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
