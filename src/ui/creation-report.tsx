'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { z } from 'zod';
import {
  CreationActivityReport,
  parseCreationReportWindow,
  creationReportCSV,
} from '../domain/creation-report';
import { api } from './api';

type Report = z.infer<typeof CreationActivityReport>;
type Selection = { type: 'brand.extract' | 'email.generate'; start: string; end: string; timeZone: string };
const countLabels = [
  ['total', 'Total operations'], ['queued', 'Queued'], ['running', 'Running'],
  ['succeeded', 'Succeeded'], ['failed', 'Failed'], ['cancelled', 'Cancelled'],
  ['cancel_requested', 'Cancellation requested'], ['other', 'Other recorded states'],
] as const;

function initialSelection(): Selection {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { type: 'email.generate', start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), timeZone: 'UTC' };
}
function windowFor(selection: Selection) {
  return parseCreationReportWindow({
    type: selection.type,
    created_after: selection.start + 'T00:00:00.000Z',
    created_before: selection.end + 'T00:00:00.000Z',
    time_zone: selection.timeZone.trim(),
  });
}
function selectionFromURL(fallback: Selection): Selection {
  const params = new URLSearchParams(window.location.search);
  if (!params.size) return fallback;
  const keys = ['type', 'start', 'end', 'time_zone'] as const;
  if (keys.some((key) => params.getAll(key).length !== 1)) throw new Error('Incomplete report window');
  const selection = {
    type: params.get('type') as Selection['type'],
    start: params.get('start')!, end: params.get('end')!, timeZone: params.get('time_zone')!,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selection.start) || !/^\d{4}-\d{2}-\d{2}$/.test(selection.end))
    throw new Error('Report dates must use YYYY-MM-DD');
  windowFor(selection);
  return { ...selection, timeZone: selection.timeZone.trim() };
}
function preserveWindow(selection: Selection) {
  const params = new URLSearchParams({ type: selection.type, start: selection.start, end: selection.end, time_zone: selection.timeZone.trim() });
  window.history.replaceState(window.history.state, '', window.location.pathname + '?' + params + window.location.hash);
}
function matches(report: Report, selection: Selection) {
  try {
    const window = windowFor(selection);
    return report.type === window.type && report.created_after === window.created_after
      && report.created_before === window.created_before && report.time_zone === window.time_zone;
  } catch { return false; }
}
function duration(value: number | null) {
  if (value === null) return 'Unavailable';
  if (value < 1000) return Math.round(value) + ' ms';
  if (value < 60000) return (value / 1000).toFixed(1) + ' seconds';
  return (value / 60000).toFixed(1) + ' minutes';
}

