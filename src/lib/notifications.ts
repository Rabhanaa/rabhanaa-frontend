import { getToken, deleteToken } from 'firebase/messaging'
import { messaging, VAPID_KEY, firebaseConfigured } from './firebase'
import { api } from './api'

function pushSupported(): boolean {
  return (
    firebaseConfigured &&
    !!messaging &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

// Sends the device's current FCM token to the backend.
//
// This has to run regularly, not just once. FCM tokens rotate and expire, and
// the backend deactivates any token that FCM reports as unregistered — so
// without a refresh a user eventually holds zero active tokens and silently
// stops receiving push forever. The Firebase v9 SDK removed onTokenRefresh;
// calling getToken on each app load is the documented replacement.
//
// The backend upserts and flips is_active back to true, so repeat calls are
// idempotent and also revive a token that was previously deactivated.
async function syncToken(): Promise<void> {
  if (!messaging) return
  const swReg = await navigator.serviceWorker.ready
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
  if (!token) return
  await api.post('/notifications/device-token', { token, platform: 'web' })
}

// Safe to call on every app start: it never prompts, so it cannot trigger a
// permission dialog without a user gesture. Does nothing until the user has
// already granted permission.
export async function ensurePushToken(): Promise<void> {
  if (!pushSupported()) return
  if (Notification.permission !== 'granted') return
  await syncToken()
}

// Prompts for permission — only call from a user-initiated flow.
export async function registerPushToken(): Promise<void> {
  if (!pushSupported()) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  await syncToken()
}

export async function deregisterPushToken(): Promise<void> {
  if (!pushSupported() || !messaging) return
  try {
    const swReg = await navigator.serviceWorker.getRegistration('/')
    if (!swReg) return
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (token) {
      await api.delete('/notifications/device-token', { token })
      await deleteToken(messaging)
    }
  } catch {
    // non-critical
  }
}
