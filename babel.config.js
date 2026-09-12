module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // NativeWind v4: nativewind/babel is a preset (it also registers the
      // react-native-reanimated plugin internally — do not add it twice).
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./" },
        },
      ],
    ],
  };
};
