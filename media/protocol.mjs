import { createHash } from "node:crypto";
export const MEDIA_PROFILE = "lettercape-sharp0355-vips8187-raster-1";
export const SCAN_PROFILE = "lettercape-clamav146-official-48h-1";
export const LIMITS = Object.freeze({
  input: 20 * 1024 * 1024,
  axis: 8192,
  pixels: 16777216,
  gifAxis: 4096,
  gifPixels: 4194304,
  frames: 200,
  expanded: 64 * 1024 * 1024,
  metadata: 256 * 1024,
  derivative: 20 * 1024 * 1024,
  derivatives: 40 * 1024 * 1024,
  jobOutput: 48 * 1024 * 1024,
  receipt: 64 * 1024,
  freshnessMs: 48 * 3600 * 1000,
});
export class MediaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
export const fail = (code) => {
  throw new MediaError(code);
};
export const bytesDigest = (b) => createHash("sha256").update(b).digest("hex");
const hash = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const isoTimestamp = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const integer = (v, min, max) =>
  Number.isSafeInteger(v) && v >= min && v <= max;
const exact = (v, keys, optional = []) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  keys.every((k) => Object.hasOwn(v, k)) &&
  Object.keys(v).every((k) => keys.includes(k) || optional.includes(k));
export function validateMediaInput(v) {
  if (
    !exact(v, [
      "version",
      "source_sha256",
      "source_path",
      "output_directory",
      "selected_frame",
      "processing_profile",
    ]) ||
    v.version !== 1 ||
    !hash(v.source_sha256) ||
    v.source_path !== "/input/source" ||
    v.output_directory !== "/output" ||
    !integer(v.selected_frame, 0, LIMITS.frames - 1) ||
    v.processing_profile !== MEDIA_PROFILE
  )
    fail("MEDIA_INPUT_INVALID");
  return v;
}
const outputNames = {
  "static.png": ["static", "image/png"],
  "static.jpg": ["static", "image/jpeg"],
  "animation.gif": ["animation", "image/gif"],
  "fallback.png": ["fallback", "image/png"],
};
export function validateMediaReceipt(v, input) {
  validateMediaInput(input);
  if (
    !exact(v, [
      "version",
      "source_sha256",
      "profile",
      "runtime",
      "source_metadata",
      "outputs",
    ]) ||
    v.version !== 1 ||
    v.source_sha256 !== input.source_sha256 ||
    v.profile !== MEDIA_PROFILE ||
    !exact(v.runtime, [
      "node",
      "sharp",
      "vips",
      "image_digest",
      "architecture",
    ]) ||
    v.runtime.node !== "24.12.0" ||
    v.runtime.sharp !== "0.35.5" ||
    v.runtime.vips !== "8.18.7" ||
    typeof v.runtime.image_digest !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(v.runtime.image_digest) ||
    !["arm64", "x64"].includes(v.runtime.architecture)
  )
    fail("MEDIA_RECEIPT_INVALID");
  const m = v.source_metadata;
  if (
    !exact(m, [
      "mime",
      "bytes",
      "width",
      "height",
      "frames",
      "delays_ms",
      "loop",
      "has_alpha",
    ]) ||
    !["image/png", "image/jpeg", "image/gif"].includes(m.mime) ||
    !integer(m.bytes, 1, LIMITS.input) ||
    !integer(
      m.width,
      1,
      m.mime === "image/gif" ? LIMITS.gifAxis : LIMITS.axis,
    ) ||
    !integer(
      m.height,
      1,
      m.mime === "image/gif" ? LIMITS.gifAxis : LIMITS.axis,
    ) ||
    !integer(m.frames, 1, LIMITS.frames) ||
    m.width * m.height * m.frames > LIMITS.pixels ||
    m.width * m.height >
      (m.mime === "image/gif" ? LIMITS.gifPixels : LIMITS.pixels) ||
    !Array.isArray(m.delays_ms) ||
    m.delays_ms.length !== (m.mime === "image/gif" ? m.frames : 0) ||
    !m.delays_ms.every((n) => integer(n, 0, 655350)) ||
    !(m.loop === null || integer(m.loop, 0, 65535)) ||
    typeof m.has_alpha !== "boolean" ||
    input.selected_frame >= m.frames ||
    (m.mime !== "image/gif" && (m.frames !== 1 || m.loop !== null))
  )
    fail("MEDIA_RECEIPT_INVALID");
  const expected =
    m.mime === "image/gif"
      ? ["animation.gif", "fallback.png"]
      : [m.mime === "image/jpeg" ? "static.jpg" : "static.png"];
  if (!Array.isArray(v.outputs) || v.outputs.length !== expected.length)
    fail("MEDIA_RECEIPT_INVALID");
  let total = 0;
  for (let i = 0; i < v.outputs.length; i++) {
    const o = v.outputs[i],
      name = expected[i];
    if (
      !exact(
        o,
        ["role", "filename", "mime", "bytes", "sha256", "width", "height"],
        ["selected_frame"],
      ) ||
      o.filename !== name ||
      o.role !== outputNames[name][0] ||
      o.mime !== outputNames[name][1] ||
      !integer(o.bytes, 1, LIMITS.derivative) ||
      !hash(o.sha256) ||
      o.width !== m.width ||
      o.height !== m.height ||
      (o.role === "fallback"
        ? o.selected_frame !== input.selected_frame
        : Object.hasOwn(o, "selected_frame"))
    )
      fail("MEDIA_RECEIPT_INVALID");
    total += o.bytes;
  }
  if (total > LIMITS.derivatives) fail("MEDIA_OUTPUT_LIMIT");
  return v;
}
export function validateScanInput(v) {
  if (
    !exact(v, ["version", "profile", "files", "database_snapshot_sha256"]) ||
    v.version !== 1 ||
    v.profile !== SCAN_PROFILE ||
    !hash(v.database_snapshot_sha256) ||
    !Array.isArray(v.files) ||
    v.files.length < 1 ||
    v.files.length > 3
  )
    fail("SCAN_INPUT_INVALID");
  const seen = new Set();
  for (const f of v.files) {
    if (
      !exact(f, ["filename", "sha256", "bytes"]) ||
      !["source", ...Object.keys(outputNames)].includes(f.filename) ||
      seen.has(f.filename) ||
      !hash(f.sha256) ||
      !integer(f.bytes, 1, LIMITS.derivative)
    )
      fail("SCAN_INPUT_INVALID");
    seen.add(f.filename);
  }
  return v;
}
export function validateScanReceipt(v, input, now = Date.now()) {
  validateScanInput(input);
  if (
    !exact(v, [
      "version",
      "profile",
      "status",
      "runtime",
      "database",
      "files",
      "scanned_files",
      "started_at",
      "completed_at",
    ]) ||
    v.version !== 1 ||
    v.profile !== SCAN_PROFILE ||
    v.status !== "clean" ||
    !exact(v.runtime, ["engine", "image_digest", "architecture"]) ||
    v.runtime.engine !== "1.4.6" ||
    typeof v.runtime.image_digest !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(v.runtime.image_digest) ||
    !["arm64", "x64"].includes(v.runtime.architecture) ||
    !exact(v.database, ["snapshot_sha256", "daily_built_at", "verified_at"]) ||
    v.database.snapshot_sha256 !== input.database_snapshot_sha256 ||
    !isoTimestamp(v.database.daily_built_at) ||
    !isoTimestamp(v.database.verified_at) ||
    Date.parse(v.database.daily_built_at) > now ||
    now - Date.parse(v.database.daily_built_at) > LIMITS.freshnessMs ||
    Date.parse(v.database.verified_at) > now ||
    !Array.isArray(v.files) ||
    JSON.stringify(v.files) !== JSON.stringify(input.files) ||
    v.scanned_files !== input.files.length ||
    !isoTimestamp(v.started_at) ||
    !isoTimestamp(v.completed_at) ||
    Date.parse(v.completed_at) < Date.parse(v.started_at) ||
    Date.parse(v.completed_at) > now + 1000 ||
    Date.parse(v.completed_at) - Date.parse(v.started_at) > 90000
  )
    fail("SCAN_RECEIPT_INVALID");
  return v;
}
export function signatureMime(b) {
  b = Buffer.from(b);
  if (
    b.length >= 8 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255)
    return "image/jpeg";
  if (
    b.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("ascii"))
  )
    return "image/gif";
  fail("MEDIA_SIGNATURE_INVALID");
}
export function verifyOutputBytes(bytes, output) {
  if (
    bytes.length !== output.bytes ||
    bytesDigest(bytes) !== output.sha256 ||
    signatureMime(bytes) !== output.mime
  )
    fail("MEDIA_OUTPUT_MISMATCH");
  return true;
}
