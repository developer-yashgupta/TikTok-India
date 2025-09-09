import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as ImagePicker from 'expo-image-picker';
import { CommonActions } from '@react-navigation/native';
import { theme } from '../../config/theme';
import * as FileSystem from 'expo-file-system';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_DURATION = 60000; // 60 seconds in milliseconds
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const NativeVideoCreationScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  const handleSelectVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status: permissionStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setError('Permission to access media library is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (result.canceled) {
        return;
      }

      const videoUri = result.assets[0].uri;

      try {
        // Get video metadata using MediaLibrary
        const asset = await MediaLibrary.createAssetAsync(videoUri);
        
        // Check duration (asset.duration is in seconds)
        if (asset.duration * 1000 > MAX_DURATION) {
          Alert.alert(
            'Video Too Long',
            'Please select a video that is 60 seconds or shorter.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Get thumbnail and dimensions
        const videoInfo = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 0,
          quality: 1,
        });

        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (fileInfo.size > MAX_FILE_SIZE) {
          Alert.alert(
            'File Too Large',
            'Please select a video smaller than 100MB.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Navigate to edit screen
        navigation.dispatch(
          CommonActions.navigate({
            name: 'EditVideo',
            params: {
              videoUri: videoUri,
              fileSize: fileInfo.size,
              duration: asset.duration, // Already in seconds
              dimensions: {
                width: videoInfo.width,
                height: videoInfo.height
              }
            },
          })
        );

      } catch (err) {
        console.error('Error processing video:', err);
        Alert.alert(
          'Error',
          'Failed to process video. Please ensure the video is valid and try again.'
        );
      }

    } catch (err) {
      console.error('Error selecting video:', err);
      setError('Failed to select video: ' + err.message);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      const videoRecordPromise = cameraRef.current.recordAsync({
        maxDuration: 60,
        quality: Camera.Constants.VideoQuality['720p'],
        mute: false,
      });
      
      const video = await videoRecordPromise;
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      
      const videoInfo = await VideoThumbnails.getThumbnailAsync(video.uri, {
        time: 0,
        quality: 1,
      });

      navigation.dispatch(
        CommonActions.navigate({
          name: 'EditVideo',
          params: {
            videoUri: video.uri,
            fileSize: (await FileSystem.getInfoAsync(video.uri)).size,
            duration: asset.duration,
            dimensions: {
              width: videoInfo.width,
              height: videoInfo.height
            }
          },
        })
      );
    } catch (error) {
      console.error('Recording error:', error);
      setError('Failed to record video: ' + error.message);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;
    setIsRecording(false);
    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flash}
        ratio="16:9"
      >
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.flipButton}
            onPress={() => setCameraType(
              cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )}
          >
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={handleRecordPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={[styles.recordButtonInner, isRecording && styles.recordingButtonInner]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={handleSelectVideo}
            disabled={loading}
          >
            <MaterialIcons name="photo-library" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4747',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#ff0000',
  },
  recordButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ff4747',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordingButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ff0000',
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
});

export default NativeVideoCreationScreen;