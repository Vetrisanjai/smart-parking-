import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/bookings').then((res) => setBookings(res.data));
  }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    await api.patch(`/bookings/${id}/cancel`);
    const { data } = await api.get('/bookings');
    setBookings(data);
  };

  return (
    <div>
      <header className="page-header">
        <h1>All Bookings</h1>
        <p>View and manage customer reservations</p>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Lot</th>
              <th>Slot</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>
                  {b.user?.name}
                  <br />
                  <small>{b.user?.email}</small>
                </td>
                <td>{b.lot?.name}</td>
                <td>{b.slot?.slotNumber}</td>
                <td>
                  {new Date(b.startTime).toLocaleString()} —{' '}
                  {new Date(b.endTime).toLocaleString()}
                </td>
                <td>₹{b.amount?.toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${b.paymentStatus === 'paid' ? 'success' : 'warn'}`}>
                    {b.paymentStatus}
                  </span>
                </td>
                <td>{b.bookingStatus}</td>
                <td>
                  {b.bookingStatus !== 'cancelled' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(b._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
