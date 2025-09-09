import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const NETWORK_STATUS_KEY = '@network_status';
const OFFLINE_QUEUE_KEY = '@offline_queue';

// Network status listener
let unsubscribe = null;

export const initNetworkMonitoring = () => {
  // Remove existing subscription if any
  if (unsubscribe) {
    unsubscribe();
  }

  // Subscribe to network state updates
  unsubscribe = NetInfo.addEventListener(async state => {
    await AsyncStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify({
      isConnected: state.isConnected,
      type: state.type,
      timestamp: Date.now()
    }));

    if (state.isConnected) {
      // Process offline queue when connection is restored
      await processOfflineQueue();
    }
  });
};

export const checkNetworkStatus = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    return {
      isConnected: netInfo.isConnected,
      type: netInfo.type
    };
  } catch (error) {
    console.error('Error checking network status:', error);
    return {
      isConnected: false,
      type: 'none'
    };
  }
};

export const addToOfflineQueue = async (action) => {
  try {
    const queueString = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueString ? JSON.parse(queueString) : [];
    
    queue.push({
      ...action,
      timestamp: Date.now()
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
};

export const processOfflineQueue = async () => {
  try {
    const queueString = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueString) return;

    const queue = JSON.parse(queueString);
    if (!queue.length) return;

    // Clear the queue first to prevent duplicate processing
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);

    // Process each queued action
    for (const action of queue) {
      try {
        // Here you would implement the logic to process each action
        // For example, making API calls that failed while offline
        console.log('Processing offline action:', action);
        
        // Example processing logic:
        // if (action.type === 'CREATE_POST') {
        //   await api.post('/posts', action.data);
        // }
      } catch (error) {
        console.error('Error processing offline action:', error);
        // Re-queue failed actions
        await addToOfflineQueue(action);
      }
    }
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

export const cleanupNetworkMonitoring = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

// Utility function to check if we should use cached data
export const shouldUseCachedData = async (cacheKey, maxAge = 5 * 60 * 1000) => {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return false;

    const { timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    return age < maxAge;
  } catch (error) {
    console.error('Error checking cache age:', error);
    return false;
  }
};

// Utility function to cache data with timestamp
export const cacheData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

// Utility function to get cached data
export const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    return JSON.parse(cached).data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};
