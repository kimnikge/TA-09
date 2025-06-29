import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import AdminPage from './pages/AdminPage';
import OrderPage from './pages/OrderPage';
import ClientsPage from './pages/ClientsPage';
function App() {
    const [showModal, setShowModal] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [currentPage, setCurrentPage] = useState('order');
    const [currentUserName, setCurrentUserName] = useState('');
    // Функция для назначения роли админа (для разработки)
    const makeAdmin = async (email) => {
        try {
            const { data: user } = await supabase.auth.admin.listUsers();
            const targetUser = user.users.find(u => u.email === email);
            if (!targetUser) {
                console.error('Пользователь не найден:', email);
                return false;
            }
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', targetUser.id);
            if (error) {
                console.error('Ошибка назначения роли админа:', error);
                return false;
            }
            console.log('Роль админа назначена пользователю:', email);
            return true;
        }
        catch (error) {
            console.error('Ошибка:', error);
            return false;
        }
    };
    // Быстрая функция для назначения себя админом (только для разработки)
    const makeMeAdmin = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.error('Пользователь не авторизован');
                return;
            }
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', session.user.id);
            if (error) {
                console.error('Ошибка назначения роли админа:', error);
                return;
            }
            console.log('Вы назначены админом!');
            // Перезагружаем данные пользователя
            window.location.reload();
        }
        catch (error) {
            console.error('Ошибка:', error);
        }
    };
    // Проверка размера экрана и восстановление сессии
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
        };
        window.makeAdmin = makeAdmin;
        window.makeMeAdmin = makeMeAdmin;
        console.log('🔧 Функции для управления ролями доступны:');
        console.log('- makeAdmin("email@example.com") - назначить админа по email');
        console.log('- makeMeAdmin() - назначить себя админом');
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log('Пользователь найден в сессии:', session.user.email);
                    // Проверяем роль пользователя в таблице profiles
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role, name')
                        .eq('id', session.user.id)
                        .single();
                    if (error) {
                        console.log('Профиль не найден, создаем новый');
                        // Если профиль не найден, создаем его с ролью sales_rep по умолчанию
                        const { data: newProfile, error: createError } = await supabase
                            .from('profiles')
                            .insert({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.email?.split('@')[0] || 'Пользователь',
                            role: 'sales_rep',
                            approved: true
                        })
                            .select('role, name')
                            .single();
                        if (createError) {
                            console.error('Ошибка создания профиля:', createError);
                            // Fallback логика по email
                            const isAdmin = session.user.email?.includes('admin') ||
                                session.user.email === 'kimnikge@gmail.com';
                            setUserRole(isAdmin ? 'admin' : 'sales_rep');
                            setCurrentUserName(session.user.email?.split('@')[0] || 'Пользователь');
                        }
                        else {
                            setUserRole(newProfile?.role || 'sales_rep');
                            setCurrentUserName(newProfile?.name || 'Пользователь');
                        }
                    }
                    else {
                        // Профиль найден, используем данные из БД
                        setUserRole(profile.role);
                        setCurrentUserName(profile.name || session.user.email?.split('@')[0] || 'Пользователь');
                    }
                    setIsAuthenticated(true);
                    setCurrentPage(profile?.role === 'admin' ? 'admin' : 'order');
                }
            }
            catch (error) {
                console.error('Auth check error:', error);
                // Не блокируем приложение при ошибке аутентификации
            }
        };
        checkMobile();
        checkAuth();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setMessage('');
        setShowModal(null);
    };
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        setIsAuthenticated(false);
        setUserRole(null);
        setCurrentUserName('');
        setCurrentPage('order');
        resetForm();
    };
    // Обработка клавиши Escape и блокировка прокрутки
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showModal) {
                resetForm();
            }
        };
        if (showModal) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        }
        else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [showModal]);
    const handleRegister = async () => {
        if (!email.trim() || !password.trim() || !name.trim()) {
            setMessage('Заполните все поля');
            return;
        }
        try {
            // Регистрируем пользователя через Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        name: name.trim()
                    }
                }
            });
            if (authError) {
                setMessage('Ошибка регистрации: ' + authError.message);
                return;
            }
            if (authData.user) {
                // Временно не создаем профиль до обновления структуры БД
                // TODO: Включить после добавления колонок в таблицу profiles
                console.log('Пользователь зарегистрирован:', authData.user.email);
                setMessage('Регистрация успешна! Войдите с теми же данными.');
                setTimeout(resetForm, 3000);
            }
        }
        catch (error) {
            setMessage('Произошла ошибка при регистрации');
            console.error('Registration error:', error);
        }
    };
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setMessage('Заполните все поля');
            return;
        }
        try {
            // Авторизуемся через Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim()
            });
            if (authError) {
                setMessage('Ошибка входа: ' + authError.message);
                return;
            }
            if (authData.user) {
                // Временно используем простую логику до обновления БД
                // TODO: Включить проверку профиля после обновления структуры БД
                console.log('Пользователь вошел:', authData.user.email);
                setMessage('Вход выполнен успешно!');
                // Определяем роль по email (временное решение)
                if (authData.user.email?.includes('admin')) {
                    setUserRole('admin');
                    setCurrentUserName('Администратор');
                    setCurrentPage('admin');
                }
                else {
                    setUserRole('sales_rep');
                    setCurrentUserName(authData.user.email?.split('@')[0] || 'Пользователь');
                    setCurrentPage('order');
                }
                setIsAuthenticated(true);
                setTimeout(resetForm, 1000);
            }
        }
        catch (error) {
            setMessage('Произошла ошибка при входе');
            console.error('Login error:', error);
        }
    };
    // Если пользователь аутентифицирован, показываем соответствующую страницу
    if (isAuthenticated) {
        return (_jsxs("div", { style: {
                minHeight: isMobile ? '100dvh' : '100vh',
                background: '#f7fafc'
            }, children: [_jsxs("nav", { style: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                        color: 'white',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'stretch' : 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        gap: isMobile ? '0.75rem' : '0'
                    }, children: [_jsx("h1", { style: {
                                fontSize: isMobile ? '1.25rem' : '1.5rem',
                                fontWeight: 'bold',
                                margin: 0,
                                textAlign: isMobile ? 'center' : 'left'
                            }, children: "\u0424\u043E\u0440\u043C\u0430 \u0437\u0430\u043A\u0430\u0437\u0430" }), isMobile && (_jsxs("div", { style: {
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                opacity: 0.9,
                                paddingBottom: '0.5rem'
                            }, children: [currentUserName, " (", userRole === 'admin' ? 'Администратор' : 'Торговый представитель', ")"] })), _jsxs("div", { style: {
                                display: 'flex',
                                gap: isMobile ? '0.5rem' : '1rem',
                                alignItems: 'center',
                                flexDirection: isMobile ? 'column' : 'row',
                                width: isMobile ? '100%' : 'auto'
                            }, children: [!isMobile && (_jsxs("span", { style: { fontSize: '0.9rem', opacity: 0.9 }, children: [currentUserName, " (", userRole === 'admin' ? 'Администратор' : 'Торговый представитель', ")"] })), _jsxs("div", { style: {
                                        display: 'flex',
                                        gap: isMobile ? '0.5rem' : '1rem',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        width: isMobile ? '100%' : 'auto'
                                    }, children: [userRole === 'admin' && (_jsx("button", { onClick: () => setCurrentPage('admin'), style: {
                                                background: currentPage === 'admin' ? 'rgba(255,255,255,0.3)' : 'transparent',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                color: 'white',
                                                padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.95rem' : '0.9rem',
                                                width: isMobile ? '100%' : 'auto'
                                            }, children: "\u0410\u0434\u043C\u0438\u043D-\u043F\u0430\u043D\u0435\u043B\u044C" })), _jsx("button", { onClick: () => setCurrentPage('order'), style: {
                                                background: currentPage === 'order' ? 'rgba(255,255,255,0.3)' : 'transparent',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                color: 'white',
                                                padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.95rem' : '0.9rem',
                                                width: isMobile ? '100%' : 'auto'
                                            }, children: "\u0417\u0430\u043A\u0430\u0437\u044B" }), _jsx("button", { onClick: () => setCurrentPage('clients'), style: {
                                                background: currentPage === 'clients' ? 'rgba(255,255,255,0.3)' : 'transparent',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                color: 'white',
                                                padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.95rem' : '0.9rem',
                                                width: isMobile ? '100%' : 'auto'
                                            }, children: "\u041A\u043B\u0438\u0435\u043D\u0442\u044B" }), _jsx("button", { onClick: handleLogout, style: {
                                                background: '#dc3545',
                                                border: 'none',
                                                color: 'white',
                                                padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.95rem' : '0.9rem',
                                                width: isMobile ? '100%' : 'auto'
                                            }, children: "\u0412\u044B\u0439\u0442\u0438" })] })] })] }), _jsxs("main", { style: {
                        padding: isMobile ? '1rem' : '2rem',
                        maxWidth: '100%',
                        overflow: 'hidden'
                    }, children: [currentPage === 'admin' && userRole === 'admin' && _jsx(AdminPage, {}), currentPage === 'order' && _jsx(OrderPage, {}), currentPage === 'clients' && _jsx(ClientsPage, {})] })] }));
    }
    // Страница входа/регистрации (если не аутентифицирован)
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center main-container", style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: isMobile ? '10px' : '20px',
            minHeight: isMobile ? '100dvh' : '100vh', // Динамическая высота viewport для мобильных
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto'
        }, children: [_jsxs("div", { className: `text-center w-full transition-transform duration-300 container-main ${isMobile ? 'container-mobile' : ''}`, style: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: isMobile ? '40px 24px' : '60px 40px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    maxWidth: '500px',
                    width: '100%'
                }, onMouseEnter: (e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                    }
                }, onMouseLeave: (e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }, children: [_jsx("h1", { className: `font-bold mb-4 main-title ${isMobile ? 'title-mobile' : ''}`, style: {
                            fontSize: isMobile ? '2rem' : '2.5rem',
                            fontWeight: '700',
                            color: '#2d3748',
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }, children: "\u0424\u043E\u0440\u043C\u0430 \u0437\u0430\u043A\u0430\u0437\u0430" }), _jsxs("p", { className: "leading-relaxed", style: {
                            fontSize: '1.1rem',
                            color: '#718096',
                            marginBottom: '40px',
                            lineHeight: '1.6'
                        }, children: ["\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0430\u0437\u043E\u0432, \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C\u0438 \u0438 \u0442\u043E\u0432\u0430\u0440\u0430\u043C\u0438.", _jsx("br", {}), "\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C \u043A \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435 \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u043A\u0430\u0437\u0430\u043C\u0438."] }), _jsxs("div", { className: isMobile ? 'buttons-mobile' : '', style: {
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '16px',
                            marginBottom: '40px',
                            width: '100%'
                        }, children: [_jsx("button", { className: isMobile ? 'button-mobile' : '', style: {
                                    flex: isMobile ? 'none' : '1',
                                    width: isMobile ? '100%' : 'auto',
                                    padding: '16px 24px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }, onMouseEnter: (e) => {
                                    if (!isMobile) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!isMobile) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                    }
                                }, onClick: () => setShowModal('login'), children: "\uD83D\uDD11 \u0412\u043E\u0439\u0442\u0438" }), _jsx("button", { className: isMobile ? 'button-mobile' : '', style: {
                                    flex: isMobile ? 'none' : '1',
                                    width: isMobile ? '100%' : 'auto',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    background: 'rgba(102, 126, 234, 0.1)',
                                    color: '#667eea',
                                    border: '2px solid rgba(102, 126, 234, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }, onMouseEnter: (e) => {
                                    if (!isMobile) {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!isMobile) {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }, onClick: () => setShowModal('register'), children: "\u2728 \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F" })] })] }), showModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center z-50", style: {
                    display: 'flex',
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    zIndex: '1000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '10px' : '20px',
                    animation: 'fadeIn 0.3s ease'
                }, onClick: (e) => e.target === e.currentTarget && resetForm(), children: _jsxs("div", { className: `bg-white w-full relative modal-content-mobile ${isMobile ? 'modal-mobile' : ''}`, style: {
                        background: 'white',
                        borderRadius: isMobile ? '16px' : '20px',
                        padding: isMobile ? '24px 16px' : '40px',
                        maxWidth: isMobile ? '95vw' : '450px',
                        width: '100%',
                        maxHeight: isMobile ? '90vh' : 'auto',
                        overflowY: isMobile ? 'auto' : 'visible',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
                        transform: 'scale(0.9)',
                        animation: 'modalSlide 0.3s ease forwards'
                    }, children: [_jsx("button", { onClick: resetForm, className: "absolute text-2xl bg-transparent border-0 cursor-pointer transition-colors duration-300", style: {
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                color: '#a0aec0',
                                cursor: 'pointer'
                            }, onMouseEnter: (e) => e.currentTarget.style.color = '#718096', onMouseLeave: (e) => e.currentTarget.style.color = '#a0aec0', children: "\u00D7" }), _jsxs("div", { className: "text-center", style: {
                                textAlign: 'center',
                                marginBottom: isMobile ? '20px' : '30px'
                            }, children: [_jsx("h2", { className: "font-bold mb-2", style: {
                                        fontSize: isMobile ? '1.5rem' : '1.8rem',
                                        fontWeight: '700',
                                        color: '#2d3748',
                                        marginBottom: '8px'
                                    }, children: showModal === 'login' ? 'Вход в систему' : 'Создать аккаунт' }), _jsx("p", { style: {
                                        color: '#718096',
                                        fontSize: isMobile ? '0.85rem' : '0.95rem'
                                    }, children: showModal === 'login'
                                        ? 'Введите свои учетные данные'
                                        : 'Заполните данные для регистрации' })] }), _jsx("div", { children: _jsxs("form", { onSubmit: (e) => {
                                    e.preventDefault();
                                    if (showModal === 'login') {
                                        handleLogin();
                                    }
                                    else {
                                        handleRegister();
                                    }
                                }, children: [_jsxs("div", { style: { marginBottom: isMobile ? '16px' : '20px' }, children: [_jsx("label", { className: "block font-semibold mb-2", style: {
                                                    display: 'block',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    color: '#2d3748',
                                                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                                                }, children: "\uD83D\uDCE7 Email \u0430\u0434\u0440\u0435\u0441" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full transition-all duration-300", style: {
                                                    width: '100%',
                                                    padding: isMobile ? '12px' : '16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: isMobile ? '8px' : '12px',
                                                    fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                                                    background: '#f8fafc',
                                                    color: '#2d3748', // Цвет текста
                                                    transition: 'all 0.3s ease'
                                                }, onFocus: (e) => {
                                                    e.target.style.outline = 'none';
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.background = 'white';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }, onBlur: (e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.background = '#f8fafc';
                                                    e.target.style.boxShadow = 'none';
                                                }, placeholder: "example@company.com" })] }), _jsxs("div", { style: { marginBottom: isMobile ? '16px' : '20px' }, children: [_jsx("label", { className: "block font-semibold mb-2", style: {
                                                    display: 'block',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    color: '#2d3748',
                                                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                                                }, children: "\uD83D\uDD12 \u041F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full transition-all duration-300", style: {
                                                    width: '100%',
                                                    padding: isMobile ? '12px' : '16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: isMobile ? '8px' : '12px',
                                                    fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                                                    background: '#f8fafc',
                                                    color: '#2d3748', // Цвет текста
                                                    transition: 'all 0.3s ease'
                                                }, onFocus: (e) => {
                                                    e.target.style.outline = 'none';
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.background = 'white';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }, onBlur: (e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.background = '#f8fafc';
                                                    e.target.style.boxShadow = 'none';
                                                }, placeholder: showModal === 'login' ? 'Введите ваш пароль' : 'Введите надежный пароль' })] }), showModal === 'register' && (_jsxs("div", { style: { marginBottom: isMobile ? '16px' : '20px' }, children: [_jsx("label", { className: "block font-semibold mb-2", style: {
                                                    display: 'block',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    color: '#2d3748',
                                                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                                                }, children: "\uD83D\uDC64 \u0418\u043C\u044F" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full transition-all duration-300", style: {
                                                    width: '100%',
                                                    padding: isMobile ? '12px' : '16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: isMobile ? '8px' : '12px',
                                                    fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                                                    background: '#f8fafc',
                                                    color: '#2d3748', // Цвет текста
                                                    transition: 'all 0.3s ease'
                                                }, onFocus: (e) => {
                                                    e.target.style.outline = 'none';
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.background = 'white';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }, onBlur: (e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.background = '#f8fafc';
                                                    e.target.style.boxShadow = 'none';
                                                }, placeholder: "\u0412\u0430\u0448\u0435 \u0438\u043C\u044F", required: true })] })), message && (_jsx("div", { className: `rounded-xl text-sm font-medium border mb-5 ${message.includes('успешно') || message.includes('выполнен')
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-red-50 text-red-700 border-red-200'}`, style: { padding: '16px' }, children: message })), _jsxs("div", { className: "flex gap-3", style: {
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            gap: isMobile ? '8px' : '12px',
                                            marginTop: isMobile ? '20px' : '30px'
                                        }, children: [_jsx("button", { type: "button", onClick: resetForm, className: "flex-1 font-semibold cursor-pointer transition-all duration-300", style: {
                                                    flex: isMobile ? 'none' : '1',
                                                    width: isMobile ? '100%' : 'auto',
                                                    padding: isMobile ? '12px' : '14px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: isMobile ? '8px' : '12px',
                                                    background: 'white',
                                                    color: '#718096',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    fontSize: isMobile ? '0.9rem' : '1rem'
                                                }, onMouseEnter: (e) => {
                                                    e.currentTarget.style.borderColor = '#cbd5e0';
                                                    e.currentTarget.style.background = '#f8fafc';
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.background = 'white';
                                                }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx("button", { type: "submit", className: "font-semibold cursor-pointer transition-all duration-300", style: {
                                                    flex: isMobile ? 'none' : '2',
                                                    width: isMobile ? '100%' : 'auto',
                                                    padding: isMobile ? '12px' : '14px',
                                                    border: 'none',
                                                    borderRadius: isMobile ? '8px' : '12px',
                                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                                    fontSize: isMobile ? '0.9rem' : '1rem'
                                                }, onMouseEnter: (e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                                }, children: showModal === 'login' ? '🔑 Войти' : '✨ Создать аккаунт' })] })] }) })] }) }))] }));
}
export default App;
