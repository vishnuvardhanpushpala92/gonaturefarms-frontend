import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function AdminHomepageEditorTab() {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [activeSection, setActiveSection] = useState('hero'); // hero, products, layout

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/homepage-layout/latest');
      if (data.success && data.layout) {
        setLayout(data.layout);
      }
    } catch (err) {
      console.error('Failed to load layout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setLayout(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (publish = false) => {
    try {
      setSaving(true);
      const payload = {
        ...layout,
        publish,
        saveAsDraft: !publish
      };
      const { data } = await api.post('/homepage-layout', payload);
      if (data.success) {
        alert(data.message);
        loadLayout();
      }
    } catch (err) {
      alert('Failed to save: ' + (err?.response?.data?.message || err?.message));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to default layout? This cannot be undone.')) return;
    try {
      setSaving(true);
      const { data } = await api.post('/homepage-layout/reset');
      if (data.success) {
        alert(data.message);
        loadLayout();
      }
    } catch (err) {
      alert('Failed to reset: ' + (err?.response?.data?.message || err?.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!layout) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No layout found</div>;
  }

  const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Homepage Editor</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            <button
              onClick={() => setActiveSection('hero')}
              style={{
                padding: '8px 16px',
                background: activeSection === 'hero' ? '#2d5a27' : '#f0f0f0',
                color: activeSection === 'hero' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
            >
              Hero Slider
            </button>
            <button
              onClick={() => setActiveSection('products')}
              style={{
                padding: '8px 16px',
                background: activeSection === 'products' ? '#2d5a27' : '#f0f0f0',
                color: activeSection === 'products' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
            >
              Product Display
            </button>
            <button
              onClick={() => setActiveSection('layout')}
              style={{
                padding: '8px 16px',
                background: activeSection === 'layout' ? '#2d5a27' : '#f0f0f0',
                color: activeSection === 'layout' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Layout
            </button>
          </div>

          {activeSection === 'hero' && (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Hero Slider Settings</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Desktop Height (px)
                </label>
                <input
                  type="number"
                  value={layout.heroHeightDesktop}
                  onChange={(e) => handleChange('heroHeightDesktop', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Tablet Height (px)
                </label>
                <input
                  type="number"
                  value={layout.heroHeightTablet}
                  onChange={(e) => handleChange('heroHeightTablet', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Mobile Height (px)
                </label>
                <input
                  type="number"
                  value={layout.heroHeightMobile}
                  onChange={(e) => handleChange('heroHeightMobile', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Image Fit
                </label>
                <select
                  value={layout.heroImageFit}
                  onChange={(e) => handleChange('heroImageFit', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="contain">Contain (show full image)</option>
                  <option value="cover">Cover (fill container)</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Image Position
                </label>
                <select
                  value={layout.heroImagePosition}
                  onChange={(e) => handleChange('heroImagePosition', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Aspect Ratio
                </label>
                <select
                  value={layout.heroAspectRatio}
                  onChange={(e) => handleChange('heroAspectRatio', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="16/9">16:9 (Standard)</option>
                  <option value="16/7">16:7 (Wide)</option>
                  <option value="4/3">4:3 (Traditional)</option>
                  <option value="1/1">1:1 (Square)</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Background Color
                </label>
                <input
                  type="color"
                  value={layout.heroBackgroundColor}
                  onChange={(e) => handleChange('heroBackgroundColor', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '40px' }}
                />
              </div>
            </div>
          )}

          {activeSection === 'products' && (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Product Display Settings</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Card Style
                </label>
                <select
                  value={layout.productCardStyle}
                  onChange={(e) => handleChange('productCardStyle', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="standard">Standard</option>
                  <option value="rounded">Rounded</option>
                  <option value="bordered">Bordered</option>
                  <option value="shadow">Shadow</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Image Aspect Ratio
                </label>
                <select
                  value={layout.productImageAspectRatio}
                  onChange={(e) => handleChange('productImageAspectRatio', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="1/1">1:1 (Square)</option>
                  <option value="4/3">4:3 (Landscape)</option>
                  <option value="16/9">16:9 (Widescreen)</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Image Fit
                </label>
                <select
                  value={layout.productImageFit}
                  onChange={(e) => handleChange('productImageFit', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="cover">Cover (fill container)</option>
                  <option value="contain">Contain (show full image)</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Products per Row (Desktop)
                </label>
                <input
                  type="number"
                  value={layout.productsPerRowDesktop}
                  onChange={(e) => handleChange('productsPerRowDesktop', parseInt(e.target.value))}
                  min="1"
                  max="6"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Products per Row (Tablet)
                </label>
                <input
                  type="number"
                  value={layout.productsPerRowTablet}
                  onChange={(e) => handleChange('productsPerRowTablet', parseInt(e.target.value))}
                  min="1"
                  max="4"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Products per Row (Mobile)
                </label>
                <input
                  type="number"
                  value={layout.productsPerRowMobile}
                  onChange={(e) => handleChange('productsPerRowMobile', parseInt(e.target.value))}
                  min="1"
                  max="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Card Spacing (px)
                </label>
                <input
                  type="number"
                  value={layout.productCardSpacing}
                  onChange={(e) => handleChange('productCardSpacing', parseInt(e.target.value))}
                  min="0"
                  max="48"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
          )}

          {activeSection === 'layout' && (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Layout Settings</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Section Spacing (px)
                </label>
                <input
                  type="number"
                  value={layout.sectionSpacing}
                  onChange={(e) => handleChange('sectionSpacing', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Section Width
                </label>
                <select
                  value={layout.sectionWidth}
                  onChange={(e) => handleChange('sectionWidth', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="full">Full Width</option>
                  <option value="contained">Contained</option>
                  <option value="narrow">Narrow</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={layout.showHero}
                    onChange={(e) => handleChange('showHero', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Hero Slider
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={layout.showProducts}
                    onChange={(e) => handleChange('showProducts', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Products
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={layout.showTestimonials}
                    onChange={(e) => handleChange('showTestimonials', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Testimonials
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={layout.showVideos}
                    onChange={(e) => handleChange('showVideos', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Videos
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={layout.showFeatures}
                    onChange={(e) => handleChange('showFeatures', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show Features Bar
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Product Section Order
                </label>
                <input
                  type="number"
                  value={layout.productSectionOrder}
                  onChange={(e) => handleChange('productSectionOrder', parseInt(e.target.value))}
                  min="1"
                  max="10"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ width: previewWidth, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ background: '#f0f0f0', padding: '10px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPreviewMode('desktop')}
              style={{
                padding: '4px 8px',
                background: previewMode === 'desktop' ? '#2d5a27' : '#fff',
                color: previewMode === 'desktop' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              style={{
                padding: '4px 8px',
                background: previewMode === 'tablet' ? '#2d5a27' : '#fff',
                color: previewMode === 'tablet' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Tablet
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              style={{
                padding: '4px 8px',
                background: previewMode === 'mobile' ? '#2d5a27' : '#fff',
                color: previewMode === 'mobile' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Mobile
            </button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>Live Preview</p>
            <p style={{ fontSize: '12px' }}>Preview will show changes in real-time</p>
            <div style={{
              height: `${previewMode === 'desktop' ? layout.heroHeightDesktop : previewMode === 'tablet' ? layout.heroHeightTablet : layout.heroHeightMobile}px`,
              background: layout.heroBackgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Hero Slider Preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
