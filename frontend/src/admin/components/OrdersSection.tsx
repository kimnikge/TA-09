import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Filter, Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { 
  LoadingButton, 
  AlertMessage, 
  Modal
} from '../../components/common';

// Утилиты для экспорта
const createCSV = (data: Record<string, unknown>[], delimiter = ';') => {
  if (data.length === 0) return '';
  
  const keys = Object.keys(data[0]);
  const csvHeaders = keys.join(delimiter);
  const csvRows = data.map(row => 
    keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(delimiter)
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

const downloadFile = (content: string, filename: string, type: 'csv' | 'excel') => {
  const mimeType = type === 'csv' 
    ? 'text/csv;charset=utf-8;' 
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface Order {
  id: string;
  rep_id: string;
  client_id: string;
  delivery_date: string;
  total_items: number;
  total_price: number;
  created_at: string;
  status?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  unit: string;
  comment?: string;
  product_name?: string;
  category?: string;
}

interface Client {
  id: string;
  name: string;
  address: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
}

interface OrderFilters {
  dateFrom: string;
  dateTo: string;
  selectedReps: string[];
  selectedCategories: string[];
  selectedClients: string[];
  status: string;
  minAmount: string;
  maxAmount: string;
}

const OrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [clients, setClients] = useState<{ [clientId: string]: Client }>({});
  const [profiles, setProfiles] = useState<{ [profileId: string]: Profile }>({});
  const [products, setProducts] = useState<{ [productId: string]: Product }>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSummaryReportModal, setShowSummaryReportModal] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState<OrderFilters>({
    dateFrom: '',
    dateTo: '',
    selectedReps: [],
    selectedCategories: [],
    selectedClients: [],
    status: 'all',
    minAmount: '',
    maxAmount: ''
  });
  
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 OrdersSection: Начинаем загрузку заказов...');

      // Загружаем заказы
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📦 OrdersSection: Заказы из БД:', ordersData);
      console.log('❌ OrdersSection: Ошибка загрузки заказов:', ordersError);

      if (ordersError) {
        console.error('❌ OrdersSection: Ошибка загрузки заказов:', ordersError);
        throw ordersError;
      }
      
      console.log(`✅ OrdersSection: Загружено заказов: ${(ordersData || []).length}`);
      setOrders(ordersData || []);

      // Загружаем связанные данные
      if (ordersData && ordersData.length > 0) {
        const clientIds = [...new Set(ordersData.map(o => o.client_id))];
        const profileIds = [...new Set(ordersData.map(o => o.rep_id))];

        // Загружаем клиентов
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds);

        const clientsMap: { [key: string]: Client } = {};
        clientsData?.forEach(client => {
          clientsMap[client.id] = client;
        });
        setClients(clientsMap);

        // Загружаем профили менеджеров
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);

        const profilesMap: { [key: string]: Profile } = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        setProfiles(profilesMap);

        // Загружаем позиции заказов
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', ordersData.map(o => o.id));

        const itemsMap: { [key: string]: OrderItem[] } = {};
        itemsData?.forEach(item => {
          if (!itemsMap[item.order_id]) {
            itemsMap[item.order_id] = [];
          }
          itemsMap[item.order_id].push(item);
        });
        setOrderItems(itemsMap);

        // Загружаем продукты
        const productIds = [...new Set(itemsData?.map(item => item.product_id) || [])];
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

          const productsMap: { [key: string]: Product } = {};
          const categoriesSet = new Set<string>();
          
          productsData?.forEach(product => {
            productsMap[product.id] = product;
            categoriesSet.add(product.category);
          });
          
          setProducts(productsMap);
          setCategories(Array.from(categoriesSet).sort());
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      showAlert('error', 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Фильтрация заказов
  // Добавляем логирование для отладки
  console.log('🎯 OrdersSection: Всего заказов в state:', orders.length);
  console.log('🎯 OrdersSection: Заказы:', orders);

  const filteredOrders = orders.filter(order => {
    // Фильтр по датам
    if (filters.dateFrom && new Date(order.created_at) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(order.created_at) > new Date(filters.dateTo + 'T23:59:59')) {
      return false;
    }

    // Фильтр по менеджерам
    if (filters.selectedReps.length > 0 && !filters.selectedReps.includes(order.rep_id)) {
      return false;
    }

    // Фильтр по клиентам
    if (filters.selectedClients.length > 0 && !filters.selectedClients.includes(order.client_id)) {
      return false;
    }

    // Фильтр по сумме
    if (filters.minAmount && order.total_price < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && order.total_price > parseFloat(filters.maxAmount)) {
      return false;
    }

    // Фильтр по категориям товаров
    if (filters.selectedCategories.length > 0) {
      const orderItemsList = orderItems[order.id] || [];
      const hasSelectedCategory = orderItemsList.some(item => {
        const product = products[item.product_id];
        return product && filters.selectedCategories.includes(product.category);
      });
      if (!hasSelectedCategory) {
        return false;
      }
    }

    return true;
  });

  // Логируем результат фильтрации
  console.log('🎯 OrdersSection: После фильтрации заказов:', filteredOrders.length);
  console.log('🎯 OrdersSection: Отфильтрованные заказы:', filteredOrders);

  // Экспорт данных
  const exportOrders = async (format: 'csv' | 'excel') => {
    try {
      const exportData: Record<string, unknown>[] = [];

      for (const order of filteredOrders) {
        const client = clients[order.client_id];
        const manager = profiles[order.rep_id];
        const items = orderItems[order.id] || [];

        if (items.length > 0) {
          // Если есть категории фильтра, экспортируем только товары из выбранных категорий
          const itemsToExport = filters.selectedCategories.length > 0
            ? items.filter(item => {
                const product = products[item.product_id];
                return product && filters.selectedCategories.includes(product.category);
              })
            : items;

          for (const item of itemsToExport) {
            const product = products[item.product_id];
            exportData.push({
              'Дата заказа': new Date(order.created_at).toLocaleDateString('ru-RU'),
              'Время заказа': new Date(order.created_at).toLocaleTimeString('ru-RU'),
              'Клиент': client?.name || 'Неизвестен',
              'Адрес': client?.address || '',
              'Менеджер': manager?.name || 'Неизвестен',
              'Товар': product?.name || item.product_name || 'Неизвестен',
              'Категория': product?.category || '',
              'Количество': item.quantity,
              'Единица': item.unit,
              'Цена за единицу': item.price,
              'Сумма позиции': item.quantity * item.price,
              'Общая сумма заказа': order.total_price,
              'Всего позиций в заказе': order.total_items
            });
          }
        } else {
          exportData.push({
            'Дата заказа': new Date(order.created_at).toLocaleDateString('ru-RU'),
            'Время заказа': new Date(order.created_at).toLocaleTimeString('ru-RU'),
            'Клиент': client?.name || 'Неизвестен',
            'Адрес': client?.address || '',
            'Менеджер': manager?.name || 'Неизвестен',
            'Товар': 'Нет позиций',
            'Категория': '',
            'Количество': 0,
            'Единица': '',
            'Цена за единицу': 0,
            'Сумма позиции': 0,
            'Общая сумма заказа': order.total_price,
            'Всего позиций в заказе': order.total_items
          });
        }
      }

      if (exportData.length === 0) {
        showAlert('error', 'Нет данных для экспорта с выбранными фильтрами');
        return;
      }

      const csv = createCSV(exportData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `orders_export_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      downloadFile(csv, filename, format);
      
      showAlert('success', `Экспортировано ${exportData.length} записей в формате ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      showAlert('error', 'Ошибка при экспорте данных');
    }
  };

  // Генерация сводного отчета по товарам
  const generateSummaryReport = (dateFrom: string, dateTo: string) => {
    try {
      // Фильтруем заказы по выбранному периоду
      const filteredOrdersForReport = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const fromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
        
        return orderDate >= fromDate && orderDate <= toDate;
      });

      // Собираем все товары из отфильтрованных заказов
      const productSummary: { [productId: string]: {
        name: string;
        category: string;
        unit: string;
        price: number;
        totalQuantity: number;
        totalAmount: number;
      }} = {};

      filteredOrdersForReport.forEach(order => {
        const items = orderItems[order.id] || [];
        items.forEach(item => {
          const product = products[item.product_id];
          if (!product) return;

          if (!productSummary[item.product_id]) {
            productSummary[item.product_id] = {
              name: product.name,
              category: product.category,
              unit: product.unit,
              price: item.price, // Цена из заказа (может меняться)
              totalQuantity: 0,
              totalAmount: 0
            };
          }

          productSummary[item.product_id].totalQuantity += item.quantity;
          productSummary[item.product_id].totalAmount += item.quantity * item.price;
        });
      });

      // Преобразуем в массив для сортировки
      const reportData = Object.values(productSummary)
        .filter(item => item.totalQuantity > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount); // Сортируем по сумме убывания

      return {
        data: reportData,
        period: {
          from: dateFrom || 'Начало',
          to: dateTo || 'Настоящее время'
        },
        totalOrders: filteredOrdersForReport.length,
        totalProducts: reportData.length,
        grandTotal: reportData.reduce((sum, item) => sum + item.totalAmount, 0)
      };
    } catch (error) {
      console.error('Ошибка генерации сводного отчета:', error);
      showAlert('error', 'Ошибка при генерации сводного отчета');
      return null;
    }
  };

  // Экспорт сводного отчета
  const exportSummaryReport = (dateFrom: string, dateTo: string, format: 'csv' | 'excel') => {
    const reportData = generateSummaryReport(dateFrom, dateTo);
    if (!reportData || reportData.data.length === 0) {
      showAlert('error', 'Нет данных для генерации отчета за выбранный период');
      return;
    }

    // Формируем данные для экспорта
    const exportData: Record<string, unknown>[] = reportData.data.map((item, index) => ({
      'Позиция': index + 1,
      'Наименование товара': item.name,
      'Категория': item.category,
      'Количество': item.totalQuantity,
      'Единица измерения': item.unit,
      'Цена за единицу (тг)': item.price.toLocaleString('ru-RU'),
      'Общая сумма (тг)': item.totalAmount.toLocaleString('ru-RU')
    }));

    // Добавляем итоговую информацию
    exportData.push(
      { 'Позиция': '', 'Наименование товара': '', 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' },
      { 'Позиция': '', 'Наименование товара': 'ИТОГО ПО ОТЧЕТУ:', 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' },
      { 'Позиция': '', 'Наименование товара': `Период: ${reportData.period.from} - ${reportData.period.to}`, 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' },
      { 'Позиция': '', 'Наименование товара': `Количество заказов: ${reportData.totalOrders}`, 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' },
      { 'Позиция': '', 'Наименование товара': `Уникальных товаров: ${reportData.totalProducts}`, 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' },
      { 'Позиция': '', 'Наименование товара': `Общая сумма: ${reportData.grandTotal.toLocaleString('ru-RU')} тг`, 'Категория': '', 'Количество': '', 'Единица измерения': '', 'Цена за единицу (тг)': '', 'Общая сумма (тг)': '' }
    );

    const csv = createCSV(exportData);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `summary_report_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    
    downloadFile(csv, filename, format);
    showAlert('success', `Сводный отчет экспортирован: ${reportData.totalProducts} товаров`);
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      selectedReps: [],
      selectedCategories: [],
      selectedClients: [],
      status: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  const toggleArrayFilter = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(v => v !== value)
      : [...array, value];
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <ShoppingCart className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Управление заказами</h2>
            <p className="text-sm text-gray-500">
              Показано {filteredOrders.length} из {orders.length} заказов
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <LoadingButton
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
            loading={false}
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </LoadingButton>
          
          <LoadingButton
            onClick={() => setShowExportModal(true)}
            variant="secondary"
            loading={false}
            disabled={filteredOrders.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </LoadingButton>
          
          <LoadingButton
            onClick={() => setShowSummaryReportModal(true)}
            variant="primary"
            loading={false}
            disabled={orders.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Сводный отчет
          </LoadingButton>
          
          <LoadingButton
            onClick={loadOrders}
            variant="secondary"
            loading={loading}
          >
            Обновить
          </LoadingButton>
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

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Фильтры</h3>
            <div className="flex gap-2">
              <LoadingButton
                onClick={resetFilters}
                variant="secondary"
                loading={false}
              >
                Сбросить
              </LoadingButton>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Период */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Период заказов
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="С даты"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="По дату"
                />
              </div>
            </div>

            {/* Сумма заказа */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сумма заказа (тг)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="От"
                />
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="До"
                />
              </div>
            </div>

            {/* Менеджеры */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Менеджеры ({filters.selectedReps.length} выбрано)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {Object.values(profiles).map(profile => (
                  <label 
                    key={profile.id} 
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      filters.selectedReps.includes(profile.id)
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedReps.includes(profile.id)}
                      onChange={() => setFilters(prev => ({
                        ...prev,
                        selectedReps: toggleArrayFilter(prev.selectedReps, profile.id)
                      }))}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className={`text-sm ${
                      filters.selectedReps.includes(profile.id)
                        ? 'font-medium text-green-800'
                        : 'text-gray-700'
                    }`}>
                      {profile.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Категории товаров */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категории товаров ({filters.selectedCategories.length} выбрано)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {categories.map(category => (
                  <label 
                    key={category} 
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      filters.selectedCategories.includes(category)
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCategories.includes(category)}
                      onChange={() => setFilters(prev => ({
                        ...prev,
                        selectedCategories: toggleArrayFilter(prev.selectedCategories, category)
                      }))}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${
                      filters.selectedCategories.includes(category)
                        ? 'font-medium text-blue-800'
                        : 'text-gray-700'
                    }`}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Клиенты */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Клиенты ({filters.selectedClients.length} выбрано)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {Object.values(clients).map(client => (
                  <label 
                    key={client.id} 
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      filters.selectedClients.includes(client.id)
                        ? 'bg-purple-50 border border-purple-200 text-purple-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedClients.includes(client.id)}
                      onChange={() => setFilters(prev => ({
                        ...prev,
                        selectedClients: toggleArrayFilter(prev.selectedClients, client.id)
                      }))}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className={`text-sm ${
                      filters.selectedClients.includes(client.id)
                        ? 'font-medium text-purple-800'
                        : 'text-gray-700'
                    }`}>
                      {client.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
          <div className="text-xs sm:text-sm text-blue-600">Заказов</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {filteredOrders.reduce((sum, order) => sum + order.total_price, 0).toLocaleString('ru-RU')} тг
          </div>
          <div className="text-xs sm:text-sm text-green-600">Общая сумма</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">
            {filteredOrders.reduce((sum, order) => sum + order.total_items, 0)}
          </div>
          <div className="text-xs sm:text-sm text-orange-600">Позиций</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {new Set(filteredOrders.map(o => o.rep_id)).size}
          </div>
          <div className="text-xs sm:text-sm text-purple-600">Менеджеров</div>
        </div>
      </div>

      {/* Список заказов */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заказов</h3>
            <p className="text-gray-500">
              {orders.length === 0 
                ? 'Заказы не найдены' 
                : 'По выбранным фильтрам заказы не найдены'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Заказ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Менеджер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Доставка
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Позиций
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clients[order.client_id]?.name || 'Неизвестен'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {profiles[order.rep_id]?.name || 'Неизвестен'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.delivery_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.total_price.toLocaleString('ru-RU')} тг
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total_items}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <LoadingButton
                          onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                          variant="secondary"
                          loading={false}
                        >
                          {selectedOrder === order.id ? 'Скрыть' : 'Детали'}
                        </LoadingButton>
                      </td>
                    </tr>
                    
                    {/* Детали заказа - отображаются под выбранным заказом */}
                    {selectedOrder === order.id && orderItems[order.id] && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900">
                              Детали заказа #{order.id.slice(-8)}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 bg-white rounded border">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Товар</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Категория</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Кол-во</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Цена</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Сумма</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Комментарий</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {orderItems[order.id].map((item) => {
                                    const product = products[item.product_id];
                                    return (
                                      <tr key={item.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {product?.name || item.product_name || 'Неизвестен'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {product?.category || '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {item.quantity} {item.unit}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {item.price.toLocaleString('ru-RU')} тг
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                          {(item.quantity * item.price).toLocaleString('ru-RU')} тг
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {item.comment || '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно экспорта */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Экспорт заказов"
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Выберите формат файла:</h4>
              <div className="grid grid-cols-2 gap-3">
                <LoadingButton
                  onClick={() => exportOrders('csv')}
                  variant="secondary"
                  loading={false}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV файл
                </LoadingButton>
                <LoadingButton
                  onClick={() => exportOrders('excel')}
                  variant="secondary"
                  loading={false}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel файл
                </LoadingButton>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Данные для экспорта:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Заказов: {filteredOrders.length}</li>
                <li>• Период: {filters.dateFrom || 'Все'} - {filters.dateTo || 'Все'}</li>
                {filters.selectedReps.length > 0 && (
                  <li>• Менеджеров: {filters.selectedReps.length}</li>
                )}
                {filters.selectedCategories.length > 0 && (
                  <li>• Категорий товаров: {filters.selectedCategories.length}</li>
                )}
                {filters.selectedClients.length > 0 && (
                  <li>• Клиентов: {filters.selectedClients.length}</li>
                )}
              </ul>
            </div>
            
            <p className="text-sm text-gray-500">
              Файл будет содержать детальную информацию по каждой позиции заказов 
              с учетом выбранных фильтров.
            </p>
          </div>
        </div>
      </Modal>

      {/* Модальное окно сводного отчета */}
      <Modal
        isOpen={showSummaryReportModal}
        onClose={() => setShowSummaryReportModal(false)}
        title="Сводный отчет по товарам"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Создайте сводный отчет по товарам за выбранный период. 
              Отчет покажет общее количество и сумму для каждого товара.
            </p>
            
            {/* Выбор периода */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата с:
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата по:
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Предпросмотр отчета */}
            {(() => {
              const reportPreview = generateSummaryReport(filters.dateFrom, filters.dateTo);
              if (reportPreview && reportPreview.data.length > 0) {
                return (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Предпросмотр отчета:</h4>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>Период: {reportPreview.period.from} - {reportPreview.period.to}</div>
                      <div>Заказов: {reportPreview.totalOrders}</div>
                      <div>Уникальных товаров: {reportPreview.totalProducts}</div>
                      <div className="font-semibold">Общая сумма: {reportPreview.grandTotal.toLocaleString('ru-RU')} тг</div>
                    </div>
                    
                    {/* Топ 5 товаров */}
                    <div className="max-h-40 overflow-y-auto">
                      <div className="text-xs font-medium text-gray-700 mb-2">Топ товары по сумме:</div>
                      {reportPreview.data.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-600 py-1">
                          <span className="truncate flex-1 mr-2">{item.name}</span>
                          <span className="text-nowrap">
                            {item.totalQuantity} {item.unit} × {item.price.toLocaleString('ru-RU')} = {item.totalAmount.toLocaleString('ru-RU')} тг
                          </span>
                        </div>
                      ))}
                      {reportPreview.data.length > 5 && (
                        <div className="text-xs text-gray-500 pt-1">
                          ... и еще {reportPreview.data.length - 5} товаров
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">
                    Нет данных за выбранный период. Выберите другие даты или оставьте поля пустыми для всего периода.
                  </p>
                </div>
              );
            })()}

            {/* Кнопки экспорта */}
            <div className="flex gap-3">
              <LoadingButton
                onClick={() => {
                  exportSummaryReport(filters.dateFrom, filters.dateTo, 'csv');
                  setShowSummaryReportModal(false);
                }}
                variant="secondary"
                loading={false}
                disabled={!generateSummaryReport(filters.dateFrom, filters.dateTo)?.data.length}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV файл
              </LoadingButton>
              <LoadingButton
                onClick={() => {
                  exportSummaryReport(filters.dateFrom, filters.dateTo, 'excel');
                  setShowSummaryReportModal(false);
                }}
                variant="primary"
                loading={false}
                disabled={!generateSummaryReport(filters.dateFrom, filters.dateTo)?.data.length}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel файл
              </LoadingButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersSection;
