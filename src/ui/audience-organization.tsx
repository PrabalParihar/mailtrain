'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { SegmentEditor } from './segment-editor';
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
export function AudienceOrganization({
  workspace,
  role,
  contacts,
  onUpdate,
}: {
  workspace: string;
  role: string;
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
                <fieldset disabled={busy || !['Owner', 'Admin'].includes(role)}>
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
              <fieldset disabled={busy || !['Owner', 'Admin'].includes(role)}>
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
          <SegmentEditor workspace={workspace} role={role} catalog={catalog} onCatalogUpdate={reload} />
        </>
      )}
    </>
  );
}
