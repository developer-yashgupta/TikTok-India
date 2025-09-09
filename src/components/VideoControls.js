import React, { useState, useEffect } from 'react';
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
import { shareContent, generateShareUrl } from '../utils/urlHandler';
import api from '../config/api';
import { userService } from '../services/userService';

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
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
      
      // Generate share data with video information
      const shareData = {
        videoId,
        description: description || 'Check out this amazing video!',
        username: user.username || user.displayName || 'User'
      };
      
      // Use shared sharing utility
      const result = await shareContent('video', shareData);

      if (result?.success) {
        // Track share on backend (best-effort)
        try {
          const platform = Platform.OS === 'web' ? 'web' : 'other';
          await api.post(`/videos/${videoId}/share`, { platform });
          
          // Show success feedback
          if (Platform.OS === 'web') {
            // Web: show toast or notification
            console.log('Video shared successfully!');
          } else {
            // Mobile: show alert
            Alert.alert('Success', 'Video shared successfully!');
          }
        } catch (e) {
          console.warn('Share tracking failed:', e?.response?.data || e.message);
          // Don't show error to user if tracking fails
        }
        
        // Call parent share handler
        if (onShare) onShare(videoId);
      } else if (result?.dismissed) {
        // User dismissed share dialog - no action needed
        console.log('Share dialog dismissed');
      } else {
        // Share failed
        console.error('Share failed:', result?.error);
        Alert.alert('Error', 'Failed to share video. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to share video. Please try again.');
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

  // Load follow status when video changes
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (video && video.user) {
        // First check if video already has follow status
        if (video.user.isFollowing !== undefined) {
          setIsFollowing(video.user.isFollowing);
          return;
        }

        // If not, check if user ID is available
        const userId = video.user._id || video.user.id;
        if (userId) {
          try {
            const userProfile = await userService.getUserProfile(userId);
            setIsFollowing(userProfile.isFollowing || false);
          } catch (error) {
            console.error('Error loading follow status:', error);
            setIsFollowing(false);
          }
        } else {
          setIsFollowing(false);
        }
      } else {
        setIsFollowing(false);
      }
    };

    loadFollowStatus();
  }, [video]);

  const handleFollowToggle = async () => {
    console.log('VideoControls Debug: Follow button pressed');
    console.log('VideoControls Debug: Video data:', video);
    console.log('VideoControls Debug: User data:', video?.user);
    console.log('VideoControls Debug: Current follow state:', isFollowing);

    if (!video || !video.user) {
      console.log('VideoControls Debug: Missing video or user data');
      return;
    }

    if (followLoading) {
      console.log('VideoControls Debug: Already loading, ignoring');
      return;
    }

    const userId = video.user._id || video.user.id;
    console.log('VideoControls Debug: User ID to follow/unfollow:', userId);

    if (!userId) {
      console.log('VideoControls Debug: No valid user ID found');
      return;
    }

    setFollowLoading(true);
    try {
      console.log('VideoControls Debug: Calling userService.toggleFollow');
      const result = await userService.toggleFollow(userId);
      console.log('VideoControls Debug: Toggle result:', result);

      // Toggle the local state
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      console.log('VideoControls Debug: Updated local state to:', newFollowState);

    } catch (error) {
      console.error('VideoControls Debug: Error in handleFollowToggle:', error);
      // You could show an alert here
      // Alert.alert('Error', 'Failed to follow/unfollow user');
    } finally {
      setFollowLoading(false);
      console.log('VideoControls Debug: Finished follow toggle operation');
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
            resizeMode="cover"
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
        <View style={styles.userInfoRow}>
          <Text style={styles.username}>@{user.username}</Text>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
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
  followButton: {
    backgroundColor: '#ff2d55',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
    marginLeft: 12,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default VideoControls;
