import React, { useState } from 'react';
import { User, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { UserProfile } from '../hooks/useUsers';

interface UsersTableProps {
  users: UserProfile[];
  loading: boolean;
  onUpdateRole: (userId: string, role: string) => Promise<boolean>;
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  onUpdateRole,
  onToggleStatus,
  onDeleteUser,
}) => {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет агентов</h3>
          <p className="text-gray-500">Агенты не найдены</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    setStatusMessage('');
    try {
      const success = await onUpdateRole(userId, newRole);
      if (success) {
        setStatusMessage('Роль обновлена успешно');
      } else {
        setStatusMessage('Ошибка при обновлении роли');
      }
    } catch (error) {
      setStatusMessage('Ошибка при обновлении роли');
    } finally {
      setUpdatingUser(null);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setUpdatingUser(userId);
    setStatusMessage('');
    
    console.log(`🔄 Переключение статуса пользователя ${userId}: ${currentStatus} → ${!currentStatus}`);
    
    try {
      const success = await onToggleStatus(userId, currentStatus);
      if (success) {
        const newStatus = !currentStatus;
        setStatusMessage(`Статус изменен: ${newStatus ? 'Активен' : 'Заблокирован'}`);
        console.log(`✅ Статус успешно изменен на: ${newStatus ? 'Активен' : 'Заблокирован'}`);
      } else {
        setStatusMessage('Ошибка при изменении статуса');
        console.error('❌ Не удалось изменить статус');
      }
    } catch (err) {
      setStatusMessage('Ошибка при изменении статуса');
      console.error('❌ Ошибка при изменении статуса:', err);
    } finally {
      setUpdatingUser(null);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDelete = async (userId: string) => {
    await onDeleteUser(userId);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Управление агентами</h2>
        <p className="text-sm text-gray-500 mt-1">
          Всего агентов: {users.length}
        </p>
        {statusMessage && (
          <div className={`mt-2 p-2 rounded text-sm ${
            statusMessage.includes('Ошибка') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Агент
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
            {users.map((user) => (
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
                    value={user.role || 'sales_rep'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sales_rep">Агент</option>
                    <option value="admin">Админ</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusToggle(user.id, user.approved || false)}
                    disabled={updatingUser === user.id}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      user.approved
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    } ${updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {updatingUser === user.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Сохранение...
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
                    <button
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
