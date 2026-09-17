import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function ProductCard({ product, onOpenReviews, onEdit, onDelete, onOpenCart }) {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  const isFuture = product.status === 'future';

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(product.price);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Parse additional images from JSON string if needed
  const additionalImages = product.additional_images || product.additionalImages
    ? (typeof (product.additional_images || product.additionalImages) === 'string' ? JSON.parse(product.additional_images || product.additionalImages) : (product.additional_images || product.additionalImages))
    : [];
  const allImages = [product.img_url || product.imgUrl, ...additionalImages].filter(Boolean);

  const hasVariants = product.variants && product.variants.length > 0;

  // Initialize with first variant if available (only on mount or when product.id changes)
  React.useEffect(() => {
    if (hasVariants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setDisplayPrice(product.variants[0].price);
    }
  }, [product.id, hasVariants]);

  const handleVariantChange = (e) => {
    const variantId = parseInt(e.target.value);
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setDisplayPrice(variant.price);
      console.log('Selected variant:', variant);
    }
  };

  const isOutOfStock = hasVariants && selectedVariant && selectedVariant.stock === 0;

  const discountPct = product.mrp && product.mrp > displayPrice
    ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    if (!isAuthenticated) {
      // Store the intended action to restore after login
      sessionStorage.setItem('gnf_intended_action', JSON.stringify({
        type: 'add_to_cart',
        product: {
          ...product,
          price: displayPrice,
          variantId: selectedVariant ? selectedVariant.id : null,
          variantName: selectedVariant ? selectedVariant.variantName : null
        }
      }));
      navigate('/login');
      return;
    }
    const productToAdd = {
      ...product,
      price: displayPrice,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant ? selectedVariant.variantName : null
    };
    addItem(productToAdd);
    // Open cart drawer after adding
    if (onOpenCart) {
      onOpenCart();
    }
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
      <div className="pcard-img" onClick={() => openLightbox(0)} style={{ cursor: 'pointer' }}>
        <img
          src={getImageUrl(product.img_url || product.imgUrl)}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            console.error('Image load error:', product.img_url || product.imgUrl, e);
            e.target.style.display = 'none';
            e.target.parentElement.style.background = '#f0f0f0';
            e.target.parentElement.style.display = 'flex';
            e.target.parentElement.style.alignItems = 'center';
            e.target.parentElement.style.justifyContent = 'center';
            e.target.parentElement.innerHTML = '<span style="color: #999; font-size: 0.8rem;">Image not available</span>';
          }}
        />
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
                  {variant.variantName || 'Standard'} - ₹{variant.price}
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

      {/* Lightbox for image gallery */}
      {isLightboxOpen && (
        <Lightbox
          slides={allImages.map(img => ({ src: getImageUrl(img) }))}
          index={lightboxIndex}
          open={isLightboxOpen}
          close={closeLightbox}
          on={{
            click: () => {},
            enter: () => {},
            leave: () => {},
            view: () => {},
            prev: () => {},
            next: () => {},
          }}
        />
      )}
    </div>
  );
}