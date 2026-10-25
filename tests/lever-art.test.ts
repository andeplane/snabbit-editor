import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { storyFile } from "./gameResources";
it("ships two distinct high-resolution transparent lever frames at equal dimensions", () => {
  const root = resolve(dirname(storyFile()), "../..");
  const frames = ["switch-off.png", "switch-on.png"].map((name) =>
    readFileSync(resolve(root, "World/Switches", name)),
  );
  for (const frame of frames) {
    expect(frame.subarray(1, 4).toString()).toBe("PNG");
    expect(frame.readUInt32BE(16)).toBeGreaterThanOrEqual(1024);
    expect(frame.readUInt32BE(16)).toBe(frame.readUInt32BE(20));
    expect(frame[25]).toBe(6);
  }
  expect(frames[0].readUInt32BE(16)).toBe(frames[1].readUInt32BE(16));
  expect(createHash("sha256").update(frames[0]).digest("hex")).not.toBe(
    createHash("sha256").update(frames[1]).digest("hex"),
  );
});
