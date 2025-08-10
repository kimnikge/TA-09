import { supabase } from '../supabaseClient';

/**
 * Проверяет авторизацию текущего пользователя
 * @returns Данные авторизованного пользователя
 * @throws Error если пользователь не авторизован
 */
export const checkUserAuth = async () => {
  console.log('🔐 AuthUtils: Проверка авторизации пользователя...');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ AuthUtils: Пользователь не авторизован:', authError?.message);
    throw new Error('Пользователь не авторизован');
  }
  
  console.log('✅ AuthUtils: Авторизованный пользователь:', user.email);
  return user;
};
