import { log } from './logger';

/**
 * Централизованная обработка RLS (Row Level Security) ошибок
 * Унифицирует обработку ошибок доступа к данным
 */

export interface RLSError {
  isRLSError: boolean;
  message: string;
  originalError?: unknown;
  suggestion?: string;
}

/**
 * Проверяет, является ли ошибка RLS ошибкой
 */
export const isRLSError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = 'message' in error ? String(error.message) : '';
  
  return errorMessage.includes('row-level security') ||
         errorMessage.includes('policy') ||
         errorMessage.includes('RLS') ||
         errorMessage.includes('permission denied') ||
         errorMessage.includes('insufficient_privilege');
};

/**
 * Проверяет, является ли ошибка сетевой ошибкой
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = 'message' in error ? String(error.message) : '';
  
  return errorMessage.includes('Load failed') ||
         errorMessage.includes('Network') ||
         errorMessage.includes('fetch') ||
         errorMessage.includes('Connection') ||
         errorMessage.includes('TypeError');
};

/**
 * Создает понятное сообщение об RLS ошибке
 */
export const createRLSErrorMessage = (operation: string): string => {
  return `Недостаточно прав для ${operation}. Обратитесь к администратору.`;
};

/**
 * Создает понятное сообщение о сетевой ошибке
 */
export const createNetworkErrorMessage = (): string => {
  return 'Проблема с подключением к серверу. Попробуйте обновить страницу или очистить кэш браузера.';
};

/**
 * Основная функция обработки ошибок
 */
export const handleError = (error: unknown, context: string): RLSError => {
  log.error(`Обработка ошибки в контексте: ${context}`, { error }, 'ERROR_HANDLER');
  
  if (isRLSError(error)) {
    const message = createRLSErrorMessage(context);
    log.warn(`RLS ошибка в ${context}`, { originalError: error }, 'RLS');
    
    return {
      isRLSError: true,
      message,
      originalError: error,
      suggestion: 'Проверьте права доступа или обратитесь к администратору'
    };
  }
  
  if (isNetworkError(error)) {
    const message = createNetworkErrorMessage();
    log.warn(`Сетевая ошибка в ${context}`, { originalError: error }, 'NETWORK');
    
    return {
      isRLSError: false,
      message,
      originalError: error,
      suggestion: 'Проверьте интернет-соединение или попробуйте другой браузер'
    };
  }
  
  // Обычная ошибка
  const message = error instanceof Error 
    ? error.message 
    : `Неизвестная ошибка в ${context}`;
  
  log.error(`Общая ошибка в ${context}`, { originalError: error }, 'GENERAL');
  
  return {
    isRLSError: false,
    message,
    originalError: error,
    suggestion: 'Попробуйте еще раз или обратитесь в поддержку'
  };
};

/**
 * Обработчик ошибок для операций с пользователями
 */
export const handleUserOperationError = (error: unknown, operation: string): string => {
  const handledError = handleError(error, `операции с пользователями: ${operation}`);
  
  if (handledError.isRLSError) {
    log.warn('Ошибка доступа при операции с пользователем', { 
      operation, 
      suggestion: handledError.suggestion 
    }, 'USER_OPERATION');
  }
  
  return handledError.message;
};

/**
 * Обработчик ошибок для операций с базой данных
 */
export const handleDatabaseError = (error: unknown, table: string, operation: string): string => {
  const context = `работе с таблицей ${table} (${operation})`;
  const handledError = handleError(error, context);
  
  log.db(`Ошибка базы данных: ${table}.${operation}`, { 
    table, 
    operation, 
    errorType: handledError.isRLSError ? 'RLS' : 'General' 
  });
  
  return handledError.message;
};

/**
 * Обработчик ошибок для операций аутентификации
 */
export const handleAuthError = (error: unknown, operation: string): string => {
  const handledError = handleError(error, `аутентификации: ${operation}`);
  
  log.auth(`Ошибка аутентификации: ${operation}`, { 
    errorType: handledError.isRLSError ? 'RLS' : 'Auth',
    suggestion: handledError.suggestion
  });
  
  return handledError.message;
};

/**
 * Wrapper для безопасного выполнения операций с обработкой ошибок
 */
export const safeExecute = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const result = await operation();
    log.debug(`Операция выполнена успешно: ${context}`, undefined, 'SAFE_EXECUTE');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    const handledError = handleError(error, context);
    
    return {
      success: false,
      error: handledError.message,
      data: fallbackValue
    };
  }
};
