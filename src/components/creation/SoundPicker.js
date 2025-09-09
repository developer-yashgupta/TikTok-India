import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import api from '../../config/api';

const SoundPicker = ({ visible, onSoundSelect, selectedSound }) => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSound, setCurrentSound] = useState(null);
  const [soundObject, setSoundObject] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSounds();
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, []);

  const fetchSounds = async (query = '') => {
    setLoading(true);
    try {
      const response = await api.get('/api/sounds/search', {
        params: { query },
      });
      setSounds(response.data.sounds);
    } catch (error) {
      console.error('Error fetching sounds:', error);
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchSounds(text);
  };

  const playSound = async (sound) => {
    try {
      if (soundObject) {
        await soundObject.unloadAsync();
      }

      if (currentSound === sound._id && isPlaying) {
        setIsPlaying(false);
        setCurrentSound(null);
        return;
      }

      const { sound: newSoundObject } = await Audio.Sound.createAsync(
        { uri: sound.soundUrl },
        { shouldPlay: true }
      );

      setSoundObject(newSoundObject);
      setCurrentSound(sound._id);
      setIsPlaying(true);

      newSoundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleSoundSelect = (sound) => {
    if (soundObject) {
      soundObject.unloadAsync();
    }
    onSoundSelect(sound);
  };

  const renderSoundItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.soundItem,
        selectedSound?._id === item._id && styles.selectedSoundItem,
      ]}
      onPress={() => handleSoundSelect(item)}
    >
      <Image
        source={{ uri: item.user?.avatar || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.soundInfo}>
        <Text style={styles.soundTitle}>{item.title}</Text>
        <Text style={styles.artistName}>{item.artist || 'Original Sound'}</Text>
        <Text style={styles.duration}>{Math.round(item.duration)}s</Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playSound(item)}
      >
        <MaterialIcons
          name={currentSound === item._id && isPlaying ? 'pause' : 'play-arrow'}
          size={24}
          color="white"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search sounds..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loading} color="#FF4040" />
      ) : (
        <FlatList
          data={sounds}
          renderItem={renderSoundItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
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
    height: 300,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 10,
    color: 'white',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedSoundItem: {
    backgroundColor: 'rgba(255,64,64,0.1)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  soundInfo: {
    flex: 1,
    marginLeft: 15,
  },
  soundTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#999',
    fontSize: 14,
  },
  duration: {
    color: '#999',
    fontSize: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4040',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SoundPicker;
