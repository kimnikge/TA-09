/**
 * Тип для объекта ошибки
 */
interface ErrorLike {
  message?: string;
  code?: string;
}

/**
 * Проверяет, является ли ошибка связанной с RLS (Row Level Security)
 * @param error Объект ошибки
 * @returns true если это RLS ошибка
 */
export const isRLSError = (error: unknown): boolean => {
  const err = error as ErrorLike;
  return Boolean(err?.message?.includes('row-level security') || 
                err?.message?.includes('policy') ||
                err?.code === 'PGRST301');
};

/**
 * Проверяет, является ли ошибка сетевой ошибкой
 * @param error Объект ошибки  
 * @returns true если это сетевая ошибка
 */
export const isNetworkError = (error: unknown): boolean => {
  const err = error as ErrorLike;
  return Boolean(err?.message?.includes('Load failed') || 
                err?.message?.includes('TypeError') ||
                err?.message?.includes('NetworkError') ||
                err?.message?.includes('fetch'));
};

/**
 * Создает стандартизированное сообщение об ошибке RLS
 * @param operation Тип операции (обновление, удаление и т.д.)
 * @returns Сообщение об ошибке
 */
export const createRLSErrorMessage = (operation: string): string => {
  return `Недостаточно прав для ${operation}. Возможно, вы не являетесь администратором.`;
};

/**
 * Обрабатывает ошибку и возвращает пользовательское сообщение
 * @param error Объект ошибки
 * @param context Контекст операции
 * @returns Понятное пользователю сообщение об ошибке
 */
export const handleError = (error: unknown, context: string): string => {
  console.error(`❌ ErrorHandler [${context}]:`, error);
  
  if (isNetworkError(error)) {
    return 'Проблема с сетью. Проверьте подключение к интернету и попробуйте позже.';
  }
  
  if (isRLSError(error)) {
    return 'Недостаточно прав доступа. Обратитесь к администратору.';
  }
  
  const err = error as ErrorLike;
  if (err?.message?.includes('не авторизован')) {
    return 'Сессия истекла. Пожалуйста, войдите в систему заново.';
  }
  
  return error instanceof Error ? error.message : 'Неизвестная ошибка. Попробуйте позже.';
};
