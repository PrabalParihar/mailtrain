import { NextResponse } from 'next/server';
import { unsubscribe } from '@/server/preferences';
import { AppError } from '@/server/errors';
import { assertPreferenceOrigin, readPreferenceForm } from '@/server/preference-http';
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const data = await readPreferenceForm(req);
    if (
      data.get('List-Unsubscribe') !== 'One-Click' &&
      data.get('human_confirmation') !== 'unsubscribe'
    )
      return new Response('Unsupported preference action', { status: 422 });
    if (data.get('List-Unsubscribe') !== 'One-Click') assertPreferenceOrigin(req);
    await unsubscribe((await params).token, data.get('List-Unsubscribe') !== 'One-Click');
    if (data.get('List-Unsubscribe') === 'One-Click')
      return new Response('Unsubscribed', {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    return NextResponse.redirect(
      new URL('/preferences/' + encodeURIComponent((await params).token) + '?updated=1', req.url),
      303,
    );
  } catch (e) {
    return new Response(
      e instanceof AppError ? e.message : 'Preference service temporarily unavailable',
      { status: e instanceof AppError ? e.status : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
