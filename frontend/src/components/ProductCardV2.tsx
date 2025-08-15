import React from 'react';

export interface ProductV2 {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
  category?: string;
}

interface ProductCardV2Props {
  product: ProductV2;
  quantity: number;
  onQuantityChange: (productId: string, delta: number) => void;
  onQuantitySet: (productId: string, value: string) => void;
}

// Карточка V2: максимум читабельности названия и удобный ввод количества
// Вёрстка упрощена и «воздушная», элементы управления крупные для тач
const ProductCardV2: React.FC<ProductCardV2Props> = ({ product, quantity, onQuantityChange, onQuantitySet }) => {
  // Нормализуем отображение категории (коды БД -> русские подписи)
  const humanCategory = (() => {
    const map: Record<string, string> = {
      beverages: 'Напитки',
      snacks: 'Снеки',
      dairy: 'Молочные продукты',
      household: 'Бытовая химия',
      food: 'Продукты питания',
      bakery: 'Хлебобулочные изделия',
      meat: 'Мясные продукты',
      frozen: 'Замороженные продукты',
    };
    if (!product.category) return undefined;
    return map[product.category] || product.category;
  })();

  return (
    <div className={`w-full rounded-xl border p-4 bg-white ${quantity > 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      {/* Категория */}
      {humanCategory && (
        <div className="mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
            {humanCategory}
          </span>
        </div>
      )}
      {/* Название товара — отображается полностью, допускается перенос на 2-3 строки */}
      <h3
        className="text-base font-semibold text-gray-900 leading-5 w-full break-words whitespace-normal line-clamp-3"
        style={{ display: 'block', overflow: 'hidden', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
        title={product.name}
      >
        {product.name}
      </h3>
      {/* Цена и единица */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-blue-600 font-semibold text-base">{product.price.toLocaleString('ru-RU')} тг</span>
        <span className="text-gray-500 text-xs">за {product.unit || 'шт'}</span>
      </div>
      {/* Количество — теперь ниже, на всю ширину */}
      <div className="mt-4 flex items-center justify-center gap-2 w-full">
        <button
          onClick={() => onQuantityChange(product.id, -1)}
          disabled={quantity <= 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${
            quantity > 0 ? 'bg-red-100 text-red-600 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Уменьшить"
        >
          –
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          value={quantity || ''}
          onChange={(e) => onQuantitySet(product.id, e.target.value)}
          className="w-24 text-center text-lg font-bold border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
          aria-label="Количество"
        />
        <button
          onClick={() => onQuantityChange(product.id, 1)}
          className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-lg active:scale-95"
          aria-label="Увеличить"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default ProductCardV2;
