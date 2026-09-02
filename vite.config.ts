import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt', not 'autoUpdate'. Under autoUpdate the worker activates and
      // reloads the page on its own as soon as a new build appears, and
      // PWAUpdatePrompt polls for one every 60 seconds — so every deploy yanked
      // the page out from under whoever was using it. In the admin panel that
      // means losing a half-typed payment reference to a deploy nobody asked
      // about.
      //
      // It also contradicted the two ways this app already offers to update: the
      // "يوجد تحديث جديد" toast and the تحديث التطبيق button on the profile
      // screen. Both only make sense if the update waits to be asked for.
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Build and register the worker in dev too, otherwise push notifications
      // cannot be tested locally at all: syncToken() awaits
      // navigator.serviceWorker.ready, which never resolves without a
      // registration, so no FCM device token is ever sent to the backend.
      //
      // The dev worker is deliberately inert apart from FCM — the precache
      // manifest is empty and sw.ts skips the navigation route outside a real
      // build — so it does not cache assets or shadow Vite's dev server.
      // type: 'module' is required because sw.ts is ESM.
      devOptions: {
        enabled: true,
        type: 'module',
        suppressWarnings: true,
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['firebase-messaging-sw.js'],
      },
      includeAssets: ['leaf.svg', 'icon-192x192.png', 'icon-512x512.png', 'icon-192x192-maskable.png', 'icon-512x512-maskable.png'],
      manifest: {
        name: 'ربحانة - منصة الصفقات',
        short_name: 'ربحانة',
        description: 'مع ربحانة دايما ربحانة - منصة صفقات B2B في مصر',
        dir: 'rtl',
        lang: 'ar',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#16a34a',
        categories: ['business', 'shopping'],
        icons: [
          { src: 'icon-192x192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png',           sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-192x192-maskable.png',  sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512x512-maskable.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'ربحانة - منصة الصفقات',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