export function CreationReport({ workspace, actor }: { workspace: string; actor: string }) {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const admission = useRef(false), epoch = useRef(0), controller = useRef<AbortController | null>(null);
  const initial = useRef(selection);
  const load = useCallback(async (chosen: Selection) => {
    if (admission.current || !workspace || !actor) return;
    let reportWindow: ReturnType<typeof parseCreationReportWindow>;
    try { reportWindow = windowFor(chosen); }
    catch {
      setError('Choose a valid UTC date range within years 2000–2100, up to 31 days, and a supported IANA time zone. The end date must be after the start date.');
      return;
    }
    try { preserveWindow(chosen); }
    catch {
      setError('The report window could not be saved in this page URL. Try again.');
      return;
    }
    admission.current = true;
    const generation = ++epoch.current;
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError(''); setReport(null);
    try {
      const query = new URLSearchParams(reportWindow);
      const response = await api<{ report: unknown }>(workspace, 'operations/report?' + query, 'GET', undefined, undefined, undefined, request.signal, actor);
      const parsed = CreationActivityReport.safeParse(response.report);
      if (!parsed.success) throw new Error('The report response could not be read. Refresh to try again.');
      const result = parsed.data;
      if (!matches(result, chosen)) throw new Error('The report did not match the requested window. Refresh to try again.');
      if (generation === epoch.current && !request.signal.aborted) setReport(result);
    } catch (reason) {
      if (generation === epoch.current && !request.signal.aborted)
        setError(reason instanceof Error ? reason.message : 'The report is unavailable. Try again.');
    } finally {
      if (generation === epoch.current) {
        admission.current = false; controller.current = null; setBusy(false);
      }
    }
  }, [workspace, actor]);
  useEffect(() => {
    let active = true;
    const fence = epoch;
    void Promise.resolve().then(() => {
      if (!active) return;
      let chosen: Selection;
      try { chosen = selectionFromURL(initial.current); }
      catch {
        setError('The report window in this URL is invalid or incomplete. Choose a valid operation, UTC start and end dates, and time zone, then apply the report window.');
        return;
      }
      setSelection(chosen);
      return load(chosen);
    });
    return () => { active = false; fence.current++; controller.current?.abort(); admission.current = false; };
  }, [load]);
  const displayedMatches = Boolean(report && matches(report, selection));
  function download() {
    if (admission.current || !report || !matches(report, selection)) return;
    const url = URL.createObjectURL(new Blob([creationReportCSV(report)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lettercape-' + report.type.replace('.', '-') + '-' + report.created_after.slice(0, 10) + '.csv';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="creation-report">
      <div className="page-heading">
        <div><p className="eyebrow">RECORDED CREATION ACTIVITY</p><h1>Know what actually happened.</h1>
          <p className="muted">Brand extraction and email generation operations recorded in this workspace.</p></div>
      </div>
      <form className="panel creation-report-filters" onSubmit={(event) => { event.preventDefault(); void load(selection); }}>
        <h2>Choose the report window</h2>
        <div className="creation-report-fields">
          <label>Operation type<select value={selection.type} onChange={(event) => setSelection({ ...selection, type: event.target.value as Selection['type'] })}>
            <option value="email.generate">Email generation</option><option value="brand.extract">Brand extraction</option>
          </select></label>
          <label>Start date (inclusive, UTC)<input type="date" required min="2000-01-01" max="2100-12-31" value={selection.start} onChange={(event) => setSelection({ ...selection, start: event.target.value })} /></label>
          <label>End date (exclusive, UTC)<input type="date" required min="2000-01-02" max="2101-01-01" value={selection.end} onChange={(event) => setSelection({ ...selection, end: event.target.value })} /></label>
          <label>Daily grouping time zone<input required list="creation-report-zones" value={selection.timeZone} onChange={(event) => setSelection({ ...selection, timeZone: event.target.value })} placeholder="UTC or Asia/Kolkata" /></label>
          <datalist id="creation-report-zones"><option value="UTC" /><option value="Asia/Kolkata" /><option value="America/New_York" /><option value="Europe/London" /></datalist>
        </div>
        <p className="small muted">Up to 31 UTC days within years 2000–2100. The end date is excluded. The time zone groups those operations into local calendar days; it does not change the UTC window.</p>
        <div className="creation-report-actions">
          <button className="primary" type="submit" disabled={busy}>Apply report window</button>
          <button type="button" disabled={busy || !displayedMatches} onClick={() => void load(selection)}>Refresh report</button>
          <button type="button" disabled={busy || !displayedMatches} onClick={download}>Download report CSV</button>
        </div>
        {report && !displayedMatches && <p role="status">Selection changed. Apply the window to replace the displayed snapshot and enable CSV download.</p>}
      </form>
      {busy && <p role="status">Loading recorded creation activity…</p>}
      {error && <div className="alert danger" role="alert"><p>{error}</p><button disabled={busy} onClick={() => void load(selection)}>Retry report</button></div>}
      {report && <section className="panel creation-report-results" aria-label="Creation activity snapshot">
        <h2>{report.type === 'email.generate' ? 'Email generation' : 'Brand extraction'} snapshot</h2>
        <p className="small">Created from <time dateTime={report.created_after}>{report.created_after}</time> up to, excluding <time dateTime={report.created_before}>{report.created_before}</time>.</p>
        <p className="small muted">States observed at <time dateTime={report.generated_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'long', timeZone: report.time_zone }).format(new Date(report.generated_at))}</time>. Daily grouping: {report.time_zone}.</p>
        <p className="small muted">These are operation states, not provider attempts or a complete user journey. A succeeded operation does not establish human review, approved export or delivery.</p>
        {report.counts.total === 0 && <div className="creation-report-empty" role="status"><h3>No recorded operations in this window.</h3><p>Choose another window or inspect the existing creation histories. No activity is inferred from saved drafts.</p></div>}
        <dl className="creation-report-counts">{countLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{report.counts[key].toLocaleString()}</dd></div>)}</dl>
        <h3>Time to successful completion</h3>
        <p className="small muted">From operation creation to its recorded successful completion, including queue time. This is not provider latency.</p>
        <dl className="creation-report-counts"><div><dt>Median</dt><dd>{duration(report.completion_time.median_ms)}</dd></div><div><dt>90th percentile</dt><dd>{duration(report.completion_time.p90_ms)}</dd></div></dl>
        <p className="small">{report.completion_time.sample_count.toLocaleString()} valid successful completion samples; {report.completion_time.missing_count.toLocaleString()} successful operations missing usable timing.</p>
        {report.completion_time.sample_count === 0 && <p className="muted">Completion timing is unavailable for this window.</p>}
        <h3>Operations by creation day</h3>
        <p className="small muted" id="creation-report-table-help">Days use {report.time_zone}. On narrow screens, scroll within the table to read all states.</p>
        <div className="creation-report-table" role="region" aria-label="Daily creation activity" aria-describedby="creation-report-table-help" tabIndex={0}>
          <table><caption>Recorded operation states by creation day</caption><thead><tr><th scope="col">Creation day</th>{countLabels.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead><tbody>{report.daily.map((day) => <tr key={day.date}><th scope="row">{day.date}</th>{countLabels.map(([key]) => <td key={key}>{day.counts[key].toLocaleString()}</td>)}</tr>)}</tbody></table>
        </div>
        <p className="small muted">CSV contains only the displayed aggregate snapshot, without operation IDs, briefs, provider responses or private rows.</p>
      </section>}
      <section className="panel creation-report-limits"><h2>Delivery and engagement metrics are unavailable.</h2>
        <p>This report does not supply sends, delivery, opens, clicks, conversions or revenue. It does not establish live analytics acceptance.</p>
        <div className="creation-report-links"><Link href="/app/emails/new">Email generation history</Link><Link href="/app/brand">Brand extraction history</Link><Link href="/app/integrations">Provider requirements</Link></div>
      </section>
    </div>
  );
}
