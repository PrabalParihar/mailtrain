import { fail } from './errors';
import { localMode } from './auth';
export async function renderDownload(html: string, format: 'png' | 'pdf', signal?: AbortSignal) {
  if (!localMode())
    fail(
      409,
      'RENDER_WORKER_REQUIRED',
      'Isolated rendering worker must be configured before production exports.',
    );
  const { chromium } = await import('playwright');
  signal = AbortSignal.any([AbortSignal.timeout(25000), ...(signal ? [signal] : [])]);
  if (signal?.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
  const browser = await chromium.launch({ headless: true, timeout: 10000 });
  const abort = () => void browser.close();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    if (signal?.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      viewport: { width: 660, height: 900 },
    });
    await context.route('**/*', (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return format === 'png'
      ? await page.screenshot({ fullPage: true, timeout: 10000 })
      : await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    signal?.removeEventListener('abort', abort);
    await browser.close();
  }
}
