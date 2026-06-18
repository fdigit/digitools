export interface VideoFormat {
  itag: number;
  qualityLabel: string;
  container: string;
  hasAudio: boolean;
  contentLength: string;
}

export interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  lengthSeconds: string;
  formats: VideoFormat[];
}

export interface DownloadTask {
  id: string;
  url: string;
  videoInfo?: VideoInfo;
  selectedItag?: number;
  progress: number;
  status: 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'error';
  error?: string;
  blobUrl?: string;
}
