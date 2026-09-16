import React from "react";
import glyphMap from "../../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";

/**
 * Icon shim: renders the real Ionicons codepoint as text in the Ionicons font,
 * so the static renderer draws exactly the glyphs the app shows.
 */
function IoniconsComponent(props: { name: string; size?: number; color?: string; style?: unknown }) {
  const code = (glyphMap as Record<string, number>)[props.name] ?? 0xe900;
  return React.createElement(
    "ht",
    {
      style: {
        fontFamily: "Ionicons",
        fontSize: props.size ?? 20,
        lineHeight: Math.round((props.size ?? 20) * 1.25),
        color: props.color ?? "#000000",
        textAlign: "center",
      },
    },
    String.fromCodePoint(code)
  );
}

export const Ionicons = Object.assign(IoniconsComponent, { glyphMap });
export default Ionicons;
