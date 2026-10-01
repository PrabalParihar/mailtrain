import { MAX_RENDER_OUTPUT, RenderProtocolError } from './protocol.mjs';
export async function renderBinary(html, format, signal) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, chromiumSandbox: true, timeout: 10000 });
  const abort = () => void browser.close();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    if (browser.version() !== '153.0.8010.12')
      throw new RenderProtocolError('RENDER_RUNTIME_MISMATCH', 503);
    if (signal?.aborted) throw new RenderProtocolError('RENDER_CANCELLED', 499);
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      viewport: { width: 660, height: 900 },
    });
    await context.route('**/*', (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const size = await page.evaluate(() => ({
      width: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
      height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0),
    }));
    if (size.width > 2000 || size.height > 20000 || size.width * size.height > 20000000)
      throw new RenderProtocolError('RENDER_DIMENSIONS_EXCEEDED', 422);
    const bytes =
      format === 'png'
        ? await page.screenshot({ fullPage: true, timeout: 10000 })
        : await page.pdf({ format: 'A4', printBackground: true });
    if (bytes.length > MAX_RENDER_OUTPUT)
      throw new RenderProtocolError('RENDER_OUTPUT_TOO_LARGE', 413);
    return bytes;
  } finally {
    signal?.removeEventListener('abort', abort);
    await browser.close();
  }
}
