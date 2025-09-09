import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import {
  useNavigation,
  useRoute
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { userService } from '../../services/userService';
import { formatNumber } from '../../utils/formatters';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const useGridDimensions = () => {
  const { width: screenWidth } = useWindowDimensions();
  const COLUMN_COUNT = 3;
  const GRID_PADDING = 1;

  const itemWidth = (screenWidth - (GRID_PADDING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;
  const itemHeight = (itemWidth * 16) / 9;

  return {
    itemWidth,
    itemHeight,
    GRID_PADDING,
    COLUMN_COUNT
  };
};

const VideoModal = ({ visible, video, onClose, onNext, onPrevious, isLastVideo, isFirstVideo, onVideoUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleLike = async () => {
    try {
      const response = await videoService.toggleLike(video._id);
      if (response.success) {
        // Update video likes in parent component
        const updatedVideo = { ...video, isLiked: !video.isLiked };
        onVideoUpdate(updatedVideo);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = () => {
    // Navigate to comments screen
    navigation.navigate('Comments', { videoId: video._id });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video!`,
        url: video.videoUrl
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  return (
    <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 10 }]} 
        onPress={onClose}
      >
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.videoWrapper}>
        <View style={styles.fullScreenVideo}>
          <VideoPlayer
            uri={video?.videoUrl}
            style={styles.fullScreenVideo}
            poster={video?.thumbnailUrl}
            isActive={true}
            paused={!isPlaying}
            onLike={handleLike}
          />

          <VideoControls
            video={video}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onUserPress={() => {}}
            isActive={true}
          />

          {!isFirstVideo && (
            <TouchableOpacity 
              style={[styles.navigationButton, styles.previousButton]}
              onPress={onPrevious}
            >
              <Ionicons name="chevron-back" size={36} color="white" />
            </TouchableOpacity>
          )}

          {!isLastVideo && (
            <TouchableOpacity 
              style={[styles.navigationButton, styles.nextButton]}
              onPress={onNext}
            >
              <Ionicons name="chevron-forward" size={36} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const ViewProfileScreen = () => {
  const { itemWidth, itemHeight, GRID_PADDING } = useGridDimensions();
  const styles = makeStyles(itemWidth, itemHeight, GRID_PADDING);
  const COLUMN_COUNT = 3;

  const [userProfile, setUserProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const currentUser = useSelector(state => state.auth.user);
  const { userId } = route.params;

  const loadUserProfile = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await userService.getUserProfile(userId);
      console.log('API Response:', response);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }

      setUserProfile({
        _id: response._id,
        username: response.username,
        displayName: response.displayName,
        avatar: response.avatar,
        bio: response.bio,
        website: response.website,
        location: response.location,
        isVerified: response.isVerified,
        createdAt: response.createdAt,
        followersCount: response.followersCount,
        followingCount: response.followingCount,
        likesCount: response.totalLikes,
        videoCount: response.totalVideos,
        isFollowing: response.isFollowing
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const loadVideos = async (pageNum = 1, showLoading = true) => {
    if (showLoading) {
      setLoadingMore(true);
    }
    try {
      const response = await userService.getUserVideos(userId, pageNum);
      
      if (response.videos) {
        if (pageNum === 1) {
          setVideos(response.videos);
        } else {
          setVideos(prev => [...prev, ...response.videos]);
        }
        setHasMore(response.hasMore);
        setPage(response.page);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      if (pageNum === 1) {
        setError('Failed to load videos');
      }
    } finally {
      setLoadingMore(false);
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const loadMoreVideos = () => {
    if (!loadingMore && hasMore) {
      loadVideos(page + 1);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await Promise.all([
          loadUserProfile(),
          loadVideos(1, true)
        ]);
      } catch (error) {
        if (isMounted) {
          setError('Failed to load profile');
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleFollow = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      const response = await userService.toggleFollow(userId);
      
      if (response.success) {
        setUserProfile(prev => ({
          ...prev,
          followersCount: response.user.followersCount || prev.followersCount + (response.isFollowing ? 1 : -1),
          isFollowing: response.user.isFollowing
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', { 
      recipientId: userId,
      recipientName: userProfile?.username
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([
      loadUserProfile(false),
      loadVideos(1, false)
    ]);
  }, []);

  const navigateToVideo = useCallback((videoId) => {
    navigation.navigate('VideoPlayer', {
      videoId,
      userId: userId,
      autoPlay: true
    });
  }, [navigation, userId]);

  const VideoThumbnail = ({ item }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const thumbnailStyles = styles; // Use styles from closure

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadEnd = () => {
      setIsLoading(false);
    };

    const handleError = (err) => {
      setError(err);
      setIsLoading(false);
      console.warn('Video load error:', err);
    };

    return (
      <TouchableOpacity 
        onPress={() => navigateToVideo(item._id)}
        style={thumbnailStyles.videoThumbnail}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={thumbnailStyles.thumbnail}
          resizeMode="cover"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
        {isLoading && (
          <View style={thumbnailStyles.loadingContainer}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
        {error && (
          <View style={thumbnailStyles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={24} color="#fff" />
          </View>
        )}
        <View style={thumbnailStyles.videoOverlay}>
          <View style={thumbnailStyles.statsRow}>
            <FontAwesome5 name="heart" size={12} color="white" solid={item.isLiked} />
            <Text style={thumbnailStyles.statsText}>
              {formatNumber(item.likesCount)}
            </Text>
          </View>
          <View style={thumbnailStyles.statsRow}>
            <FontAwesome5 name="comment" size={12} color="white" />
            <Text style={thumbnailStyles.statsText}>
              {formatNumber(item.commentsCount)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVideoItem = useCallback(({ item }) => (
    <VideoThumbnail 
      item={item} 
    />
  ), [navigateToVideo]);

  const renderProfileInfo = () => (
    <View style={styles.profileInfo}>
      <Image 
        source={userProfile?.avatar 
          ? { uri: userProfile.avatar }
          : require('../../../assets/default-avatar.png')
        } 
        style={styles.avatar}
        onError={(e) => console.warn('Avatar load error:', e.nativeEvent.error)}
      />
      <Text style={styles.username}>@{userProfile?.username}</Text>
      {userProfile?.displayName && (
        <Text style={styles.displayName}>{userProfile.displayName}</Text>
      )}
      
      <View style={styles.stats}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('UserFollowers', { userId })}
        >
          <Text style={styles.statNumber}>{formatNumber(userProfile?.followersCount)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('UserFollowing', { userId })}
        >
          <Text style={styles.statNumber}>{formatNumber(userProfile?.followingCount)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatNumber(userProfile?.likesCount)}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatNumber(userProfile?.videoCount)}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
      </View>

      {(userProfile?.bio || userProfile?.website || userProfile?.location) && (
        <View style={styles.bio}>
          {userProfile.bio && (
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          )}
          {userProfile.location && (
            <Text style={styles.locationText}>
              <Ionicons name="location-outline" size={14} />
              {userProfile.location}
            </Text>
          )}
          {userProfile.website && (
            <TouchableOpacity>
              <Text style={styles.websiteText}>{userProfile.website}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.actions}>
        {currentUser?._id !== userId && (
          <>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                userProfile?.isFollowing && styles.followingButton,
                followLoading && styles.loadingButton
              ]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <Text style={[
                  styles.actionButtonText, 
                  userProfile?.isFollowing && styles.followingButtonText
                ]}>
                  {userProfile?.isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
            >
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadUserProfile()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userProfile?.username}</Text>
      </View>

      <FlatList
        data={videos}
        numColumns={COLUMN_COUNT}
        renderItem={renderVideoItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderProfileInfo}
        onEndReached={loadMoreVideos}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListFooterComponent={() => loadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
        ListEmptyComponent={() => !loading && (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="video-slash" size={48} color={theme.colors.text} />
            <Text style={styles.emptyText}>No videos yet</Text>
          </View>
        )}
      />
    </View>
  );
};

const makeStyles = (itemWidth, itemHeight, GRID_PADDING) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    padding: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  displayName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 15,
  },
  bio: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  bioText: {
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: 5,
  },
  websiteText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  followingButtonText: {
    color: theme.colors.text,
  },
  loadingButton: {
    opacity: 0.7,
  },
  messageButton: {
    backgroundColor: theme.colors.secondary,
  },
  videoThumbnail: {
    width: itemWidth,
    height: itemHeight,
    margin: GRID_PADDING,
    backgroundColor: theme.colors.border,
    borderRadius: 8,
    overflow: 'hidden'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8
  },
  statsText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 16
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default ViewProfileScreen;
