import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store the token
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);

      // Registration only sends OTP, doesn't return token/user yet
      // Token and user are returned after OTP verification
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  verifyRegistrationOTP: async (data) => {
    try {
      const response = await api.post('/auth/verify-registration', data);
      // Store the token and user if provided
      if (response.data?.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      }
      if (response.data?.user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  verifyResetOTP: async (data) => {
    try {
      const response = await api.post('/auth/verify-reset', data);
      return response.data;
    } catch (error) {
      console.error('Reset OTP verification error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return false;

      // Verify token with backend
      try {
        const resp = await api.get('/auth/verify');
        return !!resp.data?.valid;
      } catch (e) {
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates);
      const updatedUser = response.data;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  forgotPassword: async (data) => {
    try {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};

export default authService;


