import OrderFormPrototype from '../components/OrderFormPrototype';

interface OrderPageProps {
  currentUser: {
    name: string;
    email: string;
  };
}

const OrderPage: React.FC<OrderPageProps> = ({ currentUser }) => {
  return <OrderFormPrototype currentUser={currentUser} />;
};

export default OrderPage; 