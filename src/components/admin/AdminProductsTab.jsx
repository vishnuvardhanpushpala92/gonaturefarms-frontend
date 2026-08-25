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

  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, description: p.description || '', price: p.price, mrp: p.mrp, gst: p.gst,
      hsn: p.hsn || '', cat: p.cat || '', imgUrl: p.imgUrl || '', status: p.status
    });
    // Load ONLY the clean list from the DB
    setVariants(p.variants || []);
  };

  const resetForm = () => { 
    setEditing(null); setForm(EMPTY); setVariants([]);
  };

  // ✅ HARD BLOCK: Prevent adding a duplicate variant
  const addVariant = () => {
    // Check if any existing variant has an empty name (user is in the middle of typing)
    if (variants.some(v => !v.variantName || v.variantName.trim() === '')) {
      showToast("Please fill the previous variant name first!");
      return;
    }
    setVariants([...variants, { variantName: '', price: '', mrp: '', stock: 100 }]);
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
      // ✅ STRICT FILTER: Remove duplicate names & empty rows before sending
      const seen = new Set();
      const filteredVariants = variants
        .filter(v => v.variantName && v.variantName.trim() !== '')
        .filter(v => {
          if (seen.has(v.variantName.trim())) return false; // Duplicate found, skip!
          seen.add(v.variantName.trim());
          return true;
        });

      const payload = {
        ...form,
        variants: filteredVariants.map(v => ({
          variantName: v.variantName.trim(),
          price: v.price ? parseFloat(v.price) : (v.mrp ? parseFloat(v.mrp) : 0),
          mrp: v.mrp ? parseFloat(v.mrp) : (v.price ? parseFloat(v.price) : 0),
          stock: v.stock ? parseInt(v.stock) : 100
        }))
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
          {/* ... (Keep your existing Name, Category, Description, Price, MRP, GST, HSN, Image, Status fields exactly as they are) ... */}
          
          {/* Variants Section (100% Admin Controlled) */}
          <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Product Variants (Only unique names allowed)</h4>
              <button type="button" className="btn btn-secondary" onClick={addVariant} style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                + Add Variant
              </button>
            </div>
            
            {variants.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '.8rem', margin: 0 }}>No variants added. Click "+ Add Variant".</p>
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
                        placeholder="100"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }}
                      />
                    </div>
                    <button type="button" className="btn-d" onClick={() => removeVariant(index)} style={{ padding: '6px 12px', fontSize: '.8rem' }}>✕</button>
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

      {/* ... (Keep your Categories section and Product table exactly as they are) ... */}
    </div>
  );
}