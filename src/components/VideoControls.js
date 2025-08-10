import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Share,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { formatNumber } from '../utils/format';
import CommentModal from './CommentModal';
import { FRONTEND_URL } from '../config/constants';

// Import default avatar from assets
const defaultAvatarImage = require('../../assets/default-avatar.png');

const VideoControls = ({
  video,
  onLike,
  onComment,
  onShare,
  onUserPress,
  isActive = false,
  isLiking,
  onCommentAdded
}) => {
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [, forceUpdate] = useState({});

  if (!video || !video.user) {
    console.warn('VideoControls: Missing video or user data');
    return null;
  }

  const user = video.user;
  const videoId = video._id;
  const description = video.description || '';
  const soundName = video.soundName || '';
  const likesCount = video.likesCount || 0;
  const comments = video.commentsCount || 0;
  const shares = video.sharesCount || 0;
  const isLiked = video.isLiked || false;

  const handleShare = async () => {
    if (!videoId) {
      console.warn('VideoControls: Missing video ID');
      return;
    }

    try {
      setIsSharing(true);
      const shareUrl = `${FRONTEND_URL}/video/${videoId}`;
      const shareMessage = description
        ? `${description}\n\nWatch this video on TikTok India: ${shareUrl}`
        : `Watch this video on TikTok India: ${shareUrl}`;

      // For web platform
      if (Platform.OS === 'web' && navigator.share) {
        try {
          await navigator.share({
            title: 'Share Video',
            text: shareMessage,
            url: shareUrl
          });
          if (onShare) onShare(videoId);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Web share error:', error);
            Alert.alert('Error', 'Failed to share video');
          }
        }
        return;
      }

      // For mobile platforms
      const result = await Share.share(
        {
          message: shareMessage,
          url: shareUrl, // iOS only
          title: 'Share Video' // Android only
        },
        {
          dialogTitle: 'Share Video', // Android only
          subject: 'Share Video', // iOS only
          tintColor: theme.colors.primary // iOS only
        }
      );

      if (result.action === Share.sharedAction) {
        // Call onShare callback if provided
        if (onShare) {
          onShare(videoId);
        }
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to share video');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCommentPress = () => {
    if (onComment) {
      onComment();
      setIsCommentModalVisible(true);
    }
  };

  const handleCommentClose = () => {
    setIsCommentModalVisible(false);
  };

  const handleCommentAdded = (newCommentsCount) => {
    if (video && typeof newCommentsCount === 'number') {
      // Call the parent's onCommentAdded if provided
      if (onCommentAdded) {
        onCommentAdded(newCommentsCount);
      }
      // Force a re-render
      forceUpdate({});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.rightControls}>
        <TouchableOpacity 
          style={styles.userContainer} 
          onPress={onUserPress}
          disabled={!onUserPress}
        >
          <Image
            source={user.avatar ? { uri: user.avatar } : defaultAvatarImage}
            style={styles.userAvatar}
            defaultSource={defaultAvatarImage}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLike}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator color="#ff4747" size="small" />
          ) : (
            <>
              <Animated.View>
                <MaterialIcons
                  name={isLiked ? 'favorite' : 'favorite-border'}
                  size={35}
                  color={isLiked ? theme.colors.primary : 'white'}
                />
              </Animated.View>
              <Text style={styles.actionText}>{formatNumber(likesCount)}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCommentPress}
          disabled={!videoId || !onComment}
        >
          <MaterialIcons name="chat-bubble" size={35} color="white" />
          <Text style={styles.actionText}>{formatNumber(comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons name="share" size={35} color="white" />
              {shares > 0 && (
                <Text style={styles.actionText}>{formatNumber(shares)}</Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.username}>@{user.username}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {soundName ? (
          <View style={styles.soundContainer}>
            <MaterialIcons name="music-note" size={15} color="white" />
            <Text style={styles.soundText}>{soundName}</Text>
          </View>
        ) : null}
      </View>

      {videoId && (
        <CommentModal
          visible={isCommentModalVisible}
          videoId={videoId}
          onClose={handleCommentClose}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'android' ? 70 : Platform.OS === 'ios' ? 90 : 20,
  },
  rightControls: {
    position: 'absolute',
    right: 10,
    bottom: Platform.OS === 'android' ? 80 : Platform.OS === 'ios' ? 100 : 20,
    alignItems: 'center',
  },
  userContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 80 : Platform.OS === 'ios' ? 100 : 20,
    left: 10,
    right: 80,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  description: {
    color: 'white',
    marginBottom: 8,
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    color: 'white',
    marginLeft: 4,
  },
});

export default VideoControls;
