'use client';
import { useEffect, useState } from 'react';
import{WebhookDeliveryHistory}from'./webhook-history';
import { WebhookEndpoints } from './webhooks';
import { EventHistory } from './events';
import { DispatchControls } from './dispatch-controls';
import { ApiKeys } from './api-keys';
import { TeamMembers } from './memberships';
import { Users, ShieldCheck, Plus, CalendarDays, AlertCircle } from 'lucide-react';
import { useResourcePage } from './paged';
import { api } from './api';
import { CsvImport } from './csv-import';
import { AudienceOrganization, type OrganizedContact } from './audience-organization';
type Contact = OrganizedContact & { subscription: string; suppressed: boolean };
export function AudiencePanel({ workspace }: { workspace: string }) {
  const contactPage = useResourcePage<Contact>(workspace, 'contacts');
  const contacts = contactPage.data,
    reload = contactPage.reload;
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONSENT BEFORE CAMPAIGNS</p>
          <h1>People, with permission.</h1>
          <p className="muted">
            Imports preserve suppression and hold contacts without verified consent evidence.
          </p>
        </div>
        <Users size={30} />
      </div>
      <p className="alert warning">
        <ShieldCheck size={18} /> Local fixtures only. Real contact imports are gated by legal,
        retention and consent review. Use reserved example.com/.test addresses.
      </p>
      {(error || contactPage.error) && (
        <p className="alert danger" role="alert">
          {error || contactPage.error}
        </p>
      )}
      <div className="two-columns">
        <CsvImport workspace={workspace} onUpdate={reload} />
        <section className="panel" data-contact-pages>
          <h2>Contacts & suppression</h2>
          {contacts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Eligibility</th>
                    <th>Safety</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.email_original}</td>
                      <td>
                        <span className={`badge ${c.suppressed ? 'danger' : 'warning'}`}>
                          {c.suppressed ? 'Suppressed' : c.subscription}
                        </span>
                      </td>
                      <td>
                        <button
                          disabled={busy || c.suppressed}
                          onClick={() =>
                            void action(async () => {
                              await api(workspace, 'contacts/' + c.id + '/suppress', 'POST', {});
                              await reload();
                            })
                          }
                        >
                          Block
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Users size={32} />
              <h3>No contacts yet.</h3>
              <p>Start with a dry run. A CSV row is not proof of permission.</p>
            </div>
          )}
          {contactPage.hasMore && (
            <button disabled={contactPage.busy} onClick={() => void contactPage.loadMore()}>
              Load older contacts
            </button>
          )}
          <p className="small muted">
            Imports never clear suppressions. Complaint and bounce blocks require separate
            authorized remediation.
          </p>
        </section>
      </div>
      <AudienceOrganization workspace={workspace} contacts={contacts} onUpdate={reload} />
    </>
  );
}
type Campaign = {
  id: string;
  name: string;
  state: string;
  intent: { artifact_hash: string; audience: { eligible: boolean; reason: string }[] };
  digest: string;
};
export function CampaignPanel({ workspace }: { workspace: string }) {
  const campaignPage = useResourcePage<Campaign>(workspace, 'campaigns');
  const revisionPage = useResourcePage<{ id: string; revision_no: number; subject: string }>(
    workspace,
    'email-revisions',
  );
  const items = campaignPage.data,
    reload = campaignPage.reload,
    revisions = revisionPage.data;
  const [name, setName] = useState(''),
    [revision, setRevision] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">REVIEW BEFORE DISTRIBUTION</p>
          <h1>Every campaign has a clear intent.</h1>
          <p className="muted">
            Frozen content, an audience snapshot and separate approval. No implicit send.
          </p>
        </div>
      </div>
      {(error || campaignPage.error || revisionPage.error) && (
        <p className="alert danger" role="alert">
          {error || campaignPage.error || revisionPage.error}
        </p>
      )}
      <form
        className="panel campaign-create"
        onSubmit={(e) => {
          e.preventDefault();
          void action(async () => {
            await api(workspace, 'campaigns', 'POST', { name, revision_id: revision });
            setName('');
          });
        }}
      >
        <label>
          Campaign name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Frozen email revision
          <select value={revision} onChange={(e) => setRevision(e.target.value)} required>
            <option value="">Select a saved checkpoint</option>
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                v{r.revision_no} · {r.subject || 'No subject'}
              </option>
            ))}
          </select>
          {revisionPage.hasMore && (
            <button
              type="button"
              disabled={revisionPage.busy}
              onClick={() => void revisionPage.loadMore()}
            >
              Load older checkpoints
            </button>
          )}
        </label>
        <button className="primary" disabled={busy || !revision}>
          <Plus size={18} /> Create campaign
        </button>
      </form>
      <div className="alert warning">
        <AlertCircle size={18} /> Scheduling and sending remain disabled until real-client,
        provider, consent and spending gates pass.
      </div>
      {items.length ? (
        items.map((c) => (
          <section className="panel campaign-card" key={c.id}>
            <div className="section-heading">
              <h2>{c.name}</h2>
              <span className="badge neutral">{c.state.replaceAll('_', ' ')}</span>
            </div>
            <div className="metric-row">
              <span>
                Snapshot <strong>{c.intent.audience.length}</strong>
              </span>
              <span>
                Eligible <strong>{c.intent.audience.filter((a) => a.eligible).length}</strong>
              </span>
              <span>
                Excluded <strong>{c.intent.audience.filter((a) => !a.eligible).length}</strong>
              </span>
            </div>
            <p className="small muted break-word">Frozen artifact {c.intent.artifact_hash}</p>
            <p className="small muted">
              Sender/provider: not configured · Tracking: off · Schedule: none
            </p>
            <div className="toolbar">
              <button
                disabled={busy || c.state !== 'draft'}
                onClick={() =>
                  void action(async () => {
                    await api(workspace, 'campaigns/' + c.id + '/submit-review', 'POST', {});
                  })
                }
              >
                Request review
              </button>
              <button
                disabled={busy || c.state === 'cancelled'}
                onClick={() =>
                  void action(async () => {
                    await api(workspace, 'campaigns/' + c.id + '/approve', 'POST', {});
                  })
                }
              >
                Check approval gates
              </button>
              <button
                disabled={busy || c.state === 'cancelled'}
                onClick={() =>
                  void action(async () => {
                    await api(workspace, 'campaigns/' + c.id + '/cancel', 'POST', {});
                  })
                }
              >
                Cancel remaining work
              </button>
            </div>
          </section>
        ))
      ) : (
        <section className="panel empty-state">
          <CalendarDays size={32} />
          <h2>No campaigns yet.</h2>
          <p>Freeze an email revision in the editor, then create a campaign intent.</p>
        </section>
      )}
      {campaignPage.hasMore && (
        <button disabled={campaignPage.busy} onClick={() => void campaignPage.loadMore()}>
          Load older campaigns
        </button>
      )}
    </>
  );
}
export function SettingsPanel({ workspace, role }: { workspace: string; role: string }) {
  const [data, setData] = useState<{
      data: { metric: string; kind: string; units: number }[];
      generation_allowance: number;
    } | null>(null),
    [error, setError] = useState('');
  const auditPage = useResourcePage<{ id: string; action: string; created_at: string }>(
    ['Owner', 'Admin'].includes(role) ? workspace : '',
    'audit',
  );
  const audit = auditPage.data;
  useEffect(() => {
    if (['Owner', 'Billing'].includes(role))
      void api<NonNullable<typeof data>>(workspace, 'usage')
        .then(setData)
        .catch((e) => setError(e.message));
  }, [workspace, role]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE CONTROL</p>
          <h1>Clear limits. Durable evidence.</h1>
          <p className="muted">
            Your role: {role}. Commercial plans and paid allowances require approval.
          </p>
        </div>
      </div>
      {(error || auditPage.error) && (
        <p className="alert danger" role="alert">
          {error || auditPage.error}
        </p>
      )}
      <div className="two-columns">
        <section className="panel">
          <h2>Usage & billing</h2>
          <p className="alert warning">
            No paid subscription or public price catalog is configured.
          </p>
          {data ? (
            <>
              <p>
                Approved local generation ceiling: <strong>{data.generation_allowance}</strong>
              </p>
              {data.data.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Posting</th>
                      <th>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((r, i) => (
                      <tr key={i}>
                        <td>{r.metric}</td>
                        <td>{r.kind}</td>
                        <td>{r.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="muted">No usage postings yet.</p>
              )}
            </>
          ) : (
            <p className="muted">Owner/Billing access is required for financial data.</p>
          )}
          <p className="small muted">
            Overages are off. Drafts and safety actions do not require an upgrade.
          </p>
        </section>
        <section className="panel">
          <h2>Audit trail</h2>
          {audit.length ? (
            <div className="audit-list">
              {audit.map((e) => (
                <div key={e.id}>
                  <strong>{e.action}</strong>
                  <time className="small muted">{new Date(e.created_at).toLocaleString()}</time>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No accessible audit events.</p>
          )}
        </section>
      </div>
      <TeamMembers workspace={workspace} role={role}/>
      <section className="panel">
        <h2>Production setup register</h2>
        <p>
          Identity/MFA, invites/SSO, realtime collaboration, asset storage, signed billing, service
          data rights, provider contracts and operational evidence remain tracked release work.
          These controls are unavailable until implemented and verified.
        </p>
        <a href="/docs">Read the current capability and release status</a>
      </section>
      {auditPage.hasMore && (
        <button disabled={auditPage.busy} onClick={() => void auditPage.loadMore()}>
          Load older audit events
        </button>
      )}
      <WebhookEndpoints workspace={workspace} role={role} />
      <WebhookDeliveryHistory workspace={workspace} role={role}/><EventHistory workspace={workspace} role={role} />
      <DispatchControls workspace={workspace} role={role} />
      <ApiKeys workspace={workspace} role={role} />
    </>
  );
}
