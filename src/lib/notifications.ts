import { getToken, deleteToken } from 'firebase/messaging'
import { messaging, VAPID_KEY, firebaseConfigured } from './firebase'
import { api } from './api'

export async function registerPushToken(): Promise<void> {
  if (!firebaseConfigured || !messaging) return
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  // VitePWA's unified SW (sw.ts) handles both precaching and FCM background messages.
  // ready resolves once it is active and controlling the page — no manual registration needed.
  const swReg = await navigator.serviceWorker.ready
  console.log('[push] SW active:', swReg.active?.scriptURL, 'scope:', swReg.scope)

  console.log('[push] Calling getToken...')
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
  console.log('[push] getToken result:', token ? 'got token' : 'empty token')
  if (!token) return

  console.log('[push] Sending token to backend...')
  await api.post('/notifications/device-token', { token, platform: 'web' })
  console.log('[push] Done.')
}

export async function deregisterPushToken(): Promise<void> {
  if (!firebaseConfigured || !messaging) return
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
