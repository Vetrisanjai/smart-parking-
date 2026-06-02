import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Utility helper to load Razorpay SDK dynamically
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

export default function BookParking() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [lotId, setLotId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState(null);

  // Floor navigation states
  const [activeFloor, setActiveFloor] = useState('Ground');

  useEffect(() => {
    api.get('/lots').then((res) => {
      setLots(res.data);
      if (res.data.length) setLotId(res.data[0]._id);
    });
    api.get('/auth/me').then((res) => {
      if (res.data.vehiclePlate) setVehiclePlate(res.data.vehiclePlate);
    });
  }, []);

  useEffect(() => {
    if (!lotId || !startTime || !endTime) {
      setSlots([]);
      setEstimate(null);
      return;
    }
    const lot = lots.find((l) => l._id === lotId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setSlots([]);
      setEstimate(null);
      return;
    }

    const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    if (lot) setEstimate(hours * lot.hourlyRate);

    api
      .get('/slots/available', {
        params: { lotId, start: start.toISOString(), end: end.toISOString() },
      })
      .then((res) => {
        setSlots(res.data);
      })
      .catch(() => setSlots([]));
  }, [lotId, startTime, endTime, lots]);

  // Group slots by floor dynamically when they load
  const floors = [...new Set(slots.map((s) => s.floor || 'Ground'))].sort();

  useEffect(() => {
    if (slots.length > 0) {
      const floorsList = [...new Set(slots.map((s) => s.floor || 'Ground'))].sort();
      if (!floorsList.includes(activeFloor)) {
        setActiveFloor(floorsList[0] || 'Ground');
      }
    } else {
      setActiveFloor('Ground');
    }
  }, [slots, activeFloor]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Select a slot');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1. Create the booking
      const { data: booking } = await api.post('/bookings', {
        slotId: selectedSlot,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        vehiclePlate,
      });

      // 2. Load the Razorpay Checkout script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please pay from "My Bookings" page.');
        navigate('/customer/bookings');
        return;
      }

      // 3. Request order creation from server
      const { data: orderData } = await api.post(`/payments/razorpay/order/${booking._id}`);

      // 4. Trigger Razorpay Standard Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Smart Parking System',
        description: `Booking for ${orderData.booking.lot?.name || 'Lot'} - Slot ${orderData.booking.slot?.slotNumber || ''}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await api.post('/payments/razorpay/verify', {
              bookingId: booking._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              navigate('/customer/bookings', { search: '?paid=1' });
            } else {
              alert('Payment verification failed.');
              navigate('/customer/bookings');
            }
          } catch (err) {
            alert('Verification error: ' + (err.response?.data?.message || err.message));
            navigate('/customer/bookings');
          } finally {
            setLoading(false);
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
            alert('Payment cancelled. You can complete it later in "My Bookings".');
            navigate('/customer/bookings');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      setLoading(false);
    }
  };

  const minNow = new Date().toISOString().slice(0, 16);
  const selectedLot = lots.find((l) => l._id === lotId);
  const selectedSlotNumber = slots.find((s) => s._id === selectedSlot)?.slotNumber;

  return (
    <div>
      <header className="page-header">
        <h1>Book Parking</h1>
        <p>Choose an interactive lot, select dates, and book an available spot</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="booking-layout-grid">
        <form onSubmit={handleBook} className="card-column">
          {/* Visual Lot Cards Selection */}
          <div className="section" style={{ marginTop: 0 }}>
            <h2>1. Select Parking Lot</h2>
            <div className="lot-grid-select">
              {lots.map((lot) => (
                <div
                  key={lot._id}
                  className={`lot-select-card ${lotId === lot._id ? 'selected' : ''}`}
                  onClick={() => {
                    setLotId(lot._id);
                    setSelectedSlot('');
                  }}
                >
                  {lotId === lot._id && <div className="selected-badge">✓</div>}
                  <h3>{lot.name}</h3>
                  <p>{lot.description || 'Secure parking with high-tech automated entry/exit.'}</p>
                  <small style={{ color: 'var(--muted)' }}>{lot.address}</small>
                  <div className="price-tag">
                    <span>₹{lot.hourlyRate.toFixed(2)}/hr</span>
                    {lot.isActive ? (
                      <span className="badge badge-success">Open</span>
                    ) : (
                      <span className="badge badge-warn">Closed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>2. Schedule Booking</h2>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <label>
                Start Date & Time
                <input
                  type="datetime-local"
                  value={startTime}
                  min={minNow}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setSelectedSlot('');
                  }}
                  required
                />
              </label>
              <label>
                End Date & Time
                <input
                  type="datetime-local"
                  value={endTime}
                  min={startTime || minNow}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setSelectedSlot('');
                  }}
                  required
                />
              </label>
            </div>
            <label style={{ marginTop: '0.5rem' }}>
              Vehicle License Plate
              <input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="e.g. MH12AB1234"
              />
            </label>
          </div>

          {/* Slots visual layout */}
          <div className="card">
            <h2>3. Choose Available Slot</h2>
            {startTime && endTime && selectedLot ? (
              <div className="section" style={{ marginTop: '1rem' }}>
                {slots.length === 0 ? (
                  <p className="muted">No slots available for this period. Try a different time.</p>
                ) : (
                  <>
                    {/* Floor Navigation Tabs */}
                    {floors.length > 0 && (
                      <div className="floor-tabs">
                        {floors.map((floor) => (
                          <button
                            key={floor}
                            type="button"
                            className={`floor-tab-btn ${activeFloor === floor ? 'active' : ''}`}
                            onClick={() => setActiveFloor(floor)}
                          >
                            {floor} Floor
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Slots Grid for active floor */}
                    <div className="slot-grid" style={{ marginTop: '1rem' }}>
                      {slots
                        .filter((s) => (s.floor || 'Ground') === activeFloor)
                        .map((slot) => (
                          <button
                            key={slot._id}
                            type="button"
                            className={`slot-btn ${selectedSlot === slot._id ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(slot._id)}
                          >
                            {slot.slotNumber}
                            <small>{slot.floor}</small>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: '1rem' }}>
                Please select parking dates above to see available spots.
              </p>
            )}
          </div>
        </form>

        {/* Sticky Estimate Summary Section */}
        <div>
          <div className="estimate-summary">
            <h3>Booking Summary</h3>
            <div className="summary-row">
              <span>Parking Lot:</span>
              <span className="val">{selectedLot?.name || 'Not Selected'}</span>
            </div>
            <div className="summary-row">
              <span>Location:</span>
              <span className="val">{selectedLot?.address || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span>Selected Slot:</span>
              <span className="val">{selectedSlotNumber || 'None'}</span>
            </div>
            <div className="summary-row">
              <span>Vehicle Plate:</span>
              <span className="val">{vehiclePlate || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span>Duration:</span>
              <span className="val">
                {startTime && endTime
                  ? `${Math.max(
                      1,
                      Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))
                    )} hours`
                  : 'N/A'}
              </span>
            </div>

            {estimate !== null && (
              <div className="summary-row total">
                <span>Total Charge:</span>
                <span>₹{estimate.toFixed(2)}</span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: '1rem' }}
              disabled={loading || !selectedSlot}
              onClick={handleBook}
            >
              {loading ? 'Processing...' : 'Confirm & Pay Now'}
            </button>
            <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              Secure payment processed via Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
