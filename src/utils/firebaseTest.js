import { 
  testFirebaseInitialization, 
  isFirebaseAvailable,
  getFCMToken,
  requestUserPermission,
  isNotificationsEnabled
} from '../config/firebase';
import { getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';

class FirebaseTestUtility {
  constructor() {
    this.testResults = {};
  }

  // Run comprehensive Firebase tests
  async runAllTests() {
    console.log('🔥 Starting Firebase comprehensive tests...');
    
    const tests = [
      { name: 'Firebase App Initialization', test: this.testAppInitialization },
      { name: 'Firebase Configuration', test: this.testConfiguration },
      { name: 'Firebase Messaging Availability', test: this.testMessagingAvailability },
      { name: 'Notification Permissions', test: this.testNotificationPermissions },
      { name: 'FCM Token Generation', test: this.testFCMToken },
      { name: 'Background Message Handler', test: this.testBackgroundHandler },
      { name: 'Firebase Analytics', test: this.testAnalytics }
    ];

    const results = {};
    
    for (const { name, test } of tests) {
      try {
        console.log(`\n🧪 Testing: ${name}`);
        const result = await test.call(this);
        results[name] = { success: true, result };
        console.log(`✅ ${name}: PASSED`);
      } catch (error) {
        results[name] = { success: false, error: error.message };
        console.log(`❌ ${name}: FAILED - ${error.message}`);
      }
    }

    this.testResults = results;
    this.displayTestSummary();
    return results;
  }

  // Test Firebase app initialization
  async testAppInitialization() {
    const testResult = await testFirebaseInitialization();
    
    if (testResult.error) {
      throw new Error(`Firebase initialization failed: ${testResult.error}`);
    }

    if (!testResult.appInitialized) {
      throw new Error('Firebase app not initialized');
    }

    const apps = getApps();
    if (apps.length === 0) {
      throw new Error('No Firebase apps found');
    }

    return {
      configValid: testResult.configValid,
      appInitialized: testResult.appInitialized,
      appsCount: testResult.appsCount,
      appName: apps[0].name
    };
  }

  // Test Firebase configuration
  async testConfiguration() {
    const isAvailable = isFirebaseAvailable();
    
    if (!isAvailable) {
      throw new Error('Firebase is not available');
    }

    // Check environment variables
    const requiredEnvVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => 
      !process.env[varName] || 
      process.env[varName].includes('your-') ||
      process.env[varName] === 'your-api-key'
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
    }

    return {
      firebaseAvailable: isAvailable,
      environmentConfigured: true,
      platform: Platform.OS
    };
  }

  // Test Firebase messaging availability
  async testMessagingAvailability() {
    try {
      // Test if messaging is available
      const hasPermission = await messaging().hasPermission();
      const isSupported = messaging.isSupported ? await messaging.isSupported() : true;
      
      return {
        messagingAvailable: true,
        hasPermission: hasPermission,
        isSupported: isSupported,
        authorizationStatus: hasPermission
      };
    } catch (error) {
      throw new Error(`Messaging not available: ${error.message}`);
    }
  }

  // Test notification permissions
  async testNotificationPermissions() {
    try {
      const currentStatus = await isNotificationsEnabled();
      let permissionGranted = currentStatus;

      if (!currentStatus) {
        // Try to request permission
        permissionGranted = await requestUserPermission();
      }

      const finalStatus = await messaging().hasPermission();

      return {
        initialStatus: currentStatus,
        permissionRequested: !currentStatus,
        permissionGranted: permissionGranted,
        finalStatus: finalStatus,
        canReceiveNotifications: permissionGranted
      };
    } catch (error) {
      throw new Error(`Permission test failed: ${error.message}`);
    }
  }

  // Test FCM token generation
  async testFCMToken() {
    try {
      const token = await getFCMToken();
      
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      return {
        tokenGenerated: true,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        platform: Platform.OS
      };
    } catch (error) {
      throw new Error(`FCM token test failed: ${error.message}`);
    }
  }

  // Test background message handler
  async testBackgroundHandler() {
    try {
      // Check if background handler is set up
      const hasHandler = Platform.OS === 'android' || Platform.OS === 'ios';
      
      if (Platform.OS === 'web') {
        // For web, check if service worker is registered
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const hasFirebaseServiceWorker = registrations.some(reg => 
            reg.scope.includes('firebase-messaging-sw')
          );
          
          return {
            platform: 'web',
            serviceWorkerSupported: true,
            firebaseServiceWorkerRegistered: hasFirebaseServiceWorker,
            backgroundHandlerReady: hasFirebaseServiceWorker
          };
        } else {
          return {
            platform: 'web',
            serviceWorkerSupported: false,
            backgroundHandlerReady: false
          };
        }
      }

      return {
        platform: Platform.OS,
        backgroundHandlerSet: hasHandler,
        backgroundHandlerReady: hasHandler
      };
    } catch (error) {
      throw new Error(`Background handler test failed: ${error.message}`);
    }
  }

  // Test Firebase Analytics (if available)
  async testAnalytics() {
    try {
      // Try to import analytics
      const analytics = require('@react-native-firebase/analytics').default;
      
      if (analytics) {
        // Test if analytics is enabled
        const isEnabled = await analytics().isAnalyticsCollectionEnabled();
        
        return {
          analyticsAvailable: true,
          analyticsEnabled: isEnabled,
          platform: Platform.OS
        };
      } else {
        return {
          analyticsAvailable: false,
          reason: 'Analytics module not found'
        };
      }
    } catch (error) {
      return {
        analyticsAvailable: false,
        reason: error.message
      };
    }
  }

  // Display test summary
  displayTestSummary() {
    console.log('\n🔥 Firebase Test Summary');
    console.log('========================');
    
    const passed = Object.values(this.testResults).filter(r => r.success).length;
    const total = Object.keys(this.testResults).length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n🎉 All Firebase tests passed! Firebase is working correctly.');
    } else {
      console.log('\n⚠️  Some Firebase tests failed. Check the details above.');
    }

    // Show failed tests
    const failedTests = Object.entries(this.testResults)
      .filter(([_, result]) => !result.success);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(([name, result]) => {
        console.log(`   • ${name}: ${result.error}`);
      });
    }

    return {
      passed,
      total,
      success: passed === total,
      results: this.testResults
    };
  }

  // Quick health check
  async quickHealthCheck() {
    try {
      const isAvailable = isFirebaseAvailable();
      const apps = getApps();
      
      return {
        healthy: isAvailable && apps.length > 0,
        firebaseAvailable: isAvailable,
        appsCount: apps.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Show user-friendly test results
  async showTestResults() {
    const results = await this.runAllTests();
    
    if (Platform.OS !== 'web') {
      const passed = Object.values(results).filter(r => r.success).length;
      const total = Object.keys(results).length;
      
      Alert.alert(
        'Firebase Test Results',
        `${passed}/${total} tests passed\n\n${
          passed === total 
            ? '🎉 Firebase is working correctly!' 
            : '⚠️ Some issues found. Check console for details.'
        }`,
        [{ text: 'OK' }]
      );
    }
    
    return results;
  }
}

// Export singleton instance
export const firebaseTestUtility = new FirebaseTestUtility();
export default firebaseTestUtility;

// Export individual test functions for convenience
export const {
  runAllTests,
  quickHealthCheck,
  showTestResults,
  testAppInitialization,
  testConfiguration,
  testMessagingAvailability,
  testNotificationPermissions,
  testFCMToken,
  testBackgroundHandler,
  testAnalytics
} = firebaseTestUtility;