import { Platform } from 'react-native';

// API Configuration
export const API_URL = 'https://tt-backend-128051342343.asia-south1.run.app';

// Media Configuration
export const CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
export const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset';

// App Configuration
export const MAX_VIDEO_DURATION = 60; // in seconds
export const MAX_CAPTION_LENGTH = 150;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_USERNAME_LENGTH = 30;

// Pagination
export const ITEMS_PER_PAGE = 10;
export const COMMENTS_PER_PAGE = 20;

// Cache Configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// File Size Limits
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB in bytes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Video Player Configuration
export const VIDEO_ASPECT_RATIO = 9 / 16;
export const VIDEO_QUALITY = 'auto';

// Authentication
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user_data';

// Base URLs for different environments
// Optionally read from environment when available (Expo web supports EXPO_PUBLIC_* envs)
export const WEB_URL =
  (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL))
    || 'https://TicToc-india.vercel.app'; // Updated with a more realistic domain
export const MOBILE_URL = 'TicTocindia://';

// Export the appropriate URL based on platform
export const FRONTEND_URL = Platform.select({
  web: WEB_URL,
  default: MOBILE_URL,
});

// Social Features
export const MAX_HASHTAGS = 20;
export const MAX_MENTIONS = 20;
