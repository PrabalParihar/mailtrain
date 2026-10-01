'use client';
import { useRef, useState } from 'react';
import type { readPreference } from '@/server/preferences';
export function PreferenceControls({
  token,
  pref,
}: {
  token: string;
  pref: Awaited<ReturnType<typeof readPreference>>;
}) {
  const [version, setVersion] = useState(pref.version),
    [statuses, setStatuses] = useState(pref.topics),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const running = useRef(false);
  const action = '/preferences/' + encodeURIComponent(token) + '/save';
  return (
    <form
      className="preference-controls"
      action={action}
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        if (running.current) return;
        running.current = true;
        setBusy(true);
        setError('');
        setMessage('');
        const data = new URLSearchParams();
        new FormData(e.currentTarget).forEach((value, key) => {
          if (typeof value === 'string') data.append(key, value);
        });
        try {
          const response = await fetch(action, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? 'Preferences could not be saved.');
          setVersion(result.version);
          setStatuses((current) =>
            current.map((topic) => ({
              ...topic,
              subscription:
                result.topic_statuses.find(
                  (saved: { id: string; subscription: string }) => saved.id === topic.id,
                )?.subscription ?? 'unsubscribed',
            })),
          );
          setMessage(
            result.confirmation_requested
              ? 'Preferences saved. New subscriptions remain pending. Confirmation delivery is not configured; no confirmation email was sent.'
              : 'Preferences saved. Your current global permission and blocks still apply.',
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'Could not save. Your choices remain here; retry when connected.',
          );
        } finally {
          running.current = false;
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="expected_version" value={version} />
      <fieldset disabled={busy || pref.topics_unavailable}>
        <legend>Email topics</legend>
        {pref.topics.length ? (
          statuses.map((topic) => (
            <label className="preference-topic" key={topic.id}>
              <input
                type="checkbox"
                name="topics"
                value={topic.id}
                defaultChecked={topic.subscription !== 'unsubscribed'}
              />
              <span>
                {topic.name}{' '}
                <small className="muted">
                  {topic.subscription === 'subscribed'
                    ? 'Confirmed'
                    : topic.subscription === 'pending_confirmation'
                      ? 'Pending confirmation'
                      : 'Not subscribed'}
                </small>
              </span>
            </label>
          ))
        ) : (
          <p>No topics are available from this sender.</p>
        )}
        <label>
          Maximum email frequency
          <select name="frequency" defaultValue={pref.frequency}>
            <option value="daily">Daily · at most 1 per rolling 24 hours</option>
            <option value="weekly">Weekly · at most 1 per rolling 7 days</option>
            <option value="monthly">Monthly · at most 1 per rolling 30 days</option>
          </select>
        </label>
        {pref.global_unsubscribed && (
          <label className="preference-topic">
            <input type="checkbox" name="reactivate_global" value="yes" />
            <span>
              Request deliberate re-opt-in to global marketing. Permission stays off until a new
              confirmation is completed.
            </span>
          </label>
        )}
        <p className="small muted">
          Adding a topic requires confirmed permission. Confirmation delivery is not configured; no
          email will be sent from this form. These rolling UTC limits apply across marketing
          campaigns from this sender.
        </p>
        <button className="primary">
          {busy ? 'Saving preferences…' : 'Save topic and frequency preferences'}
        </button>
      </fieldset>
      {pref.topics_unavailable && (
        <p className="alert" role="alert">
          Topic controls are unavailable for this sender. You can still unsubscribe from all
          marketing above.
        </p>
      )}
      {message && (
        <p className="alert success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="alert" role="alert">
          {error} Your choices remain here.{' '}
          <a href={'/preferences/' + encodeURIComponent(token)}>Reload current preferences</a>
        </p>
      )}
    </form>
  );
}
