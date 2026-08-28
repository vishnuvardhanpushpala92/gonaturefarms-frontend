import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function ProductCard({ product, onOpenReviews, onEdit, onDelete }) {
  const { isAdmin, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  const isFuture = product.status === 'future';

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(product.price);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Parse additional images from JSON string if needed
  const additionalImages = product.additionalImages
    ? (typeof product.additionalImages === 'string' ? JSON.parse(product.additionalImages) : product.additionalImages)
    : [];
  const allImages = [product.imgUrl, ...additionalImages].filter(Boolean);

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

  const isOutOfStock = hasVariants && selectedVariant && selectedVariant.stock === 0;

  const discountPct = product.mrp && product.mrp > displayPrice
    ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    if (!isAuthenticated) {
      showToast('Please login or register to add items to cart');
      return;
    }
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

  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  return (
    <div className={`pcard${isFuture ? ' pcard-future' : ''}`} style={{ overflow: 'visible', zIndex: 10 }}>
      <div className="pcard-img" onClick={() => allImages.length > 1 && setShowGallery(true)} style={{ cursor: allImages.length > 1 ? 'pointer' : 'default' }}>
        <img src={getImageUrl(product.imgUrl)} alt={product.name} />
        {allImages.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: '0.7rem'
          }}>
            {allImages.length} photos
          </div>
        )}
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
                fontSize: '.8rem',
                position: 'relative',
                zIndex: 100
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="price-final">₹{displayPrice}</span>
            {product.mrp > displayPrice && <span className="price-mrp">₹{product.mrp}</span>}
            {discountPct > 0 && <span className="price-disc">{discountPct}% OFF</span>}
          </div>
          {product.gst > 0 && <div className="gst-line"><strong>+{product.gst}% GST</strong></div>}
          {product.hsn && <div className="hsn-line">HSN: {product.hsn}</div>}
        </div>

        {isFuture ? (
          <div className="coming-badge">🌱 Coming Soon</div>
        ) : isOutOfStock ? (
          <button className="btn-buy" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Sold Out</button>
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

      {/* Image Gallery Modal */}
      {showGallery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowGallery(false)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowGallery(false)}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            <img
              src={getImageUrl(allImages[currentImageIndex])}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {allImages.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                disabled={allImages.length <= 1}
                style={{
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: allImages.length > 1 ? 'pointer' : 'not-allowed',
                  opacity: allImages.length > 1 ? 1 : 0.5
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                disabled={allImages.length <= 1}
                style={{
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: allImages.length > 1 ? 'pointer' : 'not-allowed',
                  opacity: allImages.length > 1 ? 1 : 0.5
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}