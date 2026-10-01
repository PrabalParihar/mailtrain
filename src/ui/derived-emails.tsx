'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LOCALES, type EmailSpec } from '@/domain/email';
import type { Derivation } from '@/domain/derivation';
import type { emailLineage } from '@/server/emails';
import { useResourcePage } from './paged';
type Lineage = Awaited<ReturnType<typeof emailLineage>>;
type Child = { id: string; title: string; kind: 'remix'|'locale'; target_locale: string|null; source_status: string };
export function DerivedEmails({ workspace, id, sourceLocale, canEdit, busy, lineage, onCreate }: {
  workspace: string; id: string; sourceLocale: EmailSpec['locale']; canEdit: boolean; busy: boolean;
  lineage: Lineage; onCreate: (input: Derivation) => void;
}) {
  const [title, setTitle] = useState(''), [locale, setLocale] = useState<EmailSpec['locale']|''>('');
  const children = useResourcePage<Child>(workspace, 'emails/' + id + '/derivatives');
  const names = new Intl.DisplayNames(['en'], { type: 'language' });
  return <section className="panel derived-panel">
    <h2>Remixes and language drafts</h2>
    {lineage && <div className={'alert ' + (lineage.source_status === 'current' ? 'info' : 'warning')}>
      <p>Based on <Link href={'/app/emails/' + lineage.source_email_id}>{lineage.source_title}</Link>, frozen version {lineage.source_revision_no}.</p>
      <p>{lineage.source_status === 'outdated' ? 'Source changed. This draft remains intact; compare and review it again.' : lineage.source_status === 'unknown' ? 'Source freshness is unknown for this older revision. Review against a new source checkpoint.' : 'Source version is current.'}</p>
      {lineage.kind === 'locale' && <p>Manual {names.of(lineage.target_locale!)} draft. Source text was retained; translation and language review are still required. Review raw markup, direction and the legal footer explicitly.</p>}
    </div>}
    <p className="muted small">Create a separate draft from an acknowledged frozen version. The source stays intact. A language draft retains source text until you translate and review it; it does not run AI.</p>
    {canEdit && <form onSubmit={(event) => { event.preventDefault(); onCreate({ kind: 'remix', title }); }}>
      <label>New draft title<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Target language<select value={locale} onChange={(e) => setLocale(e.target.value as EmailSpec['locale']| '')}>
        <option value="">Choose a language</option>
        {LOCALES.map((value) => <option key={value} value={value} disabled={value === sourceLocale}>{names.of(value)} ({value})</option>)}
      </select></label>
      <div className="toolbar">
        <button disabled={busy || !title.trim()}>Create remix</button>
        <button type="button" disabled={busy || !title.trim() || !locale || locale === sourceLocale} onClick={() => { if (locale) onCreate({ kind: 'locale', title, locale }); }}>Create locale draft</button>
      </div>
    </form>}
    {children.error && <p role="alert" className="alert danger">{children.error}</p>}
    <div className="toolbar"><p>{children.total} derived drafts</p><button disabled={children.busy} onClick={() => void children.reload()}>Refresh derived drafts</button></div>
    {!children.loaded && !children.error && <p role="status">Loading derived drafts…</p>}
    {children.loaded && !children.total && <p className="muted">No derived draft yet.</p>}
    {children.data.map((child) => <p key={child.id}><Link href={'/app/emails/' + child.id}>{child.title}</Link> · {child.kind === 'locale' ? names.of(child.target_locale!) : 'Remix'} · {child.source_status === 'current' ? 'Source current' : child.source_status === 'outdated' ? 'Source changed' : 'Source freshness unknown'}</p>)}
    {children.hasMore && <button disabled={children.busy} onClick={() => void children.loadMore()}>Load older derived drafts</button>}
  </section>;
}
