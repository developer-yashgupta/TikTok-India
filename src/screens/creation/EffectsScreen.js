import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

const effects = [
  { id: 'none', name: 'None', icon: 'remove-circle-outline' },
  { id: 'brightness', name: 'Brightness', icon: 'brightness-6' },
  { id: 'contrast', name: 'Contrast', icon: 'contrast' },
  { id: 'saturation', name: 'Saturation', icon: 'palette' },
  { id: 'blur', name: 'Blur', icon: 'blur-on' },
  { id: 'vintage', name: 'Vintage', icon: 'camera' },
  { id: 'sepia', name: 'Sepia', icon: 'color-lens' },
  { id: 'grayscale', name: 'Grayscale', icon: 'gradient' },
];

const EffectsScreen = ({ navigation, route }) => {
  const [selectedEffect, setSelectedEffect] = useState(null);
  const onSelect = route.params?.onSelect;

  const handleEffectSelect = (effect) => {
    setSelectedEffect(effect);
    if (onSelect) {
      onSelect(effect);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.effectsList}>
        {effects.map((effect) => (
          <TouchableOpacity
            key={effect.id}
            style={[
              styles.effectItem,
              selectedEffect?.id === effect.id && styles.selectedEffect,
            ]}
            onPress={() => handleEffectSelect(effect)}
          >
            <MaterialIcons
              name={effect.icon}
              size={24}
              color={selectedEffect?.id === effect.id ? theme.colors.primary : theme.colors.text}
            />
            <Text style={[
              styles.effectName,
              selectedEffect?.id === effect.id && styles.selectedEffectText
            ]}>
              {effect.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Preview</Text>
        <View style={styles.previewVideo}>
          {/* Video preview with effect applied */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  effectsList: {
    flex: 1,
    padding: 20,
  },
  effectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedEffect: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  effectName: {
    marginLeft: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedEffectText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  previewContainer: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  previewVideo: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EffectsScreen;
