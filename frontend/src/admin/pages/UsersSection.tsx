import React, { useState } from 'react';
import { Search, UserPlus, Download } from 'lucide-react';
import UsersTable from '../components/UsersTable';
import { useUsers } from '../hooks/useUsers';

const UsersSection: React.FC = () => {
  console.log('👥 UsersSection: Инициализация компонента');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    setError
  } = useUsers();

  console.log('👥 UsersSection: Данные загружены', { 
    usersCount: users.length, 
    loading, 
    error 
  });

  // Обработка ошибок загрузки
  if (error) {
    console.error('❌ UsersSection: Ошибка в компоненте:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">Ошибка загрузки агентов</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchUsers();
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.approved) ||
      (statusFilter === 'inactive' && !user.approved);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRefresh = () => {
    setError(null);
    fetchUsers();
  };

  const handleExport = () => {
    // Простая реализация экспорта в CSV
    const csvContent = [
      ['Email', 'Имя', 'Роль', 'Статус', 'Дата регистрации'].join(','),
      ...filteredUsers.map(user => [
        user.email || '',
        user.full_name || user.name || '',
        user.role || 'user',
        user.approved ? 'Активен' : 'Заблокирован',
        user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Управление агентами</h2>
            <p className="text-sm text-gray-500 mt-1">
              Просматривайте и управляйте агентами системы
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              Обновить
            </button>
            <button
              onClick={handleExport}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Добавить
            </button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по email или имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все роли</option>
            <option value="user">Пользователь</option>
            <option value="admin">Админ</option>
            <option value="moderator">Модератор</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Заблокированные</option>
          </select>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-blue-800">Всего агентов</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.approved).length}
            </div>
            <div className="text-sm text-green-800">Активных</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => !u.approved).length}
            </div>
            <div className="text-sm text-red-800">Заблокированных</div>
          </div>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-2">
                <button
                  onClick={handleRefresh}
                  className="text-sm text-red-800 font-medium hover:text-red-900"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Таблица пользователей */}
      <UsersTable
        users={filteredUsers}
        loading={loading}
        onUpdateRole={updateUserRole}
        onToggleStatus={toggleUserStatus}
        onDeleteUser={deleteUser}
      />

      {/* Показываем количество отфильтрованных пользователей */}
      {searchTerm || roleFilter || statusFilter ? (
        <div className="text-center text-sm text-gray-500">
          Показано {filteredUsers.length} из {users.length} пользователей
        </div>
      ) : null}
    </div>
  );
};

export default UsersSection;
