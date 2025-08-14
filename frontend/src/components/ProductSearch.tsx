import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { log } from '../utils/logger';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  category: string;
  image_url?: string | null;
  active?: boolean;
}

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Компонент поиска товаров с автокомплитом
 * Показывает подсказки при наборе названия товара
 */
const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onProductSelect,
  placeholder = "Поиск товаров...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = searchTerm.length >= 1 
    ? products.filter(product => 
        product.active !== false && 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Показываем максимум 10 результатов
    : [];

  // Обработка выбора товара
  const handleProductSelect = (product: Product) => {
    log.ui('ProductSearch: выбран товар', { name: product.name, id: product.id });
    onProductSelect(product);
    setSearchTerm('');
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  // Обработка нажатий клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredProducts.length) {
          handleProductSelect(filteredProducts[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Скролл к сфокусированному элементу
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [focusedIndex]);

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Поле поиска */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length >= 2);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(searchTerm.length >= 2)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Выпадающий список */}
      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <ul ref={listRef} className="py-1">
            {filteredProducts.map((product, index) => (
              <li key={product.id}>
                <button
                  onClick={() => handleProductSelect(product)}
                  className={`w-full px-4 py-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                    index === focusedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate mb-1 text-sm leading-tight">
                        {product.name}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                          {product.category}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {product.price.toLocaleString('ru-RU')} тг / {product.unit || 'шт'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          
          {/* Подсказка */}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
            Используйте ↑↓ для навигации, Enter для выбора
          </div>
        </div>
      )}

      {/* Сообщение когда нет результатов */}
      {isOpen && searchTerm.length >= 1 && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-center">
            Товары не найдены
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
