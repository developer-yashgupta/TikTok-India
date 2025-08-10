import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const HashtagInput = ({ hashtags = [], onHashtagsChange }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      const hashtag = input.trim().replace(/^#/, '');
      if (!hashtags.includes(hashtag)) {
        onHashtagsChange([...hashtags, hashtag]);
      }
      setInput('');
    }
  };

  const handleRemove = (hashtagToRemove) => {
    onHashtagsChange(hashtags.filter(hashtag => hashtag !== hashtagToRemove));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add hashtags..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleSubmit}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hashtagsContainer}
        contentContainerStyle={styles.hashtagsContent}
      >
        {hashtags.map((hashtag) => (
          <TouchableOpacity
            key={hashtag}
            style={styles.hashtagChip}
            onPress={() => handleRemove(hashtag)}
          >
            <Text style={styles.hashtagText}>#{hashtag}</Text>
            <MaterialIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  hashtagsContainer: {
    marginTop: 12,
    maxHeight: 40,
  },
  hashtagsContent: {
    paddingHorizontal: 4,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  hashtagText: {
    color: '#fff',
    marginRight: 6,
    fontSize: 14,
  },
});

export default HashtagInput;
