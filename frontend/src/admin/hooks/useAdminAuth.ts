import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export interface AdminUser {
  id: string;
  email?: string;
  role?: string;
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<AdminUser>({
    id: '',
    email: '',
    role: '',
    isAdmin: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);

  const checkAdminAccess = async () => {
    try {
      console.log('🔐 Проверка админских прав...');
      
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        console.log('❌ Пользователь не авторизован');
        setAdminUser({
          id: '',
          email: '',
          role: '',
          isAdmin: false,
          isLoading: false,
        });
        return;
      }

      console.log('👤 Пользователь найден:', user.email);

      // Получаем профиль пользователя из БД
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Ошибка получения профиля:', profileError);
        throw profileError;
      }

      console.log('📋 Профиль пользователя:', profile);

      const isAdmin = profile?.role === 'admin';
      
      setAdminUser({
        id: user.id,
        email: user.email || profile?.email || '',
        role: profile?.role || 'user',
        isAdmin,
        isLoading: false,
      });

      console.log(`${isAdmin ? '✅' : '❌'} Админские права: ${isAdmin ? 'есть' : 'нет'}`);
      
    } catch (err) {
      console.error('❌ Ошибка проверки админских прав:', err);
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
      setAdminUser({
        id: '',
        email: '',
        role: '',
        isAdmin: false,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Выход из системы...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAdminUser({
        id: '',
        email: '',
        role: '',
        isAdmin: false,
        isLoading: false,
      });
      console.log('✅ Успешный выход из системы');
    } catch (err) {
      console.error('❌ Ошибка при выходе:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при выходе');
    }
  };

  useEffect(() => {
    checkAdminAccess();

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        console.log('🔄 Изменение авторизации:', event);
        if (event === 'SIGNED_OUT') {
          setAdminUser({
            id: '',
            email: '',
            role: '',
            isAdmin: false,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAdminAccess();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    adminUser,
    error,
    logout,
    refresh: checkAdminAccess,
  };
};
