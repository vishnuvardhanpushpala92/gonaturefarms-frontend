import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics');
      setData(data);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const clearDashboard = () => {
    if (!window.confirm('Are you sure you want to clear the dashboard view? This will reset the displayed data.')) {
      return;
    }
    // Clear local state without making an API call
    setData(null);
    showToast('Dashboard cleared. Click refresh to load data again.');
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/admin/analytics/export', {
        responseType: 'blob',
        skipTransform: true,
        timeout: 60000
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Excel export downloaded successfully');
    } catch (err) {
      showToast('Failed to export Excel: ' + (err?.message || 'Unknown error'));
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data available</p>;

  const { totals, monthly, topProds, recentOrders } = data;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button className="btn btn-danger" onClick={clearDashboard}>Clear Dashboard</button>
        <button className="btn btn-primary" onClick={exportToExcel}>Export to Excel</button>
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
