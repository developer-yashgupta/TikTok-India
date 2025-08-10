import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Image,
  ActivityIndicator,
  Text,
} from 'react-native';
import Video from 'react-native-video';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { FontAwesome5 } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate video dimensions based on platform and screen size
const getVideoDimensions = () => {
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const hasNotch = isIOS && SCREEN_HEIGHT >= 812;
  const isAndroid = Platform.OS === 'android';
  
  // Calculate safe area heights
  const statusBarHeight = isIOS ? (hasNotch ? 44 : 20) : 25;
  const bottomNavHeight = isIOS ? (hasNotch ? 83 : 49) : 70;
  const safeAreaVertical = statusBarHeight + bottomNavHeight;
  
  // Calculate maximum available dimensions
  const maxWidth = SCREEN_WIDTH;
  const maxHeight = SCREEN_HEIGHT - safeAreaVertical;

  return {
    width: maxWidth,
    height: maxHeight,
    maxHeight: maxHeight,
  };
};

const { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } = getVideoDimensions();

// Global state to track if user has interacted with any video
let hasUserInteractedGlobally = false;

const VideoPlayer = ({ 
  uri, 
  paused = true, 
  style, 
  isActive = false,
  poster,
  onLoadStart,
  onLoad,
  onError,
  resizeMode = Platform.OS === 'web' ? 'contain' : 'cover',
  isThumbnail = false,
  video,
  onLike,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(!paused);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  const [showOverlay, setShowOverlay] = useState(false);
  const videoRef = useRef(null);
  const playIconAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationValue = useRef(new Animated.Value(0)).current;
  const [likeAnimations, setLikeAnimations] = useState([]);
  const likeAnimationRefs = useRef([]);

  // Gesture handler refs
  const singleTapRef = useRef(null);
  const doubleTapRef = useRef(null);

  // Update overlay state when video becomes active
  useEffect(() => {
    if (Platform.OS === 'web' && !hasUserInteractedGlobally && isActive) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [isActive]);

  // Update playing state when active state changes
  useEffect(() => {
    if (!isThumbnail) {
      const shouldPlay = !paused && isActive && (Platform.OS !== 'web' || hasUserInteractedGlobally || hasInteracted);
      setIsPlaying(shouldPlay);
    }
  }, [paused, isActive, isThumbnail, hasInteracted]);

  useEffect(() => {
    const handleAppStateChange = (state) => {
      if (state === 'background') {
        setIsPlaying(false);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  const handlePress = () => {
    if (isThumbnail) return;
    
    if (Platform.OS === 'web' && !hasUserInteractedGlobally) {
      hasUserInteractedGlobally = true;
      setHasInteracted(true);
      setShowOverlay(false);
      setIsPlaying(true);
    } else {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      showPlayPauseAnimation();
    }
  };

  const showPlayPauseAnimation = () => {
    setShowPlayIcon(true);
    playIconAnim.setValue(0);
    scaleAnim.setValue(0.5);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(playIconAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.delay(500),
        Animated.timing(playIconAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowPlayIcon(false);
      scaleAnim.setValue(0.5);
    });
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
    onLoadStart?.();
  };

  const handleLoad = (event) => {
    setIsLoading(false);
    setError(null);
    onLoad?.(event);
  };

  const handleError = (err) => {
    setIsLoading(false);
    setError(err);
    console.error('Video playback error:', err);
    onError?.(err);
  };

  // Update dimensions on layout changes
  useEffect(() => {
    const updateDimensions = () => {
      const dimensions = getVideoDimensions();
      setVideoDimensions(dimensions);
    };

    // Listen for dimension changes
    const dimensionsHandler = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      // Clean up listener
      if (dimensionsHandler?.remove) {
        dimensionsHandler.remove();
      }
    };
  }, []);

  // Handle single tap (play/pause)
  const handleSingleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handlePress();
    }
  };

  // Handle double tap (like)
  const handleDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      if (onLike) {
        onLike();
        animateLike();
      }
    }
  };

  const generateRandomPosition = () => {
    return {
      x: Math.random() * (videoDimensions.width * 0.6) - (videoDimensions.width * 0.3),
      y: Math.random() * (videoDimensions.height * 0.3) - (videoDimensions.height * 0.15),
      rotate: Math.random() * 60 - 30,
      scale: 0.8 + Math.random() * 0.5,
    };
  };

  const animateLike = () => {
    setShowLikeAnimation(true);
    likeAnimationValue.setValue(0);

    // Create 6 hearts with different positions
    const newAnimations = Array(6).fill(0).map((_, index) => {
      const position = generateRandomPosition();
      const animValue = new Animated.Value(0);
      likeAnimationRefs.current[index] = animValue;
      return {
        id: Date.now() + index,
        position,
        animValue,
      };
    });

    setLikeAnimations(newAnimations);

    // Main center heart animation
    Animated.sequence([
      Animated.spring(likeAnimationValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(100),
      Animated.timing(likeAnimationValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => setShowLikeAnimation(false));

    // Animate each small heart
    newAnimations.forEach(({ animValue }, index) => {
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.parallel([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 700,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ]),
      ]).start();
    });
  };

  return (
    <View style={[styles.container, { width: videoDimensions.width, height: videoDimensions.height }, style]}>
      <TapGestureHandler
        ref={doubleTapRef}
        onHandlerStateChange={handleDoubleTap}
        numberOfTaps={2}
        maxDelayMs={300}
        maxDurationMs={300}
      >
        <TapGestureHandler
          ref={singleTapRef}
          onHandlerStateChange={handleSingleTap}
          numberOfTaps={1}
          waitFor={doubleTapRef}
          maxDelayMs={150}
        >
          <Animated.View style={styles.videoWrapper}>
        {(poster && !isPlaying) && (
          <Image 
            source={{ uri: poster }}
            style={[styles.poster, { opacity: isLoading ? 0 : 1 }]}
            resizeMode={resizeMode}
          />
        )}
        
        <Video
          ref={videoRef}
          source={{ uri }}
          style={[styles.video, { opacity: (poster && !isPlaying) ? 0 : 1 }]}
          resizeMode={resizeMode}
          repeat={!isThumbnail}
          paused={!isPlaying || showOverlay}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          posterResizeMode={resizeMode}
          muted={isThumbnail}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
        />

        {/* Click to Play Overlay */}
        {showOverlay && (
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.overlayButton}
              onPress={handlePress}
            >
              <Ionicons name="play-circle-outline" size={80} color="white" />
              <Text style={styles.overlayText}>Tap to play</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}

        {error && (
          <View style={[styles.loadingContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <Ionicons name="alert-circle" size={40} color="#ff4747" />
            <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
              {error.message || 'Failed to load video'}
            </Text>
          </View>
        )}

        {showPlayIcon && !isThumbnail && (
          <Animated.View
            style={[
              styles.playIconContainer,
              {
                opacity: playIconAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={50}
              color="white"
            />
          </Animated.View>
        )}

        {showLikeAnimation && (
          <View style={StyleSheet.absoluteFill}>
            {/* Main center heart */}
            <Animated.View
              style={[
                styles.likeAnimation,
                {
                  transform: [
                    { scale: likeAnimationValue.interpolate({
                      inputRange: [0, 0.4, 0.6, 0.8, 1],
                      outputRange: [0.7, 1.5, 1.3, 1.5, 1]
                    })},
                    { rotate: likeAnimationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '5deg']
                    }) },
                  ],
                  opacity: likeAnimationValue.interpolate({
                    inputRange: [0, 0.1, 0.8, 1],
                    outputRange: [0, 1, 1, 0]
                  }),
                },
              ]}
            >
              <FontAwesome5 name="heart" size={100} color="#ff2d55" solid />
            </Animated.View>

            {/* Floating hearts */}
            {likeAnimations.map((anim, index) => (
              <Animated.View
                key={anim.id}
                style={[
                  styles.floatingHeart,
                  {
                    transform: [
                      { translateX: anim.position.x },
                      { translateY: anim.animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -videoDimensions.height * 0.3]
                      })},
                      { scale: anim.animValue.interpolate({
                        inputRange: [0, 0.3, 0.6, 1],
                        outputRange: [0, anim.position.scale, anim.position.scale * 0.8, 0]
                      })},
                      { rotate: `${anim.position.rotate}deg` }
                    ],
                    opacity: anim.animValue.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 1, 1, 0]
                    }),
                  }
                ]}
              >
                <FontAwesome5 name="heart" size={30} color="#ff2d55" solid />
              </Animated.View>
            ))}
          </View>
        )}
          </Animated.View>
        </TapGestureHandler>
      </TapGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    maxHeight: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 127 : Platform.OS === 'android' ? 95 : 0),
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  likeAnimation: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    top: '40%',
    zIndex: 999,
  },
  floatingHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    zIndex: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
});

import { AppState } from 'react-native';

export default VideoPlayer;
