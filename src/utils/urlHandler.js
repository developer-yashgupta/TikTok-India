import { Linking, Platform, Share } from 'react-native';

export const setupDeepLinking = (navigation) => {
  // Handle URLs when app is already open
  const handleUrl = ({ url }) => {
    if (url) {
      const route = url.replace(/.*?:\/\/?/, '');
      handleDeepLink(route, navigation);
    }
  };

  // Handle URLs when app is closed/in background
  const handleInitialUrl = async () => {
    try {
      let url = await Linking.getInitialURL();
      
      // For web, use the current pathname if no initial URL
      if (!url && Platform.OS === 'web') {
        url = window.location.pathname;
      }

      if (url) {
        const route = url.replace(/.*?:\/\/?/, '');
        handleDeepLink(route, navigation);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  };

  // Subscribe to URL events when app is open
  const subscription = Linking.addEventListener('url', handleUrl);

  // Check for initial URL when app starts
  handleInitialUrl();

  // Cleanup function
  return () => {
    subscription.remove();
  };
};

const handleDeepLink = (route, navigation) => {
  // Extract the base route without parameters
  const baseRoute = route.split('/')[0];
  
  // Handle specific routes
  switch (baseRoute) {
    case 'home':
      navigation.navigate('Main', { screen: 'Feed' });
      break;
    case 'discover':
      navigation.navigate('Main', { screen: 'Discover' });
      break;
    case 'me':
      navigation.navigate('Main', { screen: 'Profile' });
      break;
    case 'upload':
      navigation.navigate('Main', { screen: 'Upload' });
      break;
    case 'inbox':
      navigation.navigate('Main', { screen: 'Inbox' });
      break;
    case 'user':
      const userId = route.split('/')[1];
      if (userId) {
        navigation.navigate('Main', { 
          screen: 'ViewProfile',
          params: { userId }
        });
      }
      break;
    case 'video':
      const videoId = route.split('/')[1];
      if (videoId) {
        navigation.navigate('Main', {
          screen: 'Feed',
          params: { videoId }
        });
      }
      break;
    case 'hashtag':
      const tag = route.split('/')[1];
      if (tag) {
        navigation.navigate('Main', {
          screen: 'HashtagVideos',
          params: { tag }
        });
      }
      break;
    case 'search':
      navigation.navigate('Main', { screen: 'Search' });
      break;
    default:
      // If no specific route matches, preserve the current tab
      break;
  }
};

// Enhanced helper function to generate URLs for sharing
export const generateShareUrl = (screen, params = {}) => {
  const baseUrl = Platform.select({
    web: 'https://yourdomain.com',
    default: 'tiktokindia://'
  });

  switch (screen) {
    case 'video':
      return {
        url: `${baseUrl}/video/${params.videoId}`,
        message: params.description 
          ? `${params.description}\n\nWatch this video on TikTok India: `
          : 'Watch this video on TikTok India: ',
        title: 'Share Video'
      };
    case 'profile':
      return {
        url: `${baseUrl}/user/${params.userId}`,
        message: params.username 
          ? `Check out @${params.username} on TikTok India: `
          : 'Check out this profile on TikTok India: ',
        title: 'Share Profile'
      };
    case 'hashtag':
      return {
        url: `${baseUrl}/hashtag/${params.tag}`,
        message: `Check out #${params.tag} on TikTok India: `,
        title: 'Share Hashtag'
      };
    default:
      return {
        url: baseUrl,
        message: 'Check out TikTok India: ',
        title: 'Share'
      };
  }
};

// New function to handle sharing
export const shareContent = async (type, params = {}) => {
  try {
    const shareData = generateShareUrl(type, params);
    
    // For web platform
    if (Platform.OS === 'web' && navigator.share) {
      await navigator.share({
        title: shareData.title,
        text: shareData.message,
        url: shareData.url
      });
      return { success: true };
    }
    
    // For mobile platforms
    const result = await Share.share({
      message: `${shareData.message}${shareData.url}`,
      url: shareData.url, // iOS only
      title: shareData.title // Android only
    }, {
      dialogTitle: shareData.title, // Android only
      subject: shareData.title, // iOS only
      tintColor: '#ff2b54' // iOS only
    });

    if (result.action === Share.sharedAction) {
      // Track successful share
      return { success: true, result };
    } else if (result.action === Share.dismissedAction) {
      // User dismissed the share dialog
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing:', error);
    return { success: false, error };
  }
};

// Function to validate and format share URLs
export const validateShareUrl = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Ensure the URL has our domain
    if (!urlObj.hostname.includes('yourdomain.com') && 
        !urlObj.protocol.includes('tiktokindia')) {
      return null;
    }
    return url;
  } catch (e) {
    return null;
  }
};
