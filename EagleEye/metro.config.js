const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
