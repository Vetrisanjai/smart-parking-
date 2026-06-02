import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const location = useLocation();

  const load = () => {
    setLoading(true);
    api
      .get('/bookings/mine')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('paid')) {
      load();
      setSuccessMsg('Payment successful! Your booking is confirmed.');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (bookingId) => {
    setPaying(bookingId);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your connection.');
        return;
      }

      // 1. Create order
      const { data: orderData } = await api.post(`/payments/razorpay/order/${bookingId}`);

      // 2. Open Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Smart Parking System',
        description: `Booking for ${orderData.booking.lot?.name || 'Lot'} - Slot ${orderData.booking.slot?.slotNumber || ''}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            setPaying(bookingId);
            const verifyRes = await api.post('/payments/razorpay/verify', {
              bookingId: bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              load();
              setSuccessMsg('Payment successful! Your booking is confirmed.');
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            alert('Verification error: ' + (err.response?.data?.message || err.message));
          } finally {
            setPaying(null);
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            alert('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>My Bookings</h1>
        <p>Pay online or cancel reservations</p>
      </header>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No bookings yet. Book your first slot!</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Slot</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.lot?.name}</td>
                  <td>{b.slot?.slotNumber}</td>
                  <td>
                    {new Date(b.startTime).toLocaleString()} —{' '}
                    {new Date(b.endTime).toLocaleString()}
                  </td>
                  <td>₹{b.amount?.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.paymentStatus === 'paid' ? 'badge-success' : 'badge-warn'
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>{b.bookingStatus}</td>
                  <td className="actions-cell">
                    {b.paymentStatus === 'pending' &&
                      b.bookingStatus !== 'cancelled' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={paying === b._id}
                          onClick={() => handlePay(b._id)}
                        >
                          {paying === b._id ? '...' : 'Pay now'}
                        </button>
                      )}
                    {b.bookingStatus !== 'cancelled' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleCancel(b._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
