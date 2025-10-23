import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Video from 'react-native-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import VideoPlayer from '../../components/VideoPlayer';
import HashtagInput from '../../components/creation/HashtagInput';
import LoadingScreen from '../../components/shared/LoadingScreen';
import { theme } from '../../config/theme';
import { validateDescription, validateHashtags } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import { videoService } from '../../services/videoService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EditVideoScreen = ({ route, navigation }) => {
<<<<<<< HEAD
  const { videoUri, videoFile, fileSize } = route.params;
=======
  const { videoUri, videoFile, fileSize, videoId, video: existingVideo, isEditing } = route.params;
>>>>>>> master
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [location, setLocation] = useState(null);

  const [scrollY] = useState(new Animated.Value(0));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
<<<<<<< HEAD
    loadVideoMetadata();
=======
    if (isEditing && existingVideo) {
      // Load existing video data for editing
      loadExistingVideoData();
    } else {
      // Load video metadata for new video
      loadVideoMetadata();
    }
    
>>>>>>> master
    return () => {
      // Cleanup video URL on unmount
      if (Platform.OS === 'web') {
        const blobUrl = localStorage.getItem('currentVideoBlob');
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          localStorage.removeItem('currentVideoBlob');
          localStorage.removeItem('currentVideoFile');
        }
      }
    };
<<<<<<< HEAD
  }, [videoUri]);
=======
  }, [videoUri, isEditing, existingVideo]);

  const loadExistingVideoData = () => {
    if (existingVideo) {
      setDescription(existingVideo.description || '');
      setHashtags(existingVideo.hashtags || []);
      setIsPrivate(existingVideo.visibility === 'private');
      setVideoDuration(existingVideo.duration || 0);
      setVideoDimensions(existingVideo.dimensions || null);
    }
  };
>>>>>>> master

  const loadVideoMetadata = async () => {
    try {
      setError(null);

      // If metadata is already provided in route params, use it
      if (route.params?.duration && route.params?.dimensions) {
        setVideoDuration(route.params.duration);
        setVideoDimensions(route.params.dimensions);
        return;
      }

      if (Platform.OS === 'web') {
        // Web handling remains the same
        const videoFile = route.params.videoFile;
        if (videoFile) {
          localStorage.setItem('currentVideoFile', JSON.stringify({
            type: videoFile.type,
            name: videoFile.name,
            size: videoFile.size
          }));
        }

        const blobUrl = videoUri || (videoFile ? URL.createObjectURL(videoFile) : null);
        if (blobUrl) {
          localStorage.setItem('currentVideoBlob', blobUrl);
        }

        const video = document.createElement('video');
        video.src = blobUrl;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            setVideoDuration(video.duration);
            setVideoDimensions({
              width: video.videoWidth,
              height: video.videoHeight
            });
            resolve();
          };
          video.onerror = () => {
            reject(new Error('Failed to load video metadata'));
          };
        });
      } else {
        // Native platform handling
        const videoAsset = await Video.createAsync(
          { uri: videoUri },
          { shouldPlay: false },
          true // Enable full metadata loading
        );

        const status = await videoAsset.getStatusAsync();
        setVideoDuration(status.durationMillis / 1000);
        setVideoDimensions({
          width: status.width || 0,
          height: status.height || 0
        });
      }
    } catch (error) {
      console.error('Error loading video metadata:', error);
      setError('Failed to load video metadata. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load video metadata. Please try again.'
      );
    }
  };

  const validateVideo = () => {
    if (!videoDuration || !videoDimensions) {
      throw new Error('Video metadata not loaded. Please wait or try again.');
    }

    if (videoDuration > 180) { // 3 minutes max
      throw new Error('Video is too long. Maximum duration is 3 minutes.');
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      throw new Error('Video file is too large. Maximum size is 100MB.');
    }
  };

