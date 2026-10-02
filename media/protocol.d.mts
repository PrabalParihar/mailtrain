export const MEDIA_PROFILE: string;
export const SCAN_PROFILE: string;
export const LIMITS: Readonly<{
  input: number;
  axis: number;
  pixels: number;
  gifAxis: number;
  gifPixels: number;
  frames: number;
  expanded: number;
  metadata: number;
  derivative: number;
  derivatives: number;
  jobOutput: number;
  receipt: number;
  freshnessMs: number;
}>;
export class MediaError extends Error {
  code: string;
  constructor(code: string);
}
export function fail(code: string): never;
export function bytesDigest(bytes: Uint8Array): string;
export type MediaProcessInput = {
  version: 1;
  source_sha256: string;
  source_path: "/input/source";
  output_directory: "/output";
  selected_frame: number;
  processing_profile: string;
};
export type MediaOutput = {
  role: "static" | "animation" | "fallback";
  filename: "static.png" | "static.jpg" | "animation.gif" | "fallback.png";
  mime: "image/png" | "image/jpeg" | "image/gif";
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  selected_frame?: number;
};
export type MediaProcessReceipt = {
  version: 1;
  source_sha256: string;
  profile: string;
  runtime: {
    node: string;
    sharp: string;
    vips: string;
    image_digest: string;
    architecture: string;
  };
  source_metadata: {
    mime: "image/png" | "image/jpeg" | "image/gif";
    bytes: number;
    width: number;
    height: number;
    frames: number;
    delays_ms: number[];
    loop: number | null;
    has_alpha: boolean;
  };
  outputs: MediaOutput[];
};
export type MediaScanInput = {
  version: 1;
  profile: string;
  files: Array<{
    filename: "source" | MediaOutput["filename"];
    sha256: string;
    bytes: number;
  }>;
  database_snapshot_sha256: string;
};
export type MediaScanReceipt = {
  version: 1;
  profile: string;
  status: "clean";
  runtime: { engine: string; image_digest: string; architecture: string };
  database: {
    snapshot_sha256: string;
    daily_built_at: string;
    verified_at: string;
  };
  files: MediaScanInput["files"];
  scanned_files: number;
  started_at: string;
  completed_at: string;
};
export function validateMediaInput(value: unknown): MediaProcessInput;
export function validateMediaReceipt(
  value: unknown,
  input: MediaProcessInput,
): MediaProcessReceipt;
export function validateScanInput(value: unknown): MediaScanInput;
export function validateScanReceipt(
  value: unknown,
  input: MediaScanInput,
  now?: number,
): MediaScanReceipt;
export function signatureMime(
  bytes: Uint8Array,
): "image/png" | "image/jpeg" | "image/gif";
export function verifyOutputBytes(bytes: Uint8Array, output: MediaOutput): true;
