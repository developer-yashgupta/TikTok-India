import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { theme } from '../config/theme';

class VideoManager {
  constructor() {
    this.tempDirectory = null;
    this.maxRetries = 3;
    this.videoCache = new Map();
    this.cleanupInterval = 1800000; // 30 minutes
    this.maxCacheSize = 500 * 1024 * 1024; // 500MB
    this.currentCacheSize = 0;
    
    this.initializeCache();
  }

  async initializeCache() {
    try {
      this.tempDirectory = `${FileSystem.cacheDirectory}videos/`;
      const dirInfo = await FileSystem.getInfoAsync(this.tempDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.tempDirectory, { intermediates: true });
      }
      
      // Start cleanup interval
      setInterval(() => this.cleanupCache(), this.cleanupInterval);
    } catch (error) {
      console.error('Error initializing video cache:', error);
    }
  }

  async processVideo(uri, options = {}) {
    try {
      const {
        compress = true,
        generateThumbnail = true,
        maxDuration = theme.video.maxDuration,
        quality = theme.video.compression.quality,
      } = options;

      // Validate video duration
      const videoInfo = await this.getVideoInfo(uri);
      if (videoInfo.duration > maxDuration) {
        throw new Error(`Video duration exceeds maximum limit of ${maxDuration} seconds`);
      }

      let processedUri = uri;
      if (compress) {
        processedUri = await this.compressVideo(uri, quality);
      }

      let thumbnailUri = null;
      if (generateThumbnail) {
        thumbnailUri = await this.generateThumbnail(processedUri);
      }

      return {
        videoUri: processedUri,
        thumbnailUri,
        ...videoInfo,
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw error;
    }
  }

  async compressVideo(uri, quality = 0.8) {
    // Implementation will depend on the video compression library used
    // For now, we'll return the original URI
    return uri;
  }

  async generateThumbnail(videoUri) {
    try {
      const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.7,
      });

      const processed = await ImageManipulator.manipulateAsync(
        thumbnail.uri,
        [
          {
            resize: {
              width: theme.video.thumbnailSize.width,
              height: theme.video.thumbnailSize.height,
            },
          },
        ],
        { compress: 0.8, format: 'jpeg' }
      );

      return processed.uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  async getVideoInfo(uri) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return {
        size: info.size,
        exists: info.exists,
        uri: info.uri,
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
    }
  }

  async saveToCache(uri, metadata = {}) {
    try {
      const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`;
      const cachedUri = `${this.tempDirectory}${filename}`;

      await FileSystem.copyAsync({
        from: uri,
        to: cachedUri,
      });

      const info = await this.getVideoInfo(cachedUri);
      this.videoCache.set(cachedUri, {
        ...metadata,
        timestamp: Date.now(),
        size: info.size,
      });

      this.currentCacheSize += info.size;
      await this.maintainCacheSize();

      return cachedUri;
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw error;
    }
  }

  async maintainCacheSize() {
    if (this.currentCacheSize <= this.maxCacheSize) return;

    const entries = Array.from(this.videoCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [uri, info] of entries) {
      if (this.currentCacheSize <= this.maxCacheSize) break;

      await this.removeFromCache(uri);
      this.currentCacheSize -= info.size;
    }
  }

  async removeFromCache(uri) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      this.videoCache.delete(uri);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  async cleanupCache() {
    const now = Date.now();
    const entries = Array.from(this.videoCache.entries());

    for (const [uri, info] of entries) {
      if (now - info.timestamp > this.cleanupInterval) {
        await this.removeFromCache(uri);
      }
    }
  }

  async saveToGallery(uri) {
    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      return asset;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      throw error;
    }
  }

  getVideoDimensions(width, height) {
    const maxWidth = 1080;
    const maxHeight = 1920;
    
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
    };
  }
}

export default new VideoManager();

export const optimizeVideoForUpload = async (videoUri) => {
  // Add video compression logic here
  // You can use react-native-video-processing or similar libraries
  return compressedVideoUri;
};

