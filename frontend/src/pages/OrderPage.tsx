import OrderFormPrototype from '../components/OrderFormPrototype';

interface OrderPageProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

const OrderPage: React.FC<OrderPageProps> = ({ currentUser }) => {
  return <OrderFormPrototype currentUser={currentUser} />;
};

export default OrderPage; 