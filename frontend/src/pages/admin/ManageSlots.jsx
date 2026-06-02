import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManageSlots() {
  const [lots, setLots] = useState([]);
  const [lotId, setLotId] = useState('');
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ slotNumber: '', floor: 'Ground', status: 'available' });

  useEffect(() => {
    api.get('/lots').then((res) => {
      setLots(res.data);
      if (res.data.length) setLotId(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!lotId) return;
    api.get(`/slots/lot/${lotId}`).then((res) => setSlots(res.data));
  }, [lotId]);

  const loadSlots = () => {
    if (lotId) api.get(`/slots/lot/${lotId}`).then((res) => setSlots(res.data));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/slots', { ...form, lot: lotId });
    setForm({ slotNumber: '', floor: 'Ground', status: 'available' });
    loadSlots();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/slots/${id}`, { status });
    loadSlots();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slot?')) return;
    await api.delete(`/slots/${id}`);
    loadSlots();
  };

  return (
    <div>
      <header className="page-header">
        <h1>Manage Slots</h1>
        <p>Add slots and set maintenance status</p>
      </header>

      <label>
        Select lot
        <select value={lotId} onChange={(e) => setLotId(e.target.value)}>
          {lots.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <form className="card form-card section" onSubmit={handleAdd}>
        <h3>Add slot</h3>
        <div className="form-row">
          <label>
            Slot number
            <input
              value={form.slotNumber}
              onChange={(e) => setForm({ ...form, slotNumber: e.target.value })}
              required
              placeholder="A-01"
            />
          </label>
          <label>
            Floor
            <input
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Add slot
        </button>
      </form>

      <div className="table-wrap section">
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Floor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot._id}>
                <td>{slot.slotNumber}</td>
                <td>{slot.floor}</td>
                <td>
                  <select
                    value={slot.status}
                    onChange={(e) => updateStatus(slot._id, e.target.value)}
                  >
                    <option value="available">available</option>
                    <option value="occupied">occupied</option>
                    <option value="maintenance">maintenance</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(slot._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
