import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import ProductCard from './ProductCard.jsx';
import { useSite } from '../context/SiteContext.jsx';

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

const ProductCardMemo = memo(ProductCard);

export default function ProductGrid({ search, onOpenReviews, onOpenCart }) {
  const { products: initialProducts, loaded, backendDown, layout } = useSite();
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(search || '');
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get layout settings with defaults
  const productsPerRowDesktop = layout?.productsPerRowDesktop || 4;
  const productsPerRowTablet = layout?.productsPerRowTablet || 3;
  const productsPerRowMobile = layout?.productsPerRowMobile || 2;
  const productCardSpacing = layout?.productCardSpacing || 16;
  const showProducts = layout?.showProducts !== false; // Default true

  // Determine products per row based on screen width
  const productsPerRow = windowWidth < 768 ? productsPerRowMobile : windowWidth < 1024 ? productsPerRowTablet : productsPerRowDesktop;
  
  // Fetch categories from backend to ensure synchronization with admin-created categories
  const [categories, setCategories] = useState(['All']);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/products/categories');
        console.log('=== CATEGORIES API RESPONSE ===');
        console.log('Full response:', data);
        console.log('Categories data:', data.categories);
        console.log('Categories type:', typeof data.categories);
        console.log('Categories isArray:', Array.isArray(data.categories));
        
        // Handle both string array and object array responses
        const categoryNames = (data.categories || []).map(c => {
          // If category is a string, use it directly
          if (typeof c === 'string') return c;
          // If category is an object, extract name property
          if (c && typeof c === 'object' && c.name) return c.name;
          // Fallback to string representation
          return String(c);
        });
        
        console.log('Extracted category names:', categoryNames);
        
        // Only update if we have categories (prevent empty response overwriting successful response)
        if (categoryNames.length > 0 || !categoriesLoaded) {
          setCategories(['All', ...categoryNames]);
          setCategoriesLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to hardcoded categories on error
        setCategories(['All', 'Dairy', 'Grains', 'Natural', 'Oils', 'Pickles', 'Spices', 'Sweets', 'Vegetables']);
      }
    };
    fetchCategories();
  }, []);
  
  // Show timeout message after 5 seconds if still loading
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000);
      return () => clearTimeout(timeoutId);
    } else {
      setShowTimeoutMessage(false);
    }
  }, [loading]);

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
  const showSkeleton = loading && products.length === 0;

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

  if (!showProducts) return null;

  return (
    <div className="section first-section last-section" style={{ padding: `${layout?.sectionSpacing || 48}px 0` }}>
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

      <div className="pgrid" style={{
        gridTemplateColumns: `repeat(${productsPerRow}, 1fr)`,
        gap: `${productCardSpacing}px`
      }}>
        {showSkeleton ? (
          <>
            {/* Skeleton loading cards instead of text */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-loading" style={{
                height: '300px',
                borderRadius: '8px'
              }} />
            ))}
            {/* Show timeout message if taking too long */}
            {showTimeoutMessage && (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '20px',
                backgroundColor: backendDown ? '#f8d7da' : '#fff3cd',
                borderRadius: '8px',
                marginTop: '20px',
                color: backendDown ? '#721c24' : '#856404'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {backendDown 
                    ? 'Server temporarily unavailable. Please refresh the page.'
                    : 'Loading products... Server is taking longer than expected'}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: backendDown ? '#dc3545' : '#2d5a27',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Refresh Page
                </button>
              </div>
            )}
          </>
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
