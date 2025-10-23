export default {
  name: 'TicToc India',
  slug: 'TicToc-india',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  scheme: 'TicTocindia',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gggroup.TicTocindia',
    buildNumber: '1',
    deploymentTarget: '13.4',
    infoPlist: {
      NSCameraUsageDescription: 'This app needs access to the camera to record videos',
      NSMicrophoneUsageDescription: 'This app needs access to the microphone to record audio',
      NSPhotoLibraryUsageDescription: 'This app needs access to your photos to upload videos and images',
      NSPhotoLibraryAddUsageDescription: 'This app needs permission to save videos to your photo library',
      UIBackgroundModes: [
        'audio',
        'fetch',
        'remote-notification'
      ]
    },
    requireFullScreen: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.gggroup.TicTocindia',
    versionCode: 2,
    permissions: [
      'INTERNET',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'CAMERA',
      'RECORD_AUDIO',
      'SYSTEM_ALERT_WINDOW',
      'VIBRATE',
      'POST_NOTIFICATIONS',
      'RECEIVE_BOOT_COMPLETED',
      'WAKE_LOCK'
    ],
    hardwareAccelerated: true,
    largeHeap: true
  },
  web: {
    favicon: './assets/icon.png'
  },
  extra: {
    eas: {
      projectId: 'b38d34e5-6ee4-4306-91dd-b45887c7b47e'
    }
  },
  cli: {
    version: '>= 5.9.1'
  },
  developmentClient: {
    silentLaunch: true
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [
            'https://jitpack.io',
            'https://maven.google.com'
          ],
          enableProguardInReleaseBuilds: true,
          enableShrinkResources: true,
          extraProguardRules: `-keep class com.google.android.exoplayer.** {*;}`,
          buildToolsVersion: '34.0.0',
          minSdkVersion: 24,
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          kotlinVersion: '1.8.0',
          packagingOptions: {
            pickFirst: [
              '**/libc++_shared.so',
              '**/libhermes.so'
            ]
          }
        },
        ios: {
          deploymentTarget: '13.4',
          useFrameworks: 'static'
        }
      }
    ],
    [
      'react-native-video',
      {
        enableAndroidPackage: true
      }
    ],
    [
      '@react-native-firebase/app',
      {
        android: {
          googleServicesFile: './google-services.json'
        },
        ios: {
          googleServicesFile: './GoogleService-Info.plist'
        }
      }
    ],
    [
      '@react-native-firebase/messaging',
      {}
    ]
  ]
}; 
