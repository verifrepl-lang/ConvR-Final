const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("zip", "dat", "isx", "bpc", "tmb");

module.exports = config;
