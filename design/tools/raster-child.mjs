// Renders one SVG → PNG with resvg in an isolated process (resvg can hard-panic
// on rare SVG constructs; isolating keeps one bad frame from killing the run).
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
const [, , svgPath, outPath, width] = process.argv;
const svg = fs.readFileSync(svgPath, "utf8");
const png = new Resvg(svg, { fitTo: { mode: "width", value: Number(width) } }).render().asPng();
fs.writeFileSync(outPath, png);
