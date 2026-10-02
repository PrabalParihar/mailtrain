'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Trash2,
  Plus,
  Monitor,
  Smartphone,
  Undo2,
  History,
  ScanLine,
  Download,
  Code2,
  Sparkles,
  FileCheck,
  Copy,
  Save,
} from 'lucide-react';
import { useResourcePage } from './paged';
import { api, ApiError, poll } from './api';
import type { Role } from '@/domain/permissions';
import { allowed } from '@/domain/permissions';
import type { EmailSpec, Block, Finding } from '@/domain/email';
import { DerivedEmails } from './derived-emails';
import {EmailUTM}from'./email-utm';
import{assertEmailUTMTargets,trackingFingerprint,copyProposalWithCurrentUTM}from'@/domain/email-utm';
import type{UTMParameterData}from'@/domain/utm';
import { derivationSlot, pendingDerivation, rememberDerivation, acknowledgeDerivation } from './derivation-receipt';
import type { emailLineage } from '@/server/emails';
type Doc = { id: string; title: string; doc_version: number; spec: EmailSpec; lineage?: Awaited<ReturnType<typeof emailLineage>> };
type Revision = { id: string; revision_no: number; artifact_hash: string; subject: string };
type Anchor = { epoch: number; version: number; spec: string };
type Frozen = Revision & { anchor: Anchor };
type Report = {
  state: string;
  artifact_hash: string;
  rule_set_version: string;
  findings: Finding[];
};
export function Editor({ workspace, id, role }: { workspace: string; id: string; role: Role }) {
  const editRole = allowed(role, 'edit');
  const router = useRouter(),
    [doc, setDoc] = useState<Doc | null>(null),
    [status, setStatus] = useState('Loading'),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(''),
    [html, setHtml] = useState(''),
    [text, setText] = useState(''),
    [view, setView] = useState<'canvas' | 'code' | 'text'>('canvas'),
    [mobile, setMobile] = useState(false),
    [showHistory, setShowHistory] = useState(false),
    [revision, setRevision] = useState<Frozen | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [busy, setBusy] = useState(''),
    [conflict, setConflict] = useState<Doc | null>(null),
    [aiPrompt, setAiPrompt] = useState(''),
    [proposal, setProposal] = useState<{
      spec: EmailSpec;
      review_notes: string[];
      base: number;
      anchor: Anchor;
    } | null>(null),
    [addType, setAddType] = useState<Block['type']>('text'),
    [undoCount, setUndoCount] = useState(0),
    [renderEpoch, setRenderEpoch] = useState(0);
  const historyPage = useResourcePage<Revision>(workspace, 'email-revisions?email_id=' + id);
  const history = historyPage.data;
  const epoch = useRef(0),
    busyRef = useRef(''),
    editorActive = useRef(false),
    exportController = useRef<AbortController | null>(null);
  const writable = editRole && !['raw', 'restore', 'reload', 'fork'].includes(busy);
  const live = useRef<Doc | null>(null),
    ack = useRef(''),
    dirtyAt = useRef(0),
    lastEdit = useRef(0),
    saving = useRef<Promise<boolean> | null>(null),
    conflictRef = useRef(false),
    undo = useRef<EmailSpec[]>([]),
    storage = 'mailcraft.draft.' + workspace + '.' + id;
  function anchor(): Anchor {
    return {
      epoch: epoch.current,
      version: live.current!.doc_version,
      spec: JSON.stringify(live.current!.spec),
    };
  }
  function matches(a: Anchor) {
    return (
      editorActive.current && !!live.current &&
      a.epoch === epoch.current &&
      a.version === live.current.doc_version &&
      a.spec === JSON.stringify(live.current.spec)
    );
  }
  function install(d: Doc) {
    epoch.current++;
    setRenderEpoch(epoch.current);
    live.current = d;
    setDoc(d);
    ack.current = JSON.stringify(d.spec);
    dirtyAt.current = 0;
    setStatus('Saved · v' + d.doc_version);
    setSelected((prev) => prev || d.spec.sections[0]?.id || '');
  }
  async function reload() {
    const r = await api<{ email: Doc }>(workspace, 'emails/' + id);
    install(r.email);
    setConflict(null);
    conflictRef.current = false;
    setError('');
    localStorage.removeItem(storage);
  }
  useEffect(() => {
    let mounted = true;
    editorActive.current = true;
    void api<{ email: Doc }>(workspace, 'emails/' + id)
      .then((r) => {
        if (!mounted) return;
        install(r.email);
        const backup = localStorage.getItem(storage);
        if (backup && editRole) {
          try {
            const local = JSON.parse(backup) as Doc;
            if (JSON.stringify(local.spec) !== JSON.stringify(r.email.spec)) {
              live.current = { ...r.email, spec: local.spec };
              setDoc(live.current);
              dirtyAt.current = Date.now();
              lastEdit.current = Date.now();
              if (local.doc_version !== r.email.doc_version) {
                conflictRef.current = true;
                setConflict(r.email);
                setStatus('Conflict · local work preserved');
              } else setStatus('Recovered local work · unsaved');
            }
          } catch {
            setError('Local recovery data could not be parsed; the server draft is intact.');
          }
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      mounted = false;
      editorActive.current = false;
      exportController.current?.abort();
    };
  }, [workspace, id, storage, editRole]);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  async function flush(): Promise<boolean> {
    if (!editRole) return !dirtyAt.current;
    if (saving.current) return saving.current;
    if (!live.current || JSON.stringify(live.current.spec) === ack.current) return true;
    if (conflictRef.current) return false;
    if (!navigator.onLine) {
      setStatus('Offline · local only');
      return false;
    }
    const snapshot = structuredClone(live.current);
    setStatus('Saving…');
    const task = (async () => {
      try {
        const r = await api<{ email: Doc }>(
          workspace,
          'emails/' + id + '/draft',
          'PATCH',
          { spec: snapshot.spec },
          snapshot.doc_version,
        );
        ack.current = JSON.stringify(snapshot.spec);
        if (live.current) {
          live.current = { ...live.current, doc_version: r.email.doc_version, lineage: r.email.lineage };
          setDoc({ ...live.current });
          if (JSON.stringify(live.current.spec) === ack.current) {
            dirtyAt.current = 0;
            localStorage.removeItem(storage);
            setStatus('Saved · v' + r.email.doc_version);
          } else {
            dirtyAt.current = Date.now();
            localStorage.setItem(storage, JSON.stringify(live.current));
            setStatus('Unsaved changes');
          }
        }
        setError('');
        return true;
      } catch (e) {
        setError((e as Error).message);
        if (e instanceof ApiError && e.status === 412) {
          conflictRef.current = true;
          setStatus('Conflict · local work preserved');
          const server = await api<{ email: Doc }>(workspace, 'emails/' + id);
          setConflict(server.email);
        } else setStatus(navigator.onLine ? 'Save failed · local only' : 'Offline · local only');
        return false;
      } finally {
        saving.current = null;
      }
    })();
    saving.current = task;
    return task;
  }
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        dirtyAt.current &&
        (Date.now() - lastEdit.current > 750 || Date.now() - dirtyAt.current >= 4000)
      )
        void flushRef.current();
    }, 250);
    const before = (e: BeforeUnloadEvent) => {
      if (dirtyAt.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const online = async () => {
      if (!live.current) return;
      try {
        const r = await api<{ email: Doc }>(workspace, 'emails/' + id);
        if (r.email.doc_version !== live.current.doc_version) {
          setConflict(r.email);
          conflictRef.current = true;
          setStatus('Conflict · local work preserved');
        } else {
          live.current = { ...live.current, lineage: r.email.lineage };
          setDoc({ ...live.current });
          void flushRef.current();
        }
      } catch {
        setStatus('Offline · local only');
      }
    };
    window.addEventListener('beforeunload', before);
    window.addEventListener('online', online);
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('online', online);
    };
  }, [workspace, id]);
  useEffect(() => {
    if (!doc) return;
    let active = true;
    const timer = setTimeout(() => {
      void api<{ artifact: { html: string; text: string } }>(
        workspace,
        'emails/' + id + '/preview',
        'POST',
        { spec: doc.spec },
      )
        .then((r) => {
          if (active) {
            setHtml(r.artifact.html);
            setText(r.artifact.text);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [doc, workspace, id]);
  function update(spec: EmailSpec) {
    if (
      !editRole ||
      !live.current ||
      ['raw', 'restore', 'reload', 'fork'].includes(busyRef.current)
    )
      return;
    epoch.current++;
    exportController.current?.abort();
    setRenderEpoch(epoch.current);
    undo.current = [...undo.current.slice(-49), structuredClone(live.current.spec)];
    setUndoCount(undo.current.length);
    live.current = { ...live.current, spec };
    setDoc({ ...live.current });
    if (!dirtyAt.current) dirtyAt.current = Date.now();
    lastEdit.current = Date.now();
    try{localStorage.setItem(storage, JSON.stringify(live.current));}catch{setError('Local draft recovery is unavailable. Keep this tab open until the draft is saved.');}
    setStatus(navigator.onLine ? 'Unsaved changes' : 'Offline · local only');
    setReport(null);
    setRevision(null);
  }
  function applyUTM(policy:UTMParameterData|undefined,expected:string):string|null{
    if(!editorActive.current||!live.current||!editRole||busyRef.current||conflictRef.current)return 'Resolve the current draft action or conflict before applying UTM. Your settings are retained.';
    if(trackingFingerprint(live.current.spec.tracking)!==expected)return 'The current UTM policy changed. Reload UTM settings before applying your retained values.';
    const spec={...live.current.spec};if(policy)spec.tracking=structuredClone(policy);else delete spec.tracking;
    try{assertEmailUTMTargets(spec);}catch(error){return error instanceof Error?error.message:'These links need correction before applying UTM.';}
    if(trackingFingerprint(policy)!==trackingFingerprint(live.current.spec.tracking))update(spec);
    return null;
  }
  const changeBlock = (value: Block) => {
    if (doc)
      update({
        ...doc.spec,
        sections: doc.spec.sections.map((b) => (b.id === value.id ? value : b)),
      });
  };
  async function freeze() {
    if (!(await flush())) {
      return null;
    }
    if (dirtyAt.current) {
      setError('Finish the current edits before freezing a revision.');
      return null;
    }
    const current = live.current!;
    const origin = anchor();
    const r = await api<{ revision: Revision }>(
      workspace,
      'emails/' + id + '/revisions',
      'POST',
      {},
      current.doc_version,
    );
    if (!matches(origin)) {
      setError(
        'The draft changed during freezing. The older checkpoint is in history; freeze the current draft again.',
      );
      return null;
    }
    const frozen = { ...r.revision, anchor: origin };
    setRevision(frozen);
    return frozen;
  }
  async function act(name: string, fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = name;
    setBusy(name);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = '';
      setBusy('');
    }
  }
  if (!doc)
    return (
      <div className="panel">
        <p role="status">{error || 'Opening the acknowledged draft…'}</p>
        {error && <button onClick={() => void act('reload', reload)}>Reload draft</button>}
      </div>
    );
  const block = doc.spec.sections.find((b) => b.id === selected);
  const proposalMatches =
    !!proposal &&
    proposal.anchor.epoch === renderEpoch &&
    proposal.anchor.version === doc.doc_version &&
    proposal.anchor.spec === JSON.stringify(doc.spec);
  return (
    <>
      {!editRole && (
        <p className="alert info">
          Your {role} role can view this draft. Editing, AI and exports require an editing role.
        </p>
      )}
      <div className="editor-heading">
        <div>
          <Link href="/app/emails" className="back-link">
            <ArrowLeft size={16} /> Emails
          </Link>
          <h1>{doc.title}</h1>
          <p className="small muted" role="status">
            {status} · {report ? report.state + ' checks' : 'Checks out of date'} · Not sent
          </p>
        </div>
        <div className="toolbar">
          <button
            disabled={!editRole || !!busy}
            onClick={() =>
              void act('save', async () => {
                await flush();
              })
            }
          >
            <Save size={17} /> Save
          </button>
          <button
            disabled={!editRole || !undoCount || !!busy}
            onClick={() => {
              const previous = undo.current.pop();
              if (previous) {
                const remaining = undo.current;
                update(previous);
                undo.current = remaining;
                setUndoCount(remaining.length);
              }
            }}
          >
            <Undo2 size={17} /> Undo
          </button>
          <button
            onClick={() =>
              void act('history', async () => {
                await historyPage.reload();
                setShowHistory(!showHistory);
              })
            }
          >
            <History size={17} /> History
          </button>
          <button
            className="primary"
            disabled={!editRole || !!busy || !!conflict}
            onClick={() =>
              void act('check', async () => {
                const r = await freeze();
                if (!r) return;
                const p = await api<{ report: Report }>(
                  workspace,
                  'email-revisions/' + r.id + '/preflight',
                  'POST',
                  {},
                );
                if (matches(r.anchor)) setReport(p.report);
              })
            }
          >
            <ScanLine size={17} /> Review and check
          </button>
        </div>
      </div>
      {error && (
        <div className="alert danger" role="alert">
          {error}
        </div>
      )}
      {conflict && (
        <div className="panel conflict-panel" role="alert">
          <h2>A newer version is saved.</h2>
          <p>Your local work is preserved. Compare the subjects and choose how to continue.</p>
          <div className="field-row">
            <div>
              <strong>Your local draft</strong>
              <p>{doc.spec.subject || '(empty subject)'}</p>
            </div>
            <div>
              <strong>Server · v{conflict.doc_version}</strong>
              <p>{conflict.spec.subject || '(empty subject)'}</p>
            </div>
          </div>
          <button
            disabled={!writable}
            onClick={() =>
              void act('fork', async () => {
                const r = await api<{ email: Doc }>(workspace, 'emails', 'POST', {
                  title: doc.title + ' (recovered copy)',
                  spec: doc.spec,
                });
                localStorage.removeItem(storage);
                router.push('/app/emails/' + r.email.id);
              })
            }
          >
            <Copy size={17} /> Keep mine as a copy
          </button>
          <button onClick={() => void act('reload', reload)}>Reload newer</button>
        </div>
      )}
      {showHistory && (
        <section className="panel history-panel">
          <div className="section-heading">
            <h2>Immutable checkpoints</h2>
            <button onClick={() => setShowHistory(false)}>Close history</button>
          </div>
          {historyPage.error && (
            <p className="alert danger" role="alert">
              {historyPage.error}
            </p>
          )}
          <button
            disabled={!editRole || !!busy || !!conflict}
            onClick={() =>
              void act('checkpoint', async () => {
                await freeze();
                await historyPage.reload();
              })
            }
          >
            <Plus size={16} /> Create checkpoint
          </button>
          {historyPage.hasMore && (
            <button
              disabled={!!busy || historyPage.busy}
              onClick={() => void historyPage.loadMore()}
            >
              Load older checkpoints
            </button>
          )}
          {history.length ? (
            history.map((r) => (
              <div className="history-row" key={r.id}>
                <span>
                  v{r.revision_no} · {r.subject || 'No subject'}
                </span>
                <code>{r.artifact_hash.slice(0, 12)}</code>
                <button
                  disabled={!editRole || !!busy || !!conflict}
                  onClick={() =>
                    void act('restore', async () => {
                      if (!(await flush()) || dirtyAt.current) return;
                      const origin = anchor();
                      const restored = await api<{ email: Doc }>(
                        workspace,
                        'emails/' + id + '/restore',
                        'POST',
                        { revision_id: r.id },
                        live.current!.doc_version,
                      );
                      if (!matches(origin))
                        throw new Error(
                          'The draft changed during restore. Reload the acknowledged server version; your local copy is preserved.',
                        );
                      install(restored.email);
                      localStorage.removeItem(storage);
                      setReport(null);
                      setRevision(null);
                    })
                  }
                >
                  Restore as new head
                </button>
              </div>
            ))
          ) : (
            <p className="muted">
              No checkpoint yet. Saving a draft and freezing a revision are separate actions.
            </p>
          )}
        </section>
      )}
      <div className="subject-fields panel">
        <label>
          Subject
          <input
            readOnly={!writable}
            maxLength={200}
            value={doc.spec.subject}
            onChange={(e) => update({ ...doc.spec, subject: e.target.value })}
          />
        </label>
        <label>
          Preheader
          <input
            readOnly={!writable}
            maxLength={250}
            value={doc.spec.preheader}
            onChange={(e) => update({ ...doc.spec, preheader: e.target.value })}
          />
        </label>
      </div>
      <EmailUTM key={workspace+':'+id} workspace={workspace} email={id} policy={doc.spec.tracking} canEdit={editRole} blocked={!!busy||!!conflict} onApply={applyUTM}/>
      <DerivedEmails workspace={workspace} id={id} sourceLocale={doc.spec.locale} lineage={doc.lineage ?? null} canEdit={editRole} busy={!!busy || !!conflict}
        onCreate={(input) => void act('derive', async () => {
          if (!(await flush()) || dirtyAt.current || !live.current) return;
          const origin = anchor();
          const slot = await derivationSlot(workspace, id, input, origin.version, origin.spec);
          if (!matches(origin)) return;
          const pending = pendingDerivation(slot);
          const r = pending ? { id: pending.source, anchor: origin } : revision && matches(revision.anchor) ? revision : await freeze();
          if (!r || !matches(r.anchor)) return;
          const receipt = pending ?? rememberDerivation(slot, r.id);
          const result = await api<{ email: Doc }>(workspace, 'email-revisions/' + receipt.source + '/' + (input.kind === 'remix' ? 'remix' : 'localize'), 'POST', input.kind === 'remix' ? { title: input.title } : { title: input.title, locale: input.locale }, undefined, receipt.key);
          acknowledgeDerivation(slot);
          if (matches(r.anchor)) router.push('/app/emails/' + result.email.id);
          else if (editorActive.current) setError('The source changed while the new draft was created. Your separate draft is in Emails; current edits are preserved.');
        })} />
      <div className="editor-grid">
        <aside className="outline panel">
          <div className="section-heading">
            <h2>Outline</h2>
            <span className="badge neutral">
              {doc.spec.editing_mode === 'raw_html' ? 'Raw HTML' : 'Blocks'}
            </span>
          </div>
          {doc.spec.editing_mode === 'structured' ? (
            <>
              <ol>
                {doc.spec.sections.map((b, i) => (
                  <li key={b.id} className={selected === b.id ? 'selected' : ''}>
                    <button
                      className="outline-select"
                      onClick={() => setSelected(b.id)}
                      aria-pressed={selected === b.id}
                    >
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      {b.type.replaceAll('_', ' ')}
                    </button>
                    <div className="block-controls">
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.type} ${i + 1} up`}
                        disabled={!writable || i === 0}
                        onClick={() => {
                          const a = [...doc.spec.sections];
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          update({ ...doc.spec, sections: a });
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.type} ${i + 1} down`}
                        disabled={!writable || i === doc.spec.sections.length - 1}
                        onClick={() => {
                          const a = [...doc.spec.sections];
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          update({ ...doc.spec, sections: a });
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={!writable}
                        aria-label={`Delete ${b.type} ${i + 1}`}
                        onClick={() =>
                          update({
                            ...doc.spec,
                            sections: doc.spec.sections.filter((n) => n.id !== b.id),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <label>
                Block type
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as Block['type'])}
                >
                  {[
                    'hero',
                    'text',
                    'image',
                    'button',
                    'columns',
                    'divider',
                    'social',
                    'legal_footer',
                    'product_card',
                    'custom_html',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!writable}
                onClick={() => {
                  const b = newBlock(addType);
                  update({ ...doc.spec, sections: [...doc.spec.sections, b] });
                  setSelected(b.id);
                }}
              >
                <Plus size={16} /> Add block
              </button>
            </>
          ) : (
            <p className="muted small">
              Raw mode is authoritative. Converting to blocks requires a separate reviewed proposal;
              no automatic round trip is claimed.
            </p>
          )}
          <div className="divider" />
          <label>
            Email direction
            <select
              disabled={!writable}
              value={doc.spec.direction}
              onChange={(e) => update({ ...doc.spec, direction: e.target.value as 'ltr' | 'rtl' })}
            >
              <option value="ltr">Left to right</option>
              <option value="rtl">Right to left</option>
            </select>
          </label>
          <p className="small muted">Locale: {doc.spec.locale}</p>
        </aside>
        <section className="canvas-area">
          <div className="canvas-toolbar">
            <div role="group" aria-label="Editor view">
              <button
                className={view === 'canvas' ? 'selected' : ''}
                onClick={() => setView('canvas')}
              >
                Preview
              </button>
              <button className={view === 'code' ? 'selected' : ''} onClick={() => setView('code')}>
                <Code2 size={16} /> HTML
              </button>
              <button className={view === 'text' ? 'selected' : ''} onClick={() => setView('text')}>
                Plaintext
              </button>
            </div>
            <div role="group" aria-label="Simulated viewport">
              <button
                aria-label="Desktop simulation"
                className={!mobile ? 'selected' : ''}
                onClick={() => setMobile(false)}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label="390 pixel mobile simulation"
                className={mobile ? 'selected' : ''}
                onClick={() => setMobile(true)}
              >
                <Smartphone size={17} />
              </button>
            </div>
          </div>
          <p className="simulation-label">
            <span className="badge warning">Simulation</span> {mobile ? '390px mobile' : 'Desktop'}{' '}
            · Same draft revision · No real-client verification
          </p>
          {view === 'canvas' ? (
            <iframe
              title="Email browser simulation"
              sandbox=""
              referrerPolicy="no-referrer"
              className={`email-preview ${mobile ? 'mobile' : ''}`}
              srcDoc={
                "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'\">" +
                html
              }
            />
          ) : view === 'text' ? (
            <pre className="code-view">{text}</pre>
          ) : (
            <div className="panel code-panel">
              {doc.spec.editing_mode === 'raw_html' ? (
                <label>
                  Raw HTML source
                  <textarea
                    readOnly={!writable}
                    className="raw-code"
                    value={doc.spec.raw_html}
                    onChange={(e) => update({ ...doc.spec, raw_html: e.target.value })}
                    rows={24}
                  />
                </label>
              ) : (
                <>
                  <p className="alert info">
                    Compiled HTML is read-only. Editing raw source creates a checkpoint and changes
                    the authoritative editing mode.
                  </p>
                  <pre className="code-view">{html}</pre>
                  <button
                    disabled={!editRole || !!busy}
                    onClick={() =>
                      void act('raw', async () => {
                        if (!(await flush()) || dirtyAt.current) return;
                        const origin = anchor(),
                          snapshot = structuredClone(live.current!);
                        const compiled = await api<{ artifact: { html: string } }>(
                          workspace,
                          'emails/' + id + '/preview',
                          'POST',
                          { spec: snapshot.spec },
                        );
                        if (!matches(origin))
                          throw new Error(
                            'The draft changed before raw conversion. Try again with the current version.',
                          );
                        const r = await api<{ email: Doc }>(
                          workspace,
                          'emails/' + id + '/import-html',
                          'POST',
                          { html: compiled.artifact.html },
                          snapshot.doc_version,
                        );
                        if (!matches(origin))
                          throw new Error(
                            'The draft changed during raw conversion. Your local copy is preserved.',
                          );
                        install(r.email);
                        localStorage.removeItem(storage);
                        setReport(null);
                        setRevision(null);
                      })
                    }
                  >
                    <Code2 size={16} /> Edit raw HTML
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        <aside className="inspector panel">
          <fieldset className="inspector-fields" disabled={!writable}>
            <h2>{block ? block.type.replaceAll('_', ' ') + ' settings' : 'Document settings'}</h2>
            {block && doc.spec.editing_mode === 'structured' && (
              <BlockFields block={block} onChange={changeBlock} />
            )}
            <div className="divider" />
            <div className="ai-panel">
              <h2>
                <Sparkles size={18} /> A second draft
              </h2>
              <label>
                Propose changes
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the changes and any approved facts."
                />
              </label>
              <button
                disabled={!editRole || !!busy || !aiPrompt || !editRole}
                onClick={() =>
                  void act('ai', async () => {
                    if (!(await flush()) || dirtyAt.current) return;
                    const origin = anchor();
                    const base = live.current!.doc_version;
                    const r = await api<{ operation: { id: string } }>(
                      workspace,
                      'emails/generate',
                      'POST',
                      {
                        prompt: aiPrompt,
                        brand_kit_version_id: doc.spec.brand_kit_version_id,
                        base_email_id: id,
                        base_version: base,
                        locale: doc.spec.locale,
                        mode: 'single',
                      },
                    );
                    const r2 = await poll<{
                      proposals: { spec: EmailSpec; review_notes: string[] }[];
                    }>(workspace, r.operation.id);
                    setProposal({ ...r2.proposals[0], base, anchor: origin });
                  })
                }
              >
                <Sparkles size={16} /> Generate proposal
              </button>
              <p className="small muted">
                Proposals stay separate until you apply them. Paid AI is unavailable until
                configured.
              </p>
              {proposal && (
                <div className="proposal">
                  <strong>{proposal.spec.subject}</strong>
                  {proposal.review_notes.map((n, i) => (
                    <p key={i} className="small">
                      {n}
                    </p>
                  ))}
                  {!proposalMatches && (
                    <p className="alert warning small">
                      The draft changed. Compare or create a copy; this proposal cannot replace the
                      newer draft.
                    </p>
                  )}
                  <button
                    disabled={!editRole || !proposalMatches}
                    onClick={() => {
                      if (!matches(proposal.anchor)) {
                        setError(
                          'The draft changed. This proposal cannot replace newer local work.',
                        );
                        return;
                      }
                      try{
                        update(copyProposalWithCurrentUTM(live.current!.spec,proposal.spec));
                        setProposal(null);
                      }catch(error){setError(error instanceof Error?error.message:'Proposal links need correction before applying. Your draft and UTM policy are retained.');}
                    }}
                  >
                    Apply proposal
                  </button>
                  <button onClick={() => setProposal(null)}>Discard</button>
                </div>
              )}
            </div>
          </fieldset>
        </aside>
      </div>
      {report && (
        <section className="panel preflight-panel">
          <div className="section-heading">
            <h2>
              <FileCheck size={22} /> Review evidence
            </h2>
            <span className={`badge ${report.state === 'blocked' ? 'danger' : 'warning'}`}>
              {report.state}
            </span>
          </div>
          <p className="small muted">
            Frozen artifact {report.artifact_hash} · Rules {report.rule_set_version} · Missing
            real-client captures remain incomplete.
          </p>
          <div className="finding-list">
            {report.findings.map((f, i) => (
              <div key={i}>
                <span
                  className={`badge ${f.severity === 'blocking' ? 'danger' : f.severity === 'warning' ? 'warning' : 'info'}`}
                >
                  {f.severity}
                </span>
                <div>
                  <strong>{f.code.replaceAll('_', ' ')}</strong>
                  <p>{f.message}</p>
                  <span className="small muted">Location: {f.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel export-panel">
        <div>
          <h2>Export a frozen version</h2>
          <p className="muted small">
            Downloads retain explicit merge/unsubscribe slots. Configure them in your recipient
            system before sending. PNG/PDF use an isolated browser simulation with remote images
            blocked.
          </p>
        </div>
        <div className="toolbar">
          {['html', 'txt', 'png', 'pdf'].map((format) => (
            <button
              disabled={!editRole || !!busy || !!conflict}
              key={format}
              onClick={() =>
                void act('download', async () => {
                  const controller = new AbortController();
                  exportController.current = controller;
                  try {
                    const r = revision && matches(revision.anchor) ? revision : await freeze();
                    if (!r || controller.signal.aborted || !matches(r.anchor)) return;
                    const response = await fetch(
                      '/v1/email-revisions/' + r.id + '/download?format=' + format,
                      { headers: { 'X-Workspace-Id': workspace }, signal: controller.signal },
                    );
                    if (!response.ok) {
                      const j = await response.json();
                      throw new Error(j.error?.message ?? 'Download failed');
                    }
                    const blob = await response.blob();
                    if (controller.signal.aborted || !matches(r.anchor)) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `email-v${r.revision_no}.${format}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch (error) {
                    if (!controller.signal.aborted) throw error;
                  } finally {
                    if (exportController.current === controller) exportController.current = null;
                  }
                })
              }
            >
              <Download size={16} />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
function newBlock(type: Block['type']): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case 'hero':
      return { id, type, heading: 'Your heading', text: 'Add supporting copy.' };
    case 'text':
      return { id, type, text: 'Write your story.' };
    case 'image':
      return { id, type, src: 'https://example.com/image.png', alt: '' };
    case 'button':
      return { id, type, label: 'Explore', href: 'https://example.com' };
    case 'divider':
      return { id, type };
    case 'columns':
      return {
        id,
        type,
        columns: [
          [{ id: crypto.randomUUID(), type: 'text', text: 'First column' }],
          [{ id: crypto.randomUUID(), type: 'text', text: 'Second column' }],
        ],
      };
    case 'social':
      return { id, type, links: [{ label: 'Website', href: 'https://example.com' }] };
    case 'legal_footer':
      return { id, type, identity: '', address: '', unsubscribe_slot: true };
    case 'product_card':
      return {
        id,
        type,
        title: 'Product name',
        description: 'Approved product details',
        price: '',
        href: 'https://example.com',
      };
    case 'custom_html':
      return { id, type, html: '<p>Custom content</p>' };
  }
}
function BlockFields({ block: b, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const field = (key: string, label: string, multiline = false) => {
    const value = (b as unknown as Record<string, string>)[key] ?? '';
    return (
      <label key={key}>
        {label}
        {multiline ? (
          <textarea
            rows={key === 'html' ? 8 : 4}
            value={value}
            onChange={(e) => onChange({ ...b, [key]: e.target.value } as Block)}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange({ ...b, [key]: e.target.value } as Block)}
          />
        )}
      </label>
    );
  };
  if (b.type === 'hero')
    return (
      <>
        {field('heading', 'Heading')}
        {field('text', 'Supporting text', true)}
      </>
    );
  if (b.type === 'text') return field('text', 'Body text', true);
  if (b.type === 'button')
    return (
      <>
        {field('label', 'Button label')}
        {field('href', 'Destination URL')}
      </>
    );
  if (b.type === 'image')
    return (
      <>
        {field('src', 'Public image URL')}
        {field('alt', 'Alternative text')}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={b.decorative ?? false}
            onChange={(e) => onChange({ ...b, decorative: e.target.checked })}
          />{' '}
          Decorative image
        </label>
        <p className="small muted">
          Remote images are blocked in local simulations. Immutable asset processing is a production
          gate.
        </p>
      </>
    );
  if (b.type === 'legal_footer')
    return (
      <>
        {field('identity', 'Sender identity')}
        {field('address', 'Postal address', true)}
        <p className="small muted">Unsubscribe slot is required and retained.</p>
      </>
    );
  if (b.type === 'product_card')
    return (
      <>
        {field('title', 'Product title')}
        {field('description', 'Description', true)}
        {field('price', 'Approved price and currency')}
        {field('href', 'Product URL')}
      </>
    );
  if (b.type === 'custom_html')
    return (
      <>
        {field('html', 'Sanitized custom HTML', true)}
        <p className="small muted">Only supported safe constructs are retained.</p>
      </>
    );
  if (b.type === 'columns')
    return (
      <>
        {b.columns.map((col, i) => (
          <fieldset key={i}>
            <legend>Column {i + 1}</legend>
            {col.map((n, j) => (
              <div key={n.id}>
                <BlockFields
                  block={n}
                  onChange={(next) => {
                    if (next.type === 'columns') return;
                    const columns = b.columns.map((c, index) =>
                      index === i ? c.map((v, k) => (k === j ? next : v)) : c,
                    );
                    onChange({ ...b, columns });
                  }}
                />
              </div>
            ))}
          </fieldset>
        ))}
      </>
    );
  if (b.type === 'social')
    return (
      <>
        {b.links.map((l, i) => (
          <fieldset key={i}>
            <legend>Link {i + 1}</legend>
            <label>
              Label
              <input
                value={l.label}
                onChange={(e) =>
                  onChange({
                    ...b,
                    links: b.links.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)),
                  })
                }
              />
            </label>
            <label>
              URL
              <input
                value={l.href}
                onChange={(e) =>
                  onChange({
                    ...b,
                    links: b.links.map((v, j) => (j === i ? { ...v, href: e.target.value } : v)),
                  })
                }
              />
            </label>
          </fieldset>
        ))}
      </>
    );
  return <p className="muted">A divider separates content sections.</p>;
}
