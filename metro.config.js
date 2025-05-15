// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the project
config.watchFolders = [projectRoot];

// 2. Enable Expo Router support
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 3. Make sure .web.js extensions are properly resolved
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];
config.resolver.extraNodeModules = {
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
};

module.exports = config; 