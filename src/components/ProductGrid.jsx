import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import ProductCard from './ProductCard.jsx';
import { useSite } from '../context/SiteContext.jsx';
import useSWR from 'swr';

// Add shimmer animation for skeleton loading
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .skeleton-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Inject shimmer styles
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'shimmer-styles';
  styleSheet.textContent = shimmerStyle;
  document.head.appendChild(styleSheet);
}

// SWR fetcher function
const fetcher = (url) => api.get(url).then(res => res.data);

const ProductCardMemo = memo(ProductCard);

export default function ProductGrid({ search, onOpenReviews, onOpenCart }) {
  const { products: initialProducts, loaded } = useSite();
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(search || '');
  
  // Use SWR for categories with automatic caching and retry logic
  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useSWR('/products/categories', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Deduplicate requests within 60 seconds
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Never retry on 404 or 401 errors
      if (error.status === 404 || error.status === 401) return;
      
      // Only retry up to 3 times
      if (retryCount >= 3) return;
      
      // Retry after 2 seconds with exponential backoff
      setTimeout(() => revalidate({ retryCount }), 2000 * Math.pow(2, retryCount));
    },
    onError: (err) => {
      console.error('SWR error loading categories:', err);
    }
  });
  
  const categories = categoriesData?.categories || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCat !== 'All') params.cat = activeCat;
      if (localSearch) params.search = localSearch;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, [activeCat, localSearch]);

  // Use products from SiteContext initially, then load filtered products
  useEffect(() => {
    if (loaded && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [loaded, initialProducts]);

  useEffect(() => {
    if (activeCat !== 'All' || localSearch) {
      load();
    } else if (loaded) {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [activeCat, localSearch, loaded, initialProducts, load]);
  
  // Determine if we should show skeleton
  const showSkeleton = (loading && products.length === 0) || categoriesLoading;

  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

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

      {/* Search Box - Placed between category buttons and products */}
      <div className="product-search-box">
        <input
          type="text"
          placeholder="Search products..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="product-search-input"
        />
      </div>

      <div className="pgrid">
        {showSkeleton ? (
          // Skeleton loading cards instead of text
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-loading" style={{ 
              height: '300px', 
              borderRadius: '8px'
            }} />
          ))
        ) : uniqueCurrent.length === 0 ? (
          <div className="empty-grid"><p>No products available in this category.</p></div>
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
