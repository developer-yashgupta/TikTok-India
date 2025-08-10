import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { theme } from '../../config/theme';
import { MaterialIcons } from '@expo/vector-icons';

const LoadingScreen = ({ message, progress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.tipContainer}>
        <MaterialIcons name="lightbulb-outline" size={24} color={theme.colors.textSecondary} />
        <Text style={styles.tipText}>
          Pro tip: Add trending sounds to increase your video's reach
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  tipContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: 15,
    borderRadius: 10,
    maxWidth: '90%',
  },
  tipText: {
    marginLeft: 10,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});

export default LoadingScreen;
