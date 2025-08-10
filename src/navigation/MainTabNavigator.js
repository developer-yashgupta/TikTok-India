import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import FeedScreen from '../screens/main/FeedScreen';
import VideoFollowingScreen from '../screens/main/VideoFollowingScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import CreationNavigator from './CreationNavigator';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileNavigator from './ProfileNavigator';
import SearchScreen from '../screens/search/SearchScreen';
import ViewProfileScreen from '../screens/profile/ViewProfileScreen';
import VideoPlayerScreen from '../screens/profile/VideoPlayerScreen';
import FollowersScreen from '../screens/profile/FollowersScreen';
import FollowingScreen from '../screens/profile/FollowingScreen';
import ChatScreen from '../screens/messaging/ChatScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import DirectMessagingScreen from '../screens/messaging/DirectMessagingScreen';
import { theme } from '../config/theme';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

const HomeNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="ForYou" component={FeedScreen} />
      <HomeStack.Screen name="VideoFollowing" component={VideoFollowingScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="ViewProfile" component={ViewProfileScreen} />
      <HomeStack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen}
        options={{ 
          presentation: 'modal',
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="UserFollowers" 
        component={FollowersScreen}
        options={{ 
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <HomeStack.Screen
        name="UserFollowing"
        component={FollowingScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <HomeStack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen
        name="DirectMessage"
        component={DirectMessagingScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
    </HomeStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let IconComponent = MaterialIcons;
          const size = 24;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              IconComponent = MaterialIcons;
              break;
            case 'Discover':
              iconName = focused ? 'search' : 'search';
              IconComponent = MaterialIcons;
              break;
            case 'Create':
              return (
                <TouchableOpacity
                  style={[styles.createButton, { transform: [{ scale: focused ? 1.1 : 1 }] }]}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="plus" size={18} color="white" />
                </TouchableOpacity>
              );
            case 'Inbox':
              iconName = focused ? 'mail' : 'mail-outline';
              IconComponent = MaterialIcons;
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              IconComponent = MaterialIcons;
              break;
            default:
              iconName = 'help-outline';
          }

          return (
            <IconComponent
              name={iconName}
              size={size}
              color={focused ? theme.colors.primary : theme.colors.text}
              style={{ opacity: focused ? 1 : 0.8 }}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen 
        name="Create" 
        component={CreationNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={[
                styles.createButton, 
                { 
                  transform: [{ scale: props.accessibilityState?.selected ? 1.1 : 1 }],
                  marginTop: Platform.OS === 'ios' ? 0 : -5
                }
              ]}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="plus" size={18} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen name="Inbox" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000',
    borderTopColor: '#333',
    borderTopWidth: 0.5,
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 5,
  },
  createButton: {
    backgroundColor: '#000',
    width: 45,
    height: 25,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRightColor: '#FF0050',
    borderLeftColor: '#00F2EA',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopColor: '#00F2EA',
    borderBottomColor: '#FF0050',
  },
});

export default MainTabNavigator;
