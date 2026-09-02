import { initializeApp } from 'firebase/app'
import { getMessaging, type Messaging } from 'firebase/messaging'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined

export const VAPID_KEY: string = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''

// Firebase is only initialized when all required env vars are present.
// The app runs normally without them — push notifications are silently skipped.
export const firebaseConfigured = Boolean(apiKey)

// getMessaging() throws messaging/unsupported-browser wherever the Push API is
// missing, and this module is imported transitively by App.tsx — so an
// unguarded call takes the entire app down rather than just disabling
// notifications.
//
// That is not hypothetical: iOS exposes the Notification API only inside an
// installed web app, so every iPhone visitor arriving through Safari — which is
// what public browsing (#4) invites — hits the unsupported path.
function initMessaging(): Messaging | null {
  if (!firebaseConfigured) return null
  try {
    return getMessaging(
      initializeApp({
        apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })
    )
  } catch {
    // Browsing works; only push is unavailable. pushSupported() already treats a
    // null messaging instance as "no push", so every caller degrades quietly.
    return null
  }
}

export const messaging = initMessaging()