<<<<<<< HEAD
=======
  const handleUpdateVideo = async () => {
    try {
      setError(null);

      // Validate description
      const descValidation = validateDescription(description);
      if (!descValidation.isValid) {
        throw new Error(descValidation.message);
      }

      // Validate hashtags
      const hashtagValidation = validateHashtags(hashtags);
      if (!hashtagValidation.isValid) {
        throw new Error(hashtagValidation.message);
      }

      setLoading(true);

      // Prepare update data
      const updateData = {
        description: description || '',
        isPrivate: isPrivate || false
      };

      console.log('Updating video with data:', updateData);

      // Update existing video
      const result = await videoService.updateVideo(videoId, updateData);

      console.log('Video update completed successfully:', result);

      // Show success message
      Alert.alert(
        'Success! 🎉',
        'Your video has been updated successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.goBack();
            },
            style: 'default',
          },
        ]
      );

    } catch (error) {
      console.error('Error updating video:', error);
      setError(error.message);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to update video. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

>>>>>>> master
  const handlePost = async () => {
    try {
      setError(null);

      // Validate video
      validateVideo();

      // Validate description
      const descValidation = validateDescription(description);
      if (!descValidation.isValid) {
        throw new Error(descValidation.message);
      }

      // Validate hashtags
      const hashtagValidation = validateHashtags(hashtags);
      if (!hashtagValidation.isValid) {
        throw new Error(hashtagValidation.message);
      }

      setLoading(true);

      // Prepare video data
      const videoData = {
        videoUri: videoUri,
        videoFile: Platform.OS === 'web' ? route.params.videoFile : null,
        description: description || '',
        hashtags: hashtags || [],
        location: location || null,
        isPrivate: isPrivate || false,
        duration: videoDuration,
        dimensions: videoDimensions
      };

      console.log('Starting video upload with data:', {
        platform: Platform.OS,
        hasVideoUri: !!videoUri,
        hasVideoFile: Platform.OS === 'web' ? !!route.params.videoFile : false,
        duration: videoDuration,
        dimensions: videoDimensions
      });

      // Upload video
      const result = await videoService.uploadVideo(videoData, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Upload completed successfully:', {
        videoId: result.video?._id
      });

      // Clean up blob URL
      if (Platform.OS === 'web') {
        const blobUrl = localStorage.getItem('currentVideoBlob');
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          localStorage.removeItem('currentVideoBlob');
          localStorage.removeItem('currentVideoFile');
        }
      }

      // Show success message first
      if (Platform.OS === 'web') {
        // For web, create a styled alert
        const alertContainer = document.createElement('div');
        alertContainer.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #FF4D67, #FF8700);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          text-align: center;
          min-width: 300px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;

        const iconContainer = document.createElement('div');
        iconContainer.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        `;
        iconContainer.style.marginBottom = '16px';

        const messageText = document.createElement('div');
        messageText.textContent = 'Video posted successfully!';
        messageText.style.cssText = `
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 16px;
        `;

        const button = document.createElement('button');
        button.textContent = 'Continue';
        button.style.cssText = `
          background: white;
          color: #FF4D67;
          border: none;
          padding: 12px 24px;
          border-radius: 24px;
          font-weight: bold;
          cursor: pointer;
          font-size: 16px;
          transition: opacity 0.2s;
        `;
        button.onmouseover = () => button.style.opacity = '0.9';
        button.onmouseout = () => button.style.opacity = '1';
        button.onclick = () => {
          document.body.removeChild(alertContainer);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Feed' } }],
          });
        };

        alertContainer.appendChild(iconContainer);
        alertContainer.appendChild(messageText);
        alertContainer.appendChild(button);
        document.body.appendChild(alertContainer);

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
        `;
        document.body.appendChild(backdrop);

        // Remove both after navigation
        const cleanup = () => {
          if (document.body.contains(alertContainer)) {
            document.body.removeChild(alertContainer);
          }
          if (document.body.contains(backdrop)) {
            document.body.removeChild(backdrop);
          }
        };
        setTimeout(cleanup, 5000); // Cleanup after 5 seconds if user doesn't click
      } else {
        // For mobile, use a styled Alert
        Alert.alert(
          'Success! ðŸŽ‰',
          'Your video has been posted successfully.',
          [
            {
              text: 'View Feed',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { screen: 'Feed' } }],
                });
              },
              style: 'default',
            },
          ],
          {
            cancelable: false,
            titleStyle: {
              color: '#FF4D67',
              fontSize: 20,
              fontWeight: 'bold',
            },
            messageStyle: {
              fontSize: 16,
            },
            containerStyle: {
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              padding: 20,
            },
            buttonStyle: {
              backgroundColor: '#FF4D67',
              borderRadius: 24,
            },
            buttonTextStyle: {
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
            },
          }
        );
      }

    } catch (error) {
      console.error('Error posting video:', error);
      setError(error.message);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to post video. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={24} color="#fff" />
      </TouchableOpacity>
<<<<<<< HEAD
      <Text style={styles.headerTitle}>Edit Video</Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handlePost}
=======
      <Text style={styles.headerTitle}>
        {isEditing && existingVideo ? 'Edit Video' : 'Edit Video'}
      </Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={isEditing && existingVideo ? handleUpdateVideo : handlePost}
