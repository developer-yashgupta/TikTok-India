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
import { AppState, DeviceEventEmitter } from 'react-native';
import { getOptimalVideoQuality, getMemoryOptimizedVideoConfig } from '../utils/deviceUtils';
import videoPreloader from '../utils/videoPreloader';
import videoCache from '../utils/videoCache';
import { VIDEO_CONFIG } from '../config/videoConfig';
import performanceMonitor from '../utils/performanceMonitor';
import VideoSkeleton from './VideoSkeleton';

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
let lastInteractionTime = 0;
const INTERACTION_TIMEOUT = 30000; // 30 seconds

// Initialize from localStorage on web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('videoUserInteracted');
    const storedTime = localStorage.getItem('videoLastInteractionTime');
    if (stored === 'true') {
      hasUserInteractedGlobally = true;
    }
    if (storedTime) {
      lastInteractionTime = parseInt(storedTime, 10);
    }
  } catch (e) {
    // localStorage not available
  }
}

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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const videoKey = useRef(0);
  const playIconAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationValue = useRef(new Animated.Value(0)).current;
  const [likeAnimations, setLikeAnimations] = useState([]);
  const likeAnimationRefs = useRef([]);
  const retryTimeoutRef = useRef(null);
  const [quality, setQuality] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [memoryConfig, setMemoryConfig] = useState(null);
  const lastTapTime = useRef(0);

  // Gesture handler refs
  const singleTapRef = useRef(null);
  const doubleTapRef = useRef(null);

  // Update overlay state when video becomes active
  useEffect(() => {
    // Only show overlay on web if user hasn't interacted and video is active
    // Also check if interaction has timed out
    const currentTime = Date.now();
    const shouldShowOverlay = Platform.OS === 'web' &&
                             !hasUserInteractedGlobally &&
                             isActive &&
                             (currentTime - lastInteractionTime) < INTERACTION_TIMEOUT;

    if (shouldShowOverlay) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [isActive, hasUserInteractedGlobally]);

  // Update playing state when active state changes
  useEffect(() => {
    if (!isThumbnail) {
      const shouldPlay = !paused && isActive && (Platform.OS !== 'web' || hasUserInteractedGlobally || hasInteracted);
      setIsPlaying(shouldPlay);
    }
  }, [paused, isActive, isThumbnail, hasInteracted]);

  // Cleanup retry timeout on unmount or URI change
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      setRetryCount(0);
      setIsRetrying(false);
    };
  }, [uri]);

  // Cleanup performance session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        performanceMonitor.endVideoSession(sessionId);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    const handleAppStateChange = (state) => {
      if (state === 'background') {
        setIsPlaying(false);
      }
    };

    const handleMemoryWarning = () => {
      console.log('Memory warning received - reducing video quality');
      // Force lower quality settings when memory is low
      if (memoryConfig) {
        setMemoryConfig({
          ...memoryConfig,
          maxBufferMs: Math.min(memoryConfig.maxBufferMs, 3000),
          maxBitRate: Math.min(memoryConfig.maxBitRate, 1000000),
          resolution: 360
        });
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    const memoryWarningSubscription = DeviceEventEmitter.addListener('onMemoryWarning', handleMemoryWarning);

    return () => {
      appStateSubscription.remove();
      memoryWarningSubscription.remove();
    };
  }, [memoryConfig]);

  // Initialize optimal video quality
  useEffect(() => {
    const initializeQuality = async () => {
      try {
        // Check for cached user preference first
        const cachedPreference = await videoCache.getUserQualityPreference();
        if (cachedPreference) {
          const qualityObj = VIDEO_CONFIG.adaptiveBitrate.qualities.find(q => q.resolution === cachedPreference);
          if (qualityObj) {
            setQuality(qualityObj);
            return;
          }
        }

        // Fallback to optimal quality
        const optimalQuality = await getOptimalVideoQuality();
        setQuality(optimalQuality);

        // Cache the quality preference
        if (optimalQuality) {
          await videoCache.cacheUserQualityPreference(optimalQuality.resolution);
        }
      } catch (error) {
        console.error('Error initializing video quality:', error);
      }
    };

    initializeQuality();
  }, []);

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


  const handlePress = () => {
    if (isThumbnail) return;

    const currentTime = Date.now();

    // Debounce rapid taps (prevent taps within 300ms of each other)
    if (currentTime - lastTapTime.current < 300) {
      return;
    }
    lastTapTime.current = currentTime;

    if (Platform.OS === 'web' && !hasUserInteractedGlobally) {
      hasUserInteractedGlobally = true;
      lastInteractionTime = currentTime;
      setHasInteracted(true);
      setShowOverlay(false);
      setIsPlaying(true);

      // Persist to localStorage
      try {
        localStorage.setItem('videoUserInteracted', 'true');
        localStorage.setItem('videoLastInteractionTime', currentTime.toString());
      } catch (e) {
        // localStorage not available
      }
    } else if (Platform.OS === 'web' && (currentTime - lastInteractionTime) > INTERACTION_TIMEOUT) {
      // Reset interaction state if it's been too long
      hasUserInteractedGlobally = true;
      lastInteractionTime = currentTime;
      setHasInteracted(true);
      setShowOverlay(false);
      setIsPlaying(true);

      // Update localStorage
      try {
        localStorage.setItem('videoUserInteracted', 'true');
        localStorage.setItem('videoLastInteractionTime', currentTime.toString());
      } catch (e) {
        // localStorage not available
      }
    } else {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      showPlayPauseAnimation();
    }
  };

  const showPlayPauseAnimation = () => {
    // Don't show play icon if user hasn't interacted yet (first interaction on web)
    if (Platform.OS === 'web' && !hasUserInteractedGlobally) return;

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
        Animated.delay(600), // Slightly longer delay
        Animated.timing(playIconAnim, {
          toValue: 0,
          duration: 300,
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

    // Start performance monitoring
    if (uri && video) {
      const videoId = video.id || uri.split('/').pop();
      const newSessionId = performanceMonitor.startVideoSession(videoId, uri);
      setSessionId(newSessionId);
      performanceMonitor.recordLoadStart(newSessionId);
    }

    onLoadStart?.();
  };

  const handleLoad = (event) => {
    setIsLoading(false);
    setError(null);

    // Record load completion in performance monitor
    if (sessionId) {
      performanceMonitor.recordLoadEnd(sessionId, event);
      if (quality) {
        performanceMonitor.setQuality(sessionId, quality);
      }
    }

    // Cache video metadata for faster future loads
    if (uri && event && video) {
      const videoId = video.id || uri.split('/').pop();
      videoCache.cacheVideoMetadata(videoId, {
        duration: event.duration,
        naturalSize: event.naturalSize,
        uri: uri
      }).catch(error => {
        console.log('Cache metadata failed:', error);
      });
    }

    // Preload the video for faster future access
    if (uri) {
      videoPreloader.preloadVideo(uri).catch(error => {
        console.log('Preload failed:', error);
      });
    }

    onLoad?.(event);
  };

  const handleError = (err) => {
    console.error('Video playback error:', err);

    // Record error in performance monitor
    if (sessionId) {
      performanceMonitor.recordError(sessionId, err);
    }

    // Implement retry mechanism
    if (retryCount < 3 && !isRetrying) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000;

      console.log(`Retrying video load in ${delay}ms (attempt ${retryCount + 1}/3)`);

      retryTimeoutRef.current = setTimeout(() => {
        setError(null);
        setIsLoading(true);
        setIsRetrying(false);

        // Force reload by changing the key to remount the Video component
        videoKey.current += 1;
      }, delay);
    } else {
      setIsLoading(false);
      setError(err);
      setIsRetrying(false);
      onError?.(err);
    }
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
    if (event.nativeEvent.state === State.END) {
      // Only trigger on END state to avoid conflicts with double tap
      handlePress();
    }
  };

  // Handle double tap (like)
  const handleDoubleTap = (event) => {
    if (event.nativeEvent.state === State.END) {
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
        maxDelayMs={250}
        maxDurationMs={250}
      >
        <TapGestureHandler
          ref={singleTapRef}
          onHandlerStateChange={handleSingleTap}
          numberOfTaps={1}
          waitFor={doubleTapRef}
          maxDelayMs={200}
          maxDurationMs={200}
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
           key={videoKey.current}
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
           bufferConfig={{
             minBufferMs: 1000, // Reduced for faster start
             maxBufferMs: 3000, // Reduced to prevent memory issues
             bufferForPlaybackMs: 500, // Faster playback start
             bufferForPlaybackAfterRebufferMs: 1000, // Reduced rebuffer time
             backBufferDurationMs: 1000, // Reduced back buffer
             cacheSizeMB: 50 // Limit cache size
           }}
           maxBitRate={memoryConfig ? memoryConfig.maxBitRate : 1000000} // Reduced for faster loading
           selectedVideoTrack={{
             type: "resolution",
             value: Platform.OS === 'android' ? 480 : 720 // Optimized for mobile
           }}
           progressUpdateInterval={1000} // Reduced update frequency
           currentTime={0}
           seek={0}
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
          <View style={styles.skeletonContainer}>
            <VideoSkeleton
              showAvatar={false}
              showUsername={false}
              showDescription={false}
              showActions={false}
              showUserInfo={true}
            />
          </View>
        )}

        {error && !isRetrying && (
           <View style={[styles.loadingContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
             <Ionicons name="alert-circle" size={40} color="#ff4747" />
             <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
               {error.message || 'Failed to load video'}
             </Text>
             {retryCount > 0 && (
               <Text style={{ color: '#ccc', fontSize: 12, textAlign: 'center', marginTop: 5 }}>
                 Retried {retryCount} time{retryCount > 1 ? 's' : ''}
               </Text>
             )}
           </View>
         )}

         {isRetrying && (
           <View style={[styles.loadingContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
             <ActivityIndicator color="#fff" size="large" />
             <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
               Retrying... ({retryCount}/3)
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
  skeletonContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
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

export default VideoPlayer;
