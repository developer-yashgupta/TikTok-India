import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import messaging, {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus
} from '@react-native-firebase/messaging';
import analytics, { getAnalytics, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { Platform, Alert, Linking, AppState } from 'react-native';
import axios from './axios';

// Firebase configuration - using your existing credentials
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId', 'databaseURL'];
  const missingFields = requiredFields.filter(field =>
    !firebaseConfig[field] || firebaseConfig[field].trim() === ''
  );

  if (missingFields.length > 0) {
    console.error('Firebase configuration incomplete. Missing or empty fields:', missingFields);
    console.error('Please check your .env file and ensure all Firebase environment variables are set');
    return false;
  }

  // Additional validation for API key format
  if (!firebaseConfig.apiKey.startsWith('AIzaSy')) {
    console.error('Firebase API key appears to be malformed - should start with "AIzaSy"');
    return false;
  }
  return true;
};

// Initialize Firebase App using modern API
let firebaseApp = null;
const initializeFirebaseApp = () => {
  try {
    // Check if app is already initialized
    const existingApps = getApps();

    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      return firebaseApp;
    }

    // Validate configuration before initializing
    const configValid = validateFirebaseConfig();

    if (!configValid) {
      console.error('Firebase configuration is invalid. Please check your .env file.');
      return null;
    }

    firebaseApp = initializeApp(firebaseConfig);
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    firebaseApp = null;
    return null;
  }
};

// Initialize Firebase Analytics
export const initializeAnalytics = async () => {
  try {
    await setAnalyticsCollectionEnabled(getAnalytics(), true);
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
  }
};

// Request permission for notifications
export const requestUserPermission = async () => {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.error('No Firebase apps initialized when requesting permission');
      return false;
    }

    const authStatus = await requestPermission(getMessaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Error requesting Firebase messaging permission:', error.message);
    if (error.message.includes('permission') || error.message.includes('denied')) {
      console.warn('Notification permission was denied. User needs to enable notifications in app settings.');
    }
    return false;
  }
};

// Get FCM token
export const getFCMToken = async () => {
  try {
    // Ensure Firebase app is initialized
    const apps = getApps();
    if (apps.length === 0) {
      return null;
    }

    const fcmToken = await getToken(getMessaging());
    return fcmToken || null;
  } catch (error) {
    return null;
  }
};

// Register device token with backend
export const registerDeviceToken = async (userId, token) => {
  try {
    // Validate token before sending
    if (!token || typeof token !== 'string' || token.length === 0) {
      return false;
    }

    const response = await axios.post('/users/register-device', {
      userId,
      deviceToken: token,
      platform: Platform.OS,
    });

    return true;
  } catch (error) {
    return false;
  }
};

// Singleton notification handler to prevent duplicates
let foregroundUnsubscriber = null;
let currentForegroundHandler = null;
let processedNotifications = new Set();
const NOTIFICATION_CACHE_TIME = 5000; // 5 seconds

// Enhanced notification processing state
const notificationProcessingState = {
  processedNotifications: new Map(), // ID -> {timestamp, count}
  maxProcessingCount: 3, // Maximum times a notification can be processed
  cacheTime: 10000, // 10 seconds cache
  isProcessing: false, // Global processing lock
  lastProcessTime: 0,
  minTimeBetweenProcessing: 1000 // 1 second minimum between processing
};

// Enhanced notification loop prevention
const isNotificationLoopSafe = (remoteMessage) => {
  const now = Date.now();
  const notificationId = getNotificationId(remoteMessage);
  
  // Check global processing lock
  if (notificationProcessingState.isProcessing) {
    return false;
  }
  
  // Check minimum time between processing
  if (now - notificationProcessingState.lastProcessTime < notificationProcessingState.minTimeBetweenProcessing) {
    return false;
  }
  
  // Check if notification has been processed too many times
  const notificationData = notificationProcessingState.processedNotifications.get(notificationId);
  if (notificationData) {
    // Check if it's within the cache time
    if (now - notificationData.timestamp < notificationProcessingState.cacheTime) {
      if (notificationData.count >= notificationProcessingState.maxProcessingCount) {
        return false;
      }
      // Increment processing count
      notificationData.count++;
      notificationData.timestamp = now;
    } else {
      // Reset if outside cache time
      notificationProcessingState.processedNotifications.set(notificationId, {
        timestamp: now,
        count: 1
      });
    }
  } else {
    // First time processing this notification
    notificationProcessingState.processedNotifications.set(notificationId, {
      timestamp: now,
      count: 1
    });
  }
  
  return true;
};

// Clean up old notification processing data
const cleanNotificationProcessingCache = () => {
  const now = Date.now();
  const expiredEntries = [];
  
  for (const [id, data] of notificationProcessingState.processedNotifications.entries()) {
    if (now - data.timestamp > notificationProcessingState.cacheTime) {
      expiredEntries.push(id);
    }
  }
  
  expiredEntries.forEach(id => {
    notificationProcessingState.processedNotifications.delete(id);
  });
  
  };

