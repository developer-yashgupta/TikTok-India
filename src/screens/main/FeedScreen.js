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
<<<<<<< HEAD
=======
import { useAuth } from '../../contexts/AuthContext';
>>>>>>> master
import VideoPlayer from '../../components/VideoPlayer';
import VideoControls from '../../components/VideoControls';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { videoService } from '../../services/videoService';
import { messageService } from '../../services/messageService';
import api from '../../config/api';
import axios from 'axios';
<<<<<<< HEAD
=======
import optimizedVideoPreloader from '../../utils/optimizedVideoPreloader';
>>>>>>> master

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

<<<<<<< HEAD
// Mobile-like aspect ratio (9:16 like TikTok)
=======
// Mobile-like aspect ratio (9:16 like TicToc)
>>>>>>> master
const ASPECT_RATIO = 9/16;
const VIDEO_HEIGHT = Platform.OS === 'web' ? Math.min(SCREEN_HEIGHT * 0.9, 900) : SCREEN_HEIGHT;
const VIDEO_WIDTH = Platform.OS === 'web' 
  ? VIDEO_HEIGHT * ASPECT_RATIO // Calculate width based on height for web
  : SCREEN_WIDTH;

<<<<<<< HEAD
// Add these constants at the top
const PRELOAD_AHEAD = 5; // Number of videos to preload ahead
const MAX_CACHE_SIZE = 30; // Maximum number of videos to keep in cache

// Add these memory management constants
const MAX_CONCURRENT_LOADS = 2;
const MEMORY_BUFFER_SIZE = 3; // Keep only 3 videos in memory
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for streaming
=======
// Optimized constants for better performance
const PRELOAD_AHEAD = 3; // Reduced to 3 videos for faster loading
const MAX_CACHE_SIZE = 15; // Reduced cache size to prevent memory issues
const MAX_CONCURRENT_LOADS = 1; // Single concurrent load for stability
const MEMORY_BUFFER_SIZE = 2; // Keep only 2 videos in memory
const CHUNK_SIZE = 512 * 1024; // 512KB chunks for faster streaming
const VIDEO_LOAD_TIMEOUT = 3000; // 3 second timeout for video loads
>>>>>>> master

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
    preload={isActive ? "auto" : "none"}
    bufferConfig={{
      minBufferMs: 1000,
      maxBufferMs: 15000, // Reduced from 30000
      bufferForPlaybackMs: 1000,
      bufferForPlaybackAfterRebufferMs: 2000
    }}
    progressiveLoad={true}
    maxBitRate={1500000} // Reduced from 2500000
    enableHardwareAcceleration={true}
    onBuffer={onBuffer}
    onLoadStart={onLoadStart}
    posterResizeMode="cover"
    ignoreSilentSwitch="ignore"
    onUnload={() => {
      // Force cleanup when video is unloaded
      if (global.gc) global.gc();
    }}
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
  
  // Unload non-visible videos
  useEffect(() => {
    return () => {
      if (!isActive && videoCache.current.has(item.videoUrl)) {
        videoCache.current.delete(item.videoUrl);
        if (global.gc) global.gc();
      }
    };
  }, [isActive, item.videoUrl]);

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
        onLoadStart={() => {}}
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
<<<<<<< HEAD
=======
  const [isTabSwitching, setIsTabSwitching] = useState(false);
>>>>>>> master
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
  const [unreadCount, setUnreadCount] = useState(0);
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
<<<<<<< HEAD
=======
  const { logout } = useAuth();
