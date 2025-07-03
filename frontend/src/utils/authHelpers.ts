// Утилиты для работы с аутентификацией

/**
 * Принудительная очистка всех данных аутентификации
 * Используется при критических ошибках токенов
 */
export const forceAuthCleanup = async (): Promise<void> => {
  try {
    // Очищаем весь localStorage
    localStorage.clear()
    
    // Очищаем sessionStorage на всякий случай
    sessionStorage.clear()
    
    // Очищаем cookie если есть (для полной очистки)
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    
    console.log('🧹 Выполнена полная очистка данных аутентификации')
  } catch (error) {
    console.warn('⚠️ Ошибка при очистке данных аутентификации:', error)
  }
}

/**
 * Проверка валидности токена
 */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false
  
  try {
    // Простая проверка формата JWT токена
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Проверяем, что payload можно декодировать
    const payload = JSON.parse(atob(parts[1]))
    
    // Проверяем срок действия токена
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.warn('🕐 Токен истек')
      return false
    }
    
    return true
  } catch (error) {
    console.warn('⚠️ Ошибка валидации токена:', error)
    return false
  }
}

/**
 * Получение токена из localStorage с проверкой валидности
 */
export const getValidTokenFromStorage = (): string | null => {
  try {
    // Проверяем разные возможные ключи для токенов Supabase
    const possibleKeys = [
      'sb-olutrxiazrmanrgzzwmb-auth-token',
      'supabase.auth.token',
      'sb-auth-token'
    ]
    
    for (const key of possibleKeys) {
      const tokenData = localStorage.getItem(key)
      if (tokenData) {
        try {
          const parsed = JSON.parse(tokenData)
          const accessToken = parsed.access_token || parsed.accessToken
          
          if (isTokenValid(accessToken)) {
            return accessToken
          } else {
            // Удаляем невалидный токен
            localStorage.removeItem(key)
          }
        } catch {
          // Если это не JSON, проверяем как обычную строку
          if (isTokenValid(tokenData)) {
            return tokenData
          } else {
            localStorage.removeItem(key)
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.warn('⚠️ Ошибка при получении токена:', error)
    return null
  }
}

/**
 * Безопасная проверка статуса аутентификации
 */
export const checkAuthStatus = async (): Promise<'authenticated' | 'unauthenticated' | 'error'> => {
  try {
    // Проверяем наличие валидного токена в localStorage
    const token = getValidTokenFromStorage()
    
    if (!token) {
      return 'unauthenticated'
    }
    
    return 'authenticated'
  } catch (error) {
    console.error('❌ Ошибка проверки статуса аутентификации:', error)
    return 'error'
  }
}
