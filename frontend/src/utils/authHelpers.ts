import { supabase } from '../supabaseClient';
import { log } from './logger';
import type { User } from '@supabase/supabase-js';

interface AuthCheckResult {
  user: User | null;
  success: boolean;
  error?: string;
}

/**
 * Централизованная проверка авторизации пользователя
 * Заменяет дублирующийся код проверки авторизации по всему приложению
 */
export const checkUserAuth = async (): Promise<AuthCheckResult> => {
  try {
    log.auth('Проверка авторизации пользователя');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      log.error('Ошибка при проверке авторизации', { error: authError.message }, 'AUTH');
      return {
        user: null,
        success: false,
        error: authError.message
      };
    }
    
    if (!user) {
      log.warn('Пользователь не авторизован', undefined, 'AUTH');
      return {
        user: null,
        success: false,
        error: 'Пользователь не авторизован'
      };
    }
    
    log.auth('Пользователь успешно авторизован', { userId: user.id, email: user.email });
    
    return {
      user,
      success: true
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка авторизации';
    log.error('Критическая ошибка проверки авторизации', { error: errorMessage }, 'AUTH');
    
    return {
      user: null,
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Проверка прав администратора
 */
export const checkAdminRights = async (): Promise<AuthCheckResult & { isAdmin: boolean }> => {
  const authResult = await checkUserAuth();
  
  if (!authResult.success || !authResult.user) {
    return {
      ...authResult,
      isAdmin: false
    };
  }
  
  try {
    log.auth('Проверка прав администратора', { userId: authResult.user.id });
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.user.id)
      .single();
    
    if (profileError) {
      log.error('Ошибка получения профиля пользователя', { error: profileError.message }, 'AUTH');
      return {
        ...authResult,
        isAdmin: false,
        error: profileError.message
      };
    }
    
    const isAdmin = profile?.role === 'admin';
    
    log.auth(
      isAdmin ? 'Пользователь имеет права администратора' : 'Пользователь не является администратором',
      { userId: authResult.user.id, role: profile?.role }
    );
    
    return {
      ...authResult,
      isAdmin
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Ошибка проверки прав администратора';
    log.error('Критическая ошибка проверки прав администратора', { error: errorMessage }, 'AUTH');
    
    return {
      ...authResult,
      isAdmin: false,
      error: errorMessage
    };
  }
};

/**
 * Wrapper для выполнения операций, требующих авторизации
 */
export const withAuth = async <T>(
  operation: (user: User) => Promise<T>,
  requireAdmin = false
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const authCheck = requireAdmin 
      ? await checkAdminRights()
      : await checkUserAuth();
    
    if (!authCheck.success) {
      return {
        success: false,
        error: authCheck.error || 'Ошибка авторизации'
      };
    }
    
    if (requireAdmin && !('isAdmin' in authCheck && authCheck.isAdmin)) {
      log.warn('Попытка доступа к функции администратора без прав', { userId: authCheck.user?.id }, 'AUTH');
      return {
        success: false,
        error: 'Требуются права администратора'
      };
    }

    if (!authCheck.user) {
      return {
        success: false,
        error: 'Пользователь не найден'
      };
    }
    
    const result = await operation(authCheck.user);
    
    return {
      success: true,
      data: result
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Ошибка выполнения операции';
    log.error('Ошибка в операции с авторизацией', { error: errorMessage }, 'AUTH');
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
