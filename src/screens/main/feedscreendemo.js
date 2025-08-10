import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Share,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import VideoPlayer from '../../components/VideoPlayer';
import VideoControls from '../../components/VideoControls';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { videoService } from '../../services/videoService';
import api from '../../config/api';
import axios from 'axios';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Mobile-like aspect ratio (9:16 like TikTok)
const ASPECT_RATIO = 9/16;
const VIDEO_HEIGHT = Platform.OS === 'web' ? Math.min(SCREEN_HEIGHT * 0.9, 900) : SCREEN_HEIGHT;
const VIDEO_WIDTH = Platform.OS === 'web' 
  ? VIDEO_HEIGHT * ASPECT_RATIO // Calculate width based on height for web
  : SCREEN_WIDTH;

// Create a memoized VideoPlayer component
const MemoizedVideoPlayer = memo(({ 
  uri, 
  paused, 
  isActive, 
  video, 
  onLike, 
  onBuffer, 
  onLoadStart 
}) => (
  <VideoPlayer
    uri={uri}
    paused={paused}
    style={styles.video}
    isActive={isActive}
    video={video}
    onLike={onLike}
    resizeMode="contain"
    preload={isActive}
    bufferConfig={{
      minBufferMs: 1000,
      maxBufferMs: 30000,
      bufferForPlaybackMs: 1000,
      bufferForPlaybackAfterRebufferMs: 2000
    }}
    progressiveLoad={true}
    maxBitRate={2500000}
    enableHardwareAcceleration={true}
    onBuffer={onBuffer}
    onLoadStart={onLoadStart}
  />
), (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive && 
         prevProps.paused === nextProps.paused &&
         prevProps.uri === nextProps.uri;
});

// Create a memoized VideoControls component
const MemoizedVideoControls = memo(({ 
  video, 
  onLike, 
  onComment, 
  onShare, 
  onUserPress, 
  isActive 
}) => (
  <VideoControls
    video={video}
    onLike={onLike}
    onComment={onComment}
    onShare={onShare}
    onUserPress={onUserPress}
    isActive={isActive}
  />
), (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
         prevProps.video.likesCount === nextProps.video.likesCount &&
         prevProps.video.commentsCount === nextProps.video.commentsCount;
});

