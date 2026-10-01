import type { Derivation } from '@/domain/derivation';
// Store only hashes and opaque identifiers, never draft content or credentials.
const prefix = 'lettercape.derivation.';
type Receipt = { source: string; key: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function derivationSlot(workspace: string, parent: string, input: Derivation, version: number, spec: string) {
  const identity = JSON.stringify([workspace, parent, input, version, spec]);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))))
    .map((value) => value.toString(16).padStart(2, '0')).join('');
  return prefix + workspace + '.' + parent + '.' + hash;
}
export function pendingDerivation(slot: string): Receipt | null {
  const raw = sessionStorage.getItem(slot);
  if (!raw) return null;
  const value = JSON.parse(raw) as Receipt;
  if (!value || typeof value.source !== 'string' || typeof value.key !== 'string' || !uuid.test(value.source) || !uuid.test(value.key))
    throw new Error('The pending draft receipt could not be read. Check Emails before creating another draft.');
  return value;
}
export function rememberDerivation(slot: string, source: string): Receipt {
  // Never evict an unresolved receipt: doing so could turn a retry into a duplicate.
  const count = Object.keys(sessionStorage).filter((key) => key.startsWith(prefix)).length;
  if (count >= 32) throw new Error('There are too many unresolved draft creations in this tab. Check Emails and retry their original titles before starting another.');
  const receipt = { source, key: crypto.randomUUID() };
  try { sessionStorage.setItem(slot, JSON.stringify(receipt)); }
  catch { throw new Error('This tab cannot preserve a draft creation receipt. Enable session storage before creating a remix or language draft.'); }
  return receipt;
}
export function acknowledgeDerivation(slot: string) { sessionStorage.removeItem(slot); }