// Set global processing lock with timeout
const setNotificationProcessingLock = (timeout = 2000) => {
  notificationProcessingState.isProcessing = true;
  notificationProcessingState.lastProcessTime = Date.now();
  
  setTimeout(() => {
    notificationProcessingState.isProcessing = false;
  }, timeout);
};

// Clean expired notification IDs from cache
const cleanNotificationCache = () => {
  const now = Date.now();
  const expiredIds = [];
  
  processedNotifications.forEach(entry => {
    if (typeof entry === 'object' && entry.timestamp && (now - entry.timestamp) > NOTIFICATION_CACHE_TIME) {
      expiredIds.push(entry);
    }
  });
  
  expiredIds.forEach(entry => processedNotifications.delete(entry));
};

// Generate unique ID for notification to prevent duplicates
const getNotificationId = (remoteMessage) => {
  return remoteMessage.messageId || 
         `${remoteMessage.from}_${remoteMessage.sentTime}_${remoteMessage.data?.timestamp || Date.now()}`;
};

// Handle notification received while app is in foreground
export const setupForegroundNotificationHandler = (onNotificationReceived) => {
  // If we already have a handler, clean it up first
  if (foregroundUnsubscriber) {
    foregroundUnsubscriber();
    foregroundUnsubscriber = null;
  }

  // Set up new handler
  currentForegroundHandler = onNotificationReceived;
  
  foregroundUnsubscriber = onMessage(getMessaging(), async remoteMessage => {
    try {
      const notificationId = getNotificationId(remoteMessage);
      
      // 🛡️ ENHANCED LOOP PREVENTION
      if (!isNotificationLoopSafe(remoteMessage)) {
        return;
      }
      
      // Set processing lock to prevent concurrent processing
      setNotificationProcessingLock(2000);
      
      // Legacy duplicate check (keeping for backwards compatibility)
      const notificationEntry = {
        id: notificationId,
        timestamp: Date.now()
      };
      
      const isDuplicate = Array.from(processedNotifications).some(entry => {
        return typeof entry === 'object' && entry.id === notificationId;
      });
      
      if (isDuplicate) {
                return;
      }
      
      // Add to legacy processed notifications cache
      processedNotifications.add(notificationEntry);
      
      // Clean old entries periodically
      if (processedNotifications.size % 10 === 0) {
        cleanNotificationCache();
        cleanNotificationProcessingCache();
      }
      
      
      // Don't show alert popup for foreground notifications - handle silently
      // The notification will be processed by the handler below

      // 🔔 Update badge counters based on notification type
      try {
        // Import notification service dynamically to avoid circular dependency
        const { notificationService } = await import('../services/notificationService');
        notificationService.addForegroundNotification(remoteMessage);
      } catch (badgeError) {
        // Error updating badges
      }

      // Call the current handler if it exists (with error boundary)
      if (currentForegroundHandler) {
        try {
          await currentForegroundHandler(remoteMessage);
        } catch (handlerError) {
          // Don't re-throw to prevent breaking the notification system
        }
      }
      
          } catch (error) {
      // Reset processing state if error occurs
      notificationProcessingState.isProcessing = false;
    }
  });

  return foregroundUnsubscriber;
};

// Singleton background notification handler to prevent duplicates
let backgroundUnsubscriber = null;
let currentBackgroundHandler = null;

// Handle notification opened from background/quit state
export const setupBackgroundNotificationHandler = (onNotificationOpened) => {
  // If we already have a handler, clean it up first
  if (backgroundUnsubscriber) {
    backgroundUnsubscriber();
    backgroundUnsubscriber = null;
  }

  // Set up new handler
  currentBackgroundHandler = onNotificationOpened;
  
  backgroundUnsubscriber = onNotificationOpenedApp(getMessaging(), remoteMessage => {
    // Call the current handler if it exists
    if (currentBackgroundHandler) {
      currentBackgroundHandler(remoteMessage);
    }
  });

  return backgroundUnsubscriber;
};

