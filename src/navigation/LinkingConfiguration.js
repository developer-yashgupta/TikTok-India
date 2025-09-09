import React, { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { WEB_URL, MOBILE_URL } from '../config/constants';

const config = {
  screens: {
    Main: {
      path: '',
      screens: {
        Home: {
          path: '',
          screens: {
            ForYou: '',
            VideoFollowing: 'following',
            Search: 'search',
            ViewProfile: 'user/:userId',
            VideoPlayer: 'video/:videoId',
            UserFollowers: 'user/:userId/followers',
            UserFollowing: 'user/:userId/following',
            ChatList: 'messages',
            Chat: 'chat/:userId',
            DirectMessage: 'chat/:chatId',
          }
        },
        Discover: {
          path: 'discover',
          screens: {
            DiscoverScreen: '',
            HashtagVideos: 'hashtag/:tag',
          }
        },
        Upload: 'upload',
        Inbox: {
          path: 'inbox',
          screens: {
            InboxScreen: '',
            Chat: 'chat/:userId',
          }
        },
        Profile: {
          path: 'me',
          screens: {
            ProfileScreen: '',
            EditProfile: 'edit',
            Settings: 'settings',
          }
        },
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
  prefixes: [WEB_URL, MOBILE_URL],
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
