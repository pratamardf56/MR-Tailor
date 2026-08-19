const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tambahkan dukungan untuk file WASM (dibutuhkan oleh expo-sqlite di versi Web)
config.resolver.assetExts.push('wasm');

module.exports = config;
