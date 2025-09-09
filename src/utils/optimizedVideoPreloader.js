import { Platform } from 'react-native';

class OptimizedVideoPreloader {
  constructor() {
    this.preloadQueue = new Map();
    this.preloadingVideos = new Set();
    this.preloadedVideos = new Map();
    this.maxConcurrentPreloads = 2;
    this.maxCacheSize = 10;
    this.chunkSize = 256 * 1024; // 256KB chunks for faster loading
    this.preloadTimeout = 2000; // 2 second timeout
    
    // Start processing queue
    this.processQueue();
  }

  // Add video to preload queue with priority
  addToQueue(videoUrl, priority = 1, thumbnailUrl = null) {
    if (!videoUrl || this.preloadedVideos.has(videoUrl) || this.preloadingVideos.has(videoUrl)) {
      return;
    }

    this.preloadQueue.set(videoUrl, {
      url: videoUrl,
      thumbnailUrl,
      priority,
      timestamp: Date.now(),
    });

    // Sort queue by priority (higher priority first)
    this.preloadQueue = new Map([...this.preloadQueue.entries()].sort((a, b) => b[1].priority - a[1].priority));
  }

  // Process preload queue
  async processQueue() {
    setInterval(async () => {
      if (this.preloadQueue.size === 0 || this.preloadingVideos.size >= this.maxConcurrentPreloads) {
        return;
      }

      const [videoUrl, item] = this.preloadQueue.entries().next().value;
      if (!item) return;

      this.preloadQueue.delete(videoUrl);
      await this.preloadVideo(item);
    }, 100);
  }

  // Preload individual video
  async preloadVideo(item) {
    const { url, thumbnailUrl, priority } = item;
    
    if (this.preloadingVideos.has(url)) return;
    
    this.preloadingVideos.add(url);

    try {
      // Clean up old cache entries
      await this.cleanupCache();

      // Preload thumbnail first (faster)
      if (thumbnailUrl) {
        try {
          await this.preloadImage(thumbnailUrl);
        } catch (error) {
          console.warn('Thumbnail preload failed:', error);
        }
      }

      // For high priority videos, preload video content
      if (priority >= 3) {
        await this.preloadVideoContent(url);
      }

      // Mark as preloaded
      this.preloadedVideos.set(url, {
        timestamp: Date.now(),
        priority,
        preloaded: true,
      });

    } catch (error) {
      console.warn('Video preload failed:', error);
    } finally {
      this.preloadingVideos.delete(url);
    }
  }

  // Preload video content with optimized approach
  async preloadVideoContent(videoUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.preloadTimeout);

    try {
      // Use HEAD request for faster network check
      const response = await fetch(videoUrl, {
        method: 'HEAD',
        headers: {
          'Range': `bytes=0-${this.chunkSize}`,
          'Cache-Control': 'max-age=3600', // Cache for 1 hour
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Video preload timed out:', videoUrl);
      } else {
        console.warn('Video preload error:', error);
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Preload image/thumbnail
  async preloadImage(imageUrl) {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = imageUrl;
      });
    } else {
      // Use React Native's Image.prefetch for mobile
      const { Image } = require('react-native');
      return Image.prefetch(imageUrl);
    }
  }

  // Clean up old cache entries
  async cleanupCache() {
    if (this.preloadedVideos.size <= this.maxCacheSize) return;

    // Remove oldest entries
    const entries = Array.from(this.preloadedVideos.entries());
    const sortedByAge = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedByAge.slice(0, Math.floor(this.maxCacheSize * 0.3));
    toRemove.forEach(([url]) => {
      this.preloadedVideos.delete(url);
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Check if video is preloaded
  isPreloaded(videoUrl) {
    return this.preloadedVideos.has(videoUrl);
  }

  // Get preload status
  getPreloadStatus(videoUrl) {
    return {
      isPreloaded: this.preloadedVideos.has(videoUrl),
      isPreloading: this.preloadingVideos.has(videoUrl),
      inQueue: this.preloadQueue.has(videoUrl),
    };
  }

  // Clear all caches and queues
  clearAll() {
    this.preloadQueue.clear();
    this.preloadingVideos.clear();
    this.preloadedVideos.clear();
    
    if (global.gc) {
      global.gc();
    }
  }

  // Get cache statistics
  getStats() {
    return {
      queueSize: this.preloadQueue.size,
      preloadingCount: this.preloadingVideos.size,
      cachedCount: this.preloadedVideos.size,
      maxCacheSize: this.maxCacheSize,
    };
  }
}

// Export singleton instance
export default new OptimizedVideoPreloader();
