import { Platform } from 'react-native';
import Video from 'react-native-video';
import { getDeviceSpecificConfig } from './deviceUtils';

class VideoPreloader {
  constructor() {
    this.preloadedVideos = new Map();
    this.preloadingQueue = [];
    this.maxConcurrentPreloads = 1; // Reduced to prevent memory issues
    this.activePreloads = 0;
    this.maxPreloadedVideos = 3; // Limit number of preloaded videos
  }

  // Preload a video with low quality for faster loading
  async preloadVideo(videoUri, quality = 'low') {
    if (this.preloadedVideos.has(videoUri)) {
      return this.preloadedVideos.get(videoUri);
    }

    // Clean up old preloaded videos if we're at the limit
    if (this.preloadedVideos.size >= this.maxPreloadedVideos) {
      this.cleanupOldPreloads();
    }

    if (this.activePreloads >= this.maxConcurrentPreloads) {
      // Add to queue if too many active preloads
      this.preloadingQueue.push({ uri: videoUri, quality });
      return;
    }

    try {
      this.activePreloads++;

      return new Promise((resolve, reject) => {
        // For React Native, we preload by loading metadata
        const videoRef = { current: null };

        const handleLoad = (data) => {
          this.preloadedVideos.set(videoUri, {
            loaded: true,
            duration: data.duration,
            timestamp: Date.now(),
            size: data.naturalSize
          });
          this.activePreloads--;
          this.processQueue();
          resolve(data);
        };

        const handleError = (error) => {
          this.activePreloads--;
          this.processQueue();
          reject(error);
        };

        // Simulate preloading by creating a temporary Video component
        // In practice, this would be handled by the Video component's preload prop
        this.preloadedVideos.set(videoUri, {
          preloading: true,
          timestamp: Date.now()
        });

        // For React Native Video, preloading happens automatically when preload="metadata"
        // We'll just mark it as preloaded after a short delay
        setTimeout(() => {
          if (this.preloadedVideos.has(videoUri) && this.preloadedVideos.get(videoUri).preloading) {
            this.preloadedVideos.set(videoUri, {
              loaded: true,
              timestamp: Date.now()
            });
            this.activePreloads--;
            this.processQueue();
            resolve({ preloaded: true });
          }
        }, 2000);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.preloadedVideos.has(videoUri) && this.preloadedVideos.get(videoUri).preloading) {
            this.preloadedVideos.delete(videoUri);
            this.activePreloads--;
            this.processQueue();
            reject(new Error('Preload timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      this.activePreloads--;
      this.processQueue();
      throw error;
    }
  }

  // Process queued preloads
  processQueue() {
    if (this.preloadingQueue.length > 0 && this.activePreloads < this.maxConcurrentPreloads) {
      const next = this.preloadingQueue.shift();
      this.preloadVideo(next.uri, next.quality);
    }
  }

  // Get preloaded video element
  getPreloadedVideo(videoUri) {
    return this.preloadedVideos.get(videoUri);
  }

  // Clean up old preloaded videos (older than 2 minutes)
  cleanup() {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes

    for (const [uri, data] of this.preloadedVideos) {
      if (now - data.timestamp > maxAge) {
        if (data.element && data.element.parentNode) {
          data.element.parentNode.removeChild(data.element);
        }
        this.preloadedVideos.delete(uri);
      }
    }
  }

  // Clean up old preloads when at capacity limit
  cleanupOldPreloads() {
    const entries = Array.from(this.preloadedVideos.entries());
    // Sort by timestamp (oldest first)
    entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);

    // Remove oldest 50% of preloaded videos
    const toRemove = Math.ceil(entries.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      const [uri, data] = entries[i];
      if (data.element && data.element.parentNode) {
        data.element.parentNode.removeChild(data.element);
      }
      this.preloadedVideos.delete(uri);
    }
  }

  // Preload videos that are likely to be viewed next
  async preloadNextVideos(videoList, currentIndex) {
    const deviceConfig = await getDeviceSpecificConfig();

    if (!deviceConfig.preloadNextVideo) {
      return;
    }

    // Preload next 2 videos
    const preloadCount = Math.min(2, videoList.length - currentIndex - 1);

    for (let i = 1; i <= preloadCount; i++) {
      const nextVideo = videoList[currentIndex + i];
      if (nextVideo && nextVideo.uri) {
        this.preloadVideo(nextVideo.uri);
      }
    }
  }
}

// Singleton instance
const videoPreloader = new VideoPreloader();

// Clean up every 30 seconds
setInterval(() => {
  videoPreloader.cleanup();
}, 30 * 1000);

// Memory monitoring and cleanup
const monitorMemoryUsage = () => {
  // Force garbage collection if available (development only)
  if (__DEV__ && global.gc) {
    global.gc();
  }

  // Clean up preloaded videos if memory is low
  // This is a simple heuristic - in production you might want more sophisticated monitoring
  videoPreloader.cleanup();
};

// Monitor memory every 30 seconds
setInterval(monitorMemoryUsage, 30 * 1000);

export default videoPreloader;
export { VideoPreloader };