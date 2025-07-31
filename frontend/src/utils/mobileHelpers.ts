/**
 * Простые утилиты для работы с мобильными устройствами
 */

// Детекция мобильного устройства
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Проверка User Agent
  const userAgent = navigator.userAgent || ''
  
  // Проверка на мобильные устройства
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  
  // Проверка размера экрана
  const screenWidth = window.innerWidth
  const isMobileScreen = screenWidth <= 768
  
  // Проверка touch событий
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return mobileRegex.test(userAgent) || (isMobileScreen && hasTouch)
}

// Детекция iOS устройств
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(userAgent)
}

// Детекция Android устройств
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent || ''
  return /android/i.test(userAgent)
}

// Адаптация для мобильных устройств
export const adaptForMobile = () => {
  if (typeof window === 'undefined') return
  
  // Специальные оптимизации для Android
  if (isAndroid()) {
    // Отключаем консольные логи в production на Android
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {}
      console.warn = () => {}
      console.error = () => {}
    }
    
    // Принудительно устанавливаем высоту для Android
    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
  }
  
  // Предотвращаем зум при двойном тапе
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = new Date().getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, false)
  
  // Предотвращаем зум при пинче
  document.addEventListener('touchmove', (event) => {
    if (event.touches && event.touches.length > 1) {
      event.preventDefault()
    }
  }, { passive: false })
  
  // Фиксируем высоту для мобильных браузеров
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', setVH)
  
  console.log('📱 Мобильная адаптация применена')
}

// Детекция сетевого соединения
export const getNetworkStatus = () => {
  if (typeof navigator === 'undefined') return { online: true, connection: 'unknown' }
  
  return {
    online: navigator.onLine,
    connection: 'unknown' // Упрощенная версия
  }
}

// Обработка ошибок на мобильных устройствах
export const handleMobileError = (error: Error) => {
  console.error('🚨 Мобильная ошибка:', error)
  
  // Показываем пользовательскую ошибку
  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return 'Проблемы с интернет соединением. Проверьте подключение и попробуйте снова.'
  }
  
  if (error.message.includes('Auth') || error.message.includes('token')) {
    return 'Проблемы с авторизацией. Попробуйте перезагрузить приложение.'
  }
  
  return 'Произошла ошибка. Попробуйте позже или обратитесь к поддержке.'
}

// Вибрация для мобильных устройств
export const vibrate = (pattern: number | number[] = 100) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

// Проверка поддержки Service Worker
export const supportsServiceWorker = (): boolean => {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

// Проверка поддержки Web App Manifest
export const supportsWebAppManifest = (): boolean => {
  return typeof window !== 'undefined' && 'applicationCache' in window
}

// Получение информации об устройстве
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return null
  
  return {
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent || '',
    online: navigator.onLine,
    supportsTouch: 'ontouchstart' in window,
    supportsServiceWorker: supportsServiceWorker(),
    supportsWebAppManifest: supportsWebAppManifest()
  }
}
