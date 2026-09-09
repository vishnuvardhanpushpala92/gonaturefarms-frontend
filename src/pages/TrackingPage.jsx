import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

const STATUS_LABELS = {
  'Placed': 'Order Placed',
  'Confirmed': 'Order Confirmed',
  'Processing': 'Processing',
  'Packed': 'Packed',
  'Shipped': 'Shipped',
  'OutForDelivery': 'Out for Delivery',
  'Delivered': 'Delivered',
  'PaymentVerificationPending': 'Payment Verification',
  'Cancelled': 'Cancelled'
};

export default function TrackingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [returnForm, setReturnForm] = useState({});
  const [showReturnForm, setShowReturnForm] = useState({});

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    if (user) {
      showToast('Please use the "View My Orders" to view your orders.');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.get('/orders/lookup', { params: { phone }, timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to lookup orders');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async () => {
    if (!user) {
      showToast('Please login to view your orders');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my', { timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const requestReturn = async (orderId) => {
    const form = returnForm[orderId] || {};
    if (!form.reason) {
      showToast('Please provide a reason for the return');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/return`, {
        reason: form.reason,
        notes: form.notes
      }, { timeout: 60000 });
      showToast('Return request submitted successfully');
      setShowReturnForm(prev => ({ ...prev, [orderId]: false }));
      setReturnForm(prev => ({ ...prev, [orderId]: {} }));
      // Reload orders to show updated return status
      if (user) {
        await loadMyOrders();
      } else {
        await lookupByPhone({ preventDefault: () => {} });
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = (status) => {
    const currentIndex = STATUS_STEPS.indexOf(status);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', position: 'relative' }}>
        {STATUS_STEPS.map((step, index) => (
          <div key={step} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            zIndex: 1,
            flex: 1 
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: index <= currentIndex ? '#2d5a27' : '#e5e7eb',
              marginBottom: '8px'
            }} />
            <span style={{ 
              fontSize: '0.7rem', 
              color: index <= currentIndex ? '#2d5a27' : '#9ca3af',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {STATUS_LABELS[step] || step}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tracking-page">
      <div className="tracking-container">
        <div className="tracking-header">
          <img src="/logo.png" alt="Go Nature Farms" className="tracking-logo" />
          <h1>Order Tracking</h1>
          <p>Track your Go Nature Farms orders</p>
        </div>
        
        {!user && (
          <form onSubmit={lookupByPhone} className="tracking-search">
            <label>Enter your phone number:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit phone number"
              pattern="[0-9]{10}"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        )}
        
        {user && (
          <button onClick={loadMyOrders} className="load-orders-btn" disabled={loading}>
            {loading ? 'Loading...' : 'View My Orders'}
          </button>
        )}
        
        {searched && orders.length === 0 && (
          <div className="no-orders">
            <p>No orders found for the provided information.</p>
          </div>
        )}
        
        {searched && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.orderId}</h3>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`order-status ${order.status.toLowerCase()}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </div>
                </div>
                
                {renderTimeline(order.status)}
                
                <div className="order-items">
                  <h4>Items:</h4>
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.name}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>
                
                <div className="order-total">
                  <strong>Total: ₹{order.total}</strong>
                </div>
                
                {order.status === 'Delivered' && !order.returnRequested && (
                  <button 
                    className="return-btn"
                    onClick={() => setShowReturnForm(prev => ({ ...prev, [order.orderId]: !prev[order.orderId] }))}
                  >
                    🔄 Request Return
                  </button>
                )}
                
                {showReturnForm[order.orderId] && (
                  <div className="return-form">
                    <h5>Request Return</h5>
                    <div className="form-group">
                      <label>Return Reason *</label>
                      <select
                        value={returnForm[order.orderId]?.reason || ''}
                        onChange={(e) => setReturnForm(prev => ({
                          ...prev,
                          [order.orderId]: { ...prev[order.orderId], reason: e.target.value }
                        }))}
                        required
                      >
                        <option value="">Select a reason</option>
                        <option value="Damaged">Damaged Product</option>
                        <option value="Wrong Item">Wrong Item Delivered</option>
                        <option value="Not as described">Not as Described</option>
                        <option value="Quality Issue">Quality Issue</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Additional Details</label>
                      <textarea
                        value={returnForm[order.orderId]?.notes || ''}
                        onChange={(e) => setReturnForm(prev => ({
                          ...prev,
                          [order.orderId]: { ...prev[order.orderId], notes: e.target.value }
                        }))}
                        placeholder="Please provide more details about your return request..."
                        rows="3"
                      />
                    </div>
                    <div className="form-actions">
                      <button 
                        onClick={() => requestReturn(order.orderId)}
                        disabled={loading}
                        className="submit-btn"
                      >
                        {loading ? 'Submitting...' : 'Submit Return Request'}
                      </button>
                      <button 
                        onClick={() => setShowReturnForm(prev => ({ ...prev, [order.orderId]: false }))}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {order.returnRequested && (
                  <div className="return-status">
                    <div className={`status-badge ${order.returnStatus?.toLowerCase()}`}>
                      🔄 Return Status: {order.returnStatus}
                    </div>
                    <p><strong>Reason:</strong> {order.returnReason}</p>
                    {order.returnNotes && <p><strong>Details:</strong> {order.returnNotes}</p>}
                    {order.returnProcessedAt && (
                      <p><strong>Processed At:</strong> {new Date(order.returnProcessedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="tracking-footer">
          <button onClick={() => navigate('/')} className="back-button">
            ← Return to Website
          </button>
        </div>
      </div>
    </div>
  );
}
