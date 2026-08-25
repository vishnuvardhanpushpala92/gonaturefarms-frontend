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
    const { data } = await api.post('/admin/slides', slideForm);
    showToast(data.message);
    if (data.success) { setSlideForm({ imageUrl: '', caption: '', subText: '' }); reload(); }
  };
  const removeSlide = async (id) => { await api.delete(`/admin/slides/${id}`); reload(); };

  const addFaq = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/admin/faqs', faqForm);
    showToast(data.message);
    if (data.success) { setFaqForm({ question: '', answer: '' }); reload(); }
  };
  const removeFaq = async (id) => { await api.delete(`/admin/faqs/${id}`); reload(); };

  const addZone = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/admin/zones', zoneForm);
    showToast(data.message);
    if (data.success) { setZoneForm({ pincode: '', area: '', city: '', state: '', charge: '' }); reload(); }
  };
  const removeZone = async (id) => { await api.delete(`/admin/zones/${id}`); reload(); };

  const addBlock = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/admin/scroll-content', blockForm);
    showToast(data.message);
    if (data.success) { setBlockForm({ title: '', content: '', icon: '', style: 'info' }); reload(); }
  };
  const removeBlock = async (id) => { await api.delete(`/admin/scroll-content/${id}`); reload(); };

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
            <div className="fg"><label>Title</label><input required value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} /></div>
            <div className="fg"><label>Style</label>
              <select value={blockForm.style} onChange={(e) => setBlockForm({ ...blockForm, style: e.target.value })}>
                <option value="info">Info</option><option value="promo">Promo</option>
                <option value="notice">Notice</option><option value="earth">Earth</option>
              </select>
            </div>
          </div>
          <div className="fg"><label>Content</label><textarea required value={blockForm.content} onChange={(e) => setBlockForm({ ...blockForm, content: e.target.value })} /></div>
          <button className="btn btn-primary">Add Block</button>
        </form>
        <table className="data-table" style={{ marginTop: 12 }}>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id}><td>{b.title}</td><td><button className="btn-d" onClick={() => removeBlock(b.id)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
