import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

const VideoControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onFlipCamera,
  onPickFromGallery,
  recordingProgress,
  maxDuration = 60,
  flashMode,
  onToggleFlash,
}) => {
  const progressInterpolate = recordingProgress.interpolate({
    inputRange: [0, maxDuration],
    outputRange: ['0deg', '360deg'],
  });

  const progressStyle = {
    transform: [{ rotate: progressInterpolate }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onFlipCamera}
        >
          <MaterialIcons name="flip-camera-ios" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={onToggleFlash}
        >
          <MaterialIcons
            name={flashMode === 'on' ? 'flash-on' : 'flash-off'}
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={onPickFromGallery}
        >
          <MaterialIcons name="photo-library" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.recordButtonContainer}>
          <Animated.View style={[styles.progressCircle, progressStyle]} />
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton,
            ]}
            onPress={isRecording ? onStopRecording : onStartRecording}
            activeOpacity={0.8}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordingButtonInner,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.placeholder} />
      </View>

      {isRecording && (
        <View style={styles.timerContainer}>
          <MaterialIcons name="fiber-manual-record" size={24} color="red" />
          <Text style={styles.timerText}>Recording</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    borderColor: theme.colors.primary,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    transform: [{ scale: 1.1 }],
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordingButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  timerContainer: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoControls;
