import { appURL } from "./paths";
import { useEditorStore, EditorStore } from "../store/editorStore";
import { parseStoryData } from "./serialization";
import { LevelPackData } from "../store/types";
export interface RepositoryPorts {
  read: () => Promise<{ packs: unknown; hash: string }>;
  bundled: () => Promise<string>;
  write: (
    expectedHash: string,
    packs: Record<string, LevelPackData>,
  ) => Promise<{ hash: string; message: string }>;
}
async function jsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}
export const browserRepository: RepositoryPorts = {
  read: async () => {
    if (import.meta.env.PROD) throw new Error("Standalone build");
    const res = await fetch(appURL("api/story"));
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/json")
    )
      throw new Error("Standalone build");
    return res.json();
  },
  bundled: async () => {
    const res = await fetch(appURL("assets/story.json"));
    if (!res.ok) throw new Error("Bundled level library unavailable.");
    return res.text();
  },
  write: async (expectedHash, packs) =>
    jsonResponse(
      await fetch(appURL("api/story"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedHash, packs }),
      }),
    ),
};
export async function loadRepository(
  store: EditorStore = useEditorStore,
  ports: RepositoryPorts = browserRepository,
) {
  const s = store.getState();
  if (s.revision !== s.savedRevision) s.saveDraft();
  s.set({ libraryError: "" });
  try {
    const data = await ports.read();
    s.initialize(parseStoryData(JSON.stringify(data.packs)));
    s.set({ repoHash: data.hash });
  } catch {
    try {
      s.initialize(parseStoryData(await ports.bundled()));
    } catch (error) {
      s.set({ libraryReady: true, libraryError: String(error) });
    }
  }
}
export async function saveRepository(
  store: EditorStore = useEditorStore,
  ports: RepositoryPorts = browserRepository,
) {
  const s = store.getState();
  if (!s.repoHash || s.saving) return;
  s.saveDraft();
  s.set({ saving: true, notice: "" });
  try {
    const packs = s.exportCollection(),
      data = await ports.write(s.repoHash, packs);
    s.set({ repoHash: data.hash, library: packs, notice: data.message });
  } catch (error) {
    s.set({
      notice: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    s.set({ saving: false });
  }
}
export interface DownloadPorts {
  create: (blob: Blob) => string;
  revoke: (url: string) => void;
  click: (url: string, name: string) => void;
  schedule: (fn: () => void, ms: number) => unknown;
}
export const browserDownload: DownloadPorts = {
  create: (b) => URL.createObjectURL(b),
  revoke: (u) => URL.revokeObjectURL(u),
  click: (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  },
  schedule: (fn, ms) => setTimeout(fn, ms),
};
export function downloadJSON(
  data: unknown,
  filename: string,
  ports: DownloadPorts = browserDownload,
) {
  const url = ports.create(
    new Blob([JSON.stringify(data, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  ports.click(url, filename);
  ports.schedule(() => ports.revoke(url), 1000);
}
