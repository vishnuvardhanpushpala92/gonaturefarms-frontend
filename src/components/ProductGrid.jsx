import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ search, onOpenReviews }) {
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

  return (
    <div className="section first-section">
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
        {!loading && uniqueCurrent.length === 0 && (
          <div className="empty-grid"><p>No products found</p></div>
        )}
        {uniqueCurrent.map((p) => (
          <ProductCard key={p.id} product={p} onOpenReviews={onOpenReviews} />
        ))}
      </div>

      {uniqueFuture.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <div className="section-head reveal">
            <h2 style={{ color: 'var(--earth)' }}>Coming Soon <span style={{ background: 'var(--earth)' }}></span></h2>
          </div>
          <div className="pgrid">
            {uniqueFuture.map((p) => (
              <ProductCard key={p.id} product={p} onOpenReviews={onOpenReviews} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
