import { it, expect, vi } from "vitest";
import { appURL } from "../src/core/paths";
import { browserRepository } from "../src/core/repository";
it("resolves original assets under root, project Pages and relative bases", () => {
  expect(appURL("/assets/star.png", "/")).toBe("/assets/star.png");
  expect(appURL("assets/star.png", "/snabbit-editor/")).toBe(
    "/snabbit-editor/assets/star.png",
  );
  expect(appURL("assets/star.png", "")).toBe("assets/star.png");
  expect(appURL("api/story")).toBe("/api/story");
});
it("hosted builds load bundled data without requesting a nonexistent save API", async () => {
  vi.stubEnv("PROD", true);
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetcher);
  await expect(browserRepository.read()).rejects.toThrow("Standalone");
  expect(fetcher).not.toHaveBeenCalled();
});
