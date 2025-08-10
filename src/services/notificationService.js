import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../config/api';

class NotificationService {
  async getNotifications(page = 1, limit = 20) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get(`/notifications`, {
        params: { page, limit },
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationIds) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put(`/notifications/read`, 
        { notificationIds },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put(`/notifications/read-all`, 
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.delete(`/notifications/${notificationId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
