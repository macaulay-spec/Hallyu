/**
 * Static renderer: turns the coded prototype screens into PNG previews.
 *
 * Pipeline: real screen components → react-test-renderer element tree (with the
 * RN shim) → satori (flexbox + real font metrics) → SVG → resvg → PNG.
 *
 * The images in docs/design-previews/ are therefore renders OF THIS CODE, not
 * generated artwork: change a component and the preview changes with it.
 */
import React from "react";
import TestRenderer from "react-test-renderer";
import satori from "satori";
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SCREENS } from "../registry";
import { ThemeProvider } from "../theme";
import { DEVICE } from "../tokens";

// The driver spawns this bundle with cwd = repo root.
const ROOT = process.cwd();
const HERE_DIR = path.join(ROOT, "design/tools");
const BUILD_DIR = path.join(HERE_DIR, ".build");
const OUT = path.join(ROOT, "docs/design-previews");

/* --------------------------------- fonts ---------------------------------- */

function loadFont(rel: string): Buffer {
  return fs.readFileSync(path.join(ROOT, "node_modules", rel));
}

const FONTS: { name: string; data: Buffer; weight: number; style: "normal" }[] = [
  ...[400, 500, 600, 700, 800].map((w) => ({
    name: "Inter",
    data: loadFont(`@expo-google-fonts/inter/${w === 400 ? "400Regular" : w === 500 ? "500Medium" : w === 600 ? "600SemiBold" : w === 700 ? "700Bold" : "800ExtraBold"}/Inter_${w === 400 ? "400Regular" : w === 500 ? "500Medium" : w === 600 ? "600SemiBold" : w === 700 ? "700Bold" : "800ExtraBold"}.ttf`),
    weight: w,
    style: "normal" as const,
  })),
  { name: "Noto Sans KR", data: loadFont("@expo-google-fonts/noto-sans-kr/500Medium/NotoSansKR_500Medium.ttf"), weight: 500, style: "normal" },
  { name: "Noto Sans KR", data: loadFont("@expo-google-fonts/noto-sans-kr/700Bold/NotoSansKR_700Bold.ttf"), weight: 700, style: "normal" },
  { name: "Ionicons", data: loadFont("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"), weight: 400, style: "normal" },
];

/* ------------------------------ tree → satori ----------------------------- */

type Node = { type: string; props: Record<string, any>; children: (Node | string)[] } | string;

const FAMILY_MAP: [RegExp, string][] = [
  [/^Inter_/, "Inter"],
  [/^NotoSansKR_/, "Noto Sans KR"],
  [/^Ionicons$/, "Ionicons"],
];

function mapFamily(f?: string): string | undefined {
  if (!f) return undefined;
  for (const [re, to] of FAMILY_MAP) if (re.test(f)) return to;
  return f;
}

function expand(style: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  let shadow: { color?: string; y?: number; r?: number; o?: number } = {};
  for (const [k, v] of Object.entries(style ?? {})) {
    if (v === undefined || v === null) continue;
    switch (k) {
      case "inset":
        out.top = out.left = out.right = out.bottom = v;
        break;
      // RN axis shorthands → CSS longhands (satori speaks CSS, not RN).
      case "paddingHorizontal":
        out.paddingLeft = out.paddingRight = v;
        break;
      case "paddingVertical":
        out.paddingTop = out.paddingBottom = v;
        break;
      case "marginHorizontal":
        out.marginLeft = out.marginRight = v;
        break;
      case "marginVertical":
        out.marginTop = out.marginBottom = v;
        break;
      case "transform": {
        const parts: string[] = [];
        for (const t of v as any[]) {
          if (t.rotate) parts.push(`rotate(${t.rotate})`);
        }
        if (parts.length) out.transform = parts.join(" ");
        break;
      }
      case "shadowColor":
        shadow.color = v;
        break;
      case "shadowOffset":
        shadow.y = (v as any).height;
        break;
      case "shadowRadius":
        shadow.r = v;
        break;
      case "shadowOpacity":
        shadow.o = v;
        break;
      case "flex":
        // RN shorthand → longhands satori's yoga binding expects.
        out.flexGrow = v;
        out.flexShrink = 1;
        out.flexBasis = 0;
        break;
      case "elevation":
      case "includeFontPadding":
      case "writingDirection":
      case "textAlignVertical":
        break;
      case "fontFamily":
        out.fontFamily = mapFamily(v as string);
        break;
      case "borderStyle":
        out.borderStyle = v === "dashed" ? "dashed" : "solid";
        break;
      default:
        out[k] = v;
    }
  }
  if (shadow.color && shadow.o) {
    const a = Math.round(shadow.o * 255)
      .toString(16)
      .padStart(2, "0");
    out.boxShadow = `0 ${shadow.y ?? 0}px ${shadow.r ?? 0}px ${shadow.color}${a}`;
  }
  return out;
}

