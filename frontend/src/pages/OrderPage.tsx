import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const OrderPage: React.FC = () => {
  const [clientId, setClientId] = useState<number | null>(null);
  const [items, setItems] = useState<{ productId: number; qty: number }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: clientsData } = await supabase.from('clients').select('id, name');
      const { data: productsData } = await supabase.from('products').select('id, name, price');
      setClients(clientsData || []);
      setProducts(productsData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleQtyChange = (productId: number, qty: number) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === productId);
      if (exists) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
      } else {
        return [...prev, { productId, qty }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setStatus('Выберите клиента');
      return;
    }
    const orderItems = items.filter((i) => i.qty > 0);
    if (orderItems.length === 0) {
      setStatus('Добавьте хотя бы один товар');
      return;
    }
    setStatus('Создание заказа...');
    const { data: order, error: orderError } = await supabase.from('orders').insert({ client_id: clientId }).select().single();
    if (orderError || !order) {
      setStatus('Ошибка при создании заказа');
      return;
    }
    const orderItemsData = orderItems.map((i) => ({ order_id: order.id, product_id: i.productId, quantity: i.qty }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) {
      setStatus('Ошибка при добавлении товаров в заказ');
      return;
    }
    setStatus('Заказ успешно создан!');
    setItems([]);
    setClientId(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Форма заказа</h1>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Клиент:
            <select
              value={clientId ?? ''}
              onChange={(e) => setClientId(Number(e.target.value) || null)}
            >
              <option value="">-- выберите --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <h3>Товары</h3>
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.price}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={items.find((i) => i.productId === p.id)?.qty ?? 0}
                      onChange={(e) => handleQtyChange(p.id, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="submit">Создать заказ</button>
        </form>
      )}
      {status && <div style={{ marginTop: 10 }}>{status}</div>}
    </div>
  );
};

export default OrderPage;