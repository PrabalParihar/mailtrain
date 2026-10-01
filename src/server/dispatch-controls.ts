import type { Tx } from './db';
import type { Principal } from './auth';
import { DispatchPolicyInput, DispatchProvider, policyDecision, type DispatchProviderId, type PolicyInput } from '../domain/dispatch-controls';
import { fail } from './errors';
import { audit } from './audit';
type PolicyRow = { scope: 'global'|'provider'|'workspace'; target: string; paused: boolean; version: number; reason: string; updated_at: string };
const lockName = (scope: string, target: string) => 'lettercape.dispatch.' + scope + '.' + target;
export async function readDispatchControls(tx: Tx, workspace: string) {
  const rows: PolicyRow[] = (await tx.query("SELECT scope,target,paused,version,reason,updated_at FROM dispatch_controls WHERE scope<>'workspace' OR workspace_id=$1", [workspace])).rows;
  const global = rows.find((row) => row.scope === 'global') ?? null;
  const providers = DispatchProvider.options.map((provider) => ({ provider, policy: rows.find((row) => row.scope === 'provider' && row.target === provider) ?? null }));
  const workspacePolicy = rows.find((row) => row.scope === 'workspace') ?? { scope: 'workspace' as const, target: workspace, paused: true, version: 0, reason: 'maintenance', updated_at: null };
  return { global, providers, workspace: workspacePolicy, dispatch_enabled: false, notice: 'Releasing a stop does not enable sending. Production identity, consent, provider, budget and release gates remain required.' };
}
async function mutatePolicy(tx: Tx, scope: string, target: string, workspace: string|null, input: PolicyInput) {
  const value = DispatchPolicyInput.parse(input);
  await tx.query("SET LOCAL lock_timeout='2s'");
  await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [lockName(scope,target)]);
  const row = (await tx.query('SELECT version FROM dispatch_controls WHERE scope=$1 AND target=$2', [scope,target])).rows[0];
  if ((row?.version ?? 0) !== value.expected_version) fail(409,'VERSION_CONFLICT','The dispatch policy changed. Reload before changing it.');
  if (!row) {
    if (scope !== 'workspace') fail(409,'POLICY_UNAVAILABLE','The operator policy is unavailable. Keep dispatch stopped.');
    await tx.query('INSERT INTO dispatch_controls(scope,target,workspace_id,paused,reason)VALUES($1,$2,$3,$4,$5)',[scope,target,workspace,value.paused,value.reason]);
  } else {
    const changed = await tx.query('UPDATE dispatch_controls SET paused=$1,reason=$2 WHERE scope=$3 AND target=$4',[value.paused,value.reason,scope,target]);
    if (!changed.rowCount) fail(403,'POLICY_CONTROL_DENIED','This authority cannot change the dispatch policy.');
  }
}
async function policyBusy<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); }
  catch(error) {
    if ((error as { code?: string }).code === '55P03') fail(503,'POLICY_BUSY','Dispatch controls are busy. Keep the same command and retry shortly.');
    throw error;
  }
}
export async function setWorkspaceDispatchPolicy(tx: Tx, p: Principal, input: PolicyInput) {
  if (p.api_key) fail(403,'SESSION_REQUIRED','Dispatch controls require an authorized signed-in session.');
  const member = (await tx.query("SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active'",[p.workspace,p.user])).rows[0];
  if (!member || !['Owner','Admin'].includes(member.role)) fail(403,'INSUFFICIENT_SCOPE','Only current workspace Owners and Admins can change dispatch controls.');
  await policyBusy(() => mutatePolicy(tx,'workspace',p.workspace,p.workspace,input));
  await audit(tx,p.workspace,p.user,input.paused ? 'dispatch.workspace_paused' : 'dispatch.workspace_stop_released',p.workspace);
  return readDispatchControls(tx,p.workspace);
}
// No customer HTTP endpoint exposes this function. SQL grants/RLS require the
// separate operator role; production identity/MFA and its service remain gated.
export async function setOperatorDispatchPolicy(tx: Tx, target: 'global'|DispatchProviderId, input: PolicyInput) {
  const scope = target === 'global' ? 'global' : 'provider';
  if (scope === 'provider') DispatchProvider.parse(target);
  await policyBusy(() => mutatePolicy(tx,scope,target,null,input));
}
// Hold these shared transaction fences until the final authorization transaction
// commits. This checks policy only; it never authorizes an external submission.
export async function dispatchPolicyFence(tx: Tx, workspace: string, provider: DispatchProviderId|null) {
  if (provider !== null) DispatchProvider.parse(provider);
  await tx.query("SET LOCAL lock_timeout='2s'");
  await policyBusy(async () => {
    const locks = [['global','global'], ...(provider === null ? [] : [['provider',provider]]), ['workspace',workspace]];
    for (const [scope,target] of locks)
      await tx.query('SELECT pg_advisory_xact_lock_shared(hashtextextended($1,0))',[lockName(scope,target)]);
  });
  const rows = (await tx.query("SELECT scope,target,paused,version FROM dispatch_controls WHERE (scope='global' AND target='global') OR (scope='provider' AND target=$1) OR (scope='workspace' AND workspace_id=$2)",[provider,workspace])).rows;
  const policies = { global: rows.find((row) => row.scope==='global') ?? null, provider: rows.find((row) => row.scope==='provider') ?? null, workspace: rows.find((row) => row.scope==='workspace') ?? null };
  return { ...policyDecision(policies), versions: { global: policies.global?.version ?? null, provider: policies.provider?.version ?? null, workspace: policies.workspace?.version ?? null }, dispatch_enabled: false as const };
}
