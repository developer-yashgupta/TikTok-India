import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Use consistent API URL across the app
export const API_URL = Platform.select({
  web: 'http://localhost:5000',
  android: 'http://172.20.52.66:5000', // Android emulator localhost
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000'
});

export const BASE_URL = `${API_URL}/api`;
export const TOKEN_KEY = '@auth_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes for video uploads
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Request interceptor with better error handling
api.interceptors.request.use(
  async (config) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Get token from storage
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers['x-auth-token'] = token;
      }

      // Handle FormData properly
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
        // Prevent axios from trying to transform FormData
        config.transformRequest = [(data) => data];
      }

      return config;
    } catch (error) {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        // You might want to trigger a logout action here
      }
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response Error:', error.request);
    } else {
      // Error in request setup
      console.error('API Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
const auth = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      // Clear all auth related storage
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        '@user_data',
        '@user_preferences'
      ]);
      // Clear axios default header
      delete api.defaults.headers.common['x-auth-token'];
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    return await api.get('/auth/me');
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data.valid;
    } catch (error) {
      return false;
    }
  },

  updateProfile: async (updates) => {
    return await api.put('/auth/profile', updates);
  },

  updateAvatar: async (formData) => {
    return await api.post('/users/avatar', formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(data) => data],
    });
  }
};

// Video endpoints
const videos = {
  getFeed: (page = 1, limit = 10) => api.get(`/videos/feed?page=${page}&limit=${limit}`),
  getUserVideos: (userId = '', options = { page: 1, limit: 15 }) => 
    api.get(`/videos/user${userId ? `/${userId}` : ''}`, { params: options }),
  getVideo: (videoId) => api.get(`/videos/${videoId}`),
  
  uploadVideo: async (videoData, onProgress) => {
    const formData = new FormData();
    
    // Append video file
    formData.append('video', {
      uri: videoData.videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    // Required fields
    formData.append('description', videoData.description || '');
    formData.append('isPrivate', videoData.isPrivate || false);
    formData.append('duration', videoData.duration || 0);
    formData.append('isOriginalSound', videoData.isOriginalSound !== false);

    // Optional fields
    if (videoData.hashtags?.length > 0) {
      formData.append('hashtags', JSON.stringify(videoData.hashtags));
    }

    if (videoData.soundId) {
      formData.append('soundId', videoData.soundId);
    }

    if (videoData.effects?.length > 0) {
      formData.append('effects', JSON.stringify(videoData.effects));
    }

    if (videoData.dimensions) {
      formData.append('dimensions', JSON.stringify(videoData.dimensions));
    }

    // Upload with progress tracking
    return api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      },
    });
  },

  updateVideo: (videoId, updates) => api.put(`/videos/${videoId}`, updates),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
  likeVideo: (videoId) => api.post(`/videos/${videoId}/like`),
  unlikeVideo: (videoId) => api.post(`/videos/${videoId}/unlike`),
  
  // New endpoints for video creation
  processVideo: (videoId, effects) => api.post(`/videos/${videoId}/process`, { effects }),
  addSound: (videoId, soundId) => api.post(`/videos/${videoId}/sound`, { soundId }),
  removeSound: (videoId) => api.delete(`/videos/${videoId}/sound`),
  getTrending: (category) => api.get(`/videos/trending${category ? `?category=${category}` : ''}`),
  getByHashtag: (hashtag) => api.get(`/videos/hashtag/${hashtag}`),
  getBySound: (soundId) => api.get(`/videos/sound/${soundId}`),
};

// User endpoints
const userService = {
  getUserStats: async (userId) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },
  unfollowUser: async (userId) => {
    const response = await api.post(`/users/${userId}/unfollow`);
    return response.data;
  }
};

// Sound endpoints
const sounds = {
  getTrending: () => api.get('/sounds/trending'),
  search: (query) => api.get(`/sounds/search?q=${encodeURIComponent(query)}`),
  getSound: (soundId) => api.get(`/sounds/${soundId}`),
  uploadSound: (file, metadata) => {
    const formData = new FormData();
    formData.append('sound', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    return api.post('/sounds/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Effects endpoints
const effects = {
  getTrending: () => api.get('/effects/trending'),
  search: (query) => api.get(`/effects/search?q=${encodeURIComponent(query)}`),
  getEffect: (effectId) => api.get(`/effects/${effectId}`),
  applyEffect: (videoId, effect) => api.post(`/videos/${videoId}/effects`, effect),
  removeEffect: (videoId, effectId) => api.delete(`/videos/${videoId}/effects/${effectId}`),
};

export { auth, videos, userService, sounds, effects };
export default api;




