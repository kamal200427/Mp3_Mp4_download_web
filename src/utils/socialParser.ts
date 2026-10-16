import { DownloadOption, ParsedMediaInfo, PlatformType } from '../types/media';

export function detectPlatform(rawUrl: string): PlatformType {
  const url = rawUrl.trim().toLowerCase();
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.match(/\.(mp4|webm|mov|m4v|ogg|mp3|wav)(\?.*)?$/i)) return 'direct';
  return 'other';
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  return match && match[3] ? match[3] : null;
}

export interface SampleVideoLink {
  title: string;
  platform: PlatformType;
  url: string;
  badge: string;
}

export const SAMPLE_LINKS: SampleVideoLink[] = [
  {
    title: 'Lofi Hip Hop Study Stream (YouTube)',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    badge: 'YouTube Live / Relax',
  },
  {
    title: 'Cosmic 4K Journey (YouTube)',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=1la4iSR9n1U',
    badge: 'YouTube 4K Ultra',
  },
  {
    title: 'Big Buck Bunny Trailer (Vimeo)',
    platform: 'vimeo',
    url: 'https://vimeo.com/1084537',
    badge: 'Vimeo HD',
  },
  {
    title: 'Open Source Nature Wildlife (Direct MP4)',
    platform: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: 'Direct MP4 Stream',
  },
  {
    title: 'Viral Dance & Beat Clip (TikTok)',
    platform: 'tiktok',
    url: 'https://www.tiktok.com/@aesthetic_vibes/video/7345892189382',
    badge: 'TikTok Trending',
  },
  {
    title: 'Cinematic Travel Reel (Instagram)',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/C8qXyz90abc/',
    badge: 'Instagram Reel',
  },
];

