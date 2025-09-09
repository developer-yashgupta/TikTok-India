import { videoService } from './videoService';
import VideoManager from '../utils/VideoManager';
import RetryManager from '../utils/RetryManager';
import { theme } from '../config/theme';

class UploadService {
  constructor() {
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.uploadQueue = [];
    this.isProcessing = false;
  }

  async uploadVideo(videoData, options = {}) {
    try {
      const {
        onProgress,
        onRetry,
        generateThumbnail = true,
        compress = true,
      } = options;

      // Validate video
      await this.validateVideo(videoData.videoUri);

      // Process video (compress and generate thumbnail)
      const processedVideo = await VideoManager.processVideo(videoData.videoUri, {
        compress,
        generateThumbnail,
        maxDuration: theme.video.maxDuration,
        quality: theme.video.compression.quality,
      });

      // Prepare upload data
      const uploadData = {
        ...videoData,
        videoUri: processedVideo.videoUri,
        thumbnailUri: processedVideo.thumbnailUri,
        duration: processedVideo.duration,
        dimensions: processedVideo.dimensions,
      };

      // Upload with retry mechanism
      const response = await RetryManager.retryUpload(
        async (progress) => {
          return await videoService.uploadVideo(uploadData, progress);
        },
        {
          onProgress,
          onRetry,
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      // Cleanup temporary files
      await this.cleanup([
        processedVideo.videoUri,
        processedVideo.thumbnailUri,
      ]);

      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  async validateVideo(uri) {
    const info = await VideoManager.getVideoInfo(uri);

    if (!info.exists) {
      throw new Error('Video file does not exist');
    }

    if (info.size > this.maxFileSize) {
      throw new Error(`Video file size (${Math.round(info.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`);
    }

    return true;
  }

  async cleanup(files) {
    try {
      await Promise.all(
        files.map(async (file) => {
          if (file && file.startsWith(FileSystem.cacheDirectory)) {
            await VideoManager.removeFromCache(file);
          }
        })
      );
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }

  // Queue management methods
  addToQueue(videoData, options) {
    return new Promise((resolve, reject) => {
      this.uploadQueue.push({
        videoData,
        options,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.uploadQueue.length === 0) return;

    this.isProcessing = true;
    const { videoData, options, resolve, reject } = this.uploadQueue.shift();

    try {
      const result = await this.uploadVideo(videoData, options);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}

export default new UploadService();
