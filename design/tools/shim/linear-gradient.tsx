import React from "react";
import { flattenStyle } from "./react-native";

export function LinearGradient(props: any) {
  const { colors, start, end, style, ...rest } = props;
  return React.createElement("hg", { colors, start, end, style: flattenStyle(style) }, props.children);
}

export default LinearGradient;
