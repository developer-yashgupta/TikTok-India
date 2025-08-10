import React from 'react';
import { Platform } from 'react-native';
import WebVideoUploadScreen from './WebVideoUploadScreen';
import NativeVideoCreationScreen from './NativeVideoCreationScreen';

const VideoCreationScreen = (props) => {
  // Use native video creation for mobile devices
  if (Platform.OS !== 'web') {
    return <NativeVideoCreationScreen {...props} />;
  }
  
  // Use simplified upload-only screen for web
  return <WebVideoUploadScreen {...props} />;
};

export default VideoCreationScreen;