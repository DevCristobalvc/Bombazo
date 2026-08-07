import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Todo el stack del login (React + Privy + su enorme árbol web3) se
        // agrupa en un ÚNICO chunk `login-*`, que se carga diferido solo al
        // iniciar sesión y se EXCLUYE del precache del PWA (ver globIgnores).
        // Las deps que el juego sí usa (Supabase, peerjs, qrcode) quedan fuera
        // para no romper su carga diferida propia.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules[\\/](@supabase|peerjs|qrcode)[\\/]/.test(id)) return;
          return 'login';
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'og.png'],
      manifest: {
        name: 'Bombazo — Tanda de Penales',
        short_name: 'Bombazo',
        description: 'Tanda de penales estilo Mundial 2026. Patea, ataja y gana el torneo.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#04081a',
        theme_color: '#0d1f4d',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // El stack del login (React + Privy) es pesado y OPCIONAL: carga bajo
        // demanda solo al iniciar sesión. No lo precacheamos para no inflar la
        // instalación del PWA; se sirve por red cuando hace falta.
        globIgnores: ['**/login-*.js', '**/privyBridge-*.js'],
        // Fuentes de Google cacheadas en runtime para jugar offline con la tipografía correcta
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
