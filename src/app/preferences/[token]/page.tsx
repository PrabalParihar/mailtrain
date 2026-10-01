import { readPreference } from '@/server/preferences';
import { AppError } from '@/server/errors';
import { PreferenceControls } from '@/ui/preference-controls';
export const dynamic = 'force-dynamic';

export default async function Preferences({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let pref: Awaited<ReturnType<typeof readPreference>> | undefined;
  let errorMessage: string | undefined;
  try {
    pref = await readPreference(token);
  } catch (e) {
    if (e instanceof AppError) errorMessage = e.message;
    else throw e;
  }
  if (!pref)
    return (
      <main id="main" className="auth-page">
        <h1>Preference link unavailable</h1>
        <p>{errorMessage}</p>
      </main>
    );
  return (
    <main id="main" className="auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">{pref.brand} · EMAIL PREFERENCES</p>
        <h1>{pref.unsubscribed ? 'You are unsubscribed.' : 'You control what reaches you.'}</h1>
        <p>Stop all marketing email from this sender without signing in or answering a survey.</p>
        {!pref.unsubscribed && (
          <form action={'/preferences/' + encodeURIComponent(token) + '/unsubscribe'} method="post">
            <input type="hidden" name="human_confirmation" value="unsubscribe" />
            <button className="primary">Unsubscribe from all marketing</button>
          </form>
        )}
        <p className="small muted">
          This does not recall messages already authorized or in flight. New dispatch authorizations
          after suppression are denied. Existing safety blocks remain in place.
        </p>
        <PreferenceControls token={token} pref={pref} />
      </section>
    </main>
  );
}
