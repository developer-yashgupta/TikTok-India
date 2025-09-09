
# Firebase Setup Guide for TikTok India

This guide will help you set up Firebase Cloud Messaging for push notifications in your TikTok India app.

## 🚀 Quick Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "tiktok-india")
4. Enable Google Analytics (recommended)
5. Choose your Google Analytics account
6. Click "Create project"

### 2. Enable Firebase Cloud Messaging

1. In your Firebase project, go to "Project settings" (gear icon)
2. Click on the "Cloud Messaging" tab
3. Note down your "Server key" and "Sender ID" (you'll need these later)

### 3. Add Android App

1. In Firebase Console, click "Add app" → Android icon
2. Package name: `com.gggroup.tiktokindia`
3. App nickname: "TikTok India Android"
4. Click "Register app"
5. Download `google-services.json`
6. Place it in: `android/app/google-services.json` (replace the existing file)

### 4. Add iOS App (Optional)

1. In Firebase Console, click "Add app" → iOS icon
2. Bundle ID: `com.gggroup.tiktokindia`
3. App nickname: "TikTok India iOS"
4. Click "Register app"
5. Download `GoogleService-Info.plist`
6. Place it in: `ios/tiktokclone/GoogleService-Info.plist` (replace the existing file)

### 5. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Update the Firebase values in `.env`:

```env
# Get these from Firebase Console → Project Settings → General
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Backend API (update if different)
API_URL=http://192.168.0.103:5000/api
```

### 6. Update google-services.json

Replace the placeholder values in `android/app/google-services.json` with your actual Firebase project values:

```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "your-project-id",
    "storage_bucket": "your-project.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.gggroup.tiktokindia"
        }
      },
      "oauth_client": [
        {
          "client_id": "YOUR_CLIENT_ID",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "your-api-key"
        }
      ]
    }
  ],
  "configuration_version": "1"
}
```

### 7. Update GoogleService-Info.plist (iOS)

Replace the placeholder values in `ios/tiktokclone/GoogleService-Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>YOUR_CLIENT_ID</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>YOUR_REVERSED_CLIENT_ID</string>
	<key>API_KEY</key>
	<string>your-api-key</string>
	<key>GCM_SENDER_ID</key>
	<string>YOUR_SENDER_ID</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.gggroup.tiktokindia</string>
	<key>PROJECT_ID</key>
	<string>your-project-id</string>
	<key>STORAGE_BUCKET</key>
	<string>your-project.appspot.com</string>
	<key>GOOGLE_APP_ID</key>
	<string>YOUR_GOOGLE_APP_ID</string>
</dict>
</plist>
```

## 🔧 Backend Setup (Optional)

If you want to send notifications from your backend:

1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Update your backend `.env` with the values from the JSON file

## 🧪 Testing

### Test Firebase Initialization

1. Run the app: `npm run android`
2. Check console logs for:
   - ✅ "Firebase app initialized successfully"
   - ✅ "Firebase messaging initialized successfully"

### Test Notifications

1. Send a test notification from Firebase Console
2. Or use the backend API to send notifications
3. Check that notifications appear on your device

## 🐛 Troubleshooting

### "No Firebase App '[DEFAULT]' has been created"
- ✅ Check that `.env` file has correct Firebase values
- ✅ Verify `google-services.json` is in the correct location
- ✅ Make sure package name matches in Firebase Console

### "Firebase messaging permission denied"
- ✅ Grant notification permissions in device settings
- ✅ Check that notifications are enabled for the app

### Build fails
- ✅ Clean and rebuild: `cd android && ./gradlew clean && cd .. && npm run android`
- ✅ Check that all Firebase packages are installed

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## 🎯 Next Steps

1. ✅ Firebase is configured and ready
