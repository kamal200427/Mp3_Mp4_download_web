import { Mp3Encoder } from '@breezystack/lamejs';
import { AudioConversionSettings } from '../types/media';

/**
 * Decodes audio data from a File or ArrayBuffer using browser AudioContext
 */
export async function decodeAudioFromFile(file: File | Blob): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close();
    }
  }
}

/**
 * Extracts normalized peak values (0 to 1) for rendering audio waveforms
 */
export function extractWaveformData(buffer: AudioBuffer, numPoints: number = 100): number[] {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numPoints);
  const peaks: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const start = i * step;
    let max = 0;
    for (let j = 0; j < step; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(Math.min(1, Math.max(0.05, max)));
  }

  return peaks;
}

/**
 * Process audio with trimming, gain boost, and fade envelopes
 */
export function processAudioBuffer(
  sourceBuffer: AudioBuffer,
  settings: AudioConversionSettings
): AudioBuffer {
  const sampleRate = settings.sampleRate;
  const startSample = Math.max(0, Math.floor(settings.trimStart * sourceBuffer.sampleRate));
  const endSample = Math.min(
    sourceBuffer.length,
    Math.floor((settings.trimEnd || sourceBuffer.duration) * sourceBuffer.sampleRate)
  );
  const slicedLength = Math.max(1, endSample - startSample);

  // Create an offline context with target sample rate
  const channels = Math.min(2, sourceBuffer.numberOfChannels);
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioContextClass({ sampleRate });
  const processedBuffer = tempCtx.createBuffer(channels, Math.floor((slicedLength * sampleRate) / sourceBuffer.sampleRate), sampleRate);
  tempCtx.close();

  const gain = settings.volumeBoost || 1.0;
  const fadeDurationSamples = Math.floor(sampleRate * 1.5); // 1.5 sec fade

  for (let ch = 0; ch < channels; ch++) {
    const srcData = sourceBuffer.getChannelData(ch);
    const destData = processedBuffer.getChannelData(ch);
    const ratio = sourceBuffer.sampleRate / sampleRate;

    for (let i = 0; i < processedBuffer.length; i++) {
      const srcIdx = startSample + Math.floor(i * ratio);
      let sample = (srcData[srcIdx] || 0) * gain;

      // Apply Fade In
      if (settings.fadeIn && i < fadeDurationSamples) {
        sample *= (i / fadeDurationSamples);
      }

      // Apply Fade Out
      if (settings.fadeOut && i > (processedBuffer.length - fadeDurationSamples)) {
        const remaining = processedBuffer.length - i;
        sample *= Math.max(0, remaining / fadeDurationSamples);
      }

      destData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  return processedBuffer;
}

/**
 * Encodes AudioBuffer into MP3 Blob using lamejs with progress reporting
 */
export async function encodeToMp3(
  audioBuffer: AudioBuffer,
  bitrate: number = 320,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, bitrate);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  // Convert Float32Array [-1, 1] to Int16Array [-32768, 32767]
  const sampleBlockSize = 1152;
  const totalSamples = leftChannel.length;

  const leftInt16 = new Int16Array(sampleBlockSize);
  const rightInt16 = new Int16Array(sampleBlockSize);

  let processed = 0;

  while (processed < totalSamples) {
    const chunkSamples = Math.min(sampleBlockSize, totalSamples - processed);

    for (let i = 0; i < chunkSamples; i++) {
      const idx = processed + i;
      const leftVal = leftChannel[idx];
      leftInt16[i] = leftVal < 0 ? leftVal * 32768 : leftVal * 32767;

      const rightVal = rightChannel[idx];
      rightInt16[i] = rightVal < 0 ? rightVal * 32768 : rightVal * 32767;
    }

    let mp3buf: Int8Array | Uint8Array;
    if (channels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftInt16.subarray(0, chunkSamples));
    } else {
      mp3buf = mp3encoder.encodeBuffer(
        leftInt16.subarray(0, chunkSamples),
        rightInt16.subarray(0, chunkSamples)
      );
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    processed += chunkSamples;

    if (onProgress && processed % (sampleBlockSize * 10) === 0) {
      onProgress(Math.floor((processed / totalSamples) * 90));
      // Allow UI thread to breathe
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  if (onProgress) onProgress(100);

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Encodes AudioBuffer into Lossless 16-bit PCM WAV Blob
 */
export function encodeToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const left = audioBuffer.getChannelData(0);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1) : null;
  const length = left.length * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const lVal = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, lVal < 0 ? lVal * 32768 : lVal * 32767, true);
    offset += 2;

    if (right) {
      const rVal = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, rVal < 0 ? rVal * 32768 : rVal * 32767, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Generates an aesthetic demo audio buffer (warm synth chord progression)
 * Allows users to test right out of the box without picking a file!
 */
export function generateDemoAudioBuffer(durationSec: number = 8): AudioBuffer {
  const sampleRate = 44100;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextClass({ sampleRate });
  const buffer = ctx.createBuffer(2, sampleRate * durationSec, sampleRate);
  ctx.close();

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Ambient chord notes: Cmaj9 / Am9 progression (C3, E3, G3, B3, D4)
  const chords = [
    [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
    [110.00, 146.83, 174.61, 220.00, 261.63], // Am9
    [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
    [98.00, 130.81, 164.81, 196.00, 246.94],  // G7sus
  ];

  const chordDuration = durationSec / chords.length;

  for (let i = 0; i < left.length; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const localT = t % chordDuration;
    const env = Math.sin((localT / chordDuration) * Math.PI); // smooth swell

    let sampleL = 0;
    let sampleR = 0;

    chord.forEach((freq, idx) => {
      // Gentle sine + warm overtone
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.12 + Math.sin(2 * Math.PI * (freq * 2) * t) * 0.04;
      const pan = (idx / chord.length) * 0.4 - 0.2; // slight stereo spread
      sampleL += tone * (0.5 - pan);
      sampleR += tone * (0.5 + pan);
    });

    // Subtle beat kick on quarter notes
    const beatTime = t % 0.5;
    const kick = beatTime < 0.08 ? Math.sin(2 * Math.PI * 60 * (1 - beatTime / 0.08) * beatTime) * (1 - beatTime / 0.08) * 0.25 : 0;

    left[i] = Math.max(-1, Math.min(1, (sampleL * env) + kick));
    right[i] = Math.max(-1, Math.min(1, (sampleR * env) + kick));
  }

  return buffer;
}
