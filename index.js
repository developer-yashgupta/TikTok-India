import { registerRootComponent } from 'expo';
<<<<<<< HEAD

import App from './App';

=======
import messaging from '@react-native-firebase/messaging';

import App from './App';

// Silence Firebase modular API deprecation warnings
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// Register background handler for Firebase messaging
messaging().setBackgroundMessageHandler(async remoteMessage => {
  
  // Handle the message in background
  try {
    // You can perform background tasks here like:
    // - Update local storage
    // - Show local notifications
    // - Update app badge
    // - Sync data with server
    
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Background notification received
    }
    
    // Store notification locally for when app opens
    if (data) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedNotifications = await AsyncStorage.getItem('backgroundNotifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      notifications.unshift({
        id: Date.now().toString(),
        title: notification?.title || 'Notification',
        body: notification?.body || '',
        data: data,
        receivedAt: new Date().toISOString(),
        isRead: false
      });
      
      // Keep only last 20 background notifications
      if (notifications.length > 20) {
        notifications.splice(20);
      }
      
      await AsyncStorage.setItem('backgroundNotifications', JSON.stringify(notifications));
    }
    
  } catch (error) {
    // Error handling background message
  }
});

>>>>>>> master
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
