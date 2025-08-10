import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import VideoThumbnail from '../../components/VideoThumbnail';
import { theme } from '../../config/theme';
import api from '../../config/api';
import { formatNumber } from '../../utils/format';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const THUMBNAIL_SIZE = width / COLUMN_COUNT;

const HashtagVideosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { hashtag } = route.params;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtagInfo, setHashtagInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHashtagVideos = async () => {
    try {
      const response = await api.get(`/api/hashtags/${hashtag}/videos`);
      setVideos(response.data.videos);
      setHashtagInfo(response.data.hashtagInfo);
    } catch (error) {
      console.error('Error fetching hashtag videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHashtagVideos();
  }, [hashtag]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHashtagVideos();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.hashtagInfo}>
        <Text style={[styles.hashtagTitle, { color: theme.colors.text }]}>
          #{hashtag}
        </Text>
        {hashtagInfo && (
          <Text style={[styles.hashtagStats, { color: theme.colors.textSecondary }]}>
            {formatNumber(hashtagInfo.videoCount)} videos ·{' '}
            {formatNumber(hashtagInfo.viewCount)} views
          </Text>
        )}
      </View>
    </View>
  );

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('VideoFeed', { videoId: item.id })}
      style={styles.videoContainer}
    >
      <VideoThumbnail
        uri={item.thumbnail}
        size={THUMBNAIL_SIZE}
        views={item.views}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.videoGrid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="videocam-off" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No videos found for #{hashtag}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
  },
  hashtagStats: {
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
  },
  videoGrid: {
    padding: theme.spacing.xs,
  },
  videoContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE * 1.5,
    padding: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
  },
});

export default HashtagVideosScreen;