>>>>>>> master

  useEffect(() => {
    setIsScreenFocused(isFocused);
    // Pause video when screen loses focus
    if (!isFocused) {
      setIsPaused(true);
      console.log('[FeedScreen] Screen lost focus, pausing video');
<<<<<<< HEAD
=======

      // Clear video cache when screen loses focus to free memory
      videoCache.current.clear();
      preloadingRef.current.clear();
      setPreloadedVideos(new Set());

      // Force garbage collection if available
      if (global.gc) global.gc();
>>>>>>> master
    } else {
      setIsPaused(false);
      console.log('[FeedScreen] Screen gained focus, resuming video');
      // Fetch unread count when screen comes into focus
      fetchUnreadCount();
    }
  }, [isFocused]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,  // Increased threshold for earlier detection
    minimumViewTime: 0, // Immediate response
    waitForInteraction: false
  }).current;

  const preloadVideo = useCallback(async (videoUrl, thumbnailUrl, priority = 1) => {
    if (!videoUrl || preloadingRef.current.has(videoUrl)) return;
<<<<<<< HEAD
    
    try {
      preloadingRef.current.add(videoUrl);
      
      // Clean up old videos from cache if we exceed the buffer size
      if (videoCache.current.size >= MEMORY_BUFFER_SIZE) {
        const oldestKey = videoCache.current.keys().next().value;
        videoCache.current.delete(oldestKey);
        
=======

    try {
      preloadingRef.current.add(videoUrl);

      // Clean up old videos from cache if we exceed the buffer size
      if (videoCache.current.size >= MEMORY_BUFFER_SIZE) {
        const cacheEntries = Array.from(videoCache.current.entries());
        // Remove oldest entries, keeping only the most recent ones
        const entriesToRemove = cacheEntries.slice(0, Math.max(1, cacheEntries.length - MEMORY_BUFFER_SIZE + 1));
        entriesToRemove.forEach(([key]) => {
          videoCache.current.delete(key);
        });

>>>>>>> master
        // Force garbage collection if available
        if (global.gc) global.gc();
      }

      // Only preload thumbnail for non-active videos
      if (priority > 1) {
        if (thumbnailUrl) {
<<<<<<< HEAD
          await Image.prefetch(thumbnailUrl);
=======
          try {
            await Image.prefetch(thumbnailUrl);
          } catch (thumbnailError) {
            console.warn('Thumbnail preload failed:', thumbnailError);
          }
>>>>>>> master
        }
        return;
      }

<<<<<<< HEAD
      // Lightweight HEAD request to prepare video
      await fetch(videoUrl, {
        method: 'HEAD',
        headers: {
          'Range': `bytes=0-${CHUNK_SIZE}`
        }
      });

      videoCache.current.set(videoUrl, true);
      
=======
      // Lightweight HEAD request to prepare video with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(videoUrl, {
          method: 'HEAD',
          headers: {
            'Range': `bytes=0-${CHUNK_SIZE}`
          },
          signal: controller.signal
        });

        if (response.ok) {
          videoCache.current.set(videoUrl, {
            timestamp: Date.now(),
            priority,
            loaded: true
          });
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.warn('Video preload timed out:', videoUrl);
        } else {
          console.warn('Video preload failed:', fetchError);
        }
      } finally {
        clearTimeout(timeoutId);
      }

>>>>>>> master
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
    
<<<<<<< HEAD
    // Clear existing preload queue
    setPreloadQueue([]);
    
    // Create preload queue with priorities
    const newPreloadQueue = [];
    
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < videos.length) {
        newPreloadQueue.push({
          videoUrl: videos[nextIndex].videoUrl,
          thumbnailUrl: videos[nextIndex].thumbnailUrl,
          priority: PRELOAD_AHEAD - i + 1 // Higher priority for closer videos
        });
      }
    }
    
    setPreloadQueue(newPreloadQueue);
=======
    // Use optimized preloader for better performance
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < videos.length) {
        const nextVideo = videos[nextIndex];
        const priority = PRELOAD_AHEAD - i + 1; // Higher priority for closer videos
        
        // Add to optimized preloader queue
        optimizedVideoPreloader.addToQueue(
          nextVideo.videoUrl, 
          priority, 
          nextVideo.thumbnailUrl
        );
      }
    }
