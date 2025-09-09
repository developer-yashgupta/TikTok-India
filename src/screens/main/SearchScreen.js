import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';
import { theme } from '../../config/theme';
import api from '../../config/api';

const SEARCH_TYPES = {
  ALL: 'all',
  USERS: 'users',
  SOUNDS: 'sounds',
  HASHTAGS: 'hashtags',
};

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState(SEARCH_TYPES.ALL);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    debounce(async (query, type) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/api/search', {
          params: {
            query: query.trim(),
            type,
          },
        });
        setResults(response.data.results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    performSearch(query, searchType);
  };

  const renderSearchTypeButton = (type) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        searchType === type && styles.activeTypeButton,
        { backgroundColor: theme.colors.surface },
      ]}
      onPress={() => {
        setSearchType(type);
        performSearch(searchQuery, type);
      }}
    >
      <Text
        style={[
          styles.typeButtonText,
          searchType === type && styles.activeTypeButtonText,
          { color: theme.colors.text },
        ]}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderResultItem = ({ item }) => {
    switch (item.type) {
      case 'user':
        return (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => navigation.navigate('Profile', { userId: item.id })}
          >
            <View style={styles.resultContent}>
              <MaterialIcons name="person" size={24} color={theme.colors.text} />
              <View style={styles.resultTextContainer}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                  {item.username}
                </Text>
                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
                  {item.name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      case 'sound':
        return (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => navigation.navigate('SoundDetails', { soundId: item.id })}
          >
            <View style={styles.resultContent}>
              <MaterialIcons name="music-note" size={24} color={theme.colors.text} />
              <View style={styles.resultTextContainer}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
                  {item.artist}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      case 'hashtag':
        return (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => navigation.navigate('HashtagVideos', { hashtag: item.name })}
          >
            <View style={styles.resultContent}>
              <MaterialIcons name="tag" size={24} color={theme.colors.text} />
              <View style={styles.resultTextContainer}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                  #{item.name}
                </Text>
                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
                  {item.videoCount} videos
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.typeContainer}>
        {Object.values(SEARCH_TYPES).map((type) => renderSearchTypeButton(type))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No results found
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
  },
  typeContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
  },
  activeTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.typography.body.fontSize,
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsList: {
    padding: theme.spacing.md,
  },
  resultItem: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  resultTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
  },
});

export default SearchScreen;
