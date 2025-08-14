import React from 'react';
// import ClientsManager from '../components/ClientsManager';
import ClientsManagerBeautiful from '../components/ClientsManagerBeautiful';

interface ClientsPageProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
  userRole?: 'admin' | 'sales_rep';
}

const ClientsPage: React.FC<ClientsPageProps> = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <ClientsManagerBeautiful />
    </div>
  );
};

export default ClientsPage; 