import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import FollowersScreen from '../screens/profile/FollowersScreen';
import FollowingScreen from '../screens/profile/FollowingScreen';
import VideoPlayerScreen from '../screens/profile/VideoPlayerScreen';
import { theme } from '../config/theme';

const Stack = createStackNavigator();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Followers" 
        component={FollowersScreen}
        options={{ title: 'Followers' }}
      />
      <Stack.Screen 
        name="Following" 
        component={FollowingScreen}
        options={{ title: 'Following' }}
      />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
