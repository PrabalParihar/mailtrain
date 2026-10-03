import Link from 'next/link';
import { Logo } from '@/ui/logo';
export default function Docs() {
  return (
    <main id="main" className="docs-page">
      <header>
        <Logo />
        <Link className="button" href="/app">
          Open workspace
        </Link>
      </header>
      <p className="eyebrow">CURRENT AVAILABILITY · DEVELOPMENT BUILD</p>
      <h1>From brand to a reviewed draft.</h1>
      <p>
        Lettercape currently supports local authenticated workspaces, editable versioned brand kits,
        typed email blocks, server-acknowledged draft saves, immutable checkpoints, browser
        simulations and frozen HTML/plaintext/PNG/PDF downloads.
      </p>
      <nav className="docs-contents" aria-label="On this page">
        <ul>
          <li><a href="#first-email">Create an email</a></li>
          <li><a href="#save-review">Save and review</a></li>
          <li><a href="#keyboard-mobile">Keyboard and mobile</a></li>
          <li><a href="#provider-setup">Provider setup</a></li>
          <li><a href="#development-api">Development API</a></li>
        </ul>
      </nav>
      <h2 id="first-email">Create your first email</h2>
      <ol>
        <li>
          Open the local workspace using the private access key in this Mac’s .env.local. Production
          sign-in needs a configured identity account.
        </li>
        <li>
          In Brand, enter your name, colors, email-safe font, voice, approved claims and sender
          postal address. Confirm a version.
        </li>
        <li>
          In Emails, start with a blank draft. AI proposals need a configured model and finite
          approved allowance.
        </li>
        <li>
          Edit the subject, preheader and block content. Use the Outline and Move up/down controls.
          “Saved” means the server acknowledged your version.
        </li>
        <li>
          Create a checkpoint and run Review and check. Missing real-client evidence remains
          incomplete.
        </li>
        <li>
          Download a frozen version. Replace unresolved personalization/unsubscribe slots in your
          recipient system before sending. Browser image/PDF exports block remote imagery and are
          simulations.
        </li>
      </ol>
      <h2 id="save-review">Save, review and recover</h2>
      <p>
        Wait for “Saved” before leaving the editor. A local or pending change has not yet been
        acknowledged by the server. If the email list cannot load, use “Retry loading emails”;
        an unavailable list does not mean your drafts were deleted.
      </p>
      <p>
        Stale If-Match saves fail. A conflict preserves your local work and offers a recovered copy
        or reload. Restoring a checkpoint creates a new draft head. Raw HTML stays in raw mode and
        is sanitized; VML and complex layout round-trip fidelity remain unverified.
      </p>
      <p>
        A checkpoint freezes a version for review and download. Editing afterwards creates newer
        work; repeat the checks for that version. A downloaded file or exported draft does not send
        email, and a browser preview does not establish how a real email client renders it.
      </p>
      <h2 id="keyboard-mobile">Keyboard and smaller screens</h2>
      <p>
        Use “Skip to content” to reach the main workspace. On smaller screens, “Open navigation”
        reveals the workspace picker and screen links. Scroll inside that panel to reach Settings
        and Help. “Close navigation” or Escape closes it and returns focus to the navigation button.
        In the editor, select a block in Outline and use Move up or Move down instead of dragging.
      </p>
      <p>
        Desktop and mobile canvas controls show the same draft at different preview widths. They do
        not change the email’s recipient device or count as real-client checks. Browser text sizing
        and reduced-motion preferences are supported in the workspace; a full accessibility audit
        and assistive-technology review are still required before launch.
      </p>
      <h2>Capabilities requiring release evidence</h2>
      <p>
        Google/password/magic-link identity configuration, invitations, SSO/MFA recovery, realtime
        collaboration, media generation and immutable assets, full translation review, 20-profile
        real email-client testing, five ESP adapters, four sending providers, live campaigns, signed
        events, billing, full public SDK acceptance, data rights and production operations are
        required by the full GA baseline. They are not claimed as launched.
      </p>
      <h2 id="provider-setup">Provider setup</h2>
      <p>
        Configure credentials privately in your selected secret manager. Do not paste credentials
        into briefs or chat. AI work is refused without a configured provider/model and finite usage
        allowance. No provider submissions, charges, remote exports or marketing campaigns are
        fabricated.
      </p>
      <h2>Safety and consent</h2>
      <p>
        Local audience imports admit reserved fixture addresses only. Missing opt-in stays held, and
        imports never clear suppression. Real lists require approved legal, retention and consent
        rules. Sending is disabled until provider, evidence, approval, cost and operational gates
        pass.
      </p>
      <h2 id="development-api">Development API</h2>
      <p>
        Routes are under /v1. Session requests select X-Workspace-Id; scoped bearer keys are bound
        to one workspace. State-changing browser requests require the configured origin. Draft
        writes use If-Match; keyed commands preserve Idempotency-Key during recovery. Resource lists
        use signed pages. Owner/Admin key controls are available in Settings.
      </p>
      <p>
        <a href="/openapi.json">OpenAPI 3.1 contract</a> documents implemented development routes,
        including explicit provider blocks. The generated TypeScript SDK source supports request
        IDs, bounded recovery, interruption and page iteration. It has not been published as an npm
        package; remaining GA commands, production account setup and acceptance gates stay open.
      </p>
      <Link href="/status">View release status</Link>
      {' · '}
      <Link href="/support">Get help</Link>
    </main>
  );
}
