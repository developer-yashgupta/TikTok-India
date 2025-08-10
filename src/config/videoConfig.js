export const VIDEO_CONFIG = {
  recording: {
    maxDuration: 180, // 3 minutes in seconds
    quality: {
      android: '720p',
      ios: '720p'
    },
    codec: 'h264',
    fileFormat: 'mp4',
    bitrate: 2000000, // 2 Mbps
  },
  validation: {
    maxSize: 100 * 1024 * 1024, // 100MB in bytes
    maxDuration: 180, // 3 minutes in seconds
    supportedFormats: ['mp4', 'mov', 'webm'],
    minDimensions: {
      width: 360,
      height: 640
    },
    maxDimensions: {
      width: 1920,
      height: 1080
    }
  },
  processing: {
    thumbnailTime: 0, // Generate thumbnail from first frame
    compressionQuality: 0.8,
    outputFormat: 'mp4'
  }
};