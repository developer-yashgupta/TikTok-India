import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { soundService } from '../../services/soundService';

const SoundPickerScreen = ({ navigation, route }) => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSound, setSelectedSound] = useState(null);
  const onSelect = route.params?.onSelect;

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    try {
      setLoading(true);
      const response = await soundService.getTrending();
      setSounds(response.sounds);
    } catch (error) {
      console.error('Error fetching sounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearch(text);
    if (text.length > 2) {
      try {
        setLoading(true);
        const response = await soundService.search(text);
        setSounds(response.sounds);
      } catch (error) {
        console.error('Error searching sounds:', error);
      } finally {
        setLoading(false);
      }
    } else if (text.length === 0) {
      fetchSounds();
    }
  };

  const handleSoundSelect = (sound) => {
    setSelectedSound(sound);
    if (onSelect) {
      onSelect(sound);
      navigation.goBack();
    }
  };

  const renderSoundItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.soundItem,
        selectedSound?.id === item.id && styles.selectedSound,
      ]}
      onPress={() => handleSoundSelect(item)}
    >
      <View style={styles.soundInfo}>
        <Text style={styles.soundName}>{item.name}</Text>
        <Text style={styles.soundArtist}>{item.artist}</Text>
        <Text style={styles.soundDuration}>{item.duration}s</Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => {/* Play sound preview */}}
      >
        <MaterialIcons name="play-arrow" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sounds..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={sounds}
          renderItem={renderSoundItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.soundsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sounds found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.card,
    margin: 15,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundsList: {
    padding: 15,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedSound: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  soundArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  soundDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
});

export default SoundPickerScreen;
