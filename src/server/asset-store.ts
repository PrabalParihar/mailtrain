import { constants } from 'node:fs';
import { mkdir, open, lstat, link, unlink, realpath } from 'node:fs/promises';
import { isAbsolute, resolve, relative, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
export interface AssetStore {
  profile: string;
  visibility: 'private' | 'public';
  putImmutable(
    key: string,
    bytes: Uint8Array,
    sha256: string,
  ): Promise<{ key: string; bytes: number; sha256: string }>;
  readVerified(key: string, sha256: string, maxBytes: number): Promise<Uint8Array>;
  removeAuthorized(key: string): Promise<void>;
}
export const bytesHash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const keyPattern = new RegExp(`^${uuid}_${uuid}_(source|variant)$`);
export function assetObjectKey(workspace: string, id: string, kind: 'source' | 'variant') {
  const key = `${workspace}_${id}_${kind}`;
  if (!keyPattern.test(key)) throw new Error('ASSET_KEY_INVALID');
  return key;
}
export class FileAssetStore implements AssetStore {
  readonly profile = 'local-private-v1';
  readonly visibility = 'private' as const;
  readonly root: string;
  constructor(root: string) {
    if (
      !isAbsolute(root) ||
      relative(resolve(process.cwd(), 'public'), resolve(root)).split(sep)[0] !== '..'
    )
      throw new Error('ASSET_STORE_PRIVATE_ROOT_REQUIRED');
    this.root = resolve(
      process.platform === 'darwin' && root.startsWith('/var/')
        ? '/private' + root
        : process.platform === 'darwin' && root.startsWith('/tmp/')
          ? '/private' + root
          : root,
    );
  }
  private path(key: string) {
    if (!keyPattern.test(key)) throw new Error('ASSET_KEY_INVALID');
    return resolve(this.root, key);
  }
  async prepare() {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    if ((await lstat(this.root)).isSymbolicLink() || (await realpath(this.root)) !== this.root)
      throw new Error('ASSET_STORE_SYMLINK');
  }
  async readVerified(key: string, sha256: string, maxBytes: number) {
    await this.prepare();
    if (!/^[a-f0-9]{64}$/.test(sha256) || !Number.isSafeInteger(maxBytes) || maxBytes < 1)
      throw new Error('ASSET_READ_INVALID');
    const file = await open(this.path(key), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const st = await file.stat();
      if (!st.isFile() || st.size < 1 || st.size > maxBytes) throw new Error('ASSET_BYTES_LIMIT');
      const bytes = await file.readFile();
      if (bytes.length !== st.size || bytes.length > maxBytes || bytesHash(bytes) !== sha256)
        throw new Error('ASSET_INTEGRITY_FAILURE');
      return bytes;
    } finally {
      await file.close();
    }
  }
  async putImmutable(key: string, bytes: Uint8Array, sha256: string) {
    await this.prepare();
    const path = this.path(key);
    if (!bytes.length || bytesHash(bytes) !== sha256) throw new Error('ASSET_INTEGRITY_FAILURE');
    const tmp = resolve(this.root, `.tmp-${randomUUID()}`);
    const file = await open(
      tmp,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await file.writeFile(bytes);
      await file.sync();
      await file.close();
      try {
        await link(tmp, path);
        const directory = await open(this.root, constants.O_RDONLY);
        try {
          await directory.sync();
        } finally {
          await directory.close();
        }
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
        await this.readVerified(key, sha256, bytes.length);
      }
    } finally {
      await file.close();
      await unlink(tmp).catch(() => {});
    }
    return { key, bytes: bytes.length, sha256 };
  }
  async removeAuthorized(key: string) {
    await this.prepare();
    const path = this.path(key);
    const st = await lstat(path);
    if (!st.isFile() || st.isSymbolicLink()) throw new Error('ASSET_STORE_SYMLINK');
    await unlink(path);
  }
}
export function configuredAssetStore() {
  if (
    process.env.LOCAL_DEVELOPMENT !== 'true' ||
    process.env.NODE_ENV === 'production' ||
    !process.env.ASSET_STORE_ROOT
  )
    throw new Error('ASSET_STORAGE_NOT_CONFIGURED');
  return new FileAssetStore(process.env.ASSET_STORE_ROOT);
}
