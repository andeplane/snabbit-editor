import { describe, it, expect, vi } from "vitest";
import {
  loadRepository,
  saveRepository,
  downloadJSON,
  browserRepository,
  browserDownload,
  RepositoryPorts,
  DownloadPorts,
} from "../src/core/repository";
import { editor, packs, level } from "./fixtures";
function ports(): RepositoryPorts {
  return {
    read: vi.fn(async () => ({ packs: packs(), hash: "first" })),
    bundled: vi.fn(async () => JSON.stringify(packs())),
    write: vi.fn(async () => ({ hash: "next", message: "Saved." })),
  };
}
describe("injected repository and download services", () => {
  it("loads repo JSON automatically and saves all metadata with a concurrency token", async () => {
    const { store } = editor(),
      p = ports();
    await loadRepository(store, p);
    expect(store.getState().repoHash).toBe("first");
    store.getState().metadata({ name: "Edited" });
    await saveRepository(store, p);
    expect(p.write).toHaveBeenCalledWith(
      "first",
      expect.objectContaining({
        "10": expect.objectContaining({
          levels: [expect.objectContaining({ name: "Edited" })],
        }),
      }),
    );
    expect(store.getState()).toMatchObject({
      repoHash: "next",
      saving: false,
      notice: "Saved.",
    });
  });
  it("falls back to standalone bundled JSON and reports missing library", async () => {
    const { store } = editor(),
      p = ports();
    p.read = vi.fn(async () => {
      throw new Error("offline");
    });
    await loadRepository(store, p);
    expect(p.bundled).toHaveBeenCalled();
    expect(store.getState().libraryReady).toBe(true);
    p.bundled = vi.fn(async () => {
      throw new Error("missing");
    });
    await loadRepository(store, p);
    expect(store.getState().libraryError).toContain("missing");
  });
  it("handles write errors, arbitrary thrown values, unavailable API and concurrent saves", async () => {
    const { store } = editor(),
      p = ports();
    await saveRepository(store, p);
    expect(p.write).not.toHaveBeenCalled();
    store.getState().set({ repoHash: "one", saving: true });
    await saveRepository(store, p);
    expect(p.write).not.toHaveBeenCalled();
    store.getState().set({ saving: false });
    p.write = async () => {
      throw new Error("changed");
    };
    await saveRepository(store, p);
    expect(store.getState().notice).toContain("changed");
    p.write = async () => {
      throw "bad";
    };
    await saveRepository(store, p);
    expect(store.getState().notice).toContain("bad");
    expect(store.getState().saving).toBe(false);
  });
  it("downloads actual JSON bytes and revokes the URL after the click", async () => {
    let blob: Blob | null = null,
      cleanup: (() => void) | null = null;
    const p: DownloadPorts = {
      create: vi.fn((b) => {
        blob = b;
        return "blob:level";
      }),
      revoke: vi.fn(),
      click: vi.fn(),
      schedule: vi.fn((fn) => {
        cleanup = fn;
      }),
    };
    downloadJSON(level(), "level.json", p);
    expect(p.click).toHaveBeenCalledWith("blob:level", "level.json");
    expect(blob).toBeInstanceOf(Blob);
    expect(p.schedule).toHaveBeenCalledWith(expect.any(Function), 1000);
    if (cleanup) (cleanup as () => void)();
    expect(p.revoke).toHaveBeenCalledWith("blob:level");
  });
  it("browser fetch adapters distinguish JSON API, HTML fallback, and HTTP errors", async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ packs: packs(), hash: "h" }), {
        headers: { "content-type": "application/json" },
      }),
    );
    expect((await browserRepository.read()).hash).toBe("h");
    fetcher.mockResolvedValue(
      new Response("html", { headers: { "content-type": "text/html" } }),
    );
    await expect(browserRepository.read()).rejects.toThrow("Standalone");
    fetcher.mockResolvedValue(new Response("", { status: 404 }));
    await expect(browserRepository.read()).rejects.toThrow("Standalone");
    await expect(browserRepository.bundled()).rejects.toThrow("unavailable");
    fetcher.mockResolvedValue(new Response(JSON.stringify(packs())));
    expect(await browserRepository.bundled()).toContain("Test pack");
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ hash: "h2", message: "done" })),
    );
    expect(await browserRepository.write("h", packs())).toEqual({
      hash: "h2",
      message: "done",
    });
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ error: "conflict" }), { status: 409 }),
    );
    await expect(browserRepository.write("h", packs())).rejects.toThrow(
      "conflict",
    );
  });
  it("browser download adapters create, click, revoke and schedule without filesystem writes", () => {
    vi.useFakeTimers();
    const create = vi.fn(() => "blob:real"),
      revoke = vi.fn(),
      click = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = create;
        static revokeObjectURL = revoke;
      },
    );
    const b = new Blob(["{}"]);
    expect(browserDownload.create(b)).toBe("blob:real");
    browserDownload.click("blob:real", "x.json");
    browserDownload.revoke("blob:real");
    const fn = vi.fn();
    browserDownload.schedule(fn, 10);
    vi.runAllTimers();
    expect(fn).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:real");
    vi.useRealTimers();
  });
  it("preserves an unsaved edit when retrying library loading", async () => {
    const { store } = editor();
    const p = ports();
    await loadRepository(store, p);
    store.getState().metadata({ name: "Keep this" });
    await loadRepository(store, p);
    expect(store.getState().name).toBe("Keep this");
  });
});
