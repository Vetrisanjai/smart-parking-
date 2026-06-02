import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function CustomerHome() {
  const [bookings, setBookings] = useState([]);
  const [lots, setLots] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/bookings/mine'), api.get('/lots')]).then(([b, l]) => {
      setBookings(b.data);
      setLots(l.data);
    });
  }, []);

  const upcoming = bookings.filter(
    (b) =>
      b.bookingStatus !== 'cancelled' &&
      b.paymentStatus === 'paid' &&
      new Date(b.endTime) > new Date()
  );

  const pendingPay = bookings.filter(
    (b) => b.paymentStatus === 'pending' && b.bookingStatus !== 'cancelled'
  );

  return (
    <div>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Manage your parking easily.</p>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Parking lots</span>
          <strong className="stat-value">{lots.length}</strong>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Active bookings</span>
          <strong className="stat-value">{upcoming.length}</strong>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Pending payment</span>
          <strong className="stat-value">{pendingPay.length}</strong>
        </div>
      </div>

      <div className="card-grid">
        <Link to="/customer/book" className="action-card">
          <h3>Book a slot</h3>
          <p>Find and reserve available parking</p>
        </Link>
        <Link to="/customer/bookings" className="action-card">
          <h3>My bookings</h3>
          <p>View history and pay online</p>
        </Link>
        <Link to="/customer/support" className="action-card">
          <h3>Support chat</h3>
          <p>Message admin in real time</p>
        </Link>
      </div>

      {upcoming.length > 0 && (
        <section className="section">
          <h2>Upcoming</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Slot</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 5).map((b) => (
                  <tr key={b._id}>
                    <td>{b.lot?.name}</td>
                    <td>{b.slot?.slotNumber}</td>
                    <td>{new Date(b.startTime).toLocaleString()}</td>
                    <td>{new Date(b.endTime).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-success">{b.bookingStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
