import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import NotificationBadge from '../components/shared/NotificationBadge';
import { theme } from '../config/theme';
import { notificationService } from '../services/notificationService';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  
  // 🔔 Badge state management
  const [badgeState, setBadgeState] = useState({
    chatCount: 0,
    inboxHasUnread: false,
  });

  // Subscribe to badge updates and setup real-time listeners
  useEffect(() => {
    console.log('🔔 MainTabNavigator: Setting up badge management and real-time updates');
    
    // Subscribe to badge updates from notification service
    const unsubscribe = notificationService.subscribeToBadgeUpdates((newBadgeState) => {
      console.log('🔔 Badge state updated in MainTabNavigator:', newBadgeState);
      setBadgeState({
        chatCount: newBadgeState.chatCount || 0,
        inboxHasUnread: newBadgeState.inboxHasUnread || false,
      });
    });

    // Initial sync with server
    notificationService.syncBadgesWithServer();

    // Setup socket listeners for real-time badge updates
    const setupRealtimeBadgeListeners = async () => {
      try {
        const connected = await socketService.connect();
        if (connected && user) {
          console.log('✅ Socket connected for MainTabNavigator badge updates');
          
          // Clean up existing listeners
          socketService.removeAllListeners('global_new_message_badge');
          socketService.removeAllListeners('global_messages_read_badge');
          socketService.removeAllListeners('new_message_notification');
          
          // Listen for new messages globally (for badge updates)
          socketService.onGlobalNewMessage((data) => {
            console.log('🔔 MainTab: Global new message for badge:', data);
            if (data.success && data.data && data.data.senderId !== user._id) {
              // Only increment badge if message is from someone else
              notificationService.handleRealTimeMessage({
                ...data.data,
                currentUserId: user._id
              });
            }
          });
          
          // Listen for messages being read globally (for badge updates)
          socketService.onGlobalMessagesRead((data) => {
            console.log('🔔 MainTab: Global messages read for badge:', data);
            // When messages are read, potentially decrement badge
            notificationService.handleRealTimeMessageRead(data);
          });
          
          // Listen for new message notifications specifically for badges
          socketService.onNewMessageNotification((data) => {
            console.log('🔔 MainTab: New message notification for badge:', data);
            if (data.senderId !== user._id) {
              notificationService.updateChatCount(1);
            }
          });
          
          console.log('✅ MainTabNavigator: Real-time badge listeners setup complete');
        }
      } catch (error) {
        console.error('❌ Error setting up real-time badge listeners:', error);
      }
    };
    
    setupRealtimeBadgeListeners();

    // Cleanup function
    return () => {
      console.log('🔔 MainTabNavigator: Cleaning up badge listeners');
      unsubscribe();
      socketService.removeAllListeners('global_new_message_badge');
      socketService.removeAllListeners('global_messages_read_badge');
      socketService.removeAllListeners('new_message_notification');
    };
  }, [user]);

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
              
              // 🔔 Show chat count badge on Home tab (where ChatList is accessible)
              return (
                <View style={styles.iconContainer}>
                  <IconComponent
                    name={iconName}
                    size={size}
                    color={focused ? theme.colors.primary : theme.colors.text}
                    style={{ opacity: focused ? 1 : 0.8 }}
                  />
                  <NotificationBadge count={badgeState.chatCount} />
                </View>
              );
              
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
              
              // 🔔 Show unread indicator on Inbox tab (for likes, comments, follows, etc.)
              return (
                <View style={styles.iconContainer}>
                  <IconComponent
                    name={iconName}
                    size={size}
                    color={focused ? theme.colors.primary : theme.colors.text}
                    style={{ opacity: focused ? 1 : 0.8 }}
                  />
                  <NotificationBadge showDot={badgeState.inboxHasUnread} />
                </View>
              );
              
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
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainTabNavigator;
