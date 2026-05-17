import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined

export const VAPID_KEY: string = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''

// Firebase is only initialized when all required env vars are present.
// The app runs normally without them — push notifications are silently skipped.
export const firebaseConfigured = Boolean(apiKey)

export const messaging = firebaseConfigured
  ? getMessaging(
      initializeApp({
        apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })
    )
  : null
