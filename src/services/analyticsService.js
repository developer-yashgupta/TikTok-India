import api from '../config/api';

export const analyticsService = {
  // Get overall analytics
  getOverallAnalytics: async (timeRange = '7d') => {
    const response = await api.get('/api/analytics', {
      params: { timeRange }
    });
    return response.data;
  },

  // Get video-specific analytics
  getVideoAnalytics: async (videoId, timeRange = '7d') => {
    const response = await api.get(`/api/analytics/videos/${videoId}`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Get follower analytics
  getFollowerAnalytics: async (timeRange = '7d') => {
    const response = await api.get('/api/analytics/followers', {
      params: { timeRange }
    });
    return response.data;
  },

  // Get engagement analytics
  getEngagementAnalytics: async (timeRange = '7d') => {
    const response = await api.get('/api/analytics/engagement', {
      params: { timeRange }
    });
    return response.data;
  },

  // Get profile views analytics
  getProfileViewsAnalytics: async (timeRange = '7d') => {
    const response = await api.get('/api/analytics/profile-views', {
      params: { timeRange }
    });
    return response.data;
  },

  // Get trending hashtags
  getTrendingHashtags: async () => {
    const response = await api.get('/api/analytics/trending-hashtags');
    return response.data;
  },

  // Get audience demographics
  getAudienceDemographics: async () => {
    const response = await api.get('/api/analytics/audience');
    return response.data;
  },

  // Get best posting times
  getBestPostingTimes: async () => {
    const response = await api.get('/api/analytics/best-times');
    return response.data;
  },

  // Track video view
  trackVideoView: async (videoId) => {
    const response = await api.post(`/api/analytics/videos/${videoId}/view`);
    return response.data;
  },

  // Track profile view
  trackProfileView: async (userId) => {
    const response = await api.post(`/api/analytics/profile/${userId}/view`);
    return response.data;
  }
};
