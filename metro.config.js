const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname)];

config.resolver.alias = {
  "@": path.resolve(__dirname),
};

// NativeWind v4 (required): every className in the app is compiled by the
// NativeWind Metro pipeline against global.css. Without this wrapper the
// bundle ships raw class strings with no stylesheet — text-only UI, no tokens,
// no gradients. This was the root cause of the "unstyled app".
module.exports = withNativeWind(config, { input: "./global.css" });
