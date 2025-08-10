import React, { useState } from 'react';
import { User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { log } from '../../utils/logger';
import { UserProfile, UserRole } from '../../types/user';

interface UsersTableProps {
  users: UserProfile[];
  loading: boolean;
  onUpdateRole: (userId: string, role: UserRole) => Promise<boolean>;
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onRefresh?: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  onUpdateRole,
  onToggleStatus,
  onDeleteUser,
  onRefresh,
}) => {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет пользователей</h3>
          <p className="text-gray-500">Пользователи не найдены</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await onUpdateRole(userId, newRole);
  };

    const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);
      log.ui('Переключение статуса пользователя', { userId, currentStatus });
      
      const success = await onToggleStatus(userId, currentStatus);
      
      if (!success) {
        log.error('Не удалось обновить статус, перезагружаем данные', { userId }, 'UsersTable');
        // При неудаче перезагружаем данные из БД
        if (onRefresh) {
          onRefresh();
        }
      } else {
        log.ui('Статус успешно обновлен', { userId });
      }
    } catch (error) {
      log.error('Ошибка при обновлении статуса', { error, userId }, 'UsersTable');
      // При ошибке перезагружаем данные из БД
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    log.ui('Запрос на удаление пользователя', { userId });
    
    try {
      setUpdatingUserId(userId); // Показываем индикатор загрузки
      const success = await onDeleteUser(userId);
      
      if (success) {
        log.ui('Пользователь успешно удален', { userId });
      } else {
        log.error('Не удалось удалить пользователя', { userId }, 'UsersTable');
      }
    } catch (error) {
      log.error('Ошибка при удалении', { error, userId }, 'UsersTable');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Управление пользователями</h2>
        <p className="text-sm text-gray-500 mt-1">
          Всего пользователей: {users.length}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              // Логируем данные каждого пользователя для отладки
              if (process.env.NODE_ENV === 'development') {
                console.log(`👤 Отображение пользователя ${user.email}: approved=${user.approved}`);
              }
              
              return (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || user.name || 'Без имени'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role || UserRole.USER}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={UserRole.USER}>Пользователь</option>
                    <option value={UserRole.ADMIN}>Админ</option>
                    <option value={UserRole.SALES_REP}>Торговый представитель</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusToggle(user.id, user.approved ?? false)}
                    disabled={updatingUserId === user.id}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                      updatingUserId === user.id 
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : user.approved
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {updatingUserId === user.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
                        Обновление...
                      </>
                    ) : user.approved ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Активен
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Заблокирован
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Кнопка блокировки/активации - более заметная */}
                    <button
                      onClick={() => handleStatusToggle(user.id, user.approved ?? false)}
                      disabled={updatingUserId === user.id}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                        updatingUserId === user.id 
                          ? 'bg-gray-100 text-gray-600 border-gray-300 cursor-not-allowed'
                          : user.approved
                          ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
                          : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                      }`}
                      title={user.approved ? 'Заблокировать пользователя' : 'Активировать пользователя'}
                    >
                      {updatingUserId === user.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
                          Обновление...
                        </>
                      ) : user.approved ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Заблокировать
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Активировать
                        </>
                      )}
                    </button>
                    
                    {/* Кнопка редактирования */}
                    <button
                      className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50 transition-all"
                      title="Редактировать пользователя"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {/* Кнопка удаления */}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50 transition-all"
                      title="Удалить пользователя"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
