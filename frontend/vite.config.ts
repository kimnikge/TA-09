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
          // React библиотеки
          vendor: ['react', 'react-dom'],
          // Supabase
          supabase: ['@supabase/supabase-js'],
          // Иконки (может быть большой)
          icons: ['lucide-react'],
          // Утилиты для работы с данными
          utils: ['papaparse']
        }
      }
    },
    // Улучшаем сжатие и производительность
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500
  },
  define: {
    global: 'globalThis',
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
