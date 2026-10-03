'use client';

import type { Block } from '@/domain/email';

export function BlockFields({
  block: b,
  onChange,
  readOnly = false,
  locale,
  direction,
  linear = false,
}: {
  block: Block;
  onChange: (block: Block) => void;
  readOnly?: boolean;
  locale?: string;
  direction?: 'ltr' | 'rtl';
  linear?: boolean;
}) {
  const field = (key: string, label: string, multiline = false) => {
    const value = (b as unknown as Record<string, string>)[key] ?? '';
    const literal = key === 'html' || key === 'href' || key === 'src';
    const contentProps = {
      readOnly,
      lang: literal ? undefined : locale,
      dir: literal && direction ? 'ltr' as const : direction,
    };
    return (
      <label key={key}>
        {label}
        {multiline ? (
          <textarea
            {...contentProps}
            rows={key === 'html' ? 8 : 4}
            value={value}
            onChange={(e) => {
              if (!readOnly) onChange({ ...b, [key]: e.target.value } as Block);
            }}
          />
        ) : (
          <input
            {...contentProps}
            value={value}
            onChange={(e) => {
              if (!readOnly) onChange({ ...b, [key]: e.target.value } as Block);
            }}
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
        {b.asset_ref ? (
          <>
            <p className="small">Private immutable variant selected. Public delivery is unavailable; use an image ZIP bundle.</p>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                const image = { ...b, src: 'https://example.com/image.png' };
                delete image.asset_ref;
                delete image.fallback_ref;
                onChange(image);
              }}
            >
              Use a public image URL
            </button>
          </>
        ) : field('src', 'Public image URL')}
        {field('alt', 'Alternative text')}
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={b.decorative ?? false}
            onChange={(e) => {
              if (!readOnly) onChange({ ...b, decorative: e.target.checked });
            }}
          />{' '}
          Decorative image
        </label>
        <p className="small muted">
          Remote images are blocked in local simulations. Verified private derivatives are available after real processing; public hosting remains a production gate.
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
        {field('html', linear ? 'Custom HTML source' : 'Sanitized custom HTML', true)}
        <p className="small muted">
          {linear ? 'Source is retained as authored. Preview and export are derived separately.' : 'Only supported safe constructs are retained.'}
        </p>
      </>
    );
  if (b.type === 'columns')
    return (
      <>
        {b.columns.map((col, i) => (
          <fieldset key={i}>
            <legend>Column {i + 1}</legend>
            {col.map((n, j) => {
              const fields = (
                <BlockFields
                  block={n}
                  readOnly={readOnly}
                  locale={locale}
                  direction={direction}
                  linear={linear}
                  onChange={(next) => {
                    if (readOnly || next.type === 'columns') return;
                    const columns = b.columns.map((c, index) =>
                      index === i ? c.map((v, k) => (k === j ? next : v)) : c,
                    );
                    onChange({ ...b, columns });
                  }}
                />
              );
              return linear ? (
                <fieldset key={n.id} data-linear-child={n.id}>
                  <legend>{n.type} {j + 1}</legend>
                  {fields}
                </fieldset>
              ) : <div key={n.id}>{fields}</div>;
            })}
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
                readOnly={readOnly}
                lang={locale}
                dir={direction}
                value={l.label}
                onChange={(e) => {
                  if (!readOnly) onChange({
                    ...b,
                    links: b.links.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)),
                  });
                }}
              />
            </label>
            <label>
              URL
              <input
                readOnly={readOnly}
                dir={direction ? 'ltr' : undefined}
                value={l.href}
                onChange={(e) => {
                  if (!readOnly) onChange({
                    ...b,
                    links: b.links.map((v, j) => (j === i ? { ...v, href: e.target.value } : v)),
                  });
                }}
              />
            </label>
          </fieldset>
        ))}
      </>
    );
  return <p className="muted">A divider separates content sections.</p>;
}
