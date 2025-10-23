import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';

import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../config/theme';
import { videoService } from '../services/videoService';

const VideoOptionsModal = ({ 
  visible, 
  video, 
  onClose, 
  onVideoUpdated, 
  onVideoDeleted,
  navigation 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!video) {
    return null;
  }

  const handleEditVideo = () => {
    onClose();
    // Navigate to edit video screen through the Create tab
    navigation.navigate('Create', {
      screen: 'EditVideo',
      params: {
        videoId: video._id,
        video: video,
        isEditing: true
      }
    });
  };

  const handleDuplicateVideo = () => {
    onClose();
    // Navigate to create video screen with existing video data
    navigation.navigate('Create', {
      screen: 'VideoCreation',
      params: {
        duplicateVideo: video
      }
    });
  };

  const handleTogglePrivacy = async () => {
    try {
      setIsLoading(true);
      const newPrivacy = video.visibility === 'private' ? 'public' : 'private';
      
      const response = await videoService.updateVideo(video._id, {
        isPrivate: newPrivacy === 'private'
      });

      if (response.success) {
        const updatedVideo = { ...video, visibility: newPrivacy };
        onVideoUpdated(updatedVideo);
        Alert.alert(
          'Success', 
          `Video is now ${newPrivacy === 'private' ? 'private' : 'public'}`
        );
      }
    } catch (error) {
      console.error('Error updating video privacy:', error);
      Alert.alert('Error', 'Failed to update video privacy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDeleteVideo
        }
      ]
    );
  };

  const confirmDeleteVideo = async () => {
    try {
      setIsDeleting(true);
      await videoService.deleteVideo(video._id);
      
      Alert.alert('Success', 'Video deleted successfully');
      onVideoDeleted(video._id);
      onClose();
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'Failed to delete video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportVideo = () => {
    onClose();
    // Navigate to report screen or show report options
    Alert.alert(
      'Report Video',
      'If you believe this video violates our community guidelines, please report it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive' }
      ]
    );
  };

  const handleShareVideo = () => {
    onClose();
    // For now, just show an alert since ShareVideo screen might not exist
    Alert.alert('Share Video', 'Video sharing feature is available through the share button on the video player.');
  };

  const renderOptionButton = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    color = theme.colors.text,
    destructive = false,
    disabled = false 
  }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        disabled && styles.optionButtonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.optionIconContainer}>
        <MaterialIcons 
          name={icon} 
          size={24} 
          color={destructive ? theme.colors.error : color} 
        />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[
          styles.optionTitle,
          destructive && styles.optionTitleDestructive
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        )}
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color={theme.colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose} 
          activeOpacity={1}
        />
        
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[theme.colors.background, theme.colors.background + 'F0']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Video Options</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Video Info */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>
                {video.description || 'Untitled Video'}
              </Text>
              <Text style={styles.videoStats}>
                {video.commentsCount || 0} comments • {video.likesCount || 0} likes
              </Text>
            </View>

            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {/* Edit Options */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupTitle}>Edit</Text>
                
                {renderOptionButton({
                  icon: 'edit',
                  title: 'Edit Video',
                  subtitle: 'Change description, hashtags, and privacy',
                  onPress: handleEditVideo
                })}

                {renderOptionButton({
                  icon: 'content-copy',
                  title: 'Duplicate',
                  subtitle: 'Create a copy of this video',
                  onPress: handleDuplicateVideo
                })}

                {renderOptionButton({
                  icon: video.visibility === 'private' ? 'public' : 'lock',
                  title: video.visibility === 'private' ? 'Make Public' : 'Make Private',
                  subtitle: video.visibility === 'private' 
                    ? 'Share this video with everyone' 
                    : 'Only you can see this video',
                  onPress: handleTogglePrivacy,
                  disabled: isLoading
                })}
              </View>

              {/* Share Options */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupTitle}>Share</Text>
                
                {renderOptionButton({
                  icon: 'share',
                  title: 'Share Video',
                  subtitle: 'Share to social media or copy link',
                  onPress: handleShareVideo
                })}

                {renderOptionButton({
                  icon: 'link',
                  title: 'Copy Link',
                  subtitle: 'Copy video link to clipboard',
                  onPress: () => {
                    const videoLink = `https://yourdomain.com/video/${video._id}`;
                    onClose();
                    Alert.alert('Video Link', videoLink, [
                      { text: 'OK', style: 'default' }
                    ]);
                  }
                })}
              </View>

              {/* Advanced Options */}
              <View style={styles.optionGroup}>
                <Text style={styles.optionGroupTitle}>Advanced</Text>
                
                {renderOptionButton({
                  icon: 'analytics',
                  title: 'View Analytics',
                  subtitle: 'See detailed video performance',
                  onPress: () => {
                    onClose();
                    Alert.alert('Analytics', 'Video analytics feature coming soon!');
                  }
                })}

                {renderOptionButton({
                  icon: 'download',
                  title: 'Download',
                  subtitle: 'Save video to your device',
                  onPress: () => {
                    onClose();
                    Alert.alert('Download', 'Video download feature coming soon');
                  }
                })}
              </View>

              {/* Danger Zone */}
              <View style={styles.optionGroup}>
                <Text style={[styles.optionGroupTitle, { color: theme.colors.error }]}>Danger Zone</Text>
                
                {renderOptionButton({
                  icon: 'report',
                  title: 'Report Video',
                  subtitle: 'Report inappropriate content',
                  onPress: handleReportVideo,
                  destructive: true
                })}

                {renderOptionButton({
                  icon: 'delete-forever',
                  title: 'Delete Video',
                  subtitle: 'Permanently remove this video',
                  onPress: handleDeleteVideo,
                  destructive: true,
                  disabled: isDeleting
                })}
              </View>
              
              {/* Extra padding to ensure scroll works */}
              <View style={{ height: 50 }} />
            </ScrollView>

            {/* Loading Overlay */}
            {(isLoading || isDeleting) && (
              <View style={styles.loadingOverlay}>
                <BlurView intensity={80} style={styles.loadingBlur}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>
                    {isDeleting ? 'Deleting video...' : 'Updating video...'}
                  </Text>
                </BlurView>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'visible',
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 5,
  },
  videoInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  videoStats: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionGroup: {
    marginTop: 20,
  },
  optionGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
          backgroundColor: theme.colors.background + '80',
          transform: 'translateY(-1px)',
        }
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      }
    })
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  optionTitleDestructive: {
    color: theme.colors.error,
  },
  optionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBlur: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
});

export default VideoOptionsModal;
