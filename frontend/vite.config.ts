import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['safari11', 'es2017'],
    modulePreload: {
      polyfill: true
    },
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
    // Полифилл для crypto.randomUUID для старых браузеров
    'crypto.randomUUID': `(() => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID.bind(crypto);
      }
      return () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    })()`,
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      // Исправляем проблемы с WebSocket
      port: 5173,
    },
    // Настройки для стабильной работы WebSocket
    watch: {
      usePolling: false, // Отключаем polling для лучшей производительности
      interval: 1000,
    },
    // Настройки для предотвращения конфликтов портов
    strictPort: false,
  },
  preview: {
    port: 5173,
    host: true,
  }
})
