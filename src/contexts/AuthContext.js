import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import socketService from '../services/socketService';
import firebaseMessagingService from '../services/firebaseMessagingService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      const storedToken = await authService.getToken();

      if (storedToken && userData) {
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        // Initialize socket connection for authenticated user
        socketService.connect();

        // Initialize Firebase messaging for authenticated user (non-blocking)
        firebaseMessagingService.initialize(userData._id)
          .catch(firebaseError => {
            console.warn('Firebase messaging initialization failed:', firebaseError.message);
          });
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { user: userData, token: authToken } = await authService.login(email, password);
      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);
      // Initialize socket connection after login
      socketService.connect();

      // Initialize Firebase messaging after login (non-blocking)
      firebaseMessagingService.initialize(userData._id)
        .catch(firebaseError => {
          console.warn('Firebase messaging initialization failed:', firebaseError.message);
        });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const { user: newUser, token: authToken } = await authService.register(userData);
      setUser(newUser);
      setToken(authToken);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Disconnect socket on logout
      socketService.disconnect();
      // Clean up Firebase messaging on logout
      firebaseMessagingService.cleanup();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed',
      };
    }
  };

  const updateAuth = async () => {
    try {
      const userData = await authService.getCurrentUser();
      const storedToken = await authService.getToken();

      if (storedToken && userData) {
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        // Initialize socket connection for authenticated user
        socketService.connect();

        // Initialize Firebase messaging for authenticated user (non-blocking)
        firebaseMessagingService.initialize(userData._id)
          .catch(firebaseError => {
            console.warn('Firebase messaging initialization failed:', firebaseError.message);
          });
      } else {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        socketService.disconnect();
        firebaseMessagingService.cleanup();
      }
    } catch (error) {
      console.error('Error updating auth:', error);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      socketService.disconnect();
      firebaseMessagingService.cleanup();
    }
  };

  // Handle authentication errors (401 responses)
  const handleAuthError = async () => {
    console.log('Authentication error detected, logging out user');
    try {
      // Clear all auth data
      await authService.logout();
      socketService.disconnect();
      firebaseMessagingService.cleanup();
      
      // Reset auth state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Error handling auth error:', error);
      // Force reset state even if logout fails
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updateAuth,
    handleAuthError,
  };

  if (loading) {
    return null; 
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
