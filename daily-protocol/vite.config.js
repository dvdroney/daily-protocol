import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/daily-protocol/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Daily Protocol',
        short_name: 'Protocol',
        description: 'Daily health & appearance routine checklist',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/daily-protocol/',
        icons: [
          { src: '/daily-protocol/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/daily-protocol/icons/icon-192.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/daily-protocol/icons/icon-192.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
