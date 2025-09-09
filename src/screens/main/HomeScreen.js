import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoFeedScreen from './VideoFeedScreen';
import { theme } from '../../config/theme';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <VideoFeedScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default HomeScreen;
