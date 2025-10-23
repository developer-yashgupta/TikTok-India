import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from './api';

// Create axios instance with custom config
const instance = axios.create({
  baseURL: 'https://tt-backend-128051342343.asia-south1.run.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    // If token exists, add to headers
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      // Clear storage
      await AsyncStorage.multiRemove([TOKEN_KEY, '@auth_user']);
      
      // You might want to redirect to login screen here
      // This requires navigation reference which we'll set up separately
    }
    
    return Promise.reject(error);
  }
);

export default instance;
