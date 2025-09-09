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

const FollowersScreen = ({ navigation, route }) => {
  const [followers, setFollowers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const { userId, username } = route.params;

  const fetchFollowers = async (pageNum = 1) => {
    try {
      setError(null);
      if (pageNum === 1) setLoading(true);
      const response = await api.get(`/users/${userId}/followers?page=${pageNum}`);
      const { followers, hasMore, page } = response.data;
      
      if (followers) {
        if (pageNum === 1) {
          setFollowers(followers);
        } else {
          setFollowers(prev => [...prev, ...followers]);
        }
        setHasMore(hasMore);
        setPage(page);
        // Fetch suggested users after followers
        if (pageNum === 1) fetchSuggestedUsers();
      } else {
        setError('Failed to load followers list');
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setError(error.response?.data?.message || 'Failed to load followers list');
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
    fetchFollowers();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: `${username}'s Followers`
    });
  }, [username]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowers();
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      if (response.data.success) {
        // Update followers list to show followed state
        setFollowers(followers.map(follower => 
          follower._id === userId 
            ? { ...follower, ...response.data.user }
            : follower
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
        // Update followers list to show unfollowed state
        setFollowers(followers.map(follower => 
          follower._id === userId 
            ? { ...follower, ...response.data.user }
            : follower
        ));
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to unfollow user'
      );
    }
  };

  const renderFollowButton = (user) => {
    if (user._id === currentUser?._id) return null;
    
    return user.isFollowing ? (
      <TouchableOpacity 
        style={[styles.followButton, styles.followingButton]}
        onPress={() => handleUnfollow(user._id)}
      >
        <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity 
        style={styles.followButton}
        onPress={() => handleFollow(user._id)}
      >
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item, index }) => {
    const isSuggested = index >= followers.length;
    return (
      <TouchableOpacity
        style={styles.followerItem}
        onPress={() => navigation.navigate('ViewProfile', { userId: item._id })}
      >
        <Image
          source={item.avatar ? { uri: item.avatar } : require('../../../assets/default-avatar.png')}
          style={styles.avatar}
        />
        <View style={styles.followerInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.name}>{item.displayName}</Text>
          {isSuggested && <Text style={styles.suggestedLabel}>Suggested</Text>}
        </View>
        {renderFollowButton(item)}
      </TouchableOpacity>
    );
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchFollowers(page + 1);
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchFollowers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allUsers = [...followers, ...suggestedUsers];

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
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={followers.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Followers</Text>
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
  followerItem: {
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
  followerInfo: {
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
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
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
  suggestedLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingMore: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FollowersScreen;
