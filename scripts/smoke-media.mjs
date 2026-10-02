import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  chmod,
  readdir,
} from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
  MEDIA_PROFILE,
  SCAN_PROFILE,
  bytesDigest,
  validateMediaReceipt,
  validateScanReceipt,
  verifyOutputBytes,
} from "../media/protocol.mjs";
const fixtures = resolve("tests/fixtures/media");
const logs = [];
const evidencePath = process.argv.includes("--decoder-only")
  ? "output/media-runtime-evidence/qualification-decoder.json"
  : "output/media-runtime-evidence/qualification.json";
function command(cmd, args, input, timeout = 60000) {
  return new Promise((res, rej) => {
    const started = Date.now(),
      p = spawn(cmd, args, { shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let out = "",
      err = "",
      n = 0;
    const t = setTimeout(() => {
      p.kill("SIGKILL");
      rej(new Error("COMMAND_TIMEOUT"));
    }, timeout);
    p.stdout.on("data", (b) => {
      n += b.length;
      out += b;
      if (n > 1024 * 1024) p.kill("SIGKILL");
    });
    p.stderr.on("data", (b) => {
      n += b.length;
      err += b;
      if (n > 1024 * 1024) p.kill("SIGKILL");
    });
    p.on("error", (e) => {
      clearTimeout(t);
      rej(e);
    });
    p.on("close", (code) => {
      clearTimeout(t);
      res({ code, out, err, wall_ms: Date.now() - started });
    });
    p.stdin.end(input ?? "");
  });
}
async function runContainer(
  image,
  args,
  input,
  { scan = false, timeout = 60000, entrypoint } = {},
) {
  const name = `lettercape-media-proof-${randomUUID()}`;
  const argv = [
    "run",
    "--name",
    name,
    "--rm",
    "--network",
    "none",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--pids-limit",
    "64",
    "--memory",
    scan ? "3g" : "1g",
    "--cpus",
    scan ? "2" : "1",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=128m",
    ...(scan ? ["--platform", "linux/amd64"] : []),
    "-i",
    ...(entrypoint ? ["--entrypoint", entrypoint] : []),
    ...args,
    image,
  ];
  try {
    return await command("docker", argv, input, timeout);
  } finally {
    await command("docker", ["rm", "-f", name], "", 5000);
  }
}
async function generateFixtures() {
  const { default: sharp } = await import("sharp");
  assert.equal(sharp.versions.sharp, "0.35.5");
  await mkdir(fixtures, { recursive: true });
  const R = [255, 0, 0, 255],
    B = [0, 0, 255, 255],
    G = [0, 255, 0, 255],
    T = [0, 0, 0, 0];
  const rgba = (a) => Buffer.from(a.flat());
  const single = async (w, h, pixels) =>
    sharp(rgba(pixels), { raw: { width: w, height: h, channels: 4 } })
      .gif({ dither: 0, effort: 7, colours: 256 })
      .toBuffer();
  function components(gif) {
    let p = 13;
    const palette = gif.subarray(p, p + 3 * (1 << ((gif[10] & 7) + 1)));
    p += palette.length;
    let gce;
    while (gif[p] !== 44) {
      assert.equal(gif[p++], 33);
      const kind = gif[p++];
      const begin = p - 2;
      while (true) {
        const n = gif[p++];
        if (!n) break;
        p += n;
      }
      if (kind === 249) gce = Buffer.from(gif.subarray(begin, p));
    }
    const image = Buffer.from(gif.subarray(p, gif.length - 1));
    return { header: Buffer.from(gif.subarray(0, 13)), palette, gce, image };
  }
  const basePixels = [R, R, R, R, R, T],
    base = components(await single(3, 2, basePixels));
  const blue = components(await single(1, 1, [B])),
    green = components(await single(1, 1, [G]));
  function frame(c, x, y, disposal, delay, local = true, interlace = false) {
    const gce = Buffer.from(c.gce ?? [33, 249, 4, 0, 0, 0, 0, 0]);
    gce[3] = (gce[3] & 1) | (disposal << 2);
    gce.writeUInt16LE(delay / 10, 4);
    const image = Buffer.from(c.image);
    image.writeUInt16LE(x, 1);
    image.writeUInt16LE(y, 3);
    image[9] = (local ? 128 | (c.header[10] & 7) : 0) | (interlace ? 64 : 0);
    return Buffer.concat([
      gce,
      image.subarray(0, 10),
      ...(local ? [c.palette] : []),
      image.subarray(10),
    ]);
  }
  const cases = [];
  for (const disposal of [0, 1, 2, 3]) {
    const header = Buffer.from(base.header);
    header.write("GIF89a");
    header[11] = base.gce?.[6] ?? 0;
    const gif = Buffer.concat([
      header,
      base.palette,
      frame(base, 0, 0, 1, 100, false),
      frame(blue, 1, 0, disposal, 200),
      frame(green, 2, 1, 1, 300),
      Buffer.from([59]),
    ]);
    const third = [...basePixels];
    third[1] = disposal === 2 ? T : disposal === 3 ? R : B;
    third[5] = G;
    const name = `disposal-${disposal}.gif`;
    await writeFile(resolve(fixtures, name), gif);
    cases.push({
      filename: name,
      width: 3,
      height: 2,
      frames: [basePixels, [R, B, R, R, R, T], third].map((a) =>
        rgba(a).toString("hex"),
      ),
      notes:
        "Library-encoded LZW; handcrafted bounded GIF framing only. Native disposal/compositing checked against independent explicit RGBA.",
    });
  }
  const transparent = components(await single(2, 1, [B, T]));
  const gif = Buffer.concat([
    base.header,
    base.palette,
    frame(base, 0, 0, 1, 100, false),
    frame(transparent, 0, 0, 1, 200),
    Buffer.from([59]),
  ]);
  await writeFile(resolve(fixtures, "transparent-local.gif"), gif);
  cases.push({
    filename: "transparent-local.gif",
    width: 3,
    height: 2,
    frames: [basePixels, [B, R, R, R, R, T]].map((a) =>
      rgba(a).toString("hex"),
    ),
  });
  const rowPixels = [R, R, B, B, G, G, T, T];
  const interlaced = components(
    await single(2, 4, [
      ...rowPixels.slice(0, 2),
      ...rowPixels.slice(4, 6),
      ...rowPixels.slice(2, 4),
      ...rowPixels.slice(6, 8),
    ]),
  );
  const iGif = Buffer.concat([
    interlaced.header,
    interlaced.palette,
    frame(interlaced, 0, 0, 1, 100, false, true),
    Buffer.from([59]),
  ]);
  await writeFile(resolve(fixtures, "interlaced-global.gif"), iGif);
  cases.push({
    filename: "interlaced-global.gif",
    width: 2,
    height: 4,
    frames: [rgba(rowPixels).toString("hex")],
  });
  await writeFile(
    resolve(fixtures, "expected.json"),
    JSON.stringify(
      {
        license:
          "MIT; generated by Lettercape contributors from original synthetic pixel grids, Sharp0.35.5 encodes compressed image data; no external fixture copyright.",
        cases,
      },
      null,
      2,
    ) + "\n",
  );
  const png = await sharp(rgba(basePixels), {
    raw: { width: 3, height: 2, channels: 4 },
  })
    .png()
    .toBuffer();
  await writeFile(resolve(fixtures, "source.png"), png);
  function chunk(tag, data) {
    const kind = Buffer.from(tag);
    let crc = 0xffffffff;
    for (const x of Buffer.concat([kind, data])) {
      crc ^= x;
      for (let k = 0; k < 8; k++)
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    const out = Buffer.alloc(data.length + 12);
    out.writeUInt32BE(data.length);
    kind.copy(out, 4);
    data.copy(out, 8);
    out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, data.length + 8);
    return out;
  }
  await writeFile(
    resolve(fixtures, "compressed-metadata.png"),
    Buffer.concat([
      png.subarray(0, 33),
      chunk(
        "zTXt",
        Buffer.concat([
          Buffer.from("comment\0\0"),
          deflateSync(Buffer.from("unsupported compressed metadata")),
        ]),
      ),
      png.subarray(33),
    ]),
  );
  const actl = Buffer.alloc(8);
  actl.writeUInt32BE(2);
  await writeFile(
    resolve(fixtures, "animated.png"),
    Buffer.concat([png.subarray(0, 33), chunk("acTL", actl), png.subarray(33)]),
  );
  const tiny = await sharp(rgba([R]), {
    raw: { width: 1, height: 1, channels: 4 },
  })
    .png()
    .toBuffer();
  await writeFile(
    resolve(fixtures, "decompression.png"),
    Buffer.concat([
      tiny.subarray(0, 33),
      chunk("IDAT", deflateSync(Buffer.alloc(16 * 1024 * 1024))),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
  await writeFile(
    resolve(fixtures, "source.jpg"),
    await sharp(rgba(basePixels), { raw: { width: 3, height: 2, channels: 4 } })
      .removeAlpha()
      .jpeg()
      .toBuffer(),
  );
}
async function decoderProof(image) {
  const expected = JSON.parse(
    await readFile(resolve(fixtures, "expected.json"), "utf8"),
  );
  const scratch = await mkdtemp("/tmp/lettercape-media-proof-");
  await chmod(scratch, 0o755);
  let outputs;
  async function decode(name, frame = 0, bytes) {
    const dir = resolve(scratch, randomUUID());
    await mkdir(dir, { mode: 0o777 });
    await chmod(dir, 0o777);
    const source = resolve(scratch, `${randomUUID()}.source`);
    bytes ??= await readFile(resolve(fixtures, name));
    await writeFile(source, bytes, { mode: 0o444 });
    const input = {
      version: 1,
      source_sha256: bytesDigest(bytes),
      source_path: "/input/source",
      output_directory: "/output",
      selected_frame: frame,
      processing_profile: MEDIA_PROFILE,
    };
    const result = await runContainer(
      image,
      [
        "--env",
        `MEDIA_IMAGE_DIGEST=${image}`,
        "--mount",
        `type=bind,src=${source},dst=/input/source,readonly`,
        "--mount",
        `type=bind,src=${dir},dst=/output`,
      ],
      JSON.stringify(input),
    );
    logs.push({ stage: "decode", fixture: name, frame, ...result });
    if (result.code !== 0) return { ...result, dir, input, source };
    const receipt = validateMediaReceipt(
      JSON.parse(await readFile(resolve(dir, "receipt.json"), "utf8")),
      input,
    );
    for (const o of receipt.outputs)
      verifyOutputBytes(await readFile(resolve(dir, o.filename)), o);
    assert.deepEqual(
      (await readdir(dir)).sort(),
      [...receipt.outputs.map((o) => o.filename), "receipt.json"].sort(),
    );
    return { ...result, receipt, dir, input, source };
  }
  for (const c of expected.cases)
    for (let frame = 0; frame < c.frames.length; frame++) {
      const r = await decode(c.filename, frame);
      assert.equal(r.code, 0, r.err);
      const filename = r.receipt.outputs.find(
        (o) => o.role === "fallback",
      ).filename; // Verify actual fallback pixels using the pinned native decoder in another offline container.
      const raw = await command("docker", [
        "run",
        "--rm",
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--pids-limit",
        "64",
        "--memory",
        "1g",
        "--cpus",
        "1",
        "--entrypoint",
        "node",
        "--mount",
        `type=bind,src=${r.dir},dst=/proof,readonly`,
        image,
        "--input-type=module",
        "-e",
        `import sharp from 'sharp';const b=await sharp('/proof/${filename}',{failOn:'warning',limitInputPixels:16777216}).ensureAlpha().raw().toBuffer();const animation=await sharp('/proof/animation.gif',{animated:true,failOn:'warning',limitInputPixels:16777216}).ensureAlpha().raw().toBuffer();const meta=await sharp('/proof/${filename}').metadata();if(meta.exif||meta.icc||meta.xmp||meta.iptc)throw Error('metadata preserved');console.log(JSON.stringify({fallback:b.toString('hex'),animation:animation.toString('hex')}));`,
      ]);
      assert.equal(raw.code, 0, raw.err);
      const pixels = JSON.parse(raw.out);
      assert.equal(
        pixels.fallback,
        c.frames[frame],
        `${c.filename} frame${frame}`,
      );
      assert.equal(
        pixels.animation,
        c.frames.join(""),
        `${c.filename} reencoded animation`,
      );
      logs.push({
        stage: "pixels",
        fixture: c.filename,
        frame,
        rgba: raw.out.trim(),
        wall_ms: raw.wall_ms,
      });
      if (frame === 0) {
        const repeat = await decode(c.filename, frame);
        assert.equal(repeat.code, 0, repeat.err);
        assert.deepEqual(repeat.receipt, r.receipt);
        for (const o of r.receipt.outputs)
          assert.deepEqual(
            await readFile(resolve(r.dir, o.filename)),
            await readFile(resolve(repeat.dir, o.filename)),
          );
      }
      outputs = r;
    }
  for (const name of ["source.png", "source.jpg"]) {
    const r = await decode(name);
    assert.equal(r.code, 0, r.err);
    if (name === "source.png") outputs = r;
  }
  const valid = await readFile(resolve(fixtures, "disposal-1.gif"));
  const huge = Buffer.from(valid);
  huge.writeUInt16LE(65535, 6);
  const badLzw = Buffer.from(valid);
  let p = 13 + 3 * (1 << ((badLzw[10] & 7) + 1));
  while (badLzw[p] !== 44) {
    p += 2;
    while (true) {
      const n = badLzw[p++];
      if (!n) break;
      p += n;
    }
  }
  p += 10;
  if (badLzw[p - 1] & 128) p += 3 * (1 << ((badLzw[p - 1] & 7) + 1));
  badLzw[p] = 1;
  const brokenChain = Buffer.from(valid);
  brokenChain.fill(255, p + 2, p + 2 + brokenChain[p + 1]);
  const reservedDisposal = Buffer.from(valid);
  reservedDisposal[13 + 3 * (1 << ((valid[10] & 7) + 1)) + 3] = 16;
  const zeroRect = Buffer.from(valid);
  zeroRect.writeUInt16LE(0, p - 6);
  const denial = [
    ["broken-lzw-chain", brokenChain],
    ["reserved-disposal", reservedDisposal],
    ["zero-rectangle", zeroRect],
    ["script", Buffer.from('<script>fetch("https://example.com")</script>')],
    ["svg", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ["truncated", valid.subarray(0, valid.length - 2)],
    ["trailing", Buffer.concat([valid, Buffer.from("<script>")])],
    ["huge-canvas", huge],
    ["invalid-lzw", badLzw],
    [
      "compressed-metadata",
      await readFile(resolve(fixtures, "compressed-metadata.png")),
    ],
    ["animated-png", await readFile(resolve(fixtures, "animated.png"))],
    [
      "png-decompression-overrun",
      await readFile(resolve(fixtures, "decompression.png")),
    ],
  ];
  for (const [name, bytes] of denial) {
    const r = await decode(name, 0, bytes);
    assert.notEqual(r.code, 0, `${name} unexpectedly accepted`);
    assert(
      !(await readFile(resolve(r.dir, "receipt.json")).then(
        () => true,
        () => false,
      )),
    );
  }
  return { scratch, outputs, decode };
}
async function scanProof(image, db, decoded) {
  const snap = JSON.parse(await readFile(resolve(db, "snapshot.json"), "utf8"));
  let budget = 90000;
  async function scan(files, directory) {
    const input = {
      version: 1,
      profile: SCAN_PROFILE,
      files,
      database_snapshot_sha256: snap.snapshot_sha256,
    };
    const result = await runContainer(
      image,
      [
        "--env",
        `SCAN_IMAGE_DIGEST=${image}`,
        "--mount",
        `type=bind,src=${directory},dst=/scan,readonly`,
        "--mount",
        `type=bind,src=${db},dst=/database,readonly`,
      ],
      JSON.stringify(input),
      { scan: true, timeout: budget },
    );
    logs.push({ stage: "scan", files, ...result });
    budget -= result.wall_ms;
    if (result.code === 0) validateScanReceipt(JSON.parse(result.out), input);
    return result;
  }
  const sourceDir = resolve(decoded.scratch, "source-scan");
  await mkdir(sourceDir);
  for (const [filename, frame] of [
    ["source.png", 0],
    ["disposal-3.gif", 2],
  ]) {
    budget = 90000;
    const bytes = await readFile(resolve(fixtures, filename));
    await writeFile(resolve(sourceDir, "source"), bytes);
    const clean = await scan(
      [{ filename: "source", sha256: bytesDigest(bytes), bytes: bytes.length }],
      sourceDir,
    );
    assert.equal(clean.code, 0, clean.err);
    const outputs = await decoded.decode(filename, frame);
    assert.equal(outputs.code, 0, outputs.err);
    const derivative = await scan(
      outputs.receipt.outputs.map((o) => ({
        filename: o.filename,
        sha256: o.sha256,
        bytes: o.bytes,
      })),
      outputs.dir,
    );
    assert.equal(derivative.code, 0, derivative.err);
    assert(budget > 0, "aggregate scan90s exceeded");
    logs.push({
      stage: "ready-chain",
      fixture: filename,
      scan_wall_ms: 90000 - budget,
      order: "original-scan→decode→all-derivative-scan",
      source_sha256: bytesDigest(bytes),
      outputs: outputs.receipt.outputs,
    });
  }
  // EICAR goes through scanner alone; never a decoder or public upload.
  budget = 90000;
  const eicar = Buffer.from(
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
  );
  await writeFile(resolve(sourceDir, "source"), eicar);
  const denied = await scan(
    [{ filename: "source", sha256: bytesDigest(eicar), bytes: eicar.length }],
    sourceDir,
  );
  assert.notEqual(denied.code, 0);
  assert.match(denied.err, /SCAN_INFECTED/);
}
async function scannerDenials(image, db, scratch) {
  const snap = JSON.parse(await readFile(resolve(db, "snapshot.json"), "utf8"));
  const directory = resolve(scratch, "negative-source");
  await mkdir(directory);
  const bytes = await readFile(resolve(fixtures, "source.png"));
  await writeFile(resolve(directory, "source"), bytes);
  const input = {
    version: 1,
    profile: SCAN_PROFILE,
    files: [
      { filename: "source", sha256: bytesDigest(bytes), bytes: bytes.length },
    ],
    database_snapshot_sha256: snap.snapshot_sha256,
  };
  async function probe(label, root, request = input, timeout = 90000) {
    const result = await runContainer(
      image,
      [
        "--env",
        `SCAN_IMAGE_DIGEST=${image}`,
        "--mount",
        `type=bind,src=${directory},dst=/scan,readonly`,
        "--mount",
        `type=bind,src=${root},dst=/database,readonly`,
      ],
      JSON.stringify(request),
      { scan: true, timeout },
    );
    logs.push({ stage: "scan-denial", label, ...result });
    assert.notEqual(result.code, 0, label + " must fail closed");
    assert.equal(result.out.trim(), "");
  }
  const missing = resolve(scratch, "missing-database");
  await mkdir(missing);
  await probe("missing signed database", missing);
  await probe("zero files never clean", db, { ...input, files: [] });
  await probe("mismatched source hash", db, {
    ...input,
    files: [{ ...input.files[0], sha256: "a".repeat(64) }],
  });
  const corrupt = resolve(scratch, "corrupt-database");
  await mkdir(corrupt);
  for (const f of ["snapshot.json", "daily.cvd", "bytecode.cvd"])
    await writeFile(resolve(corrupt, f), await readFile(resolve(db, f)));
  await writeFile(
    resolve(corrupt, "main.cvd"),
    Buffer.from("invalid official signature database"),
  );
  await probe("invalid database signature", corrupt);
  const unbound = resolve(scratch, "unbound-database");
  await mkdir(unbound);
  await writeFile(
    resolve(unbound, "snapshot.json"),
    await readFile(resolve(db, "snapshot.json")),
  );
  await writeFile(
    resolve(unbound, "extra.hdb"),
    Buffer.from("unbound signature"),
  );
  await probe("unbound database file", unbound);
  await assert.rejects(
    () => probe("actual bounded scanner timeout", db, input, 2000),
    /COMMAND_TIMEOUT/,
  );
  logs.push({
    stage: "scan-denial",
    label: "actual bounded scanner timeout",
    timeout_ms: 2000,
    container_reaped: true,
  });
  const remaining = await command("docker", [
    "ps",
    "--filter",
    "name=lettercape-media-proof-",
    "--format",
    "{{.Names}}",
  ]);
  assert.equal(remaining.code, 0);
  assert.equal(
    remaining.out.trim(),
    "",
    "all one-shot proof containers reaped",
  );
}

async function main() {
  if (process.argv.includes("--write-fixtures")) {
    await generateFixtures();
    return;
  }
  const inspect = await command("docker", [
    "image",
    "inspect",
    process.env.MEDIA_DECODER_IMAGE ?? "lettercape-media:dev",
    "--format",
    "{{.Id}}",
  ]);
  assert.equal(inspect.code, 0, inspect.err);
  const decoder = inspect.out.trim();
  const proof = await decoderProof(decoder);
  if (!process.argv.includes("--decoder-only")) {
    const scanner = await command("docker", [
      "image",
      "inspect",
      process.env.MEDIA_SCANNER_IMAGE ?? "lettercape-media-scan:dev",
      "--format",
      "{{.Id}}",
    ]);
    assert.equal(scanner.code, 0, scanner.err);
    const database =
      process.env.MEDIA_SCAN_DATABASE_ROOT ??
      "/tmp/lettercape-media-signatures-ddf036f5";
    await scanProof(scanner.out.trim(), database, proof);
    await scannerDenials(scanner.out.trim(), database, proof.scratch);
  }
  await mkdir("output/media-runtime-evidence", { recursive: true });
  await writeFile(
    evidencePath,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        decoder,
        profiles: {
          decoder: {
            network: "none",
            read_only: true,
            user: "1001:1001",
            memory_bytes: 1073741824,
            cpus: 1,
            pids: 64,
            tmpfs_bytes: 134217728,
            wall_ms: 60000,
          },
          scanner: {
            network: "none",
            read_only: true,
            user: "100:101",
            memory_bytes: 3221225472,
            cpus: 2,
            pids: 64,
            tmpfs_bytes: 134217728,
            aggregate_wall_ms: 90000,
            platform: "linux/amd64",
          },
        },
        logs,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      decoder,
      checks: logs.length,
      status: "passed",
      evidence: evidencePath,
    }),
  );
}
main().catch(async (e) => {
  await mkdir("output/media-runtime-evidence", { recursive: true });
  await writeFile(
    "output/media-runtime-evidence/qualification-red.json",
    JSON.stringify(
      { at: new Date().toISOString(), error: e.stack, logs },
      null,
      2,
    ) + "\n",
  );
  console.error(e);
  process.exitCode = 1;
});
