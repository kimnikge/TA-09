import React from 'react';
import { Plus, Minus, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  category: string;
  image_url?: string | null;
  active?: boolean;
}

interface CompactProductCardProps {
  product: Product;
  quantity: number;
  comment: string;
  onQuantityChange: (productId: string, delta: number) => void;
  onQuantitySet: (productId: string, value: string) => void;
  onCommentChange: (productId: string, comment: string) => void;
  onImageClick: (imageUrl: string) => void;
}

/**
 * Квадратная карточка товара с удобным управлением
 * Оптимизирована для каталога товаров в форме заказа
 */
const CompactProductCard: React.FC<CompactProductCardProps> = ({
  product,
  quantity,
  comment,
  onQuantityChange,
  onQuantitySet,
  onCommentChange,
  onImageClick
}) => {
  return (
    <div className={`relative border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-lg ${
      quantity > 0 
        ? 'border-green-300 bg-green-50 shadow-md' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Изображение товара */}
      <div className="relative mb-3 flex justify-center">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onImageClick(product.image_url || '')}
            />
          ) : (
            <Package className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        {/* Индикатор количества */}
        {quantity > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {quantity}
          </div>
        )}
      </div>
      
      {/* Название товара */}
      <div className="mb-3 text-center">
        <h3 className="font-medium text-gray-900 text-sm leading-4 mb-1 line-clamp-2 h-8" title={product.name}>
          {product.name}
        </h3>
        <p className="text-blue-600 font-semibold text-sm">
          {product.price.toLocaleString('ru-RU')} тг
        </p>
        <p className="text-gray-500 text-xs">
          за {product.unit || 'шт'}
        </p>
      </div>
      
      {/* Управление количеством */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => onQuantityChange(product.id, -1)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              quantity > 0 
                ? 'bg-red-100 hover:bg-red-200 text-red-600 hover:scale-110' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!quantity}
          >
            <Minus size={12} />
          </button>
          
          <input
            type="number"
            min="0"
            value={quantity || ''}
            onChange={(e) => onQuantitySet(product.id, e.target.value)}
            className="w-20 text-center text-sm font-bold border-2 border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
          
          <button 
            onClick={() => onQuantityChange(product.id, 1)}
            className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <Plus size={12} />
          </button>
        </div>
        
        {/* Поле комментария - показывается только если есть количество */}
        {quantity > 0 && (
          <div className="mt-2">
            <input 
              type="text"
              placeholder="Комментарий..."
              value={comment || ''}
              onChange={(e) => onCommentChange(product.id, e.target.value)}
              className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactProductCard;
