import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationNavigationService {
  constructor() {
    this.navigationRef = null;
    this.isNavigating = false;
    this.pendingNotifications = [];
  }

  // Set navigation reference
  setNavigationRef(navigationRef) {
    this.navigationRef = navigationRef;
    console.log('🧭 Navigation reference set for notification handling');
    
    // Process any pending notifications
    this.processPendingNotifications();
  }

  // Check if navigation is ready
  isNavigationReady() {
    return this.navigationRef && this.navigationRef.current && this.navigationRef.current.isReady();
  }

  // Add notification to pending queue if navigation not ready
  addToPendingQueue(notification) {
    this.pendingNotifications.push(notification);
    console.log('📋 Added notification to pending queue:', notification?.data?.type);
  }

  // Process all pending notifications
  async processPendingNotifications() {
    if (this.pendingNotifications.length === 0) return;
    
    console.log(`📋 Processing ${this.pendingNotifications.length} pending notifications`);
    
    // Process the most recent notification first
    const notification = this.pendingNotifications.pop();
    this.pendingNotifications = []; // Clear the rest
    
    await this.navigateToNotification(notification);
  }

  // Main navigation function
  async navigateToNotification(remoteMessage) {
    try {
      console.log('🔔 Processing notification tap navigation:', remoteMessage);

      if (!remoteMessage || !remoteMessage.data) {
        console.log('❌ Invalid notification data for navigation');
        return;
      }

      // Prevent multiple concurrent navigations
      if (this.isNavigating) {
        console.log('🚫 Already navigating, queuing notification');
        this.addToPendingQueue(remoteMessage);
        return;
      }

      // Check if navigation is ready
      if (!this.isNavigationReady()) {
        console.log('🚫 Navigation not ready, queuing notification');
        this.addToPendingQueue(remoteMessage);
        return;
      }

      this.isNavigating = true;

      const { data } = remoteMessage;
      const notificationType = data.type;
      
      console.log('🧭 Navigating for notification type:', notificationType);
      console.log('📄 Notification data:', data);

      // Wait a bit to ensure app is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      // Route based on notification type
      switch (notificationType) {
        case 'message':
          await this.navigateToMessage(data);
          break;
          
        case 'like':
        case 'comment':
        case 'share':
          await this.navigateToVideo(data);
          break;
          
        case 'follow':
          await this.navigateToProfile(data);
          break;
          
        case 'video':
          await this.navigateToVideo(data);
          break;
          
        case 'profile':
          await this.navigateToProfile(data);
          break;

        case 'notification':
        case 'general':
        default:
          await this.navigateToNotifications(data);
          break;
      }

      console.log('✅ Notification navigation completed');

    } catch (error) {
      console.error('❌ Error navigating to notification:', error);
    } finally {
      this.isNavigating = false;
      
      // Process next pending notification after a delay
      setTimeout(() => {
        this.processPendingNotifications();
      }, 1000);
    }
  }

  // Navigate to message/chat screen
  async navigateToMessage(data) {
    try {
      console.log('💬 Navigating to message screen');
      
      if (data.chatId || data.conversationId) {
        // Navigate to specific chat
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Home',
            params: {
              screen: 'ChatList',
              params: {
                openChatId: data.chatId || data.conversationId,
                userId: data.senderId || data.fromUserId
              }
            }
          })
        );
      } else if (data.senderId || data.fromUserId) {
        // Navigate to specific user's chat
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Home',
            params: {
              screen: 'ChatList',
              params: {
                createChatWithUserId: data.senderId || data.fromUserId
              }
            }
          })
        );
      } else {
        // Navigate to chat list
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Home',
            params: {
              screen: 'ChatList'
            }
          })
        );
      }
    } catch (error) {
      console.error('❌ Error navigating to message:', error);
      // Fallback to chat list
      this.navigateToFallback('ChatList');
    }
  }

  // Navigate to video screen
  async navigateToVideo(data) {
    try {
      console.log('🎬 Navigating to video screen');
      
      if (data.videoId) {
        // Navigate to specific video
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Home',
            params: {
              screen: 'Home',
              params: {
                videoId: data.videoId,
                scrollToVideo: true
              }
            }
          })
        );
      } else {
        // Navigate to home feed
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Home'
          })
        );
      }
    } catch (error) {
      console.error('❌ Error navigating to video:', error);
      this.navigateToFallback('Home');
    }
  }

  // Navigate to profile screen
  async navigateToProfile(data) {
    try {
      console.log('👤 Navigating to profile screen');
      
      if (data.userId || data.fromUserId) {
        // Navigate to specific user's profile
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('ViewProfile', {
            userId: data.userId || data.fromUserId
          })
        );
      } else {
        // Navigate to current user's profile
        this.navigationRef.current?.dispatch(
          CommonActions.navigate('Main', {
            screen: 'Profile'
          })
        );
      }
    } catch (error) {
      console.error('❌ Error navigating to profile:', error);
      this.navigateToFallback('Profile');
    }
  }

  // Navigate to notifications screen
  async navigateToNotifications(data) {
    try {
      console.log('🔔 Navigating to notifications screen');
      
      this.navigationRef.current?.dispatch(
        CommonActions.navigate('Main', {
          screen: 'Inbox',
          params: {
            screen: 'Notifications'
          }
        })
      );
    } catch (error) {
      console.error('❌ Error navigating to notifications:', error);
      this.navigateToFallback('Inbox');
    }
  }

  // Fallback navigation when specific navigation fails
  navigateToFallback(screenName = 'Home') {
    try {
      console.log('🔄 Using fallback navigation to:', screenName);
      
      this.navigationRef.current?.dispatch(
        CommonActions.navigate('Main', {
          screen: screenName
        })
      );
    } catch (error) {
      console.error('❌ Even fallback navigation failed:', error);
    }
  }

  // Handle notification tap from foreground state
  async handleForegroundNotificationTap(remoteMessage) {
    console.log('🔔 Foreground notification tapped');
    await this.navigateToNotification(remoteMessage);
  }

  // Handle notification tap from background state
  async handleBackgroundNotificationTap(remoteMessage) {
    console.log('🔔 Background notification tapped');
    await this.navigateToNotification(remoteMessage);
  }

  // Handle notification when app opened from killed state
  async handleInitialNotification(remoteMessage) {
    console.log('🔔 Initial notification (app was killed)');
    
    // Store the notification to process after navigation is ready
    if (remoteMessage) {
      await AsyncStorage.setItem('initialNotification', JSON.stringify(remoteMessage));
    }
    
    // Try to process immediately if navigation is ready
    if (this.isNavigationReady()) {
      await this.navigateToNotification(remoteMessage);
    } else {
      this.addToPendingQueue(remoteMessage);
    }
  }

  // Check and process stored initial notification
  async processStoredInitialNotification() {
    try {
      const storedNotification = await AsyncStorage.getItem('initialNotification');
      if (storedNotification) {
        await AsyncStorage.removeItem('initialNotification');
        const notification = JSON.parse(storedNotification);
        console.log('📱 Processing stored initial notification');
        await this.navigateToNotification(notification);
      }
    } catch (error) {
      console.error('❌ Error processing stored initial notification:', error);
    }
  }

  // Reset navigation state (for debugging)
  reset() {
    this.isNavigating = false;
    this.pendingNotifications = [];
    console.log('🔄 Notification navigation service reset');
  }

  // Get navigation state for debugging
  getState() {
    return {
      hasNavigationRef: !!this.navigationRef,
      isNavigationReady: this.isNavigationReady(),
      isNavigating: this.isNavigating,
      pendingNotificationsCount: this.pendingNotifications.length
    };
  }
}

// Export singleton instance
export const notificationNavigationService = new NotificationNavigationService();
export default notificationNavigationService;
