import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Modal,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

// Storage keys for settings
const SETTINGS_KEYS = {
  NOTIFICATIONS: '@settings_notifications',
  DARK_MODE: '@settings_dark_mode',
  PRIVATE_ACCOUNT: '@settings_private_account',
  LANGUAGE: '@settings_language'
};

const APP_VERSION = '1.0.0';

const SettingSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SettingItem = ({ icon, title, value, onPress, type = 'arrow', loading = false }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    disabled={loading}
  >
    <View style={styles.settingItemLeft}>
      <View style={styles.iconContainer}>
        <FontAwesome5 name={icon} size={16} color={theme.colors.primary} />
      </View>
      <Text style={styles.settingItemTitle}>{title}</Text>
    </View>
    <View style={styles.settingItemRight}>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <>
          {type === 'arrow' && (
            <FontAwesome5 name="chevron-right" size={16} color={theme.colors.textSecondary} />
          )}
          {type === 'switch' && value !== undefined && (
            <Switch
              value={value}
              onValueChange={onPress}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#fff' : '#f4f3f4'}
            />
          )}
          {type === 'text' && (
            <Text style={styles.settingItemValue}>{value}</Text>
          )}
        </>
      )}
    </View>
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState({
    notifications: false,
    darkMode: false,
    privateAccount: false
  });

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [notifSetting, darkModeSetting, privateAccountSetting, languageSetting] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE),
        AsyncStorage.getItem(SETTINGS_KEYS.PRIVATE_ACCOUNT),
        AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE)
      ]);

      setNotifications(notifSetting !== 'false');
      setDarkMode(darkModeSetting === 'true');
      setPrivateAccount(privateAccountSetting === 'true');
      if (languageSetting) setLanguage(languageSetting);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotifications = async (value) => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.NOTIFICATIONS, String(value));
      setNotifications(value);
      // Here you would typically register/unregister for push notifications
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const handleDarkMode = async (value) => {
    setLoading(prev => ({ ...prev, darkMode: true }));
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.DARK_MODE, String(value));
      setDarkMode(value);
      // Here you would typically update the app's theme
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme settings');
    } finally {
      setLoading(prev => ({ ...prev, darkMode: false }));
    }
  };

  const handlePrivateAccount = async (value) => {
    setLoading(prev => ({ ...prev, privateAccount: true }));
    try {
      await Promise.all([
        AsyncStorage.setItem(SETTINGS_KEYS.PRIVATE_ACCOUNT, String(value)),
        userService.updatePrivacySettings({ isPrivate: value })
      ]);
      setPrivateAccount(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setLoading(prev => ({ ...prev, privateAccount: false }));
    }
  };

  const handleLanguageChange = async () => {
    const languages = ['English', 'Español', 'Français', '中文', '日本語'];
    Alert.alert(
      'Select Language',
      '',
      languages.map(lang => ({
        text: lang,
        onPress: async () => {
          try {
            await AsyncStorage.setItem(SETTINGS_KEYS.LANGUAGE, lang);
            setLanguage(lang);
          } catch (error) {
            Alert.alert('Error', 'Failed to update language settings');
          }
        }
      }))
    );
  };

  const handleHelpCenter = () => {
    // Open help center webview or external link
    Alert.alert(
      'Help Center',
      'Would you like to visit our help center?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Visit',
          onPress: () => {
            // Navigate to help center or open external link
            navigation.navigate('WebView', {
<<<<<<< HEAD
              url: 'https://help.tiktok.com',
=======
              url: 'https://help.TicToc.com',
>>>>>>> master
              title: 'Help Center'
            });
          }
        }
      ]
    );
  };

  const handleReportProblem = () => {
    navigation.navigate('ReportProblem');
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        performLogout();
      }
    } else {
      setShowLogoutModal(true);
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.clear();
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Login' } }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title="Account">
          <SettingItem
            icon="user-edit"
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            icon="lock"
            title="Privacy"
            onPress={() => navigation.navigate('Privacy')}
          />
          <SettingItem
            icon="shield-alt"
            title="Security"
            onPress={() => navigation.navigate('Security')}
          />
          <SettingItem
            icon="user-lock"
            title="Private Account"
            type="switch"
            value={privateAccount}
            onPress={handlePrivateAccount}
            loading={loading.privateAccount}
          />
        </SettingSection>

        <SettingSection title="Preferences">
          <SettingItem
            icon="bell"
            title="Notifications"
            type="switch"
            value={notifications}
            onPress={handleNotifications}
            loading={loading.notifications}
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            type="switch"
            value={darkMode}
            onPress={handleDarkMode}
            loading={loading.darkMode}
          />
          <SettingItem
            icon="globe"
            title="Language"
            type="text"
            value={language}
            onPress={handleLanguageChange}
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingItem
            icon="question-circle"
            title="Help Center"
            onPress={handleHelpCenter}
          />
          <SettingItem
            icon="exclamation-circle"
            title="Report a Problem"
            onPress={handleReportProblem}
          />
          <SettingItem
            icon="info-circle"
            title="About"
            type="text"
            value={`Version ${APP_VERSION}`}
            onPress={() => {}}
          />
        </SettingSection>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome5 name="sign-out-alt" size={16} color={theme.colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutModal}
          >
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowLogoutModal(false);
                  performLogout();
                }}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
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
  content: {
    flex: 1
  },
  section: {
    marginTop: 25
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 15,
    textTransform: 'uppercase'
  },
  sectionContent: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  settingItemTitle: {
    fontSize: 16,
    color: theme.colors.text
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingItemValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 50,
    paddingVertical: 12,
    marginHorizontal: 15,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.error
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  logoutTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logoutMessage: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
