import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const editorRoot = fileURLToPath(new URL("..", import.meta.url));
const resources = existsSync(path.join(editorRoot, "game-resources"))
  ? path.join(editorRoot, "game-resources")
  : path.join(editorRoot, "../Resources");
const assets = path.join(editorRoot, "public/assets");
await mkdir(assets, { recursive: true });
for (const [src, dest] of [
  ["World/Space", "world"],
  ["Snabbit", "snabbit"],
  ["Background/backdrop-hd.png", "backdrop.png"],
  ["Levels/data/storyData.txt", "story.json"],
  ["Icons/Icon-512.png", "snabbit-icon.png"],
]) {
  await cp(path.join(resources, src), path.join(assets, dest), {
    recursive: true,
  });
}
// Source artwork is HD (2x). Metadata is deliberately independent of atlas packing/rotation.
const names = [
  "metal00",
  "rock00",
  "dirt00",
  "bluegem00",
  "life",
  "star",
  "diamond00",
  "mesh00",
  "speedup",
  "slowdown",
  "milestone",
];
const sizes = {};
for (const name of names) {
  const b = await readFile(path.join(assets, "world", `${name}.png`));
  sizes[name] = [b.readUInt32BE(16) / 2, b.readUInt32BE(20) / 2];
}
await writeFile(path.join(assets, "source-sizes.json"), JSON.stringify(sizes));
console.log("Prepared original game artwork and bundled story packs.");