// Create a memoized VideoItem component
const VideoItem = memo(({ 
  item, 
  index, 
  activeVideoIndex, 
  isScreenFocused, 
  isPaused,
  onLike,
  onComment,
  onShare,
  onUserPress,
  preloadVideo,
  videoCache
}) => {
  const isActive = index === activeVideoIndex && isScreenFocused && !isPaused;

  const handleBuffer = useCallback(({ isBuffering }) => {
    if (isBuffering && index === activeVideoIndex) {
      const nextIndexes = [1, 2, 3].map(i => index + i);
      nextIndexes.forEach(nextIndex => {
        const nextVideo = videos[nextIndex];
        if (nextVideo && !videoCache.current.has(nextVideo.videoUrl)) {
          preloadVideo(nextVideo.videoUrl, nextVideo.thumbnailUrl, 1);
        }
      });
    }
  }, [index, activeVideoIndex, preloadVideo]);

  const handleLoadStart = useCallback(() => {
    if (videoCache.current.size > 20) {
      const oldestEntries = Array.from(videoCache.current.keys()).slice(0, 10);
      oldestEntries.forEach(key => videoCache.current.delete(key));
    }
  }, []);

  return (
    <View style={styles.videoContainer}>
      <MemoizedVideoPlayer
        uri={item.videoUrl}
        paused={!isActive}
        isActive={isActive}
        video={item}
        onLike={() => onLike(item._id)}
        onBuffer={handleBuffer}
        onLoadStart={handleLoadStart}
      />
      <MemoizedVideoControls
        video={item}
        onLike={() => onLike(item._id)}
        onComment={() => onComment(item._id)}
        onShare={() => onShare(item)}
        onUserPress={() => onUserPress(item.user._id)}
        isActive={isActive}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.activeVideoIndex === nextProps.activeVideoIndex &&
         prevProps.isScreenFocused === nextProps.isScreenFocused &&
         prevProps.isPaused === nextProps.isPaused &&
         prevProps.item._id === nextProps.item._id &&
         prevProps.item.likesCount === nextProps.item.likesCount &&
         prevProps.item.commentsCount === nextProps.item.commentsCount;
});

const FeedScreen = () => {
  const [activeTab, setActiveTab] = useState('for-you');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [preloadedVideos, setPreloadedVideos] = useState(new Set());
  const [preloadQueue, setPreloadQueue] = useState([]);
  const preloadingRef = useRef(new Set());
  const videoCache = useRef(new Map());

  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const isFocused = useIsFocused();

  useEffect(() => {
    setIsScreenFocused(isFocused);
    // Pause video when screen loses focus
    if (!isFocused) {
      setIsPaused(true);
      console.log('[FeedScreen] Screen lost focus, pausing video');
    } else {
      setIsPaused(false);
      console.log('[FeedScreen] Screen gained focus, resuming video');
    }
  }, [isFocused]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,  // Increased threshold for earlier detection
    minimumViewTime: 0, // Immediate response
    waitForInteraction: false
  }).current;

  const preloadVideo = useCallback(async (videoUrl, thumbnailUrl, priority = 1) => {
    if (!videoUrl || preloadingRef.current.has(videoUrl)) return;
    
    try {
      preloadingRef.current.add(videoUrl);
      
      // Preload thumbnail with lower priority
      if (thumbnailUrl) {
        Image.prefetch(thumbnailUrl).catch(() => {});
      }
      
      // Prepare video for playback
      const response = await fetch(videoUrl, {
        method: 'HEAD',
        priority: priority === 1 ? 'high' : 'normal',
      });
      
      if (response.ok) {
        videoCache.current.set(videoUrl, true);
      }
    } catch (error) {
      console.warn('Preload failed:', error);
    } finally {
      preloadingRef.current.delete(videoUrl);
    }
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    if (!viewableItems.length) return;
    
    const currentIndex = viewableItems[0].index;
    setActiveVideoIndex(currentIndex);
    
    // Clear existing preload queue
    setPreloadQueue([]);
    
    // Preload next 4 videos with decreasing priority
    const preloadIndexes = [1, 2, 3, 4];
    const newPreloadQueue = preloadIndexes
      .map(offset => {
        const nextIndex = currentIndex + offset;
        if (nextIndex < videos.length) {
          return {
            videoUrl: videos[nextIndex].videoUrl,
            thumbnailUrl: videos[nextIndex].thumbnailUrl,
            priority: 5 - offset // Higher priority for closer videos
          };
        }
        return null;
      })
      .filter(Boolean);
    
    setPreloadQueue(newPreloadQueue);
  }).current;

  useEffect(() => {
    if (preloadQueue.length === 0) return;
    
    const processQueue = async () => {
      for (const item of preloadQueue) {
        await preloadVideo(item.videoUrl, item.thumbnailUrl, item.priority);
      }
    };
    
    processQueue();
  }, [preloadQueue, preloadVideo]);

  const renderVideo = useCallback(({ item, index }) => (
    <VideoItem
      item={item}
      index={index}
      activeVideoIndex={activeVideoIndex}
      isScreenFocused={isScreenFocused}
      isPaused={isPaused}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onUserPress={navigateToProfile}
      preloadVideo={preloadVideo}
      videoCache={videoCache}
    />
  ), [activeVideoIndex, isScreenFocused, isPaused, handleLike, handleComment, handleShare, navigateToProfile, preloadVideo]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1); // Reset page number
      
      // Get video ID from URL or route params
      const videoId = route.params?.videoId;
      
      if (videoId) {
        console.log('Loading shared video:', videoId);
        try {
          // First fetch the shared video details
          const videoResponse = await api.get(`/videos/${videoId}`);
          
          if (!videoResponse.data.success) {
            setError('Video not found');
            return;
          }

          // Then fetch feed with shared video
          const feedEndpoint = activeTab === 'following' ? '/videos/feed/following' : '/videos/feed/foryou';
          const feedResponse = await api.get(feedEndpoint, {
            params: {
              page: 1,
              limit: 10,
              sharedVideoId: videoId
            }
          });
          
          if (feedResponse.data.success) {
            if (feedResponse.data.videos && feedResponse.data.videos.length > 0) {
              setVideos(feedResponse.data.videos);
              setPage(2);
              setHasMore(feedResponse.data.hasMore);
              
              // Ensure we're at the top to show shared video
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            } else {
              setError('No videos available');
            }
          } else {
            setError(feedResponse.data.message || 'Failed to load feed');
          }
        } catch (err) {
          console.error('Error loading shared video:', err);
          setError(err.response?.data?.message || 'Failed to load shared video');
          return;
        }
      } else {
        try {
          // Regular feed load
          const feedEndpoint = activeTab === 'following' ? '/videos/feed/following' : '/videos/feed/foryou';
          const response = await api.get(feedEndpoint, {
            params: {
              page: 1,
              limit: 10
            }
          });
          
          console.log('Feed response:', response.data);
          
          if (response.data.success) {
            if (response.data.videos && response.data.videos.length > 0) {
              setVideos(response.data.videos);
              setPage(2);
              setHasMore(response.data.hasMore);
            } else {
              if (activeTab === 'following') {
                setError('Follow some users to see their videos');
              } else {
                setError('No videos available');
              }
            }
          } else {
            setError(response.data.message || 'Failed to load feed');
          }
        } catch (err) {
          console.error('Error loading feed:', err);
          if (err.response?.status === 401) {
            // Handle unauthorized error
            navigation.navigate('Login');
          } else {
            setError(err.response?.data?.message || 'Failed to load feed');
          }
        }
      }
    } catch (error) {
      console.error('Error in loadInitialData:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      } else {
        setError(error.response?.data?.message || 'Failed to load content');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when component mounts or activeTab changes
  useEffect(() => {
    loadInitialData();
  }, [route.params?.videoId, activeTab]);

  useEffect(() => {
    // Handle navigation params for direct video viewing
    if (route.params?.videoId) {
      const findVideoIndex = videos.findIndex(v => v._id === route.params.videoId);
      if (findVideoIndex !== -1) {
        setActiveVideoIndex(findVideoIndex);
        flatListRef.current?.scrollToIndex({
          index: findVideoIndex,
          animated: true
        });
      } else {
        // If video not in current list, fetch it
        fetchSpecificVideo(route.params.videoId);
      }
    }
  }, [route.params?.videoId]);

  const fetchSpecificVideo = async (videoId) => {
    try {
      const response = await videoService.getVideo(videoId);
      if (response.data) {
        setVideos(prevVideos => {
          // Add to beginning if not already present
          const exists = prevVideos.some(v => v._id === response.data._id);
          if (!exists) {
            return [response.data, ...prevVideos];
          }
          return prevVideos;
        });
        setActiveVideoIndex(0);
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true
        });
      }
    } catch (error) {
      console.error('Error fetching specific video:', error);
      Alert.alert('Error', 'Could not load the video');
    }
  };

  // Handle pagination
  const fetchMoreVideos = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const feedEndpoint = activeTab === 'following' ? '/videos/feed/following' : '/videos/feed/foryou';
      const response = await api.get(feedEndpoint, {
        params: {
          page,
          limit: 10
        }
      });
      
      console.log('Fetch more response:', response.data);
      
      if (response.data.success) {
        if (response.data.videos && response.data.videos.length > 0) {
          setVideos(prev => [...prev, ...response.data.videos]);
          setHasMore(response.data.hasMore);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
      } else {
        console.warn('Failed to load more videos:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching more videos:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load more videos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle like
  const handleLike = async (videoId) => {
    try {
      console.log('Handling like for video:', videoId);
      const response = await api.put(`/videos/${videoId}/like`);
      
      if (response.data.success) {
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video._id === videoId
              ? {
                  ...video,
                  isLiked: response.data.isLiked,
                  likesCount: response.data.likesCount
                }
              : video
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to like video');
    }
  };

  // Handle comment
  const handleComment = async (videoId) => {
    try {
      const response = await api.get(`/videos/${videoId}/comments`);
      if (response.data.success) {
        setComments(response.data.comments);
        setShowComments(true);
      } else {
        Alert.alert('Error', 'Failed to load comments');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load comments');
    }
  };

  // Add handleCommentAdded function to update comment count
  const handleCommentAdded = (videoId, newCount) => {
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video._id === videoId
          ? {
              ...video,
              commentsCount: newCount
            }
          : video
      )
    );
  };

  // Add comment
  const addComment = async (videoId) => {
    if (!newComment.trim()) return;
    
    try {
      await videoService.addComment(videoId, newComment);
      const response = await videoService.getComments(videoId);
      setComments(response.comments);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Handle share
  const handleShare = async (video) => {
    try {
      const result = await Share.share({
        message: `Check out this video on TikTok India!`,
        url: video.videoUrl,
      });
      
      if (result.action === Share.sharedAction) {
        await api.post(`/videos/${video._id}/share`);
        // Update video share count locally
        setVideos(prevVideos =>
          prevVideos.map(v =>
            v._id === video._id
              ? { ...v, sharesCount: (v.sharesCount || 0) + 1 }
              : v
          )
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  // Handle profile navigation
  const navigateToProfile = (userId) => {
    if (userId === user?._id) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('ViewProfile', { userId });
    }
  };

  // Follow user
  const handleFollow = async (userId) => {
    try {
      setError(null);
      const response = await api.post(`/users/${userId}/follow`);
      if (response.data.success) {
        // Update local state to reflect the follow
        setVideos(prevVideos =>
          prevVideos.map(video => {
            if (video.user._id === userId) {
              return {
                ...video,
                user: {
                  ...video.user,
                  isFollowing: true
                }
              };
            }
            return video;
          })
        );
      } else {
        setError('Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      setError(error.response?.data?.message || 'Failed to follow user');
    }
  };

  const handleSearch = () => {
    navigation.navigate('Search');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      setActiveVideoIndex(0);
      // Scroll to top after refresh
      if (flatListRef.current && videos.length > 0) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const handleRetry = async () => {
    setError(null);
    setVideos([]); // Clear existing videos
    await loadInitialData();
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff4747" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Top navigation tabs with logo and search
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.liveButton}>
        <Image
        source={require('../../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
        />
        </TouchableOpacity>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              Following
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
            onPress={() => setActiveTab('for-you')}
          >
            <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
              For You
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getItemLayout = useCallback((_, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), []);

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {error ? (
        renderError()
      ) : (
        <View style={styles.feedContainer}>
          <FlatList
            ref={flatListRef}
            data={videos}
            renderItem={renderVideo}
            keyExtractor={useCallback((item) => item._id, [])}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            maxToRenderPerBatch={2}            // Reduced for better performance
            windowSize={3}                      // Optimized window size
            initialNumToRender={1}             // Reduced initial render
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            onEndReached={fetchMoreVideos} // Add this
            onEndReachedThreshold={0.5}    // Add this
            snapToInterval={SCREEN_HEIGHT}
            decelerationRate="fast"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 2
            }}
            getItemLayout={getItemLayout}
            automaticallyAdjustContentInsets={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          />
        </View>
      )}

      {/* Loading indicator */}
      {loading && !refreshing && (
        <View style={[styles.loadingContainer, { height: SCREEN_HEIGHT - 90 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'web' ? 16 : 16,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  liveButton: {
    width: 40,
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 30,
    alignSelf: 'center',
    marginTop: 5,
    
  },
  tab: {
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
    paddingBottom: Platform.OS === 'android' ? 70 : Platform.OS === 'ios' ? 90 : 0,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  feedContainer: {
    flex: 1,
    backgroundColor: 'black',
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  sidebar: {
    position: 'absolute',
    right: 8,
    bottom: Platform.OS === 'web' ? '15%' : 100,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIconContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarText: {
    color: 'white',
    fontSize: 12,
    marginTop: 3,
  },
  videoInfo: {
    position: 'absolute',
    left: 12,
    right: 60,
    bottom: Platform.OS === 'android' ? 80 : Platform.OS === 'ios' ? 100 : 50,
    zIndex: 1,
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff4747',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: Platform.OS === 'android' ? 70 : Platform.OS === 'ios' ? 90 : 0
  }
});

export default memo(FeedScreen);
