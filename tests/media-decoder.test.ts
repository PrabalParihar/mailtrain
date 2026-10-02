import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectStructure } from "../media/bounds.mjs";
import { spawnSync } from "node:child_process";
test("hostile signatures, GIF bounds/truncation/trailing bytes fail before native decode", () => {
  for (const b of [
    Buffer.from("<svg/>"),
    Buffer.from("<script/>"),
    Buffer.from("GIF89a"),
    Buffer.from("PK\x03\x04"),
  ])
    assert.throws(() => inspectStructure(b));
  const huge = Buffer.alloc(14);
  huge.write("GIF89a");
  huge.writeUInt16LE(65535, 6);
  huge.writeUInt16LE(65535, 8);
  assert.throws(() => inspectStructure(huge), /MEDIA_PIXEL_LIMIT/);
});
test("PNG compressed metadata must fail explicitly rather than expand unknown compressed payload", async () => {
  const fixture = await readFile(
    new URL("./fixtures/media/compressed-metadata.png", import.meta.url),
  );
  assert.throws(
    () => inspectStructure(fixture),
    /PNG_COMPRESSED_METADATA_UNSUPPORTED/,
  );
});
test(
  "native isolated decoder qualification runs all frames and denial corpus",
  { skip: process.env.MEDIA_RUNTIME_TEST !== "1" },
  () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/smoke-media.mjs", "--decoder-only"],
      { encoding: "utf8", timeout: 180000, maxBuffer: 1024 * 1024 },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
  },
);
test("GIF blocks reject excessive extension bytes, unsupported extensions and out-of-canvas rectangles", async () => {
  const valid = await readFile(
    new URL("./fixtures/media/disposal-1.gif", import.meta.url),
  );
  const paletteEnd = 13 + 3 * (1 << ((valid[10] & 7) + 1));
  const data = Buffer.alloc(255, 65),
    blocks = Array.from({ length: 1029 }, () =>
      Buffer.concat([Buffer.from([255]), data]),
    );
  const comment = Buffer.concat([
    Buffer.from([33, 254]),
    ...blocks,
    Buffer.from([0]),
  ]);
  assert.throws(
    () =>
      inspectStructure(
        Buffer.concat([
          valid.subarray(0, paletteEnd),
          comment,
          valid.subarray(paletteEnd),
        ]),
      ),
    /MEDIA_METADATA_LIMIT/,
  );
  const extension = Buffer.from([33, 1, 0]);
  assert.throws(
    () =>
      inspectStructure(
        Buffer.concat([
          valid.subarray(0, paletteEnd),
          extension,
          valid.subarray(paletteEnd),
        ]),
      ),
    /GIF_EXTENSION_UNSUPPORTED/,
  );
  const rect = Buffer.from(valid);
  rect.writeUInt16LE(65535, paletteEnd + 8 + 1);
  assert.throws(() => inspectStructure(rect), /GIF_RECT_INVALID/);
});
