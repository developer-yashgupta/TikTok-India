import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../config/theme';
import { notificationService } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ item, onPress, onLongPress }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return 'favorite';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'person-add';
      case 'mention':
        return 'alternate-email';
      default:
        return 'notifications';
    }
  };

  const getContent = (notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your video';
      case 'comment':
        return `commented: ${notification.comment?.text || ''}`;
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you in a comment';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]} 
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Image 
        source={item.sender.avatar ? { uri: item.sender.avatar } : require('../../../assets/default-avatar.png')} 
        style={styles.avatar}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.username}>
          {item.sender.displayName || `@${item.sender.username}`}
        </Text>
        <Text style={styles.content}>{getContent(item)}</Text>
        <Text style={styles.time}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={getIcon(item.type)} 
          size={24} 
          color={theme.colors.primary} 
        />
      </View>
      {item.video?.thumbnailUrl && (
        <Image 
          source={{ uri: item.video.thumbnailUrl }} 
          style={styles.thumbnail}
        />
      )}
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (pageNum = 1, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await notificationService.getNotifications(pageNum);
      
      if (pageNum === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setUnreadCount(response.unreadCount);
      setHasMore(response.hasMore);
      setPage(response.currentPage);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchNotifications(1, false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🔔 Clear inbox badge when user visits notifications
  useFocusEffect(
    useCallback(() => {
      notificationService.clearInboxIndicator();
      console.log('🔔 Inbox badge cleared - user visited NotificationsScreen');
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchNotifications(1, false);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      await fetchNotifications(page + 1, false);
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await notificationService.markAsRead([notification._id]);
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id 
              ? { ...n, read: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate based on type
      switch (notification.type) {
        case 'like':
        case 'comment':
          navigation.navigate('VideoPlayer', { 
            videoId: notification.video._id,
            userId: notification.video.user
          });
          break;
        case 'follow':
          navigation.navigate('Profile', { 
            userId: notification.sender._id 
          });
          break;
        case 'mention':
          if (notification.video) {
            navigation.navigate('VideoPlayer', { 
              videoId: notification.video._id,
              userId: notification.video.user
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleLongPress = async (notification) => {
    try {
      await notificationService.deleteNotification(notification._id);
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (loading && !refreshing && !loadingMore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={() => handleNotificationPress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingMore && (
          <ActivityIndicator 
            style={styles.loadingMore} 
            color={theme.colors.primary}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name="notifications-none" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  content: {
    color: theme.colors.text,
    fontSize: 14,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  iconContainer: {
    marginLeft: 'auto',
    marginRight: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },
});

export default NotificationsScreen;
