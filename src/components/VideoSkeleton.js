import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate video dimensions (9:16 aspect ratio for TikTok-style videos)
const VIDEO_WIDTH = SCREEN_WIDTH;
const VIDEO_HEIGHT = (SCREEN_WIDTH * 16) / 9;

const VideoSkeleton = ({
  style,
  showAvatar = true,
  showUsername = true,
  showDescription = true,
  showActions = true,
  showUserInfo = true
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for subtle breathing effect
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();
    pulseAnimation.start();

    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-VIDEO_WIDTH, VIDEO_WIDTH],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.videoContainer, { transform: [{ scale: pulseAnim }] }]}>
        {/* Video placeholder with shimmer effect */}
        <View style={styles.videoPlaceholder}>
          <LinearGradient
            colors={['#2a2a2a', '#3a3a3a', '#2a2a2a']}
            style={styles.videoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        {/* Play button skeleton */}
        <View style={styles.playButtonSkeleton}>
          <LinearGradient
            colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
            style={styles.playButtonGradient}
          />
        </View>

        {/* User Info Skeleton */}
        {showUserInfo && (
          <View style={styles.userInfoSkeleton}>
            <View style={styles.userInfoSkeletonLeft}>
              <View style={styles.userAvatarSkeleton}>
                <LinearGradient
                  colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                  style={styles.userAvatarSkeleton}
                />
              </View>
              <View style={styles.userTextSkeleton}>
                <LinearGradient
                  colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                  style={styles.usernameSkeleton}
                />
                <LinearGradient
                  colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                  style={styles.userHandleSkeleton}
                />
              </View>
            </View>
            <View style={styles.followButtonSkeleton}>
              <LinearGradient
                colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                style={styles.followButtonSkeleton}
              />
            </View>
          </View>
        )}

        {/* User info skeleton */}
        {showAvatar && (
          <View style={styles.avatarSkeleton}>
            <LinearGradient
              colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
              style={styles.avatarGradient}
            />
          </View>
        )}

        {showUsername && (
          <View style={styles.usernameSkeleton}>
            <LinearGradient
              colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
              style={styles.usernameGradient}
            />
          </View>
        )}

        {showDescription && (
          <View style={styles.descriptionSkeleton}>
            <LinearGradient
              colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
              style={styles.descriptionGradient}
            />
          </View>
        )}

        {/* Action buttons skeleton */}
        {showActions && (
          <View style={styles.actionsSkeleton}>
            <View style={styles.actionButtonSkeleton}>
              <LinearGradient
                colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                style={styles.actionGradient}
              />
            </View>
            <View style={[styles.actionButtonSkeleton, styles.actionButtonMiddle]}>
              <LinearGradient
                colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                style={styles.actionGradient}
              />
            </View>
            <View style={styles.actionButtonSkeleton}>
              <LinearGradient
                colors={['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                style={styles.actionGradient}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    position: 'relative',
    overflow: 'hidden',
  },
  videoGradient: {
    width: '100%',
    height: '100%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  playButtonSkeleton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  userInfoSkeleton: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoSkeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextSkeleton: {
    flex: 1,
  },
  usernameSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  userHandleSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  followButtonSkeleton: {
    width: 70,
    height: 32,
    borderRadius: 6,
    marginLeft: 12,
  },
  avatarSkeleton: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  usernameSkeleton: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    width: 120,
    height: 16,
    borderRadius: 8,
  },
  usernameGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  descriptionSkeleton: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 80,
    height: 12,
    borderRadius: 6,
  },
  descriptionGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  actionsSkeleton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    alignItems: 'center',
  },
  actionButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 16,
  },
  actionButtonMiddle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  actionGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default VideoSkeleton;