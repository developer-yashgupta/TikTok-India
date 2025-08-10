import api from '../config/api';

class EffectsService {
  async getTrendingEffects() {
    try {
      const response = await api.get('/api/effects/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending effects:', error);
      throw error;
    }
  }

  async searchEffects(query) {
    try {
      const response = await api.get(`/api/effects/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching effects:', error);
      throw error;
    }
  }

  async applyEffect(videoUri, effect) {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4'
      });
      formData.append('effect', JSON.stringify(effect));

      const response = await api.post('/api/effects/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error applying effect:', error);
      throw error;
    }
  }

  async getPresets() {
    try {
      const response = await api.get('/api/effects/presets');
      return response.data;
    } catch (error) {
      console.error('Error fetching effect presets:', error);
      throw error;
    }
  }

  async savePreset(preset) {
    try {
      const response = await api.post('/api/effects/presets', preset);
      return response.data;
    } catch (error) {
      console.error('Error saving effect preset:', error);
      throw error;
    }
  }
}

export const effectsService = new EffectsService();
