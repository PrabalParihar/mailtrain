import sharp from "sharp";
import { readFile, writeFile, lstat, readdir } from "node:fs/promises";
import {
  MEDIA_PROFILE,
  LIMITS,
  bytesDigest,
  validateMediaInput,
  validateMediaReceipt,
  fail,
  signatureMime,
} from "./protocol.mjs";
import {
  inspectStructure,
  checkNativeMetadata,
  checkPngDecompression,
} from "./bounds.mjs";
sharp.concurrency(1);
sharp.cache(false);
async function stdin() {
  const a = [];
  let n = 0;
  for await (const b of process.stdin) {
    n += b.length;
    if (n > 4096) fail("MEDIA_INPUT_INVALID");
    a.push(b);
  }
  return JSON.parse(Buffer.concat(a).toString());
}
async function main() {
  const input = validateMediaInput(await stdin());
  const stat = await lstat(input.source_path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMITS.input)
    fail("MEDIA_INPUT_LIMIT");
  if ((await readdir(input.output_directory)).length)
    fail("MEDIA_OUTPUT_NOT_EMPTY");
  const source = await readFile(input.source_path);
  if (bytesDigest(source) !== input.source_sha256)
    fail("MEDIA_SOURCE_MISMATCH");
  const structure = inspectStructure(source);
  await checkPngDecompression(structure);
  if (input.selected_frame >= structure.frames) fail("MEDIA_FRAME_INVALID");
  if (
    process.versions.node !== "24.12.0" ||
    sharp.versions.sharp !== "0.35.5" ||
    sharp.versions.vips !== "8.18.7"
  )
    fail("MEDIA_RUNTIME_MISMATCH");
  const image = process.env.MEDIA_IMAGE_DIGEST;
  if (!/^sha256:[a-f0-9]{64}$/.test(image ?? ""))
    fail("MEDIA_RUNTIME_UNPINNED");
  const options = {
    failOn: "warning",
    limitInputPixels: LIMITS.pixels,
    unlimited: false,
    sequentialRead: true,
    animated: structure.mime === "image/gif",
  };
  const metadata = await sharp(source, options).metadata();
  checkNativeMetadata(metadata, structure);
  const decoded = await sharp(source, options)
    .rotate()
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = decoded;
  const frames = structure.frames;
  const height = info.height / frames,
    width = info.width;
  if (
    !Number.isSafeInteger(height) ||
    info.channels !== 4 ||
    data.length !== width * height * frames * 4 ||
    data.length > LIMITS.expanded ||
    width > LIMITS.axis ||
    height > LIMITS.axis
  )
    fail("MEDIA_DECODE_LIMIT");
  const output = [];
  let total = 0;
  async function save(filename, role, mime, bytes, selected_frame) {
    if (
      bytes.length > LIMITS.derivative ||
      (total += bytes.length) > LIMITS.derivatives
    )
      fail("MEDIA_OUTPUT_LIMIT");
    if (signatureMime(bytes) !== mime) fail("MEDIA_OUTPUT_SIGNATURE");
    inspectStructure(bytes);
    await writeFile(`/output/${filename}`, bytes, { flag: "wx", mode: 0o600 });
    output.push({
      role,
      filename,
      mime,
      bytes: bytes.length,
      sha256: bytesDigest(bytes),
      width,
      height,
      ...(selected_frame === undefined ? {} : { selected_frame }),
    });
  }
  const frameBytes = width * height * 4;
  if (structure.mime === "image/gif") {
    const animation = await sharp(data, {
      raw: { width, height: height * frames, channels: 4, pageHeight: height },
      limitInputPixels: LIMITS.pixels,
    })
      .gif({
        reuse: false,
        effort: 7,
        colours: 256,
        dither: 0,
        loop: structure.loop ?? 1,
        delay: structure.delays,
        interFrameMaxError: 0,
        interPaletteMaxError: 0,
      })
      .toBuffer();
    await save("animation.gif", "animation", "image/gif", animation);
    const fallback = await sharp(
      data.subarray(
        input.selected_frame * frameBytes,
        (input.selected_frame + 1) * frameBytes,
      ),
      { raw: { width, height, channels: 4 } },
    )
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toBuffer();
    await save(
      "fallback.png",
      "fallback",
      "image/png",
      fallback,
      input.selected_frame,
    );
  } else if (structure.mime === "image/jpeg") {
    const jpeg = await sharp(data, { raw: { width, height, channels: 4 } })
      .removeAlpha()
      .jpeg({
        quality: 90,
        progressive: false,
        chromaSubsampling: "4:4:4",
        mozjpeg: false,
      })
      .toBuffer();
    await save("static.jpg", "static", "image/jpeg", jpeg);
  } else {
    const png = await sharp(data, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toBuffer();
    await save("static.png", "static", "image/png", png);
  }
  const receipt = {
    version: 1,
    source_sha256: input.source_sha256,
    profile: MEDIA_PROFILE,
    runtime: {
      node: process.versions.node,
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
      image_digest: image,
      architecture: process.arch,
    },
    source_metadata: {
      mime: structure.mime,
      bytes: source.length,
      width,
      height,
      frames,
      delays_ms: structure.delays,
      loop: structure.loop,
      has_alpha: metadata.hasAlpha === true,
    },
    outputs: output,
  };
  validateMediaReceipt(receipt, input);
  const bytes = Buffer.from(JSON.stringify(receipt) + "\n");
  if (total + bytes.length > LIMITS.jobOutput || bytes.length > LIMITS.receipt)
    fail("MEDIA_OUTPUT_LIMIT");
  await writeFile("/output/receipt.json", bytes, { flag: "wx", mode: 0o600 });
  process.stdout.write(bytes);
}
async function resources() {
  const result = {};
  for (const file of [
    "cpu.stat",
    "memory.peak",
    "memory.max",
    "pids.peak",
    "pids.max",
  ])
    result[file] = await readFile(`/sys/fs/cgroup/${file}`, "utf8").catch(
      () => "unavailable",
    );
  process.stderr.write(
    JSON.stringify({
      resources: result,
      node_resource_usage: process.resourceUsage(),
    }) + "\n",
  );
}
main()
  .catch((e) => {
    process.stderr.write(
      JSON.stringify({
        error: e.code ?? "MEDIA_DECODE_FAILED",
        message: String(e.message).slice(0, 1024),
      }) + "\n",
    );
    process.exitCode = 1;
  })
  .finally(resources);
