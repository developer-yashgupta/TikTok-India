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
      console.log('Checking current follow status for user:', userId);
      const userProfile = await this.getUserProfile(userId);
      const isCurrentlyFollowing = userProfile.isFollowing;
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      console.log('Current follow status:', isCurrentlyFollowing);
      let response;

      if (isCurrentlyFollowing) {
        response = await api.delete(`/users/${userId}/follow`, {
          headers: {
            'x-auth-token': token
          }
        });
      } else {
        response = await api.post(`/users/${userId}/follow`, {}, {
          headers: {
            'x-auth-token': token
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error toggling follow:', error);
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
}

export const userService = new UserService();
