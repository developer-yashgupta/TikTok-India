import api from '../config/api';

class SoundService {
  async getTrending() {
    try {
      const response = await api.get('/api/sounds/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending sounds:', error);
      throw error;
    }
  }

  async search(query) {
    try {
      const response = await api.get(`/api/sounds/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching sounds:', error);
      throw error;
    }
  }

  async getSound(soundId) {
    try {
      const response = await api.get(`/api/sounds/${soundId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sound:', error);
      throw error;
    }
  }

  async addSound(file, metadata) {
    try {
      const formData = new FormData();
      formData.append('sound', {
        uri: file.uri,
        type: 'audio/mpeg',
        name: 'sound.mp3'
      });
      
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          formData.append(key, metadata[key]);
        });
      }

      const response = await api.post('/api/sounds/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading sound:', error);
      throw error;
    }
  }
}

export const soundService = new SoundService();
