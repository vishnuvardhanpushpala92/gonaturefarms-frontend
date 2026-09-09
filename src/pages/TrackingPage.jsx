import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersModal from '../components/OrdersModal.jsx';

export default function TrackingPage() {
  const navigate = useNavigate();
  const [showOrders, setShowOrders] = useState(true);

  const handleClose = () => {
    setShowOrders(false);
    navigate('/');
  };

  return (
    <div className="tracking-page">
      <div className="tracking-container">
        <div className="tracking-header">
          <img src="/logo.png" alt="Go Nature Farms" className="tracking-logo" />
          <h1>Order Tracking</h1>
          <p>Track your Go Nature Farms orders</p>
        </div>
        
        <OrdersModal 
          open={showOrders} 
          onClose={handleClose} 
        />
        
        <div className="tracking-footer">
          <button onClick={() => navigate('/')} className="back-button">
            ← Return to Website
          </button>
        </div>
      </div>
    </div>
  );
}
