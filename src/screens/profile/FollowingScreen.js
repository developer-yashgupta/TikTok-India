import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import api from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const FollowingScreen = ({ navigation, route }) => {
  const [following, setFollowing] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const { userId, username } = route.params;

  const fetchFollowing = async (pageNum = 1) => {
    try {
      setError(null);
      if (pageNum === 1) setLoading(true);
      const response = await api.get(`/users/${userId}/following?page=${pageNum}`);
      const { following, hasMore, page } = response.data;
      
      if (following) {
        if (pageNum === 1) {
          setFollowing(following);
        } else {
          setFollowing(prev => [...prev, ...following]);
        }
        setHasMore(hasMore);
        setPage(page);
        // Fetch suggested users after following
        if (pageNum === 1) fetchSuggestedUsers();
      } else {
        setError('Failed to load following list');
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setError(error.response?.data?.message || 'Failed to load following list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const response = await api.get('/users/suggested');
      if (response.data.success) {
        setSuggestedUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: `${username}'s Following`
    });
  }, [username]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowing();
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      if (response.data.success) {
        // Update suggested users list to show followed state
        setSuggestedUsers(suggestedUsers.map(user => 
          user._id === userId 
            ? { ...user, ...response.data.user }
            : user
        ));
      }
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to follow user'
      );
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/unfollow`);
      if (response.data.success) {
        // Remove user from following list
        setFollowing(following.filter(user => user._id !== userId));
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to unfollow user'
      );
    }
  };

  const renderFollowButton = (user, isSuggested) => {
    if (user._id === currentUser?._id) return null;
    
    if (!isSuggested || user.isFollowing) {
      return (
        <TouchableOpacity 
          style={[styles.unfollowButton]}
          onPress={() => handleUnfollow(user._id)}
        >
          <Text style={styles.unfollowButtonText}>Following</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.followButton}
        onPress={() => handleFollow(user._id)}
      >
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item, index }) => {
    const isSuggested = index >= following.length;
    return (
      <TouchableOpacity
        style={styles.followingItem}
        onPress={() => navigation.navigate('ViewProfile', { userId: item._id })}
      >
        <Image
          source={item.avatar ? { uri: item.avatar } : require('../../../assets/default-avatar.png')}
          style={styles.avatar}
        />
        <View style={styles.followingInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.name}>{item.displayName}</Text>
          {isSuggested && <Text style={styles.suggestedLabel}>Suggested</Text>}
        </View>
        {renderFollowButton(item, isSuggested)}
      </TouchableOpacity>
    );
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchFollowing(page + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFollowing}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allUsers = [...following, ...suggestedUsers];

  return (
    <FlatList
      style={styles.container}
      data={allUsers}
      renderItem={renderUser}
      keyExtractor={item => item._id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons name="people-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Not following anyone yet</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={following.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Following</Text>
        </View>
      )}
      ListFooterComponent={
        <>
          {loading && page > 1 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
          {suggestedUsers.length > 0 && (
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Suggested Users</Text>
            </View>
          )}
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  followingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    color: '#666',
  },
  suggestedLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  unfollowButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginTop: 12,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingMore: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FollowingScreen;
