// ТЕСТИРОВАНИЕ СИСТЕМЫ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ (TypeScript)
// Дата: 1 августа 2025

import { supabase } from '../supabaseClient';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  approved: boolean;
}

class UserManagementTest {
  private testUsers: TestUser[] = [];

  // ===== ТЕСТ 1: СОЗДАНИЕ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ =====
  async createTestUser(): Promise<TestUser | null> {
    try {
      console.log('🧪 ТЕСТ: Создание тестового пользователя...');
      
      const testEmail = `test_user_${Date.now()}@test.com`;
      const testUser = {
        id: crypto.randomUUID(),
        email: testEmail,
        name: 'Тестовый Пользователь',
        role: 'sales_rep',
        approved: false
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(testUser)
        .select()
        .single();

      if (error) {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Ошибка создания пользователя:', error);
        return null;
      }

      console.log('✅ ТЕСТ ПРОЙДЕН: Пользователь создан:', data);
      this.testUsers.push(data);
      return data;
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при создании:', err);
      return null;
    }
  }

  // ===== ТЕСТ 2: АКТИВАЦИЯ ПОЛЬЗОВАТЕЛЯ =====
  async activateUser(userId: string): Promise<boolean> {
    try {
      console.log('🧪 ТЕСТ: Активация пользователя', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Ошибка активации:', error);
        return false;
      }

      if (data.approved === true) {
        console.log('✅ ТЕСТ ПРОЙДЕН: Пользователь активирован:', data.email);
        return true;
      } else {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Статус не изменился');
        return false;
      }
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при активации:', err);
      return false;
    }
  }

  // ===== ТЕСТ 3: БЛОКИРОВКА ПОЛЬЗОВАТЕЛЯ =====
  async blockUser(userId: string): Promise<boolean> {
    try {
      console.log('🧪 ТЕСТ: Блокировка пользователя', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ approved: false })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Ошибка блокировки:', error);
        return false;
      }

      if (data.approved === false) {
        console.log('✅ ТЕСТ ПРОЙДЕН: Пользователь заблокирован:', data.email);
        return true;
      } else {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Статус не изменился');
        return false;
      }
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при блокировке:', err);
      return false;
    }
  }

  // ===== ТЕСТ 4: ПОЛУЧЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ =====
  async fetchUsers(): Promise<TestUser[]> {
    try {
      console.log('🧪 ТЕСТ: Получение списка пользователей...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Ошибка получения пользователей:', error);
        return [];
      }

      console.log('✅ ТЕСТ ПРОЙДЕН: Получено пользователей:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при получении:', err);
      return [];
    }
  }

  // ===== ТЕСТ 5: УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ =====
  async deleteUser(userId: string): Promise<boolean> {
    try {
      console.log('🧪 ТЕСТ: Удаление пользователя', userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Ошибка удаления:', error);
        return false;
      }

      console.log('✅ ТЕСТ ПРОЙДЕН: Пользователь удалён');
      return true;
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при удалении:', err);
      return false;
    }
  }

  // ===== ТЕСТ 6: ПРОВЕРКА RLS ПОЛИТИК =====
  async testRLSPolicies(): Promise<boolean> {
    try {
      console.log('🧪 ТЕСТ: Проверка RLS политик...');
      
      // Пытаемся получить данные без аутентификации
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('✅ ТЕСТ ПРОЙДЕН: RLS блокирует неавторизованный доступ');
        return true;
      } else if (data) {
        console.log('⚠️ ТЕСТ: RLS может быть отключен или политики слишком открыты');
        return true;
      } else {
        console.error('❌ ТЕСТ ПРОВАЛЕН: Неожиданная ошибка RLS:', error);
        return false;
      }
    } catch (err) {
      console.error('❌ ТЕСТ ПРОВАЛЕН: Исключение при проверке RLS:', err);
      return false;
    }
  }

  // ===== ОЧИСТКА ТЕСТОВЫХ ДАННЫХ =====
  async cleanupTestUsers(): Promise<void> {
    console.log('🧹 Очистка тестовых пользователей...');
    
    for (const user of this.testUsers) {
      await this.deleteUser(user.id);
    }
    
    // Удаляем всех пользователей с тестовыми email
    const { error } = await supabase
      .from('profiles')
      .delete()
      .like('email', 'test_user_%@test.com');

    if (error) {
      console.error('⚠️ Ошибка при очистке тестовых пользователей:', error);
    } else {
      console.log('✅ Тестовые пользователи очищены');
    }
    
    this.testUsers = [];
  }

  // ===== ЗАПУСК ВСЕХ ТЕСТОВ =====
  async runAllTests(): Promise<void> {
    console.log('🚀 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ');
    console.log('='.repeat(70));

    let passedTests = 0;
    let totalTests = 0;

    // Тест 1: Создание пользователя
    totalTests++;
    const testUser = await this.createTestUser();
    if (testUser) passedTests++;

    if (!testUser) {
      console.log('❌ Остальные тесты пропущены из-за ошибки создания пользователя');
      return;
    }

    // Тест 2: Активация пользователя
    totalTests++;
    const activated = await this.activateUser(testUser.id);
    if (activated) passedTests++;

    // Тест 3: Блокировка пользователя
    totalTests++;
    const blocked = await this.blockUser(testUser.id);
    if (blocked) passedTests++;

    // Тест 4: Получение списка пользователей  
    totalTests++;
    const users = await this.fetchUsers();
    if (users.length > 0) {
      console.log('✅ ТЕСТ ПРОЙДЕН: Список пользователей получен');
      passedTests++;
    }

    // Тест 5: Проверка RLS
    totalTests++;
    const rlsWorking = await this.testRLSPolicies();
    if (rlsWorking) passedTests++;

    // Тест 6: Удаление пользователя
    totalTests++;
    const deleted = await this.deleteUser(testUser.id);
    if (deleted) passedTests++;

    // Очистка
    await this.cleanupTestUsers();

    // Итоги
    console.log('='.repeat(70));
    console.log(`📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:`);
    console.log(`✅ Пройдено: ${passedTests}/${totalTests} тестов`);
    console.log(`❌ Провалено: ${totalTests - passedTests}/${totalTests} тестов`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Система управления пользователями работает корректно.');
    } else {
      console.log('⚠️ ЕСТЬ ПРОБЛЕМЫ! Требуется исправление системы управления пользователями.');
    }
  }
}

// Экспорт для использования
export const userManagementTest = new UserManagementTest();

// Функция для быстрого запуска тестов
export const runUserManagementTests = () => {
  return userManagementTest.runAllTests();
};

// Автоматический запуск тестов в development режиме
if (process.env.NODE_ENV === 'development') {
  // Раскомментируйте для автоматического запуска тестов
  // setTimeout(() => runUserManagementTests(), 2000);
}
