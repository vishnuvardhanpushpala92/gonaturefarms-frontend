import React from 'react';
import { useState } from 'react';
import api from '../../api/client';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminContentTab() {
  const { slides, faqs, zones, blocks, reload } = useSite();
  const showToast = useToast();

  const [slideForm, setSlideForm] = useState({ desktopImage: '', tabletImage: '', mobileImage: '', caption: '', subText: '' });
  const [desktopFile, setDesktopFile] = useState(null);
  const [tabletFile, setTabletFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [zoneForm, setZoneForm] = useState({ pincode: '', area: '', city: '', state: '', charge: '' });
  const [blockForm, setBlockForm] = useState({ title: '', content: '', icon: '', customIcon: '', style: 'info', backgroundColor: '#f8fafb', textColor: '#2d5a27' });
  const [editingBlock, setEditingBlock] = useState(null);
  const [adminFaqs, setAdminFaqs] = useState([]);
  const [adminBlocks, setAdminBlocks] = useState([]);

  // Load admin FAQs (including pending)
  const loadAdminFaqs = async () => {
    try {
      const { data } = await api.get('/admin/faqs/admin-list');
      setAdminFaqs(data.faqs || []);
    } catch (err) {
      console.error('Failed to load admin FAQs:', err);
    }
  };

  // Load admin blocks (including pending)
  const loadAdminBlocks = async () => {
    try {
      const { data } = await api.get('/admin/scroll-content/admin-list');
      setAdminBlocks(data.blocks || []);
    } catch (err) {
      console.error('Failed to load admin blocks:', err);
    }
  };

  React.useEffect(() => {
    loadAdminFaqs();
    loadAdminBlocks();
  }, []);

  const addSlide = async (e) => {
    e.preventDefault();
    
    // Check if at least one image is provided
    if (!slideForm.desktopImage && !slideForm.tabletImage && !slideForm.mobileImage && !desktopFile && !tabletFile && !mobileFile) {
      showToast('Please provide at least one image (Desktop, Tablet, or Mobile)');
      return;
    }

    setUploadingSlide(true);
    try {
      let finalDesktopImage = slideForm.desktopImage;
      let finalTabletImage = slideForm.tabletImage;
      let finalMobileImage = slideForm.mobileImage;
      
      // Upload desktop file if provided
      if (desktopFile) {
        const formData = new FormData();
        formData.append('file', desktopFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalDesktopImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload desktop image');
          return;
        }
      }
      
      // Upload tablet file if provided
      if (tabletFile) {
        const formData = new FormData();
        formData.append('file', tabletFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalTabletImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload tablet image');
          return;
        }
      }
      
      // Upload mobile file if provided
      if (mobileFile) {
        const formData = new FormData();
        formData.append('file', mobileFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalMobileImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload mobile image');
          return;
        }
      }
      
      // Send imageUrl for backward compatibility with backend
      const payload = {
        imageUrl: finalDesktopImage || finalTabletImage || finalMobileImage,
        desktopImage: finalDesktopImage,
        tabletImage: finalTabletImage,
        mobileImage: finalMobileImage,
        caption: slideForm.caption,
        subText: slideForm.subText
      };
      
      const { data } = await api.post('/admin/slides', payload);
      showToast(data.message || 'Slide added successfully');
      if (data.success) { 
        setSlideForm({ desktopImage: '', tabletImage: '', mobileImage: '', caption: '', subText: '' }); 
        setDesktopFile(null);
        setTabletFile(null);
        setMobileFile(null);
        reload(); 
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add slide');
    } finally {
      setUploadingSlide(false);
    }
  };

  const startEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      desktopImage: slide.desktopImage || slide.imageUrl || '',
      tabletImage: slide.tabletImage || '',
      mobileImage: slide.mobileImage || '',
      caption: slide.caption,
      subText: slide.subText
    });
    setDesktopFile(null);
    setTabletFile(null);
    setMobileFile(null);
  };

  const updateSlide = async (e) => {
    e.preventDefault();
    
    if (!editingSlide) return;
    
    // Check if at least one image is provided
    if (!slideForm.desktopImage && !slideForm.tabletImage && !slideForm.mobileImage && !desktopFile && !tabletFile && !mobileFile) {
      showToast('Please provide at least one image (Desktop, Tablet, or Mobile)');
      return;
    }

    setUploadingSlide(true);
    try {
      let finalDesktopImage = slideForm.desktopImage;
      let finalTabletImage = slideForm.tabletImage;
      let finalMobileImage = slideForm.mobileImage;
      
      // Upload desktop file if provided
      if (desktopFile) {
        const formData = new FormData();
        formData.append('file', desktopFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalDesktopImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload desktop image');
          return;
        }
      }
      
      // Upload tablet file if provided
      if (tabletFile) {
        const formData = new FormData();
        formData.append('file', tabletFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalTabletImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload tablet image');
          return;
        }
      }
      
      // Upload mobile file if provided
      if (mobileFile) {
        const formData = new FormData();
        formData.append('file', mobileFile);
        const { data } = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipTransform: true
        });
        if (data.success && data.url) {
          finalMobileImage = data.url;
        } else {
          showToast(data.message || 'Failed to upload mobile image');
          return;
        }
      }
      
      // Send imageUrl for backward compatibility with backend
      const payload = {
        imageUrl: finalDesktopImage || finalTabletImage || finalMobileImage,
        desktopImage: finalDesktopImage,
        tabletImage: finalTabletImage,
        mobileImage: finalMobileImage,
        caption: slideForm.caption,
        subText: slideForm.subText
      };
      
      const { data } = await api.put(`/admin/slides/${editingSlide.id}`, payload);
      showToast(data.message || 'Slide updated successfully');
      if (data.success) { 
        setEditingSlide(null);
        setSlideForm({ desktopImage: '', tabletImage: '', mobileImage: '', caption: '', subText: '' }); 
        setDesktopFile(null);
        setTabletFile(null);
        setMobileFile(null);
        reload(); 
      }
    } catch (err) {
      // Handle 404 error - slide was deleted or doesn't exist
      if (err?.response?.status === 404) {
        showToast('This slide no longer exists. It may have been deleted.');
        setEditingSlide(null);
        setSlideForm({ desktopImage: '', tabletImage: '', mobileImage: '', caption: '', subText: '' });
        setDesktopFile(null);
        setTabletFile(null);
        setMobileFile(null);
        reload();
      } else {
        showToast(err?.response?.data?.message || 'Failed to update slide');
      }
    } finally {
      setUploadingSlide(false);
    }
  };

  const cancelEditSlide = () => {
    setEditingSlide(null);
    setSlideForm({ desktopImage: '', tabletImage: '', mobileImage: '', caption: '', subText: '' });
    setDesktopFile(null);
    setTabletFile(null);
    setMobileFile(null);
  };
  const removeSlide = async (id) => {
    try {
      await api.delete(`/admin/slides/${id}`);
      showToast('Slide deleted successfully');
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete slide');
    }
  };

  const addFaq = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/faqs', faqForm);
      showToast(data.message || 'FAQ added successfully');
      if (data.success) { setFaqForm({ question: '', answer: '' }); loadAdminFaqs(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add FAQ');
    }
  };
  const removeFaq = async (id) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      showToast('FAQ deleted successfully');
      loadAdminFaqs();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete FAQ');
    }
  };

  const addZone = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/zones', zoneForm);
      showToast(data.message || 'Zone added successfully');
      if (data.success) { setZoneForm({ pincode: '', area: '', city: '', state: '', charge: '' }); reload(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add zone');
    }
  };
  const removeZone = async (id) => {
    try {
      await api.delete(`/admin/zones/${id}`);
      showToast('Zone deleted successfully');
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete zone');
    }
  };

  const addBlock = async (e) => {
    e.preventDefault();
    
    // Check if we already have 6 items
    if (adminBlocks.length >= 6) {
      showToast('Maximum 6 features allowed. Delete existing items first.');
      return;
    }
    
    // Validate form before submission
    if (!blockForm.title?.trim()) {
      showToast('Please enter a title for the feature');
      return;
    }
    
    // Set default icon if none selected
    const iconValue = blockForm.icon === 'custom' ? (blockForm.customIcon || '🌿') : (blockForm.icon || '🌿');
    
    try {
      const payload = {
        title: blockForm.title,
        content: blockForm.title, // For features, content is same as title
        icon: iconValue,
        style: 'info',
        backgroundColor: blockForm.backgroundColor,
        textColor: blockForm.textColor
      };
      
      const { data } = await api.post('/admin/scroll-content', payload);
      showToast(data.message || 'Feature added successfully');
      if (data.success) { 
        setBlockForm({ title: '', content: '', icon: '', customIcon: '', style: 'info', backgroundColor: '#f8fafb', textColor: '#2d5a27' }); 
        loadAdminBlocks();
        reload(); 
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Failed to add feature');
    }
  };

  const editBlock = async (e) => {
    e.preventDefault();
    
    if (!editingBlock) return;
    
    // Validate form before submission
    if (!blockForm.title?.trim()) {
      showToast('Please enter a title for the feature');
      return;
    }
    
    // Set default icon if none selected
    const iconValue = blockForm.icon === 'custom' ? (blockForm.customIcon || '🌿') : (blockForm.icon || '🌿');
    
    try {
      const payload = {
        title: blockForm.title,
        content: blockForm.title,
        icon: iconValue,
        style: 'info',
        backgroundColor: blockForm.backgroundColor,
        textColor: blockForm.textColor
      };
      
      const { data } = await api.put(`/admin/scroll-content/${editingBlock.id}`, payload);
      showToast(data.message || 'Feature updated successfully');
      if (data.success) { 
        setBlockForm({ title: '', content: '', icon: '', customIcon: '', style: 'info', backgroundColor: '#f8fafb', textColor: '#2d5a27' });
        setEditingBlock(null);
        loadAdminBlocks();
        reload();
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Failed to update feature');
    }
  };

  const startEdit = (block) => {
    setEditingBlock(block);
    setBlockForm({
      title: block.title,
      content: block.content,
      icon: block.icon,
      customIcon: '',
      style: block.style,
      backgroundColor: block.backgroundColor || '#f8fafb',
      textColor: block.textColor || '#2d5a27'
    });
  };

  const cancelEdit = () => {
    setEditingBlock(null);
    setBlockForm({ title: '', content: '', icon: '', customIcon: '', style: 'info', backgroundColor: '#f8fafb', textColor: '#2d5a27' });
  };
  const removeBlock = async (id) => {
    if (!window.confirm('Delete this feature?')) return;
    try {
      const { data } = await api.delete(`/admin/scroll-content/${id}`);
      showToast(data.message || 'Feature deleted successfully');
      loadAdminBlocks();
      reload();
    } catch (err) {
      console.error('Delete block error:', err);
      showToast(err?.response?.data?.message || 'Failed to delete feature');
    }
  };

  const moveBlock = async (id, direction) => {
    // This would require backend support for reordering, for now just show a message
    showToast('Reordering will be implemented with backend support');
  };

  return (
    <div>
      <div className="admin-card">
        <h3>Hero Slides</h3>
        <form onSubmit={editingSlide ? updateSlide : addSlide} style={{ marginTop: 10 }}>
          <div className="fg">
            <label>Desktop Hero Image (1920 × 700 recommended)</label>
            <input 
              placeholder="https://example.com/desktop-image.jpg" 
              value={slideForm.desktopImage} 
              onChange={(e) => setSlideForm({ ...slideForm, desktopImage: e.target.value })} 
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setDesktopFile(e.target.files[0]);
                }
              }}
              style={{ marginTop: 4 }}
            />
            {desktopFile && (
              <small style={{ color: 'var(--muted)', marginTop: 4 }}>
                Selected: {desktopFile.name}
              </small>
            )}
          </div>
          
          <div className="fg">
            <label>Tablet Hero Image (1200 × 800 recommended)</label>
            <input 
              placeholder="https://example.com/tablet-image.jpg" 
              value={slideForm.tabletImage} 
              onChange={(e) => setSlideForm({ ...slideForm, tabletImage: e.target.value })} 
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setTabletFile(e.target.files[0]);
                }
              }}
              style={{ marginTop: 4 }}
            />
            {tabletFile && (
              <small style={{ color: 'var(--muted)', marginTop: 4 }}>
                Selected: {tabletFile.name}
              </small>
            )}
          </div>
          
          <div className="fg">
            <label>Mobile Hero Image (750 × 1000 recommended)</label>
            <input 
              placeholder="https://example.com/mobile-image.jpg" 
              value={slideForm.mobileImage} 
              onChange={(e) => setSlideForm({ ...slideForm, mobileImage: e.target.value })} 
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setMobileFile(e.target.files[0]);
                }
              }}
              style={{ marginTop: 4 }}
            />
            {mobileFile && (
              <small style={{ color: 'var(--muted)', marginTop: 4 }}>
                Selected: {mobileFile.name}
              </small>
            )}
          </div>
          
          <div className="fg"><label>Caption (Optional)</label><input value={slideForm.caption} onChange={(e) => setSlideForm({ ...slideForm, caption: e.target.value })} placeholder="Optional caption text" /></div>
          <div className="fg"><label>Sub Text (Optional)</label><input value={slideForm.subText} onChange={(e) => setSlideForm({ ...slideForm, subText: e.target.value })} placeholder="Optional sub text" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={uploadingSlide}>
              {uploadingSlide ? (editingSlide ? 'Updating Slide...' : 'Adding Slide...') : (editingSlide ? 'Update Slide' : 'Add Slide')}
            </button>
            {editingSlide && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditSlide}>Cancel</button>
            )}
          </div>
        </form>
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Image</th><th>Caption</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s.id}>
                <td>
                  {(s.desktopImage || s.imageUrl) && (
                    <img 
                      src={s.desktopImage || s.imageUrl} 
                      alt={s.caption} 
                      style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </td>
                <td>{s.caption || '-'}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: 8, fontSize: '0.8rem' }} onClick={() => startEditSlide(s)}>Edit</button>
                  <button className="btn-d" onClick={() => removeSlide(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3>FAQs</h3>
        <form onSubmit={addFaq} style={{ marginTop: 10 }}>
          <div className="fg"><label>Question</label><input required value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
          <div className="fg"><label>Answer</label><textarea required value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} /></div>
          <button className="btn btn-primary">Add FAQ</button>
        </form>
        <table className="data-table" style={{ marginTop: 12 }}>
          <tbody>
            {adminFaqs.map((f) => (
              <tr key={f.id}>
                <td>
                  {f.question}
                  {f.pending && <span style={{ marginLeft: 8, padding: '2px 6px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: '0.7rem' }}>Pending</span>}
                </td>
                <td><button className="btn-d" onClick={() => removeFaq(f.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3>Delivery Zones</h3>
        <form onSubmit={addZone} style={{ marginTop: 10 }}>
          <div className="frow">
            <div className="fg"><label>Pincode</label><input required value={zoneForm.pincode} onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value })} /></div>
            <div className="fg"><label>Area</label><input value={zoneForm.area} onChange={(e) => setZoneForm({ ...zoneForm, area: e.target.value })} /></div>
          </div>
          <div className="frow">
            <div className="fg"><label>City</label><input value={zoneForm.city} onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })} /></div>
            <div className="fg"><label>Delivery Charge</label><input type="number" value={zoneForm.charge} onChange={(e) => setZoneForm({ ...zoneForm, charge: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary">Save Zone</button>
        </form>
        <table className="data-table" style={{ marginTop: 12 }}>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}><td>{z.pincode} — {z.area}, {z.city}</td><td>₹{z.charge}</td><td><button className="btn-d" onClick={() => removeZone(z.id)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3>Features Bar (Exactly 6 Items)</h3>
        <div style={{ marginBottom: 12, padding: 8, background: '#f0fdf4', borderRadius: 6, fontSize: '0.85rem', color: '#166534' }}>
          This bar will display exactly 6 items horizontally on the homepage. Add items below.
        </div>
        <form onSubmit={editingBlock ? editBlock : addBlock} style={{ marginTop: 10 }}>
          <div className="frow">
            <div className="fg"><label>Title</label><input required value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} placeholder="Enter feature title" /></div>
            <div className="fg"><label>Icon</label>
              <select value={blockForm.icon} onChange={(e) => setBlockForm({ ...blockForm, icon: e.target.value })}>
                <option value="">Select icon...</option>
                <option value="🌿">🌿 Nature</option>
                <option value="🥬">🥬 Fresh</option>
                <option value="🐄">🐄 Cow</option>
                <option value="🏡">🏡 Home</option>
                <option value="❤️">❤️ Trusted</option>
                <option value="🚫">🚫 No Preservatives</option>
                <option value="🚚">🚚 Direct Delivery</option>
                <option value="✅">✅ Organic</option>
                <option value="💚">💚 Healthy</option>
                <option value="🌱">🌱 Natural</option>
                <option value="custom">Custom URL...</option>
              </select>
            </div>
          </div>
          {blockForm.icon === 'custom' && (
            <div className="fg"><label>Custom Icon URL</label><input value={blockForm.customIcon || ''} onChange={(e) => setBlockForm({ ...blockForm, customIcon: e.target.value })} placeholder="Enter icon URL" /></div>
          )}
          <div className="frow">
            <div className="fg">
              <label>Background Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={blockForm.backgroundColor} 
                  onChange={(e) => setBlockForm({ ...blockForm, backgroundColor: e.target.value })}
                  style={{ width: 50, height: 38, cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={blockForm.backgroundColor} 
                  onChange={(e) => setBlockForm({ ...blockForm, backgroundColor: e.target.value })}
                  placeholder="#f8fafb"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="fg">
              <label>Text Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={blockForm.textColor} 
                  onChange={(e) => setBlockForm({ ...blockForm, textColor: e.target.value })}
                  style={{ width: 50, height: 38, cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={blockForm.textColor} 
                  onChange={(e) => setBlockForm({ ...blockForm, textColor: e.target.value })}
                  placeholder="#2d5a27"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={adminBlocks.length >= 6 && !editingBlock}>
              {editingBlock ? 'Update Feature' : (adminBlocks.length >= 6 ? 'Maximum 6 items reached' : 'Add Feature')}
            </button>
            {editingBlock && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
        {adminBlocks.length > 0 && (
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Icon</th><th>Title</th><th>Background</th><th>Action</th></tr>
            </thead>
            <tbody>
              {adminBlocks.map((b, index) => (
                <tr key={b.id}>
                  <td style={{ fontSize: '1.2rem' }}>{b.icon}</td>
                  <td>{b.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: b.backgroundColor || '#f8fafb', border: '1px solid #ddd' }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{b.backgroundColor || '#f8fafb'}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ marginRight: 8, fontSize: '0.8rem' }} onClick={() => startEdit(b)}>Edit</button>
                    <button className="btn-d" onClick={() => removeBlock(b.id)}>Delete</button>
                    {index > 0 && <button className="btn btn-secondary" style={{ marginLeft: 8, fontSize: '0.8rem' }} onClick={() => moveBlock(b.id, -1)}>↑</button>}
                    {index < adminBlocks.length - 1 && <button className="btn btn-secondary" style={{ marginLeft: 8, fontSize: '0.8rem' }} onClick={() => moveBlock(b.id, 1)}>↓</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {adminBlocks.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>No features added yet. Add up to 6 items.</p>
        )}
      </div>
    </div>
  );
}
