import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking, Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus
} from '@react-native-firebase/messaging';

class PermissionManager {
  constructor() {
    this.permissions = {};
    this.STORAGE_KEY = '@permissions_requested';
  }

  async checkFirstLaunch() {
    try {
      const hasLaunched = await AsyncStorage.getItem(this.STORAGE_KEY);
      return hasLaunched === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false;
    }
  }

  async markAsLaunched() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error marking as launched:', error);
    }
  }

  async requestInitialPermissions() {
    try {
      const isFirstLaunch = await this.checkFirstLaunch();

      if (isFirstLaunch) {
        // Request all permissions on first launch (excluding notifications initially)
        await this.checkMultiplePermissions(['camera', 'microphone', 'mediaLibrary']);
        await this.markAsLaunched();
      } else {
        // Check for previously denied permissions
        const deniedPermissions = [];

        for (const permission of ['camera', 'microphone', 'mediaLibrary']) {
          const isGranted = await this.checkPermissionStatus(permission);
          if (!isGranted) {
            deniedPermissions.push(permission);
          }
        }

        // Request any previously denied permissions
        if (deniedPermissions.length > 0) {
          await this.checkMultiplePermissions(deniedPermissions);
        }
      }
    } catch (error) {
      console.error('Error in requestInitialPermissions:', error);
    }
  }

  // Request Firebase notification permissions
  async requestNotificationPermissions() {
    try {
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Firebase notification permission granted');
        return true;
      } else {
        console.log('Firebase notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting Firebase notification permission:', error.message);
      return false;
    }
  }

  // Check Firebase notification permission status
  async checkNotificationPermissionStatus() {
    try {
      // Use requestPermission to check current status without prompting
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      return authStatus === AuthorizationStatus.AUTHORIZED ||
             authStatus === AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking Firebase notification permission:', error);
      return false;
    }
  }

  // Request notification permissions with user-friendly dialog
  async requestNotificationPermissionsWithDialog() {
    try {
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
                  const granted = await this.requestNotificationPermissions();
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

  // Check and guide user for notification permissions
  async checkAndGuideNotificationPermissions() {
    try {
      const isEnabled = await this.checkNotificationPermissionStatus();

      if (!isEnabled) {
        return new Promise((resolve) => {
          Alert.alert(
            'Notifications Disabled',
            'Notifications are currently disabled. Would you like to enable them in settings?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Settings',
                onPress: () => {
                  this.openNotificationSettings();
                  resolve(false); // User needs to manually enable and restart
                }
              }
            ]
          );
        });
      }

      return true;
    } catch (error) {
      console.error('Error checking and guiding notification permissions:', error);
      return false;
    }
  }

  // Open notification settings
  async openNotificationSettings() {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  async checkPermissionStatus(permission) {
    try {
      let status;

      switch (permission) {
        case 'camera':
          status = await Camera.getCameraPermissionsAsync();
          break;
        case 'microphone':
          status = await Camera.getMicrophonePermissionsAsync();
          break;
        case 'mediaLibrary':
          status = await MediaLibrary.getPermissionsAsync();
          break;
        case 'notifications':
          return await this.checkNotificationPermissionStatus();
        default:
          return false;
      }

      return status.status === 'granted';
    } catch (error) {
      console.error(`Error checking ${permission} permission:`, error);
      return false;
    }
  }

  async checkAndRequestPermission(permission, options = {}) {
    try {
      const { showAlert = true } = options;
      let status;
      let isGranted = false;

      switch (permission) {
        case 'camera':
          status = await Camera.requestCameraPermissionsAsync();
          isGranted = status.status === 'granted';
          break;
        case 'microphone':
          status = await Camera.requestMicrophonePermissionsAsync();
          isGranted = status.status === 'granted';
          break;
        case 'mediaLibrary':
          status = await MediaLibrary.requestPermissionsAsync();
          isGranted = status.status === 'granted';
          break;
        case 'notifications':
          isGranted = await this.requestNotificationPermissions();
          break;
        default:
          throw new Error(`Unknown permission: ${permission}`);
      }

      this.permissions[permission] = isGranted;

      if (!isGranted && showAlert) {
        this.showPermissionAlert(permission);
      }

      return isGranted;
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
      return false;
    }
  }

  async checkMultiplePermissions(permissions) {
    const results = await Promise.all(
      permissions.map(permission => this.checkAndRequestPermission(permission, { showAlert: false }))
    );

    const deniedPermissions = permissions.filter((_, index) => !results[index]);
    if (deniedPermissions.length > 0) {
      this.showMultiplePermissionsAlert(deniedPermissions);
      return false;
    }

    return true;
  }

  showPermissionAlert(permission) {
    const messages = {
      camera: {
        title: 'Camera Permission Required',
        message: 'We need access to your camera to record videos.',
      },
      microphone: {
        title: 'Microphone Permission Required',
        message: 'We need access to your microphone to record audio.',
      },
      mediaLibrary: {
        title: 'Media Library Permission Required',
        message: 'We need access to your media library to save and access videos.',
      },
      notifications: {
        title: 'Notification Permission Required',
        message: 'We need permission to send you notifications for likes, comments, and messages.',
      },
    };

    const settingsAction = permission === 'notifications' ? 'openNotificationSettings' : 'openSettings';

    Alert.alert(
      messages[permission].title,
      messages[permission].message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => this[settingsAction](),
        },
      ],
      { cancelable: true }
    );
  }

  showMultiplePermissionsAlert(permissions) {
    const permissionNames = permissions.join(', ');
    Alert.alert(
      'Permissions Required',
      `We need the following permissions to continue: ${permissionNames}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => this.openSettings(),
        },
      ],
      { cancelable: true }
    );
  }

  async openSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  getPermissionStatus(permission) {
    return this.permissions[permission] || false;
  }

  async checkVideoPermissions() {
    return this.checkMultiplePermissions(['camera', 'microphone', 'mediaLibrary']);
  }

  // Check all app permissions including notifications
  async checkAllPermissions() {
    return this.checkMultiplePermissions(['camera', 'microphone', 'mediaLibrary', 'notifications']);
  }

  // Check notification permissions specifically
  async checkNotificationPermissions() {
    return this.checkAndRequestPermission('notifications');
  }

  // Location permission methods removed
}

export default new PermissionManager();


