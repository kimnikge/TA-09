import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ShoppingCart, Plus, Minus, User, Calendar, Package, Send, Eye, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
const OrderFormPrototype = () => {
    // Имитация авторизованного торгового агента
    const currentAgent = {
        id: 'agent_001',
        name: 'Амир Назарбаев',
        email: 'amir.nazarbayev@company.kz'
    };
    const [selectedClient, setSelectedClient] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [selectedCategory, setSelectedCategory] = useState('beverages');
    const [cart, setCart] = useState({});
    const [comments, setComments] = useState({});
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [newClient, setNewClient] = useState({
        name: '',
        company: '',
        seller: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    // Демо-данные
    const clients = [
        { id: 1, name: 'Магазин "Евразия"', company: 'ТОО "Торговый дом"', seller: 'Алия Смагулова', address: 'ул. Абая, 125' },
        { id: 2, name: 'Супермаркет "Народный"', company: 'ИП Касымов А.Б.', seller: 'Бахыт Касымов', address: 'мкр. Жетысу-1, д. 45' },
        { id: 3, name: 'Минимаркет "Береке"', company: 'ТОО "Береке-Трейд"', seller: 'Сауле Абишева', address: 'ул. Назарбаева, 78' }
    ];
    const categories = [
        { id: 'beverages', name: 'Напитки' },
        { id: 'snacks', name: 'Снеки' },
        { id: 'dairy', name: 'Молочные продукты' },
        { id: 'household', name: 'Бытовая химия' }
    ];
    const products = {
        beverages: [
            { id: 1, name: 'Lipton Black Tea', price: 450, unit: 'упак', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop' },
            { id: 2, name: 'Nescafe Classic', price: 1200, unit: 'банка', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop' },
            { id: 3, name: 'Coca-Cola 0.5л', price: 280, unit: 'шт', image: 'https://images.unsplash.com/photo-1561758033-48d52648ae8b?w=200&h=200&fit=crop' },
            { id: 4, name: 'Минеральная вода Ессентуки', price: 150, unit: 'бут', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop' }
        ],
        snacks: [
            { id: 5, name: 'Чипсы Lay\'s', price: 320, unit: 'упак', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop' },
            { id: 6, name: 'Орехи миндаль', price: 800, unit: 'кг', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&h=200&fit=crop' }
        ],
        dairy: [
            { id: 7, name: 'Молоко Иркит 1л', price: 250, unit: 'упак', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },
            { id: 8, name: 'Творог 5%', price: 450, unit: 'упак', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&fit=crop' }
        ],
        household: [
            { id: 9, name: 'Порошок Ariel', price: 1500, unit: 'упак', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop' },
            { id: 10, name: 'Средство для мытья посуды', price: 280, unit: 'бут', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&h=200&fit=crop' }
        ]
    };
    const updateQuantity = (productId, change) => {
        setCart(prev => {
            const newCart = { ...prev };
            const currentQty = newCart[productId] || 0;
            const newQty = Math.max(0, currentQty + change);
            if (newQty === 0) {
                delete newCart[productId];
            }
            else {
                newCart[productId] = newQty;
            }
            return newCart;
        });
    };
    const setQuantityDirectly = (productId, value) => {
        const qty = parseInt(value) || 0;
        setCart(prev => {
            const newCart = { ...prev };
            if (qty <= 0) {
                delete newCart[productId];
            }
            else {
                newCart[productId] = qty;
            }
            return newCart;
        });
    };
    const addNewClient = () => {
        if (newClient.name && newClient.company) {
            const newId = clients.length + 1;
            clients.push({
                id: newId,
                name: newClient.name,
                company: newClient.company,
                seller: newClient.seller,
                address: newClient.address
            });
            setSelectedClient(newId.toString());
            setShowNewClientModal(false);
            setNewClient({ name: '', company: '', seller: '', address: '' });
        }
    };
    const handleSubmitOrder = async () => {
        if (!selectedClient || Object.keys(cart).length === 0)
            return;
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            // 1. Создать заказ
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                {
                    rep_id: currentAgent.id, // В реальном проекте — id пользователя
                    client_id: selectedClient,
                    delivery_date: deliveryDate,
                    total_items: getTotalItems(),
                    total_price: getTotalPrice(),
                }
            ])
                .select()
                .single();
            if (orderError || !order)
                throw orderError || new Error('Ошибка создания заказа');
            // 2. Добавить позиции заказа
            const items = Object.entries(cart).map(([productId, qty]) => {
                const product = Object.values(products).flat().find(p => p.id === parseInt(productId));
                return {
                    order_id: order.id,
                    product_id: productId,
                    quantity: qty,
                    price: product?.price || 0,
                    unit: product?.unit || '',
                    comment: comments[parseInt(productId)] || ''
                };
            });
            const { error: itemsError } = await supabase.from('order_items').insert(items);
            if (itemsError)
                throw itemsError;
            setSubmitStatus('success');
            setCart({});
            setComments({});
        }
        catch (e) {
            setSubmitStatus('error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const getTotalItems = () => {
        return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    };
    const getTotalPrice = () => {
        return Object.entries(cart).reduce((sum, [productId, qty]) => {
            const product = Object.values(products).flat().find(p => p.id === parseInt(productId));
            return sum + (product ? product.price * qty : 0);
        }, 0);
    };
    const currentProducts = products[selectedCategory] || [];
    const selectedClientData = clients.find(c => c.id === parseInt(selectedClient));
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", children: [_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ShoppingCart, { className: "text-blue-600", size: 28 }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u0424\u043E\u0440\u043C\u0430 \u0437\u0430\u043A\u0430\u0437\u0430" }), _jsx("p", { className: "text-gray-600", children: "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0430\u0437\u0430 \u0434\u043B\u044F \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0445 \u0442\u043E\u0447\u0435\u043A" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u0422\u043E\u0440\u0433\u043E\u0432\u044B\u0439 \u0430\u0433\u0435\u043D\u0442:" }), _jsx("p", { className: "font-semibold text-gray-800", children: currentAgent.name }), _jsx("p", { className: "text-xs text-gray-500", children: currentAgent.email })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(User, { className: "text-blue-600", size: 20 }), _jsx("h2", { className: "text-lg font-semibold", children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0435" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u043E\u0447\u043A\u0443 \u043F\u0440\u043E\u0434\u0430\u0436" }), _jsxs("select", { className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", value: selectedClient, onChange: (e) => setSelectedClient(e.target.value), children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430..." }), clients.map(client => (_jsxs("option", { value: client.id, children: [client.name, " - ", client.company] }, client.id)))] })] }), _jsxs("button", { onClick: () => setShowNewClientModal(true), className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [_jsx(Plus, { size: 16 }), "\u041D\u043E\u0432\u0430\u044F \u0442\u043E\u0447\u043A\u0430"] }), selectedClientData && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-800", children: selectedClientData.name }), _jsx("p", { className: "text-sm text-gray-600", children: selectedClientData.company }), _jsxs("p", { className: "text-sm text-gray-600", children: ["\u041F\u0440\u043E\u0434\u0430\u0432\u0435\u0446: ", selectedClientData.seller] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["\u0410\u0434\u0440\u0435\u0441: ", selectedClientData.address] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Calendar, { className: "text-blue-600", size: 20 }), _jsx("h2", { className: "text-lg font-semibold", children: "\u0414\u0430\u0442\u0430 \u043E\u0442\u0433\u0440\u0443\u0437\u043A\u0438" })] }), _jsx("input", { type: "date", value: deliveryDate, onChange: (e) => setDeliveryDate(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Package, { className: "text-blue-600", size: 20 }), _jsx("h2", { className: "text-lg font-semibold", children: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u0442\u043E\u0432\u0430\u0440\u043E\u0432" })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-6", children: categories.map(category => (_jsx("button", { onClick: () => setSelectedCategory(category.id), className: `px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: category.name }, category.id))) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: currentProducts.map((product) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: product.image, alt: product.name, className: "w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80", onClick: () => {
                                                                            setSelectedImage(product.image);
                                                                            setShowImageModal(true);
                                                                        } }), _jsx(Eye, { className: "absolute top-1 right-1 text-white bg-black bg-opacity-50 rounded p-1", size: 16 })] }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-800 mb-1", children: product.name }), _jsxs("p", { className: "text-blue-600 font-bold mb-2", children: [product.price, " \u20B8 / ", product.unit] }), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("button", { onClick: () => updateQuantity(product.id, -1), className: "p-1 bg-gray-200 rounded hover:bg-gray-300", disabled: !cart[product.id], children: _jsx(Minus, { size: 16 }) }), _jsx("input", { type: "number", min: "0", value: cart[product.id] || '', onChange: (e) => setQuantityDirectly(product.id, e.target.value), className: "w-16 text-center font-semibold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "0" }), _jsx("button", { onClick: () => updateQuantity(product.id, 1), className: "p-1 bg-blue-600 text-white rounded hover:bg-blue-700", children: _jsx(Plus, { size: 16 }) })] }), cart[product.id] && (_jsx("input", { type: "text", placeholder: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439...", value: comments[product.id] || '', onChange: (e) => setComments(prev => ({ ...prev, [product.id]: e.target.value })), className: "w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" }))] })] }) }, product.id))) })] })] }), _jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 sticky top-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "\u0421\u0432\u043E\u0434\u043A\u0430 \u0437\u0430\u043A\u0430\u0437\u0430" }), selectedClientData && (_jsxs("div", { className: "mb-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-sm font-semibold", children: selectedClientData.name }), _jsx("p", { className: "text-xs text-gray-600", children: selectedClientData.address }), _jsxs("p", { className: "text-xs text-gray-600", children: ["\u041F\u0440\u043E\u0434\u0430\u0432\u0435\u0446: ", selectedClientData.seller] })] })), _jsx("div", { className: "mb-4 p-3 bg-blue-50 rounded-lg", children: _jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "\u0414\u0430\u0442\u0430 \u043E\u0442\u0433\u0440\u0443\u0437\u043A\u0438:" }), " ", deliveryDate] }) }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u041F\u043E\u0437\u0438\u0446\u0438\u0439 \u0432 \u0437\u0430\u043A\u0430\u0437\u0435:" }), _jsx("span", { className: "font-semibold", children: getTotalItems() })] }), _jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u041E\u0431\u0449\u0430\u044F \u0441\u0443\u043C\u043C\u0430:" }), _jsxs("span", { className: "text-lg font-bold text-blue-600", children: [getTotalPrice().toLocaleString(), " \u20B8"] })] })] }), Object.keys(cart).length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-sm font-semibold mb-3", children: "\u0422\u043E\u0432\u0430\u0440\u044B \u0432 \u0437\u0430\u043A\u0430\u0437\u0435:" }), _jsxs("div", { className: "bg-gray-50 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "bg-gray-200 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700", children: [_jsx("div", { className: "col-span-5", children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("div", { className: "col-span-2 text-center", children: "\u041A\u043E\u043B-\u0432\u043E" }), _jsx("div", { className: "col-span-2 text-right", children: "\u0426\u0435\u043D\u0430" }), _jsx("div", { className: "col-span-3 text-right", children: "\u0421\u0443\u043C\u043C\u0430" })] }), _jsx("div", { className: "max-h-48 overflow-y-auto", children: Object.entries(cart).map(([productId, qty]) => {
                                                                const product = Object.values(products).flat().find(p => p.id === parseInt(productId));
                                                                if (!product)
                                                                    return null;
                                                                const itemTotal = product.price * qty;
                                                                return (_jsxs("div", { className: "px-3 py-2 grid grid-cols-12 gap-2 text-xs border-b border-gray-200 last:border-b-0", children: [_jsx("div", { className: "col-span-5 truncate", title: product.name, children: product.name }), _jsxs("div", { className: "col-span-2 text-center", children: [qty, " ", product.unit] }), _jsxs("div", { className: "col-span-2 text-right", children: [product.price.toLocaleString(), " \u20B8"] }), _jsxs("div", { className: "col-span-3 text-right font-semibold", children: [itemTotal.toLocaleString(), " \u20B8"] })] }, productId));
                                                            }) }), _jsxs("div", { className: "bg-blue-50 px-3 py-2 grid grid-cols-12 gap-2 text-sm font-bold", children: [_jsx("div", { className: "col-span-7", children: "\u0418\u0422\u041E\u0413\u041E:" }), _jsxs("div", { className: "col-span-2 text-center", children: [getTotalItems(), " \u0448\u0442"] }), _jsxs("div", { className: "col-span-3 text-right text-blue-600", children: [getTotalPrice().toLocaleString(), " \u20B8"] })] })] })] })), _jsxs("button", { className: "w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", disabled: !selectedClient || Object.keys(cart).length === 0 || isSubmitting, onClick: handleSubmitOrder, children: [_jsx(Send, { size: 16 }), isSubmitting ? 'Отправка...' : 'Отправить заявку'] }), submitStatus === 'success' && (_jsx("div", { className: "text-green-600 text-center mt-2", children: "\u0417\u0430\u044F\u0432\u043A\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430!" })), submitStatus === 'error' && (_jsx("div", { className: "text-red-600 text-center mt-2", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 \u0437\u0430\u044F\u0432\u043A\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437." }))] }) })] })] }), showNewClientModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "\u041D\u043E\u0432\u0430\u044F \u0442\u043E\u0447\u043A\u0430 \u043F\u0440\u043E\u0434\u0430\u0436" }), _jsx("button", { onClick: () => setShowNewClientModal(false), className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430", value: newClient.name, onChange: (e) => setNewClient(prev => ({ ...prev, name: e.target.value })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "text", placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0418\u041F \u0438\u043B\u0438 \u0422\u041E\u041E", value: newClient.company, onChange: (e) => setNewClient(prev => ({ ...prev, company: e.target.value })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "text", placeholder: "\u0418\u043C\u044F \u043F\u0440\u043E\u0434\u0430\u0432\u0446\u0430", value: newClient.seller, onChange: (e) => setNewClient(prev => ({ ...prev, seller: e.target.value })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "text", placeholder: "\u0410\u0434\u0440\u0435\u0441 \u0442\u043E\u0447\u043A\u0438", value: newClient.address, onChange: (e) => setNewClient(prev => ({ ...prev, address: e.target.value })), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: () => setShowNewClientModal(false), className: "flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx("button", { onClick: addNewClient, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", disabled: !newClient.name || !newClient.company, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] })] }) })), showImageModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-4 max-w-md", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u0430" }), _jsx("button", { onClick: () => setShowImageModal(false), className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 20 }) })] }), _jsx("img", { src: selectedImage, alt: "\u0422\u043E\u0432\u0430\u0440", className: "w-full h-auto rounded-lg" })] }) }))] }));
};
export default OrderFormPrototype;
