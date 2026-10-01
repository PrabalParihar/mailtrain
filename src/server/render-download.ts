import { chromium } from 'playwright';
import { fail } from './errors';
import { localMode } from './auth';
export async function renderDownload(html: string, format: 'png' | 'pdf') {
  if (!localMode())
    fail(
      409,
      'RENDER_WORKER_REQUIRED',
      'Isolated rendering worker must be configured before production exports.',
    );
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      viewport: { width: 660, height: 900 },
    });
    await context.route('**/*', (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return format === 'png'
      ? await page.screenshot({ fullPage: true })
      : await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}
