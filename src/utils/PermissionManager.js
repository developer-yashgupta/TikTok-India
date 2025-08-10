import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';

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
        // Request all permissions on first launch
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

      switch (permission) {
        case 'camera':
          status = await Camera.requestCameraPermissionsAsync();
          break;
        case 'microphone':
          status = await Camera.requestMicrophonePermissionsAsync();
          break;
        case 'mediaLibrary':
          status = await MediaLibrary.requestPermissionsAsync();
          break;
        default:
          throw new Error(`Unknown permission: ${permission}`);
      }

      const isGranted = status.status === 'granted';
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
    };

    Alert.alert(
      messages[permission].title,
      messages[permission].message,
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

  // Location permission methods removed
}

export default new PermissionManager();


