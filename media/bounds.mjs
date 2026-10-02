import { createInflate } from "node:zlib";
import { LIMITS, fail, signatureMime } from "./protocol.mjs";
const geometry = (w, h, gif = false, frames = 1) => {
  if (
    !Number.isSafeInteger(w) ||
    !Number.isSafeInteger(h) ||
    w < 1 ||
    h < 1 ||
    w > (gif ? LIMITS.gifAxis : LIMITS.axis) ||
    h > (gif ? LIMITS.gifAxis : LIMITS.axis) ||
    w * h > (gif ? LIMITS.gifPixels : LIMITS.pixels) ||
    frames > LIMITS.frames ||
    w * h * frames > LIMITS.pixels ||
    w * h * frames * 4 > LIMITS.expanded
  )
    fail("MEDIA_PIXEL_LIMIT");
};
export function inspectStructure(b) {
  if (b.length < 1 || b.length > LIMITS.input) fail("MEDIA_INPUT_LIMIT");
  const mime = signatureMime(b);
  let metadata = 0;
  if (mime === "image/gif") {
    if (b.length < 14) fail("GIF_TRUNCATED");
    const width = b.readUInt16LE(6),
      height = b.readUInt16LE(8);
    geometry(width, height, true);
    let p = 13,
      frames = 0,
      delays = [],
      disposals = [],
      loop = null,
      pendingDelay = 0,
      pendingDisposal = 0;
    const globalSize = b[10] & 128 ? 3 * (1 << ((b[10] & 7) + 1)) : 0;
    p += globalSize;
    if (p > b.length) fail("GIF_TRUNCATED");
    function blocks(countMetadata = false) {
      let chunks = [];
      while (true) {
        if (p >= b.length) fail("GIF_TRUNCATED");
        const n = b[p++];
        if (!n) break;
        if (p + n > b.length) fail("GIF_TRUNCATED");
        if (countMetadata) {
          metadata += n;
          if (metadata > LIMITS.metadata) fail("MEDIA_METADATA_LIMIT");
          chunks.push(b.subarray(p, p + n));
        }
        p += n;
      }
      return chunks;
    }
    while (p < b.length) {
      const tag = b[p++];
      if (tag === 59) {
        if (p !== b.length || frames === 0) fail("GIF_TRAILING_OR_EMPTY");
        geometry(width, height, true, frames);
        return {
          mime,
          width,
          height,
          frames,
          delays,
          disposals,
          loop,
          metadata,
        };
      }
      if (tag === 33) {
        if (p >= b.length) fail("GIF_TRUNCATED");
        const kind = b[p++];
        if (kind === 249) {
          if (p + 6 > b.length || b[p++] !== 4) fail("GIF_GCE_INVALID");
          const flags = b[p++];
          pendingDisposal = (flags >> 2) & 7;
          if (flags & 0xe0 || pendingDisposal > 3)
            fail("GIF_DISPOSAL_UNSUPPORTED");
          pendingDelay = b.readUInt16LE(p) * 10;
          p += 2;
          p++;
          if (b[p++] !== 0) fail("GIF_GCE_INVALID");
          metadata += 4;
        } else if (kind === 255) {
          if (p >= b.length) fail("GIF_TRUNCATED");
          const n = b[p++];
          if (n !== 11 || p + n > b.length) fail("GIF_APPLICATION_INVALID");
          const app = b.subarray(p, p + n).toString("ascii");
          p += n;
          metadata += n;
          const chunks = blocks(true);
          if (app === "NETSCAPE2.0" || app === "ANIMEXTS1.0") {
            if (
              chunks.length !== 1 ||
              chunks[0].length !== 3 ||
              chunks[0][0] !== 1
            )
              fail("GIF_LOOP_INVALID");
            loop = chunks[0].readUInt16LE(1);
          } else fail("GIF_APPLICATION_UNSUPPORTED");
        } else if (kind === 254) blocks(true);
        else fail("GIF_EXTENSION_UNSUPPORTED");
        if (metadata > LIMITS.metadata) fail("MEDIA_METADATA_LIMIT");
        continue;
      }
      if (tag !== 44 || p + 9 > b.length) fail("GIF_IMAGE_INVALID");
      const x = b.readUInt16LE(p),
        y = b.readUInt16LE(p + 2),
        w = b.readUInt16LE(p + 4),
        h = b.readUInt16LE(p + 6),
        flags = b[p + 8];
      p += 9;
      if (!w || !h || x + w > width || y + h > height || flags & 0x18)
        fail("GIF_RECT_INVALID");
      if (!(flags & 128) && !globalSize) fail("GIF_PALETTE_MISSING");
      if (flags & 128) p += 3 * (1 << ((flags & 7) + 1));
      if (p >= b.length) fail("GIF_TRUNCATED");
      const code = b[p++];
      if (code < 2 || code > 8) fail("GIF_LZW_INVALID");
      blocks();
      frames++;
      if (frames > LIMITS.frames) fail("MEDIA_FRAME_LIMIT");
      geometry(width, height, true, frames);
      delays.push(pendingDelay);
      disposals.push(pendingDisposal);
      pendingDelay = 0;
      pendingDisposal = 0;
    }
    fail("GIF_TRUNCATED");
  }
  if (mime === "image/png") {
    let p = 8,
      width = 0,
      height = 0,
      seenData = false,
      endedData = false,
      bitDepth,
      colorType,
      interlace;
    const idat = [];
    const allowedCritical = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);
    while (p < b.length) {
      if (p + 12 > b.length) fail("PNG_TRUNCATED");
      const n = b.readUInt32BE(p),
        tag = b.subarray(p + 4, p + 8).toString("ascii");
      if (n > b.length - p - 12 || !/^[A-Za-z]{4}$/.test(tag))
        fail("PNG_CHUNK_INVALID");
      const data = b.subarray(p + 8, p + 8 + n);
      if (crc32(b.subarray(p + 4, p + 8 + n)) !== b.readUInt32BE(p + 8 + n))
        fail("PNG_CRC_INVALID");
      if (p === 8 && tag !== "IHDR") fail("PNG_IHDR_INVALID");
      if (tag === "IHDR") {
        if (p !== 8 || n !== 13) fail("PNG_IHDR_INVALID");
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        geometry(width, height);
        bitDepth = data[8];
        colorType = data[9];
        interlace = data[12];
        const depths = {
          0: [1, 2, 4, 8, 16],
          2: [8, 16],
          3: [1, 2, 4, 8],
          4: [8, 16],
          6: [8, 16],
        };
        if (
          !depths[colorType]?.includes(bitDepth) ||
          data[10] !== 0 ||
          data[11] !== 0 ||
          interlace > 1
        )
          fail("PNG_IHDR_INVALID");
      } else if (["acTL", "fcTL", "fdAT"].includes(tag))
        fail("APNG_UNSUPPORTED");
      else if (["zTXt", "iCCP", "iTXt"].includes(tag))
        fail("PNG_COMPRESSED_METADATA_UNSUPPORTED");
      else if (tag === "IDAT") {
        if (endedData) fail("PNG_CHUNK_ORDER");
        seenData = true;
        idat.push(data);
      } else {
        if (seenData) endedData = true;
        if (tag === "IEND") {
          if (n !== 0 || !seenData || p + 12 !== b.length)
            fail("PNG_TRAILING_OR_EMPTY");
          return {
            mime,
            width,
            height,
            frames: 1,
            delays: [],
            loop: null,
            metadata,
            png: { bitDepth, colorType, interlace, idat },
          };
        }
        if (tag[0] === tag[0].toUpperCase() && !allowedCritical.has(tag))
          fail("PNG_CRITICAL_UNSUPPORTED");
        metadata += n;
        if (metadata > LIMITS.metadata) fail("MEDIA_METADATA_LIMIT");
      }
      p += n + 12;
    }
    fail("PNG_TRUNCATED");
  }
  // Parse JPEG markers including entropy byte stuffing; no bytes after EOI.
  let p = 2,
    width = 0,
    height = 0,
    sos = false;
  while (p < b.length) {
    if (b[p++] !== 255) fail("JPEG_MARKER_INVALID");
    while (b[p] === 255) p++;
    if (p >= b.length) fail("JPEG_TRUNCATED");
    const tag = b[p++];
    if (tag === 217) {
      if (p !== b.length || !sos || !width) fail("JPEG_TRAILING_OR_EMPTY");
      return {
        mime,
        width,
        height,
        frames: 1,
        delays: [],
        loop: null,
        metadata,
      };
    }
    if (tag === 216 || tag === 0 || tag === 1 || (tag >= 208 && tag <= 215))
      fail("JPEG_MARKER_INVALID");
    if (p + 2 > b.length) fail("JPEG_TRUNCATED");
    const n = b.readUInt16BE(p);
    if (n < 2 || p + n > b.length) fail("JPEG_TRUNCATED");
    if ([192, 193, 194].includes(tag)) {
      if (n < 8 || width) fail("JPEG_SOF_INVALID");
      height = b.readUInt16BE(p + 3);
      width = b.readUInt16BE(p + 5);
      geometry(width, height);
      if (![1, 3].includes(b[p + 7])) fail("JPEG_CHANNELS_UNSUPPORTED");
    } else if (tag >= 192 && tag <= 207 && ![196, 200, 204].includes(tag))
      fail("JPEG_ENCODING_UNSUPPORTED");
    if ((tag >= 224 && tag <= 239) || tag === 254) {
      metadata += n;
      if (metadata > LIMITS.metadata) fail("MEDIA_METADATA_LIMIT");
    }
    p += n;
    if (tag === 218) {
      sos = true;
      while (p < b.length) {
        if (b[p] !== 255) {
          p++;
          continue;
        }
        let q = p + 1;
        while (b[q] === 255) q++;
        if (q >= b.length) fail("JPEG_TRUNCATED");
        if (b[q] === 0 || (b[q] >= 208 && b[q] <= 215)) {
          p = q + 1;
          continue;
        }
        break;
      }
    }
  }
  fail("JPEG_TRUNCATED");
}
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export function checkNativeMetadata(m, s) {
  const h = s.mime === "image/gif" ? (m.pageHeight ?? m.height) : m.height;
  if (
    m.format !== s.mime.slice(6).replace("jpeg", "jpeg") ||
    m.width !== s.width ||
    h !== s.height ||
    (m.pages ?? 1) !== s.frames ||
    !Number.isSafeInteger(m.channels) ||
    m.channels < 1 ||
    m.channels > 4
  )
    fail("MEDIA_METADATA_MISMATCH");
  if (
    s.mime === "image/gif" &&
    JSON.stringify(m.delay) !== JSON.stringify(s.delays)
  )
    fail("GIF_DELAY_MISMATCH");
  if (
    (m.exif?.length ?? 0) +
      (m.icc?.length ?? 0) +
      (m.iptc?.length ?? 0) +
      (m.xmp?.length ?? 0) >
    LIMITS.metadata
  )
    fail("MEDIA_METADATA_LIMIT");
}

