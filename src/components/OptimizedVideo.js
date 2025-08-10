import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Video from 'react-native-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getOptimalVideoQuality, getDeviceSpecificConfig } from '../utils/deviceUtils';

const OptimizedVideo = ({ 
  uri,
  style,
  shouldPlay = true,
  isLooping = true,
  onPlaybackStatusUpdate,
  onError,
  ...props 
}) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState('low');
  const [config, setConfig] = useState(null);

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

  // Apply quality settings based on device capabilities
  const videoQualitySettings = {
    low: {
      resizeMode: Video.RESIZE_MODE_CONTAIN,
      useNativeControls: false,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
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
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        {config && (
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            paused={!shouldPlay}
            onLoad={handlePlaybackStatusUpdate}
            onError={handleError}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000
            }}
            {...videoQualitySettings[quality]}
            {...props}
            // Device-specific optimizations
            posterSource={{ uri: `${uri}?thumb=1` }}
            posterResizeMode="cover"
          />
        )}
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
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
});

export default OptimizedVideo;
