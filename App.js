import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@react-navigation/native';
import { StatusBar, Platform, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ErrorBoundary from './src/components/shared/ErrorBoundary';
import { theme } from './src/config/theme';
import { store } from './src/store';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import linking from './src/navigation/LinkingConfiguration';
import PermissionManager from './src/utils/PermissionManager';

const Stack = createNativeStackNavigator();

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


