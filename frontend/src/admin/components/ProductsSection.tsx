import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Save, X, RotateCcw, EyeOff } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import ImageUpload from '../../components/ImageUpload';

interface Product {
  id: string; // UUID в Supabase
  name: string;
  price: number;
  unit: string | null;
  category: string;
  image_url?: string | null;
  active?: boolean;
}

interface ProductFormData {
  name: string;
  price: string;
  unit: string;
  category: string;
  image_url?: string;
}

const ProductsSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewUnit, setIsNewUnit] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    unit: '',
    category: '',
    image_url: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Загрузка товаров
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      
      // Отладочная информация о статусе товаров
      console.log('Загруженные товары с их статусом active:', 
        (data || []).map(p => ({ name: p.name, active: p.active, type: typeof p.active }))
      );
      
      // Извлекаем уникальные категории
      const uniqueCategories = [...new Set((data || []).map(p => p.category))];
      setCategories(uniqueCategories);
      
      // Извлекаем уникальные единицы измерения
      const uniqueUnits = [...new Set((data || []).map(p => p.unit).filter(Boolean))];
      setUnits(uniqueUnits);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    // Товар активен, если active === true или active === null/undefined (по умолчанию активен)
    const isActive = product.active !== false;
    const matchesActiveFilter = showInactive || isActive;
    return matchesSearch && matchesCategory && matchesActiveFilter;
  });

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      unit: '',
      category: '',
      image_url: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
    setIsNewCategory(false);
    setIsNewUnit(false);
    setError('');
  };

  // Начать редактирование
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit || '',
      category: product.category,
      image_url: product.image_url || ''
    });
    // Проверяем, есть ли категория товара в списке существующих
    setIsNewCategory(!categories.includes(product.category));
    // Проверяем, есть ли единица измерения в списке существующих
    setIsNewUnit(product.unit ? !units.includes(product.unit) : false);
    setShowAddForm(true);
  };

  // Сохранение товара (добавление или редактирование)
  const saveProduct = async () => {
    try {
      setError('');
      
      // Валидация
      if (!formData.name || !formData.price || !formData.unit || !formData.category) {
        setError('Все поля обязательны для заполнения');
        return;
      }

      // Дополнительная валидация для новой категории
      if (isNewCategory && formData.category.trim().length < 2) {
        setError('Название новой категории должно содержать минимум 2 символа');
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Цена должна быть положительным числом');
        return;
      }

      const productData = {
        name: formData.name.trim(),
        price: price,
        unit: formData.unit.trim() || null,
        category: formData.category.trim(),
        image_url: formData.image_url?.trim() || null
      };

      if (editingProduct) {
        // Редактирование
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setSuccess('Товар успешно обновлен');
      } else {
        // Добавление
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        setSuccess('Товар успешно добавлен');
      }

      resetForm();
      loadProducts();
      
      // Если добавлена новая категория, обновляем список категорий
      if (isNewCategory && formData.category && !categories.includes(formData.category)) {
        setCategories(prev => [...prev, formData.category].sort());
      }
      
      // Если добавлена новая единица измерения, обновляем список единиц
      if (isNewUnit && formData.unit && !units.includes(formData.unit)) {
        setUnits(prev => [...prev, formData.unit].sort());
      }
      
      // Убираем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      setError('Ошибка сохранения товара');
    }
  };

  // Удаление товара (сначала пробуем мягкое удаление)
  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить товар "${name}"?\n\nЕсли товар используется в заказах, он будет деактивирован.\nЕсли не используется - будет удален полностью.`)) {
      return;
    }

    try {
      console.log('🗑️ Начинаем удаление товара:', { id, name });
      
      // Сначала проверяем, используется ли товар в заказах
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (checkError) {
        console.error('❌ Ошибка при проверке связанных заказов:', checkError);
        throw checkError;
      }

      // Если товар используется в заказах, делаем мягкое удаление
      if (orderItems && orderItems.length > 0) {
        console.log('⚠️ Товар используется в заказах, выполняем мягкое удаление');
        
        const { error: softDeleteError } = await supabase
          .from('products')
          .update({ active: false })
          .eq('id', id);

        if (softDeleteError) {
          console.error('❌ Ошибка при мягком удалении:', softDeleteError);
          throw softDeleteError;
        }

        console.log('✅ Товар деактивирован (мягкое удаление)');
        setSuccess('Товар деактивирован (используется в заказах)');
      } else {
        // Если товар не используется, можем полностью удалить
        console.log('🗑️ Товар не используется в заказах, выполняем полное удаление');
        
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('❌ Ошибка при полном удалении:', deleteError);
          throw deleteError;
        }

        console.log('✅ Товар полностью удален');
        setSuccess('Товар успешно удален');
      }

      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Ошибка удаления товара:', error);
      
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка удаления товара';
      
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Нельзя удалить товар, который используется в заказах';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Недостаточно прав для удаления товара';
        } else if (error.message.includes('Row Level Security')) {
          errorMessage = 'Ошибка доступа к базе данных';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Товар с таким именем уже существует';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Восстановление деактивированного товара
  const restoreProduct = async (id: string, name: string) => {
    if (!confirm(`Вы уверены, что хотите восстановить товар "${name}"?`)) {
      return;
    }

    try {
      console.log('🔄 Начинаем восстановление товара:', { id, name });
      
      const { error } = await supabase
        .from('products')
        .update({ active: true })
        .eq('id', id);

      if (error) {
        console.error('❌ Ошибка при восстановлении товара:', error);
        throw error;
      }

      console.log('✅ Товар успешно восстановлен:', { id, name });
      setSuccess('Товар успешно восстановлен');
      loadProducts();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Ошибка восстановления товара:', error);
      
      let errorMessage = 'Ошибка восстановления товара';
      
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          errorMessage = 'Недостаточно прав для восстановления товара';
        } else if (error.message.includes('Row Level Security')) {
          errorMessage = 'Ошибка доступа к базе данных';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Деактивация товара (мягкое удаление)
  const deactivateProduct = async (id: string, name: string) => {
    if (!confirm(`Вы уверены, что хотите деактивировать товар "${name}"?\n\nТовар останется в системе, но будет скрыт от продажи.`)) {
      return;
    }

    try {
      console.log('🔒 Начинаем деактивацию товара:', { id, name });
      
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);

      if (error) {
        console.error('❌ Ошибка при деактивации товара:', error);
        throw error;
      }

      console.log('✅ Товар успешно деактивирован:', { id, name });
      setSuccess('Товар успешно деактивирован');
      loadProducts();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Ошибка деактивации товара:', error);
      
      let errorMessage = 'Ошибка деактивации товара';
      
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          errorMessage = 'Недостаточно прав для деактивации товара';
        } else if (error.message.includes('Row Level Security')) {
          errorMessage = 'Ошибка доступа к базе данных';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Загрузка товаров...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-medium text-gray-900">Управление товарами</h2>
            <p className="text-sm text-gray-500 mt-1">
              Добавляйте, редактируйте и управляйте товарами
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-600">
                Всего: <span className="font-medium">{products.length}</span>
              </span>
              <span className="text-sm text-gray-600">
                Активных: <span className="font-medium text-green-600">{products.filter(p => p.active !== false).length}</span>
              </span>
              {products.filter(p => p.active === false).length > 0 && (
                <span className="text-sm text-gray-600">
                  Деактивированных: <span className="font-medium text-red-600">{products.filter(p => p.active === false).length}</span>
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Добавить товар</span>
            <span className="sm:hidden">Добавить</span>
          </button>
        </div>

        {/* Поиск и фильтры */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-0 sm:min-w-[150px]"
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Фильтр неактивных товаров */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInactive" className="ml-2 text-sm text-gray-700">
              Показать деактивированные товары
            </label>
          </div>
        </div>

        {/* Сообщения об ошибках и успехе */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Список товаров */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {products.length === 0 ? 'Нет товаров' : 'Товары не найдены'}
            </h3>
            <p className="text-gray-500">
              {products.length === 0 
                ? 'Добавьте первый товар, нажав кнопку "Добавить товар"'
                : 'Попробуйте изменить критерии поиска'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Десктоп версия - таблица */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Изображение
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Единица
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50 ${product.active === false ? 'bg-red-50 opacity-75' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-sm font-medium ${product.active === false ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                            {product.name}
                          </div>
                          {product.active === false && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Деактивирован
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.price.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {product.active !== false ? (
                            <>
                              {/* Кнопки для активных товаров */}
                              <button
                                onClick={() => startEdit(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id, product.name)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Кнопки для деактивированных товаров */}
                              <button
                                onClick={() => restoreProduct(product.id, product.name)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                title="Восстановить товар"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEdit(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Мобильная версия - карточки */}
            <div className="lg:hidden space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className={`border border-gray-200 rounded-lg p-4 space-y-3 ${
                  product.active === false ? 'bg-red-50 border-red-200' : 'bg-white'
                }`}>
                  {/* Основная информация */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className={`w-16 h-16 object-cover rounded-lg border ${
                            product.active === false ? 'opacity-50 grayscale' : ''
                          }`}
                        />
                      ) : (
                        <div className={`w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center ${
                          product.active === false ? 'opacity-50' : ''
                        }`}>
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-base font-medium ${
                          product.active === false ? 'text-red-700 line-through' : 'text-gray-900'
                        }`}>
                          {product.name}
                        </h3>
                        {product.active === false && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Деактивирован
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-semibold text-lg ${
                          product.active === false ? 'text-red-700' : 'text-gray-900'
                        }`}>
                          {product.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-gray-500">за {product.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center justify-end space-x-1 sm:space-x-3 pt-3 border-t border-gray-100">
                    {/* Определяем, активен ли товар (по умолчанию активен, если не false) */}
                    {product.active !== false ? (
                      <>
                        {/* Кнопки для активных товаров */}
                        <button
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="Изменить товар"
                        >
                          <Edit className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Изменить</span>
                        </button>
                        <button
                          onClick={() => deactivateProduct(product.id, product.name)}
                          className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors"
                          title="Деактивировать товар"
                        >
                          <EyeOff className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Деактивировать</span>
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                          title="Удалить товар"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Удалить</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Кнопки для деактивированных товаров */}
                        <button
                          onClick={() => restoreProduct(product.id, product.name)}
                          className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                          title="Восстановить товар"
                        >
                          <RotateCcw className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Восстановить</span>
                        </button>
                        <button
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="Изменить товар"
                        >
                          <Edit className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Изменить</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Модальное окно добавления/редактирования товара */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Основная информация в одной строке на десктопе */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Введите название товара"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Единица измерения и категория */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения *
                  </label>
                  {!isNewUnit ? (
                    <div className="space-y-2">
                      {/* Выпадающий список существующих единиц */}
                      <select
                        value={formData.unit}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsNewUnit(true);
                            setFormData({...formData, unit: ''});
                          } else {
                            setFormData({...formData, unit: e.target.value});
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
                      >
                        <option value="">Выберите единицу измерения</option>
                        {/* Популярные единицы измерения */}
                        <option value="шт">шт (штуки)</option>
                        <option value="кг">кг (килограммы)</option>
                        <option value="г">г (граммы)</option>
                        <option value="л">л (литры)</option>
                        <option value="упак">упак (упаковки)</option>
                        {/* Существующие единицы из базы */}
                        {units.filter(unit => !['шт', 'кг', 'г', 'л', 'упак'].includes(unit)).map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                        <option value="__new__">+ Добавить новую единицу</option>
                      </select>
                      
                      {/* Кнопка для добавления новой единицы */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewUnit(true);
                          setFormData({...formData, unit: ''});
                        }}
                        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors text-sm"
                      >
                        + Добавить новую единицу измерения
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Поле ввода новой единицы */}
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base bg-green-50"
                        placeholder="Введите новую единицу измерения"
                        autoFocus
                      />
                      
                      {/* Кнопки управления */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewUnit(false);
                            setFormData({...formData, unit: ''});
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Отмена
                        </button>
                        <span className="text-xs text-green-600 flex items-center">
                          Новая единица измерения будет добавлена
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  {!isNewCategory ? (
                    <div className="space-y-2">
                      {/* Выпадающий список существующих категорий */}
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsNewCategory(true);
                            setFormData({...formData, category: ''});
                          } else {
                            setFormData({...formData, category: e.target.value});
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
                      >
                        <option value="">Выберите категорию</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="__new__">+ Добавить новую категорию</option>
                      </select>
                      
                      {/* Кнопка для добавления новой категории */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategory(true);
                          setFormData({...formData, category: ''});
                        }}
                        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors text-sm"
                      >
                        + Добавить новую категорию
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Поле ввода новой категории */}
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-blue-50"
                        placeholder="Введите название новой категории"
                        autoFocus
                      />
                      
                      {/* Кнопки управления */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCategory(false);
                            setFormData({...formData, category: ''});
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Отмена
                        </button>
                        <span className="text-xs text-blue-600 flex items-center">
                          Новая категория будет добавлена
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Изображение - занимает всю ширину */}
              <div>
                <ImageUpload
                  currentImageUrl={formData.image_url}
                  onImageChange={(imageUrl) => setFormData({...formData, image_url: imageUrl || ''})}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={saveProduct}
                className="w-full sm:flex-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors text-base"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Сохранить изменения' : 'Добавить товар'}
              </button>
              <button
                onClick={resetForm}
                className="w-full sm:flex-1 bg-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-400 transition-colors text-base"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsSection;
