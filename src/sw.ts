/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { resolveNotificationLink } from './lib/notificationLink'

declare const self: ServiceWorkerGlobalScope

// Activate immediately — no waiting for old SW clients to close
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Workbox precache — VitePWA injects the manifest array here at build time
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA navigation fallback — serve precached index.html for all navigation requests
// except API calls and direct asset URLs (files with extensions).
//
// Production only. createHandlerBoundToURL throws unless index.html is in the
// precache manifest, and in dev that manifest is empty — the throw happens
// during install, so the whole worker dies and takes the FCM handler below with
// it. Skipping it also keeps Vite's dev server in charge of navigation, which
// is what we want with HMR.
if (import.meta.env.PROD) {
  const navHandler = createHandlerBoundToURL('index.html')
  const navRoute = new NavigationRoute(navHandler, {
    denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
  })
  registerRoute(navRoute)
}

// Firebase Cloud Messaging background handler
const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
})

const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  self.registration.showNotification(payload.data?._title ?? payload.notification?.title ?? '', {
    body:  payload.data?._body ?? payload.notification?.body,
    icon:  '/icon-192x192.png',
    badge: '/icon-192x192.png',
    dir:   'rtl',
    lang:  'ar',
    data:  payload.data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as Record<string, unknown>
  const url = resolveNotificationLink(data) ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          ;(client as WindowClient).navigate(url)
          return (client as WindowClient).focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
