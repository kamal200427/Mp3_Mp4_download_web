import { VideoAspectRatio, VideoGenerationSettings, VisualizerStyle } from '../types/media';

// Asset backgrounds generated
export const PRESET_BACKGROUNDS = [
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    url: '/src/assets/images/visualizer_cosmic_nebula_1792118528839.jpg',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Skyline',
    url: '/src/assets/images/visualizer_cyber_city_1792118529203.jpg',
  },
  {
    id: 'sunset',
    name: 'Lo-Fi Sunset',
    url: '/src/assets/images/visualizer_lofi_sunset_1792118529357.jpg',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Studio Dark',
    url: 'gradient:linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    url: 'gradient:linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)',
  },
];

export function getResolutionForAspect(aspectRatio: VideoAspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '1:1':
      return { width: 720, height: 720 };
  }
}

/**
 * Draw one frame of the visualizer onto a 2D canvas context
 */
export function drawVisualizerFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  timeData: Uint8Array,
  settings: VideoGenerationSettings,
  bgImgElement: HTMLImageElement | null,
  timeSec: number
) {
  // 1. Draw Background
  if (settings.backgroundImage.startsWith('gradient:')) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (settings.backgroundImage.includes('emerald')) {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#0f172a');
    } else {
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#111827');
      grad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bgImgElement && bgImgElement.complete && bgImgElement.naturalWidth > 0) {
    // Cover fill
    const hRatio = width / bgImgElement.width;
    const vRatio = height / bgImgElement.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImgElement.width * ratio) / 2;
    const centerShiftY = (height - bgImgElement.height * ratio) / 2;
    ctx.drawImage(
      bgImgElement,
      0,
      0,
      bgImgElement.width,
      bgImgElement.height,
      centerShiftX,
      centerShiftY,
      bgImgElement.width * ratio,
      bgImgElement.height * ratio
    );
    // Darkening scrim overlay for contrast
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  }

  // Calculate average audio energy
  let totalEnergy = 0;
  for (let i = 0; i < 32; i++) {
    totalEnergy += freqData[i] || 0;
  }
  const avgEnergy = totalEnergy / 32 / 255; // 0 to 1

  // 2. Render selected visualizer style
  switch (settings.visualizerStyle) {
    case 'bars': {
      const numBars = settings.aspectRatio === '9:16' ? 36 : 64;
      const barWidth = (width * 0.8) / numBars;
      const startX = width * 0.1;
      const centerY = height * 0.65;
      const maxHeight = height * 0.35;

      ctx.save();
      for (let i = 0; i < numBars; i++) {
        const dataIdx = Math.floor((i / numBars) * freqData.length * 0.7);
        const val = (freqData[dataIdx] || 0) / 255;
        const barHeight = Math.max(4, val * maxHeight);

        const x = startX + i * barWidth;
        const y = centerY - barHeight / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, settings.primaryColor || '#6366f1');
        grad.addColorStop(1, settings.secondaryColor || '#a855f7');

        ctx.fillStyle = grad;
        ctx.shadowColor = settings.primaryColor || '#6366f1';
        ctx.shadowBlur = 8 * val;

        // Rounded bar
        const radius = barWidth * 0.35;
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, barHeight, radius);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'wave': {
      const centerY = height * 0.62;
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = settings.primaryColor || '#38bdf8';
      ctx.shadowColor = settings.primaryColor || '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = centerY + (v - 1) * (height * 0.22);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Mirror harmonic reflection
      ctx.lineWidth = 2;
      ctx.strokeStyle = settings.secondaryColor || '#ec4899';
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = centerY - (v - 1) * (height * 0.14);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'vinyl': {
      const centerX = width / 2;
      const centerY = height * 0.48;
      const radius = Math.min(width, height) * 0.28;
      const spinAngle = timeSec * 1.8;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(spinAngle);

      // Vinyl outer body
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0c';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 24;
      ctx.fill();

      // Grooves
      for (let r = radius * 0.55; r < radius * 0.95; r += 7) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Center label
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
      const labelGrad = ctx.createLinearGradient(-radius * 0.38, -radius * 0.38, radius * 0.38, radius * 0.38);
      labelGrad.addColorStop(0, settings.primaryColor || '#6366f1');
      labelGrad.addColorStop(1, settings.secondaryColor || '#ec4899');
      ctx.fillStyle = labelGrad;
      ctx.fill();

      // Center spindle hole
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      ctx.restore();
      break;
    }

    case 'orb': {
      const centerX = width / 2;
      const centerY = height * 0.52;
      const baseRadius = Math.min(width, height) * 0.16;
      const pulseRadius = baseRadius + avgEnergy * 45;

      ctx.save();
      const orbGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, pulseRadius);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, settings.primaryColor || '#38bdf8');
      orbGrad.addColorStop(0.7, settings.secondaryColor || '#6366f1');
      orbGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Surrounding particle rings
      const rings = 24;
      for (let i = 0; i < rings; i++) {
        const angle = (i / rings) * Math.PI * 2 + timeSec * 0.8;
        const ringDist = pulseRadius + 20 + Math.sin(timeSec * 2 + i) * 12;
        const px = centerX + Math.cos(angle) * ringDist;
        const py = centerY + Math.sin(angle) * ringDist;

        ctx.fillStyle = settings.secondaryColor || '#a855f7';
        ctx.beginPath();
        ctx.arc(px, py, 3 + avgEnergy * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'particles':
    case 'minimal':
    default: {
      // Sleek clean bottom spectrum wave
      const numLines = 48;
      const slice = width / numLines;
      const baseY = height * 0.72;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < numLines; i++) {
        const val = (freqData[i * 2] || 0) / 255;
        const h = val * (height * 0.25) + 6;
        const x = i * slice + slice / 2;

        ctx.strokeStyle = i % 2 === 0 ? (settings.primaryColor || '#6366f1') : (settings.secondaryColor || '#38bdf8');
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - h);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
  }

  // 3. Render Typography & Song Info Overlay
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = settings.visualizerStyle === 'vinyl' ? height * 0.82 : height * 0.22;

  // Title
  const titleSize = Math.max(22, Math.floor(width * 0.04));
  ctx.font = `bold ${titleSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText(settings.title || 'Untitled Track', width / 2, textY);

  // Artist
  const artistSize = Math.max(14, Math.floor(width * 0.024));
  ctx.font = `500 ${artistSize}px 'Outfit', system-ui, sans-serif`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(settings.artist || 'Unknown Artist', width / 2, textY + titleSize * 1.1);

  // Subtext / Watermark at bottom
  if (settings.subtext) {
    ctx.font = `400 12px 'Outfit', system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(settings.subtext, width / 2, height - 24);
  }

  ctx.restore();
}

