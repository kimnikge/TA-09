import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  full_name?: string;
  role?: string;
  approved?: boolean;
  created_at?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 useUsers: Загрузка пользователей из БД...');
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*');
      
      if (fetchError) {
        console.error('❌ useUsers: Ошибка запроса к БД:', fetchError);
        throw fetchError;
      }
      
      console.log('✅ useUsers: Пользователи загружены:', data?.length || 0);
      setUsers(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке пользователей';
      console.error('❌ useUsers: Критическая ошибка:', errorMessage);
      setError(errorMessage);
      setUsers([]); // Очищаем пользователей при ошибке
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // Обновляем локальное состояние
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      console.log('✅ Роль пользователя обновлена');
      return true;
    } catch (err) {
      console.error('❌ Ошибка обновления роли:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении роли');
      return false;
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      console.log(`🔄 useUsers: Обновление статуса пользователя ${userId}: ${currentStatus} → ${newStatus}`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ approved: newStatus })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ useUsers: Ошибка Supabase:', updateError);
        throw updateError;
      }
      
      console.log('✅ useUsers: Запрос к Supabase выполнен успешно');
      
      // Обновляем локальное состояние
      setUsers(currentUsers => {
        const updatedUsers = currentUsers.map(user => 
          user.id === userId ? { ...user, approved: newStatus } : user
        );
        console.log('✅ useUsers: Локальное состояние обновлено');
        return updatedUsers;
      });
      
      console.log('✅ useUsers: Статус пользователя обновлен успешно');
      return true;
    } catch (err) {
      console.error('❌ useUsers: Ошибка обновления статуса:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении статуса');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return false;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (deleteError) throw deleteError;
      
      // Обновляем локальное состояние
      setUsers(users.filter(user => user.id !== userId));
      
      console.log('✅ Пользователь удален');
      return true;
    } catch (err) {
      console.error('❌ Ошибка удаления пользователя:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при удалении пользователя');
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
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
