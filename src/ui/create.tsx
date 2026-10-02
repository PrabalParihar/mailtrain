'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, FilePenLine } from 'lucide-react';
import { api, poll } from './api';
import type { Brand } from '@/domain/brand';
import {EmailSourceSpecSchema as EmailSpecSchema,type EmailSpec} from '@/domain/email-schema';
import{z}from'zod';
import{CreationHistory}from'./creation-history';
const localeNames: Record<string, string> = {
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'fr-FR': 'French',
  'de-DE': 'German',
  'es-ES': 'Spanish',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'nl-NL': 'Dutch',
  'sv-SE': 'Swedish',
  'da-DK': 'Danish',
  'no-NO': 'Norwegian',
  'fi-FI': 'Finnish',
  'pl-PL': 'Polish',
  'cs-CZ': 'Czech',
  'tr-TR': 'Turkish',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'hi-IN': 'Hindi',
  'ar-SA': 'Arabic · RTL',
  'he-IL': 'Hebrew · RTL',
};
export function CreatePanel({ workspace }: { workspace: string }) {
  const [brands, setBrands] = useState<{ id: string; version: number; data: Brand }[]>([]),
    [title, setTitle] = useState(''),
    [prompt, setPrompt] = useState(''),
    [goal, setGoal] = useState('Announce something new'),
    [persona, setPersona] = useState(''),
    [locale, setLocale] = useState('en-US'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState<{
      proposals: { spec: EmailSpec; review_notes: string[]; delay_hours: number }[];
      provenance?:{model:string;prompt_version:string;brand_version:string;memory:{retrieval_version:string;retrieved_at:string;chunks:{id:string;source_id:string;content_digest:string}[]}};
    } | null>(null),
    [operationId, setOperationId] = useState(''),
    [series, setSeries] = useState(false),
    [count, setCount] = useState(2);
  const router = useRouter(),running=useRef(false),watch=useRef<AbortController|null>(null);
  useEffect(()=>()=>{watch.current?.abort();},[]);
  useEffect(() => {
    void api<{ brand: (typeof brands)[number] | null }>(workspace, 'brands/current')
      .then((r) => {
        setBrands(r.brand ? [r.brand] : []);
        const saved = sessionStorage.getItem('mailcraft.brief.' + workspace);
        if (saved) {
          const b = JSON.parse(saved);
          setTitle(b.title ?? '');
          setPrompt(b.prompt ?? '');
        }
      })
      .catch((e) => setError(e.message));
  }, [workspace]);
  useEffect(() => {
    if (title || prompt)
      sessionStorage.setItem('mailcraft.brief.' + workspace, JSON.stringify({ title, prompt }));
  }, [workspace, title, prompt]);
  async function manual(spec?: EmailSpec) {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ email: { id: string } }>(workspace, 'emails', 'POST', {
        title: title || 'Untitled email',
        ...(spec ? { spec } : {}),
      });
      router.push('/app/emails/' + r.email.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A NEW STORY</p>
          <h1>What would you like to say?</h1>
          <p className="muted">
            Give the draft a purpose. Keep the offer grounded in facts you approve.
          </p>
        </div>
      </div>
      {error && (
        <p className="alert danger" role="alert">
          {error}
        </p>
      )}
      {!brands.length && (
        <p className="alert warning">
          Confirm a brand kit first.{' '}
          <Link href="/app/brand">
            Set up your brand <ArrowUpRight size={16} />
          </Link>
        </p>
      )}
      {brands[0] && <p className="muted small">Brand: {brands[0].data.name} · confirmed v{brands[0].version}</p>}
      <CreationHistory workspace={workspace} type="email.generate" refreshToken={operationId+':'+busy} onProposal={value=>{const checked=z.object({proposals:z.array(z.object({spec:EmailSpecSchema,review_notes:z.array(z.string()),delay_hours:z.number()})).min(1).max(10)}).parse(value);setResult(checked);}}/>
      <div className="create-grid">
        <form
          className="panel brief-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if(running.current)return;running.current=true;
            const controller=new AbortController();watch.current=controller;
            setBusy(true);
            setError('');
            setResult(null);
            try {
              const r = await api<{ operation: { id: string } }>(
                workspace,
                'emails/generate',
                'POST',
                {
                  prompt: `Goal: ${goal}\nAudience description: ${persona}\nBrief: ${prompt}`,
                  brand_kit_version_id: brands[0].id,
                  locale,
                  mode: series ? 'series' : 'single',
                  ...(series ? { count } : {}),
                },
              );
              setOperationId(r.operation.id);
              const proposal = await poll<NonNullable<typeof result>>(workspace, r.operation.id,controller.signal);
              if(!controller.signal.aborted)setResult(proposal);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              running.current=false;setBusy(false);
            }
          }}
        >
          <div className="section-heading">
            <h2>Email brief</h2>
            <Sparkles size={20} />
          </div>
          <label>
            Email name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={160}
              placeholder="Autumn collection launch"
            />
          </label>
          <div className="field-row">
            <label>
              Goal
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option>Announce something new</option>
                <option>Welcome your audience</option>
                <option>Share a useful story</option>
                <option>Promote an approved offer</option>
              </select>
            </label>
            <label>
              Email locale
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                {Object.entries(localeNames).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Audience description
            <input
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Returning customers who value thoughtful essentials"
            />
            <span className="muted small">
              Describe people here; do not paste recipient lists or private data.
            </span>
          </label>
          <label>
            The story, offer and CTA
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              required
              minLength={5}
              maxLength={7000}
              placeholder="What is new? Why does it matter? Include approved prices, dates and the exact destination URL."
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={series} onChange={(e) => setSeries(e.target.checked)} />{' '}
            Create a linked series with delay notes
          </label>
          {series && (
            <label>
              Number of drafts
              <input
                type="number"
                min={2}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
              <span className="small muted">
                Delay notes do not enroll contacts or execute an automation.
              </span>
            </label>
          )}
          <button className="primary" disabled={busy || !brands.length}>
            {busy ? 'Preparing proposal…' : 'Generate proposal'} <Sparkles size={18} />
          </button>
          {busy && operationId && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await api(workspace, 'operations/' + operationId + '/cancel', 'POST', {});
                  setError('Cancellation requested. In-flight usage remains reserved until the outcome is accounted for.');
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Cancel operation
            </button>
          )}
          {busy&&<button type="button"onClick={()=>watch.current?.abort()}>Stop waiting</button>}
          <p className="muted small">
            AI requires a configured provider and approved finite allowance. Generation creates a
            proposal; it never sends.
          </p>
        </form>
        <aside>
          <div className="panel note-card">
            <p className="eyebrow">MORE INTENT, LESS GUESSWORK</p>
            <h2>
              Make room for
              <br />a good first draft.
            </h2>
            <ul>
              <li>One clear goal</li>
              <li>Specific, approved facts</li>
              <li>A destination worth clicking</li>
              <li>Your brand, in your own words</li>
            </ul>
            <div className="divider" />
            <p>Prefer to start yourself?</p>
            <button disabled={busy || !brands.length} onClick={() => void manual()}>
              <FilePenLine size={18} /> Open a blank draft
            </button>
            <p className="small muted">Manual editing works without AI.</p>
          </div>
          {result && (
            <div className="panel proposal-card">
              <span className="badge info">Proposal · review before applying</span>
              {result.provenance&&<details><summary>Generation evidence</summary><p className="small muted"style={{overflowWrap:'anywhere'}}>Model {result.provenance.model} · prompt {result.provenance.prompt_version}<br/>Brand version {result.provenance.brand_version}<br/>Retrieval {result.provenance.memory.retrieval_version} · {result.provenance.memory.retrieved_at}</p>{result.provenance.memory.chunks.length===0?<p>No source chunks were selected.</p>:result.provenance.memory.chunks.map((chunk)=><p className="small muted"key={chunk.id}style={{overflowWrap:'anywhere'}}>Source {chunk.source_id}<br/>Chunk {chunk.id}<br/>Digest {chunk.content_digest}</p>)}</details>}
              {result.proposals.map((p, i) => (
                <article key={i}>
                  <h2>{p.spec.subject}</h2>
                  <p>{p.spec.preheader}</p>
                  <p className="small muted">
                    Locale {p.spec.locale} · delay hint {p.delay_hours} hours
                  </p>
                  {p.review_notes.map((note, j) => (
                    <p className="alert warning small" key={j}>
                      {note}
                    </p>
                  ))}
                  <button className="primary" disabled={busy} onClick={() => void manual(p.spec)}>
                    Apply as a new draft <ArrowUpRight size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
