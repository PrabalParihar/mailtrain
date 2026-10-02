import test from "node:test";
import assert from "node:assert/strict";
import {
  MEDIA_PROFILE,
  SCAN_PROFILE,
  validateMediaInput,
  validateMediaReceipt,
  validateScanInput,
  validateScanReceipt,
  bytesDigest,
  verifyOutputBytes,
} from "../media/protocol.mjs";
const h = "a".repeat(64),
  input = {
    version: 1 as const,
    source_sha256: h,
    source_path: "/input/source" as const,
    output_directory: "/output" as const,
    selected_frame: 0,
    processing_profile: MEDIA_PROFILE,
  };
test("decoder rejects unknown fields, user paths, profile drift and noninteger selection", () => {
  assert.deepEqual(validateMediaInput(input), input);
  for (const patch of [
    { source_path: "/etc/passwd" },
    { source_path: "https://example.com/a.png" },
    { output_directory: "/tmp" },
    { selected_frame: -1 },
    { selected_frame: 1.2 },
    { processing_profile: "unknown" },
    { scan_clean: true },
  ])
    assert.throws(() => validateMediaInput({ ...input, ...patch }));
});
test("native receipt requires exact version, bound hash and generated complete outputs; clean shortcut forbidden", () => {
  const receipt = {
    version: 1,
    source_sha256: h,
    profile: MEDIA_PROFILE,
    runtime: {
      node: "24.12.0",
      sharp: "0.35.5",
      vips: "8.18.7",
      image_digest: `sha256:${h}`,
      architecture: "arm64",
    },
    source_metadata: {
      mime: "image/png",
      bytes: 100,
      width: 1,
      height: 1,
      frames: 1,
      delays_ms: [],
      loop: null,
      has_alpha: true,
    },
    outputs: [
      {
        role: "static",
        filename: "static.png",
        mime: "image/png",
        bytes: 100,
        sha256: h,
        width: 1,
        height: 1,
      },
    ],
  };
  assert.equal(validateMediaReceipt(receipt, input), receipt);
  for (const patch of [
    { scan_clean: true },
    { source_sha256: "b".repeat(64) },
    { outputs: [] },
    { outputs: [{ ...receipt.outputs[0], filename: "../static.png" }] },
    { runtime: { ...receipt.runtime, vips: "8.18.6" } },
  ])
    assert.throws(() => validateMediaReceipt({ ...receipt, ...patch }, input));
});
test("scans bind exact files, fresh signed snapshot identity, engine and actual count", () => {
  const now = Date.now(),
    iso = (t: number) => new Date(t).toISOString(),
    scan = {
      version: 1 as const,
      profile: SCAN_PROFILE,
      files: [{ filename: "source" as const, sha256: h, bytes: 100 }],
      database_snapshot_sha256: h,
    };
  const receipt = {
    version: 1,
    profile: SCAN_PROFILE,
    status: "clean",
    runtime: {
      engine: "1.4.6",
      image_digest: `sha256:${h}`,
      architecture: "x64",
    },
    database: {
      snapshot_sha256: h,
      daily_built_at: iso(now - 1000),
      verified_at: iso(now - 500),
    },
    files: scan.files,
    scanned_files: 1,
    started_at: iso(now - 100),
    completed_at: iso(now),
  };
  assert.equal(validateScanInput(scan), scan);
  assert.equal(validateScanReceipt(receipt, scan, now), receipt);
  for (const patch of [
    { status: "infected" },
    { status: "error" },
    { scanned_files: 0 },
    { files: [{ ...scan.files[0], sha256: "b".repeat(64) }] },
    {
      database: {
        ...receipt.database,
        daily_built_at: iso(now - 49 * 3600 * 1000),
      },
    },
    { database: { ...receipt.database, snapshot_sha256: "b".repeat(64) } },
    { completed_at: iso(now + 5000) },
  ])
    assert.throws(() =>
      validateScanReceipt({ ...receipt, ...patch }, scan, now),
    );
  assert.throws(() => validateScanInput({ ...scan, files: [] }));
});
test("outer output verifier binds digest, byte count and signature independently", () => {
  const b = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    o = {
      role: "static" as const,
      filename: "static.png" as const,
      mime: "image/png" as const,
      width: 1,
      height: 1,
      bytes: b.length,
      sha256: bytesDigest(b),
    };
  assert.equal(verifyOutputBytes(b, o), true);
  assert.throws(() => verifyOutputBytes(Buffer.from("<script>"), o));
  assert.throws(() => verifyOutputBytes(b, { ...o, sha256: h }));
});
test("receipt enforces aggregate expansion, output byte ceilings and static frame semantics", () => {
  const receipt = {
    version: 1,
    source_sha256: h,
    profile: MEDIA_PROFILE,
    runtime: {
      node: "24.12.0",
      sharp: "0.35.5",
      vips: "8.18.7",
      image_digest: `sha256:${h}`,
      architecture: "arm64",
    },
    source_metadata: {
      mime: "image/png",
      bytes: 100,
      width: 1,
      height: 1,
      frames: 1,
      delays_ms: [],
      loop: null,
      has_alpha: true,
    },
    outputs: [
      {
        role: "static",
        filename: "static.png",
        mime: "image/png",
        bytes: 100,
        sha256: h,
        width: 1,
        height: 1,
      },
    ],
  };
  for (const patch of [
    { source_metadata: { ...receipt.source_metadata, frames: 2 } },
    { source_metadata: { ...receipt.source_metadata, width: 8193 } },
    { outputs: [{ ...receipt.outputs[0], bytes: 20 * 1024 * 1024 + 1 }] },
    { outputs: [{ ...receipt.outputs[0], selected_frame: 0 }] },
  ])
    assert.throws(() => validateMediaReceipt({ ...receipt, ...patch }, input));
});
test("strict receipts reject array-coerced runtime digests and dates", () => {
  const now = Date.now(),
    iso = new Date(now).toISOString();
  const scan = {
    version: 1 as const,
    profile: SCAN_PROFILE,
    files: [{ filename: "source" as const, sha256: h, bytes: 100 }],
    database_snapshot_sha256: h,
  };
  const receipt = {
    version: 1,
    profile: SCAN_PROFILE,
    status: "clean",
    runtime: {
      engine: "1.4.6",
      image_digest: `sha256:${h}`,
      architecture: "x64",
    },
    database: { snapshot_sha256: h, daily_built_at: iso, verified_at: iso },
    files: scan.files,
    scanned_files: 1,
    started_at: iso,
    completed_at: iso,
  };
  assert.throws(() =>
    validateScanReceipt(
      {
        ...receipt,
        runtime: {
          ...receipt.runtime,
          image_digest: [receipt.runtime.image_digest],
        },
      },
      scan,
      now,
    ),
  );
  assert.throws(() =>
    validateScanReceipt(
      { ...receipt, database: { ...receipt.database, daily_built_at: [iso] } },
      scan,
      now,
    ),
  );
});
