'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  Mail,
  CalendarDays,
  Palette,
  Users,
  Send,
  Plug,
  BarChart3,
  Settings,
  ArrowUpRight,
  Plus,
  ChevronDown,
  PanelLeft,
  BookOpen,
} from 'lucide-react';
import { product } from '@/config/product';
import { Logo } from './logo';
import { useResourcePage } from './paged';
import { api, ApiError } from './api';
import { BrandPanel } from './brand';
import {SenderDomainPanel} from './sender-domain';
import { CreatePanel } from './create';
import { Editor } from './editor';
import { AudiencePanel, CampaignPanel, SettingsPanel } from './operations';
import { integrations } from '@/server/adapters';
import type { Role } from '@/domain/permissions';
import type { EmailSpec } from '@/domain/email';
const navigation = [
  ['', 'Home', Home],
  ['emails', 'Emails', Mail],
  ['campaigns', 'Campaigns', CalendarDays],
  ['brand', 'Brand', Palette],
  ['audience', 'Audience', Users],
  ['delivery', 'Delivery', Send],
  ['integrations', 'Integrations', Plug],
  ['reports', 'Reports', BarChart3],
  ['settings', 'Settings', Settings],
] as const;
type Workspace = { id: string; name: string; role: Role };
type Email = {
  id: string;
  title: string;
  doc_version: number;
  spec: EmailSpec;
  updated_at: string;
};
export function MailcraftApp({
  screen,
  local,
  clerkConfigured,
}: {
  screen: string[];
  local: boolean;
  clerkConfigured: boolean;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [workspace, setWorkspace] = useState(''),
    [actor, setActor] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [authRequired, setAuthRequired] = useState(false),
    [key, setKey] = useState(''),
    [busy, setBusy] = useState(false),
    [menu, setMenu] = useState(false);
  const router = useRouter();
  const navigationPanel=useRef<HTMLElement>(null),navigationToggle=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!menu||!window.matchMedia('(max-width: 1023px)').matches)return;
    navigationPanel.current?.querySelector<HTMLSelectElement>('select')?.focus();
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setMenu(false);navigationToggle.current?.focus();}};
    document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);
  },[menu]);
  const section = screen[0] ?? '';
  const emailPage = useResourcePage<Email>(workspace, 'emails', section);
  const emails = emailPage.data;
  async function refresh() {
    try {
      const r = await api<{ data: Workspace[];actor_id:string }>('', 'workspaces');
      if(typeof r.actor_id!=='string'||!r.actor_id)throw new Error('Verified account context is unavailable. Reload your workspace.');
      setActor(r.actor_id);
      setWorkspaces(r.data);
      const saved = localStorage.getItem('mailcraft.workspace');
      setWorkspace((prev) => prev || r.data.find((w) => w.id === saved)?.id || r.data[0]?.id || '');
      setAuthRequired(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setAuthRequired(true);
      else setError(e instanceof Error ? e.message : 'Cannot load workspaces');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, []);
  useEffect(() => {
    if (workspace) localStorage.setItem('mailcraft.workspace', workspace);
  }, [workspace]);
  const current = workspaces.find((w) => w.id === workspace);
  if (loading)
    return (
      <main id="main" className="auth-page">
        <Logo />
        <p role="status">Opening your workspace…</p>
      </main>
    );
  if (authRequired)
    return (
      <main id="main" className="auth-page">
        <Logo />
        <div className="panel auth-panel">
          <p className="eyebrow">YOUR CREATIVE WORKSPACE</p>
          <h1>Welcome to the workshop.</h1>
          <p className="muted">
            {local
              ? 'Local development uses a private access key. This is not a production identity flow.'
              : 'Sign in to access your workspace.'}
          </p>
          {error && (
            <p className="alert danger" role="alert">
              {error}
            </p>
          )}
          {local ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError('');
                try {
                  await api('', 'local-session', 'POST', { secret: key });
                  setKey('');
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Local access key
                <input
                  type="password"
                  autoComplete="current-password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                />
              </label>
              <button className="primary" disabled={busy}>
                {busy ? 'Opening…' : 'Open local workspace'} <ArrowUpRight size={18} />
              </button>
              <p className="muted small">Stored privately in .env.local on this Mac.</p>
            </form>
          ) : clerkConfigured ? (
            <Link className="button primary" href="/sign-in">
              Sign in
            </Link>
          ) : (
            <p className="alert warning">
              Identity provider setup is required. No production login is available yet.
            </p>
          )}
        </div>
        <Link href="/docs">Setup documentation</Link>
      </main>
    );
  if (!workspace)
    return (
      <main id="main" className="auth-page">
        <Logo />
        <h1>Create your first workspace</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api('', 'workspaces', 'POST', {
                name: new FormData(e.currentTarget).get('name'),
              });
              await refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Workspace name
            <input name="name" required maxLength={100} />
          </label>
          <button disabled={busy}>Create workspace</button>
        </form>
        {error && <p role="alert">{error}</p>}
      </main>
    );
  return (
    <div className="app-shell">
      <aside id="workspace-navigation" ref={navigationPanel} className={`sidebar ${menu ? 'open' : ''}`}>
        <Logo />
        <div className="workspace-picker">
          <label className="sr-only" htmlFor="workspace">
            Active brand workspace
          </label>
          <select
            id="workspace"
            value={workspace}
            onChange={(e) => {
              setWorkspace(e.target.value);
              router.push('/app');
              setMenu(false);
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <span>
            {current?.role} <ChevronDown size={12} />
          </span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(([id, label, Icon]) => (
            <Link
              key={id}
              href={'/app/' + id}
              className={section === id ? 'active' : ''}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => setMenu(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            <span className="dot" /> Development workspace
          </p>
          <Link href="/docs">
            <BookOpen size={17} /> Help & documentation
          </Link>
          <p className="small muted">{product.name} · brand system</p>
        </div>
      </aside>
      <div className="work-area">
        <header className="topbar">
          <button
            ref={navigationToggle}
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            aria-controls="workspace-navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <PanelLeft size={20} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> {navigation.find((n) => n[0] === section)?.[1] ?? 'Editor'}
          </div>
          <div className="topbar-end">
            <span className="badge neutral">
              {local ? 'Local development' : 'Production setup'}
            </span>
            <span className="avatar" aria-label={current?.role}>
              {current?.role?.[0]}
            </span>
          </div>
        </header>
        <main
          id="main"
          className={`main-content ${section === 'emails' && screen[1] && screen[1] !== 'new' ? 'editor-page' : ''}`}
        >
          {error && (
            <div className="alert danger" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() => {
                  setError('');
                  void refresh();
                }}
              >
                Retry
              </button>
            </div>
          )}
          {section === '' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSHOP</p>
                  <h1>Make something worth opening.</h1>
                  <p className="muted">
                    Continue a story, refine your brand, or start with a fresh page.
                  </p>
                </div>
                <Link className="button primary" href="/app/emails/new">
                  <Plus size={18} /> Create email
                </Link>
              </div>
              <div className="dashboard-grid">
                <section className="panel welcome-card">
                  <span className="badge neutral">A LITTLE STRUCTURE, MORE ROOM TO CREATE</span>
                  <h2>
                    Your brand. Your voice.
                    <br />
                    Your next great email.
                  </h2>
                  <p>
                    Start with a confirmed kit. Shape the copy and layout,
                    <br />
                    then freeze a version for review and export.
                  </p>
                  <Link href="/app/brand" className="button">
                    Set up your brand <ArrowUpRight size={18} />
                  </Link>
                  <div className="paper-stack" aria-hidden="true">
                    <div />
                    <div />
                    <div>
                      <span />
                      <strong>
                        A story worth
                        <br />
                        sharing.
                      </strong>
                      <i />
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <h2>Workspace readiness</h2>
                    <span className="badge warning">Setup in progress</span>
                  </div>
                  <ul className="readiness-list">
                    <li>
                      <Palette size={18} />
                      <Link href="/app/brand">Confirm your brand kit</Link>
                      <ArrowUpRight size={16} />
                    </li>
                    <li>
                      <Plug size={18} />
                      <Link href="/app/integrations">Connect your existing tools</Link>
                      <ArrowUpRight size={16} />
                    </li>
                    <li>
                      <Mail size={18} />
                      <Link href="/app/emails/new">Create your first draft</Link>
                      <ArrowUpRight size={16} />
                    </li>
                  </ul>
                  <p className="muted small">
                    Real-client testing, AI and sending require configured services and release
                    evidence.
                  </p>
                </section>
              </div>
              <section className="panel recent-panel">
                <div className="section-heading">
                  <h2>Recent emails</h2>
                  <Link href="/app/emails">
                    View all <ArrowUpRight size={16} />
                  </Link>
                </div>
                {emails.length ? (
                  <EmailRows emails={emails.slice(0, 5)} />
                ) : (
                  <div className="empty-state">
                    <Mail size={32} />
                    <h3>A fresh page is waiting.</h3>
                    <p>Your saved emails will appear here.</p>
                    <Link href="/app/emails/new">
                      Create an email <ArrowUpRight size={16} />
                    </Link>
                  </div>
                )}
              </section>
              <div className="dashboard-stats">
                <div>
                  <span>Saved drafts</span>
                  <strong>
                    {emailPage.loaded
                      ? emailPage.total
                      : emailPage.error
                        ? 'Unavailable'
                        : 'Loading…'}
                  </strong>
                </div>
                <div>
                  <span>Connected ESPs</span>
                  <strong>0</strong>
                </div>
                <div>
                  <span>Provider-accepted sends</span>
                  <strong>0</strong>
                </div>
                <div>
                  <span>Real-client evidence</span>
                  <strong>Unavailable</strong>
                </div>
              </div>
            </>
          )}
          {section === 'brand' && <BrandPanel key={workspace} workspace={workspace} />}
          {section === 'emails' && !screen[1] && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">THE EMAIL LIBRARY</p>
                  <h1>Your stories, in progress.</h1>
                  <p className="muted">
                    Every draft belongs to this workspace and keeps its own version history.
                  </p>
                </div>
                <Link className="button primary" href="/app/emails/new">
                  <Plus size={18} /> Create email
                </Link>
              </div>
              <div className="panel">
                {emailPage.error && (
                  <p className="alert danger" role="alert">
                    {emailPage.error}
                  </p>
                )}
                {emails.length ? (
                  <EmailRows emails={emails} />
                ) : (
                  <div className="empty-state">
                    <Mail size={36} />
                    <h2>Begin with a blank page.</h2>
                    <p>Confirm a brand kit, then create an editable email.</p>
                    <Link className="button primary" href="/app/emails/new">
                      Create email
                    </Link>
                  </div>
                )}
                {emailPage.hasMore && (
                  <button disabled={emailPage.busy} onClick={() => void emailPage.loadMore()}>
                    Load older emails
                  </button>
                )}
              </div>
            </>
          )}
          {section === 'emails' && screen[1] === 'new' && (
            <CreatePanel key={workspace} workspace={workspace} />
          )}
          {section === 'emails' && screen[1] && screen[1] !== 'new' && (
            <Editor
              key={JSON.stringify([workspace,actor,screen[1]])}
              workspace={workspace}
              id={screen[1]}
              actor={actor}
              role={current?.role ?? 'Viewer'}
            />
          )}
          {section === 'audience' && <AudiencePanel key={workspace+':'+(current?.role??'Viewer')} workspace={workspace} role={current?.role??'Viewer'} />}
          {section === 'campaigns' && <CampaignPanel key={JSON.stringify([workspace,actor,current?.role??'Viewer'])} workspace={workspace} role={current?.role??'Viewer'} actor={actor} />}
          {section === 'settings' && (
            <SettingsPanel key={workspace} workspace={workspace} role={current?.role ?? ''} />
          )}
          {section === 'integrations' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR CONNECTED TOOLS</p>
                  <h1>A clear handoff.</h1>
                  <p className="muted">
                    Availability is verified per account and destination. Exporting a draft never
                    sends it.
                  </p>
                </div>
              </div>
              <div className="integration-grid">
                {integrations.map((i) => (
                  <article className="panel integration-card" key={i.id}>
                    <div className="integration-icon">{i.name[0]}</div>
                    <h2>{i.name}</h2>
                    <span className="badge neutral">
                      {i.kind} · {i.status.replaceAll('_', ' ')}
                    </span>
                    <p>{i.object}</p>
                    <p className="muted small">{i.gate}</p>
                    <button disabled>Account setup required</button>
                  </article>
                ))}
              </div>
            </>
          )}
          {section === 'delivery' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">PERMISSION-BASED DELIVERY</p>
                  <h1>Sending starts with trust.</h1>
                  <p className="muted">
                    Verify a provider-bound sender, consent, budget and the exact artifact before
                    dispatch.
                  </p>
                </div>
              </div>
              <div className="panel">
                <h2>No sending provider is active.</h2>
                <p>
                  No DNS verification, provider acceptance or delivery is claimed. Domain
                  verification and signed provider feedback need account setup and conformance
                  evidence.
                </p>
                <Link className="button" href="/app/integrations">
                  View provider requirements <ArrowUpRight size={18} />
                </Link>
              </div>
              <SenderDomainPanel workspace={workspace} actor={actor} role={current?.role??'Viewer'}/>
            </>
          )}
          {section === 'reports' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">EVIDENCE, NOT ASSUMPTIONS</p>
                  <h1>Know what actually happened.</h1>
                </div>
              </div>
              <div className="panel empty-state">
                <BarChart3 size={36} />
                <h2>No delivery events to report.</h2>
                <p>
                  Provider acceptance and delivery are separate. Opens are approximate technical
                  observations, not verified human intent.
                </p>
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>{product.name} · On-brand emails, ready for review.</span>
          <Link href="/status">Service status</Link>
        </footer>
      </div>
    </div>
  );
}
function EmailRows({ emails }: { emails: Email[] }) {
  return (
    <div className="email-rows">
      {emails.map((e) => (
        <Link href={'/app/emails/' + e.id} key={e.id}>
          <div className="document-icon">
            <Mail size={20} />
          </div>
          <div>
            <strong>{e.title}</strong>
            <span>{e.spec.subject || 'Subject not added yet'}</span>
          </div>
          <span className="badge neutral">Saved · v{e.doc_version}</span>
          <time dateTime={e.updated_at}>{new Date(e.updated_at).toLocaleDateString()}</time>
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </div>
  );
}
