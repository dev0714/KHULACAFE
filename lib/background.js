import 'server-only'
import { waitUntil } from '@vercel/functions'

// Run slow side work (emails, notifications) after the response has been
// sent. On Vercel, waitUntil keeps the function alive until it finishes;
// elsewhere the promise simply runs on its own. Errors are logged, never
// thrown, so a mail problem can never break the action that triggered it.
export function inBackground(label, work) {
  const p = Promise.resolve()
    .then(work)
    .catch((e) => console.error(`[${label}]`, e))
  try { waitUntil(p) } catch { /* not on Vercel */ }
  return p
}
