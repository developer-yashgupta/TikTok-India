import { Dimensions, Platform, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';
<<<<<<< HEAD
=======
import { VIDEO_CONFIG } from '../config/videoConfig';
>>>>>>> master

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for scaling (based on standard iPhone 11)
const baseWidth = 375;
const baseHeight = 812;

// Scaling functions
export const scale = (size) => (SCREEN_WIDTH / baseWidth) * size;
export const verticalScale = (size) => (SCREEN_HEIGHT / baseHeight) * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Device type detection
export const isTablet = async () => {
  const deviceType = await Device.getDeviceTypeAsync();
  return deviceType === Device.DeviceType.TABLET;
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Pixel density
export const pixelDensity = PixelRatio.get();

// Network status
export const getNetworkStatus = async () => {
  const netInfo = await NetInfo.fetch();
  return {
    isConnected: netInfo.isConnected,
    isWifi: netInfo.type === 'wifi',
    is4G: netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '4g',
    is5G: netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '5g',
  };
};

// Device memory info
export const getDeviceMemory = async () => {
  try {
<<<<<<< HEAD
    const totalMemory = await Device.getTotalMemoryAsync();
    return {
      totalMemory,
      lowMemoryDevice: totalMemory < 2 * 1024 * 1024 * 1024, // Less than 2GB
    };
  } catch (error) {
    console.error('Error getting device memory:', error);
    return { totalMemory: null, lowMemoryDevice: false };
=======
    // Check if getTotalMemoryAsync is available
    if (Device.getTotalMemoryAsync && typeof Device.getTotalMemoryAsync === 'function') {
      const totalMemory = await Device.getTotalMemoryAsync();
      return {
        totalMemory,
        lowMemoryDevice: totalMemory < 2 * 1024 * 1024 * 1024, // Less than 2GB
      };
    } else {
      // Fallback: estimate based on device type
      const deviceType = await Device.getDeviceTypeAsync();
      // Assume older/tablet devices might have less memory
      const lowMemoryDevice = deviceType === Device.DeviceType.TABLET || deviceType < 2;
      return {
        totalMemory: null,
        lowMemoryDevice,
        estimated: true
      };
    }
  } catch (error) {
    console.error('Error getting device memory:', error);
    // Fallback: assume not low memory device
    return { totalMemory: null, lowMemoryDevice: false, error: true };
>>>>>>> master
  }
};

// Performance optimization based on device capabilities
export const getOptimalVideoQuality = async () => {
  const { lowMemoryDevice } = await getDeviceMemory();
  const { isWifi, is4G, is5G } = await getNetworkStatus();
<<<<<<< HEAD
  
  if (lowMemoryDevice) {
    return 'low'; // 480p
  }
  
  if (isWifi || is5G) {
    return 'high'; // 1080p
  }
  
  if (is4G) {
    return 'medium'; // 720p
  }
  
  return 'low'; // Default to low quality
=======

  if (lowMemoryDevice) {
    return VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '360p');
  }

  if (isWifi || is5G) {
    return VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '1080p') ||
           VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '720p');
  }

  if (is4G) {
    return VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '720p') ||
           VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '480p');
  }

  return VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '360p'); // Default to low quality
};

// Dynamic quality selection during playback
export const selectAdaptiveQuality = async (currentQuality, playbackStats) => {
  const { isWifi, is4G, is5G } = await getNetworkStatus();
  const { lowMemoryDevice } = await getDeviceMemory();

  if (lowMemoryDevice) {
    return VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === '360p');
  }

  // If buffering frequently, drop quality
  if (playbackStats.bufferingEvents > 3) {
    const currentIndex = VIDEO_CONFIG.adaptiveBitrate.qualities.findIndex(q => q.resolution === currentQuality.resolution);
    if (currentIndex > 0) {
      return VIDEO_CONFIG.adaptiveBitrate.qualities[currentIndex - 1];
    }
  }

  // If playback is smooth and network is good, increase quality
  if (playbackStats.bufferingEvents === 0 && (isWifi || is5G)) {
    const currentIndex = VIDEO_CONFIG.adaptiveBitrate.qualities.findIndex(q => q.resolution === currentQuality.resolution);
    if (currentIndex < VIDEO_CONFIG.adaptiveBitrate.qualities.length - 1) {
      return VIDEO_CONFIG.adaptiveBitrate.qualities[currentIndex + 1];
    }
  }

  return currentQuality; // Keep current quality
