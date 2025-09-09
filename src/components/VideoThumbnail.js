import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = width / 3 - 2;

const VideoThumbnail = ({ video, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: video.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.stats}>
          <Ionicons name="play" size={12} color="white" />
          <Text style={styles.statsText}>
            {video.viewCount > 1000 
              ? `${(video.viewCount / 1000).toFixed(1)}K` 
              : video.viewCount || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE * 1.77, // 16:9 aspect ratio
    margin: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
    padding: 5,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 3,
    fontWeight: '500',
  },
});

export default VideoThumbnail;
