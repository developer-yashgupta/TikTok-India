import React, { useEffect, useState, useRef } from 'react';
<<<<<<< HEAD
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Video from 'react-native-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getOptimalVideoQuality, getDeviceSpecificConfig } from '../utils/deviceUtils';

const OptimizedVideo = ({ 
=======
import { View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Text, Image } from 'react-native';
import Video from 'react-native-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getOptimalVideoQuality, getDeviceSpecificConfig, getMemoryOptimizedVideoConfig } from '../utils/deviceUtils';
import VideoSkeleton from './VideoSkeleton';

const OptimizedVideo = ({
>>>>>>> master
  uri,
  style,
  shouldPlay = true,
  isLooping = true,
  onPlaybackStatusUpdate,
  onError,
<<<<<<< HEAD
  ...props 
}) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState('low');
  const [config, setConfig] = useState(null);
=======
  video,
  showUserInfo = true,
  ...props
}) => {
  const videoRef = useRef(null);
  const videoKey = useRef(0);
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState(null);
  const [config, setConfig] = useState(null);
  const [memoryConfig, setMemoryConfig] = useState(null);
>>>>>>> master

  useEffect(() => {
    const initializeVideo = async () => {
      try {
        // Get optimal video quality based on device and network
        const optimalQuality = await getOptimalVideoQuality();
        setQuality(optimalQuality);

        // Get device-specific configuration
        const deviceConfig = await getDeviceSpecificConfig();
        setConfig(deviceConfig);

        // Lock orientation to portrait by default
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.error('Error initializing video:', error);
        onError?.(error);
      }
    };

    initializeVideo();
  }, []);

<<<<<<< HEAD
=======
  // Initialize memory-optimized configuration
  useEffect(() => {
    const initializeMemoryConfig = async () => {
      try {
        const config = await getMemoryOptimizedVideoConfig();
        setMemoryConfig(config);
      } catch (error) {
        console.error('Error initializing memory config:', error);
      }
    };

    initializeMemoryConfig();
  }, []);


>>>>>>> master
  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setLoading(false);
    }
    onPlaybackStatusUpdate?.(status);
  };

  const handleError = (error) => {
    console.error('Video playback error:', error);
    setLoading(false);
    onError?.(error);
  };

<<<<<<< HEAD
  // Apply quality settings based on device capabilities
  const videoQualitySettings = {
    low: {
      resizeMode: Video.RESIZE_MODE_CONTAIN,
=======

  // Apply quality settings based on device capabilities
  const getVideoQualitySettings = (quality) => {
    if (!quality) return {};

    return {
      resizeMode: Video.RESIZE_MODE_COVER,
>>>>>>> master
      useNativeControls: false,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
<<<<<<< HEAD
      progressUpdateIntervalMillis: 500,
    },
    medium: {
      resizeMode: Video.RESIZE_MODE_COVER,
      useNativeControls: true,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
      progressUpdateIntervalMillis: 250,
    },
    high: {
      resizeMode: Video.RESIZE_MODE_COVER,
      useNativeControls: true,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
      progressUpdateIntervalMillis: 100,
    },
=======
      progressUpdateIntervalMillis: quality.bitrate > 2000000 ? 100 : 250, // Faster updates for higher quality
      maxBitRate: memoryConfig ? memoryConfig.maxBitRate : quality.bitrate,
      selectedVideoTrack: {
        type: "resolution",
        value: memoryConfig ? (memoryConfig.resolution === 360 ? 360 : (memoryConfig.resolution === 480 ? 480 : 720)) : quality.height
      }
    };
>>>>>>> master
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        {config && (
          <Video
<<<<<<< HEAD
            ref={videoRef}
=======
            key={videoKey.current}
>>>>>>> master
            source={{ uri }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            paused={!shouldPlay}
            onLoad={handlePlaybackStatusUpdate}
            onError={handleError}
<<<<<<< HEAD
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000
            }}
            {...videoQualitySettings[quality]}
=======
            bufferConfig={memoryConfig ? {
              minBufferMs: memoryConfig.minBufferMs,
              maxBufferMs: memoryConfig.maxBufferMs,
              bufferForPlaybackMs: memoryConfig.bufferForPlaybackMs,
              bufferForPlaybackAfterRebufferMs: memoryConfig.bufferForPlaybackAfterRebufferMs,
              backBufferDurationMs: memoryConfig.backBufferDurationMs
            } : {
              minBufferMs: 3000, // Fallback values - must be >= bufferForPlaybackAfterRebufferMs
              maxBufferMs: 5000,
              bufferForPlaybackMs: 1500,
              bufferForPlaybackAfterRebufferMs: 2500,
              backBufferDurationMs: 2000
            }}
            {...getVideoQualitySettings(quality)}
>>>>>>> master
            {...props}
            // Device-specific optimizations
            posterSource={{ uri: `${uri}?thumb=1` }}
            posterResizeMode="cover"
          />
        )}
<<<<<<< HEAD
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
=======

      </View>
      {loading && (
        <View style={styles.skeletonContainer}>
          <VideoSkeleton
            showAvatar={false}
            showUsername={false}
            showDescription={false}
            showActions={false}
          />
>>>>>>> master
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 9 / 16,
    maxHeight: Platform.select({
      web: 'calc(100vh - 120px)',
      default: '100%'
    }),
    alignSelf: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
<<<<<<< HEAD
=======
  skeletonContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
>>>>>>> master
});

export default OptimizedVideo;
