import { existsSync } from "node:fs";
import { resolve } from "node:path";
export function storyFile(): string {
  const standalone = resolve(
    process.cwd(),
    "game-resources/Levels/data/storyData.txt",
  );
  return existsSync(standalone)
    ? standalone
    : resolve(process.cwd(), "../Resources/Levels/data/storyData.txt");
}
