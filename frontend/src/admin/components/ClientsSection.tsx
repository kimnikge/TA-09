import React, { useState, useEffect, useCallback } from 'react';
import { Building, Users, Plus, Trash2, Edit3, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  seller_name?: string;
  address: string;
  created_by: string;
  created_at: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface ClientsSectionProps {
  onError?: (error: string) => void;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ onError }) => {
  const { adminUser } = useAdminAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    seller_name: '',
    address: ''
  });

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          creator:profiles!created_by(name, email)
        `)
        .order('created_at', { ascending: false });

      if (clientsError) {
        throw clientsError;
      }

      setClients(clientsData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки клиентов';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Заполните обязательные поля: название и адрес');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const clientData = {
        name: formData.name.trim(),
        company_name: formData.company_name.trim() || null,
        seller_name: formData.seller_name.trim() || null,
        address: formData.address.trim(),
        created_by: adminUser.id
      };

      if (editingClient) {
        // Обновление существующего клиента
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (updateError) throw updateError;
        setSuccess('Клиент успешно обновлен');
      } else {
        // Создание нового клиента
        const { error: insertError } = await supabase
          .from('clients')
          .insert([clientData]);

        if (insertError) throw insertError;
        setSuccess('Клиент успешно добавлен');
      }

      await loadClients();
      resetForm();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения клиента';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const deleteClient = async (client: Client) => {
    if (!confirm(`Вы уверены, что хотите удалить клиента "${client.name}"?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // Проверяем, есть ли у клиента заказы
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', client.id)
        .limit(1);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        setError('Нельзя удалить клиента, у которого есть заказы');
        return;
      }

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (deleteError) throw deleteError;

      setSuccess('Клиент успешно удален');
      await loadClients();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления клиента';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const editClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company_name: client.company_name || '',
      seller_name: client.seller_name || '',
      address: client.address
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      seller_name: '',
      address: ''
    });
    setEditingClient(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка клиентов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Управление клиентами
          </h2>
          <p className="text-gray-600 mt-1">
            Все торговые точки и клиенты системы
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить клиента
        </button>
      </div>

      {/* Уведомления */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          <span>{success}</span>
        </div>
      )}

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingClient ? 'Редактировать клиента' : 'Добавить нового клиента'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название точки *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Компания
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контактное лицо
                </label>
                <input
                  type="text"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingClient ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Всего клиентов</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">С компаниями</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.company_name).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Уникальных адресов</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(clients.map(c => c.address)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Список клиентов */}
      <div className="bg-white rounded-lg shadow">
        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Клиентов пока нет
            </h3>
            <p className="text-gray-500">
              Добавьте первого клиента для начала работы
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Создан
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          {client.company_name && (
                            <div className="text-sm text-gray-500">{client.company_name}</div>
                          )}
                          {client.seller_name && (
                            <div className="text-sm text-gray-500">Контакт: {client.seller_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(client.created_at).toLocaleDateString('ru-RU')}</div>
                      {client.creator && (
                        <div className="text-xs text-gray-400">
                          {client.creator.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editClient(client)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Редактировать"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClient(client)}
                          className="text-red-600 hover:text-red-800 p-1"
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
        )}
      </div>
    </div>
  );
};

export default ClientsSection;
