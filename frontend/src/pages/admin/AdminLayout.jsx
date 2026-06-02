import { Outlet } from 'react-router-dom';
import Layout from '../../components/Layout';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/lots', label: 'Parking Lots' },
  { to: '/admin/slots', label: 'Slots' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/messages', label: 'Messages' },
];

export default function AdminLayout() {
  return (
    <Layout links={links} title="Admin">
      <Outlet />
    </Layout>
  );
}
