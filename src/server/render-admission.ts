import { fail } from './errors';
// Non-blocking process admission keeps renderer work below the shared pool size.
// Durable distributed fairness remains a separate release acceptance obligation.
let active = 0;
export async function withRenderSlot<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
  if (signal.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
  if (active >= 2) fail(429, 'RENDER_BUSY', 'Renderer capacity is busy. Retry the same frozen export later.', { retry_after: 2 });
  active++;
  try { return await work(); } finally { active--; }
}
