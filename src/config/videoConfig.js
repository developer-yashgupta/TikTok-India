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
<<<<<<< HEAD
=======
  adaptiveBitrate: {
    qualities: [
      { resolution: '360p', bitrate: 800000, width: 640, height: 360 },
      { resolution: '480p', bitrate: 1200000, width: 854, height: 480 },
      { resolution: '720p', bitrate: 2500000, width: 1280, height: 720 },
      { resolution: '1080p', bitrate: 4500000, width: 1920, height: 1080 }
    ],
    defaultQuality: '720p',
    minQuality: '360p',
    maxQuality: '1080p'
  },
>>>>>>> master
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
<<<<<<< HEAD
    outputFormat: 'mp4'
=======
    outputFormat: 'mp4',
    keyframeInterval: 2, // GOP size in seconds for better seeking
    audioBitrate: 128000, // 128kbps audio bitrate
    audioSampleRate: 44100,
    twoPassEncoding: true, // Enable two-pass encoding for better quality
    preset: 'medium', // Encoding speed preset (ultrafast, fast, medium, slow)
    profile: 'main', // H.264 profile
    level: '3.1' // H.264 level
  },
  optimization: {
    enableHardwareAcceleration: true,
    maxConcurrentEncodings: 2,
    tempDirectory: './temp',
    cleanupTempFiles: true,
    enableProgressCallback: true
>>>>>>> master
  }
};