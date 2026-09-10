import React, { memo, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import ProductCard from './ProductCard.jsx';

const ProductCardMemo = memo(ProductCard);

export default function ProductGrid({ search, onOpenReviews, onOpenCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCat !== 'All') params.cat = activeCat;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search]);

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data.categories || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = products.filter((p) => p.status !== 'future');
  const future = products.filter((p) => p.status === 'future');

  // Remove duplicate products by ID (defensive deduplication)
  const uniqueProducts = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  };

  const uniqueCurrent = uniqueProducts(current);
  const uniqueFuture = uniqueProducts(future);

  // Don't render if no products at all
  if (uniqueCurrent.length === 0 && uniqueFuture.length === 0) return null;

  return (
    <div className="section first-section last-section">
      <div className="section-head reveal">
        <h2>Fresh Products <span></span></h2>
      </div>
      <div className="filter-row">
        <button className={`fbtn${activeCat === 'All' ? ' active' : ''}`} onClick={() => setActiveCat('All')}>
          All Products
        </button>
        {categories.map((c) => (
          <button key={c} className={`fbtn${activeCat === c ? ' active' : ''}`} onClick={() => setActiveCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="pgrid">
        {loading ? (
          <div className="empty-grid"><p>Loading products...</p></div>
        ) : uniqueCurrent.length === 0 ? (
          <div className="empty-grid"><p>Products are not available</p></div>
        ) : (
          uniqueCurrent.map((p) => (
            <ProductCardMemo key={p.id} product={p} onOpenReviews={onOpenReviews} onOpenCart={onOpenCart} />
          ))
        )}
      </div>

      {uniqueFuture.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <div className="section-head reveal">
            <h2 style={{ color: 'var(--earth)' }}>Coming Soon <span style={{ background: 'var(--earth)' }}></span></h2>
          </div>
          <div className="pgrid">
            {uniqueFuture.map((p) => (
              <ProductCardMemo key={p.id} product={p} onOpenReviews={onOpenReviews} onOpenCart={onOpenCart} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
