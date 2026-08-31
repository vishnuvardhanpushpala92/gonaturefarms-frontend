import React from 'react';
import { useState } from 'react';
import api from '../../api/client';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminContentTab() {
  const { slides, faqs, zones, blocks, reload } = useSite();
  const showToast = useToast();

  const [slideForm, setSlideForm] = useState({ imageUrl: '', caption: '', subText: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [zoneForm, setZoneForm] = useState({ pincode: '', area: '', city: '', state: '', charge: '' });
  const [blockForm, setBlockForm] = useState({ title: '', content: '', icon: '', style: 'info' });

  const addSlide = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/slides', slideForm);
      showToast(data.message || 'Slide added successfully');
      if (data.success) { setSlideForm({ imageUrl: '', caption: '', subText: '' }); reload(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add slide');
    }
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
      if (data.success) { setFaqForm({ question: '', answer: '' }); reload(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add FAQ');
    }
  };
  const removeFaq = async (id) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      showToast('FAQ deleted successfully');
      reload();
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
    // Validate form before submission
    if (!blockForm.title?.trim()) {
      showToast('Please enter a title for the block');
      return;
    }
    if (!blockForm.content?.trim()) {
      showToast('Please enter content for the block');
      return;
    }
    if (!blockForm.style) {
      showToast('Please select a style for the block');
      return;
    }
    
    try {
      const { data } = await api.post('/admin/scroll-content', blockForm);
      showToast(data.message || 'Scrolling notice block added successfully');
      if (data.success) { 
        setBlockForm({ title: '', content: '', icon: '', style: 'info' }); 
        reload(); 
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Failed to add block');
    }
  };
  const removeBlock = async (id) => {
    if (!window.confirm('Delete this scrolling notice block?')) return;
    try {
      const { data } = await api.delete(`/admin/scroll-content/${id}`);
      showToast(data.message || 'Block deleted successfully');
      reload();
    } catch (err) {
      console.error('Delete block error:', err);
      showToast(err?.response?.data?.message || 'Failed to delete block');
    }
  };

  return (
    <div>
      <div className="admin-card">
        <h3>Hero Slides</h3>
        <form onSubmit={addSlide} style={{ marginTop: 10 }}>
          <div className="frow">
            <div className="fg"><label>Image URL</label><input required value={slideForm.imageUrl} onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })} /></div>
            <div className="fg"><label>Caption</label><input value={slideForm.caption} onChange={(e) => setSlideForm({ ...slideForm, caption: e.target.value })} /></div>
          </div>
          <div className="fg"><label>Sub Text</label><input value={slideForm.subText} onChange={(e) => setSlideForm({ ...slideForm, subText: e.target.value })} /></div>
          <button className="btn btn-primary">Add Slide</button>
        </form>
        <table className="data-table" style={{ marginTop: 12 }}>
          <tbody>
            {slides.map((s) => (
              <tr key={s.id}><td>{s.caption}</td><td><button className="btn-d" onClick={() => removeSlide(s.id)}>Delete</button></td></tr>
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
            {faqs.map((f) => (
              <tr key={f.id}><td>{f.question}</td><td><button className="btn-d" onClick={() => removeFaq(f.id)}>Delete</button></td></tr>
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
        <h3>Scrolling Notice Blocks</h3>
        <form onSubmit={addBlock} style={{ marginTop: 10 }}>
          <div className="frow">
            <div className="fg"><label>Title</label><input required value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} placeholder="Enter block title" /></div>
            <div className="fg"><label>Style</label>
              <select value={blockForm.style} onChange={(e) => setBlockForm({ ...blockForm, style: e.target.value })}>
                <option value="info">Info</option><option value="promo">Promo</option><option value="notice">Notice</option><option value="earth">Earth</option>
              </select>
            </div>
          </div>
          <div className="fg"><label>Content</label><textarea required value={blockForm.content} onChange={(e) => setBlockForm({ ...blockForm, content: e.target.value })} placeholder="Enter scrolling notice content" /></div>
          <button className="btn btn-primary">Add Block</button>
        </form>
        {blocks.length > 0 && (
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Title</th><th>Style</th><th>Content</th><th>Action</th></tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.style}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.content}</td>
                  <td><button className="btn-d" onClick={() => removeBlock(b.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {blocks.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>No scrolling notice blocks added yet.</p>
        )}
      </div>
    </div>
  );
}
