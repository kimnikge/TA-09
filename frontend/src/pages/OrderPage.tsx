import OrderFormPrototype from '../components/OrderFormPrototype';

interface OrderPageProps {
  currentUser: {
    name: string;
    email: string;
  };
  userRole: 'admin' | 'sales_rep';
}

const OrderPage: React.FC<OrderPageProps> = ({ currentUser, userRole }) => {
  return <OrderFormPrototype currentUser={currentUser} userRole={userRole} />;
};

export default OrderPage; 