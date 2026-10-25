import { IncomingMessage, ServerResponse } from "node:http";
import { readFile, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { parseStoryData } from "../src/core/serialization";
export interface RepositoryFilePorts {
  read: (path: string) => Promise<string>;
  write: (
    path: string,
    data: string | Uint8Array,
    exclusive?: boolean,
  ) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  now: () => number;
}
export const diskFiles: RepositoryFilePorts = {
  read: (p) => readFile(p, "utf8"),
  write: async (p, data, exclusive) => {
    await writeFile(p, data, exclusive ? { flag: "wx" } : undefined);
  },
  mkdir: async (p) => {
    await mkdir(p, { recursive: true });
  },
  rename,
  unlink,
  now: () => Date.now(),
};
export const hashText = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export function repositoryMiddleware(
  source: string,
  backupDir: string,
  ports: RepositoryFilePorts = diskFiles,
) {
  let writing = false;
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };
    const origin = req.headers.origin,
      host = req.headers.host ?? "";
    if (
      !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host) ||
      (origin && origin !== `http://${host}`)
    ) {
      send(403, {
        error: "Repository saves must come from this local editor.",
      });
      return;
    }
    try {
      if (req.method === "GET") {
        const text = await ports.read(source);
        send(200, { packs: JSON.parse(text), hash: hashText(text) });
        return;
      }
      if (req.method !== "POST") {
        send(405, { error: "Use GET or POST." });
        return;
      }
      if (req.headers["content-type"] !== "application/json") {
        send(415, { error: "Use JSON." });
        return;
      }
      if (writing) {
        send(409, { error: "Another save is in progress. Try again." });
        return;
      }
      writing = true;
      try {
        const chunks: Buffer[] = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 8_000_000) throw new Error("File exceeds 8 MB.");
          chunks.push(Buffer.from(chunk));
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        const current = await ports.read(source);
        if (body.expectedHash !== hashText(current)) {
          send(409, {
            error:
              "The repository JSON changed since it was loaded. Download your edits, then reload the editor before saving.",
          });
          return;
        }
        const packs = parseStoryData(JSON.stringify(body.packs)),
          text = JSON.stringify(packs, null, 2) + "\n";
        await ports.mkdir(backupDir);
        await ports.write(
          `${backupDir}/storyData-${ports.now()}.txt`,
          current,
          true,
        );
        const tmp = `${source}.editor-tmp`,
          gzipTmp = `${source}.gz.editor-tmp`;
        try {
          await ports.write(tmp, text);
          await ports.write(gzipTmp, gzipSync(text));
          await ports.rename(gzipTmp, source + ".gz");
          await ports.rename(tmp, source);
        } catch (error) {
          await ports.write(source, current);
          await ports.write(source + ".gz", gzipSync(current));
          await Promise.allSettled([ports.unlink(tmp), ports.unlink(gzipTmp)]);
          throw error;
        }
        send(200, {
          hash: hashText(text),
          message:
            "Saved storyData.txt and storyData.txt.gz. Previous JSON backed up in .editor-backups/.",
        });
      } finally {
        writing = false;
      }
    } catch (error) {
      send(400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
