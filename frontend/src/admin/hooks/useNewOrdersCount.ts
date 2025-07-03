import { useState, useEffect } from 'react';

// Хук для получения счетчика новых заказов из localStorage
export const useNewOrdersCount = () => {
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const viewedOrdersStr = localStorage.getItem('viewedOrders');
        const allOrdersStr = localStorage.getItem('allOrdersIds');
        
        if (!allOrdersStr) {
          setNewOrdersCount(0);
          return;
        }

        const allOrdersIds = JSON.parse(allOrdersStr) as string[];
        const viewedOrdersIds = viewedOrdersStr ? JSON.parse(viewedOrdersStr) as string[] : [];
        
        const newCount = allOrdersIds.filter(id => !viewedOrdersIds.includes(id)).length;
        setNewOrdersCount(newCount);
      } catch (error) {
        console.warn('Ошибка при подсчете новых заказов:', error);
        setNewOrdersCount(0);
      }
    };

    // Обновляем счетчик при загрузке
    updateCount();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'viewedOrders' || e.key === 'allOrdersIds') {
        updateCount();
      }
    };

    // Слушаем custom event для обновления
    const handleOrdersUpdate = () => {
      updateCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordersUpdated', handleOrdersUpdate);

    // Проверяем каждые 10 секунд
    const interval = setInterval(updateCount, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
      clearInterval(interval);
    };
  }, []);

  return newOrdersCount;
};
