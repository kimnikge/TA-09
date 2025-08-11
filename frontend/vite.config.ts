import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import 'core-js/stable'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    // Настройки для стабильной работы WebSocket
    watch: {
      usePolling: false, // Отключаем polling для лучшей производительности
      interval: 1000,
    }
  },
  build: {
    target: ['es2015', 'chrome61', 'safari11', 'firefox60', 'edge79'], // Расширенная поддержка браузеров
    modulePreload: {
      polyfill: true
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Оставляем console для отладки на Android
        drop_debugger: true,
        ecma: 2015, // ES2015 для лучшей совместимости
      },
      mangle: {
        safari10: true
      },
      format: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React библиотеки в отдельный чанк (кешируется браузером)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Supabase в отдельный чанк
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // Иконки в отдельный чанк (могут быть большими)
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Админ компоненты в отдельный чанк (загружается только когда нужно)
          if (id.includes('/admin/') || id.includes('AdminAccess')) {
            return 'admin';
          }
          
          // Страницы в отдельные чанки
          if (id.includes('pages/OrderPage') || id.includes('OrderPage')) {
            return 'order-page';
          }
          
          if (id.includes('pages/ClientsPage') || id.includes('ClientsPage')) {
            return 'clients-page';
          }
          
          // Утилиты
          if (id.includes('papaparse') || id.includes('dotenv') || id.includes('utils/')) {
            return 'utils';
          }
          
          // Остальные node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Оптимизация имен файлов для лучшего кеширования
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Улучшаем сжатие и производительность
    sourcemap: false, // Отключаем sourcemap в продакшене
    reportCompressedSize: false, // Ускоряем сборку
    chunkSizeWarningLimit: 300, // Уменьшаем лимит для предупреждений
    assetsInlineLimit: 4096 // Инлайним мелкие файлы
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Явно определяем переменные окружения
    __VITE_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'),
    __VITE_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'),
  },
  preview: {
    port: 5173,
    host: 'localhost',
  },
  // Добавляем совместимость с Netlify
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['@supabase/supabase-js']
  },
  // Исправляем проблемы с ESM модулями
  esbuild: {
    target: 'es2020',
    format: 'esm'
  }
})
