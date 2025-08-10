import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { checkUserAuth } from '../../utils/authHelpers';
import { safeExecute } from '../../utils/errorHandler';
import { log } from '../../utils/logger';
import { UserProfile, UserRole } from '../../types/user';

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Общая функция загрузки пользователей с контролем состояния mounting
  const fetchUsers = async (isMountedRef?: { current: boolean }) => {
    const result = await safeExecute(async () => {
      setLoading(true);
      setError(null);
      log.db('Загрузка пользователей из БД');
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*');
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Проверяем mounted состояние если передана ссылка
      if (isMountedRef && !isMountedRef.current) {
        log.debug('Компонент размонтирован, прерываем обновление', undefined, 'useUsers');
        return;
      }
      
      log.db('Пользователи загружены', { count: data?.length || 0 });
      log.debug('Данные пользователей', { 
        users: data?.map(u => ({ 
          id: u.id, 
          email: u.email, 
          approved: u.approved,
          role: u.role 
        }))
      }, 'useUsers');
      
      setUsers(data || []);
      setError(null);
    }, 'загрузки пользователей');

    if (!result.success) {
      // Проверяем mounted состояние перед обновлением ошибки
      if (isMountedRef && !isMountedRef.current) {
        log.debug('Компонент размонтирован, пропускаем ошибку', undefined, 'useUsers');
        return;
      }
      
      setError(result.error || 'Ошибка загрузки пользователей');
      setUsers([]);
    }
    
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    const result = await safeExecute(async () => {
      log.db('Обновление роли пользователя', { userId, newRole });
      
      // Используем утилитарную функцию для проверки авторизации
      const authCheck = await checkUserAuth();
      if (!authCheck.success) {
        throw new Error(authCheck.error || 'Ошибка авторизации');
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Безопасное обновление локального состояния
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      log.db('Роль пользователя обновлена', { userId, newRole });
      return true;
    }, 'обновления роли пользователя', false);

    if (!result.success) {
      setError(result.error || 'Ошибка обновления роли');
    }
    return result.data || false;
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean): Promise<boolean> => {
    const result = await safeExecute(async () => {
      const newStatus = !currentStatus;
      log.db('Переключение статуса пользователя', { 
        userId, 
        currentStatus, 
        newStatus 
      });
      
      // Используем утилитарную функцию для проверки авторизации
      const authCheck = await checkUserAuth();
      if (!authCheck.success) {
        throw new Error(authCheck.error || 'Ошибка авторизации');
      }
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ approved: newStatus })
        .eq('id', userId)
        .select('id, email, approved');
      
      if (updateError) {
        throw updateError;
      }
      
      if (!data || data.length === 0) {
        log.error('Пользователь не найден или не обновлен', {
          userId,
          reason: 'Нет прав на обновление или пользователь не существует'
        }, 'useUsers');
        throw new Error('Не удалось обновить статус пользователя. Проверьте права доступа.');
      }
      
      log.db('Статус успешно обновлен в БД', data[0]);
      
      // Безопасное обновление локального состояния с проверками
      setUsers(prevUsers => {
        // Проверяем, что пользователь все еще существует в локальном состоянии
        const userExists = prevUsers.find(user => user.id === userId);
        if (!userExists) {
          log.warn('Пользователь не найден в локальном состоянии', { userId }, 'useUsers');
          return prevUsers;
        }
        
        // Проверяем, что данные из БД валидны
        if (!data[0] || data[0].id !== userId) {
          log.error('Неверные данные из БД для обновления', { userId, data: data[0] }, 'useUsers');
          return prevUsers;
        }
        
        const updatedUsers = prevUsers.map(user => 
          user.id === userId 
            ? { ...user, approved: data[0].approved }
            : user
        );
        
        log.debug('Локальное состояние безопасно обновлено', undefined, 'useUsers');
        return updatedUsers;
      });
      
      return true;
    }, 'переключения статуса пользователя', false);

    if (!result.success) {
      setError(result.error || 'Ошибка обновления статуса');
    }
    return result.data || false;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const result = await safeExecute(async () => {
      log.db('Попытка удаления пользователя', { userId });
      
      // Используем утилитарную функцию для проверки авторизации
      const authCheck = await checkUserAuth();
      if (!authCheck.success) {
        throw new Error(authCheck.error || 'Ошибка авторизации');
      }
      
      const { data, error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select('id, email');
      
      if (deleteError) {
        throw deleteError;
      }
      
      if (!data || data.length === 0) {
        log.error('Пользователь не найден или не удален', {
          userId,
          reason: 'Нет прав на удаление или пользователь не существует'
        }, 'useUsers');
        throw new Error('Не удалось удалить пользователя. Проверьте права доступа.');
      }
      
      log.db('Пользователь успешно удален из БД', data[0]);
      
      // Безопасное удаление из локального состояния
      setUsers(prevUsers => {
        const userToRemove = prevUsers.find(user => user.id === userId);
        if (!userToRemove) {
          log.warn('Пользователь уже отсутствует в локальном состоянии', { userId }, 'useUsers');
          return prevUsers;
        }
        
        const filteredUsers = prevUsers.filter(user => user.id !== userId);
        log.debug('Пользователь безопасно удален из локального состояния', undefined, 'useUsers');
        return filteredUsers;
      });
      
      log.db('Удаление завершено успешно', { userId });
      return true;
    }, 'удаления пользователя', false);

    if (!result.success) {
      setError(result.error || 'Ошибка удаления пользователя');
    }
    return result.data || false;
  };

  useEffect(() => {
    // Флаг для предотвращения обновления состояния после unmount
    const isMounted = true;
    const isMountedRef = { current: isMounted };
    
    // Используем общую функцию fetchUsers с контролем mounting
    fetchUsers(isMountedRef);
    
    // Cleanup функция
    return () => {
      isMountedRef.current = false;
      log.debug('Cleanup выполнен, isMounted = false', undefined, 'useUsers');
    };
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    setError
  };
};
