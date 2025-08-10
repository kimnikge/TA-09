import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import ImageUpload from '../../components/ImageUpload';
import { 
  LoadingButton, 
  AlertMessage, 
  Modal, 
  Form, 
  ConfirmDialog 
} from '../../components/common';

interface Product {
  id: string;
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
  
  // Модальные состояния
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    product: Product | null;
    loading: boolean;
  }>({ show: false, product: null, loading: false });
  
  // Форма
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    unit: '',
    category: '',
    image_url: ''
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewUnit, setIsNewUnit] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Уведомления
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  // Загрузка товаров
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      
      // Извлекаем уникальные категории и единицы
      const uniqueCategories = [...new Set((data || []).map(p => p.category))];
      setCategories(uniqueCategories);
      
      const uniqueUnits = [...new Set((data || []).map(p => p.unit).filter(Boolean))];
      setUnits(uniqueUnits);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      showAlert('error', 'Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      unit: '',
      category: '',
      image_url: ''
    });
    setIsNewCategory(false);
    setIsNewUnit(false);
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit || '',
      category: product.category,
      image_url: product.image_url || ''
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name || !formData.price || !formData.unit || !formData.category) {
      showAlert('error', 'Заполните все обязательные поля');
      return;
    }

    if (isNewCategory && formData.category.trim().length < 2) {
      showAlert('error', 'Название категории должно содержать минимум 2 символа');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      showAlert('error', 'Укажите корректную цену');
      return;
    }

    try {
      setFormLoading(true);
      
      const productData = {
        name: formData.name.trim(),
        price,
        unit: formData.unit.trim() || null,
        category: formData.category.trim(),
        image_url: formData.image_url?.trim() || null,
        active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        showAlert('success', 'Товар успешно обновлен');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        showAlert('success', 'Товар успешно добавлен');
      }

      resetForm();
      loadProducts();
      
      // Обновляем списки категорий и единиц
      if (isNewCategory && formData.category && !categories.includes(formData.category)) {
        setCategories(prev => [...prev, formData.category].sort());
      }
      
      if (isNewUnit && formData.unit && !units.includes(formData.unit)) {
        setUnits(prev => [...prev, formData.unit].sort());
      }
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      showAlert('error', 'Ошибка сохранения товара');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({ show: true, product, loading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.product) return;

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));
      
      // Сначала пробуем мягкое удаление
      const { error: softDeleteError } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', deleteConfirm.product.id);

      if (softDeleteError) {
        // Если мягкое удаление не сработало, пробуем полное удаление
        const { error: hardDeleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', deleteConfirm.product.id);

        if (hardDeleteError) throw hardDeleteError;
      }

      showAlert('success', 'Товар успешно удален');
      loadProducts();
      setDeleteConfirm({ show: false, product: null, loading: false });
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      showAlert('error', 'Ошибка удаления товара');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestore = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: true })
        .eq('id', product.id);

      if (error) throw error;

      showAlert('success', 'Товар восстановлен');
      loadProducts();
    } catch (error) {
      console.error('Ошибка восстановления товара:', error);
      showAlert('error', 'Ошибка восстановления товара');
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesActive = showInactive || product.active !== false;
    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Товары</h2>
            <p className="text-sm text-gray-500">
              Управление товарами ({filteredProducts.length} из {products.length})
              {!showInactive && (
                <span className="text-gray-400 ml-2">
                  (скрыто неактивных: {products.filter(p => p.active === false).length})
                </span>
              )}
            </p>
          </div>
        </div>
        <LoadingButton
          onClick={handleAdd}
          variant="primary"
          loading={false}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Добавить товар</span>
          <span className="sm:hidden">Добавить</span>
        </LoadingButton>
      </div>

      {/* Уведомления */}
      {alert.show && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: 'success', message: '' })}
        />
      )}

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
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
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showInactive" className="ml-2 text-sm text-gray-700">
            Показывать неактивные товары
          </label>
        </div>
      </div>

      {/* Список товаров */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет товаров</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory 
                ? 'По вашему запросу товары не найдены' 
                : 'Добавьте первый товар'
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
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Категория
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`${product.active === false ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.active === false 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.active === false ? 'Неактивен' : 'Активен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {product.active === false ? (
                          <LoadingButton
                            onClick={() => handleRestore(product)}
                            variant="success"
                            loading={false}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </LoadingButton>
                        ) : (
                          <>
                            <LoadingButton
                              onClick={() => handleEdit(product)}
                              variant="secondary"
                              loading={false}
                            >
                              <Edit className="w-4 h-4" />
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => handleDeleteClick(product)}
                              variant="danger"
                              loading={false}
                            >
                              <Trash2 className="w-4 h-4" />
                            </LoadingButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        size="lg"
      >
        <div className="p-6">
          <Form onSubmit={handleSubmit} loading={formLoading}>
            <Form.Field
              label="Название товара"
              required
              error={!formData.name ? 'Введите название товара' : ''}
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название товара"
              />
            </Form.Field>

            <Form.Field
              label="Цена"
              required
              error={!formData.price ? 'Введите цену' : ''}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </Form.Field>

            <Form.Field
              label="Единица измерения"
              required
            >
              <div className="space-y-2">
                <select
                  value={isNewUnit ? 'new' : formData.unit}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsNewUnit(true);
                      setFormData(prev => ({ ...prev, unit: '' }));
                    } else {
                      setIsNewUnit(false);
                      setFormData(prev => ({ ...prev, unit: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите единицу</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                  <option value="new">+ Добавить новую</option>
                </select>
                
                {isNewUnit && (
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите новую единицу измерения"
                  />
                )}
              </div>
            </Form.Field>

            <Form.Field
              label="Категория"
              required
            >
              <div className="space-y-2">
                <select
                  value={isNewCategory ? 'new' : formData.category}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsNewCategory(true);
                      setFormData(prev => ({ ...prev, category: '' }));
                    } else {
                      setIsNewCategory(false);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="new">+ Добавить новую</option>
                </select>
                
                {isNewCategory && (
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите новую категорию"
                  />
                )}
              </div>
            </Form.Field>

            <Form.Field label="Изображение">
              <ImageUpload
                onImageChange={(url) => setFormData(prev => ({ ...prev, image_url: url || '' }))}
                currentImageUrl={formData.image_url}
              />
            </Form.Field>

            <Form.Actions>
              <LoadingButton
                type="button"
                onClick={resetForm}
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
                {editingProduct ? 'Обновить' : 'Добавить'}
              </LoadingButton>
            </Form.Actions>
          </Form>
        </div>
      </Modal>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ show: false, product: null, loading: false })}
        title="Удалить товар"
        message={`Вы уверены, что хотите удалить товар "${deleteConfirm.product?.name}"?`}
        confirmText="Удалить"
        confirmVariant="danger"
        loading={deleteConfirm.loading}
      />
    </div>
  );
};

export default ProductsSection;
