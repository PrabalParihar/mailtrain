import Link from 'next/link';
import { ArrowUpRight, Layers3, PenLine, ScanLine } from 'lucide-react';
import { product } from '@/config/product';
import { Logo } from '@/ui/logo';
export default function Landing() {
  return (
    <main id="main" className="landing">
      <header>
        <Logo />
        <nav aria-label="Product navigation">
          <Link href="/docs">Documentation</Link>
          <Link href="/status">Status</Link>
          <Link className="button primary" href="/app">
            Open workspace <ArrowUpRight size={18} />
          </Link>
        </nav>
      </header>
      <section className="landing-hero">
        <p className="eyebrow">A WORKSPACE FOR THOUGHTFUL EMAIL</p>
        <h1>
          Give your next email
          <br />
          <em>a little more craft.</em>
        </h1>
        <p className="lead">
          Bring your brand, shape the story, and review the exact version you export. Your creative
          work stays in your hands.
        </p>
        <Link className="button primary large" href="/app">
          Enter the workshop <ArrowUpRight size={20} />
        </Link>
        <p className="muted">Development preview · {product.name} is in development</p>
      </section>
      <section className="landing-cards">
        <article>
          <Layers3 />
          <h2>Start with your brand</h2>
          <p>Confirm your colors, voice and approved facts in a versioned brand kit.</p>
        </article>
        <article>
          <PenLine />
          <h2>Keep control of the draft</h2>
          <p>Save, compare and restore versions. AI proposes changes for you to review.</p>
        </article>
        <article>
          <ScanLine />
          <h2>Understand the evidence</h2>
          <p>
            See blockers and missing checks separately. Browser previews are labeled simulations.
          </p>
        </article>
      </section>
      <footer>
        <span>{product.name} · Built for permission-based email</span>
        <Link href="/legal">Legal & availability</Link>
        <Link href="/support">Support</Link>
      </footer>
    </main>
  );
}