>>>>>>> master
};

// Font scaling
export const normalizeFontSize = (size) => {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Safe area insets
export const getSafeAreaInsets = () => {
  const { StatusBar } = Platform;
  return {
    top: StatusBar.currentHeight || 0,
    bottom: isIOS ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Device specific optimizations
export const getDeviceSpecificConfig = async () => {
  const deviceType = await Device.getDeviceTypeAsync();
  const { lowMemoryDevice } = await getDeviceMemory();
  
  return {
    maxVideoCacheSize: lowMemoryDevice ? 256 * 1024 * 1024 : 512 * 1024 * 1024, // 256MB or 512MB
    maxConcurrentDownloads: lowMemoryDevice ? 2 : 3,
    enableBackgroundPlayback: !lowMemoryDevice,
    preloadNextVideo: !lowMemoryDevice,
    useHEVCCodec: deviceType >= 2, // Use HEVC for newer devices
    maxVideoLength: 60, // seconds
    thumbnailQuality: lowMemoryDevice ? 'medium' : 'high',
    enableHardwareAcceleration: !lowMemoryDevice,
  };
};

// Layout calculations
export const getOptimalGridColumns = async () => {
  const tablet = await isTablet();
  const { width } = Dimensions.get('window');
  
  if (tablet) {
    return width >= 1024 ? 4 : 3;
  }
  
  return width >= 768 ? 3 : 2;
};

// Performance monitoring
export const getPerformanceMetrics = async () => {
  try {
<<<<<<< HEAD
    const memory = await Device.getMemoryAsync();
    const battery = await Device.getBatteryLevelAsync();
    
=======
    let memory = null;
    let battery = null;

    // Check if methods are available
    if (Device.getMemoryAsync && typeof Device.getMemoryAsync === 'function') {
      memory = await Device.getMemoryAsync();
    }

    if (Device.getBatteryLevelAsync && typeof Device.getBatteryLevelAsync === 'function') {
      battery = await Device.getBatteryLevelAsync();
    }

>>>>>>> master
    return {
      memory,
      battery,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return null;
  }
};
<<<<<<< HEAD
=======

// Memory optimization for video playback
export const getMemoryOptimizedVideoConfig = async () => {
  const { lowMemoryDevice } = await getDeviceMemory();
  const { isWifi, is4G, is5G } = await getNetworkStatus();

  if (lowMemoryDevice) {
    return {
      maxBufferMs: 3000, // Very conservative for low memory devices
      minBufferMs: 2000, // Must be >= bufferForPlaybackAfterRebufferMs
      bufferForPlaybackMs: 1000,
      bufferForPlaybackAfterRebufferMs: 1500,
      backBufferDurationMs: 1000,
      maxBitRate: 1000000, // Limit bitrate for low memory
      resolution: 360 // Force lowest resolution
    };
  }

  if (is4G) {
    return {
      maxBufferMs: 4000,
      minBufferMs: 2500, // Must be >= bufferForPlaybackAfterRebufferMs
      bufferForPlaybackMs: 1500,
      bufferForPlaybackAfterRebufferMs: 2000,
      backBufferDurationMs: 2000,
      maxBitRate: 1500000,
      resolution: 480
    };
  }

  // WiFi or 5G - can be more aggressive but still conservative
  return {
    maxBufferMs: 5000,
    minBufferMs: 3000, // Must be >= bufferForPlaybackAfterRebufferMs
    bufferForPlaybackMs: 1500,
    bufferForPlaybackAfterRebufferMs: 2500,
    backBufferDurationMs: 2000,
    maxBitRate: 2500000,
    resolution: 720
  };
};
>>>>>>> master
