import { it, expect, vi } from "vitest";
const spies = vi.hoisted(() => ({
  render: vi.fn(),
  create: vi.fn(),
  preload: vi.fn(async () => []),
}));
vi.mock("react-dom/client", () => ({
  createRoot: spies.create.mockReturnValue({ render: spies.render }),
}));
vi.mock("../src/App", () => ({ App: () => null }));
vi.mock("../src/canvas/sprites", () => ({ preloadSprites: spies.preload }));
it("mounts the editor and preloads artwork at application entry", async () => {
  const root = document.createElement("div");
  root.id = "root";
  document.body.append(root);
  await import("../src/main");
  expect(spies.create).toHaveBeenCalledWith(root);
  expect(spies.render).toHaveBeenCalledOnce();
  expect(spies.preload).toHaveBeenCalledOnce();
  root.remove();
});
