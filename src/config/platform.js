import { Platform, Dimensions, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Platform specific constants
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Status bar height for different platforms
export const STATUS_BAR_HEIGHT = Platform.select({
  ios: 44,
  android: StatusBar.currentHeight,
  default: 0,
});

// Bottom navigation height
export const BOTTOM_NAV_HEIGHT = Platform.select({
  ios: 80,
  android: 64,
  default: 60,
});

// Screen dimensions
export const WINDOW_WIDTH = SCREEN_WIDTH;
export const WINDOW_HEIGHT = Platform.select({
  ios: SCREEN_HEIGHT,
  android: SCREEN_HEIGHT - STATUS_BAR_HEIGHT,
  default: SCREEN_HEIGHT,
});

// Mobile container dimensions for web
export const MAX_MOBILE_WIDTH = 450;
export const MOBILE_RATIO = 9 / 16;

// Calculate dimensions to maximize the view while maintaining ratio
export const CONTAINER_WIDTH = isWeb
  ? Math.min(MAX_MOBILE_WIDTH, WINDOW_HEIGHT * 0.5625)
  : WINDOW_WIDTH;

export const CONTAINER_HEIGHT = isWeb
  ? CONTAINER_WIDTH / 0.5625
  : WINDOW_HEIGHT;

// Safe area insets for notched devices
export const DEFAULT_SAFE_AREA_INSETS = {
  top: isIOS ? 44 : STATUS_BAR_HEIGHT,
  bottom: isIOS ? 34 : 0,
  left: 0,
  right: 0,
};

// Platform specific styles
export const platformStyles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
    default: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
    },
  }),
};

// Video player specific constants
export const VIDEO_RESIZE_MODE = Platform.select({
  ios: 'cover',
  android: 'cover',
  default: 'contain',
});

// Touch handling
export const TOUCH_OPACITY = Platform.select({
  ios: 0.8,
  android: 0.6,
  default: 1,
});

// Animation timing
export const ANIMATION_DURATION = Platform.select({
  ios: 300,
  android: 250,
  default: 200,
});
