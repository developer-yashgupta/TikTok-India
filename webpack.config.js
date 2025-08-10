const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@react-navigation']
    }
  }, argv);

  // Customize the config
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    'crypto': false,
    'react-native$': 'react-native-web',
  };

  // Fix for the noscript issue
  config.output = {
    ...config.output,
    publicPath: '/'
  };

  // Handle platform-specific extensions
  config.resolve.extensions = [
    '.web.js',
    '.web.jsx',
    '.web.ts',
    '.web.tsx',
    '.js',
    '.jsx',
    '.ts',
    '.tsx'
  ];

  // Remove existing rules for images
  config.module.rules = config.module.rules.filter(rule => {
    if (rule.test) {
      return !rule.test.toString().includes('png') && 
             !rule.test.toString().includes('jpg') && 
             !rule.test.toString().includes('gif') &&
             !rule.test.toString().includes('ttf') &&
             !rule.test.toString().includes('otf');
    }
    return true;
  });

  // Add loaders for assets and fonts
  config.module.rules.push(
    {
      test: /\.(png|jpg|jpeg|gif|ico|webp)$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'static/media/[name].[hash:8].[ext]',
            esModule: false
          }
        }
      ]
    },
    {
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            native: true,
            dimensions: false
          }
        }
      ]
    },
    {
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'static/media/[name].[hash:8].[ext]',
            esModule: false
          }
        }
      ]
    }
  );

  // Fix for url-loader esModule issue
  config.module.rules.forEach(rule => {
    if (rule.use && Array.isArray(rule.use)) {
      rule.use.forEach(loader => {
        if (loader.loader === 'url-loader' || loader.loader === 'file-loader') {
          loader.options = { ...loader.options, esModule: false };
        }
      });
    }
  });

  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    path: false,
    fs: false
  };

  return config;
};
