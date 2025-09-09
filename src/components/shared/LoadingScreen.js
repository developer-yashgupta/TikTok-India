import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LoadingScreen = ({ message = 'Loading...', showSpinner = true }) => {
  return (
    <View style={styles.container}>
      {showSpinner ? (
        <ActivityIndicator size="large" color="#FF4040" />
      ) : (
        <MaterialIcons name="hourglass-empty" size={48} color="#FF4040" />
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
  },
});

export default LoadingScreen;
