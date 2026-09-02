// Platform checks for the one place the web genuinely differs: iOS push.
//
// Safari exposes the Notification and Push APIs only inside a web app installed
// to the Home Screen, and only on iOS 16.4+. In a normal Safari tab there is no
// permission to request and no error to catch — notifications simply never
// arrive, with nothing on screen to explain why.

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  // iPadOS 13+ reports itself as a Mac, so the touch check is what separates an
  // iPad from a desktop Safari.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
}

// True when running as an installed app rather than in a browser tab. iOS uses
// its own non-standard flag; everyone else reports the display mode.
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// An iPhone or iPad browsing in Safari can never receive push until the app is
// installed — so the honest thing to show is how to install it, not a button
// that would do nothing.
export function needsIOSInstallForPush(): boolean {
  return isIOS() && !isStandalone()
}
