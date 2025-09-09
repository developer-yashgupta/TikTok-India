import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

export const videoUtils = {
  // Generate thumbnail from video
  generateThumbnail: async (videoUri, options = {}) => {
    try {
      const {
        time = 0,
        quality = 1,
        compression = 0.7,
        width = 320,
      } = options;

      const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time,
        quality,
      });

      // Compress and resize the thumbnail
      const processedThumbnail = await manipulateAsync(
        thumbnail.uri,
        [{ resize: { width } }],
        { compress: compression, format: 'jpeg' }
      );

      return processedThumbnail.uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  },

  // Get video metadata
  getVideoInfo: async (videoUri) => {
    try {
      const info = await FileSystem.getInfoAsync(videoUri);
      return {
        size: info.size,
        modificationTime: info.modificationTime,
        exists: info.exists,
        isDirectory: info.isDirectory,
        uri: info.uri,
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
    }
  },

  // Format video duration
  formatDuration: (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  // Clean up temporary video files
  cleanupTempFiles: async (files) => {
    try {
      await Promise.all(
        files.map(async (file) => {
          try {
            const fileInfo = await FileSystem.getInfoAsync(file);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(file);
            }
          } catch (error) {
            console.warn(`Error deleting file ${file}:`, error);
          }
        })
      );
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      throw error;
    }
  },

  // Get temporary directory for video processing
  getTempDirectory: async () => {
    const directory = `${FileSystem.cacheDirectory}videos/`;
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    return directory;
  },

  // Generate a unique filename
  generateUniqueFilename: (extension = 'mp4') => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `video_${timestamp}_${random}.${extension}`;
  },

  // Copy video to temp directory
  copyToTemp: async (uri) => {
    try {
      const tempDir = await videoUtils.getTempDirectory();
      const filename = videoUtils.generateUniqueFilename();
      const tempUri = `${tempDir}${filename}`;
      await FileSystem.copyAsync({ from: uri, to: tempUri });
      return tempUri;
    } catch (error) {
      console.error('Error copying to temp:', error);
      throw error;
    }
  },

  // Check if video meets requirements
  validateVideo: async (uri, options = {}) => {
    const {
      maxDuration = 60000, // 60 seconds
      maxSize = 100 * 1024 * 1024, // 100MB
    } = options;

    try {
      const info = await videoUtils.getVideoInfo(uri);
      
      if (info.size > maxSize) {
        throw new Error('Video file size exceeds maximum allowed size');
      }

      // Add more validation as needed

      return true;
    } catch (error) {
      console.error('Error validating video:', error);
      throw error;
    }
  },
};

export default videoUtils;
