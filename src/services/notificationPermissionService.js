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
      // Check if we've already requested permissions in this session
      if (this.permissionRequested) {
        return this.permissionGranted;
      }

      // Check if Firebase is available
      try {
        const apps = getApps();
        if (apps.length === 0) {
          return false;
        }
      } catch (firebaseError) {
        return false;
      }

      // For Android 13+ (API 33+), we need to explicitly request POST_NOTIFICATIONS
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const androidPermission = await this.requestAndroidNotificationPermission();
          if (!androidPermission) {
            return false;
          }
        } catch (androidError) {
          // Silent fail - don't crash the app
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
      return false;
    }
  }

  // Request Android-specific notification permission (API 33+)
  async requestAndroidNotificationPermission() {
    try {
      if (Platform.OS !== 'android' || !PermissionsAndroid) {
        return true; // Not applicable for iOS or if PermissionsAndroid is not available
      }

      // Check if PermissionsAndroid is properly initialized
      if (!PermissionsAndroid.request || !PermissionsAndroid.PERMISSIONS) {
        return true; // Skip permission request to prevent crash
      }

      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;

      if (!permission) {
        return true; // Permission not needed
      }

      // Add longer delay to ensure React Native bridge is ready
      await new Promise(resolve => setTimeout(resolve, 3000));

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Notification Permission',
        message: 'This app needs notification access to send you updates about likes, comments, and messages.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      if (!PermissionsAndroid.RESULTS) {
        return true;
      }

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

      return isGranted;

    } catch (error) {
      // Return true instead of throwing to prevent app crashes
      return true;
    }
  }

  // Request Firebase messaging permission
  async requestFirebaseNotificationPermission() {
    try {
      // Check if Firebase messaging is available
      if (!getMessaging || !requestPermission) {
        return true; // Skip to prevent crash
      }

      const messagingInstance = getMessaging();

      if (!messagingInstance) {
        return true; // Skip to prevent crash
      }

      const authStatus = await requestPermission(messagingInstance);

      if (!AuthorizationStatus) {
        return true;
      }

      const isAuthorized = authStatus === AuthorizationStatus.AUTHORIZED ||
                           authStatus === AuthorizationStatus.PROVISIONAL;

      if (isAuthorized) {
        return true;
      } else {
        // Show user-friendly message about enabling notifications in settings
        try {
          this.showPermissionDeniedAlert();
        } catch (alertError) {
          // Silent fail for alert errors
        }
        return false;
      }

    } catch (error) {
      // Return true instead of throwing to prevent app crashes
      return true;
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
      return true; // Default to allowing request
    }
  }

  // Reset permission state (for testing)
  async resetPermissionState() {
    try {
      await AsyncStorage.removeItem(this.PERMISSION_KEY);
      this.permissionRequested = false;
      this.permissionGranted = false;
    } catch (error) {
      // Silent fail
    }
  }

  // Request Android notification permission on-demand (safer than during initialization)
  async requestAndroidPermissionOnDemand() {
    try {
      if (Platform.OS !== 'android' || Platform.Version < 33) {
        return true; // Not needed
      }

      if (!PermissionsAndroid) {
        return true; // PermissionsAndroid not available
      }

      // Double-check PermissionsAndroid is ready
      if (!PermissionsAndroid.request || !PermissionsAndroid.PERMISSIONS) {
        return true; // Not ready yet
      }

      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!permission) {
        return true; // Permission not available
      }

      // Wait for React Native bridge to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Notification Permission',
        message: 'This app needs notification access to send you updates about likes, comments, and messages.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      if (!PermissionsAndroid.RESULTS) {
        return true; // Cannot determine result
      }

      return granted === PermissionsAndroid.RESULTS.GRANTED;

    } catch (error) {
      // Return true to not break functionality
      return true;
    }
  }
}

export default new NotificationPermissionService();
