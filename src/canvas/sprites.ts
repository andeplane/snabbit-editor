import { LEVER_FRAMES } from "../core/leverAnimation";
import { appURL } from "../core/paths";
// Original HD source PNGs, drawn at half resolution. Atlas packing rotation is
// intentionally irrelevant: these are unrotated, untrimmed source images.
import type { DrawContext } from "./DrawContext";
export const BLOCK_SPRITES: Record<string, string[]> = {
  "1": Array.from({ length: 9 }, (_, i) => `metal0${i}`),
  "2": Array.from({ length: 10 }, (_, i) => `rock0${i}`),
  "3": Array.from({ length: 10 }, (_, i) => `dirt0${i}`),
  "4": ["bluegem00", "bluegem01", "bluegem02", "bluegem03"],
  "6": ["life"],
  "7": ["milestone"],
  "8": ["star"],
  "9": ["diamond00"],
  ":": ["speedup"],
  ";": ["slowdown"],
  "<": ["mesh00"],
  "=": [...LEVER_FRAMES],
};
export function spriteURL(name: string) {
  return appURL(
    `assets/${name.startsWith("switch-") ? "switches" : name.startsWith("snabbit-") ? "snabbit" : "world"}/${name}.png`,
  );
}
export interface SpriteLibrary {
  preloadSprites(): Promise<string[]>;
  getSprite(name: string): HTMLImageElement | null;
  getSpriteForBlock(
    char: string,
    row: number,
    col: number,
    active?: boolean,
    frame?: number,
  ): HTMLImageElement | null;
  drawImage(
    ctx: DrawContext,
    name: string,
    x: number,
    y: number,
    scale?: number,
  ): void;
}
export type RenderAssets = Pick<
  SpriteLibrary,
  "getSpriteForBlock" | "drawImage"
>;
/** Each instance owns its cache. Inject the image factory for another loading
 * environment or deterministic tests; browser callers use the default instance. */
export function createSpriteLibrary(
  imageFactory: () => HTMLImageElement = () => new Image(),
): SpriteLibrary {
  const cache = new Map<string, HTMLImageElement>();
  const pending = new Map<string, Promise<HTMLImageElement | null>>();
  function loadImage(name: string): Promise<HTMLImageElement | null> {
    if (pending.has(name)) return pending.get(name)!;
    const p = new Promise<HTMLImageElement | null>((resolve) => {
      const img = imageFactory();
      img.onload = () => {
        cache.set(name, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = spriteURL(name);
    });
    pending.set(name, p);
    return p;
  }
  function getSprite(name: string) {
    if (!pending.has(name)) void loadImage(name);
    return cache.get(name) ?? null;
  }
  return {
    async preloadSprites() {
      const names = [
        ...new Set([
          ...Object.values(BLOCK_SPRITES).flat(),
          "snabbit-head",
          "snabbit-head-bg",
          "snabbit-jaw",
          "snabbit-iris",
          "snabbit-eyelid-00",
          "snabbit-body-light-00",
          "snabbit-body-dark-00",
          "snabbit-tail",
          "snabbit-head-chew-00",
          "snabbit-head-chew-01",
          "snabbit-head-chew-02",
          "snabbit-eyelid-10",
        ]),
      ];
      const loaded = await Promise.all(names.map(loadImage));
      return names.filter((_, i) => !loaded[i]);
    },
    getSprite,
    getSpriteForBlock(char, row, col, active = false, frame?: number) {
      const variants = BLOCK_SPRITES[char];
      return variants
        ? getSprite(
            variants[
              char === "="
                ? frame === undefined
                  ? active
                    ? 5
                    : 0
                  : Math.min(5, Math.max(0, Math.round(frame)))
                : (row * 3 + col * 7) % variants.length
            ],
          )
        : null;
    },
    drawImage(ctx, name, x, y, scale = 1) {
      const img = getSprite(name);
      if (img)
        ctx.drawImage(
          img,
          x - (img.width / 4) * scale,
          y - (img.height / 4) * scale,
          (img.width / 2) * scale,
          (img.height / 2) * scale,
        );
    },
  };
}
const defaultSprites = createSpriteLibrary();
export const { preloadSprites, getSprite, getSpriteForBlock, drawImage } =
  defaultSprites;
