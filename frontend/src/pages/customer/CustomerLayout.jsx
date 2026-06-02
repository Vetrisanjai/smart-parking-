import { Outlet } from 'react-router-dom';
import Layout from '../../components/Layout';
import Chatbot from '../../components/Chatbot';

const links = [
  { to: '/customer', label: 'Dashboard' },
  { to: '/customer/book', label: 'Book Parking' },
  { to: '/customer/bookings', label: 'My Bookings' },
  { to: '/customer/support', label: 'Support Chat' },
  { to: '/customer/profile', label: 'Profile' },
];

export default function CustomerLayout() {
  return (
    <Layout links={links} title="Customer">
      <Outlet />
      <Chatbot />
    </Layout>
  );
}
