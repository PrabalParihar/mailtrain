'use client';
import { useEffect, useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { api } from './api';
import type { ImportRow, Mapping } from '@/domain/contact-import';
type Catalog = {
  fields: { key: string; label: string; type: string }[];
  lists: { id: string; name: string }[];
  tags: { id: string; name: string }[];
};
type Preview = {
  operation_id: string;
  preview: {
    total: number;
    valid: number;
    held: number;
    eligible: number;
    ignored_columns: string[];
    rows: ImportRow[];
    errors: ImportRow[];
    error_count: number;
    next_error_cursor: number | null;
    consent_conflicts: { lookup: string; rows: number[] }[];
  };
};
export function CsvImport({
  workspace,
  onUpdate,
}: {
  workspace: string;
  onUpdate: () => Promise<void>;
}) {
  const [csv, setCsv] = useState('email,first_name\nreader@example.com,Reader'),
    [headers, setHeaders] = useState<string[]>([]),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [mapping, setMapping] = useState<Mapping>({ email: 'email', attributes: {} }),
    [listIds, setListIds] = useState<string[]>([]),
    [tagIds, setTagIds] = useState<string[]>([]),
    [preview, setPreview] = useState<Preview | null>(null),
    [errorPage, setErrorPage] = useState<{
      rows: ImportRow[];
      total_errors: number;
      next_cursor: number | null;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const running = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const navigation = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest('a[href]') as HTMLAnchorElement | null;
      if (
        !link ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (link.target && link.target !== '_self')
      )
        return;
      const destination = new URL(link.href, location.href);
      if (destination.pathname === location.pathname && destination.search === location.search)
        return;
      if (
        !window.confirm('Leave this import? Unconfirmed CSV and mapping changes will be discarded.')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigation, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', navigation, true);
    };
  }, [dirty]);
  async function action(fn: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  function changeMapping(next: Mapping) {
    setDirty(true);
    setMapping(next);
    setPreview(null);
  }
  async function runDryRun() {
    const result = await api<Preview>(workspace, 'contact-imports', 'POST', {
      csv,
      mapping,
      list_ids: listIds,
      tag_ids: tagIds,
    });
    setPreview(result);
    setErrorPage({
      rows: result.preview.errors,
      total_errors: result.preview.error_count,
      next_cursor: result.preview.next_error_cursor,
    });
  }
  const column = (label: string, key: Exclude<keyof Mapping, 'attributes'>, required = false) => (
    <label>
      {label}
      <select
        value={mapping[key] ?? ''}
        required={required}
        onChange={(e) => changeMapping({ ...mapping, [key]: e.target.value || undefined })}
      >
        <option value="">{required ? 'Select a column' : 'Not mapped'}</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="panel csv-import">
      <h2>
        <FileUp size={20} /> CSV mapping & dry run
      </h2>
      <p className="small muted">
        New contacts stay held without verified permission. Existing attributes and blocks are
        preserved; opt-out claims are honored.
      </p>
      <div className="csv-phone-notice alert warning">
        <div>
          Bulk CSV mapping: continue on a larger screen. Current input stays in this view.
          <button
            onClick={() =>
              void action(async () => {
                await navigator.clipboard.writeText(location.href);
                setNotice('Audience link copied.');
              })
            }
          >
            Copy audience link
          </button>
        </div>
      </div>
      {error && (
        <p className="alert danger" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert success" role="status">
          {notice}
        </p>
      )}
      <fieldset className="csv-desktop-controls" disabled={busy}>
        <label>
          CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void action(async () => {
                if (file.size > 2 * 1024 * 1024) throw new Error('Choose a CSV of at most 2 MiB.');
                setCsv(await file.text());
                setDirty(true);
                setHeaders([]);
                setPreview(null);
              });
            }}
          />
        </label>
        <label>
          CSV contents
          <textarea
            className="raw-code"
            value={csv}
            rows={7}
            onChange={(e) => {
              setCsv(e.target.value);
              setDirty(true);
              setHeaders([]);
              setPreview(null);
            }}
          />
        </label>
        <button
          disabled={!csv.trim()}
          onClick={() =>
            void action(async () => {
              const [inspected, definitions] = await Promise.all([
                api<{ headers: string[]; total: number }>(
                  workspace,
                  'contact-imports/inspect',
                  'POST',
                  { csv },
                ),
                api<Catalog>(workspace, 'audience-schema'),
              ]);
              setHeaders(inspected.headers);
              setCatalog(definitions);
              setPreview(null);
              const guess = (name: string) =>
                inspected.headers.find((h) => h.toLowerCase() === name);
              setMapping({
                email: guess('email') ?? '',
                ...(guess('first_name') ? { first_name: guess('first_name') } : {}),
                attributes: {},
              });
              setNotice(inspected.total + ' rows found. Review the mapping before the dry run.');
            })
          }
        >
          Inspect CSV columns
        </button>
        {headers.length > 0 && catalog && (
          <>
            <h3>Map columns</h3>
            {column('Email column', 'email', true)}
            {column('First name column', 'first_name')}
            {column('Preferred locale column', 'preferred_locale')}
            {catalog.fields
              .filter((f) => f.key !== 'first_name')
              .map((f) => (
                <label key={f.key}>
                  {f.label} column ({f.type})
                  <select
                    value={mapping.attributes?.[f.key] ?? ''}
                    onChange={(e) => {
                      const next = { ...mapping.attributes };
                      if (e.target.value) next[f.key] = e.target.value;
                      else delete next[f.key];
                      changeMapping({ ...mapping, attributes: next });
                    }}
                  >
                    <option value="">Not mapped</option>
                    {headers.map((h) => (
                      <option value={h} key={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            <h3>Consent claims</h3>
            <p className="small muted">
              Source and proof columns record what the file claims. A subscribed claim does not
              verify opt-in.
            </p>
            {column('Consent status column', 'consent_status')}
            {column('Consent source column', 'consent_source')}
            {column('Consent timestamp column', 'consent_timestamp')}
            {column('Consent proof reference column', 'consent_proof')}
            <p className="small muted">
              Status values: pending_confirmation, subscribed or unsubscribed. Timestamps use ISO
              format with a timezone.
            </p>
            <h3>Assign organization</h3>
            {catalog.lists.map((l) => (
              <label className="checkbox-label" key={l.id}>
                <input
                  type="checkbox"
                  checked={listIds.includes(l.id)}
                  onChange={(e) => {
                    setListIds(
                      e.target.checked ? [...listIds, l.id] : listIds.filter((id) => id !== l.id),
                    );
                    setDirty(true);
                    setPreview(null);
                  }}
                />
                List: {l.name}
              </label>
            ))}
            {catalog.tags.map((t) => (
              <label className="checkbox-label" key={t.id}>
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={(e) => {
                    setTagIds(
                      e.target.checked ? [...tagIds, t.id] : tagIds.filter((id) => id !== t.id),
                    );
                    setDirty(true);
                    setPreview(null);
                  }}
                />
                Tag: {t.name}
              </label>
            ))}
            <button disabled={!mapping.email} onClick={() => void action(runDryRun)}>
              Run mapped dry run
            </button>
          </>
        )}
        {preview && (
          <>
            <div className="metric-row">
              <span>
                Total <strong>{preview.preview.total}</strong>
              </span>
              <span>
                Valid <strong>{preview.preview.valid}</strong>
              </span>
              <span>
                Opt-in granted <strong>0</strong>
              </span>
            </div>
            <p className="small muted">
              First 100 rows shown. Unmapped columns:{' '}
              {preview.preview.ignored_columns.join(', ') || 'none'}.
            </p>
            {preview.preview.consent_conflicts.length > 0 && (
              <p className="alert danger" role="alert">
                Resolve conflicting consent rows before importing this file. No rows from this file
                will be applied.
              </p>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Email / fields</th>
                    <th>Result / claimed consent</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.rows
                    .filter((r) => !r.error)
                    .map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>
                          {r.original || '—'}
                          <p className="small">
                            {Object.entries(r.attrs)
                              .map(([key, value]) => `${key}: ${value ?? 'unset'}`)
                              .join(' · ')}
                          </p>
                        </td>
                        <td>
                          {r.error ??
                            (r.consent_claim.status === 'unsubscribed'
                              ? 'Opt-out will be honored'
                              : 'Held without verified permission')}
                          <p className="small">
                            Claim: {r.consent_claim.status} ·{' '}
                            {r.consent_claim.source ?? 'No source'} · unverified
                          </p>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {errorPage && errorPage.total_errors > 0 && (
              <section className="import-errors">
                <h3>Rejected rows · {errorPage.total_errors}</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>CSV row</th>
                        <th>Email</th>
                        <th>Error / claimed consent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorPage.rows.map((row) => (
                        <tr key={row.row}>
                          <td>{row.row}</td>
                          <td>{row.original || '—'}</td>
                          <td>
                            {row.error}
                            <p className="small">Claim: {row.consent_claim.status} · unverified</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="toolbar">
                  <button
                    onClick={() =>
                      void action(async () =>
                        setErrorPage(
                          await api(
                            workspace,
                            'contact-imports/' + preview.operation_id + '/errors?cursor=0',
                          ),
                        ),
                      )
                    }
                  >
                    First error page
                  </button>
                  <button
                    disabled={errorPage.next_cursor === null}
                    onClick={() =>
                      void action(async () =>
                        setErrorPage(
                          await api(
                            workspace,
                            'contact-imports/' +
                              preview.operation_id +
                              '/errors?cursor=' +
                              errorPage.next_cursor,
                          ),
                        ),
                      )
                    }
                  >
                    Next error page
                  </button>
                </div>
              </section>
            )}
            <button
              className="primary"
              disabled={!preview.preview.valid || preview.preview.consent_conflicts.length > 0}
              onClick={() =>
                void action(async () => {
                  const counts = await api<{
                    created: number;
                    existing: number;
                    held: number;
                    processed: number;
                    unsubscribed: number;
                  }>(workspace, 'contact-imports/' + preview.operation_id + '/confirm', 'POST', {});
                  setNotice(
                    `${counts.processed} rows processed: ${counts.created} created, ${counts.existing} existing preserved, ${counts.held} held, ${counts.unsubscribed} unsubscribed. No opt-in granted.`,
                  );
                  setPreview(null);
                  await onUpdate();
                  setDirty(false);
                })
              }
            >
              Confirm mapped fixture import
            </button>
          </>
        )}
      </fieldset>
    </section>
  );
}
