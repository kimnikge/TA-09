import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Добавляем проверку на существование root элемента
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)

// Убираем StrictMode для лучшей совместимости с Safari
root.render(<App />)
