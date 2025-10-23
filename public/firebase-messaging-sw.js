// Firebase messaging service worker for background notifications on web
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "process.env.FIREBASE_API_KEY",
  authDomain: "process.env.FIREBASE_AUTH_DOMAIN",
  databaseURL: "process.env.FIREBASE_DATABASE_URL",
  projectId: "process.env.FIREBASE_PROJECT_ID",
  storageBucket: "process.env.FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "process.env.FIREBASE_MESSAGING_SENDER_ID",
  appId: "process.env.FIREBASE_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'TicToc India';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png',
    tag: 'TicToc-notification',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle notification click - open the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      const data = event.notification.data;
      
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to the client with notification data
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data
          });
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        let url = self.location.origin;
        
        // Add navigation based on notification data
        if (data && data.type) {
          switch (data.type) {
            case 'video':
              if (data.videoId) {
                url += `/video/${data.videoId}`;
              }
              break;
            case 'profile':
              if (data.userId) {
                url += `/profile/${data.userId}`;
              }
              break;
            case 'message':
              url += '/messages';
              break;
            default:
              break;
          }
        }
        
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push event (for additional background processing)
self.addEventListener('push', function(event) {
  
  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Additional background processing can be done here
      // For example: update cached data, sync with server, etc.
      
    } catch (error) {
      // Error parsing push payload
    }
  }
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  
  // Clean up old caches or perform other activation tasks
  event.waitUntil(
    // Claim all clients immediately
    self.clients.claim()
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});