import React from 'react';

export default function HomePageSkeleton() {
  return (
    <>
      {/* Hero Slider Skeleton */}
      <div style={{ height: '400px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '0.9rem' }}>Please wait while we load the content</div>
        </div>
      </div>

      {/* Promo Strip Skeleton */}
      <div style={{ height: '50px', background: '#e0e0e0', marginBottom: '20px' }} />

      {/* Scrolling Blocks Skeleton */}
      <div style={{ height: '80px', background: '#f0f0f0', marginBottom: '40px' }} />

      {/* Product Grid Skeleton */}
      <div style={{ padding: '20px' }}>
        <div style={{ height: '30px', background: '#e0e0e0', marginBottom: '20px', borderRadius: '4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '300px', background: '#f0f0f0', borderRadius: '8px' }} />
          ))}
        </div>
      </div>

      {/* Video Gallery Skeleton */}
      <div style={{ padding: '20px' }}>
        <div style={{ height: '30px', background: '#e0e0e0', marginBottom: '20px', borderRadius: '4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '200px', background: '#f0f0f0', borderRadius: '8px' }} />
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div style={{ height: '200px', background: '#e0e0e0', marginTop: '40px' }} />
    </>
  );
}
