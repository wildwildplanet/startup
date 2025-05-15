const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it.
  // Add resolution for web-specific extensions
  config.resolve.extensions = [
    '.web.js', '.web.jsx', '.web.ts', '.web.tsx',
    '.js', '.jsx', '.ts', '.tsx'
  ];

  // Make sure the entry points are resolved properly
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-web': path.resolve(__dirname, 'node_modules/react-native-web'),
    '@expo/vector-icons': path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
  };

  return config;
}; 