export const theme = {
  colors: {
    background: '#000000',
    backgroundDark: '#1A1A1A',
<<<<<<< HEAD
=======
    surface: '#1A1A1A',
>>>>>>> master
    primary: '#FF4D67',
    secondary: '#FF8700',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
<<<<<<< HEAD
=======
    border: 'rgba(255, 255, 255, 0.2)',
>>>>>>> master
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
    recording: '#FF2D55',
    overlay: 'rgba(0,0,0,0.5)',
<<<<<<< HEAD
    placeholder: '#FFFFFF',
=======
    placeholder: 'rgba(255, 255, 255, 0.5)',
>>>>>>> master
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 14,
    },
    small: {
      fontSize: 12,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 6,
    },
  },
  animation: {
    scale: {
      pressed: 0.95,
      normal: 1,
    },
    duration: {
      short: 150,
      medium: 300,
      long: 500,
    },
  },
  video: {
    aspectRatio: 9/16,
    maxDuration: 60,
    thumbnailSize: {
      width: 320,
      height: 568,
    },
    compression: {
      quality: 0.8,
      bitrate: 2000000,
    },
  },
};

export const getStyle = (styleName) => {
  const styles = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      ...theme.shadows.medium,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.body.fontSize,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: theme.colors.text,
      fontSize: theme.typography.body.fontSize,
      fontWeight: 'bold',
    },
  };

  return styles[styleName];
};

export default theme;