// Get initial notification (when app opened from quit state)
export const getInitialNotificationMessage = async () => {
  try {
    // Use the modern modular API for initial notification
    const messagingInstance = getMessaging();
    const initialNotification = await getInitialNotification(messagingInstance);
    
    if (initialNotification) {
      return initialNotification;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Send local notification (for testing or local alerts)
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    // Note: Firebase messaging doesn't have built-in local notifications
    // You might want to use a different library for local notifications
  } catch (error) {
    // Error sending local notification
  }
};

// Handle token refresh
export const setupTokenRefreshHandler = (onTokenRefresh) => {

  // For Firebase v9 React Native, onTokenRefresh has compatibility issues
  // Let's use a simpler periodic check approach
  let currentToken = null;
  let isChecking = false;

  const checkForTokenRefresh = async () => {
    if (isChecking) return; // Prevent concurrent checks
    isChecking = true;

    try {
      const messagingInstance = getMessaging();
      const newToken = await getToken(messagingInstance);

      if (newToken && typeof newToken === 'string' && newToken !== currentToken) {
        currentToken = newToken;

        if (onTokenRefresh && typeof onTokenRefresh === 'function') {
    try {
      await onTokenRefresh(newToken);
    } catch (callbackError) {
      // Error in onTokenRefresh callback
    }
  }
      }
    } catch (error) {
      // Error checking for token refresh
    } finally {
      isChecking = false;
    }
  };

  // Set up periodic check for token changes
  const intervalId = setInterval(checkForTokenRefresh, 60000); // Check every 60 seconds

  // Try to set up onTokenRefresh listener, but don't fail if it doesn't work
  let unsubscribe = null;
  try {
    // Using the modular API approach to avoid deprecation warnings
    const messagingInstance = getMessaging();
    unsubscribe = onTokenRefresh(messagingInstance, async () => {
      // Get the new token manually since the callback doesn't provide it (onTokenRefresh callback in modular API doesn't pass the token)
      try {
        const newToken = await getToken(messagingInstance);
        
        if (newToken && typeof newToken === 'string' && newToken.length > 0) {
          if (onTokenRefresh && typeof onTokenRefresh === 'function') {
            try {
              await onTokenRefresh(newToken);
            } catch (callbackError) {
              // Error in onTokenRefresh callback
            }
          }
        }
      } catch (error) {
        console.error('Error getting token in refresh handler:', error);
      }
    });
    console.log('onTokenRefresh listener setup (with diagnostic logs)');
  } catch (error) {
    console.warn('onTokenRefresh setup failed, using periodic check only:', error.message);
  }

  // Return cleanup function
  const cleanup = () => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      try {
        unsubscribe();
        console.log('Token refresh listener unsubscribed successfully');
      } catch (error) {
        console.error('Error unsubscribing from token refresh:', error);
      }
    } else if (unsubscribe) {
      console.warn('Token refresh unsubscribe is not a function, skipping unsubscribe');
    }
    
    if (intervalId) {
      clearInterval(intervalId);
      console.log('Token refresh interval cleared');
    }
    
    console.log('Token refresh handler cleaned up');
  };

  console.log('Token refresh handler setup complete');
  return cleanup;
};

// Check if notifications are enabled
export const isNotificationsEnabled = async () => {
  try {
    // For Firebase v9, we use requestPermission to check status
    // If already authorized, it returns the current status without prompting
    const authStatus = await requestPermission(getMessaging());
    return authStatus === AuthorizationStatus.AUTHORIZED ||
           authStatus === AuthorizationStatus.PROVISIONAL;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

// Open notification settings
export const openNotificationSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

// Check and request notification permissions with user guidance
export const ensureNotificationPermissions = async () => {
  try {
    
    // Request permission - if already authorized, it returns current status
    const result = await requestPermission(getMessaging());
    
    if (result === AuthorizationStatus.AUTHORIZED || result === AuthorizationStatus.PROVISIONAL) {
      console.log('Notifications authorized');
      return true;
    } else if (result === AuthorizationStatus.DENIED) {
      console.warn('Notifications denied, showing settings prompt');
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications for this app in your device settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openNotificationSettings }
        ]
      );
      return false;
    } else {
            return false;
    }

  } catch (error) {
    console.error('Error ensuring notification permissions:', error);
    return false;
  }
};

