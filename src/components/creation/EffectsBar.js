import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const effects = [
  {
    id: 'beauty',
    name: 'Beauty',
    icon: 'face',
    settings: {
      smoothing: 0.5,
      brightening: 0.3,
    },
  },
  {
    id: 'blur',
    name: 'Blur',
    icon: 'blur-on',
    settings: {
      intensity: 0.3,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'movie',
    settings: {
      contrast: 1.2,
      saturation: 0.8,
    },
  },
  {
    id: 'black-white',
    name: 'B&W',
    icon: 'monochrome-photos',
    settings: {
      contrast: 1.1,
    },
  },
  {
    id: 'vhs',
    name: 'VHS',
    icon: 'videocam',
    settings: {
      noise: 0.2,
      scanlines: true,
    },
  },
];

const EffectsBar = ({ onEffectSelect, selectedEffect }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {effects.map((effect) => (
          <TouchableOpacity
            key={effect.id}
            style={[
              styles.effectButton,
              selectedEffect?.id === effect.id && styles.selectedEffect,
            ]}
            onPress={() => onEffectSelect(effect)}
          >
            <MaterialIcons
              name={effect.icon}
              size={24}
              color={selectedEffect?.id === effect.id ? '#FF4040' : 'white'}
            />
            <Text style={styles.effectName}>{effect.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  effectButton: {
    alignItems: 'center',
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedEffect: {
    backgroundColor: 'rgba(255,64,64,0.2)',
    borderWidth: 1,
    borderColor: '#FF4040',
  },
  effectName: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
});

export default EffectsBar;