function divStyle(style: Record<string, any>): Record<string, any> {
  const s = expand(style);
  return { display: "flex", flexDirection: "column", ...s };
}

function textStyle(style: Record<string, any>): Record<string, any> {
  const s = expand(style);
  if (s.fontWeight) s.fontWeight = Number(s.fontWeight);
  // RN lineHeight is px; CSS/satori numeric line-height is a font-size multiplier.
  if (typeof s.lineHeight === "number" && typeof s.fontSize === "number" && s.fontSize > 0) {
    s.lineHeight = s.lineHeight / s.fontSize;
  }
  return s;
}

function gradientCss(props: Record<string, any>): string {
  const { start, end, colors } = props;
  let dir = "to bottom right";
  if (start && end) {
    if (Math.abs(start.x - end.x) < 0.01) dir = end.y > start.y ? "to bottom" : "to top";
    else if (Math.abs(start.y - end.y) < 0.01) dir = end.x > start.x ? "to right" : "to left";
  }
  return `linear-gradient(${dir}, ${(colors as string[]).join(", ")})`;
}

function convert(node: Node): any {
  if (typeof node === "string") return node;
  const kids = (node.children ?? []).map(convert);
  const single = kids.length === 1 ? kids[0] : kids;
  switch (node.type) {
    case "ht":
      return { type: "span", props: { style: textStyle(node.props.style), children: single } };
    case "hg":
      return {
        type: "div",
        props: { style: { display: "flex", flexDirection: "column", backgroundImage: gradientCss(node.props), ...expand(node.props.style) }, children: single },
      };
    case "him": {
      const src = node.props.source?.uri ?? node.props.source;
      return {
        type: "img",
        props: {
          src: typeof src === "string" ? src : undefined,
          style: { objectFit: "cover", ...divStyle(node.props.style) },
        },
      };
    }
    default:
      return { type: "div", props: { style: divStyle(node.props.style), children: single } };
  }
}

/* ---------------------------------- main ---------------------------------- */

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest: { id: string; title: string; group: string; height: number; file: string }[] = [];

  const only = process.env.ONLY;
  const list = only ? SCREENS.filter((s) => s.id.includes(only)) : SCREENS;
  for (const screen of list) {
    const height = screen.height ?? DEVICE.height;
    const renderer = TestRenderer.create(
      React.createElement(ThemeProvider, { initial: "dark" }, screen.make(() => {}))
    );
    const json = renderer.toJSON() as Node;
    renderer.unmount();

    const body = convert(json);
    if (process.env.DEBUG_TREE && manifest.length === 0) {
      const walk = (n: any, d: number): string => {
        if (typeof n === "string") return " ".repeat(d * 2) + `TEXT ${JSON.stringify(n).slice(0, 30)}\n`;
        const st = n.props?.style ?? {};
        let out = " ".repeat(d * 2) + `${n.type} h=${st.height} flex=${st.flexGrow ?? st.flex} pad=${st.paddingTop ?? 0} mg=${st.marginTop ?? 0}\n`;
        const kids = n.props?.children; for (const c of Array.isArray(kids) ? kids : kids ? [kids] : []) out += walk(c, d + 1);
        return out;
      };
      console.log(walk(body, 0).slice(0, 3000));
    }
    const tree = {
      type: "div",
      props: {
        style: { width: DEVICE.width, height, display: "flex", flexDirection: "column", overflow: "hidden" },
        children: body,
      },
    };

    const svg = await satori(tree as any, { width: DEVICE.width, height, fonts: FONTS as any });
    if (process.env.DUMP_SVG) fs.writeFileSync(path.join(OUT, `_debug-${screen.id}.svg`), svg);
    // Rasterize: resvg in a child process (panic-isolated), sharp as fallback.
    const svgPath = path.join(BUILD_DIR, "svg", `${screen.id}.svg`);
    fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    fs.writeFileSync(svgPath, svg);
    const file = `${screen.id}.png`;
    const outPath = path.join(OUT, file);
    const child = spawnSync(process.execPath, [path.join(HERE_DIR, "raster-child.mjs"), svgPath, outPath, String(DEVICE.width * 3)], { cwd: ROOT });
    if (child.status !== 0) {
      const png = await sharp(Buffer.from(svg)).resize({ width: DEVICE.width * 3 }).png().toBuffer();
      fs.writeFileSync(outPath, png);
      console.log(`    (fallback rasterizer for ${screen.id})`);
    }
    manifest.push({ id: screen.id, title: screen.title, group: screen.group, height, file });
    console.log(`  ✓ ${file}  (${DEVICE.width * 3}×${height * 3})`);
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n${manifest.length} previews written to docs/design-previews/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
