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
  const { user, isAuthenticated } = useAuth();
  const showToast = useToast();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [returnForm, setReturnForm] = useState({});
  const [showReturnForm, setShowReturnForm] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Load orders for authenticated user on mount
  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadCustomerOrders();
    }
  }, [isAuthenticated, user]);

  const loadCustomerOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my', { timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'No orders found for your account.');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phoneNumber) => {
    // Remove spaces and +91 prefix if present
    const cleaned = phoneNumber.replace(/\s/g, '').replace(/^\+91/, '');
    // Check if it's exactly 10 digits
    return /^\d{10}$/.test(cleaned);
  };

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      showToast('Please enter a mobile number');
      return;
    }

    if (!validatePhone(phone)) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/orders/lookup', { params: { phone }, timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'No orders found for this mobile number.');
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
      await lookupByPhone({ preventDefault: () => {} });
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const renderTimeline = (status) => {
    const currentIndex = STATUS_STEPS.indexOf(status);
    return (
      <div className="order-timeline">
        {STATUS_STEPS.map((step, index) => (
          <div key={step} className={`timeline-step ${index <= currentIndex ? 'completed' : 'pending'}`}>
            <div className="timeline-icon">
              {index <= currentIndex ? '✓' : ''}
            </div>
            {index === currentIndex && (
              <div className="timeline-active-indicator">🚚</div>
            )}
            <span className="timeline-label">
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

        {!isAuthenticated ? (
          <form onSubmit={lookupByPhone} className="tracking-search">
            <label>Enter your mobile number:</label>
            <div className="phone-input-wrapper">
              <span className="phone-prefix">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        ) : (
          <div className="tracking-search" style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#6b7280', marginBottom: '10px' }}>
              Showing orders for: <strong>{user?.name || user?.phone}</strong>
            </p>
            <button onClick={loadCustomerOrders} disabled={loading} style={{ padding: '10px 20px', background: 'var(--p)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {loading ? 'Loading...' : 'Refresh Orders'}
            </button>
          </div>
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

                <div className="order-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(order)}
                  >
                    View Details
                  </button>
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

      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button onClick={() => setShowOrderDetails(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="order-bill">
                <div className="bill-header">
                  <img src="/logo.png" alt="Go Nature Farms" className="bill-logo" />
                  <h3>Go Nature Farms</h3>
                  <p>Order Bill</p>
                </div>

                <div className="bill-info">
                  <div className="bill-row">
                    <span>Order ID:</span>
                    <strong>{selectedOrder.orderId}</strong>
                  </div>
                  <div className="bill-row">
                    <span>Order Date:</span>
                    <strong>{new Date(selectedOrder.createdAt).toLocaleString()}</strong>
                  </div>
                  <div className="bill-row">
                    <span>Customer:</span>
                    <strong>{selectedOrder.customerName}</strong>
                  </div>
                  <div className="bill-row">
                    <span>Phone:</span>
                    <strong>{selectedOrder.phone}</strong>
                  </div>
                  <div className="bill-row">
                    <span>Delivery Address:</span>
                    <strong>{selectedOrder.address}, {selectedOrder.area}, {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</strong>
                  </div>
                </div>

                <div className="bill-items">
                  <h4>Items</h4>
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <div key={index} className="bill-item">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bill-totals">
                  <div className="bill-row">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="bill-row">
                    <span>GST:</span>
                    <span>₹{selectedOrder.gstAmount}</span>
                  </div>
                  <div className="bill-row">
                    <span>Delivery Charge:</span>
                    <span>₹{selectedOrder.deliveryCharge}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="bill-row discount">
                      <span>Discount:</span>
                      <span>-₹{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="bill-row total">
                    <span>Total:</span>
                    <strong>₹{selectedOrder.total}</strong>
                  </div>
                </div>

                <div className="bill-status">
                  <div className="bill-row">
                    <span>Payment Method:</span>
                    <strong>{selectedOrder.paymentMethod}</strong>
                  </div>
                  <div className="bill-row">
                    <span>Payment Status:</span>
                    <strong className={selectedOrder.paymentStatus.toLowerCase()}>
                      {selectedOrder.paymentStatus}
                    </strong>
                  </div>
                  <div className="bill-row">
                    <span>Order Status:</span>
                    <strong className={selectedOrder.status.toLowerCase()}>
                      {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
