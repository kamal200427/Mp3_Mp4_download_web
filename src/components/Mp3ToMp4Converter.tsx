import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Film,
  Music,
  Play,
  Pause,
  Download,
  Palette,
  Type,
  Layout,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { VideoAspectRatio, VideoGenerationSettings, VisualizerStyle } from '../types/media';
import { decodeAudioFromFile, generateDemoAudioBuffer } from '../utils/audioConverter';
import {
  drawVisualizerFrame,
  generateMp4VideoFromAudio,
  getResolutionForAspect,
  PRESET_BACKGROUNDS,
} from '../utils/videoConverter';
import { addToHistory, triggerFileDownload } from '../services/downloadService';

export const Mp3ToMp4Converter: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('lofi_beats.mp3');
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);

  // Video Settings
  const [settings, setSettings] = useState<VideoGenerationSettings>({
    aspectRatio: '16:9',
    visualizerStyle: 'bars',
    backgroundImage: PRESET_BACKGROUNDS[0].url,
    primaryColor: '#6366f1',
    secondaryColor: '#38bdf8',
    title: 'Midnight Echoes',
    artist: 'OmniStream Studio',
    subtext: 'Created with OmniStream Studio',
    showWaveform: true,
    fps: 30,
  });

  // Live Canvas Preview State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewStartTimeRef = useRef<number>(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Video Generation Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genPhase, setGenPhase] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Load background image on change
  useEffect(() => {
    if (!settings.backgroundImage.startsWith('gradient:')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        bgImgRef.current = img;
        drawStaticPreview();
      };
      img.src = settings.backgroundImage;
    } else {
      bgImgRef.current = null;
      drawStaticPreview();
    }
  }, [settings.backgroundImage]);

  // Clean up
  useEffect(() => {
    return () => {
      stopPreview();
      if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
    };
  }, []);

  const drawStaticPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getResolutionForAspect(settings.aspectRatio);
    canvas.width = width;
    canvas.height = height;

    // Simulated frequency data for static preview
    const dummyFreq = new Uint8Array(128);
    const dummyTime = new Uint8Array(128);
    for (let i = 0; i < 128; i++) {
      dummyFreq[i] = Math.floor(Math.sin(i * 0.1) * 80 + 100);
      dummyTime[i] = Math.floor(Math.sin(i * 0.2) * 60 + 128);
    }

    drawVisualizerFrame(ctx, width, height, dummyFreq, dummyTime, settings, bgImgRef.current, 0);
  };

  useEffect(() => {
    if (!isPlayingPreview) {
      drawStaticPreview();
    }
  }, [settings]);

  const handleFileUpload = async (file: File) => {
    setAudioFile(file);
    setAudioFileName(file.name);
    setGeneratedVideoUrl(null);
    setGeneratedBlob(null);

    const titleGuess = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setSettings((p) => ({ ...p, title: titleGuess }));

    try {
      const buffer = await decodeAudioFromFile(file);
      setDecodedBuffer(buffer);
      stopPreview();
      setTimeout(drawStaticPreview, 100);
    } catch {
      alert('Could not decode audio. Please ensure it is a valid MP3, WAV or OGG file.');
    }
  };

  const handleUseSample = async () => {
    const sampleBuffer = generateDemoAudioBuffer(12);
    setDecodedBuffer(sampleBuffer);
    setAudioFileName('Midnight_Cosmic_Pulse.mp3');
    setSettings((p) => ({
      ...p,
      title: 'Cosmic Driftway',
      artist: 'Starlight Waves',
    }));
    stopPreview();
    setTimeout(drawStaticPreview, 100);
  };

  const stopPreview = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Ignore
      }
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const togglePreview = () => {
    if (isPlayingPreview) {
      stopPreview();
      drawStaticPreview();
      return;
    }

    if (!decodedBuffer) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const source = ctx.createBufferSource();
    source.buffer = decodedBuffer;
    sourceNodeRef.current = source;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    source.start(0);
    previewStartTimeRef.current = performance.now();
    setIsPlayingPreview(true);

    source.onended = () => {
      stopPreview();
      drawStaticPreview();
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    const { width, height } = getResolutionForAspect(settings.aspectRatio);

    function loop() {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      const elapsed = (performance.now() - previewStartTimeRef.current) / 1000;
      drawVisualizerFrame(
        canvasCtx!,
        width,
        height,
        freqData,
        timeData,
        settings,
        bgImgRef.current,
        elapsed
      );

      animFrameRef.current = requestAnimationFrame(loop);
    }

    loop();
  };

  const handleGenerateVideo = async () => {
    if (!decodedBuffer) return;
    stopPreview();

    setIsGenerating(true);
    setGenProgress(0);
    setGenPhase('Initializing video render pipeline...');

    try {
      const result = await generateMp4VideoFromAudio(
        decodedBuffer,
        settings,
        (pct, phase) => {
          setGenProgress(pct);
          setGenPhase(phase);
        }
      );

      setGeneratedBlob(result.videoBlob);
      setGeneratedVideoUrl(result.downloadUrl);

      const filename = `${settings.title.replace(/\s+/g, '_')}_Video.mp4`;

      addToHistory({
        title: settings.title,
        type: 'mp3-to-mp4',
        format: 'MP4',
        quality: `${settings.aspectRatio} · 1080p`,
        fileSize: `${(result.videoBlob.size / (1024 * 1024)).toFixed(1)} MB`,
      });

      triggerFileDownload(result.videoBlob, filename);
    } catch {
      alert('Video generation failed. Please try a shorter duration or check browser permissions.');
    } finally {
      setIsGenerating(false);
      setGenProgress(0);
      setGenPhase('');
    }
  };

  const aspectStyles: Record<VideoAspectRatio, string> = {
    '16:9': 'aspect-video w-full',
    '9:16': 'aspect-[9/16] max-h-[340px] sm:max-h-[460px] mx-auto',
    '1:1': 'aspect-square max-h-[300px] sm:max-h-[420px] mx-auto',
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Film className="w-4 h-4" />
            <span>High-Speed In-Browser Audio to Video Studio</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            MP3 to MP4 Video Visualizer Creator
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Convert any MP3 or WAV song into a cinematic video with sound-reactive music visualizers, custom backgrounds, and metadata for YouTube, TikTok, and Instagram.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Live Visualizer Preview Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {!decodedBuffer ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-6 sm:p-12 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*';
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
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Music className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-white">
                    Drop your MP3 or Audio Track Here
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supports MP3, WAV, OGG, M4A, FLAC
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors">
                    Browse Audio File
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseSample();
                    }}
                    className="min-h-[44px] text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 mx-auto font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test instantly with Sample Synth Track</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Visualizer Canvas & Controls */
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                    {audioFileName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    ({Math.round(decodedBuffer.duration)}s)
                  </span>
                </div>
                <button
                  onClick={() => {
                    stopPreview();
                    setDecodedBuffer(null);
                  }}
                  className="min-h-[38px] px-2 text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change Track</span>
                </button>
              </div>

              {/* Live Responsive Canvas Container */}
              <div
                className={`relative w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center ${
                  aspectStyles[settings.aspectRatio]
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />

                {/* Overlaid Play/Pause button */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                  <button
                    onClick={togglePreview}
                    className="flex items-center gap-2 px-3 py-2 min-h-[40px] bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700/80 shadow-lg backdrop-blur-md transition-all active:scale-95"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Live Animated Preview</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 border border-white/10 text-slate-300">
                    {settings.aspectRatio} · 1080p
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generated Video Player Result */}
          {generatedVideoUrl && (
            <div className="p-4 sm:p-5 bg-indigo-950/40 border border-indigo-800/80 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>MP4 Video Generated Successfully!</span>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                <video
                  src={generatedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={() => {
                  if (generatedBlob) {
                    const filename = `${settings.title.replace(/\s+/g, '_')}_Video.mp4`;
                    triggerFileDownload(generatedBlob, filename);
                  }
                }}
                className="w-full py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video File</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Video Customizer & Export */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display text-base font-semibold text-white">
                Visualizer & Video Styling
              </h3>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                Target Platform / Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9', sub: 'YouTube' },
                  { id: '9:16', label: '9:16', sub: 'Shorts/TikTok' },
                  { id: '1:1', label: '1:1', sub: 'Instagram' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, aspectRatio: item.id as any }))}
                    className={`py-2.5 px-2 min-h-[44px] rounded-lg border text-center transition-all ${
                      settings.aspectRatio === item.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-75">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visualizer Style */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Visualizer Animation Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bars', label: 'Spectrum Bars' },
                  { id: 'wave', label: 'Fluid Wave' },
                  { id: 'vinyl', label: 'Vinyl Disc' },
                  { id: 'orb', label: 'Energy Orb' },
                  { id: 'minimal', label: 'Minimalist' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, visualizerStyle: style.id as any }))}
                    className={`py-2 px-1 min-h-[44px] text-xs font-medium rounded-lg border transition-all text-center flex items-center justify-center ${
                      settings.visualizerStyle === style.id
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Visualizer Background Artwork
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, backgroundImage: bg.url }))}
                    className={`p-1.5 rounded-lg border text-left transition-all ${
                      settings.backgroundImage === bg.url
                        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-950/30'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="h-10 rounded bg-slate-900 overflow-hidden relative">
                      {!bg.url.startsWith('gradient:') ? (
                        <img
                          src={bg.url}
                          alt={bg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            background: bg.url.replace('gradient:', ''),
                          }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium truncate mt-1">
                      {bg.name}
                    </p>
                  </button>
                ))}
              </div>

              {/* Upload Custom Background */}
              <div className="pt-1">
                <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 min-h-[44px] bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer transition-colors active:scale-[0.98]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Background Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setSettings((p) => ({ ...p, backgroundImage: url }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Typography Overlay Settings */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                Text & Metadata Overlay
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Song Title"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={settings.artist}
                  onChange={(e) => setSettings((p) => ({ ...p, artist: e.target.value }))}
                  placeholder="Artist / Channel Name"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={settings.subtext}
                  onChange={(e) => setSettings((p) => ({ ...p, subtext: e.target.value }))}
                  placeholder="Watermark / Subtitle"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Accent Colors</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Primary:</span>
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings((p) => ({ ...p, primaryColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Secondary:</span>
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings((p) => ({ ...p, secondaryColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>

            {/* Export Action */}
            <div className="pt-3">
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !decodedBuffer}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video ({genProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Render & Export MP4 Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Generation Progress Bar */}
            {isGenerating && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span className="truncate pr-2">{genPhase}</span>
                  <span className="font-mono font-bold shrink-0">{genProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
