import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT - 300); // Ensure crop area fits on all devices

const ImageCropModal = ({ visible, imageUri, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const lastDistance = useRef(0);
  const baseScale = useRef(1);
  const initialImageLayout = useRef(null);

  useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        // Calculate initial scale to fit the image within the crop area
        const imageRatio = width / height;
        let newWidth, newHeight, scaleFactor;

        if (imageRatio >= 1) {
          // Landscape or square image
          scaleFactor = CROP_SIZE / height;
          newHeight = CROP_SIZE;
          newWidth = width * scaleFactor;
        } else {
          // Portrait image
          scaleFactor = CROP_SIZE / width;
          newWidth = CROP_SIZE;
          newHeight = height * scaleFactor;
        }

        // Store initial layout
        initialImageLayout.current = {
          scale: 1,
          width: width,
          height: height,
          originalWidth: width,
          originalHeight: height
        };

        setImageSize({ 
          width: width,
          height: height
        });
        
        // Set initial scale
        scale.setValue(scaleFactor);
        baseScale.current = scaleFactor;

        // Center the image
        const xOffset = (width * scaleFactor - CROP_SIZE) / 2;
        const yOffset = (height * scaleFactor - CROP_SIZE) / 2;
        
        translateX.setValue(-xOffset);
        translateY.setValue(-yOffset);
      });
    }
    return () => resetTransform();
  }, [imageUri]);

  const resetTransform = () => {
    if (initialImageLayout.current) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: initialImageLayout.current.scale,
          useNativeDriver: true,
          bounciness: 8
        }),
        Animated.spring(translateX, {
          toValue: -(initialImageLayout.current.width - CROP_SIZE) / 2,
          useNativeDriver: true,
          bounciness: 8
        }),
        Animated.spring(translateY, {
          toValue: -(initialImageLayout.current.height - CROP_SIZE) / 2,
          useNativeDriver: true,
          bounciness: 8
        })
      ]).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        return Math.abs(dx) > 2 || Math.abs(dy) > 2;
      },
      onPanResponderGrant: () => {
        lastDistance.current = 0;
      },
      onPanResponderMove: (event, gestureState) => {
        const touches = event.nativeEvent.touches;
        
        if (touches.length === 2) {
          const touch1 = touches[0];
          const touch2 = touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (lastDistance.current === 0) {
            lastDistance.current = currentDistance;
            return;
          }

          const scaleFactor = currentDistance / lastDistance.current;
          const nextScale = scale._value * scaleFactor;

          // Very limited zoom range
          if (nextScale >= baseScale.current * 0.9 && nextScale <= baseScale.current * 1.1) {
            scale.setValue(nextScale);
          }
          
          lastDistance.current = currentDistance;
        } else if (touches.length === 1) {
          // Add bounds checking for pan
          const newX = translateX._value + gestureState.dx;
          const newY = translateY._value + gestureState.dy;
          
          // Calculate bounds
          const maxX = (imageSize.width * scale._value - CROP_SIZE) / 2;
          const maxY = (imageSize.height * scale._value - CROP_SIZE) / 2;
          
          // Apply bounds
          translateX.setValue(Math.max(-maxX, Math.min(maxX, newX)));
          translateY.setValue(Math.max(-maxY, Math.min(maxY, newY)));
        }
      },
      onPanResponderRelease: () => {
        lastDistance.current = 0;
      }
    })
  ).current;

  const handleSave = async () => {
    if (loading) return;
    
    try {
      setLoading(true);

      // Simply pass the original image URI
      await onSave(imageUri);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <FontAwesome5 name="times" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetTransform} style={styles.headerButton}>
            <FontAwesome5 name="undo" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <FontAwesome5 name="check" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Crop Area */}
        <View style={styles.cropContainer}>
          <View style={styles.cropOverlay}>
            <View style={styles.cropWindow} {...panResponder.panHandlers}>
              <Animated.View
                style={{
                  transform: [
                    { translateX },
                    { translateY },
                    { scale }
                  ]
                }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    {
                      width: imageSize.width,
                      height: imageSize.height
                    }
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
              {/* Grid Lines */}
              <View pointerEvents="none" style={styles.gridContainer}>
                <View style={[styles.gridLine, styles.horizontalLine, { top: '33%' }]} />
                <View style={[styles.gridLine, styles.horizontalLine, { top: '66%' }]} />
                <View style={[styles.gridLine, styles.verticalLine, { left: '33%' }]} />
                <View style={[styles.gridLine, styles.verticalLine, { left: '66%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Pinch to zoom • Drag to move
        </Text>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#111'
  },
  headerButton: {
    padding: 12,
    borderRadius: 8
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111'
  },
  cropOverlay: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: CROP_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#000'
  },
  cropWindow: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  horizontalLine: {
    width: '100%',
    height: 1
  },
  verticalLine: {
    width: 1,
    height: '100%'
  },
  instructions: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16
  },
  filtersContainer: {
    backgroundColor: '#111',
    paddingVertical: 16,
    maxHeight: 80
  },
  filtersContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterOption: {
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#333'
  },
  selectedFilter: {
    backgroundColor: theme.colors.primary
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  selectedFilterText: {
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.5
  }
});

export default ImageCropModal;










