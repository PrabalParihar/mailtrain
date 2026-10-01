import Link from 'next/link';
import { Logo } from '@/ui/logo';
export default function Status() {
  return (
    <main id="main" className="docs-page">
      <header>
        <Logo />
        <Link href="/app">Workspace</Link>
      </header>
      <h1>Development status</h1>
      <p className="alert warning">
        Lettercape has not launched publicly. This page is a capability disclosure, not an
        operational uptime monitor.
      </p>
      <table>
        <thead>
          <tr>
            <th>Surface</th>
            <th>Current status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Local creation/editor</td>
            <td>Implemented; verification in progress</td>
          </tr>
          <tr>
            <td>AI generation</td>
            <td>Provider and approved allowance required</td>
          </tr>
          <tr>
            <td>Real-client preview</td>
            <td>Procurement and 20-profile evidence required</td>
          </tr>
          <tr>
            <td>ESP export</td>
            <td>Five authenticated adapter conformance tracks required</td>
          </tr>
          <tr>
            <td>Sending and delivery</td>
            <td>Disabled; provider, consent, authorization and operational gates required</td>
          </tr>
          <tr>
            <td>Billing</td>
            <td>Unconfigured; prices and spending limits not approved</td>
          </tr>
          <tr>
            <td>Public production</td>
            <td>Release gates incomplete</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
