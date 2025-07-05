import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

// Первая проверка - JavaScript загружается
console.log('🔥 MAIN.TSX: JavaScript загружен!')

// Отладочная информация
console.log('🚀 Приложение запускается...')
console.log('📍 Текущий URL:', window.location.href)
console.log('🌐 User Agent:', navigator.userAgent)
console.log('📦 Vite ENV:', import.meta.env)

// Добавляем проверку на существование root элемента
const container = document.getElementById('root')
if (!container) {
  console.error('❌ Root element not found')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Root element not found</div>'
  throw new Error('Root element not found')
}

console.log('✅ Root element найден')

const root = createRoot(container)

// Оборачиваем приложение в ErrorBoundary для ловли ошибок
try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
  console.log('✅ Приложение успешно отрендерено')
} catch (error) {
  console.error('❌ Ошибка рендеринга:', error)
  throw error
}
