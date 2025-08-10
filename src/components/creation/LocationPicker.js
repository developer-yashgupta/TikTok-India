import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Predefined popular locations
const POPULAR_LOCATIONS = [
  { name: 'New York', address: 'New York' },
  { name: 'London', address: 'London' },
  { name: 'Tokyo', address: 'Tokyo' },
  { name: 'Paris', address: 'Paris' },
  { name: 'Sydney', address: 'Sydney' },
  { name: 'Dubai', address: 'Dubai' },
  { name: 'Singapore', address: 'Singapore' },
  { name: 'Mumbai', address: 'Mumbai' },
];

const MAX_LOCATION_LENGTH = 50;
const MIN_SEARCH_LENGTH = 2;

const LocationPicker = ({ location, onLocationChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [error, setError] = useState(null);

  // Reset error when modal is closed
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSearchQuery('');
    setCustomLocation('');
    setError(null);
  }, []);

  // Validate location name
  const validateLocationName = useCallback((name) => {
    if (!name || !name.trim()) {
      throw new Error('Location name cannot be empty');
    }
    if (name.length > MAX_LOCATION_LENGTH) {
      throw new Error(`Location name cannot exceed ${MAX_LOCATION_LENGTH} characters`);
    }
    if (/[<>{}[\]\\]/.test(name)) {
      throw new Error('Location name contains invalid characters');
    }
    return name.trim();
  }, []);

  const handleLocationSelect = useCallback((selectedLocation) => {
    try {
      if (!selectedLocation || !selectedLocation.name) {
        throw new Error('Invalid location selected');
      }

      const validatedName = validateLocationName(selectedLocation.name);
      const locationData = {
        ...selectedLocation,
        name: validatedName,
      };

      onLocationChange(locationData);
      handleCloseModal();
    } catch (error) {
      setError(error.message);
      console.error('Location selection error:', error);
    }
  }, [onLocationChange, validateLocationName, handleCloseModal]);

  const handleCustomLocationSubmit = useCallback(() => {
    try {
      const validatedName = validateLocationName(customLocation);
      
      // Check for duplicate location
      const isDuplicate = POPULAR_LOCATIONS.some(
        loc => loc.name.toLowerCase() === validatedName.toLowerCase()
      );
      
      if (isDuplicate) {
        throw new Error('This location already exists in popular locations');
      }

      const newLocation = {
        id: Date.now().toString(),
        name: validatedName,
        address: validatedName,
      };

      onLocationChange(newLocation);
      handleCloseModal();
    } catch (error) {
      setError(error.message);
      console.error('Custom location error:', error);
    }
  }, [customLocation, onLocationChange, validateLocationName, handleCloseModal]);

  const handleSearchQueryChange = useCallback((text) => {
    setSearchQuery(text);
    setError(null);
  }, []);

  const handleCustomLocationChange = useCallback((text) => {
    setCustomLocation(text);
    setError(null);
  }, []);

  const filteredLocations = POPULAR_LOCATIONS.filter(
    loc => {
      if (searchQuery.length < MIN_SEARCH_LENGTH) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query)
      );
    }
  );

  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={20} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => {
          setError(null);
          setModalVisible(true);
        }}>
        <MaterialIcons name="location-on" size={24} color="rgba(255,255,255,0.7)" />
        <Text style={styles.locationText}>
          {location?.name || 'Add location'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Location</Text>
            </View>

            {renderErrorMessage()}

            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search popular locations"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                maxLength={MAX_LOCATION_LENGTH}
              />
            </View>

            <View style={styles.customLocationContainer}>
              <TextInput
                style={[
                  styles.customLocationInput,
                  error && styles.inputError
                ]}
                placeholder={`Enter a custom location (max ${MAX_LOCATION_LENGTH} chars)`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={customLocation}
                onChangeText={handleCustomLocationChange}
                onSubmitEditing={handleCustomLocationSubmit}
                returnKeyType="done"
                maxLength={MAX_LOCATION_LENGTH}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !customLocation.trim() && styles.addButtonDisabled
                ]}
                onPress={handleCustomLocationSubmit}
                disabled={!customLocation.trim()}>
                <MaterialIcons 
                  name="add-location" 
                  size={24} 
                  color={customLocation.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
              Popular Locations {searchQuery.length > 0 && `(${filteredLocations.length})`}
            </Text>

            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => handleLocationSelect(item)}>
                  <MaterialIcons name="location-on" size={24} color="rgba(255,255,255,0.7)" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationAddress}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.length >= MIN_SEARCH_LENGTH
                      ? 'No locations found'
                      : `Enter at least ${MIN_SEARCH_LENGTH} characters to search`}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  customLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  customLocationInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    opacity: 0.8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default LocationPicker;