>>>>>>> master
  }).current;

  useEffect(() => {
    if (preloadQueue.length === 0) return;
<<<<<<< HEAD
    
    const processQueue = async () => {
      // Process items in parallel with a concurrency limit
      const concurrentLoads = 2;
      
      for (let i = 0; i < preloadQueue.length; i += concurrentLoads) {
        const batch = preloadQueue.slice(i, i + concurrentLoads);
        await Promise.all(
          batch.map(item => 
            preloadVideo(item.videoUrl, item.thumbnailUrl, item.priority)
          )
        );
      }
    };
    
    processQueue();
=======

    const processQueue = async () => {
      // Process items sequentially to avoid overwhelming the network
      const maxConcurrent = Math.min(MAX_CONCURRENT_LOADS, preloadQueue.length);

      for (let i = 0; i < Math.min(maxConcurrent, preloadQueue.length); i++) {
        const item = preloadQueue[i];
        // Don't block on individual preloads
        preloadVideo(item.videoUrl, item.thumbnailUrl, item.priority).catch(error => {
          console.warn('Preload queue item failed:', error);
        });
      }

      // Clear processed items from queue
      setPreloadQueue(prev => prev.slice(maxConcurrent));
    };

    // Add small delay to prevent rapid queue processing
    const timeoutId = setTimeout(processQueue, 100);
    return () => clearTimeout(timeoutId);
>>>>>>> master
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
<<<<<<< HEAD
      
      // Get video ID from URL or route params
      const videoId = route.params?.videoId;
      
=======

      // Get video ID from URL or route params
      const videoId = route.params?.videoId;

>>>>>>> master
      if (videoId) {
        console.log('Loading shared video:', videoId);
        try {
          // First fetch the shared video details
          const videoResponse = await api.get(`/videos/${videoId}`);
<<<<<<< HEAD
          
=======

>>>>>>> master
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
<<<<<<< HEAD
          
=======

>>>>>>> master
          if (feedResponse.data.success) {
            if (feedResponse.data.videos && feedResponse.data.videos.length > 0) {
              setVideos(feedResponse.data.videos);
              setPage(2);
              setHasMore(feedResponse.data.hasMore);
<<<<<<< HEAD
              
=======

>>>>>>> master
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
<<<<<<< HEAD
          setError(err.response?.data?.message || 'Failed to load shared video');
=======

          // Handle backend connectivity issues gracefully
          if (err.isBackendError || err.isNetworkError) {
            setError('Unable to connect to server. Please check your internet connection and try again.');
          } else if (err.response?.status === 401) {
            // Handle unauthorized error - logout user
            logout();
          } else {
            setError(err.response?.data?.message || 'Failed to load shared video');
          }
>>>>>>> master
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
<<<<<<< HEAD
          
          console.log('Feed response:', response.data);
          
=======

          console.log('Feed response:', response.data);

>>>>>>> master
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
<<<<<<< HEAD
          if (err.response?.status === 401) {
            // Handle unauthorized error
            navigation.navigate('Login');
=======

          // Handle backend connectivity issues gracefully
          if (err.isBackendError || err.isNetworkError) {
            setError('Unable to connect to server. Please check your internet connection and try again.');
          } else if (err.response?.status === 401) {
            // Handle unauthorized error - logout user
            logout();
>>>>>>> master
          } else {
            setError(err.response?.data?.message || 'Failed to load feed');
          }
        }
      }
    } catch (error) {
      console.error('Error in loadInitialData:', error);
<<<<<<< HEAD
      if (error.response?.status === 401) {
        navigation.navigate('Login');
=======

      // Handle backend connectivity issues gracefully
      if (error.isBackendError || error.isNetworkError) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (error.response?.status === 401) {
        // Handle unauthorized error - logout user
        logout();
>>>>>>> master
      } else {
        setError(error.response?.data?.message || 'Failed to load content');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when component mounts or activeTab changes
  useEffect(() => {
<<<<<<< HEAD
    loadInitialData();
    fetchUnreadCount();
  }, [route.params?.videoId, activeTab]);
=======
    // Only load data if we're not in the middle of a tab switch
    if (!isTabSwitching) {
      loadInitialData();
      fetchUnreadCount();
    }
  }, [route.params?.videoId, activeTab, isTabSwitching]);
>>>>>>> master

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
<<<<<<< HEAD
    
=======

>>>>>>> master
    try {
      setLoading(true);
      const feedEndpoint = activeTab === 'following' ? '/videos/feed/following' : '/videos/feed/foryou';
      const response = await api.get(feedEndpoint, {
        params: {
          page,
          limit: 10
        }
      });
<<<<<<< HEAD
      
      console.log('Fetch more response:', response.data);
      
=======

      console.log('Fetch more response:', response.data);

>>>>>>> master
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
<<<<<<< HEAD
      if (error.response?.status === 401) {
        navigation.navigate('Login');
=======

      // Handle backend connectivity issues gracefully
      if (error.isBackendError || error.isNetworkError) {
        console.log('Backend connectivity issue - stopping pagination');
        setHasMore(false); // Stop trying to load more
      } else if (error.response?.status === 401) {
        // Handle unauthorized error - logout user
        logout();
>>>>>>> master
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
<<<<<<< HEAD
      
=======

>>>>>>> master
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
<<<<<<< HEAD
      Alert.alert('Error', 'Failed to like video');
=======

      // Handle backend connectivity issues gracefully
      if (error.isBackendError || error.isNetworkError) {
        console.log('Backend connectivity issue - like action failed silently');
        // Don't show error to user for like actions when backend is down
      } else {
        // For other errors, you might want to show a toast notification
        console.error('Like action failed:', error.response?.data?.message || error.message);
      }
>>>>>>> master
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
<<<<<<< HEAD
      Alert.alert('Error', error.response?.data?.message || 'Failed to load comments');
=======
      console.error('Error loading comments:', error);

      // Handle backend connectivity issues gracefully
      if (error.isBackendError || error.isNetworkError) {
        Alert.alert('Connection Error', 'Unable to load comments. Please check your internet connection.');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load comments');
      }
>>>>>>> master
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

<<<<<<< HEAD
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
=======
  // Handle share: only update local state when VideoControls reports success
  const handleShare = async (video) => {
    try {
      setVideos(prevVideos =>
        prevVideos.map(v =>
          v._id === video._id
            ? { ...v, sharesCount: (v.sharesCount || 0) + 1 }
            : v
        )
      );
    } catch (_) {}
>>>>>>> master
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
<<<<<<< HEAD
      setError(error.response?.data?.message || 'Failed to follow user');
=======

      // Handle backend connectivity issues gracefully
      if (error.isBackendError || error.isNetworkError) {
        console.log('Backend connectivity issue - follow action failed silently');
        // Don't show error for follow actions when backend is down
      } else {
        setError(error.response?.data?.message || 'Failed to follow user');
      }
>>>>>>> master
    }
  };

  const handleSearch = () => {
    navigation.navigate('Search');
  };

  const handleChat = () => {
    navigation.navigate('ChatList');
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messageService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
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

<<<<<<< HEAD
=======
  // Handle tab switching with proper cleanup and loading state
  const handleTabSwitch = useCallback(async (newTab) => {
    if (newTab === activeTab || isTabSwitching) return;

    console.log(`[FeedScreen] Switching from ${activeTab} to ${newTab}`);
    setIsTabSwitching(true);

    try {
      // Clear video cache and preload queue
      videoCache.current.clear();
      preloadingRef.current.clear();
      setPreloadedVideos(new Set());
      setPreloadQueue([]);

      // Reset active video index
      setActiveVideoIndex(0);

      // Scroll to top
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }

      // Update active tab - this will trigger the useEffect to load new data
      setActiveTab(newTab);

      // Add small delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('[FeedScreen] Error during tab switch:', error);
    } finally {
      setIsTabSwitching(false);
    }
  }, [activeTab, isTabSwitching]);

>>>>>>> master
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
<<<<<<< HEAD
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
=======
           <TouchableOpacity
             style={[styles.tab, activeTab === 'following' && styles.activeTab]}
             onPress={() => handleTabSwitch('following')}
             disabled={isTabSwitching}
           >
             <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
               Following
             </Text>
             {isTabSwitching && activeTab === 'following' && (
               <ActivityIndicator size="small" color="white" style={styles.tabLoader} />
             )}
           </TouchableOpacity>

           <TouchableOpacity
             style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
             onPress={() => handleTabSwitch('for-you')}
             disabled={isTabSwitching}
           >
             <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
               For You
             </Text>
             {isTabSwitching && activeTab === 'for-you' && (
               <ActivityIndicator size="small" color="white" style={styles.tabLoader} />
             )}
           </TouchableOpacity>
         </View>
>>>>>>> master

        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
<<<<<<< HEAD
      {loading && !refreshing && (
        <View style={[styles.loadingContainer, { height: SCREEN_HEIGHT - 90 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
=======
      {(loading || isTabSwitching) && !refreshing && (
        <View style={[styles.loadingContainer, { height: SCREEN_HEIGHT - 90 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {isTabSwitching && (
            <Text style={styles.loadingText}>
              Switching to {activeTab === 'following' ? 'Following' : 'For You'}...
            </Text>
          )}
>>>>>>> master
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
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chatButton: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
<<<<<<< HEAD
=======
  tabLoader: {
    position: 'absolute',
    right: -20,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
>>>>>>> master
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
<<<<<<< HEAD
=======
  loadingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
>>>>>>> master
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


