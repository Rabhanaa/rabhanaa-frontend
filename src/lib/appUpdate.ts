// Manual "check for updates" for the installed PWA.
//
// PWAUpdatePrompt already polls every 60s and offers a toast, but that only
// helps if the poll happens to catch a new worker while the app is open. A user
// looking at a stale build has no way to ask for the new one — which is exactly
// how a shipped fix can appear not to have shipped.
//
// A new worker installs and then waits — sw.ts does not skipWaiting() on its
// own, because that wait is what lets the app ask before replacing itself. So
// this has to trigger the check, tell the waiting worker to take over, wait for
// it to activate, then reload for the new assets.

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

      const takeOver = () => {
        // Only a worker that has finished installing can be told to activate;
        // asking earlier is silently ignored and the button would hang until
        // the timeout.
        if (incoming.state === 'installed') incoming.postMessage({ type: 'SKIP_WAITING' });
      };

      incoming.addEventListener('statechange', () => {
        takeOver();
        if (incoming.state === 'activated' || incoming.state === 'redundant') {
          clearTimeout(timer);
          resolve();
        }
      });
      takeOver(); // it may already be waiting from an earlier visit
    });
  }

  // The new worker controls the page, but this document is still the old HTML
  // holding old asset URLs, so a reload is what actually swaps the app.
  window.location.reload();
  return 'updated';
}
