import { confirmOptIn } from '@/server/opt-in';
import {
  assertPreferenceOrigin,
  readPreferenceForm,
  preferenceError,
} from '@/server/preference-http';
import { fail } from '@/server/errors';
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertPreferenceOrigin(req);
    const form = await readPreferenceForm(req);
    if (form.get('human_confirmation') !== 'confirm')
      fail(422, 'CONFIRMATION_REQUIRED', 'Choose Confirm subscription to confirm permission.');
    const { token } = await params;
    await confirmOptIn(token);
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/preferences/confirm/' + encodeURIComponent(token) + '?confirmed=1',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return preferenceError(error);
  }
}
