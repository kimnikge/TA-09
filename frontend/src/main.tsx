// Полифиллы для лучшей поддержки Android браузеров
import 'core-js/stable';

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

// Обработка ошибок для Android
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Проверка совместимости с Android
const isAndroid = /Android/.test(navigator.userAgent);
if (isAndroid) {
  console.log('Android device detected, applying compatibility fixes');
}

// Инициализируем систему логирования в dev режиме
if (import.meta.env.DEV) {
  import('./utils/loggerTest');
}

// Добавляем проверку на существование root элемента
const container = document.getElementById('root')
if (!container) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Root element not found')
  }
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Root element not found</div>'
  throw new Error('Root element not found')
}

const root = createRoot(container)

// Оборачиваем приложение в ErrorBoundary для ловли ошибок
try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Ошибка рендеринга:', error)
  }
  throw error
}
