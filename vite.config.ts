import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
