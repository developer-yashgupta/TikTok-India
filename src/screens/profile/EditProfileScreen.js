import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import axios, { auth } from '../../config/api';
import { API_URL } from '../../config/api';
import ImageCropModal from '../../components/ImageCropModal';
import { theme } from '../../config/theme';
import * as FileSystem from 'expo-file-system';

const EditProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [user, setUser] = useState({
    displayName: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    avatar: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // If we have user data in route params, use that
        if (route.params?.user) {
          const { user: routeUser } = route.params;
          setUser({
            displayName: routeUser.displayName || '',
            username: routeUser.username || '',
            bio: routeUser.bio || '',
            website: routeUser.website || '',
            location: routeUser.location || '',
            avatar: routeUser.avatar || ''
          });
        } else {
          // Otherwise fetch from API
          const response = await auth.getProfile();
          if (response.data?.success) {
            const userData = response.data.user;
            setUser({
              displayName: userData.displayName || '',
              username: userData.username || '',
              bio: userData.bio || '',
              website: userData.website || '',
              location: userData.location || '',
              avatar: userData.avatar || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert(
          'Error',
          'Failed to load profile data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [route.params]);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsCropModalVisible(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCropComplete = async (croppedUri) => {
    try {
      setUploadingAvatar(true);
      setIsCropModalVisible(false);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(croppedUri);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        // For Android/iOS
        let fileInfo = await FileSystem.getInfoAsync(croppedUri);
        
        if (!fileInfo.exists) {
          throw new Error("File doesn't exist at path: " + croppedUri);
        }

        // Ensure proper file path format for Android
        let finalUri = croppedUri;
        if (Platform.OS === 'android' && !croppedUri.startsWith('file://')) {
          finalUri = 'file://' + croppedUri;
        }

        formData.append('file', {
          uri: finalUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
      }

      // Use auth.updateAvatar instead of direct axios call
      const uploadResponse = await auth.updateAvatar(formData);

      if (uploadResponse?.data?.success && uploadResponse?.data?.avatar) {
        setUser(prev => ({
          ...prev,
          avatar: uploadResponse.data.avatar
        }));
        
        try {
          const userData = await AsyncStorage.getItem('@user_data');
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            parsedUserData.avatar = uploadResponse.data.avatar;
            await AsyncStorage.setItem('@user_data', JSON.stringify(parsedUserData));
          }
        } catch (storageError) {
          console.error('Error updating local storage:', storageError);
        }

        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 
        error.message || 
        'Failed to upload avatar. Please try again.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalVisible(false);
    setSelectedImage(null);
  };

  const handleSave = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const updateData = {
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        website: user.website,
        location: user.location
      };

      const response = await auth.updateProfile(updateData);

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        navigation.navigate('ProfileMain', { refresh: true });
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user.username) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, (loading || uploadingAvatar) && styles.saveButtonDisabled]}
          disabled={loading || uploadingAvatar}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            onPress={pickImage} 
            style={styles.avatarContainer}
            disabled={uploadingAvatar}
          >
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../../../assets/default-avatar.png')}
              style={styles.avatar}
            />
            {uploadingAvatar ? (
              <View style={[styles.editIconContainer, styles.uploadingContainer]}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : (
              <View style={styles.editIconContainer}>
                <FontAwesome5 name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile photo</Text>
        </View>

        <ImageCropModal
          visible={isCropModalVisible}
          imageUri={selectedImage}
          onClose={handleCropCancel}
          onSave={handleCropComplete}
        />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={user.displayName}
              onChangeText={(text) => setUser(prev => ({ ...prev, displayName: text }))}
              placeholder="Enter your display name"
              placeholderTextColor={theme.colors.placeholder}
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={user.username}
              onChangeText={(text) => setUser(prev => ({ ...prev, username: text }))}
              placeholder="Enter your username"
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={user.bio}
              onChangeText={(text) => setUser(prev => ({ ...prev, bio: text }))}
              placeholder="Write something about yourself"
              placeholderTextColor={theme.colors.placeholder}
              multiline
              numberOfLines={4}
              maxLength={150}
            />
            <Text style={styles.charCount}>{user.bio?.length || 0}/150</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={user.website}
              onChangeText={(text) => setUser(prev => ({ ...prev, website: text }))}
              placeholder="Enter your website"
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="none"
              keyboardType="url"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={user.location}
              onChangeText={(text) => setUser(prev => ({ ...prev, location: text }))}
              placeholder="Enter your location"
              placeholderTextColor={theme.colors.placeholder}
              maxLength={100}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.border
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  editIconContainer: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background
  },
  uploadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.primary
  },
  form: {
    padding: 15
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: theme.colors.text, 
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.card
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 4
  }
});

export default EditProfileScreen;




