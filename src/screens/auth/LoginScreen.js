import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../config/theme';
import { validateEmail } from '../../utils/validation';
import { auth } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const { login } = useAuth();
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [formPosition] = useState(new Animated.Value(0));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorNotification, setErrorNotification] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const shakeError = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [shakeAnimation]);

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (message) => {
    setErrorNotification(message);
    Animated.sequence([
      Animated.spring(errorSlideAnim, {
        toValue: 0,
        tension: 70,
        friction: 5,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(3000),
      Animated.timing(errorSlideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => setErrorNotification(''));
  };

  const showSuccessAlert = () => {
    setShowSuccessModal(true);
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      shakeError();
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      if (!navigator.onLine && Platform.OS === 'web') {
        throw new Error('No internet connection. Please check your network.');
      }

      // First use the auth service to validate credentials
      const response = await auth.login(email, password);
      
      if (response.success) {
        // Then update the auth context state
        const result = await login(email, password);
        if (result.success) {
          showSuccessAlert();
        } else {
          showError(result.error || 'Login failed');
          shakeError();
        }
      } else {
        showError(response.msg || 'Login failed');
        shakeError();
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage;
      
      if (!navigator.onLine && Platform.OS === 'web') {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (error.response?.data?.msg) {
        // Use the error message from the API response
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        // Use error message from the Error object
        errorMessage = error.message;
      } else {
        // Default error message
        errorMessage = 'Login failed. Please try again.';
      }
      
      showError(errorMessage);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  useEffect(() => {
    const setupAnimations = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    };

    setupAnimations();

    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        Animated.timing(formPosition, {
          toValue: -100,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(formPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [fadeAnim, slideAnim, formPosition]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { translateY: formPosition },
      { translateX: shakeAnimation },
    ],
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Error Notification */}
      {errorNotification ? (
        <Animated.View
          style={[
            styles.errorNotification,
            {
              transform: [{ translateY: errorSlideAnim }],
            },
          ]}
        >
          <Text style={styles.errorNotificationText}>{errorNotification}</Text>
        </Animated.View>
      ) : null}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={[styles.modalOverlay, Platform.OS === 'web' && styles.webModalOverlay]}>
          <LinearGradient
            colors={['#FF4D67', '#FF8700']}
            style={[styles.successModal, Platform.OS === 'web' && styles.webSuccessModal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.successIconContainer}>
              <FontAwesome name="check-circle" size={50} color="#fff" />
            </View>
            <Text style={styles.successText}>Welcome Back!</Text>
            <Text style={styles.successSubText}>Login Successful</Text>
            <TouchableOpacity
              style={styles.redirectButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { screen: 'Feed' } }],
                });
              }}
            >
              <Text style={styles.redirectButtonText}>Go to App</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <LinearGradient
        colors={['#FF4D67', '#FF8700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <FontAwesome name="envelope" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError('email');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.visibilityIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {errors.general && (
              <Text style={styles.errorText}>{errors.general}</Text>
            )}

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 30,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
      }
    })
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#fff',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }
    })
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FF4D67',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  signupText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  errorNotification: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }
    })
  },
  errorNotificationText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    width: '80%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }
    })
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  visibilityIcon: {
    padding: 10,
  },
  redirectButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  redirectButtonText: {
    color: '#FF4D67',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  webSuccessModal: {
    maxWidth: 400,
    width: '90%',
  },
});

export default LoginScreen;
