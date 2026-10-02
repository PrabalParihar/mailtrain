import { spawn } from "node:child_process";
import { readFile, writeFile, lstat, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  SCAN_PROFILE,
  LIMITS,
  fail,
  bytesDigest,
  validateScanInput,
  validateScanReceipt,
} from "./protocol.mjs";
const MAX_LOG = 1024 * 1024;
function run(executable, args, timeout = 85000) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      shell: false,
      env: {
        PATH: "/usr/local/bin:/usr/bin:/bin",
        HOME: "/tmp",
        LANG: "C",
        TZ: "UTC",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let n = 0,
      stdout = "",
      stderr = "",
      done = false,
      peakRss = 0;
    const sampler = setInterval(async () => {
      const status = await readFile(`/proc/${child.pid}/status`, "utf8").catch(
        () => "",
      );
      peakRss = Math.max(
        peakRss,
        Number(status.match(/^VmHWM:\s*(\d+)/m)?.[1] ?? 0),
      );
    }, 25);
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("SCAN_TIMEOUT"));
    }, timeout);
    const collect = (key) => (b) => {
      n += b.length;
      if (n > MAX_LOG) {
        child.kill("SIGKILL");
        reject(new Error("SCAN_LOG_LIMIT"));
      } else if (key === "out") stdout += b.toString();
      else stderr += b.toString();
    };
    child.stdout.on("data", collect("out"));
    child.stderr.on("data", collect("err"));
    child.on("error", (e) => {
      clearTimeout(timer);
      clearInterval(sampler);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      clearInterval(sampler);
      if (!done) {
        done = true;
        if (executable === "clamscan" && !args.includes("--version"))
          process.stderr.write(
            JSON.stringify({
              native_resources: {
                engine: executable,
                sampled_peak_rss_kib: peakRss,
                sample_interval_ms: 25,
              },
            }) + "\n",
          );
        resolve({ code, stdout, stderr });
      }
    });
  });
}
async function digestFile(path) {
  const s = await lstat(path);
  if (!s.isFile() || s.isSymbolicLink() || s.size > 512 * 1024 * 1024)
    fail("SCAN_DATABASE_INVALID");
  const h = createHash("sha256");
  for await (const b of createReadStream(path)) h.update(b);
  return { sha256: h.digest("hex"), bytes: s.size };
}
function dailyDate(text) {
  const match = text.match(/^Build time:\s*(.+)$/m);
  if (!match) fail("SCAN_DATABASE_INVALID");
  const date = new Date(match[1].replace(/\s+\+0000\s*$/, " UTC"));
  if (!Number.isFinite(date.getTime())) fail("SCAN_DATABASE_INVALID");
  return date.toISOString();
}
async function officialDatabase(expected) {
  const entries = await readdir("/database");
  const allowed = new Set([
    "main.cvd",
    "main.cld",
    "daily.cvd",
    "daily.cld",
    "bytecode.cvd",
    "bytecode.cld",
    "snapshot.json",
    "freshclam.dat",
  ]);
  if (entries.some((name) => !allowed.has(name)))
    fail("SCAN_DATABASE_UNBOUND_FILE");
  const files = [];
  let daily;
  for (const stem of ["main", "daily", "bytecode"]) {
    const candidates = entries.filter(
      (n) => n === `${stem}.cvd` || n === `${stem}.cld`,
    );
    if (candidates.length !== 1) fail("SCAN_DATABASE_MISSING");
    const filename = candidates[0],
      path = `/database/${filename}`;
    const digest = await digestFile(path);
    const info = await run("sigtool", [`--info=${path}`], 30000);
    if (info.code !== 0 || !/Verification OK\./.test(info.stdout + info.stderr))
      fail("SCAN_DATABASE_SIGNATURE_INVALID");
    if (stem === "daily") daily = dailyDate(info.stdout);
    files.push({ filename, ...digest });
  }
  const snapshotHash = bytesDigest(Buffer.from(JSON.stringify(files)));
  if (expected && snapshotHash !== expected) fail("SCAN_DATABASE_MISMATCH");
  const now = Date.now();
  if (
    !daily ||
    Date.parse(daily) > now ||
    now - Date.parse(daily) > LIMITS.freshnessMs
  )
    fail("SCAN_DATABASE_STALE");
  return { files, snapshot_sha256: snapshotHash, daily_built_at: daily };
}
async function prepare() {
  const config =
    "DatabaseDirectory /database\nDatabaseOwner clamav\nDatabaseMirror database.clamav.net\nDNSDatabaseInfo current.cvd.clamav.net\nScriptedUpdates no\nChecks 1\nConnectTimeout 30\nReceiveTimeout 120\nMaxAttempts 1\n";
  await writeFile("/tmp/freshclam.conf", config, { mode: 0o600 });
  const result = await run(
    "freshclam",
    ["--config-file=/tmp/freshclam.conf", "--stdout"],
    600000,
  );
  process.stderr.write(result.stdout + result.stderr);
  if (result.code !== 0) fail("SCAN_UPDATE_FAILED");
  const db = await officialDatabase();
  const snapshot = {
    version: 1,
    profile: SCAN_PROFILE,
    ...db,
    verified_at: new Date().toISOString(),
  };
  await writeFile("/database/snapshot.json", JSON.stringify(snapshot) + "\n", {
    mode: 0o644,
  });
  process.stdout.write(JSON.stringify(snapshot) + "\n");
}
async function scan() {
  const chunks = [];
  let n = 0;
  for await (const b of process.stdin) {
    n += b.length;
    if (n > 4096) fail("SCAN_INPUT_INVALID");
    chunks.push(b);
  }
  const input = validateScanInput(JSON.parse(Buffer.concat(chunks).toString()));
  const started_at = new Date().toISOString();
  const deadline = Date.now() + 85000;
  const digest = process.env.SCAN_IMAGE_DIGEST;
  if (!/^sha256:[a-f0-9]{64}$/.test(digest ?? ""))
    fail("SCAN_RUNTIME_UNPINNED");
  const version = await run("clamscan", ["--version"], 5000);
  if (version.code !== 0 || !/^ClamAV 1\.4\.6(?:\/|\s|$)/.test(version.stdout))
    fail("SCAN_ENGINE_INVALID");
  const snapshotBytes = await readFile("/database/snapshot.json");
  if (snapshotBytes.length > LIMITS.receipt) fail("SCAN_DATABASE_INVALID");
  const snapshot = JSON.parse(snapshotBytes.toString());
  if (
    snapshot.version !== 1 ||
    snapshot.profile !== SCAN_PROFILE ||
    snapshot.snapshot_sha256 !== input.database_snapshot_sha256 ||
    typeof snapshot.verified_at !== "string" ||
    !Number.isFinite(Date.parse(snapshot.verified_at)) ||
    Date.parse(snapshot.verified_at) > Date.now()
  )
    fail("SCAN_DATABASE_INVALID");
  const db = await officialDatabase(input.database_snapshot_sha256);
  if (
    JSON.stringify(snapshot.files) !== JSON.stringify(db.files) ||
    snapshot.daily_built_at !== db.daily_built_at
  )
    fail("SCAN_DATABASE_MISMATCH");
  for (const f of input.files) {
    const s = await lstat(`/scan/${f.filename}`);
    if (!s.isFile() || s.isSymbolicLink() || s.size !== f.bytes)
      fail("SCAN_SOURCE_MISMATCH");
    const data = await readFile(`/scan/${f.filename}`);
    if (bytesDigest(data) !== f.sha256) fail("SCAN_SOURCE_MISMATCH");
  }
  const result = await run(
    "clamscan",
    [
      "--stdout",
      "--database=/database",
      "--official-db-only=yes",
      "--bytecode-unsigned=no",
      "--max-filesize=20M",
      "--max-scansize=80M",
      "--max-recursion=4",
      "--max-files=16",
      "--max-scantime=0",
      "--alert-exceeds-max=yes",
      "--alert-broken-media=yes",
      "--follow-file-symlinks=0",
      "--follow-dir-symlinks=0",
      "--tempdir=/tmp",
      "--disable-cache",
      ...input.files.map((f) => `/scan/${f.filename}`),
    ],
    Math.max(1, deadline - Date.now()),
  );
  process.stderr.write(result.stdout + result.stderr);
  if (result.code === 1) fail("SCAN_INFECTED");
  if (
    result.code !== 0 ||
    /ERROR|WARNING|Heuristics\.Limits|Skipped|not scanned/i.test(
      result.stdout + result.stderr,
    )
  )
    fail("SCAN_FAILED");
  const count = result.stdout.match(/^Scanned files:\s*(\d+)\s*$/m),
    infected = result.stdout.match(/^Infected files:\s*(\d+)\s*$/m);
  if (
    !count ||
    Number(count[1]) !== input.files.length ||
    !infected ||
    Number(infected[1]) !== 0 ||
    input.files.some((f) => !result.stdout.includes(`/scan/${f.filename}: OK`))
  )
    fail("SCAN_INCOMPLETE");
  const receipt = {
    version: 1,
    profile: SCAN_PROFILE,
    status: "clean",
    runtime: {
      engine: "1.4.6",
      image_digest: digest,
      architecture: process.arch,
    },
    database: {
      snapshot_sha256: db.snapshot_sha256,
      daily_built_at: db.daily_built_at,
      verified_at: snapshot.verified_at,
    },
    files: input.files,
    scanned_files: Number(count[1]),
    started_at,
    completed_at: new Date().toISOString(),
  };
  validateScanReceipt(receipt, input);
  process.stdout.write(JSON.stringify(receipt) + "\n");
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
(process.argv[2] === "--prepare" ? prepare() : scan())
  .catch((e) => {
    process.stderr.write(
      JSON.stringify({ error: e.code ?? e.message ?? "SCAN_FAILED" }) + "\n",
    );
    process.exitCode = 1;
  })
  .finally(resources);
