import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminUsersTab() {
  const showToast = useToast();
  const [users, setUsers] = useState([]);

  const load = () => api.get('/admin/users').then(({ data }) => setUsers(data.users || []));
  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      const { data } = await api.delete(`/admin/users/${id}`);
      showToast(data.message || 'Customer deleted successfully');
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete customer');
    }
  };

  const exportCsv = async (type) => {
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('CSV exported successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to export CSV');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn btn-secondary" onClick={() => exportCsv('users')}>Export Customers CSV</button>
        <button className="btn btn-secondary" onClick={() => exportCsv('orders')}>Export Orders CSV</button>
        <button className="btn btn-secondary" onClick={() => exportCsv('monthly')}>Export Monthly Report CSV</button>
      </div>

      <table className="data-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.phone}</td>
              <td>{u.orderCount}</td>
              <td>₹{Number(u.totalSpent).toFixed(2)}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td><button className="btn-d" onClick={() => remove(u.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
