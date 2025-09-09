import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import LoadingScreen from '../../components/shared/LoadingScreen';
import { theme } from '../../config/theme';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const WebVideoUploadScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickVideo = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          Alert.alert('Error', 'Video size should be less than 100MB');
          return;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          Alert.alert('Error', 'Please select a valid video file (MP4, WebM, or MOV)');
          return;
        }

        setLoading(true);
        try {
          const url = URL.createObjectURL(file);
          
          // Create video element to get metadata
          const video = document.createElement('video');
          video.src = url;
          
          video.onloadedmetadata = () => {
            handleVideoSelected(url, file, {
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight
            });
          };
          
          video.onerror = () => {
            Alert.alert('Error', 'Failed to load video. Please try a different file.');
            setLoading(false);
          };
          
          // Load the video metadata
          video.load();
        } catch (error) {
          console.error('Error processing video:', error);
          Alert.alert('Error', 'Failed to process video. Please try again.');
          setLoading(false);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handleVideoSelected = async (videoUrl, videoFile, metadata) => {
    try {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'EditVideo',
          params: {
            videoUri: videoUrl,
            videoFile: videoFile,
            fileSize: videoFile.size,
            duration: metadata.duration,
            dimensions: {
              width: metadata.width,
              height: metadata.height
            }
          },
        })
      );
    } catch (error) {
      console.error('Error handling video:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message={`Processing video... ${uploadProgress}%`} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Video</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePickVideo}
        >
          <MaterialIcons name="cloud-upload" size={48} color={theme.colors.primary} />
          <Text style={styles.uploadText}>Click to Upload Video</Text>
          <Text style={styles.uploadSubtext}>MP4, WebM, or MOV</Text>
          <Text style={styles.uploadSubtext}>Less than 100 MB</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadButton: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  uploadText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  uploadSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default WebVideoUploadScreen;
