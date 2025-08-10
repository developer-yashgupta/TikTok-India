import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { Platform } from 'react-native';

const VideoPlayer = ({
  source,
  style,
  shouldPlay = false,
  isLooping = true,
  resizeMode = 'cover',
  onPlaybackStatusUpdate,
  onError,
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(shouldPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

  const handlePlaybackStatusUpdate = (status) => {
    setIsLoading(status.isLoading);
    if (status.error) {
      setError(status.error);
    }
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleError = (error) => {
    setError(error);
    if (onError) {
      onError(error);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleProgress = () => {};

  const handleEnd = () => {};

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: source }}
          style={styles.video}
          resizeMode={resizeMode}
          repeat={isLooping}
          paused={!isPlaying}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000
          }}
        />
      </View>

      {isLoading && (
        <View style={styles.controlsContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      )}

      {!isLoading && !isPlaying && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayback}
        >
          <MaterialIcons name="play-arrow" size={36} color="white" />
        </TouchableOpacity>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={40} color="white" />
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
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  }
});

export default VideoPlayer;
