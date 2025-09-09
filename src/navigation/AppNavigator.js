import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import { theme } from '../config/theme';

// Screens
import CommentsScreen from '../screens/main/CommentsScreen';
import ShareScreen from '../screens/main/ShareScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import FollowersScreen from '../screens/profile/FollowersScreen';
import FollowingScreen from '../screens/profile/FollowingScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import ViewProfileScreen from '../screens/profile/ViewProfileScreen';
import DirectMessagingScreen from '../screens/messaging/DirectMessagingScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ChatScreen from '../screens/messaging/ChatScreen';
import HashtagVideosScreen from '../screens/main/HashtagVideosScreen';
import SoundVideosScreen from '../screens/main/SoundVideosScreen';
import VideoCreationScreen from '../screens/creation/VideoCreationScreen';
import EditVideoScreen from '../screens/creation/EditVideoScreen';
import AnalyticsScreen from '../screens/profile/AnalyticsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SearchScreen from '../screens/search/SearchScreen';
import VideoPlayerScreen from '../screens/profile/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          // Main App Stack
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen name="Comments" component={CommentsScreen} />
        <Stack.Screen name="Share" component={ShareScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Followers" component={FollowersScreen} />
        <Stack.Screen name="Following" component={FollowingScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="ViewProfile" component={ViewProfileScreen} />
        <Stack.Screen name="DirectMessage" component={DirectMessagingScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="HashtagVideos" component={HashtagVideosScreen} />
        <Stack.Screen name="SoundVideos" component={SoundVideosScreen} />
        <Stack.Screen name="CreateVideo" component={VideoCreationScreen} />
        <Stack.Screen name="EditVideo" component={EditVideoScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            headerShown: true,
            headerTitle: '',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: 'white',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;

