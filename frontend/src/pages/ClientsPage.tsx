import React from 'react';
import ClientsManager from '../components/ClientsManager';

interface ClientsPageProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
  userRole?: 'admin' | 'sales_rep';
}

const ClientsPage: React.FC<ClientsPageProps> = ({ currentUser, userRole }) => {
  // Если props не переданы, используем заглушки (для совместимости)
  const defaultUser = {
    id: '',
    name: 'Гость',
    email: 'guest@example.com'
  };

  const defaultRole = 'sales_rep' as const;

  return (
    <div className="container mx-auto px-4 py-6">
      <ClientsManager 
        currentUser={currentUser || defaultUser}
        userRole={userRole || defaultRole}
      />
    </div>
  );
};

export default ClientsPage; 