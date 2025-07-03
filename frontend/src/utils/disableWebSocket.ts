/**
 * Утилита для отключения WebSocket соединений
 * Предотвращает ошибки WebSocket в среде разработки
 */

// Переопределяем глобальный WebSocket для блокировки соединений
export const disableWebSocket = () => {
  try {
    // Сохраняем оригинальный WebSocket
    const OriginalWebSocket = window.WebSocket
    
    // Создаем заглушку для WebSocket
    const MockWebSocket = class extends EventTarget {
      constructor(url: string | URL) {
        super()
        console.warn('🚫 WebSocket соединение заблокировано:', url)
        
        // Имитируем закрытие соединения
        setTimeout(() => {
          const event = new Event('close')
          this.dispatchEvent(event)
        }, 100)
      }
      
      close() {
        console.log('🔌 WebSocket соединение закрыто')
      }
      
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        console.warn('⚠️ Попытка отправки данных через заблокированный WebSocket:', data)
      }
      
      get readyState() {
        return WebSocket.CLOSED
      }
      
      get url() {
        return ''
      }
      
      get protocol() {
        return ''
      }
      
      get extensions() {
        return ''
      }
      
      get bufferedAmount() {
        return 0
      }
      
      get binaryType() {
        return 'blob'
      }
      
      set binaryType(_value: BinaryType) {
        // Игнорируем установку
      }
    }
    
    // Копируем статические свойства
    Object.assign(MockWebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    })
    
    // Заменяем глобальный WebSocket
    window.WebSocket = MockWebSocket as typeof WebSocket
    
    console.log('🛡️ WebSocket соединения отключены')
    
    // Возвращаем функцию для восстановления
    return () => {
      window.WebSocket = OriginalWebSocket
      console.log('🔄 WebSocket соединения восстановлены')
    }
  } catch (error) {
    console.error('❌ Ошибка при отключении WebSocket:', error)
    return () => {}
  }
}

// Блокируем EventSource для полного отключения realtime
export const disableEventSource = () => {
  try {
    const OriginalEventSource = window.EventSource
    
    const MockEventSource = class extends EventTarget {
      constructor(url: string | URL) {
        super()
        console.warn('🚫 EventSource соединение заблокировано:', url)
        
        setTimeout(() => {
          const event = new Event('error')
          this.dispatchEvent(event)
        }, 100)
      }
      
      close() {
        console.log('🔌 EventSource соединение закрыто')
      }
      
      get readyState() {
        return EventSource.CLOSED
      }
      
      get url() {
        return ''
      }
      
      get withCredentials() {
        return false
      }
    }
    
    Object.assign(MockEventSource, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    })
    
    window.EventSource = MockEventSource as typeof EventSource
    
    console.log('🛡️ EventSource соединения отключены')
    
    return () => {
      window.EventSource = OriginalEventSource
      console.log('🔄 EventSource соединения восстановлены')
    }
  } catch (error) {
    console.error('❌ Ошибка при отключении EventSource:', error)
    return () => {}
  }
}

// Полное отключение всех realtime соединений
export const disableAllRealtime = () => {
  const restoreWebSocket = disableWebSocket()
  const restoreEventSource = disableEventSource()
  
  return () => {
    restoreWebSocket()
    restoreEventSource()
  }
}