>>>>>>> master
        disabled={loading}
      >
        <Feather name="check" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#FF4D67', '#FF8700']}
          style={styles.errorGradient}
        >
          <MaterialIcons name="error" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF4D67', '#FF8700']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
<<<<<<< HEAD
            Uploading video... {uploadProgress}%
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
=======
            {isEditing && existingVideo ? 'Updating video...' : `Uploading video... ${uploadProgress}%`}
          </Text>
          {!isEditing && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          )}
>>>>>>> master
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {renderHeader()}

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.previewContainer}>
<<<<<<< HEAD
          {Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={videoUri}
              style={styles.videoPreview}
              controls
              playsInline
              autoPlay={false}
              muted
              poster={videoUri}
              onLoadedData={() => console.log('Web video loaded successfully')}
              onError={(error) => console.error('Web video loading error:', error)}
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.videoPreview}
              resizeMode="contain"
              repeat={true}
              useNativeControls={true}
              paused={true}
              controls={true}
              poster={videoUri}
              // Using modern buffer configuration
              minBufferMs={15000}
              maxBufferMs={50000}
              bufferForPlaybackMs={2500}
              bufferForPlaybackAfterRebufferMs={5000}
              onLoad={() => console.log('Video loaded successfully')}
              onError={(error) => console.error('Video loading error:', error)}
            />
=======
          {isEditing && existingVideo ? (
            // Show existing video for editing
            Platform.OS === 'web' ? (
              <video
                ref={videoRef}
                src={existingVideo.videoUrl}
                style={styles.videoPreview}
                controls
                playsInline
                autoPlay={false}
                muted
                poster={existingVideo.thumbnailUrl}
                onLoadedData={() => console.log('Web video loaded successfully')}
                onError={(error) => console.error('Web video loading error:', error)}
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: existingVideo.videoUrl }}
                style={styles.videoPreview}
                resizeMode="contain"
                repeat={true}
                useNativeControls={true}
                paused={true}
                controls={true}
                poster={existingVideo.thumbnailUrl}
                // Using modern buffer configuration
                minBufferMs={15000}
                maxBufferMs={50000}
                bufferForPlaybackMs={2500}
                bufferForPlaybackAfterRebufferMs={5000}
                onLoad={() => console.log('Video loaded successfully')}
                onError={(error) => console.error('Video loading error:', error)}
              />
            )
          ) : (
            // Show new video for upload
            Platform.OS === 'web' ? (
              <video
                ref={videoRef}
                src={videoUri}
                style={styles.videoPreview}
                controls
                playsInline
                autoPlay={false}
                muted
                poster={videoUri}
                onLoadedData={() => console.log('Web video loaded successfully')}
                onError={(error) => console.error('Web video loading error:', error)}
              />
            ) : (
                              <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.videoPreview}
                  resizeMode="contain"
                  repeat={true}
                  useNativeControls={true}
                  paused={true}
                  poster={videoUri}
                // Using modern buffer configuration
                minBufferMs={15000}
                maxBufferMs={50000}
                bufferForPlaybackMs={2500}
                bufferForPlaybackAfterRebufferMs={5000}
                onLoad={() => console.log('Video loaded successfully')}
                onError={(error) => console.error('Video loading error:', error)}
              />
            )
>>>>>>> master
          )}
        </View>

        <BlurView intensity={100} style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[
                styles.input,
                isFocused && styles.inputFocused
              ]}
              placeholder="What's this video about?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              maxLength={2200}
            />
            <Text style={styles.charCount}>
              {description.length}/2200
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hashtags</Text>
            <HashtagInput
              hashtags={hashtags}
              onHashtagsChange={setHashtags}
              style={styles.hashtagInput}
            />
          </View>

          <View style={styles.privacyContainer}>
            <View>
              <Text style={styles.privacyLabel}>Private Video</Text>
              <Text style={styles.privacySubtext}>
                Only you can see this video
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.privacyButton,
                isPrivate && styles.privacyButtonActive
              ]}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <MaterialIcons
                name={isPrivate ? 'lock' : 'lock-open'}
                size={24}
                color={isPrivate ? '#fff' : 'rgba(255,255,255,0.7)'}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#000',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputFocused: {
    borderColor: '#FF4D67',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    marginTop: 4,
  },
  hashtagInput: {
    marginTop: 8,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  privacySubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  privacyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyButtonActive: {
    backgroundColor: '#FF4D67',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FF4D67',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
});

export default EditVideoScreen;

