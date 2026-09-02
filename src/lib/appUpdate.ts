// Manual "check for updates" for the installed PWA.
//
// PWAUpdatePrompt already polls every 60s and offers a toast, but that only
// helps if the poll happens to catch a new worker while the app is open. A user
// looking at a stale build has no way to ask for the new one — which is exactly
// how a shipped fix can appear not to have shipped.
//
// sw.ts calls skipWaiting() on install and clients.claim() on activate, so a new
// worker takes over by itself; all this has to do is trigger the check, wait for
// the takeover, and reload so the page picks up the new assets.

export type UpdateResult = 'updated' | 'current' | 'unsupported';

// Guards against a worker that installs but never activates leaving the button
// spinning forever.
const ACTIVATION_TIMEOUT_MS = 10_000;

export async function checkForAppUpdate(): Promise<UpdateResult> {
  if (!('serviceWorker' in navigator)) return 'unsupported';

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return 'unsupported';

  // Asks the server for the worker script; a changed script starts installing.
  await registration.update();

  const incoming = registration.installing ?? registration.waiting;
  if (!incoming) return 'current';

  if (incoming.state !== 'activated') {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ACTIVATION_TIMEOUT_MS);
      incoming.addEventListener('statechange', () => {
        if (incoming.state === 'activated' || incoming.state === 'redundant') {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  }

  // The new worker controls the page, but this document is still the old HTML
  // holding old asset URLs, so a reload is what actually swaps the app.
  window.location.reload();
  return 'updated';
}
