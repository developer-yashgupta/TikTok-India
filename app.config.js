export default {
  name: 'TikTok India',
  slug: 'tiktok-india',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/3.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gggroup.tiktokindia',
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
      foregroundImage: './assets/3.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.gggroup.tiktokindia',
    versionCode: 1,
    permissions: [
      'INTERNET',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'CAMERA',
      'RECORD_AUDIO',
      'SYSTEM_ALERT_WINDOW',
      'VIBRATE'
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
    version: '>= 5.9.1',
    appVersionSource: 'remote'
  },
  developmentClient: {
    silentLaunch: true
  },
  updates: {
    url: 'https://u.expo.dev/b38d34e5-6ee4-4306-91dd-b45887c7b47e'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  plugins: [
    'expo-router',
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
    ]
  ]
}; 
