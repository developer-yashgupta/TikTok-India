import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@react-navigation/native';
<<<<<<< HEAD
import { StatusBar, Platform, ActivityIndicator } from 'react-native';
=======
import { StatusBar, Platform, ActivityIndicator, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
>>>>>>> master
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ErrorBoundary from './src/components/shared/ErrorBoundary';
import { theme } from './src/config/theme';
import { store } from './src/store';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import linking from './src/navigation/LinkingConfiguration';
import PermissionManager from './src/utils/PermissionManager';
<<<<<<< HEAD

const Stack = createNativeStackNavigator();

=======
import { setupDeepLinking } from './src/utils/urlHandler';
import { safeInitializeFirebase, initializeFirebaseMessaging } from './src/config/firebase';
import notificationPermissionService from './src/services/notificationPermissionService';
import { notificationNavigationService } from './src/services/notificationNavigationService';

const Stack = createNativeStackNavigator();

// Firebase messaging component that has access to auth context
function FirebaseMessagingSetup({ navigationRef, firebaseSubscriptionsRef }) {
  const { user } = useAuth();

  // Setup Firebase messaging handlers after authentication
  useEffect(() => {
    const setupFirebaseMessaging = async () => {
      try {
        // Clean up existing subscriptions first
        if (firebaseSubscriptionsRef.current) {
          const { cleanupFirebaseMessaging } = await import('./src/config/firebase');
          cleanupFirebaseMessaging(firebaseSubscriptionsRef.current);
          firebaseSubscriptionsRef.current = null;
        }

        // Only setup messaging if Firebase is available
        const { isFirebaseAvailable } = await import('./src/config/firebase');
        if (!isFirebaseAvailable()) {
          return;
        }

        // Setup messaging with navigation handlers
        const subscriptions = await initializeFirebaseMessaging(
          user?._id, // userId - use current user if available
          
          // Foreground notification handler
          async (remoteMessage) => {
            // Just update badges for foreground - no navigation needed
          },
          
          // Background notification tap handler
          async (remoteMessage) => {
            await notificationNavigationService.handleBackgroundNotificationTap(remoteMessage);
          },
          
          // Initial notification handler (app opened from killed state)
          async (remoteMessage) => {
            await notificationNavigationService.handleInitialNotification(remoteMessage);
          }
        );

        firebaseSubscriptionsRef.current = subscriptions;
                
      } catch (error) {
        // Silent fail - don't crash the app
      }
    };

    // Setup Firebase messaging after a small delay to ensure app is ready
    const timeoutId = setTimeout(() => {
      setupFirebaseMessaging();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      
      // Cleanup on unmount
      if (firebaseSubscriptionsRef.current) {
        import('./src/config/firebase').then(({ cleanupFirebaseMessaging }) => {
          cleanupFirebaseMessaging(firebaseSubscriptionsRef.current);
        });
      }
    };
  }, []); // Run once on component mount

  // Update Firebase token when user changes
  useEffect(() => {
    const updateUserToken = async () => {
      if (firebaseSubscriptionsRef.current && firebaseSubscriptionsRef.current.token) {
        try {
          const { registerDeviceToken } = await import('./src/config/firebase');
          
          // Re-register token with new user ID or unregister if logged out
          if (user && user._id) {
            await registerDeviceToken(user._id, firebaseSubscriptionsRef.current.token);
          }
        } catch (error) {
          // Silent fail - don't crash the app
        }
      }
    };

    updateUserToken();
  }, [user]);

  return null;
}

>>>>>>> master
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef();
<<<<<<< HEAD

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await PermissionManager.requestInitialPermissions();
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  return (
    <Provider store={store}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              theme={{
                dark: true,
                colors: theme.colors
              }}
              fallback={<ActivityIndicator size="large" color={theme.colors.primary} />}
            >
              <StatusBar barStyle="light-content" backgroundColor="black" />
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </Provider>
  );
}


=======
  const firebaseSubscriptionsRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Request essential permissions first (non-blocking)
        PermissionManager.requestInitialPermissions().catch(err => {
          // Silent fail - don't crash the app
        });

        // Initialize Firebase in background (non-blocking)
        safeInitializeFirebase()
          .then(firebaseInitialized => {
            if (firebaseInitialized) {
              // CRITICAL FIX: Delay notification permission initialization significantly
              // to prevent Android permission callback crash
              setTimeout(async () => {
                try {
                  const shouldRequest = await notificationPermissionService.shouldRequestPermission();

                  if (shouldRequest) {
                    await notificationPermissionService.initialize();
                  }
                } catch (err) {
                  // Silent fail - don't crash the app
                }
              }, 8000); // 8 second delay to ensure bridge is ready
            }
          })
          .catch(error => {
            // Silent fail - don't crash the app
          });

      } catch (error) {
        // Continue with app initialization regardless of errors
      }
    };

    initializeApp();
  }, []);

  // Setup deep linking
  useEffect(() => {
    if (navigationRef.current) {
      const cleanup = setupDeepLinking(navigationRef.current);
      return cleanup;
    }
  }, []);

  // Setup notification navigation when navigation is ready
  useEffect(() => {
    if (navigationRef.current) {
            notificationNavigationService.setNavigationRef(navigationRef);
      
      // Process any stored initial notification
      setTimeout(() => {
        notificationNavigationService.processStoredInitialNotification();
      }, 2000); // Wait for app to fully load
    }
  }, [navigationRef.current]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ErrorBoundary>
          <SafeAreaProvider>
            <AuthProvider>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                theme={{
                  dark: true,
                  colors: theme.colors
                }}
                fallback={<ActivityIndicator size="large" color={theme.colors.primary} />}
              >
                <StatusBar barStyle="light-content" backgroundColor="black" />
                <AppNavigator />
                <FirebaseMessagingSetup 
                  navigationRef={navigationRef} 
                  firebaseSubscriptionsRef={firebaseSubscriptionsRef} 
                />
              </NavigationContainer>
            </AuthProvider>
          </SafeAreaProvider>
        </ErrorBoundary>
      </Provider>
    </GestureHandlerRootView>
  );
}

>>>>>>> master