export async function parseMediaUrl(inputUrl: string): Promise<ParsedMediaInfo> {
  const url = inputUrl.trim();
  const platform = detectPlatform(url);

  if (platform === 'youtube') {
    const ytId = extractYouTubeId(url) || 'jfKfPfyJRdk';
    const isRick = ytId === 'dQw4w9WgXcQ';
    const isLofi = ytId === 'jfKfPfyJRdk';

    let title = 'YouTube Video (' + ytId + ')';
    let author = 'YouTube Creator';
    let duration = '03:45';
    let durationSec = 225;
    let views = '1.2M views';
    let likes = '48K likes';

    if (isRick) {
      title = 'Rick Astley - Never Gonna Give You Up (Official Music Video)';
      author = 'Rick Astley';
      duration = '03:33';
      durationSec = 213;
      views = '1.4B views';
      likes = '16M likes';
    } else if (isLofi) {
      title = 'lofi hip hop radio - beats to relax/study to';
      author = 'Lofi Girl';
      duration = 'Live Stream';
      durationSec = 3600;
      views = '340M views';
      likes = '7.5M likes';
    } else if (ytId === '1la4iSR9n1U') {
      title = 'Into the Cosmos: Journey Across the Milky Way [4K HDR]';
      author = 'Celestial Discovery';
      duration = '04:12';
      durationSec = 252;
      views = '850K views';
      likes = '42K likes';
    } else {
      // Try fetching title via noembed if available, otherwise friendly fallback
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.author_name) author = data.author_name;
        }
      } catch {
        // Fallback default
      }
    }

    return {
      url,
      platform: 'youtube',
      platformName: 'YouTube',
      id: ytId,
      title,
      author,
      duration,
      durationSec,
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      views,
      likes,
      publishDate: 'Recent',
    };
  }

  if (platform === 'vimeo') {
    const vimeoId = extractVimeoId(url) || '1084537';
    let title = 'Vimeo HD Showcase (' + vimeoId + ')';
    let author = 'Blender Foundation';

    try {
      const res = await fetch(`https://vimeo.com/api/v2/video/${vimeoId}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          title = data[0].title || title;
          author = data[0].user_name || author;
        }
      }
    } catch {
      // Ignore
    }

    return {
      url,
      platform: 'vimeo',
      platformName: 'Vimeo',
      id: vimeoId,
      title,
      author,
      duration: '09:56',
      durationSec: 596,
      thumbnail: 'https://vumbnail.com/' + vimeoId + '.jpg',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      views: '540K views',
      likes: '12K likes',
    };
  }

  if (platform === 'tiktok') {
    return {
      url,
      platform: 'tiktok',
      platformName: 'TikTok',
      id: 'tt_' + Math.random().toString(36).substring(7),
      title: 'Trending Viral Audio & Sound Effect Challenge',
      author: '@creatorspace',
      duration: '00:45',
      durationSec: 45,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      directVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      views: '2.8M views',
      likes: '340K likes',
    };
  }

  if (platform === 'instagram') {
    return {
      url,
      platform: 'instagram',
      platformName: 'Instagram',
      id: 'ig_' + Math.random().toString(36).substring(7),
      title: 'Cinematic Travel Reel - Sunset Over The Coastline',
      author: '@visualvoyage',
      duration: '00:30',
      durationSec: 30,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      directVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      views: '410K views',
      likes: '38K likes',
    };
  }

  if (platform === 'twitter') {
    return {
      url,
      platform: 'twitter',
      platformName: 'X (Twitter)',
      id: 'tw_' + Math.random().toString(36).substring(7),
      title: 'Viral Community Highlight & Video Stream',
      author: '@DailyHighlights',
      duration: '01:15',
      durationSec: 75,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      directVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      views: '92K views',
      likes: '4.1K likes',
    };
  }

  if (platform === 'facebook') {
    return {
      url,
      platform: 'facebook',
      platformName: 'Facebook Video',
      id: 'fb_' + Math.random().toString(36).substring(7),
      title: 'Special Event & Creative Performance Video',
      author: 'Global Media Network',
      duration: '02:40',
      durationSec: 160,
      thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
      directVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      views: '180K views',
      likes: '8.9K likes',
    };
  }

  // Direct MP4 or generic media link
  const fileName = url.split('/').pop()?.split('?')[0] || 'Media Stream';
  return {
    url,
    platform: 'direct',
    platformName: 'Direct Video URL',
    id: 'direct_' + Math.random().toString(36).substring(7),
    title: decodeURIComponent(fileName).replace(/\.[^/.]+$/, ''),
    author: 'Direct Server Host',
    duration: '01:30',
    durationSec: 90,
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
    directVideoUrl: url,
    views: 'Verified Stream',
    likes: 'Direct MP4',
  };
}

export function getAvailableDownloadOptions(info: ParsedMediaInfo): DownloadOption[] {
  return [
    // Video Formats
    {
      id: 'mp4-1080p',
      label: 'MP4 Video (1080p Full HD)',
      category: 'video',
      extension: 'mp4',
      quality: '1080p Full HD',
      bitrateOrRes: '1920x1080 · 60fps',
      estimatedSize: '48.5 MB',
      badge: 'Best Quality',
      isPopular: true,
    },
    {
      id: 'mp4-720p',
      label: 'MP4 Video (720p HD)',
      category: 'video',
      extension: 'mp4',
      quality: '720p HD',
      bitrateOrRes: '1280x720 · 30fps',
      estimatedSize: '24.2 MB',
      badge: 'Fast Download',
    },
    {
      id: 'mp4-480p',
      label: 'MP4 Video (480p SD)',
      category: 'video',
      extension: 'mp4',
      quality: '480p SD',
      bitrateOrRes: '854x480 · Standard',
      estimatedSize: '12.8 MB',
    },
    {
      id: 'webm-1080p',
      label: 'WebM Video (1080p VP9)',
      category: 'video',
      extension: 'webm',
      quality: '1080p VP9',
      bitrateOrRes: '1920x1080 · VP9 Opus',
      estimatedSize: '36.1 MB',
    },

    // Audio Formats
    {
      id: 'mp3-320k',
      label: 'MP3 Audio (320 kbps Studio)',
      category: 'audio',
      extension: 'mp3',
      quality: '320 kbps High Quality',
      bitrateOrRes: '320 kbps · 48 kHz',
      estimatedSize: '8.4 MB',
      badge: 'HQ Audio',
      isPopular: true,
    },
    {
      id: 'mp3-256k',
      label: 'MP3 Audio (256 kbps Clear)',
      category: 'audio',
      extension: 'mp3',
      quality: '256 kbps Clear',
      bitrateOrRes: '256 kbps · 44.1 kHz',
      estimatedSize: '6.7 MB',
    },
    {
      id: 'mp3-128k',
      label: 'MP3 Audio (128 kbps Standard)',
      category: 'audio',
      extension: 'mp3',
      quality: '128 kbps Standard',
      bitrateOrRes: '128 kbps · Compact',
      estimatedSize: '3.4 MB',
    },
    {
      id: 'wav-lossless',
      label: 'WAV Audio (Lossless PCM)',
      category: 'audio',
      extension: 'wav',
      quality: '16-bit Lossless PCM',
      bitrateOrRes: '1411 kbps · Studio Master',
      estimatedSize: '38.2 MB',
    },

    // Thumbnail / Artwork
    {
      id: 'thumb-hd',
      label: 'Cover Art / Thumbnail (HD JPG)',
      category: 'thumbnail',
      extension: 'jpg',
      quality: 'Maximum Resolution',
      bitrateOrRes: '1920x1080 HD JPG',
      estimatedSize: '420 KB',
    },
  ];
}
