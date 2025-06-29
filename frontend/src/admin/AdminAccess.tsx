import React from 'react';
import { Lock, LogIn, RefreshCw, User } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminModule from './index';

/**
 * Компонент-обёртка для проверки доступа к админке
 * Показывает админку только авторизованным админам
 */
const AdminAccess: React.FC = () => {
  const { adminUser, error, logout, refresh } = useAdminAuth();

  // Загрузка
  if (adminUser.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Проверка доступа...</h2>
          <p className="text-sm text-gray-500 mt-1">
            Проверяем ваши права доступа к админ-панели
          </p>
        </div>
      </div>
    );
  }

  // Ошибка авторизации
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-800 mb-2">
            Ошибка доступа
          </h1>
          <p className="text-gray-600 mb-4">
            Произошла ошибка при проверке доступа к админ-панели
          </p>
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
            <code className="text-sm text-red-700">{error}</code>
          </div>
          <div className="flex space-x-2 justify-center">
            <button
              onClick={refresh}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Пользователь не авторизован
  if (!adminUser.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <LogIn className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Требуется авторизация
          </h1>
          <p className="text-gray-600 mb-6">
            Для доступа к админ-панели необходимо войти в систему
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Перейти к авторизации
            </button>
            <button
              onClick={refresh}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Обновить статус
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Пользователь авторизован, но не админ
  if (!adminUser.isAdmin) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Доступ запрещён
          </h1>
          <p className="text-gray-600 mb-4">
            У вас нет прав доступа к админ-панели
          </p>
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-6">
            <div className="flex items-center">
              <User className="w-4 h-4 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium">{adminUser.email}</div>
                <div>Роль: {adminUser.role || 'user'}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Вернуться на сайт
            </button>
            <button
              onClick={logout}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Выйти из системы
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Пользователь - админ, показываем админку
  return (
    <div>
      {/* Скрытая информация для отладки */}
      <div style={{ display: 'none' }}>
        Admin Access: {JSON.stringify({
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          isAdmin: adminUser.isAdmin
        })}
      </div>
      <AdminModule />
    </div>
  );
};

export default AdminAccess;
