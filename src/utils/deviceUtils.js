import { Dimensions, Platform, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';

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
    const totalMemory = await Device.getTotalMemoryAsync();
    return {
      totalMemory,
      lowMemoryDevice: totalMemory < 2 * 1024 * 1024 * 1024, // Less than 2GB
    };
  } catch (error) {
    console.error('Error getting device memory:', error);
    return { totalMemory: null, lowMemoryDevice: false };
  }
};

// Performance optimization based on device capabilities
export const getOptimalVideoQuality = async () => {
  const { lowMemoryDevice } = await getDeviceMemory();
  const { isWifi, is4G, is5G } = await getNetworkStatus();
  
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
    const memory = await Device.getMemoryAsync();
    const battery = await Device.getBatteryLevelAsync();
    
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
