import { Linking, Platform, Share } from 'react-native';
<<<<<<< HEAD
=======
import { FRONTEND_URL, WEB_URL, MOBILE_URL } from '../config/constants';
>>>>>>> master

export const setupDeepLinking = (navigation) => {
  // Handle URLs when app is already open
  const handleUrl = ({ url }) => {
    if (url) {
<<<<<<< HEAD
      const route = url.replace(/.*?:\/\/?/, '');
      handleDeepLink(route, navigation);
=======
      try {
        const route = url.replace(/.*?:\/\/?/, '');
        console.log('Deep link received:', url, 'Route:', route);
        handleDeepLink(route, navigation);
      } catch (error) {
        console.error('Error handling deep link URL:', error);
      }
    }
  };

  // Try to open the native app on web for matching paths, then fallback
  const attemptOpenAppDeepLink = (pathname) => {
    if (Platform.OS !== 'web' || !pathname) return;

    // Normalize leading slash
    const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const [base, idOrTag] = path.split('/');

    // Only attempt for supported routes
    const supported = ['video', 'user', 'hashtag', 'messages', 'search', 'discover', 'upload', 'inbox', 'me'];
    if (!supported.includes(base)) return;

    // Construct app scheme
    const appScheme = `${MOBILE_URL}${base}${idOrTag ? '/' + idOrTag : ''}`;

    // Heuristic: only try on mobile browsers
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    try {
      // Android: try intent if available, fallback to direct scheme
      if (isAndroid) {
        // Direct scheme attempt
        window.location.href = appScheme;
        // Fallback after short delay keeps user on web route which SPA handles
        setTimeout(() => {}, 700);
      } else if (isIOS) {
        // iOS hidden iframe technique
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appScheme;
        document.body.appendChild(iframe);
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (_) {}
        }, 1500);
      }
    } catch (_) {
      // No-op; SPA fallback will handle the route
>>>>>>> master
    }
  };

  // Handle URLs when app is closed/in background
  const handleInitialUrl = async () => {
    try {
      let url = await Linking.getInitialURL();
      
      // For web, use the current pathname if no initial URL
      if (!url && Platform.OS === 'web') {
        url = window.location.pathname;
<<<<<<< HEAD
=======
        // Attempt native app open for matching paths, fallback to SPA
        attemptOpenAppDeepLink(url);
>>>>>>> master
      }

      if (url) {
        const route = url.replace(/.*?:\/\/?/, '');
<<<<<<< HEAD
=======
        console.log('Initial URL received:', url, 'Route:', route);
>>>>>>> master
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
<<<<<<< HEAD
  // Extract the base route without parameters
  const baseRoute = route.split('/')[0];
  
  // Handle specific routes
  switch (baseRoute) {
    case 'home':
      navigation.navigate('Main', { screen: 'Feed' });
=======
  try {
    // Extract the base route without parameters
    const baseRoute = route.split('/')[0];
    
    console.log('Handling deep link route:', route, 'Base route:', baseRoute);
    
    // Helper function to sanitize parameters
    const sanitizeParam = (param) => {
      if (!param || typeof param !== 'string') return param;
      return param.replace(/[<>\"'&]/g, '');
    };
    
    // Handle specific routes
    switch (baseRoute) {
    case 'home':
    case '':
      navigation.navigate('Main', { screen: 'Home' });
>>>>>>> master
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
<<<<<<< HEAD
        navigation.navigate('Main', { 
          screen: 'ViewProfile',
          params: { userId }
=======
        const sanitizedUserId = sanitizeParam(userId);
        navigation.navigate('Main', { 
          screen: 'Home',
          params: { 
            screen: 'ViewProfile',
            params: { userId: sanitizedUserId }
          }
>>>>>>> master
        });
      }
      break;
    case 'video':
      const videoId = route.split('/')[1];
      if (videoId) {
<<<<<<< HEAD
        navigation.navigate('Main', {
          screen: 'Feed',
          params: { videoId }
=======
        const sanitizedVideoId = sanitizeParam(videoId);
        navigation.navigate('Main', {
          screen: 'Home',
          params: { 
            screen: 'VideoPlayer',
            params: { videoId: sanitizedVideoId }
          }
>>>>>>> master
        });
      }
      break;
    case 'hashtag':
      const tag = route.split('/')[1];
      if (tag) {
<<<<<<< HEAD
        navigation.navigate('Main', {
          screen: 'HashtagVideos',
          params: { tag }
=======
        const sanitizedTag = sanitizeParam(tag);
        navigation.navigate('Main', {
          screen: 'Discover',
          params: { 
            screen: 'HashtagVideos',
            params: { tag: sanitizedTag }
          }
>>>>>>> master
        });
      }
      break;
    case 'search':
<<<<<<< HEAD
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
=======
      navigation.navigate('Main', { 
        screen: 'Home',
        params: { screen: 'Search' }
      });
      break;
    case 'messages':
      navigation.navigate('Main', { 
        screen: 'Home',
        params: { screen: 'ChatList' }
      });
      break;
    default:
      // If no specific route matches, preserve the current tab
      console.log('No matching route found for:', baseRoute);
      break;
  }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};

// Enhanced helper function to generate URLs for sharing
// Always use WEB_URL so shares are plain web links; mobile browsers will attempt to open the app and fallback to web
export const generateShareUrl = (screen, params = {}) => {
  const baseUrl = WEB_URL;

  switch (screen) {
    case 'video':
      const videoDescription = params.description 
        ? params.description.length > 100 
          ? params.description.substring(0, 100) + '...' 
          : params.description
        : 'Check out this amazing video!';
      
      return {
        url: `${baseUrl}/video/${params.videoId}`,
        message: `${videoDescription}\n\nWatch on TicToc India: `,
        title: 'Share Video',
        hashtags: '#TicTocIndia #ShortVideos'
      };
    case 'profile':
      const username = params.username || 'User';
      return {
        url: `${baseUrl}/user/${params.userId}`,
        message: `Check out @${username} on TicToc India: `,
        title: 'Share Profile',
        hashtags: '#TicTocIndia #Profile'
      };
    case 'hashtag':
      const tag = params.tag || 'trending';
      return {
        url: `${baseUrl}/hashtag/${tag}`,
        message: `Discover amazing #${tag} videos on TicToc India: `,
        title: 'Share Hashtag',
        hashtags: `#${tag} #TicTocIndia`
>>>>>>> master
      };
    default:
      return {
        url: baseUrl,
<<<<<<< HEAD
        message: 'Check out TikTok India: ',
        title: 'Share'
=======
        message: 'Join TicToc India and discover amazing short videos: ',
        title: 'TicToc India',
        hashtags: '#TicTocIndia #ShortVideos #Trending'
>>>>>>> master
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
<<<<<<< HEAD
    // Ensure the URL has our domain
    if (!urlObj.hostname.includes('yourdomain.com') && 
        !urlObj.protocol.includes('tiktokindia')) {
=======
    // Ensure the URL has our configured domain or scheme
    let webHost;
    try {
      webHost = new URL(WEB_URL).hostname;
    } catch (_) {
      webHost = undefined;
    }

    const isWebMatch = webHost ? urlObj.hostname === webHost : false;
    const isAppScheme = urlObj.protocol.replace(':', '') === MOBILE_URL.replace('://', '');

    if (!isWebMatch && !isAppScheme) {
>>>>>>> master
      return null;
    }
    return url;
  } catch (e) {
    return null;
  }
};
<<<<<<< HEAD
=======



// Function to check if a URL is a valid deep link
export const isValidDeepLink = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const isAppScheme = urlObj.protocol === 'TicTocindia:';
    const isWebUrl = urlObj.hostname && urlObj.hostname.includes('TicToc-india');
    
    return isAppScheme || isWebUrl;
  } catch (e) {
    return false;
  }
};
>>>>>>> master
