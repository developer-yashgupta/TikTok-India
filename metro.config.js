// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Add custom asset extensions
defaultConfig.resolver.assetExts.push(
  'db', 'mp4', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'fcscript'
);

// Add custom source extensions
defaultConfig.resolver.sourceExts.push('mjs');

// Add module resolver aliases
defaultConfig.resolver.extraNodeModules = {
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@assets': path.resolve(__dirname, 'assets'),
};

// Configure transformer
defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Configure watch folders
defaultConfig.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
  path.resolve(__dirname, 'node_modules'),
];

// Performance optimizations
defaultConfig.maxWorkers = 4;
defaultConfig.resetCache = false;

// Server configuration
defaultConfig.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('X-Metro-Cache', 'true');
      return middleware(req, res, next);
    };
    },
};

module.exports = defaultConfig;
