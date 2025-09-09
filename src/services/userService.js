import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../config/api';

class UserService {
  async getUserProfile(userId) {
    try {
      console.log('Fetching user profile:', userId);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get(`/users/profile/${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      console.log('User profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async toggleFollow(userId) {
    try {
      console.log('VideoControls Debug: toggleFollow called with userId:', userId);

      // Instead of checking current status first, let the backend handle it
      // This is more efficient and avoids race conditions
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      console.log('VideoControls Debug: Making follow request to backend');

      // Try to follow first (this will fail if already following)
      try {
        const response = await api.post(`/users/${userId}/follow`, {}, {
          headers: {
            'x-auth-token': token
          }
        });
        console.log('VideoControls Debug: Follow request successful:', response.data);
        return response.data;
      } catch (followError) {
        console.log('VideoControls Debug: Follow failed, trying unfollow:', followError.response?.data);

        // If follow failed, try unfollow
        const response = await api.post(`/users/${userId}/unfollow`, {}, {
          headers: {
            'x-auth-token': token
          }
        });
        console.log('VideoControls Debug: Unfollow request successful:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('VideoControls Debug: Error toggling follow:', error);
      throw error;
    }
  }

  async getUserVideos(userId, page = 1, limit = 30) {
    try {
      console.log('Fetching user videos:', userId, 'page:', page, 'limit:', limit);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get(`/videos/user/${userId}`, {
        params: { page, limit },
        headers: {
          'x-auth-token': token
        }
      });
      console.log('User videos response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put('/users/privacy', settings, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  async getPrivacySettings() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get('/users/privacy', {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put('/users/security', settings, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put('/users/password', {
        oldPassword,
        newPassword
      }, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async enableTwoFactor(method = 'sms') {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.post('/users/2fa/enable', {
        method
      }, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  async disableTwoFactor() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.post('/users/2fa/disable', {}, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  async reportProblem(report) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.post('/support/report', report, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting problem:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put('/users/profile', profileData, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