/**
 * Encodes audio + canvas visualizer into real playable video file using MediaRecorder
 */
export async function generateMp4VideoFromAudio(
  audioBuffer: AudioBuffer,
  settings: VideoGenerationSettings,
  onProgress?: (percent: number, phase: string) => void
): Promise<{ videoBlob: Blob; downloadUrl: string }> {
  const { width, height } = getResolutionForAspect(settings.aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pre-load background image if not a gradient
  let bgImgElement: HTMLImageElement | null = null;
  if (!settings.backgroundImage.startsWith('gradient:')) {
    bgImgElement = new Image();
    bgImgElement.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      bgImgElement!.onload = resolve;
      bgImgElement!.onerror = resolve; // Continue even if load fails
      bgImgElement!.src = settings.backgroundImage;
    });
  }

  // Setup Web Audio playback & analysis pipeline
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  const timeData = new Uint8Array(analyser.frequencyBinCount);

  // Audio Destination for MediaRecorder
  const audioDest = audioCtx.createMediaStreamDestination();
  source.connect(analyser);
  analyser.connect(audioDest);
  // Also keep muted in speakers during recording to avoid feedback
  // source.connect(audioCtx.destination); // intentionally omitted or muted

  // Canvas Stream
  const canvasStream = canvas.captureStream(settings.fps || 30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  // Determine supported mime type
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];
  let selectedMime = 'video/webm';
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      break;
    }
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 3_500_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    const totalDuration = audioBuffer.duration;
    let startTime = 0;
    let animFrameId: number;

    recorder.onstop = () => {
      cancelAnimationFrame(animFrameId);
      audioCtx.close();
      const videoBlob = new Blob(recordedChunks, { type: selectedMime });
      const downloadUrl = URL.createObjectURL(videoBlob);
      if (onProgress) onProgress(100, 'Complete');
      resolve({ videoBlob, downloadUrl });
    };

    recorder.onerror = (err) => {
      cancelAnimationFrame(animFrameId);
      audioCtx.close();
      reject(err);
    };

    recorder.start(250);
    source.start(0);
    startTime = performance.now();

    function renderLoop() {
      const elapsed = (performance.now() - startTime) / 1000;
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      drawVisualizerFrame(ctx, width, height, freqData, timeData, settings, bgImgElement, elapsed);

      const percent = Math.min(99, Math.floor((elapsed / totalDuration) * 100));
      if (onProgress) {
        onProgress(percent, `Rendering frame (${Math.floor(elapsed)}s / ${Math.floor(totalDuration)}s)`);
      }

      if (elapsed < totalDuration && recorder.state === 'recording') {
        animFrameId = requestAnimationFrame(renderLoop);
      } else {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    }

    renderLoop();
  });
}
