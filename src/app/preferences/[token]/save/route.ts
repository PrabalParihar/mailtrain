import { savePreference } from '@/server/preferences';
import {
  assertPreferenceOrigin,
  readPreferenceForm,
  preferenceError,
} from '@/server/preference-http';
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const json = req.headers.get('accept') === 'application/json';
  try {
    assertPreferenceOrigin(req);
    const form = await readPreferenceForm(req);
    const result = await savePreference((await params).token, {
      expected_version: Number(form.get('expected_version')),
      frequency: form.get('frequency'),
      topics: form.getAll('topics'),
      reactivate_global: form.get('reactivate_global') === 'yes',
    });
    if (json) return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    return new Response(null, {
      status: 303,
      headers: {
        Location:
          '/preferences/' + encodeURIComponent((await params).token) + '?updated=preferences',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return preferenceError(error, json);
  }
}
