// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { createServer, request, IncomingHttpHeaders } from "node:http";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import {
  diskFiles,
  hashText,
  repositoryMiddleware,
  RepositoryFilePorts,
} from "../server/repositoryFiles";
import { packs } from "./fixtures";
function files() {
  const data = new Map<string, string | Uint8Array>([
    ["/story", JSON.stringify(packs())],
  ]);
  const ports: RepositoryFilePorts = {
    read: vi.fn(async (p) => {
      const v = data.get(p);
      if (v === undefined) throw new Error("missing");
      return typeof v === "string" ? v : Buffer.from(v).toString();
    }),
    write: vi.fn(async (p, d) => {
      data.set(p, d);
    }),
    mkdir: vi.fn(async () => {}),
    rename: vi.fn(async (a, b) => {
      const value = data.get(a);
      if (value === undefined) throw new Error("missing");
      data.set(b, value);
      data.delete(a);
    }),
    unlink: vi.fn(async (p) => {
      data.delete(p);
    }),
    now: () => 123,
  };
  return { ports, data };
}
interface Reply {
  status: number;
  body: { hash?: string; error?: string; message?: string; packs?: unknown };
}
async function service(
  ports: RepositoryFilePorts,
  run: (
    send: (
      method: string,
      data?: string,
      headers?: IncomingHttpHeaders,
    ) => Promise<Reply>,
  ) => Promise<void>,
) {
  const server = createServer(
    repositoryMiddleware("/story", "/backups", ports),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Expected TCP server");
  const send = (method: string, data = "", headers: IncomingHttpHeaders = {}) =>
    new Promise<Reply>((resolve, reject) => {
      const req = request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          method,
          path: "/",
          headers: { "content-type": "application/json", ...headers },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (b: Buffer) => chunks.push(b));
          res.on("end", () =>
            resolve({
              status: res.statusCode!,
              body: JSON.parse(
                Buffer.concat(chunks).toString(),
              ) as Reply["body"],
            }),
          );
        },
      );
      req.on("error", reject);
      req.end(data);
    });
  try {
    await run(send);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
}
describe("repository save endpoint with injected disk", () => {
  it("reads, backs up and atomically writes JSON and matching gzip", async () => {
    const { ports, data } = files(),
      current = String(data.get("/story"));
    await service(ports, async (send) => {
      const before = await send("GET");
      expect(before.status).toBe(200);
      expect(before.body.hash).toBe(hashText(current));
      const result = await send(
        "POST",
        JSON.stringify({ expectedHash: before.body.hash, packs: packs() }),
      );
      expect(result.status).toBe(200);
      expect(result.body.message).toMatch(/Saved/);
    });
    expect(data.get("/backups/storyData-123.txt")).toBe(current);
    expect(gunzipSync(data.get("/story.gz") as Uint8Array).toString()).toBe(
      data.get("/story"),
    );
    expect(ports.write).toHaveBeenCalledWith(
      "/backups/storyData-123.txt",
      current,
      true,
    );
  });
  it("rejects stale hashes, wrong origin/host, wrong method, wrong media type and invalid or oversized input", async () => {
    const { ports, data } = files();
    await service(ports, async (send) => {
      expect((await send("POST", "{}")).status).toBe(409);
      expect(
        (await send("GET", "", { origin: "https://evil.test" })).status,
      ).toBe(403);
      expect((await send("GET", "", { host: "evil.test" })).status).toBe(403);
      expect((await send("DELETE")).status).toBe(405);
      expect(
        (await send("POST", "{}", { "content-type": "text/plain" })).status,
      ).toBe(415);
      expect((await send("POST", "{")).status).toBe(400);
      expect((await send("POST", " ".repeat(8_000_001))).status).toBe(400);
      expect(
        (
          await send(
            "POST",
            JSON.stringify({
              expectedHash: hashText(String(data.get("/story"))),
              packs: { bad: {} },
            }),
          )
        ).status,
      ).toBe(400);
    });
    expect(data.size).toBe(1);
  });
  it("rolls both files back after rename failure and remains usable after failure", async () => {
    const { ports, data } = files(),
      original = data.get("/story");
    const rename = ports.rename;
    ports.rename = vi.fn(async (a, b) => {
      if (b === "/story") throw new Error("disk failure");
      await rename(a, b);
    });
    await service(ports, async (send) => {
      const result = await send(
        "POST",
        JSON.stringify({
          expectedHash: hashText(String(original)),
          packs: packs(),
        }),
      );
      expect(result.status).toBe(400);
      expect(result.body.error).toBe("disk failure");
      expect((await send("GET")).status).toBe(200);
    });
    expect(data.get("/story")).toBe(original);
    expect(gunzipSync(data.get("/story.gz") as Uint8Array).toString()).toBe(
      original,
    );
    expect(ports.unlink).toHaveBeenCalledTimes(2);
  });
  it("reports read and non-Error failures and rejects concurrent writers", async () => {
    const { ports, data } = files();
    let unblock: ((text: string) => void) | null = null;
    ports.read = vi.fn(
      () =>
        new Promise<string>((r) => {
          unblock = r;
        }),
    );
    await service(ports, async (send) => {
      const first = send(
        "POST",
        JSON.stringify({
          expectedHash: hashText(String(data.get("/story"))),
          packs: packs(),
        }),
      );
      await vi.waitFor(() => expect(unblock).not.toBeNull());
      expect((await send("POST", "{}")).status).toBe(409);
      if (unblock)
        (unblock as (text: string) => void)(String(data.get("/story")));
      expect((await first).status).toBe(200);
    });
    ports.read = async () => {
      throw "unreadable";
    };
    await service(ports, async (send) => {
      expect((await send("GET")).body.error).toBe("unreadable");
    });
  });
  it("disk adapter works against a disposable directory", async () => {
    const dir = await mkdtemp(`${tmpdir()}/snabbit-files-`);
    try {
      await diskFiles.mkdir(`${dir}/sub`);
      await diskFiles.write(`${dir}/sub/a`, "hello", true);
      expect(await diskFiles.read(`${dir}/sub/a`)).toBe("hello");
      await diskFiles.write(`${dir}/sub/a`, new Uint8Array([97]));
      await diskFiles.rename(`${dir}/sub/a`, `${dir}/sub/b`);
      expect(await readFile(`${dir}/sub/b`, "utf8")).toBe("a");
      await diskFiles.unlink(`${dir}/sub/b`);
      expect(diskFiles.now()).toBeGreaterThan(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
