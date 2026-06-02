import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/bookings/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <header className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your parking system</p>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total revenue</span>
          <strong className="stat-value">₹{stats.revenue?.toFixed(2)}</strong>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Paid bookings</span>
          <strong className="stat-value">{stats.paidBookings}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Customers</span>
          <strong className="stat-value">{stats.customers}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Parking lots</span>
          <strong className="stat-value">{stats.lots}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total slots</span>
          <strong className="stat-value">{stats.slots}</strong>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Bookings today</span>
          <strong className="stat-value">{stats.todayBookings}</strong>
        </div>
      </div>
    </div>
  );
}
