import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import VideoCreationScreen from '../screens/creation/VideoCreationScreen';
import EditVideoScreen from '../screens/creation/EditVideoScreen';
import EffectsScreen from '../screens/creation/EffectsScreen';
import SoundPickerScreen from '../screens/creation/SoundPickerScreen';
import { theme } from '../config/theme';

const Stack = createStackNavigator();

const CreationNavigator = () => {
  const isWeb = Platform.OS === 'web';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
      initialRouteName={isWeb ? "VideoCreation" : "VideoCreation"}
    >
      <Stack.Screen
        name="VideoCreation"
        component={VideoCreationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditVideo"
        component={EditVideoScreen}
        options={{
          title: 'Edit Video',
          headerBackTitle: 'Back',
          gestureEnabled: Platform.OS !== 'web',
        }}
      />
      {!isWeb && (
        <>
          <Stack.Screen
            name="Effects"
            component={EffectsScreen}
            options={{
              title: 'Add Effects',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="SoundPicker"
            component={SoundPickerScreen}
            options={{
              title: 'Choose Sound',
              presentation: 'modal',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default CreationNavigator;
