import api from '../config/api';
import { Platform } from 'react-native';

class VideoService {
  async getFeed(page = 1, limit = 10, type = 'for-you', sharedVideoId = null) {
    try {
      console.log('Fetching feed:', { page, limit, type, sharedVideoId });
      
      const params = {
        page,
        limit,
        type,
        ...(sharedVideoId && { sharedVideoId })
      };

      const response = await api.get('/videos/feed', { params });
      console.log('Feed response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  }

  async searchVideos(query, page = 1, limit = 20) {
    try {
      const response = await api.get('/videos/search', {
        params: { query, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  async toggleLike(videoId) {
    try {
      console.log('Toggling like for video:', videoId);
      const response = await api.put(`/videos/${videoId}/like`);
      
      console.log('Like response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle like');
      }

      return {
        success: true,
        likesCount: response.data.likesCount,
        isLiked: response.data.isLiked
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  }

  async getComments(videoId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/videos/${videoId}/comments`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async addComment(videoId, content) {
    try {
      const response = await api.post(`/videos/${videoId}/comments`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getVideoDetails(videoId) {
    try {
      const response = await api.get(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video details:', error);
      throw error;
    }
  }

  async getVideoById(videoId) {
    try {
      console.log('Fetching video by ID:', videoId);
      const response = await api.get(`/videos/${videoId}`);
      console.log('Video response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  async updateVideo(videoId, updates) {
    try {
      const response = await api.put(`/videos/${videoId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  async deleteVideo(videoId) {
    try {
      await api.delete(`/videos/${videoId}`);
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async getTrending(category = '', page = 1, limit = 20) {
    try {
      const response = await api.get('/videos/trending', {
        params: { category, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw error;
    }
  }

  async getByHashtag(hashtag, page = 1, limit = 20) {
    try {
      const response = await api.get(`/videos/hashtag/${hashtag}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos by hashtag:', error);
      throw error;
    }
  }

  async uploadVideo(videoData, onProgress) {
    try {
      console.log('Starting video upload with data:', {
        hasVideoFile: !!videoData.videoFile,
        videoUri: !!videoData.videoUri,
        isWeb: Platform.OS === 'web',
        metadata: {
          description: !!videoData.description,
          hashtags: !!videoData.hashtags,
          location: !!videoData.location,
          duration: videoData.duration,
          dimensions: videoData.dimensions,
        }
      });

      // Create FormData instance
      const formData = new FormData();

      // Handle video file based on platform
      if (Platform.OS === 'web') {
        // Web platform handling
        if (!(videoData.videoFile instanceof File || videoData.videoFile instanceof Blob)) {
          console.error('Invalid video file:', videoData.videoFile);
          throw new Error('Invalid video file format');
        }
        formData.append('video', videoData.videoFile);
      } else {
        // Native platform handling - Match the web FormData structure
        formData.append('video', {
          uri: videoData.videoUri,
          type: 'video/mp4',
          name: 'video.mp4',
        });
      }

      // Append metadata
      if (videoData.description) {
        formData.append('description', videoData.description);
      }

      formData.append('isPrivate', String(videoData.isPrivate || false));
      formData.append('duration', String(videoData.duration || 0));

      if (videoData.hashtags?.length > 0) {
        formData.append('hashtags', JSON.stringify(videoData.hashtags));
      }

      if (videoData.location) {
        formData.append('location', JSON.stringify(videoData.location));
      }

      if (videoData.dimensions) {
        formData.append('dimensions', JSON.stringify(videoData.dimensions));
      }

      // Configure request
      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
            console.log('Upload progress:', percentCompleted + '%');
          }
        },
        timeout: 300000, // 5 minutes
      };

      // Make the request
      const response = await api.post('/videos/upload', formData, config);

      console.log('Upload response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload video');
      }

      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

export const videoService = new VideoService();