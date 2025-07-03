import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

// Добавляем проверку на существование root элемента
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)

// Оборачиваем приложение в ErrorBoundary для ловли ошибок
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
