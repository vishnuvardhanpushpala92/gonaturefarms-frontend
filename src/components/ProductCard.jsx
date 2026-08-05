import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function ProductCard({ product, onOpenReviews, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  const isFuture = product.status === 'future';

  const discountPct = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    addItem(product);
  };

  const handleWishlist = async () => {
    try {
      await api.post(`/wishlist/${product.id}`);
      showToast('Added to wishlist');
    } catch {
      showToast('Please login to use wishlist');
    }
  };

  return (
    <div className={`pcard${isFuture ? ' pcard-future' : ''}`}>
      <div className="pcard-img">
        <img src={product.imgUrl} alt={product.name} />
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{product.cat}</span>
        <div className="pcard-name">{product.name}</div>
        <div className="pcard-desc">{product.description}</div>
        <div className="pcard-price-block">
          <span className="price-final">₹{product.price}</span>
          {product.mrp > product.price && <span className="price-mrp">₹{product.mrp}</span>}
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
