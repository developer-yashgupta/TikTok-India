import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../config/api';

class NotificationService {
  constructor() {
    this.lastFetchTime = 0;
    this.minFetchInterval = 10000; // 10 seconds between fetches (reduced from 30s)
    this.retryAfterRateLimit = 30000; // Wait 30 seconds after rate limit (reduced from 1 minute)
    this.rateLimitedUntil = 0;
    this.backgroundFetchInterval = 5000; // 5 seconds for background fetches
    
    // 🔔 Badge Management
    this.badgeState = {
      chatCount: 0,
      inboxHasUnread: false,
      lastUpdate: null,
    };
    this.badgeListeners = [];
  }

  // Check if we should skip the request due to rate limiting
  shouldSkipRequest() {
    const now = Date.now();
    
    // Check if we're currently rate limited
    if (now < this.rateLimitedUntil) {
      const remainingTime = Math.ceil((this.rateLimitedUntil - now) / 1000);
      console.log(`Rate limited. Skipping request. Try again in ${remainingTime} seconds.`);
      return true;
    }
    
    // Check if enough time has passed since last fetch
    if (now - this.lastFetchTime < this.minFetchInterval) {
      const remainingTime = Math.ceil((this.minFetchInterval - (now - this.lastFetchTime)) / 1000);
      console.log(`Too frequent requests. Skipping. Try again in ${remainingTime} seconds.`);
      return true;
    }
    
    return false;
  }

  // Handle rate limit response
  handleRateLimit(error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.retryAfterRateLimit;
      this.rateLimitedUntil = Date.now() + waitTime;
      console.log(`Rate limited. Will retry after ${waitTime/1000} seconds.`);
      return true;
    }
    return false;
  }

  async getNotifications(page = 1, limit = 20, force = false) {
    // Skip if rate limited (unless forced)
    if (!force && this.shouldSkipRequest()) {
      throw new Error('Rate limited or too frequent requests');
    }

    try {
      this.lastFetchTime = Date.now();
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get(`/notifications`, {
        params: { page, limit },
        headers: {
          'x-auth-token': token
        }
      });
      
      // Reset rate limit status on successful request
      this.rateLimitedUntil = 0;
      return response.data;
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Handle rate limiting
      if (this.handleRateLimit(error)) {
        // Don't throw error for rate limits, just log it
        console.log('Request rate limited, will retry later');
        return null;
      }
      
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

  // Background fetch with more lenient rate limiting
  async backgroundFetch(page = 1, limit = 20) {
    const now = Date.now();
    
    // Use shorter interval for background fetches
    if (now - this.lastFetchTime < this.backgroundFetchInterval) {
      return null;
    }
    
    try {
      return await this.getNotifications(page, limit, false);
    } catch (error) {
      // Silent fail for background fetches
      return null;
    }
  }

  // Get notification settings from server
  async getNotificationSettings() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get('/notifications/settings', {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  // Update notification settings on server
  async updateNotificationSettings(settings) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.put('/notifications/settings', 
        { settings },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await api.get('/notifications/unread-count', {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // 🔔 Badge Management Methods

  // Subscribe to badge updates
  subscribeToBadgeUpdates(listener) {
    this.badgeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.badgeListeners = this.badgeListeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of badge changes
  notifyBadgeListeners() {
    this.badgeListeners.forEach(listener => {
      try {
        listener({ ...this.badgeState });
      } catch (error) {
        console.error('Error in badge listener:', error);
      }
    });
  }

  // Update badge state
  updateBadgeState(updates) {
    const previousState = { ...this.badgeState };
    this.badgeState = {
      ...this.badgeState,
      ...updates,
      lastUpdate: Date.now(),
    };
    
    // Only notify if state actually changed
    const hasChanged = 
      previousState.chatCount !== this.badgeState.chatCount ||
      previousState.inboxHasUnread !== this.badgeState.inboxHasUnread;
    
    if (hasChanged) {
      console.log('🔔 Badge state updated:', this.badgeState);
      this.notifyBadgeListeners();
    }
  }

  // Add notification (for foreground handling)
  addForegroundNotification(remoteMessage) {
    console.log('🔔 Processing foreground notification for badges:', remoteMessage);
    
    const notificationType = remoteMessage.data?.type || 'general';
    
    if (notificationType === 'message') {
      // Increment chat count
      this.updateBadgeState({
        chatCount: this.badgeState.chatCount + 1
      });
    } else if (['like', 'comment', 'follow', 'share'].includes(notificationType)) {
      // Set inbox indicator
      this.updateBadgeState({
        inboxHasUnread: true
      });
    }
  }

  // Clear chat count
  clearChatCount() {
    this.updateBadgeState({
      chatCount: 0
    });
  }

  // Clear inbox indicator
  clearInboxIndicator() {
    this.updateBadgeState({
      inboxHasUnread: false
    });
  }

  // 🚀 Real-time badge update methods
  
  // Update chat count (for real-time new messages)
  updateChatCount(change = 1) {
    const newCount = Math.max(0, this.badgeState.chatCount + change);
    console.log(`🔔 Updating chat count: ${this.badgeState.chatCount} -> ${newCount}`);
    
    this.updateBadgeState({
      chatCount: newCount
    });
  }

  // Decrement chat count (when messages are read)
  decrementChatCount(amount = 1) {
    this.updateChatCount(-amount);
  }

  // Set exact chat count
  setChatCount(count) {
    const newCount = Math.max(0, count);
    console.log(`🔔 Setting chat count to: ${newCount}`);
    
    this.updateBadgeState({
      chatCount: newCount
    });
  }

  // Handle real-time message events
  handleRealTimeMessage(messageData) {
    console.log('🔔 Handling real-time message for badges:', messageData);
    
    // Only increment if this is a message from someone else
    if (messageData.senderId && messageData.senderId !== messageData.currentUserId) {
      this.updateChatCount(1);
    }
  }

  // Handle real-time message read events
  handleRealTimeMessageRead(readData) {
    console.log('🔔 Handling real-time message read for badges:', readData);
    
    // If messages were read in a chat, potentially decrease chat count
    // This is a simplified approach - in practice, you might want to 
    // track per-chat unread counts for more accuracy
    if (readData.unreadCount !== undefined) {
      // If we know the specific unread count change
      const change = readData.previousUnreadCount - readData.unreadCount;
      if (change > 0) {
        this.decrementChatCount(change);
      }
    } else {
      // Fallback: assume some messages were read
      this.decrementChatCount(1);
    }
  }

  // Sync badges with server data
  async syncBadgesWithServer() {
    try {
      const response = await this.getNotifications(1, 100); // Get more notifications to count accurately
      
      if (response && response.notifications) {
        let chatCount = 0;
        let hasInboxUnread = false;

        // Count unread notifications by type
        response.notifications.forEach(notification => {
          if (!notification.read) {
            if (notification.type === 'message') {
              chatCount++;
            } else if (['like', 'comment', 'follow', 'share'].includes(notification.type)) {
              hasInboxUnread = true;
            }
          }
        });

        // Update badge state
        this.updateBadgeState({
          chatCount,
          inboxHasUnread: hasInboxUnread,
        });

        console.log('🔄 Badge sync completed:', { chatCount, hasInboxUnread });
      }
    } catch (error) {
      console.error('❌ Error syncing badges:', error);
    }
  }

  // Get current badge state
  getBadgeState() {
    return { ...this.badgeState };
  }

  // Reset all badges
  resetBadges() {
    this.updateBadgeState({
      chatCount: 0,
      inboxHasUnread: false,
    });
  }
}

export const notificationService = new NotificationService();
