import React, { useEffect } from 'react';
import { Linking, Platform } from 'react-native';

const config = {
  screens: {
    Main: {
      path: '',
      initialRouteName: 'Feed',
      screens: {
        Feed: {
          path: 'home',
          initialRouteName: 'FeedScreen',
          screens: {
            FeedScreen: 'video/:videoId?',
          }
        },
        Discover: {
          path: 'discover',
          initialRouteName: 'DiscoverScreen',
          screens: {
            DiscoverScreen: '',
            HashtagVideos: 'tag/:hashtag',
          }
        },
        Upload: 'upload',
        Inbox: {
          path: 'inbox',
          initialRouteName: 'InboxScreen',
          screens: {
            InboxScreen: '',
            Chat: 'chat/:userId',
          }
        },
        Profile: {
          path: 'me',
          initialRouteName: 'ProfileScreen',
          screens: {
            ProfileScreen: '',
            EditProfile: 'edit',
            Settings: 'settings',
          }
        },
        ViewProfile: 'user/:userId',
        Comments: 'comments/:videoId',
        Search: 'search',
        HashtagVideos: 'hashtag/:tag',
      }
    },
    Auth: {
      path: 'auth',
      screens: {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        OTPVerification: 'otp-verification',
      }
    }
  }
};

const linking = {
  prefixes: ['https://yourdomain.com', 'tiktokindia://'],
  config,
  getInitialURL: async () => {
    // Get the initial URL if the app was launched with one
    const url = await Linking.getInitialURL();
    if (url) return url;

    // Get the current path from window location if on web
    if (Platform.OS === 'web') {
      const pathname = window.location.pathname;
      return pathname;
    }

    return null;
  },
};

export default linking; 
