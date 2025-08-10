import React, { useState, useEffect, memo, useCallback } from 'react';
import { Plus, MapPin, Building, Trash2, Edit3, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  LoadingButton, 
  AlertMessage, 
  Modal, 
  Form, 
  ConfirmDialog 
} from './common';

interface Client {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
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
  
  // Модальные состояния
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Состояния подтверждения
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    client: Client | null;
    type: 'soft' | 'hard' | 'restore';
    loading: boolean;
  }>({ show: false, client: null, type: 'soft', loading: false });
  
  // Форма
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Уведомления
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
  };

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
        showAlert('error', 'Ошибка загрузки клиентов');
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
      showAlert('error', 'Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Функция мягкого удаления
  const handleSoftDelete = async () => {
    if (!deleteConfirm.client) return;

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));

      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      deletedClients[deleteConfirm.client.id] = {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id
      };
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));

      showAlert('success', 'Клиент удален');
      loadClients();
      setDeleteConfirm({ show: false, client: null, type: 'soft', loading: false });
    } catch (error) {
      console.error('Ошибка при удалении клиента:', error);
      showAlert('error', 'Ошибка удаления клиента');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  // Функция восстановления
  const handleRestore = async () => {
    if (!deleteConfirm.client) return;

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));

      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      delete deletedClients[deleteConfirm.client.id];
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));

      showAlert('success', 'Клиент восстановлен');
      loadClients();
      setDeleteConfirm({ show: false, client: null, type: 'restore', loading: false });
    } catch (error) {
      console.error('Ошибка при восстановлении клиента:', error);
      showAlert('error', 'Ошибка восстановления клиента');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  // Функция полного удаления
  const handlePermanentDelete = async () => {
    if (!deleteConfirm.client) return;

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));

      // Удаляем из localStorage
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      delete deletedClients[deleteConfirm.client.id];
      localStorage.setItem('deletedClients', JSON.stringify(deletedClients));

      // Удаляем из Supabase
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteConfirm.client.id);

      if (error) throw error;

      showAlert('success', 'Клиент удален навсегда');
      loadClients();
      setDeleteConfirm({ show: false, client: null, type: 'hard', loading: false });
    } catch (error) {
      console.error('Ошибка при полном удалении клиента:', error);
      showAlert('error', 'Ошибка полного удаления клиента');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  // Обработка подтверждения действий
  const handleConfirmAction = () => {
    switch (deleteConfirm.type) {
      case 'soft':
        return handleSoftDelete();
      case 'restore':
        return handleRestore();
      case 'hard':
        return handlePermanentDelete();
    }
  };

  // Открытие диалогов
  const openDeleteDialog = (client: Client) => {
    setDeleteConfirm({ show: true, client, type: 'soft', loading: false });
  };

  const openRestoreDialog = (client: Client) => {
    setDeleteConfirm({ show: true, client, type: 'restore', loading: false });
  };

  const openPermanentDeleteDialog = (client: Client) => {
    setDeleteConfirm({ show: true, client, type: 'hard', loading: false });
  };

  // Работа с формой
  const openAddForm = () => {
    setFormData({ name: '', address: '' });
    setEditingClient(null);
    setShowModal(true);
  };

  const openEditForm = (client: Client) => {
    setFormData({ name: client.name, address: client.address });
    setEditingClient(client);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ name: '', address: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      showAlert('error', 'Заполните все поля');
      return;
    }

    if (formData.name.length < 2) {
      showAlert('error', 'Имя клиента должно содержать минимум 2 символа');
      return;
    }

    if (formData.address.length < 5) {
      showAlert('error', 'Адрес должен содержать минимум 5 символов');
      return;
    }

    try {
      setFormLoading(true);

      if (editingClient) {
        // Редактирование
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim()
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        showAlert('success', 'Клиент обновлен');
      } else {
        // Добавление
        const { error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name.trim(),
            address: formData.address.trim(),
            created_by: currentUser.id
          }]);

        if (error) throw error;
        showAlert('success', 'Клиент добавлен');
      }

      closeModal();
      loadClients();
    } catch (error) {
      console.error('Ошибка сохранения клиента:', error);
      showAlert('error', 'Ошибка сохранения клиента');
    } finally {
      setFormLoading(false);
    }
  };

  // Фильтрация клиентов
  const displayedClients = clients.filter(client => {
    if (showDeleted) {
      return client.is_deleted;
    } else {
      return !client.is_deleted;
    }
  });

  // Получение сообщений для диалогов
  const getConfirmMessage = () => {
    const clientName = deleteConfirm.client?.name || '';
    switch (deleteConfirm.type) {
      case 'soft':
        return `Вы уверены, что хотите удалить клиента "${clientName}"?`;
      case 'restore':
        return `Вы уверены, что хотите восстановить клиента "${clientName}"?`;
      case 'hard':
        return `ВНИМАНИЕ! Это действие нельзя отменить. Клиент "${clientName}" будет удален навсегда. Продолжить?`;
      default:
        return '';
    }
  };

  const getConfirmTitle = () => {
    switch (deleteConfirm.type) {
      case 'soft':
        return 'Удалить клиента';
      case 'restore':
        return 'Восстановить клиента';
      case 'hard':
        return 'Удалить навсегда';
      default:
        return '';
    }
  };

  const getConfirmButtonText = () => {
    switch (deleteConfirm.type) {
      case 'soft':
        return 'Удалить';
      case 'restore':
        return 'Восстановить';
      case 'hard':
        return 'Удалить навсегда';
      default:
        return 'Подтвердить';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Building className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Клиенты</h2>
            <p className="text-sm text-gray-500">
              {showDeleted ? 'Удаленные клиенты' : 'Активные клиенты'} ({displayedClients.length})
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <LoadingButton
            onClick={() => setShowDeleted(!showDeleted)}
            variant="secondary"
            loading={false}
          >
            {showDeleted ? 'Показать активных' : 'Показать удаленных'}
          </LoadingButton>
          
          <LoadingButton
            onClick={loadClients}
            variant="secondary"
            loading={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </LoadingButton>
          
          {!showDeleted && (
            <LoadingButton
              onClick={openAddForm}
              variant="primary"
              loading={false}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить клиента
            </LoadingButton>
          )}
        </div>
      </div>

      {/* Уведомления */}
      {alert.show && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: 'success', message: '' })}
        />
      )}

      {/* Список клиентов */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : displayedClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showDeleted ? 'Нет удаленных клиентов' : 'Нет клиентов'}
            </h3>
            <p className="text-gray-500">
              {showDeleted 
                ? 'Удаленные клиенты не найдены' 
                : 'Добавьте первого клиента'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedClients.map((client) => (
            <div 
              key={client.id} 
              className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                client.is_deleted ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {client.name}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {client.address}
                  </p>
                </div>
                
                {client.is_deleted && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Удален
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Создан: {new Date(client.created_at).toLocaleDateString('ru-RU')}
                </p>
                
                <div className="flex gap-2">
                  {client.is_deleted ? (
                    <>
                      <LoadingButton
                        onClick={() => openRestoreDialog(client)}
                        variant="success"
                        loading={false}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </LoadingButton>
                      {userRole === 'admin' && (
                        <LoadingButton
                          onClick={() => openPermanentDeleteDialog(client)}
                          variant="danger"
                          loading={false}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </LoadingButton>
                      )}
                    </>
                  ) : (
                    <>
                      <LoadingButton
                        onClick={() => openEditForm(client)}
                        variant="secondary"
                        loading={false}
                      >
                        <Edit3 className="w-4 h-4" />
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => openDeleteDialog(client)}
                        variant="danger"
                        loading={false}
                      >
                        <Trash2 className="w-4 h-4" />
                      </LoadingButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        size="md"
      >
        <div className="p-6">
          <Form onSubmit={handleSubmit} loading={formLoading}>
            <Form.Field
              label="Название клиента"
              required
              error={!formData.name ? 'Введите название клиента' : ''}
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название клиента"
              />
            </Form.Field>

            <Form.Field
              label="Адрес"
              required
              error={!formData.address ? 'Введите адрес' : ''}
            >
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Введите адрес клиента"
              />
            </Form.Field>

            <Form.Actions>
              <LoadingButton
                type="button"
                onClick={closeModal}
                variant="secondary"
                loading={false}
              >
                Отмена
              </LoadingButton>
              <LoadingButton
                type="submit"
                variant="primary"
                loading={formLoading}
              >
                {editingClient ? 'Обновить' : 'Добавить'}
              </LoadingButton>
            </Form.Actions>
          </Form>
        </div>
      </Modal>

      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onConfirm={handleConfirmAction}
        onCancel={() => setDeleteConfirm({ show: false, client: null, type: 'soft', loading: false })}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmText={getConfirmButtonText()}
        confirmVariant={deleteConfirm.type === 'hard' ? 'danger' : 'primary'}
        loading={deleteConfirm.loading}
      />
    </div>
  );
};

export default memo(ClientsManager);
