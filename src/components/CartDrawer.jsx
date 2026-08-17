import React from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { items, removeItem, updateQty, totals } = useCart();

  // Helper function to get image URL with proper backend prefix
  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    // If it's already a full URL (Cloudinary), return as-is
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    // If it's a local path, prefix with backend API URL
    // Handle double slashes by removing leading slash from imgUrl if backend URL ends with /
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer${open ? ' open' : ''}`}>
        <div className="drawer-hdr">
          <h3>Your Cart</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cart-list">
          {items.length === 0 && (
            <div className="empty-cart"><p>Your cart is empty</p></div>
          )}
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={getImageUrl(item.img)} alt={item.name} />
              <div className="ci-info">
                <div className="ci-name">{item.name}</div>
                <div className="ci-price">₹{item.price} {item.gst > 0 && <span className="ci-gst">+{item.gst}% GST</span>}</div>
                <div className="ci-qty">
                  <button className="qbtn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                  <span className="qnum">{item.qty}</span>
                  <button className="qbtn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                </div>
              </div>
              <button className="ci-rm" onClick={() => removeItem(item.id)} aria-label="Remove">🗑</button>
            </div>
          ))}
        </div>
        <div className="drawer-ftr">
          <div className="cart-summary">
            <div className="cs-row"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="cs-row"><span>GST</span><span>₹{totals.gstAmount.toFixed(2)}</span></div>
            <div className="cs-row total"><span>Total</span><span>₹{(totals.subtotal + totals.gstAmount).toFixed(2)}</span></div>
          </div>
          <button className="btn-checkout" disabled={items.length === 0} onClick={onCheckout}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
}
