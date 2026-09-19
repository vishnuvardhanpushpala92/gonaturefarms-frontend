import React from 'react';

export default function HomePageSkeleton() {
  return (
    <>
      {/* Hero Slider Skeleton - Fixed height to prevent layout shift */}
      <div style={{ height: '400px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '0.9rem' }}>Please wait while we load the content</div>
        </div>
      </div>

      {/* Promo Strip Skeleton - Fixed height */}
      <div style={{ height: '50px', background: '#e0e0e0', marginBottom: '20px', minHeight: '40px' }} />

      {/* Scrolling Blocks Skeleton - Fixed height */}
      <div style={{ height: '80px', background: '#f0f0f0', marginBottom: '40px', minHeight: '60px' }} />

      {/* Product Grid Skeleton - Consistent spacing */}
      <div style={{ padding: '20px' }}>
        <div style={{ height: '30px', background: '#e0e0e0', marginBottom: '20px', borderRadius: '4px', width: '200px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '300px', background: '#f0f0f0', borderRadius: '8px', minHeight: '250px' }} />
          ))}
        </div>
      </div>

      {/* Video Gallery Skeleton - Consistent spacing */}
      <div style={{ padding: '20px' }}>
        <div style={{ height: '30px', background: '#e0e0e0', marginBottom: '20px', borderRadius: '4px', width: '150px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '200px', background: '#f0f0f0', borderRadius: '8px', minHeight: '150px' }} />
          ))}
        </div>
      </div>

      {/* Footer Skeleton - Fixed height */}
      <div style={{ height: '200px', background: '#e0e0e0', marginTop: '40px', minHeight: '150px' }} />
    </>
  );
}
