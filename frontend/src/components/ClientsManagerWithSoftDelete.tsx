import React, { useState, useEffect, memo, useCallback } from 'react';
import { Plus, Save, X, MapPin, Building, Trash2, Edit3, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
  // Мягкое удаление на уровне приложения
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

interface ClientsManagerProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  userRole: 'admin' | 'sales_rep';
}

const ClientsManager: React.FC<ClientsManagerProps> = ({ currentUser, userRole }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  // Загрузка клиентов
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      
      const query = supabase
        .from('clients')
        .select(`
          id, 
          name, 
          address, 
          created_by, 
          created_at
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Ошибка при загрузке клиентов:', error);
        return;
      }

      // Получаем информацию о мягком удалении из localStorage
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      
      const clientsWithStatus = (data || []).map(client => ({
        ...client,
        is_deleted: deletedClients[client.id]?.is_deleted || false,
        deleted_at: deletedClients[client.id]?.deleted_at || null,
        deleted_by: deletedClients[client.id]?.deleted_by || null
      }));

      setClients(clientsWithStatus);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция мягкого удаления
  const handleSoftDelete = async (clientId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) {
      return;
    }

    try {
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      
      // Помечаем клиента как удаленный
      deletedClients[clientId] = {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id
      };
      
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));
      
      // Обновляем состояние
      setClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? { 
                ...client, 
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: currentUser.id
              }
            : client
        )
      );
      
      console.log('✅ Клиент помечен как удаленный');
    } catch (error) {
      console.error('❌ Ошибка при мягком удалении:', error);
    }
  };

  // Функция восстановления клиента
  const handleRestore = async (clientId: string) => {
    if (!confirm('Вы уверены, что хотите восстановить этого клиента?')) {
      return;
    }

    try {
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      
      // Удаляем информацию о удалении
      delete deletedClients[clientId];
      
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));
      
      // Обновляем состояние
      setClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? { 
                ...client, 
                is_deleted: false,
                deleted_at: undefined,
                deleted_by: undefined
              }
            : client
        )
      );
      
      console.log('✅ Клиент восстановлен');
    } catch (error) {
      console.error('❌ Ошибка при восстановлении:', error);
    }
  };

  // Функция окончательного удаления (только для админов)
  const handleHardDelete = async (clientId: string) => {
    if (userRole !== 'admin') {
      alert('Только администраторы могут окончательно удалить клиентов');
      return;
    }

    if (!confirm('ВНИМАНИЕ! Это действие нельзя отменить. Клиент будет удален навсегда. Продолжить?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('❌ Ошибка при окончательном удалении:', error);
        return;
      }

      // Удаляем из localStorage
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      delete deletedClients[clientId];
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));

      // Удаляем из состояния
      setClients(prev => prev.filter(client => client.id !== clientId));
      
      console.log('✅ Клиент окончательно удален');
    } catch (error) {
      console.error('❌ Ошибка при окончательном удалении:', error);
    }
  };

  // Функция редактирования клиента
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      address: client.address
    });
    setShowAddForm(true);
  };

  // Функция создания/обновления клиента
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingClient) {
        // Обновление существующего клиента
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim()
          })
          .eq('id', editingClient.id);

        if (error) {
          console.error('❌ Ошибка при обновлении клиента:', error);
          return;
        }

        // Обновляем в состоянии
        setClients(prev => 
          prev.map(client => 
            client.id === editingClient.id 
              ? { 
                  ...client, 
                  name: formData.name.trim(),
                  address: formData.address.trim()
                }
              : client
          )
        );

        console.log('✅ Клиент обновлен');
      } else {
        // Создание нового клиента
        const { data, error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name.trim(),
            address: formData.address.trim(),
            created_by: currentUser.id
          }])
          .select();

        if (error) {
          console.error('❌ Ошибка при создании клиента:', error);
          return;
        }

        if (data && data.length > 0) {
          setClients(prev => [data[0], ...prev]);
          console.log('✅ Клиент создан');
        }
      }

      // Закрываем форму
      setShowAddForm(false);
      setEditingClient(null);
      setFormData({ name: '', address: '' });
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении клиента:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingClient(null);
    setFormData({ name: '', address: '' });
  };

  // Загрузка при монтировании
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Фильтрация клиентов
  const filteredClients = clients.filter(client => {
    if (showDeleted) {
      return client.is_deleted;
    }
    return !client.is_deleted;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Загрузка клиентов...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Управление клиентами</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showDeleted 
                ? 'bg-red-100 text-red-600 border border-red-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {showDeleted ? 'Показать активных' : 'Показать удаленных'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-3">
            {editingClient ? 'Редактировать клиента' : 'Добавить нового клиента'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название точки
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Магазин на Ленина"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Адрес
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: ул. Ленина, д. 10"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingClient ? 'Обновить' : 'Сохранить'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список клиентов */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building size={48} className="mx-auto mb-2 opacity-50" />
            <p>
              {showDeleted 
                ? 'Нет удаленных клиентов' 
                : 'Нет активных клиентов'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className={`border rounded-lg p-4 transition-all ${
                  client.is_deleted 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building size={20} className={client.is_deleted ? 'text-red-500' : 'text-blue-500'} />
                      <h3 className={`font-semibold ${client.is_deleted ? 'text-red-800' : 'text-gray-800'}`}>
                        {client.name}
                      </h3>
                      {client.is_deleted && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Удален
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span>{client.address}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Создан: {new Date(client.created_at).toLocaleDateString('ru-RU')}
                      {client.deleted_at && (
                        <span className="text-red-500 ml-2">
                          • Удален: {new Date(client.deleted_at).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {client.is_deleted ? (
                      <>
                        <button
                          onClick={() => handleRestore(client.id)}
                          className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition-colors"
                          title="Восстановить клиента"
                        >
                          <RefreshCw size={16} />
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleHardDelete(client.id)}
                            className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="Удалить окончательно (только для админов)"
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(client)}
                          className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Редактировать клиента"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleSoftDelete(client.id)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                          title="Удалить клиента"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ClientsManager);
