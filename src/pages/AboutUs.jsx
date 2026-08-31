import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import FloatingCart from '../components/FloatingCart.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModalNew.jsx';

export default function AboutUs() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    loadAboutUsContent();
  }, []);

  const loadAboutUsContent = async () => {
    try {
      const { data } = await api.get('/site-content?slug=about-us');
      setContent(data.content || null);
    } catch (err) {
      console.error('Failed to load About Us content:', err);
      // Set default content to prevent null errors
      setContent({
        title: 'About Us',
        description: '',
        imageUrl: '',
        personName: '',
        personRole: '',
        personImageUrl: ''
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Default content if nothing is set
  const title = content?.title || 'About Us';
  const description = content?.description || '';
  const imageUrl = content?.imageUrl || '';
  const personName = content?.personName || '';
  const personRole = content?.personRole || '';
  const personImageUrl = content?.personImageUrl || '';
  const optionalLink = content?.optionalLink || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onOpenSupport={() => setSupportOpen(true)} />
      
      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '30px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--p)', 
              cursor: 'pointer', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--p)', marginBottom: '16px' }}>{title}</h1>
        </div>

        {imageUrl && (
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <img 
              src={imageUrl} 
              alt="About Us" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            {optionalLink && (
              <div style={{ marginTop: '16px' }}>
                <a 
                  href={optionalLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: 'var(--p)', 
                    textDecoration: 'underline',
                    fontSize: '1rem'
                  }}
                >
                  Learn More
                </a>
              </div>
            )}
          </div>
        )}

        {description && (
          <div style={{ 
            marginBottom: '40px', 
            lineHeight: '1.8', 
            fontSize: '1.1rem',
            color: '#333',
            whiteSpace: 'pre-wrap'
          }}>
            {description}
          </div>
        )}

        {(personName || personImageUrl) && (
          <div style={{ 
            marginTop: '60px', 
            padding: '40px', 
            background: '#f9fafb', 
            borderRadius: '12px',
            display: 'flex',
            gap: '30px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {personImageUrl && (
              <div style={{ flex: '0 0 auto' }}>
                <img 
                  src={personImageUrl} 
                  alt={personName || 'Team Member'} 
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    objectFit: 'cover', 
                    borderRadius: '50%',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: '250px' }}>
              {personName && (
                <h3 style={{ fontSize: '1.8rem', color: 'var(--p)', marginBottom: '8px' }}>
                  {personName}
                </h3>
              )}
              {personRole && (
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '16px' }}>
                  {personRole}
                </p>
              )}
            </div>
          </div>
        )}

        {!description && !imageUrl && !personName && !personImageUrl && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            background: '#f9fafb', 
            borderRadius: '12px',
            color: '#666'
          }}>
            <p>About Us content will be displayed here. Please contact the administrator to add content.</p>
          </div>
        )}
      </main>

      <Footer onOpenSupport={() => setSupportOpen(true)} />
      <FloatingCart onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
