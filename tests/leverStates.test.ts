import { it, expect, vi } from "vitest";
import { createSpriteLibrary, spriteURL } from "../src/canvas/sprites";
import { renderGrid } from "../src/canvas/HexGridRenderer";
import { startRun, advanceRun } from "../src/core/simulation";
import type { RenderAssets } from "../src/canvas/sprites";
import { editor, cells, level } from "./fixtures";
import { graphics } from "./uiFixtures";
it("uses fixed switch asset names for the orange OFF and green ON positions", () => {
  const images: HTMLImageElement[] = [];
  const library = createSpriteLibrary(() => {
    const image = document.createElement("img");
    images.push(image);
    return image;
  });
  expect(spriteURL("switch-off")).toBe("/assets/switches/switch-off.png");
  library.getSpriteForBlock("=", 0, 0);
  expect(images[0].src).toContain("switch-off.png");
  library.getSpriteForBlock("=", 1, 1, true);
  expect(images[1].src).toContain("switch-on.png");
});
it("keeps switches visible after crossing and flips their image using isolated run state", () => {
  const { store } = editor();
  store.getState().loadLevel(cells(level(), { 1: "=" }));
  const board = store.getState();
  const off = startRun(board),
    on = advanceRun(board, off, 1),
    sprite = document.createElement("img");
  const getSpriteForBlock = vi.fn<RenderAssets["getSpriteForBlock"]>(
    () => sprite,
  );
  const assets: RenderAssets = { getSpriteForBlock, drawImage: vi.fn() };
  renderGrid(
    graphics().ctx,
    { ...board, test: off },
    640,
    400,
    [],
    0,
    1,
    assets,
  );
  expect(getSpriteForBlock).toHaveBeenCalledWith("=", 0, 1, false);
  getSpriteForBlock.mockClear();
  renderGrid(
    graphics().ctx,
    { ...board, test: on },
    640,
    400,
    [],
    0,
    1,
    assets,
  );
  expect(getSpriteForBlock).toHaveBeenCalledWith("=", 0, 1, true);
  getSpriteForBlock.mockClear();
  renderGrid(
    graphics().ctx,
    { ...board, test: startRun(board) },
    640,
    400,
    [],
    0,
    1,
    assets,
  );
  expect(getSpriteForBlock).toHaveBeenCalledWith("=", 0, 1, false);
});
