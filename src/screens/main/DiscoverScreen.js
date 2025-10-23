import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import api from '../../config/api';
import { theme } from '../../config/theme';
import VideoPlayerScreen from '../profile/VideoPlayerScreen';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const VIDEO_WIDTH = (width - (COLUMN_COUNT + 1) * 5) / COLUMN_COUNT; // Account for gaps
const VIDEO_HEIGHT = VIDEO_WIDTH * 1.5;

const DiscoverScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  useEffect(() => {
    loadDiscoverData();
  }, []);

  const loadDiscoverData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/discover', {
        params: {
          limit: 20
        }
      });

      const { hashtags, users, videos } = response.data;
      setTrendingHashtags(hashtags || []);
      setSuggestedUsers(users || []);
      setTrendingVideos(videos || []);
    } catch (error) {
      console.error('Discover data error:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      } else {
        setError('Failed to load discover data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDiscoverData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadDiscoverData();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/discover/search', {
        params: { q: searchQuery }
      });

      if (response.data.success) {
        const { type, hashtags, users, videos } = response.data;
        setTrendingHashtags(hashtags || []);
        setSuggestedUsers(users || []);
        setTrendingVideos(videos || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to search. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagPress = async (hashtag) => {
    setSearchQuery(`#${hashtag}`);
    try {
      setLoading(true);
      const response = await api.get('/discover/search', {
        params: { q: `#${hashtag}` }
      });

      if (response.data.success) {
        const { hashtags, users, videos } = response.data;
        setTrendingHashtags(hashtags || []);
        setSuggestedUsers(users || []);
        setTrendingVideos(videos || []);
      }
    } catch (error) {
      console.error('Error searching hashtag:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to search hashtag'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      if (response.data.success) {
        // Update the user in suggestedUsers list
        setSuggestedUsers(users => 
          users.map(user => 
            user._id === userId 
              ? { ...user, ...response.data.user }
              : user
          )
        );
      }
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to follow user'
      );
    }
  };

  const handleUserPress = (userId) => {
    navigation.navigate('ViewProfile', { userId });
  };

  const handleVideoPress = (video) => {
    const videoIndex = trendingVideos.findIndex(v => v._id === video._id);
    
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
    const formattedVideos = trendingVideos.map(v => ({
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

    setSelectedVideo({
      video: videoData,
      videos: formattedVideos,
      currentIndex: videoIndex,
      initialIndex: videoIndex,
      videoId: video._id,
      userId: video.user._id,
      fromSearch: true,
      searchQuery: searchQuery
    });
    
    setSelectedVideoId(video._id);
    setShowVideoModal(true);
  };

  const handleCloseVideo = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
    setSelectedVideoId(null);
  };

  const handleCommentAdded = (newCount) => {
    // Update video comments count in the list
    if (selectedVideoId) {
      setTrendingVideos(prevVideos =>
        prevVideos.map(video =>
          video._id === selectedVideoId
            ? {
                ...video,
                commentsCount: newCount
              }
            : video
        )
      );

      // Update selected video state
      setSelectedVideo(prev => ({
        ...prev,
        video: {
          ...prev.video,
          commentsCount: newCount
        }
      }));
    }
  };

  const renderHashtag = ({ item }) => (
    <TouchableOpacity 
      style={styles.hashtagItem}
      onPress={() => handleHashtagPress(item.name)}
    >
      <Text style={styles.hashtagName}>#{item.name}</Text>
      <Text style={styles.hashtagCount}>{item.count > 1000 ? `${(item.count/1000).toFixed(1)}K` : item.count}</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item._id)}
    >
      <Image 
        source={{ uri: item.avatar || 'https://via.placeholder.com/150' }} 
        style={styles.userAvatar}
        resizeMode="cover"
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.userStats}>
          {item.followersCount > 1000 
            ? `${(item.followersCount/1000).toFixed(1)}K` 
            : item.followersCount} followers
        </Text>
      </View>
      {item._id !== currentUser?._id && (
        <TouchableOpacity 
          style={[styles.followButton, item.isFollowing && styles.followingButton]}
          onPress={() => handleFollowUser(item._id)}
        >
          <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderVideo = ({ item }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
    >
      <Image 
        source={{ uri: item.thumbnailUrl }}
        style={styles.videoThumbnail}
        resizeMode="cover"
      />
      <View style={styles.videoStats}>
        <FontAwesome name="play" size={12} color="white" />
        <Text style={styles.videoViews}>
          {item.views > 1000 ? `${(item.views/1000).toFixed(1)}K` : item.views}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.videoUser}
        onPress={() => handleUserPress(item.user._id)}
      >
        <Image 
          source={{ uri: item.user.avatar || 'https://via.placeholder.com/150' }} 
          style={styles.videoUserAvatar}
          resizeMode="cover"
        />
        <Text style={styles.videoUsername} numberOfLines={1}>
          @{item.user.username}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (loading) {
      return <ActivityIndicator style={styles.loader} size="large" color="#fff" />;
    }

    return (
      <>
        {/* Hashtags Section */}
        {trendingHashtags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hashtags</Text>
            <FlatList
              data={trendingHashtags}
              renderItem={renderHashtag}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hashtagList}
            />
          </View>
        )}

        {/* Users Section */}
        {suggestedUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users</Text>
            <FlatList
              data={suggestedUsers}
              renderItem={renderUser}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.userList}
            />
          </View>
        )}

        {/* Videos Section */}
        {trendingVideos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <FlatList
              data={trendingVideos}
              renderItem={renderVideo}
              keyExtractor={item => item._id}
              numColumns={3}
              scrollEnabled={false}
              style={styles.videoGrid}
            />
          </View>
        )}

        {/* No Results */}
        {trendingHashtags.length === 0 && suggestedUsers.length === 0 && trendingVideos.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
          </View>
        )}
      </>
    );
  };

  const renderDiscoverContent = () => {
    if (loading) {
      return <ActivityIndicator style={styles.loader} size="large" color="#fff" />;
    }

    return (
      <>
        {/* Trending Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Hashtags</Text>
          <FlatList
            data={trendingHashtags}
            renderItem={renderHashtag}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hashtagList}
          />
        </View>

        {/* Suggested Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Users</Text>
          <FlatList
            data={suggestedUsers}
            renderItem={renderUser}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.userList}
          />
        </View>

        {/* Trending Videos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Videos</Text>
          <FlatList
            data={trendingVideos}
            renderItem={renderVideo}
            keyExtractor={item => item._id}
            numColumns={3}
            scrollEnabled={false}
            style={styles.videoGrid}
          />
        </View>
      </>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDiscoverData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseVideo}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          {selectedVideo && (
            <VideoPlayerScreen
              route={{ 
                params: {
                  ...selectedVideo,
                  onCommentAdded: handleCommentAdded,
                  onClose: handleCloseVideo,
                  isFullscreen: true,
                  commentsEnabled: true
                }
              }}
              navigation={{
                goBack: handleCloseVideo,
                navigate: (screen, params) => {
                  handleCloseVideo();
                    navigation.navigate(screen, params);
                }
              }}
            />
          )}
        </View>
      </Modal>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search videos, users, or hashtags"
          placeholderTextColor="#666"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => {
              setSearchQuery('');
              loadDiscoverData();
            }}
          >
            <FontAwesome name="times-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#fff" />
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDiscoverData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Hashtags</Text>
                <FlatList
                  data={trendingHashtags}
                  renderItem={renderHashtag}
                  keyExtractor={item => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hashtagList}
                />
              </View>
            )}

            {/* Suggested Users */}
            {suggestedUsers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested Users</Text>
                <FlatList
                  data={suggestedUsers}
                  renderItem={renderUser}
                  keyExtractor={item => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.userList}
                />
              </View>
            )}

            {/* Trending Videos */}
            {trendingVideos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending Videos</Text>
                <FlatList
                  data={trendingVideos}
                  renderItem={renderVideo}
                  keyExtractor={item => item._id}
                  numColumns={3}
                  scrollEnabled={false}
                  style={styles.videoGrid}
                />
        </View>
            )}

            {/* No Content */}
            {!trendingHashtags.length && !suggestedUsers.length && !trendingVideos.length && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  {searchQuery ? `No results found for "${searchQuery}"` : 'No content available'}
                </Text>
        </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#111',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 16,
  },
  clearButton: {
    padding: 10,
    marginLeft: 5,
  },
  section: {
    marginBottom: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 10,
  },
  hashtagList: {
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  hashtagItem: {
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashtagName: {
    color: 'white',
    fontSize: 14,
    marginRight: 5,
  },
  hashtagCount: {
    color: '#666',
    fontSize: 12,
  },
  userList: {
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  userItem: {
    width: 150,
    marginRight: 15,
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  displayName: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  userStats: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#ff4747',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 5,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#666',
  },
  videoGrid: {
    paddingHorizontal: 5,
  },
  videoItem: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    marginHorizontal: 2.5,
    marginBottom: 5,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  videoStats: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  videoViews: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  videoUser: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
  videoUsername: {
    color: 'white',
    fontSize: 12,
    flex: 1,
<<<<<<< HEAD
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
=======
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.75)'
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    })
>>>>>>> master
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#ff4747',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default DiscoverScreen;
