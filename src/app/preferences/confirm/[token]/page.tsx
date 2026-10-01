import { readOptIn } from '@/server/opt-in';
import { AppError } from '@/server/errors';
export default async function Confirmation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let request: Awaited<ReturnType<typeof readOptIn>> | undefined;
  try {
    request = await readOptIn(token);
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
  }
  if (!request)
    return (
      <main id="main" className="auth-page">
        <section className="panel auth-panel">
          <h1>Confirmation link unavailable</h1>
          <p>
            This link is invalid or expired. Use your preference page to request a new confirmation.
          </p>
        </section>
      </main>
    );
  const confirmed = request.confirmed;
  return (
    <main id="main" className="auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">{request.brand} · CONFIRM EMAIL PERMISSION</p>
        <h1>{confirmed ? 'Confirmation recorded.' : 'Confirm your subscription.'}</h1>
        {confirmed ? (
          <p role="status">
            This confirmation was already used. Your current preferences and any later unsubscribe
            still apply.
          </p>
        ) : (
          <>
            <p>
              Confirm the requested topics
              {request.reactivate_global
                ? ' and deliberately restore global marketing permission'
                : ''}
              . Existing complaint, bounce and manual blocks remain in place.
            </p>
            <form
              action={'/preferences/confirm/' + encodeURIComponent(token) + '/submit'}
              method="post"
            >
              <input type="hidden" name="human_confirmation" value="confirm" />
              <button className="primary">Confirm subscription</button>
            </form>
            <p className="small muted">
              Opening this page does not subscribe you. Confirmation links expire after 24 hours.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
