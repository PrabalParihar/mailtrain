'use client';
import { useEffect, useRef, useState } from 'react';
import { KEY_SCOPES } from '@/domain/api-keys';
import { api } from './api';
type Key = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
};
type KeyPage = { data: Key[]; next_cursor: string | null; has_more: boolean };
export function ApiKeys(props: { workspace: string; role: string }) {
  return <ScopedKeys key={props.workspace + ':' + props.role} {...props} />;
}
function ScopedKeys({ workspace, role }: { workspace: string; role: string }) {
  const [keys, setKeys] = useState<Key[]>([]),
    [after, setAfter] = useState<string | null>(null),
    [name, setName] = useState(''),
    [scopes, setScopes] = useState<string[]>(['emails:read']),
    [days, setDays] = useState(90),
    [secret, setSecret] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [observedAt, setObservedAt] = useState(0);
  const epoch = useRef(0),
    running = useRef(false);
  useEffect(() => {
    const current = ++epoch.current;
    if (['Owner', 'Admin'].includes(role))
      void api<KeyPage>(workspace, 'api-keys')
        .then((result) => {
          if (epoch.current === current) {
            setObservedAt(Date.now());
            setKeys(result.data);
            setAfter(result.next_cursor);
          }
        })
        .catch((error) => {
          if (epoch.current === current) setError(error.message);
        });
    const fence = epoch;
    return () => {
      fence.current = current + 1;
    };
  }, [workspace, role]);
  if (!['Owner', 'Admin'].includes(role))
    return (
      <section className="panel">
        <h2>Workspace API keys</h2>
        <p>Owner or Admin access is required to delegate API access.</p>
      </section>
    );
  async function command(path: string, body: unknown) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    const current = epoch.current;
    try {
      const result = await api<{ key: Key; secret?: string; secret_available: boolean }>(
        workspace,
        path,
        'POST',
        body,
      );
      if (epoch.current !== current) return;
      setSecret(result.secret ?? '');
      setMessage(
        result.secret
          ? 'Key created. Save the secret now; it is shown once.'
          : path.endsWith('/revoke')
            ? 'Key revoked. Future API requests and queued creation work will be denied.'
            : 'This command was already acknowledged. The secret cannot be recovered; rotate the listed key if needed.',
      );
      const refreshed = await api<KeyPage>(workspace, 'api-keys');
      if (epoch.current === current) {
        setObservedAt(Date.now());
        setKeys(refreshed.data);
        setAfter(refreshed.next_cursor);
      }
      if (path === 'api-keys') setName('');
    } catch (error) {
      if (epoch.current === current)
        setError(
          error instanceof Error
            ? error.message
            : 'API key command failed. Your choices remain here.',
        );
    } finally {
      if (epoch.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  async function loadOlder() {
    if (!after || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    const current = epoch.current;
    try {
      const result = await api<KeyPage>(workspace, 'api-keys?after=' + encodeURIComponent(after));
      if (epoch.current !== current) return;
      setKeys((existing) => [
        ...existing,
        ...result.data.filter((key) => !existing.some((old) => old.id === key.id)),
      ]);
      setAfter(result.next_cursor);
      setObservedAt(Date.now());
    } catch (error) {
      if (epoch.current === current)
        setError(
          error instanceof Error ? error.message : 'Older keys could not be loaded. Try again.',
        );
    } finally {
      if (epoch.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="panel api-key-panel">
      <h2>Workspace API keys</h2>
      <p>
        Keys grant only selected resource scopes in this workspace. Sending still requires approved
        content and production gates. Rotation preserves the current expiry.
      </p>
      {error && (
        <p className="alert danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="alert success" role="status">
          {message}
        </p>
      )}
      {secret && (
        <div className="key-reveal">
          <p className="alert warning">
            Secret shown once. Keep it private; it cannot be recovered.
          </p>
          <label>
            New API key secret
            <textarea readOnly value={secret} autoComplete="off" spellCheck={false} />
          </label>
          <div className="button-row">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(secret);
                  setMessage('Secret copied. Store it privately, then dismiss.');
                } catch {
                  setError('Clipboard unavailable. Select and copy the secret directly.');
                }
              }}
            >
              Copy secret
            </button>
            <button type="button" onClick={() => setSecret('')}>
              Dismiss secret
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void command('api-keys', { name, scopes, expires_in_days: days });
        }}
      >
        <fieldset disabled={busy || !!secret}>
          <legend>Delegate access</legend>
          <label>
            API key name
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Expires in days
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>
          <div className="key-scopes">
            {KEY_SCOPES.map((scope) => (
              <label className="checkbox-label" key={scope}>
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(e) =>
                    setScopes((current) =>
                      e.target.checked ? [...current, scope] : current.filter((s) => s !== scope),
                    )
                  }
                />
                {scope}
              </label>
            ))}
          </div>
          <button className="primary" disabled={!name.trim() || !scopes.length}>
            {busy ? 'Updating keys…' : 'Create scoped API key'}
          </button>
        </fieldset>
      </form>
      {keys.length ? (
        <div
          className="table-scroll"
          role="region"
          aria-label="Workspace API key list"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Scopes</th>
                <th>Expiry / status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>
                    {key.name}
                    <small className="muted">{key.prefix}…</small>
                  </td>
                  <td>{key.scopes.join(', ')}</td>
                  <td>
                    {key.revoked_at
                      ? 'Revoked'
                      : new Date(key.expires_at).getTime() <= observedAt
                        ? 'Expired'
                        : new Date(key.expires_at).toLocaleString()}
                  </td>
                  <td>
                    <div className="button-row">
                      <button
                        disabled={
                          busy ||
                          !!secret ||
                          !!key.revoked_at ||
                          new Date(key.expires_at).getTime() <= observedAt
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              'Rotate ' +
                                key.name +
                                '? The old secret will stop working immediately; expiry stays the same.',
                            )
                          )
                            void command('api-keys/' + key.id + '/rotate', {});
                        }}
                      >
                        Rotate key
                      </button>
                      <button
                        disabled={busy || !!key.revoked_at}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Revoke ' +
                                key.name +
                                '? API access and queued authorization using it will stop.',
                            )
                          )
                            void command('api-keys/' + key.id + '/revoke', {});
                        }}
                      >
                        Revoke key
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No workspace keys yet.</p>
      )}
      {after && (
        <button type="button" disabled={busy} onClick={() => void loadOlder()}>
          Load older keys
        </button>
      )}
      <p className="small muted">
        The initial workspace bearer API ceiling is 10 requests per rolling minute, shared across
        keys. Commercial 60/100 limits require an approved entitlement policy. Key management and
        safety unsubscribe do not consume that bearer quota.
      </p>
    </section>
  );
}