// Initialize Firebase messaging with notification navigation
export const initializeFirebaseMessaging = async (userId, onNotificationReceived, onNotificationOpened, onInitialNotification) => {
  try {
    // Initialize Firebase app first (single attempt)
    const app = initializeFirebaseApp();
    if (!app) {
            return null;
    }

    // Request permission (single attempt)
    let permissionGranted = false;
    try {
      permissionGranted = await ensureNotificationPermissions();
    } catch (permError) {
          }

    if (permissionGranted) {
      // Get FCM token (single attempt)
      let token = null;
      try {
        token = await getFCMToken();
      } catch (tokenError) {
        console.log('FCM token retrieval completed with issues:', tokenError.message);
      }

      if (token && userId) {
        // Register token with backend (non-blocking)
        registerDeviceToken(userId, token).catch(registerError => {
          console.log('Device token registration completed with issues:', registerError.message);
        });
      }

      // Set up handlers
      const unsubscribeForeground = setupForegroundNotificationHandler(onNotificationReceived);
      const unsubscribeBackground = setupBackgroundNotificationHandler(onNotificationOpened);
      const unsubscribeTokenRefresh = setupTokenRefreshHandler(async (newToken) => {
        if (userId && typeof newToken === 'string' && newToken.length > 0) {
          console.log('Token refresh handler received token, registering with backend');
          await registerDeviceToken(userId, newToken);
        } else {
          console.error('Invalid token in refresh handler callback:', {
            userId: !!userId,
            tokenType: typeof newToken,
            tokenLength: newToken?.length,
            tokenValue: newToken ? newToken.substring(0, 20) + '...' : 'null/undefined'
          });
        }
      });

      // Check for initial notification (app opened from killed state)
      if (onInitialNotification) {
        try {
          const initialNotification = await getInitialNotificationMessage();
          if (initialNotification) {
                        // Small delay to ensure navigation is ready
            setTimeout(() => {
              onInitialNotification(initialNotification);
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Error processing initial notification:', error);
        }
      }

      // Initialize analytics
      try {
        await initializeAnalytics();
      } catch (analyticsError) {
        console.error('Error initializing Firebase Analytics:', analyticsError);
      }

      return {
        unsubscribeForeground,
        unsubscribeBackground,
        unsubscribeTokenRefresh,
        token,
        getInitialNotification: getInitialNotificationMessage
      };
    } else {
            return null;
    }
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};

// Clean up subscriptions
export const cleanupFirebaseMessaging = (subscriptions) => {
  if (subscriptions) {
    if (subscriptions.unsubscribeForeground) {
      subscriptions.unsubscribeForeground();
    }
    if (subscriptions.unsubscribeBackground) {
      subscriptions.unsubscribeBackground();
    }
    if (subscriptions.unsubscribeTokenRefresh) {
      subscriptions.unsubscribeTokenRefresh();
    }
  }
};

// Clean up all notification handlers (singleton cleanup)
export const cleanupAllNotificationHandlers = () => {
  console.log('Cleaning up all notification handlers');
  
  // Clean up foreground handler
  if (foregroundUnsubscriber) {
    try {
      foregroundUnsubscriber();
      foregroundUnsubscriber = null;
      currentForegroundHandler = null;
      console.log('Foreground notification handler cleaned up');
    } catch (error) {
      console.error('Error cleaning up foreground handler:', error);
    }
  }
  
  // Clean up background handler
  if (backgroundUnsubscriber) {
    try {
      backgroundUnsubscriber();
      backgroundUnsubscriber = null;
      currentBackgroundHandler = null;
      console.log('Background notification handler cleaned up');
    } catch (error) {
      console.error('Error cleaning up background handler:', error);
    }
  }
  
  // Clear notification cache
  processedNotifications.clear();
  console.log('Notification cache cleared');
  
  console.log('All notification handlers cleaned up');
};

// 🔄 EMERGENCY NOTIFICATION LOOP RESET - Call this to completely reset all notification state
export const resetNotificationLoopPrevention = () => {
  console.log('🔄 EMERGENCY: Resetting all notification loop prevention systems');
  
  try {
    // Reset enhanced processing state
    notificationProcessingState.processedNotifications.clear();
    notificationProcessingState.isProcessing = false;
    notificationProcessingState.lastProcessTime = 0;
    
    // Reset legacy cache
    processedNotifications.clear();
    
    // Clean up all handlers
    cleanupAllNotificationHandlers();
    
        return true;
  } catch (error) {
    console.error('❌ Error resetting notification systems:', error);
    return false;
  }
};

// Export the reset function and processing state for debugging
export { notificationProcessingState };

// Test Firebase initialization (for debugging only)
export const testFirebaseInitialization = async () => {
  try {
    const configValid = validateFirebaseConfig();
    const app = initializeFirebaseApp();
    const apps = getApps();

    return {
      configValid,
      appInitialized: !!app,
      appsCount: apps.length
    };
  } catch (error) {
    console.error('Firebase test failed:', error.message);
    return { error: error.message };
  }
};

// Check if Firebase is available and working
export const isFirebaseAvailable = () => {
  try {
    const apps = getApps();
    return apps.length > 0;
  } catch (error) {
    console.error('Firebase availability check failed:', error.message);
    return false;
  }
};

// Safe Firebase initialization that won't crash the app
export const safeInitializeFirebase = async () => {
  try {
    console.log('Attempting safe Firebase initialization...');

    // Check if Firebase packages are available
    if (!initializeApp || !getApps || !messaging) {
      console.warn('Firebase packages not available, skipping initialization');
      return false;
    }

    const app = initializeFirebaseApp();
    if (app) {
            return true;
    } else {
      console.warn('Firebase initialization failed, but app will continue');
      return false;
    }
  } catch (error) {
    console.warn('Firebase initialization error, but app will continue:', error.message);
    return false;
  }
};

export {
  firebaseConfig,
  messaging,
  analytics,
  initializeFirebaseApp,
};
export default messaging;