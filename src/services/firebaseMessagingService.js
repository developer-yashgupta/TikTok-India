import {
  initializeFirebaseMessaging,
  cleanupFirebaseMessaging,
  getFCMToken,
  requestUserPermission,
  sendLocalNotification,
  isNotificationsEnabled,
  openNotificationSettings,
  initializeFirebaseApp,
  safeInitializeFirebase
} from '../config/firebase';
import { getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { notificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseMessagingService {
  constructor() {
    this.subscriptions = null;
    this.currentUserId = null;
    this.notificationHandlers = {
      onNotificationReceived: null,
      onNotificationOpened: null
    };
  }

  // Initialize Firebase messaging for a user
  async initialize(userId) {
    try {
      if (!userId) {
        return false;
      }

      // Check if Firebase is already initialized
      let apps = getApps();
      
      // If no apps are found, try to initialize Firebase
      if (apps.length === 0) {
        
        // First try safe initialization (which should have been done in App.js)
        const safeResult = await safeInitializeFirebase();
        if (safeResult) {
          apps = getApps();
        }

        // If still no apps, try regular initialization
        if (apps.length === 0) {
          const firebaseApp = initializeFirebaseApp();
          if (firebaseApp) {
            apps = getApps();
          }
        }
      }

      // Final check - if we still don't have Firebase apps, we can't proceed
      if (apps.length === 0) {
        return false;
      }

      // Check if Firebase messaging is available
      try {
        // Test if messaging is available by checking permission status
        const { requestPermission, AuthorizationStatus, getMessaging } = await import('@react-native-firebase/messaging');
        const messagingInstance = getMessaging();
        const permissionStatus = await requestPermission(messagingInstance);
        
        // Check if permission is granted
        if (permissionStatus === AuthorizationStatus.AUTHORIZED || permissionStatus === AuthorizationStatus.PROVISIONAL) {
          // Firebase messaging permission granted
        } else {
          // Firebase messaging permission denied
        }
      } catch (messagingError) {
        // Don't return false here - Firebase app is initialized, just messaging isn't available
        // This allows the app to continue working without push notifications
      }

      this.currentUserId = userId;

      // Set up notification handlers
      this.notificationHandlers.onNotificationReceived = this.handleNotificationReceived.bind(this);
      this.notificationHandlers.onNotificationOpened = this.handleNotificationOpened.bind(this);

      // Initialize Firebase messaging (single attempt)
      try {
        
        this.subscriptions = await initializeFirebaseMessaging(
          userId,
          this.notificationHandlers.onNotificationReceived,
          this.notificationHandlers.onNotificationOpened
        );

        if (this.subscriptions) {
          // Start background sync
          this.startBackgroundSync();
          
          return true;
        } else {
          return true; // Still return true - app can work without messaging
        }
      } catch (initError) {
        // Return true anyway - Firebase app is available, just messaging failed
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  // Clean up Firebase messaging
  cleanup() {
    if (this.subscriptions) {
      cleanupFirebaseMessaging(this.subscriptions);
      this.subscriptions = null;
      this.currentUserId = null;
      
      // Stop background sync
      this.stopBackgroundSync();
    }
  }

  // Handle notification received while app is in foreground
  async handleNotificationReceived(remoteMessage) {
    try {

      // Extract notification data
      const { notification, data } = remoteMessage;
      const notificationData = {
        title: notification?.title || 'Notification',
        body: notification?.body || '',
        data: data || {},
        receivedAt: new Date().toISOString()
      };

      // Store notification locally for offline access
      await this.storeNotificationLocally(notificationData);

      // REMOVED: Recursive call to prevent infinite loop
      // The notification handler is already executing, don't call it again!
      
      // REMOVED: Don't automatically refresh notifications to prevent rate limiting
      // The notification is already stored locally and can be displayed immediately
      // Server refresh should only happen when user explicitly checks notifications

    } catch (error) {
      // Error handling notification received
    }
  }

  // Handle notification opened from background/quit state
  async handleNotificationOpened(remoteMessage) {
    try {

      const { data } = remoteMessage;

      // Handle navigation based on notification type
      if (data && data.type) {
        await this.handleNotificationNavigation(data);
      }

      // REMOVED: Recursive call to prevent infinite loop
      // The notification handler is already executing, don't call it again!

    } catch (error) {
      // Error handling notification opened
    }
  }

  // Handle navigation based on notification type
  async handleNotificationNavigation(data) {
    try {
      const { type, videoId, userId, commentId } = data;

      switch (type) {
        case 'like':
          if (videoId) {
            // Navigate to video
          }
          break;
        case 'comment':
          if (videoId) {
            // Navigate to video comments
          }
          break;
        case 'follow':
          if (userId) {
            // Navigate to user profile
          }
          break;
        case 'message':
          // Navigate to messages
          break;
        default:
          break;
      }
    } catch (error) {
      // Error handling notification navigation
    }
  }

  // Store notification locally for offline access
  async storeNotificationLocally(notificationData) {
    try {
      const storedNotifications = await AsyncStorage.getItem('localNotifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];

      notifications.unshift({
        id: Date.now().toString(),
        ...notificationData,
        isRead: false
      });

      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }

      await AsyncStorage.setItem('localNotifications', JSON.stringify(notifications));
    } catch (error) {
      // Error storing notification locally
    }
  }

  // Get stored notifications
  async getStoredNotifications() {
    try {
      const storedNotifications = await AsyncStorage.getItem('localNotifications');
      return storedNotifications ? JSON.parse(storedNotifications) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  // Refresh notifications from server (with rate limiting)
  async refreshNotifications(force = false) {
    try {
      if (this.currentUserId) {
        const result = await notificationService.getNotifications(1, 20, force);
        if (result === null) {
          // Rate limited - this is expected behavior, not an error
          console.log('Notification refresh skipped due to rate limiting');
        } else {
          console.log('Notifications refreshed successfully');
        }
        return result;
      }
    } catch (error) {
      // Only log actual errors, not rate limiting
      if (!error.message.includes('Rate limited')) {
        console.error('Error refreshing notifications:', error);
      } else {
        console.log('Notification refresh throttled:', error.message);
      }
      return null;
    }
  }

  // Background sync when app becomes active
  async backgroundSync() {
    try {
      if (!this.currentUserId) {
        console.log('No user logged in, skipping background sync');
        return null;
      }

      console.log('Starting background notification sync...');
      
      // Use background fetch method which has more lenient rate limiting
      const result = await notificationService.backgroundFetch(1, 20);
      
      if (result) {
        console.log('Background sync completed successfully:', {
          count: result.notifications?.length || 0,
          unread: result.unreadCount || 0
        });
        
        // Update locally stored notifications
        if (result.notifications && result.notifications.length > 0) {
          await this.mergeWithLocalNotifications(result.notifications);
        }
        
        return result;
      } else {
        console.log('Background sync skipped (rate limited or no data)');
        return null;
      }
    } catch (error) {
      console.log('Background sync failed (expected if rate limited):', error.message);
      return null;
    }
  }

  // Merge server notifications with locally stored ones
  async mergeWithLocalNotifications(serverNotifications) {
    try {
      const localNotifications = await this.getStoredNotifications();
      
      // Create a map of server notifications by ID
      const serverNotificationMap = new Map();
      serverNotifications.forEach(notif => {
        if (notif._id) {
          serverNotificationMap.set(notif._id, notif);
        }
      });
      
      // Filter out local notifications that exist on server
      const filteredLocalNotifications = localNotifications.filter(localNotif => {
        return !serverNotificationMap.has(localNotif._id);
      });
      
      // Merge server notifications with remaining local ones
      const mergedNotifications = [
        ...serverNotifications,
        ...filteredLocalNotifications
      ];
      
      // Sort by timestamp and keep only latest 50
      mergedNotifications.sort((a, b) => {
        const aTime = new Date(a.createdAt || a.receivedAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.receivedAt || 0).getTime();
        return bTime - aTime;
      });
      
      const finalNotifications = mergedNotifications.slice(0, 50);
      
      // Store merged notifications
      await AsyncStorage.setItem('localNotifications', JSON.stringify(finalNotifications));
      
      console.log('Merged notifications:', {
        server: serverNotifications.length,
        local: filteredLocalNotifications.length,
        final: finalNotifications.length
      });
      
    } catch (error) {
      console.error('Error merging notifications:', error);
    }
  }

  // Start background sync when app becomes active
  startBackgroundSync() {
    // Set up app state change listener for background sync
    if (typeof require !== 'undefined') {
      try {
        const { AppState } = require('react-native');
        
        const handleAppStateChange = (nextAppState) => {
          if (nextAppState === 'active') {
            console.log('App became active, triggering background sync...');
            // Delay sync slightly to let app fully initialize
            setTimeout(() => {
              this.backgroundSync();
            }, 1000);
          }
        };
        
        AppState.addEventListener('change', handleAppStateChange);
        
        // Store reference to remove listener later
        this.appStateListener = handleAppStateChange;
        
        console.log('Background sync listener registered');
        
        return true;
      } catch (error) {
        console.log('Could not set up app state listener:', error.message);
        return false;
      }
    }
    
    return false;
  }

  // Stop background sync
  stopBackgroundSync() {
    if (this.appStateListener && typeof require !== 'undefined') {
      try {
        const { AppState } = require('react-native');
        AppState.removeEventListener('change', this.appStateListener);
        this.appStateListener = null;
        console.log('Background sync listener removed');
      } catch (error) {
        console.log('Error removing app state listener:', error.message);
      }
    }
  }

  // Send test notification
  async sendTestNotification(title, body, data = {}) {
    try {
      await sendLocalNotification(title, body, data);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Check if notifications are enabled
  async checkNotificationStatus() {
    try {
      return await isNotificationsEnabled();
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  // Request notification permissions with user-friendly dialog
  async requestPermissions() {
    try {
      const { Alert } = require('react-native');

      // Show user-friendly permission dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Enable Notifications',
          'Would you like to receive notifications for likes, comments, and messages?',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  const granted = await requestUserPermission();
                  resolve(granted);
                } catch (error) {
                  console.error('Error requesting notification permissions:', error);
                  resolve(false);
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error showing notification permission dialog:', error);
      return false;
    }
  }

  // Open notification settings
  openSettings() {
    openNotificationSettings();
  }

  // Get current FCM token
  async getCurrentToken() {
    try {
      return await getFCMToken();
    } catch (error) {
      console.error('Error getting current FCM token:', error);
      return null;
    }
  }

  // Set notification handlers
  setNotificationHandlers(onReceived, onOpened) {
    this.notificationHandlers.onNotificationReceived = onReceived;
    this.notificationHandlers.onNotificationOpened = onOpened;
  }
}

export const firebaseMessagingService = new FirebaseMessagingService();
export default firebaseMessagingService;