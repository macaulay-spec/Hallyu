// One-off M0 brand-asset generator: layered wave arcs (Spec §35A) on #0F0F0F.
// Output: assets/icon.png (1024), assets/adaptive-icon.png (1024 transparent
// foreground), assets/splash-icon.png (transparent mark), assets/favicon.png (48).
// Keep for re-tuning brand art (D-20): node scripts/make-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const DEEP = "#4A1C6E";
const MID = "#7B4FD8";
const OCEAN = "#2D6CDF";
const BG = "#0F0F0F";

// Layered arcs rising left-to-right like a signal wave; the Hallyu wave motif.
function waveSvg(size, withBg) {
  const c = size / 2;
  const arcs = [0.28, 0.42, 0.56, 0.7].map(
    (r, i) =>
      `<circle cx="${c}" cy="${c * 1.28}" r="${size * r}" fill="none" stroke="${[DEEP, MID, OCEAN, MID][i]}" stroke-opacity="${0.55 + i * 0.12}" stroke-width="${size * 0.035}"/>`
  );
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      ${withBg ? `<rect width="${size}" height="${size}" fill="${BG}"/>` : ""}
      <circle cx="${c}" cy="${c * 0.62}" r="${size * 0.045}" fill="${OCEAN}" fill-opacity="0.9"/>
      ${arcs.join("\n      ")}
      <rect y="${size * 0.82}" width="${size}" height="${size * 0.18}" fill="${BG}" fill-opacity="${withBg ? 1 : 0}"/>
    </svg>`
  );
}

await mkdir("assets", { recursive: true });
await sharp(waveSvg(1024, true)).png().toFile("assets/icon.png");
await sharp(waveSvg(1024, false)).png().toFile("assets/adaptive-icon.png");
await sharp(waveSvg(640, false)).png().toFile("assets/splash-icon.png");
await sharp(waveSvg(48, true)).png().toFile("assets/favicon.png");
console.log("brand assets written: icon, adaptive-icon, splash-icon, favicon");
