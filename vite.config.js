import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: {
        main:          resolve(__dirname, 'index.html'),
        login:         resolve(__dirname, 'login.html'),
        register:      resolve(__dirname, 'register.html'),
        booking:       resolve(__dirname, 'booking.html'),
        dashboard:     resolve(__dirname, 'dashboard.html'),
        admin:         resolve(__dirname, 'admin.html'),
        'my-bookings': resolve(__dirname, 'my-bookings.html'),
      }
    }
  }
})