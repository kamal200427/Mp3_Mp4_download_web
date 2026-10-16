export type PlatformType =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'vimeo'
  | 'direct'
  | 'other';

export interface ParsedMediaInfo {
  url: string;
  platform: PlatformType;
  platformName: string;
  id: string;
  title: string;
  author: string;
  duration: string;
  durationSec: number;
  thumbnail: string;
  embedUrl?: string;
  directVideoUrl?: string;
  views?: string;
  likes?: string;
  publishDate?: string;
}

export type DownloadFormatCategory = 'video' | 'audio' | 'thumbnail';

export interface DownloadOption {
  id: string;
  label: string;
  category: DownloadFormatCategory;
  extension: 'mp4' | 'webm' | 'mp3' | 'wav' | 'jpg';
  quality: string;
  bitrateOrRes: string;
  estimatedSize: string;
  badge?: string;
  isPopular?: boolean;
}

export interface AudioConversionSettings {
  format: 'mp3' | 'wav';
  bitrate: 128 | 192 | 256 | 320;
  sampleRate: 44100 | 48000;
  volumeBoost: number; // 1 = 100%, 1.5 = 150%, 2 = 200%
  fadeIn: boolean;
  fadeOut: boolean;
  trimStart: number;
  trimEnd: number;
}

export type VisualizerStyle =
  | 'bars'
  | 'wave'
  | 'vinyl'
  | 'orb'
  | 'particles'
  | 'minimal';

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoGenerationSettings {
  aspectRatio: VideoAspectRatio;
  visualizerStyle: VisualizerStyle;
  backgroundImage: string;
  primaryColor: string;
  secondaryColor: string;
  title: string;
  artist: string;
  subtext: string;
  showWaveform: boolean;
  fps: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  type: 'download' | 'mp4-to-mp3' | 'mp3-to-mp4';
  platform?: PlatformType;
  format: string;
  quality: string;
  timestamp: number;
  fileSize?: string;
  downloadUrl?: string;
  thumbnail?: string;
}
