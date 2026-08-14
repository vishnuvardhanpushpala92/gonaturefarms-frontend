import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = { code: '', discountType: 'flat', discountValue: '', minOrder: '', maxUses: '', expiresAt: '' };

export default function AdminCouponsTab() {
  const showToast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get('/coupons').then(({ data }) => setCoupons(data.coupons || []));
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/coupons', { ...form, expiresAt: form.expiresAt || undefined });
      showToast(data.message);
      if (data.success) { setForm(EMPTY); load(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not create coupon');
    }
  };

  const toggle = async (id) => {
    const { data } = await api.put(`/coupons/${id}/toggle`);
    showToast(data.message);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    const { data } = await api.delete(`/coupons/${id}`);
    showToast(data.message);
    load();
  };

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>New Coupon</h3>
        <form onSubmit={create}>
          <div className="frow">
            <div className="fg"><label>Code</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div className="fg"><label>Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="flat">Flat ₹</option>
                <option value="percent">Percent %</option>
              </select>
            </div>
          </div>
          <div className="frow">
            <div className="fg"><label>Discount Value</label><input required type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></div>
            <div className="fg"><label>Min Order</label><input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></div>
          </div>
          <div className="frow">
            <div className="fg"><label>Max Uses</label><input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
            <div className="fg"><label>Expires At</label><input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary">Create Coupon</button>
        </form>
      </div>

      <table className="data-table">
        <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Used/Max</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
              <td>₹{c.minOrder}</td>
              <td>{c.usedCount}/{c.maxUses}</td>
              <td>{c.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn-e" onClick={() => toggle(c.id)}>{c.isActive ? 'Disable' : 'Enable'}</button>{' '}
                <button className="btn-d" onClick={() => remove(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
