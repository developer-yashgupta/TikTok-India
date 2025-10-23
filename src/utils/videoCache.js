import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class VideoCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB (reduced for memory safety)
    this.currentCacheSize = 0;
    this.maxEntries = 20; // Limit number of cache entries
  }

  // Cache video metadata
  async cacheVideoMetadata(videoId, metadata) {
    try {
      // Clean up if we're at the limit
      if (this.cache.size >= this.maxEntries) {
        await this.cleanupOldEntries();
      }

      const cacheKey = `video_metadata_${videoId}`;
      const cacheData = {
        ...metadata,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      this.cache.set(videoId, cacheData);

      return true;
    } catch (error) {
      console.error('Error caching video metadata:', error);
      return false;
    }
  }

  // Get cached video metadata
  async getCachedVideoMetadata(videoId) {
    try {
      // Check memory cache first
      if (this.cache.has(videoId)) {
        const cached = this.cache.get(videoId);
        if (cached.expiresAt > Date.now()) {
          return cached;
        } else {
          this.cache.delete(videoId);
        }
      }

      // Check persistent storage
      const cacheKey = `video_metadata_${videoId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.expiresAt > Date.now()) {
          this.cache.set(videoId, parsed);
          return parsed;
        } else {
          await AsyncStorage.removeItem(cacheKey);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached video metadata:', error);
      return null;
    }
  }

  // Cache video thumbnail
  async cacheVideoThumbnail(videoId, thumbnailUri) {
    try {
      const cacheKey = `video_thumbnail_${videoId}`;
      const cacheData = {
        uri: thumbnailUri,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error caching video thumbnail:', error);
      return false;
    }
  }

  // Get cached video thumbnail
  async getCachedVideoThumbnail(videoId) {
    try {
      const cacheKey = `video_thumbnail_${videoId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.expiresAt > Date.now()) {
          return parsed.uri;
        } else {
          await AsyncStorage.removeItem(cacheKey);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached video thumbnail:', error);
      return null;
    }
  }

  // Cache user preferences for video quality
  async cacheUserQualityPreference(quality) {
    try {
      await AsyncStorage.setItem('user_video_quality_preference', quality);
    } catch (error) {
      console.error('Error caching user quality preference:', error);
    }
  }

  // Get cached user quality preference
  async getUserQualityPreference() {
    try {
      return await AsyncStorage.getItem('user_video_quality_preference');
    } catch (error) {
      console.error('Error getting user quality preference:', error);
      return null;
    }
  }

  // Clean up old entries when at capacity limit
  async cleanupOldEntries() {
    try {
      const entries = Array.from(this.cache.entries());
      // Sort by cachedAt time (oldest first)
      entries.sort(([,a], [,b]) => a.cachedAt - b.cachedAt);

      // Remove oldest 50% of entries
      const toRemove = Math.ceil(entries.length * 0.5);
      for (let i = 0; i < toRemove; i++) {
        const [videoId] = entries[i];
        const cacheKey = `video_metadata_${videoId}`;
        await AsyncStorage.removeItem(cacheKey);
        this.cache.delete(videoId);
      }
    } catch (error) {
      console.error('Error cleaning up old cache entries:', error);
    }
  }

  // Clear expired cache entries
  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('video_'));

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
            await AsyncStorage.removeItem(key);
            // Also remove from memory cache if it exists
            const videoId = key.replace('video_metadata_', '');
            this.cache.delete(videoId);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('video_'));

      let totalSize = 0;
      let metadataCount = 0;
      let thumbnailCount = 0;

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          if (key.includes('metadata')) metadataCount++;
          if (key.includes('thumbnail')) thumbnailCount++;
        }
      }

      return {
        totalEntries: cacheKeys.length,
        metadataCount,
        thumbnailCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Clear all cache
  async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('video_'));
      await AsyncStorage.multiRemove(cacheKeys);
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all cache:', error);
      return false;
    }
  }
}

// Singleton instance
const videoCache = new VideoCache();

// Clear expired cache every 2 hours
setInterval(() => {
  videoCache.clearExpiredCache();
}, 2 * 60 * 60 * 1000);

export default videoCache;
export { VideoCache };