import React from 'react';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';

/**
 * Главный компонент админ-модуля
 * Обёрнут в ErrorBoundary для изоляции ошибок
 */
const AdminModule: React.FC = () => {
  console.log('🔧 AdminModule: Инициализация админ-модуля');

  return (
    <AdminErrorBoundary>
      <AdminDashboard />
    </AdminErrorBoundary>
  );
};

export default AdminModule;