// Maintained zlib handles compressed bytes; this bounded gate never substitutes for native raster decode.
// Invoke only inside the isolated processor, never for hostile data in the host/API process.
export async function checkPngDecompression(structure) {
  if (structure.mime !== "image/png") return;
  const { width, height, png } = structure;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[png.colorType];
  let expected = 0;
  const passes = png.interlace
    ? [
        [0, 0, 8, 8],
        [4, 0, 8, 8],
        [0, 4, 4, 8],
        [2, 0, 4, 4],
        [0, 2, 2, 4],
        [1, 0, 2, 2],
        [0, 1, 1, 2],
      ]
    : [[0, 0, 1, 1]];
  for (const [x, y, dx, dy] of passes) {
    const w = Math.max(0, Math.ceil((width - x) / dx)),
      h = Math.max(0, Math.ceil((height - y) / dy));
    if (w && h)
      expected += h * (1 + Math.ceil((w * channels * png.bitDepth) / 8));
  }
  if (
    !Number.isSafeInteger(expected) ||
    expected < 1 ||
    expected > LIMITS.expanded + LIMITS.axis
  )
    fail("PNG_DECOMPRESSION_LIMIT");
  const compressed = Buffer.concat(png.idat);
  await new Promise((resolve, reject) => {
    const inflate = createInflate({ chunkSize: 16384 });
    let count = 0;
    inflate.on("data", (chunk) => {
      count += chunk.length;
      if (count > expected)
        inflate.destroy(new Error("PNG_DECOMPRESSION_OVERRUN"));
    });
    inflate.on("error", (error) => reject(error));
    inflate.on("end", () => {
      if (count !== expected || inflate.bytesWritten !== compressed.length)
        reject(new Error("PNG_DECOMPRESSION_MISMATCH"));
      else resolve();
    });
    inflate.end(compressed);
  });
}
