import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import OTPInput from '../../components/auth/OTPInput';
import { theme } from '../../config/theme';
import api from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email, type, message, username, password } = route.params;
  const { updateAuth } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const timerRef = useRef(null);

  const handleVerificationSuccess = async (token, userData) => {
    try {
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(userData)]
      ]);
      
      if (updateAuth) {
        await updateAuth();
      }

      if (Platform.OS === 'web') {
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          'Welcome to TikTok India! 🎉',
          'Your account has been verified successfully.',
          [
            {
              text: 'Login',
              onPress: () => navigation.replace('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Storage error:', error);
      setError('Failed to save session. Please try logging in.');
    }
  };

  // Handle web modal close
  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [
              {
                name: 'Feed'
              }
            ]
          }
        }
      ]
    });
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setTimeLeft(120);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (loading || timeLeft > 0) return;

    try {
      setLoading(true);
      setError('');
      
      const endpoint = type === 'reset' 
        ? '/auth/forgot-password'
        : '/auth/register';

      const payload = { email: email.toLowerCase() };
      
      if (type !== 'reset') {
        payload.username = username;
        payload.password = password;
      }

      await api.post(endpoint, payload);
      
      startTimer();
      Alert.alert('Success', 'OTP has been resent to your email');
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === 'reset' 
        ? '/auth/verify-reset'
        : '/auth/verify-registration';

      const payload = {
        email: email.toLowerCase(),
        otp: otp
      };

      if (type === 'reset' && route.params.newPassword) {
        payload.newPassword = route.params.newPassword;
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        if (type === 'reset') {
          Alert.alert(
            'Success',
            'Password reset successful. Please login with your new password.',
            [
              {
                text: 'Login',
                onPress: () => navigation.replace('Login')
              }
            ]
          );
        } else {
          await handleVerificationSuccess(response.data.token, response.data.user);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.msg || 'Verification failed. Please try again.';
      setError(errorMsg);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // First, ensure theme colors are properly imported and have fallback values
  const gradientColors = [
    theme.colors.background || '#000000',
    theme.colors.backgroundDark || '#1A1A1A'
  ];

  const primaryGradientColors = [
    theme.colors.primary || '#FF4D67',
    theme.colors.secondary || '#FF8700'
  ];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <FontAwesome5 name="envelope-open-text" size={50} color={theme.colors.primary} />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to:
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          <View style={styles.otpContainer}>
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              error={error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <LinearGradient
              colors={primaryGradientColors}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            {timeLeft > 0 ? (
              <View style={styles.timerContainer}>
                <FontAwesome5 name="clock" size={14} color={theme.colors.primary} />
                <Text style={styles.timerText}> {timeLeft}s</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={loading}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Success Modal for Web */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={primaryGradientColors}
              style={styles.successModal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.successIconContainer}>
                <FontAwesome5 name="check-circle" size={50} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Welcome to TikTok India! 🎉</Text>
              <Text style={styles.successMessage}>Your account has been verified successfully.</Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleModalClose}
              >
                <Text style={styles.continueButtonText}>Continue to Feed</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    width: Platform.OS === 'web' ? 400 : '80%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  continueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  continueButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OTPVerificationScreen;




















