import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { videoService } from '../../services/videoService';
import VideoThumbnail from '../../components/VideoThumbnail';
import { theme } from '../../config/theme';
import debounce from 'lodash/debounce';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SearchScreen = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const searchVideos = useCallback(
    debounce(async (searchQuery, pageNum = 1) => {
      if (!searchQuery.trim()) {
        setVideos([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await videoService.searchVideos(searchQuery, pageNum);
        
        if (pageNum === 1) {
          setVideos(response.videos);
        } else {
          setVideos(prev => [...prev, ...response.videos]);
        }
        
        setHasMore(response.hasMore);
      } catch (err) {
        setError('Failed to search videos');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleSearch = (text) => {
    setQuery(text);
    setPage(1);
    searchVideos(text, 1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchVideos(query, nextPage);
    }
  };

  const handleVideoPress = (video, index) => {
    if (!video.videoUrl) {
      console.error('Video URL is missing:', video);
      setError('Video URL is missing');
      return;
    }

    // Prepare the video object with all necessary fields
    const videoData = {
      _id: video._id,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      user: video.user,
      description: video.description,
      commentsCount: video.commentsCount || 0,
      likesCount: video.likesCount || 0,
      sharesCount: video.sharesCount || 0,
      isLiked: video.isLiked || false,
      views: video.views || 0,
      createdAt: video.createdAt,
      hashtags: video.hashtags || []
    };

    // Map all videos to ensure they have the same structure
    const formattedVideos = videos.map(v => ({
      _id: v._id,
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl,
      user: v.user,
      description: v.description,
      commentsCount: v.commentsCount || 0,
      likesCount: v.likesCount || 0,
      sharesCount: v.sharesCount || 0,
      isLiked: v.isLiked || false,
      views: v.views || 0,
      createdAt: v.createdAt,
      hashtags: v.hashtags || []
    }));

    navigation.navigate('VideoPlayer', {
      video: videoData,
      videos: formattedVideos,
      currentIndex: index,
      initialIndex: index,
      videoId: video._id,
      userId: video.user._id,
      fromSearch: true,
      searchQuery: query,
      isFullscreen: true,
      commentsEnabled: true
    });
  };

  const handleUserPress = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <VideoThumbnail
            video={item}
            onPress={() => handleVideoPress(item, index)}
            onUserPress={() => handleUserPress(item.user._id)}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          loading && <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        )}
        contentContainerStyle={styles.gridContainer}
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 16,
  },
  gridContainer: {
    padding: 1,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 10,
  },
  loader: {
    padding: 10,
  },
});

export default SearchScreen;
