import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

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
