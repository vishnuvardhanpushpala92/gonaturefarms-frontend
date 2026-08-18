import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = { name: '', description: '', price: '', mrp: '', gst: '', hsn: '', cat: '', imgUrl: '', status: 'current' };

export default function AdminProductsTab() {
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [newCat, setNewCat] = useState('');
  const [variants, setVariants] = useState([]);

  const load = () => {
    api.get('/products').then(({ data }) => setProducts(data.products || []));
    api.get('/products/categories').then(({ data }) => setCategories(data.categories || []));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, description: p.description || '', price: p.price, mrp: p.mrp, gst: p.gst,
      hsn: p.hsn || '', cat: p.cat || '', imgUrl: p.imgUrl || '', status: p.status
    });
    setVariants(p.variants || []);
  };

  const resetForm = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setVariants([]);
  };

  const addVariant = () => {
    setVariants([...variants, { variantName: '', price: '', stock: '' }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        variants: variants.filter(v => v.variantName && v.price)
      };
      const data = editing
        ? (await api.put(`/products/${editing}`, payload)).data
        : (await api.post('/products', payload)).data;
      showToast(data.message);
      if (data.success) { resetForm(); load(); }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    const { data } = await api.delete(`/products/${p.id}`);
    showToast(data.message);
    load();
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const { data } = await api.post('/admin/categories', { name: newCat.trim() });
    showToast(data.message);
    setNewCat('');
    load();
  };

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>{editing ? 'Edit Product' : 'Add Product'}</h3>
        <form onSubmit={save}>
          <div className="frow">
            <div className="fg"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fg"><label>Category</label>
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="fg"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="frow">
            <div className="fg"><label>Price</label><input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="fg"><label>MRP</label><input type="number" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></div>
          </div>
          <div className="frow">
            <div className="fg"><label>GST %</label><input type="number" step="0.01" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} /></div>
            <div className="fg"><label>HSN Code</label><input value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} /></div>
          </div>
          <div className="fg"><label>Image URL</label><input value={form.imgUrl} onChange={(e) => setForm({ ...form, imgUrl: e.target.value })} /></div>
          <div className="fg"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="current">Current</option>
              <option value="future">Coming Soon</option>
            </select>
          </div>
          
          {/* Variants Section */}
          <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Product Variants</h4>
              <button type="button" className="btn btn-secondary" onClick={addVariant} style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                + Add Variant
              </button>
            </div>
            
            {variants.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '.8rem', margin: 0 }}>No variants added</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {variants.map((variant, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Variant Name/Size</label>
                      <input
                        type="text"
                        placeholder="e.g., 500gms, 1 Litre, 2 pieces"
                        value={variant.variantName}
                        onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="₹"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Stock</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-d"
                      onClick={() => removeVariant(index)}
                      style={{ padding: '6px 12px', fontSize: '.8rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary">{editing ? 'Update' : 'Add'} Product</button>
            {editing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Categories</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }} />
          <button className="btn btn-secondary" onClick={addCategory}>Add</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <span key={c} className="pcard-cat" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {c}
              <button
                onClick={async () => { await api.delete(`/admin/categories/${encodeURIComponent(c)}`); load(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >✕</button>
            </span>
          ))}
        </div>
      </div>

      <table className="data-table">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.cat}</td><td>₹{p.price}</td><td>{p.status}</td>
              <td>
                <button className="btn-e" onClick={() => startEdit(p)}>Edit</button>{' '}
                <button className="btn-d" onClick={() => remove(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
