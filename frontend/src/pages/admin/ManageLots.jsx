import { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyLot = {
  name: '',
  address: '',
  hourlyRate: 5,
  description: '',
  isActive: true,
};

export default function ManageLots() {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState(emptyLot);
  const [editId, setEditId] = useState(null);

  const load = () => api.get('/lots').then((res) => setLots(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await api.put(`/lots/${editId}`, form);
    } else {
      await api.post('/lots', form);
    }
    setForm(emptyLot);
    setEditId(null);
    load();
  };

  const handleEdit = (lot) => {
    setEditId(lot._id);
    setForm({
      name: lot.name,
      address: lot.address,
      hourlyRate: lot.hourlyRate,
      description: lot.description || '',
      isActive: lot.isActive,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lot and all its slots?')) return;
    await api.delete(`/lots/${id}`);
    load();
  };

  return (
    <div>
      <header className="page-header">
        <h1>Manage Lots</h1>
        <p>Create and edit parking lots</p>
      </header>

      <form className="card form-card" onSubmit={handleSubmit}>
        <h3>{editId ? 'Edit lot' : 'Add lot'}</h3>
        <div className="form-row">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Hourly rate (₹)
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
              required
            />
          </label>
        </div>
        <label>
          Address
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            {editId ? 'Update' : 'Create'}
          </button>
          {editId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditId(null);
                setForm(emptyLot);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap section">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Rate</th>
              <th>Slots</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot._id}>
                <td>{lot.name}</td>
                <td>{lot.address}</td>
                <td>₹{lot.hourlyRate}/hr</td>
                <td>{lot.totalSlots}</td>
                <td>{lot.isActive ? 'Yes' : 'No'}</td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEdit(lot)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(lot._id)}>
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
