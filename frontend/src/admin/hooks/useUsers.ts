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
      console.log('📋 useUsers: Данные пользователей:', data?.map(u => ({ 
        id: u.id, 
        email: u.email, 
        approved: u.approved,
        role: u.role 
      })));
      
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
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ approved: newStatus })
        .eq('id', userId)
        .select('id, email, approved');
      
      if (updateError) {
        throw updateError;
      }
      
      // НЕМЕДЛЕННО И ФОРСИРОВАННО обновляем локальное состояние
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === userId ? { ...user, approved: newStatus } : user
        );
        return updatedUsers;
      });
      
      return true;
    } catch (err) {
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
