'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { Rule } from '@/domain/segments';
export type OrganizedContact = {
  id: string;
  email_original: string;
  attrs: Record<string, string | number | boolean>;
  profile_version: number;
  preferred_locale: string;
  list_ids: string[];
  tag_ids: string[];
};
type Named = { id: string; name: string };
type Field = { key: string; label: string; type: 'string' | 'number' | 'boolean' | 'date' };
type Catalog = {
  fields: Field[];
  lists: Named[];
  tags: Named[];
  segments: (Named & { current_version: number })[];
  engagement_status: string;
};
type Condition = {
  kind: 'attribute' | 'list' | 'tag' | 'engagement';
  field: string;
  op: string;
  value: string;
};
type Selection = {
  evaluated_at: string;
  matched_count: number;
  eligible_count: number;
  excluded_count: number;
  segment_version: number;
};
const initialCondition: Condition = {
  kind: 'attribute',
  field: 'first_name',
  op: 'exists',
  value: '',
};
export function AudienceOrganization({
  workspace,
  contacts,
  onUpdate,
}: {
  workspace: string;
  contacts: OrganizedContact[];
  onUpdate: () => Promise<void>;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [definitionKind, setDefinitionKind] = useState('tags'),
    [definitionName, setDefinitionName] = useState(''),
    [fieldKey, setFieldKey] = useState(''),
    [fieldType, setFieldType] = useState('string');
  const [contactId, setContactId] = useState(''),
    [contactVersion, setContactVersion] = useState(0),
    [values, setValues] = useState<Record<string, string>>({}),
    [lists, setLists] = useState<string[]>([]),
    [tags, setTags] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([{ ...initialCondition }]),
    [combine, setCombine] = useState<'all' | 'any'>('all'),
    [segmentName, setSegmentName] = useState(''),
    [segmentId, setSegmentId] = useState(''),
    [segmentVersion, setSegmentVersion] = useState(0),
    [selection, setSelection] = useState<Selection | null>(null),
    [snapshot, setSnapshot] = useState<{
      id: string;
      digest: string;
      matched_count: number;
      eligible_count: number;
      segment_version: number;
    } | null>(null);
  const contact = contacts.find((c) => c.id === contactId);
  const reload = useCallback(
    async () => setCatalog(await api<Catalog>(workspace, 'audience-schema')),
    [workspace],
  );
  useEffect(() => {
    let active = true;
    void api<Catalog>(workspace, 'audience-schema')
      .then((r) => {
        if (active) setCatalog(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [workspace]);
  function chooseContact(id: string) {
    const chosen = contacts.find((c) => c.id === id);
    installContact(chosen);
  }
  function installContact(chosen?: OrganizedContact) {
    const id = chosen?.id ?? '';
    setContactId(id);
    setContactVersion(chosen?.profile_version ?? 0);
    setValues(
      Object.fromEntries(Object.entries(chosen?.attrs ?? {}).map(([k, v]) => [k, String(v)])),
    );
    setLists(chosen?.list_ids ?? []);
    setTags(chosen?.tag_ids ?? []);
  }
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
  function rule(): Rule {
    return {
      kind: combine,
      children: conditions.map((c): Rule => {
        if (c.kind === 'tag' || c.kind === 'list')
          return { kind: c.kind, id: c.field, op: c.op as 'in' | 'not_in' };
        if (c.kind === 'engagement')
          return {
            kind: c.kind,
            event: c.field as 'opened' | 'clicked' | 'delivered',
            op: c.op as 'observed' | 'not_observed',
            within_days: Number(c.value),
          };
        const field = catalog?.fields.find((f) => f.key === c.field);
        if (['exists', 'not_exists'].includes(c.op))
          return { kind: 'attribute', field: c.field, op: c.op as 'exists' | 'not_exists' };
        if (!c.value.trim() && field?.type !== 'string')
          throw new Error('Enter a comparison value.');
        const value =
          field?.type === 'number'
            ? Number(c.value)
            : field?.type === 'boolean'
              ? c.value === 'true'
              : c.value;
        return { kind: 'attribute', field: c.field, op: c.op as 'eq', value };
      }),
    };
  }
  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  async function loadSegment(id: string) {
    const r = await api<{ segment: { rule: Rule; current_version: number; name: string } }>(
      workspace,
      'segments/' + id,
    );
    const current = r.segment.rule,
      leaves = 'children' in current ? current.children : [current];
    if (leaves.some((r) => 'children' in r))
      throw new Error(
        'This segment contains nested groups. Its saved rules are preserved; use the API to edit this advanced selection.',
      );
    setConditions(
      leaves.map((r): Condition => {
        if ('children' in r) throw new Error('Nested groups');
        if (r.kind === 'attribute')
          return {
            kind: r.kind,
            field: r.field,
            op: r.op,
            value: r.value === undefined ? '' : String(r.value),
          };
        if (r.kind === 'engagement')
          return { kind: r.kind, field: r.event, op: r.op, value: String(r.within_days) };
        return { kind: r.kind, field: r.id, op: r.op, value: '' };
      }),
    );
    setCombine('children' in current ? current.kind : 'all');
    setSegmentId(id);
    setSegmentName(r.segment.name);
    setSegmentVersion(r.segment.current_version);
    setSelection(null);
    setSnapshot(null);
  }
  return (
    <>
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
      {!catalog ? (
        <section className="panel">
          <p>Loading audience organization…</p>
          <button disabled={busy} onClick={() => void action(reload)}>
            Retry audience setup
          </button>
        </section>
      ) : (
        <>
          <div className="two-columns">
            <section className="panel">
              <h2>Lists, tags & custom fields</h2>
              <p className="small muted">
                Organize contacts without changing their permission to receive mail. Lists require
                confirmed opt-in.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    await api(
                      workspace,
                      definitionKind,
                      'POST',
                      definitionKind === 'contact-fields'
                        ? { key: fieldKey, label: definitionName, type: fieldType }
                        : { name: definitionName },
                    );
                    setDefinitionName('');
                    setFieldKey('');
                    await reload();
                    setNotice('Audience definition created.');
                  });
                }}
              >
                <fieldset disabled={busy}>
                  <label>
                    Definition type
                    <select
                      value={definitionKind}
                      onChange={(e) => setDefinitionKind(e.target.value)}
                    >
                      <option value="tags">Tag</option>
                      <option value="lists">List</option>
                      <option value="contact-fields">Custom field</option>
                    </select>
                  </label>
                  <label>
                    Definition name
                    <input
                      value={definitionName}
                      onChange={(e) => setDefinitionName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </label>
                  {definitionKind === 'contact-fields' && (
                    <>
                      <label>
                        Field key
                        <input
                          value={fieldKey}
                          onChange={(e) => setFieldKey(e.target.value)}
                          pattern="[a-z][a-z0-9_]{0,47}"
                          placeholder="reader_score"
                          required
                        />
                      </label>
                      <label>
                        Field type
                        <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                          <option value="string">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Yes/no</option>
                          <option value="date">Date</option>
                        </select>
                      </label>
                    </>
                  )}
                  <button>Create definition</button>
                </fieldset>
              </form>
              <p className="small muted">
                {catalog.lists.length} lists · {catalog.tags.length} tags · {catalog.fields.length}{' '}
                fields
              </p>
            </section>
            <section className="panel">
              <h2>Contact organization</h2>
              <fieldset disabled={busy}>
                <label>
                  Contact to organize
                  <select value={contactId} onChange={(e) => chooseContact(e.target.value)}>
                    <option value="">Select a contact</option>
                    {contacts.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.email_original}
                      </option>
                    ))}
                  </select>
                </label>
                {contact ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action(async () => {
                        const attrs = Object.fromEntries(
                          catalog.fields.map((f) => [
                            f.key,
                            !values[f.key]
                              ? null
                              : f.type === 'number'
                                ? Number(values[f.key])
                                : f.type === 'boolean'
                                  ? values[f.key] === 'true'
                                  : values[f.key],
                          ]),
                        );
                        const saved = await api<{ contact: OrganizedContact }>(
                          workspace,
                          'contacts/' + contact.id + '/profile',
                          'PATCH',
                          {
                            expected_version: contactVersion,
                            attrs,
                            list_ids: lists,
                            tag_ids: tags,
                          },
                        );
                        setContactVersion(saved.contact.profile_version);
                        await onUpdate();
                        setSelection(null);
                        setNotice(
                          'Contact organization saved. Permission and blocks are preserved.',
                        );
                      });
                    }}
                  >
                    {catalog.fields.map((f) => (
                      <label key={f.key}>
                        {f.label}
                        {f.type === 'boolean' ? (
                          <select
                            value={values[f.key] ?? ''}
                            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                          >
                            <option value="">Unset</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <input
                            type={
                              f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'
                            }
                            step={f.type === 'number' ? 'any' : undefined}
                            value={values[f.key] ?? ''}
                            maxLength={2000}
                            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                          />
                        )}
                      </label>
                    ))}
                    <p>Lists</p>
                    {catalog.lists.length ? (
                      catalog.lists.map((l) => (
                        <label className="checkbox-label" key={l.id}>
                          <input
                            type="checkbox"
                            checked={lists.includes(l.id)}
                            onChange={(e) =>
                              setLists(
                                e.target.checked
                                  ? [...lists, l.id]
                                  : lists.filter((id) => id !== l.id),
                              )
                            }
                          />
                          {l.name}
                        </label>
                      ))
                    ) : (
                      <p className="small muted">Create a list to organize this contact.</p>
                    )}
                    <p>Tags</p>
                    {catalog.tags.length ? (
                      catalog.tags.map((t) => (
                        <label className="checkbox-label" key={t.id}>
                          <input
                            type="checkbox"
                            checked={tags.includes(t.id)}
                            onChange={(e) =>
                              setTags(
                                e.target.checked
                                  ? [...tags, t.id]
                                  : tags.filter((id) => id !== t.id),
                              )
                            }
                          />
                          {t.name}
                        </label>
                      ))
                    ) : (
                      <p className="small muted">Create a tag to label this contact.</p>
                    )}
                    <div className="toolbar">
                      <button>Save contact organization</button>
                      <button
                        type="button"
                        onClick={() =>
                          void action(async () => {
                            const latest = await api<{ data: OrganizedContact[] }>(
                              workspace,
                              'contacts',
                            );
                            installContact(latest.data.find((c) => c.id === contactId));
                            await onUpdate();
                            setNotice('Latest contact reloaded.');
                          })
                        }
                      >
                        Reload contact
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="small muted">
                    Import contacts, then select one to update its fields and labels.
                  </p>
                )}
              </fieldset>
            </section>
          </div>
          <section className="panel audience-segments">
            <h2>Segments & frozen selections</h2>
            <p className="muted">
              Preview who matches now. Eligible counts also respect current permission and blocks.
            </p>
            <fieldset disabled={busy}>
              <label>
                Saved segment
                <select
                  value={segmentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) void action(() => loadSegment(id));
                    else {
                      setSegmentId('');
                      setSegmentVersion(0);
                      setSegmentName('');
                      setConditions([{ ...initialCondition }]);
                      setSelection(null);
                      setSnapshot(null);
                    }
                  }}
                >
                  <option value="">New segment</option>
                  {catalog.segments.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name} · v{s.current_version}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Segment name
                <input
                  value={segmentName}
                  readOnly={!!segmentId}
                  onChange={(e) => setSegmentName(e.target.value)}
                  maxLength={100}
                />
              </label>
              <label>
                Match
                <select
                  value={combine}
                  onChange={(e) => setCombine(e.target.value as 'all' | 'any')}
                >
                  <option value="all">All conditions</option>
                  <option value="any">Any condition</option>
                </select>
              </label>
              {conditions.map((c, i) => {
                const field = catalog.fields.find((f) => f.key === c.field),
                  related = c.kind === 'tag' ? catalog.tags : catalog.lists;
                return (
                  <div className="segment-condition" key={i}>
                    <label>
                      Condition {i + 1} type
                      <select
                        value={c.kind}
                        onChange={(e) => {
                          const kind = e.target.value as Condition['kind'];
                          updateCondition(i, {
                            kind,
                            field:
                              kind === 'attribute'
                                ? (catalog.fields[0]?.key ?? 'first_name')
                                : kind === 'engagement'
                                  ? 'clicked'
                                  : ((kind === 'tag' ? catalog.tags : catalog.lists)[0]?.id ?? ''),
                            op:
                              kind === 'attribute'
                                ? 'exists'
                                : kind === 'engagement'
                                  ? 'observed'
                                  : 'in',
                            value: kind === 'engagement' ? '30' : '',
                          });
                        }}
                      >
                        <option value="attribute">Custom field</option>
                        <option value="tag">Tag</option>
                        <option value="list">List</option>
                        <option value="engagement">Observed engagement</option>
                      </select>
                    </label>
                    <label>
                      Condition {i + 1} field
                      <select
                        value={c.field}
                        onChange={(e) =>
                          updateCondition(i, {
                            field: e.target.value,
                            op: c.kind === 'attribute' ? 'exists' : c.op,
                            value: c.kind === 'attribute' ? '' : c.value,
                          })
                        }
                      >
                        {c.kind === 'attribute' ? (
                          catalog.fields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))
                        ) : c.kind === 'engagement' ? (
                          ['clicked', 'opened', 'delivered'].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="">Select {c.kind}</option>
                            {related.map((r) => (
                              <option value={r.id} key={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </label>
                    <label>
                      Condition {i + 1} comparison
                      <select
                        value={c.op}
                        onChange={(e) =>
                          updateCondition(i, {
                            op: e.target.value,
                            value: field?.type === 'boolean' && !c.value ? 'false' : c.value,
                          })
                        }
                      >
                        {(c.kind === 'attribute'
                          ? [
                              'exists',
                              'not_exists',
                              'eq',
                              'neq',
                              ...(field?.type === 'string' ? ['contains'] : []),
                              ...(['number', 'date'].includes(field?.type ?? '')
                                ? ['gt', 'gte', 'lt', 'lte']
                                : []),
                            ]
                          : c.kind === 'engagement'
                            ? ['observed', 'not_observed']
                            : ['in', 'not_in']
                        ).map((op) => (
                          <option value={op} key={op}>
                            {
                              {
                                exists: 'Has a value',
                                not_exists: 'Has no value',
                                eq: 'Equals',
                                neq: 'Does not equal',
                                contains: 'Contains',
                                gt: 'Greater than',
                                gte: 'At least',
                                lt: 'Less than',
                                lte: 'At most',
                                observed: 'Was observed',
                                not_observed: 'Was not observed',
                                in: 'Is included',
                                not_in: 'Is not included',
                              }[op]
                            }
                          </option>
                        ))}
                      </select>
                    </label>
                    {!['exists', 'not_exists', 'in', 'not_in'].includes(c.op) && (
                      <label>
                        Condition {i + 1} {c.kind === 'engagement' ? 'days' : 'value'}
                        {field?.type === 'boolean' && c.kind === 'attribute' ? (
                          <select
                            value={c.value || 'false'}
                            onChange={(e) => updateCondition(i, { value: e.target.value })}
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <input
                            type={
                              c.kind === 'engagement' || field?.type === 'number'
                                ? 'number'
                                : field?.type === 'date'
                                  ? 'date'
                                  : 'text'
                            }
                            value={c.value}
                            onChange={(e) => updateCondition(i, { value: e.target.value })}
                          />
                        )}
                      </label>
                    )}
                    <button
                      disabled={conditions.length === 1}
                      onClick={() => setConditions(conditions.filter((_, index) => index !== i))}
                    >
                      Remove condition {i + 1}
                    </button>
                  </div>
                );
              })}
              <div className="toolbar">
                <button
                  disabled={conditions.length >= 20}
                  onClick={() => setConditions([...conditions, { ...initialCondition }])}
                >
                  Add condition
                </button>
                <button
                  className="primary"
                  disabled={!segmentName.trim()}
                  onClick={() =>
                    void action(async () => {
                      const r = await api<{ segment: Named & { current_version: number } }>(
                        workspace,
                        segmentId ? 'segments/' + segmentId + '/versions' : 'segments',
                        'POST',
                        segmentId
                          ? { expected_version: segmentVersion, rule: rule() }
                          : { name: segmentName, rule: rule() },
                      );
                      setSegmentId(r.segment.id);
                      setSegmentVersion(r.segment.current_version);
                      setSelection(null);
                      setSnapshot(null);
                      await reload();
                      setNotice('Segment version saved.');
                    })
                  }
                >
                  {segmentId ? 'Save new segment version' : 'Create segment'}
                </button>
                <button
                  disabled={!segmentId}
                  onClick={() =>
                    void action(async () => {
                      setSelection(
                        (
                          await api<{ preview: Selection }>(
                            workspace,
                            'segments/' + segmentId + '/preview',
                            'POST',
                            { expected_version: segmentVersion },
                          )
                        ).preview,
                      );
                    })
                  }
                >
                  Preview saved segment
                </button>
                <button
                  disabled={!segmentId}
                  onClick={() =>
                    void action(async () => {
                      setSnapshot(
                        (
                          await api<{ snapshot: NonNullable<typeof snapshot> }>(
                            workspace,
                            'segments/' + segmentId + '/snapshots',
                            'POST',
                            { expected_version: segmentVersion },
                          )
                        ).snapshot,
                      );
                    })
                  }
                >
                  Freeze saved selection
                </button>
              </div>
            </fieldset>
            <p className="small muted">
              {catalog.engagement_status} Preview and freeze use the saved version; save changes
              first.
            </p>
            {selection && (
              <div role="status">
                <p>
                  Version {selection.segment_version} evaluated{' '}
                  {new Date(selection.evaluated_at).toLocaleString()}
                </p>
                <div className="metric-row">
                  <span>
                    Matched <strong>{selection.matched_count}</strong>
                  </span>
                  <span>
                    Eligible <strong>{selection.eligible_count}</strong>
                  </span>
                  <span>
                    Excluded <strong>{selection.excluded_count}</strong>
                  </span>
                </div>
              </div>
            )}
            {snapshot && (
              <div className="alert success" role="status">
                <div>
                  <strong>Selection frozen · v{snapshot.segment_version}</strong>
                  <p>
                    {snapshot.matched_count} matched · {snapshot.eligible_count} eligible. Current
                    permission must be checked again before dispatch.
                  </p>
                  <p className="small break-word">Digest {snapshot.digest}</p>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
