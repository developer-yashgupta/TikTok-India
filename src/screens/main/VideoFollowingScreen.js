import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import VideoPlayer from '../../components/VideoPlayer';
import { videoService } from '../../services/videoService';
import { theme } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const VideoFollowingScreen = () => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useSelector(state => state.auth.user);

  const loadVideos = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await videoService.getFollowingFeed(page);
      
      setVideos(prev => [...prev, ...result.videos]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading following feed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (videoId, liked) => {
    try {
      await videoService.toggleLike(videoId);
      // Update video in state
      setVideos(prev => 
        prev.map(video => 
          video.id === videoId 
            ? { ...video, liked, likes: video.likes + (liked ? 1 : -1) }
            : video
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = (videoId) => {
    navigation.navigate('Comments', { videoId });
  };

  const handleShare = async (videoId) => {
    try {
      const shareUrl = await videoService.shareVideo(videoId);
      // Implement share functionality using native share
      if (shareUrl) {
        // Use react-native share
      }
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const renderVideo = ({ item, index }) => {
    return (
      <View style={styles.videoContainer}>
        <VideoPlayer
          uri={item.videoUrl}
          paused={index !== activeVideoIndex}
          onLike={(liked) => handleLike(item.id, liked)}
          onComment={() => handleComment(item.id)}
          onShare={() => handleShare(item.id)}
          user={item.user}
          soundId={item.soundId}
          caption={item.caption}
        />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Videos from accounts you follow will appear here
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadVideos}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        getItemLayout={(data, index) => ({
          length: WINDOW_HEIGHT,
          offset: WINDOW_HEIGHT * index,
          index,
        })}
        contentContainerStyle={videos.length === 0 && styles.emptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
});

export default VideoFollowingScreen;
