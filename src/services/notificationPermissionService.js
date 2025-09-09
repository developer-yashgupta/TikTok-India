import { Platform, Alert } from 'react-native';

// Conditionally import PermissionsAndroid only for Android
let PermissionsAndroid = null;
if (Platform.OS === 'android') {
  try {
    PermissionsAndroid = require('react-native').PermissionsAndroid;
  } catch (e) {
    console.warn('PermissionsAndroid not available on this platform');
  }
}
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus
} from '@react-native-firebase/messaging';
import { getApps } from '@react-native-firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationPermissionService {
  constructor() {
    this.permissionRequested = false;
    this.permissionGranted = false;
    this.PERMISSION_KEY = '@notification_permission_requested';
  }

  // Initialize notification permissions on app start
  async initialize() {
    try {
      console.log('=== NOTIFICATION PERMISSION INITIALIZATION ===');
      
      // Check if we've already requested permissions in this session
      if (this.permissionRequested) {
        console.log('Notification permissions already requested in this session');
        return this.permissionGranted;
      }

      // Check if Firebase is available
      const apps = getApps();
      if (apps.length === 0) {
        console.warn('Firebase not initialized, skipping notification permission request');
        return false;
      }

      // For Android 13+ (API 33+), we need to explicitly request POST_NOTIFICATIONS
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const androidPermission = await this.requestAndroidNotificationPermission();
        if (!androidPermission) {
          console.log('Android notification permission denied');
          return false;
        }
      }

      // Request Firebase messaging permission
      const firebasePermission = await this.requestFirebaseNotificationPermission();
      
      this.permissionRequested = true;
      this.permissionGranted = firebasePermission;
      
      // Store the permission status
      await AsyncStorage.setItem(this.PERMISSION_KEY, JSON.stringify({
        requested: true,
        granted: firebasePermission,
        timestamp: Date.now()
      }));

      return firebasePermission;

    } catch (error) {
      console.error('Error initializing notification permissions:', error);
      return false;
    }
  }

  // Request Android-specific notification permission (API 33+)
  async requestAndroidNotificationPermission() {
    try {
      if (Platform.OS !== 'android' || !PermissionsAndroid) {
        return true; // Not applicable for iOS or if PermissionsAndroid is not available
      }

      console.log('Requesting Android POST_NOTIFICATIONS permission...');
      
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Notification Permission',
        message: 'This app needs notification access to send you updates about likes, comments, and messages.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log('Android notification permission result:', isGranted ? 'GRANTED' : 'DENIED');
      
      return isGranted;

    } catch (error) {
      console.error('Error requesting Android notification permission:', error);
      return false;
    }
  }

  // Request Firebase messaging permission
  async requestFirebaseNotificationPermission() {
    try {
      console.log('Requesting Firebase messaging permission...');
      
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      
      console.log('Firebase messaging permission status:', authStatus);
      
      const isAuthorized = authStatus === AuthorizationStatus.AUTHORIZED ||
                          authStatus === AuthorizationStatus.PROVISIONAL;
      
      if (isAuthorized) {
        console.log('Firebase messaging permission granted');
        return true;
      } else {
        console.log('Firebase messaging permission denied');
        
        // Show user-friendly message about enabling notifications in settings
        this.showPermissionDeniedAlert();
        return false;
      }

    } catch (error) {
      console.error('Error requesting Firebase messaging permission:', error);
      return false;
    }
  }

  // Check current permission status without requesting
  async checkPermissionStatus() {
    try {
      // Check Android permission first (if applicable)
      if (Platform.OS === 'android' && Platform.Version >= 33 && PermissionsAndroid) {
        const androidPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (!androidPermission) {
          return false;
        }
      }

      // Check Firebase permission
      const apps = getApps();
      if (apps.length === 0) {
        return false;
      }

      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      
      return authStatus === AuthorizationStatus.AUTHORIZED ||
             authStatus === AuthorizationStatus.PROVISIONAL;

    } catch (error) {
      console.error('Error checking notification permission status:', error);
      return false;
    }
  }

  // Show alert when permission is denied
  showPermissionDeniedAlert() {
    Alert.alert(
      'Notifications Disabled',
      'You can enable notifications in your device settings to receive updates about likes, comments, and messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settings',
          onPress: this.openNotificationSettings
        }
      ]
    );
  }

  // Open device notification settings
  openNotificationSettings() {
    try {
      if (Platform.OS === 'ios') {
        const { Linking } = require('react-native');
        Linking.openURL('app-settings:');
      } else {
        const { Linking } = require('react-native');
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  // Request permissions with user-friendly dialog
  async requestPermissionWithDialog() {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Notifications',
        'Stay updated with likes, comments, and messages. Would you like to enable notifications?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Enable',
            onPress: async () => {
              const granted = await this.initialize();
              resolve(granted);
            }
          }
        ]
      );
    });
  }

  // Get stored permission info
  async getStoredPermissionInfo() {
    try {
      const stored = await AsyncStorage.getItem(this.PERMISSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored permission info:', error);
      return null;
    }
  }

  // Check if we should show permission request (not asked recently)
  async shouldRequestPermission() {
    try {
      const stored = await this.getStoredPermissionInfo();
      
      if (!stored || !stored.requested) {
        return true; // Never requested
      }

      if (stored.granted) {
        return false; // Already granted
      }

      // If denied, wait at least 24 hours before asking again
      const now = Date.now();
      const timeSinceLastRequest = now - (stored.timestamp || 0);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      return timeSinceLastRequest > twentyFourHours;

    } catch (error) {
      console.error('Error checking if should request permission:', error);
      return true; // Default to allowing request
    }
  }

  // Reset permission state (for testing)
  async resetPermissionState() {
    try {
      await AsyncStorage.removeItem(this.PERMISSION_KEY);
      this.permissionRequested = false;
      this.permissionGranted = false;
      console.log('Notification permission state reset');
    } catch (error) {
      console.error('Error resetting permission state:', error);
    }
  }
}

export default new NotificationPermissionService();
