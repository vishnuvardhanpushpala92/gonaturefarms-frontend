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
  const [trackingNumber, setTrackingNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [searchType, setSearchType] = useState('orderId'); // 'orderId' or 'phone'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [returnForm, setReturnForm] = useState({});
  const [showReturnForm, setShowReturnForm] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const lookupByOrderId = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${trackingNumber}`, { timeout: 60000 });
      setOrders([data.order]);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Order not found. Please check your order ID.');
    } finally {
      setLoading(false);
    }
  };

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.get('/orders/lookup', { params: { phone }, timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'No orders found for this phone number.');
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
      if (searchType === 'orderId') {
        await lookupByOrderId({ preventDefault: () => {} });
      } else {
        await lookupByPhone({ preventDefault: () => {} });
      }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', position: 'relative' }}>
        {STATUS_STEPS.map((step, index) => (
          <div key={step} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            flex: 1,
            position: 'relative'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: index <= currentIndex ? '#2d5a27' : '#e5e7eb',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: index <= currentIndex ? '#fff' : '#9ca3af',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {index <= currentIndex ? '✓' : ''}
            </div>
            {index === currentIndex && (
              <div style={{
                position: 'absolute',
                top: '-24px',
                fontSize: '1.2rem',
                animation: 'bounce 2s infinite'
              }}>
                🚚
              </div>
            )}
            <span style={{
              fontSize: '0.7rem',
              color: index <= currentIndex ? '#2d5a27' : '#9ca3af',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontWeight: index === currentIndex ? 'bold' : 'normal'
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

        <div className="tracking-search-type">
          <button
            className={`search-type-btn ${searchType === 'orderId' ? 'active' : ''}`}
            onClick={() => setSearchType('orderId')}
          >
            Search by Order ID
          </button>
          <button
            className={`search-type-btn ${searchType === 'phone' ? 'active' : ''}`}
            onClick={() => setSearchType('phone')}
          >
            Search by Phone
          </button>
        </div>

        {searchType === 'orderId' ? (
          <form onSubmit={lookupByOrderId} className="tracking-search">
            <label>Enter Order ID:</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., GN123456789"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        ) : (
          <form onSubmit={lookupByPhone} className="tracking-search">
            <label>Enter Phone Number:</label>
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
