import React, { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
<<<<<<< HEAD
=======
import { WEB_URL, MOBILE_URL } from '../config/constants';
>>>>>>> master

const config = {
  screens: {
    Main: {
      path: '',
<<<<<<< HEAD
      initialRouteName: 'Feed',
      screens: {
        Feed: {
          path: 'home',
          initialRouteName: 'FeedScreen',
          screens: {
            FeedScreen: 'video/:videoId?',
=======
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
>>>>>>> master
          }
        },
        Discover: {
          path: 'discover',
<<<<<<< HEAD
          initialRouteName: 'DiscoverScreen',
          screens: {
            DiscoverScreen: '',
            HashtagVideos: 'tag/:hashtag',
=======
          screens: {
            DiscoverScreen: '',
            HashtagVideos: 'hashtag/:tag',
>>>>>>> master
          }
        },
        Upload: 'upload',
        Inbox: {
          path: 'inbox',
<<<<<<< HEAD
          initialRouteName: 'InboxScreen',
=======
>>>>>>> master
          screens: {
            InboxScreen: '',
            Chat: 'chat/:userId',
          }
        },
        Profile: {
          path: 'me',
<<<<<<< HEAD
          initialRouteName: 'ProfileScreen',
=======
>>>>>>> master
          screens: {
            ProfileScreen: '',
            EditProfile: 'edit',
            Settings: 'settings',
          }
        },
<<<<<<< HEAD
        ViewProfile: 'user/:userId',
        Comments: 'comments/:videoId',
        Search: 'search',
        HashtagVideos: 'hashtag/:tag',
=======
>>>>>>> master
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
<<<<<<< HEAD
  prefixes: ['https://yourdomain.com', 'tiktokindia://'],
=======
  prefixes: [WEB_URL, MOBILE_URL],
>>>>>>> master
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
