import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminAnalyticsTab() {
  const [data, setData] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data));
  }, []);

  const clearDashboard = async () => {
    if (!window.confirm('Are you sure you want to clear the dashboard view? This will only refresh the analytics data from the database.')) {
      return;
    }
    try {
      // Clear local state and reload from database
      setData(null);
      showToast('Dashboard cleared. Reloading data...');
      // Reload analytics after clearing
      api.get('/admin/analytics').then(({ data }) => setData(data));
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reload dashboard');
    }
  };

  if (!data) return <p>Loading...</p>;

  const { totals, monthly, topProds, recentOrders } = data;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-danger" onClick={clearDashboard}>Clear Dashboard</button>
      </div>
      <div className="stat-cards">
        <div className="stat-card"><div className="stat-num">{totals.totalOrders}</div><div className="stat-lbl">Orders</div></div>
        <div className="stat-card"><div className="stat-num">₹{Number(totals.totalRevenue).toFixed(0)}</div><div className="stat-lbl">Revenue</div></div>
        <div className="stat-card"><div className="stat-num">{totals.delivered}</div><div className="stat-lbl">Delivered</div></div>
        <div className="stat-card"><div className="stat-num">{totals.pending}</div><div className="stat-lbl">Pending</div></div>
        <div className="stat-card"><div className="stat-num">{totals.users}</div><div className="stat-lbl">Customers</div></div>
        <div className="stat-card"><div className="stat-num">{totals.products}</div><div className="stat-lbl">Products</div></div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Monthly Trend</h3>
        <table className="data-table">
          <thead><tr><th>Month</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            {monthly.map((m) => (
              <tr key={m.month}><td>{m.month}</td><td>{m.orders}</td><td>₹{Number(m.revenue).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Top Selling Products</h3>
        <table className="data-table">
          <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {topProds.map((p, i) => (
              <tr key={i}><td>{p.productName}</td><td>{p.sold}</td><td>₹{Number(p.revenue).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Recent Orders</h3>
        <table className="data-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.orderId}>
                <td>{o.orderId}</td><td>{o.customerName}</td><td>₹{o.total}</td><td>{o.status}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
