import React from 'react';
import { Plus, Minus, Eye } from 'lucide-react';

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
 * Компактная карточка товара с уменьшенной высотой
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
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-center gap-3">
        {/* Изображение товара - компактное */}
        <div className="relative flex-shrink-0">
          <img 
            src={product.image_url || '/default-product.png'} 
            alt={product.name}
            className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onImageClick(product.image_url || '')}
          />
          <button 
            onClick={() => onImageClick(product.image_url || '')}
            className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
          >
            <Eye size={10} />
          </button>
        </div>
        
        {/* Информация о товаре */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 text-sm leading-5 truncate" title={product.name}>
                {product.name}
              </h3>
              <p className="text-blue-600 font-semibold text-sm mt-0.5">
                {product.price.toLocaleString('ru-RU')} ₽ / {product.unit || 'шт'}
              </p>
            </div>
            
            {/* Управление количеством - компактное */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => onQuantityChange(product.id, -1)}
                className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={!quantity}
              >
                <Minus size={12} />
              </button>
              
              <input
                type="number"
                min="0"
                value={quantity || ''}
                onChange={(e) => onQuantitySet(product.id, e.target.value)}
                className="w-12 text-center text-sm font-medium border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              
              <button 
                onClick={() => onQuantityChange(product.id, 1)}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          
          {/* Поле комментария - показывается только если есть количество */}
          {quantity > 0 && (
            <div className="mt-2">
              <input 
                type="text"
                placeholder="Комментарий..."
                value={comment || ''}
                onChange={(e) => onCommentChange(product.id, e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactProductCard;
