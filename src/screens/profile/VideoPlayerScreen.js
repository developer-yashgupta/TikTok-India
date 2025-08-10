import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Modal,
  Share,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoPlayer from '../../components/VideoPlayer';
import VideoControls from '../../components/VideoControls';
import CommentModal from '../../components/CommentModal';
import { theme } from '../../config/theme';
import { videos } from '../../config/api';
import { videoService } from '../../services/videoService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userVideos, setUserVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const insets = useSafeAreaInsets();

  // Get comment-related props from route.params
  const showComments = route.params?.showComments || false;
  const onCommentPress = route.params?.onCommentPress;
  const onCommentClose = route.params?.onCommentClose;

  useEffect(() => {
    if (route.params?.videos) {
      // Use the provided videos array and initial index
      setUserVideos(route.params.videos);
      setCurrentIndex(route.params.initialIndex || 0);
      setVideo(route.params.videos[route.params.initialIndex || 0]);
      setLoading(false);
    } else if (route.params?.video) {
      // Handle single video case
      setVideo(route.params.video);
      setUserVideos([route.params.video]);
      setCurrentIndex(0);
      setLoading(false);
    } else if (route.params?.fromSearch) {
      // Handle search results
      const searchVideos = route.params.videos;
      setUserVideos(searchVideos);
      setCurrentIndex(route.params.currentIndex);
      setVideo(searchVideos[route.params.currentIndex]);
      setLoading(false);
    } else if (route.params?.videoId && route.params?.userId) {
      // Fetch videos if no videos provided
      fetchUserVideos();
    } else {
      setError('Invalid video data');
      setLoading(false);
    }

    return () => {
      // Cleanup when component unmounts
    };
  }, [route.params?.videoId]);

  const fetchUserVideos = async () => {
    try {
      setLoading(true);
      const response = await videos.getUserVideos(route.params.userId, {
        visibility: route.params.fromTab === 'private' ? 'private' : 'public',
        status: route.params.fromTab === 'drafts' ? 'draft' : 'ready'
      });
      
      if (response?.data?.videos) {
        const allVideos = response.data.videos;
        setUserVideos(allVideos);
        const index = allVideos.findIndex(v => v._id === route.params.videoId);
        if (index !== -1) {
          setCurrentIndex(index);
          setVideo(allVideos[index]);
        } else {
          setError('Video not found');
        }
      } else {
        setError('Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoLoad = () => {
    setIsBuffering(false);
    setPlaybackError(null);
  };

  const handleVideoError = (error) => {
    console.error('Video playback error:', error);
    setPlaybackError(error);
    setIsBuffering(false);
  };

  const handleVideoBuffer = ({ isBuffering: buffering }) => {
    setIsBuffering(buffering);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.error) {
      handleVideoError(status.error);
    }
  };

  const retryPlayback = () => {
    setPlaybackError(null);
    setIsBuffering(true);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (currentIndex < userVideos.length - 1) {
      setIsBuffering(true);
      setPlaybackError(null);
      setCurrentIndex(prev => prev + 1);
      setVideo(userVideos[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsBuffering(true);
      setPlaybackError(null);
      setCurrentIndex(prev => prev - 1);
      setVideo(userVideos[currentIndex - 1]);
    }
  };

  const handleLike = async () => {
    try {
      const response = await videoService.toggleLike(video._id);
      if (response.success) {
        // Update current video
        setVideo(prev => ({
          ...prev,
          likesCount: response.likesCount,
          isLiked: response.isLiked,
        }));

        // Update video in userVideos array
        setUserVideos(prevVideos => 
          prevVideos.map(v => 
            v._id === video._id 
              ? {
                  ...v,
                  likesCount: response.likesCount,
                  isLiked: response.isLiked,
                }
              : v
          )
        );
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleComment = async () => {
    if (onCommentPress) {
      onCommentPress();
    }
  };

  const handleCommentClose = () => {
    if (onCommentClose) {
      onCommentClose();
    }
  };

  const handleCommentAdded = (newCount) => {
    // Update current video
    setVideo(prev => ({
      ...prev,
      commentsCount: newCount
    }));

    // Update video in userVideos array
    setUserVideos(prevVideos => 
      prevVideos.map(v => 
        v._id === video._id 
          ? {
              ...v,
              commentsCount: newCount
            }
          : v
      )
    );

    // Call the onCommentAdded callback from route params if it exists
    if (route.params?.onCommentAdded) {
      route.params.onCommentAdded(newCount);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video${video.description ? `: ${video.description}` : ''}`,
        url: video.videoUrl
      });

      // Update share count
      setVideo(prev => ({
        ...prev,
        sharesCount: (prev.sharesCount || 0) + 1,
        shares: ((prev.shares || 0) + 1) // Will convert null to 0 first
      }));

      setUserVideos(prevVideos => 
        prevVideos.map(v => 
          v._id === video._id 
            ? {
                ...v,
                sharesCount: (v.sharesCount || 0) + 1,
                shares: ((v.shares || 0) + 1) // Will convert null to 0 first
              }
            : v
        )
      );
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const loadMoreSearchResults = async () => {
    if (route.params?.fromSearch && route.params?.searchQuery) {
      try {
        const nextPage = Math.floor(userVideos.length / 30) + 1;
        const response = await videoService.searchVideos(route.params.searchQuery, nextPage);
        
        if (response.videos && response.videos.length > 0) {
          setUserVideos(prev => [...prev, ...response.videos]);
        }
      } catch (error) {
        console.error('Error loading more search results:', error);
      }
    }
  };

  useEffect(() => {
    // Load more search results when near the end
    if (route.params?.fromSearch && currentIndex >= userVideos.length - 3) {
      loadMoreSearchResults();
    }
  }, [currentIndex]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserVideos}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="slide"
      onRequestClose={() => navigation.goBack()}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top + 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryPlayback}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : video && video.videoUrl ? (
          <View style={styles.videoWrapper}>
            <VideoPlayer
              uri={video.videoUrl}
              style={styles.fullScreenVideo}
              poster={video.thumbnailUrl}
              isActive={true}
              paused={!isPlaying}
              onLoad={handleVideoLoad}
              onError={handleVideoError}
              onBuffer={handleVideoBuffer}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onLike={handleLike}
              resizeMode="contain"
              bufferConfig={{
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000
              }}
            />

            {isBuffering && (
              <View style={styles.bufferingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}

            {playbackError && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>Failed to play video</Text>
                <TouchableOpacity style={styles.retryButton} onPress={retryPlayback}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {video.user && !playbackError && (
              <VideoControls
                video={video}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onUserPress={() => {
                  navigation.goBack();
                  navigation.navigate('ViewProfile', { userId: video.user._id });
                }}
                isActive={true}
                commentsEnabled={route.params?.commentsEnabled}
                onCommentAdded={handleCommentAdded}
              />
            )}

            {currentIndex > 0 && (
              <TouchableOpacity 
                style={[styles.navigationButton, styles.previousButton]}
                onPress={handlePrevious}
              >
                <Ionicons name="chevron-back" size={36} color="white" />
              </TouchableOpacity>
            )}

            {currentIndex < userVideos.length - 1 && (
              <TouchableOpacity 
                style={[styles.navigationButton, styles.nextButton]}
                onPress={handleNext}
              >
                <Ionicons name="chevron-forward" size={36} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Comments Modal - Only render if video exists */}
        {video && video._id && (
          <CommentModal
            visible={showComments}
            videoId={video._id}
            onClose={handleCommentClose}
            onCommentAdded={handleCommentAdded}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  fullScreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'black',
  },
  navigationButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    zIndex: 10,
  },
  previousButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  bufferingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});

export default VideoPlayerScreen;
