import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function ProductCard({ product, onOpenReviews, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  const isFuture = product.status === 'future';
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(product.price);

  const hasVariants = product.variants && product.variants.length > 0;
  
  // Initialize with first variant if available
  React.useEffect(() => {
    if (hasVariants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setDisplayPrice(product.variants[0].price);
    }
  }, [product, hasVariants]);

  const handleVariantChange = (e) => {
    const variantId = parseInt(e.target.value);
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setDisplayPrice(variant.price);
    }
  };

  const discountPct = product.mrp && product.mrp > displayPrice
    ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    const productToAdd = {
      ...product,
      price: displayPrice,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant ? selectedVariant.variantName : null
    };
    addItem(productToAdd);
  };

  const handleWishlist = async () => {
    try {
      await api.post(`/wishlist/${product.id}`);
      showToast('Added to wishlist');
    } catch {
      showToast('Please login to use wishlist');
    }
  };

  // Prefix local image paths with backend API URL
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
    <div className={`pcard${isFuture ? ' pcard-future' : ''}`}>
      <div className="pcard-img">
        <img src={getImageUrl(product.imgUrl)} alt={product.name} />
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{product.cat}</span>
        <div className="pcard-name">{product.name}</div>
        <div className="pcard-desc">{product.description}</div>
        
        {hasVariants && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: 2, display: 'block' }}>Select Variant:</label>
            <select 
              value={selectedVariant ? selectedVariant.id : ''} 
              onChange={handleVariantChange}
              style={{ 
                width: '100%', 
                padding: '6px 8px', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--r-sm)',
                fontSize: '.8rem'
              }}
            >
              {product.variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.variantName} - ₹{variant.price}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="pcard-price-block">
          <span className="price-final">₹{displayPrice}</span>
          {product.mrp > displayPrice && <span className="price-mrp">₹{product.mrp}</span>}
          {discountPct > 0 && <span className="price-disc">{discountPct}% OFF</span>}
          {product.gst > 0 && <div className="gst-line"><strong>+{product.gst}% GST</strong></div>}
          {product.hsn && <div className="hsn-line">HSN: {product.hsn}</div>}
        </div>

        {isFuture ? (
          <div className="coming-badge">🌱 Coming Soon</div>
        ) : (
          <button className="btn-buy" onClick={handleAdd}>Add to Cart</button>
        )}

        {!isAdmin && !isFuture && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn-e" onClick={() => onOpenReviews(product)}>★ Reviews</button>
            <button className="btn-e" onClick={handleWishlist}>♥ Wishlist</button>
          </div>
        )}

        {isAdmin && onEdit && onDelete && (
          <div className="admin-ctrl">
            <button className="btn-e" onClick={() => onEdit(product)}>Edit</button>
            <button className="btn-d" onClick={() => onDelete(product)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
