import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import compression from 'vite-plugin-compression' // Отключаем сжатие - Netlify делает это автоматически

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Убираем сжатие - Netlify автоматически применяет gzip и brotli
    // compression({
    //   algorithm: 'gzip',
    //   ext: '.gz',
    // }),
    // compression({
    //   algorithm: 'brotliCompress',
    //   ext: '.br',
    // })
  ],
  server: {
    host: 'localhost', // Используем localhost для стабильности
    port: 5173,
    strictPort: false,
    cors: true,
    // Упрощенная конфигурация HMR
    hmr: {
      port: 5173, // Используем тот же порт для HMR
      overlay: false // Отключаем overlay для избежания лишних ошибок
    }
  },
  build: {
    target: ['safari11', 'es2017'],
    modulePreload: {
      polyfill: true
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удаляем console.log в продакшене
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'] // Удаляем логи
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
          
          // CSS библиотеки
          if (id.includes('tailwindcss') || id.includes('autoprefixer')) {
            return 'css-libs';
          }
          
          // Админ компоненты в отдельный чанк (загружается только когда нужно)
          if (id.includes('/admin/') || id.includes('AdminAccess')) {
            return 'admin';
          }
          
          // Утилиты
          if (id.includes('papaparse') || id.includes('dotenv')) {
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
  },
  preview: {
    port: 5173,
    host: '0.0.0.0', // Для preview тоже разрешаем подключения с любых устройств
  },
  // Добавляем совместимость с Netlify
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
})
