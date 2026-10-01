'use client';
import { useEffect, useState } from 'react';
import { Check, Globe, Palette, ArrowUpRight } from 'lucide-react';
import { api, poll } from './api';
import type { Brand } from '@/domain/brand';
const initial: Brand = {
  name: '',
  website: '',
  description: '',
  voice: '',
  accent: '#0B625D',
  background: '#F7F6F2',
  font_stack: 'Arial, sans-serif',
  address: '',
  forbidden_phrases: [],
  approved_claims: [],
  provenance: [],
};
export function BrandPanel({ workspace }: { workspace: string }) {
  const [brand, setBrand] = useState<Brand>(initial),
    [version, setVersion] = useState(0),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(''),
    [url, setUrl] = useState('');
  useEffect(() => {
    void api<{ data: { version: number; data: Brand }[] }>(workspace, 'brands')
      .then((r) => {
        if (r.data[0]) {
          setBrand(r.data[0].data);
          setVersion(r.data[0].version);
        }
      })
      .catch((e) => setError(e.message));
  }, [workspace]);
  const field = <K extends keyof Brand>(name: K, value: Brand[K]) =>
    setBrand((b) => ({ ...b, [name]: value }));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE FOUNDATION OF YOUR EMAILS</p>
          <h1>Make it feel like you.</h1>
          <p className="muted">
            Review your brand evidence, then confirm a version your emails can rely on.
          </p>
        </div>
        {version > 0 && (
          <span className="badge success">
            <Check size={15} /> Confirmed v{version}
          </span>
        )}
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
      <section className="panel brand-import">
        <div>
          <Globe size={22} />
          <div>
            <h2>Start with your website</h2>
            <p className="muted small">
              Public pages only. Extracted fields are suggestions for your review.
            </p>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy('extract');
            setError('');
            try {
              const r = await api<{ operation: { id: string } }>(
                workspace,
                'brands/from-url',
                'POST',
                { url },
              );
              setNotice('Extraction queued. Your confirmed kit remains unchanged.');
              const result = await poll<{ proposal: Brand }>(workspace, r.operation.id);
              setBrand(result.proposal);
              setNotice('Extraction proposal ready. Review all fields before confirming.');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy('');
            }
          }}
        >
          <label className="sr-only" htmlFor="brand-url">
            Public brand website
          </label>
          <input
            id="brand-url"
            type="url"
            placeholder="https://your-brand.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button disabled={!!busy}>
            {busy === 'extract' ? 'Extracting…' : 'Review website'} <ArrowUpRight size={16} />
          </button>
        </form>
      </section>
      <div className="brand-grid">
        <form
          className="panel brand-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy('confirm');
            setError('');
            try {
              const r = await api<{ brand: { version: number } }>(workspace, 'brands', 'POST', {
                ...brand,
                provenance: brand.provenance.map((p) => ({ ...p, status: 'confirmed' })),
              });
              setVersion(r.brand.version);
              setNotice(
                'Brand version ' +
                  r.brand.version +
                  ' saved. Existing emails keep their pinned brand version.',
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy('');
            }
          }}
        >
          <div className="section-heading">
            <h2>Brand kit</h2>
            <Palette size={20} />
          </div>
          <label>
            Brand name
            <input
              value={brand.name}
              onChange={(e) => field('name', e.target.value)}
              maxLength={100}
              required
              placeholder="Your brand"
            />
          </label>
          <label>
            Website
            <input
              type="url"
              value={brand.website}
              onChange={(e) => field('website', e.target.value)}
              placeholder="https://your-brand.com"
            />
          </label>
          <label>
            What you do
            <textarea
              value={brand.description}
              onChange={(e) => field('description', e.target.value)}
              rows={3}
              placeholder="Describe the product and the people it helps."
            />
          </label>
          <label>
            Brand voice
            <textarea
              value={brand.voice}
              onChange={(e) => field('voice', e.target.value)}
              rows={2}
              placeholder="Warm, practical and direct."
            />
          </label>
          <div className="field-row">
            <label>
              Action color
              <div className="color-field">
                <input
                  type="color"
                  value={brand.accent}
                  onChange={(e) => field('accent', e.target.value)}
                />
                <input
                  aria-label="Action color hex"
                  value={brand.accent}
                  onChange={(e) => field('accent', e.target.value)}
                />
              </div>
            </label>
            <label>
              Email background
              <div className="color-field">
                <input
                  type="color"
                  value={brand.background}
                  onChange={(e) => field('background', e.target.value)}
                />
                <input
                  aria-label="Background color hex"
                  value={brand.background}
                  onChange={(e) => field('background', e.target.value)}
                />
              </div>
            </label>
          </div>
          <label>
            Email-safe typeface
            <select
              value={brand.font_stack}
              onChange={(e) => field('font_stack', e.target.value as Brand['font_stack'])}
            >
              <option>Arial, sans-serif</option>
              <option>Georgia, serif</option>
              <option>Verdana, sans-serif</option>
            </select>
          </label>
          <label>
            Sender postal address
            <textarea
              value={brand.address}
              onChange={(e) => field('address', e.target.value)}
              rows={2}
              placeholder="Required for a commercial footer. Confirm the real sender identity."
            />
          </label>
          <label>
            Approved claims <span className="muted small">One per line</span>
            <textarea
              value={brand.approved_claims.join('\n')}
              onChange={(e) => field('approved_claims', e.target.value.split('\n').filter(Boolean))}
              rows={3}
              placeholder="Only facts you can substantiate."
            />
          </label>
          <label>
            Forbidden phrases <span className="muted small">One per line</span>
            <textarea
              value={brand.forbidden_phrases.join('\n')}
              onChange={(e) =>
                field('forbidden_phrases', e.target.value.split('\n').filter(Boolean))
              }
              rows={2}
            />
          </label>
          <button className="primary" disabled={!!busy || !brand.name}>
            {busy === 'confirm' ? 'Saving…' : 'Confirm brand version'} <Check size={18} />
          </button>
        </form>
        <aside>
          <div className="panel brand-sample">
            <p className="eyebrow">CUSTOMER BRAND · SAMPLE CONTENT</p>
            <div
              style={{
                backgroundColor: brand.background,
                color: '#162B30',
                fontFamily: brand.font_stack,
              }}
            >
              <p className="sample-wordmark">{brand.name || 'YOUR BRAND'}</p>
              <h2>
                A story that
                <br />
                sounds like you.
              </h2>
              <p>Your confirmed voice and approved facts guide every draft.</p>
              <span style={{ backgroundColor: brand.accent, color: 'white' }}>
                Explore the story
              </span>
            </div>
            <p className="muted small">
              Sample content only. Customer color contrast and email-client behavior have not been
              certified.
            </p>
          </div>
          <div className="panel source-card">
            <h2>Source evidence</h2>
            {brand.provenance.length ? (
              brand.provenance.map((p, i) => (
                <div key={i}>
                  <strong>{p.status}</strong>
                  <p className="small break-word">{p.source}</p>
                  <time className="muted small">{p.captured_at}</time>
                </div>
              ))
            ) : (
              <p className="muted">
                Manual input. Confirm the source and rights for the facts you add.
              </p>
            )}
            <p className="small muted">
              Rescans produce a proposal. Confirmed values are never replaced automatically.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
