import { MAX_RENDER_OUTPUT, RenderProtocolError,validateRenderAssets } from './protocol.mjs';
export async function renderBinary(html, format, signal,assets=[]) {
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
    const bindings=new Map(validateRenderAssets(assets).map(e=>[e.url,e]));
    await context.route('**/*',route=>{const entry=bindings.get(route.request().url());return entry&&route.request().resourceType()==='image'?route.fulfill({status:200,contentType:entry.mime,body:Buffer.from(entry.base64,'base64'),headers:{'Cache-Control':'no-store'}}):route.abort();});
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    if(bindings.size)await page.waitForFunction(()=>Array.from(document.images).filter(img=>img.src.startsWith('https://mailcraft-assets.invalid/')).every(img=>img.complete&&img.naturalWidth>0),{},{timeout:5000});
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
