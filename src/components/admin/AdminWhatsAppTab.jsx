import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const REMINDER_TYPES = ['Payment', 'Order', 'Delivery', 'Product', 'Custom'];
const CUSTOMER_SELECTION_TYPES = ['All Customers', 'Customers who ordered this product', 'Customers who ordered from this category', 'Manually selected'];

export default function AdminWhatsAppTab() {
  const showToast = useToast();
  const [reminders, setReminders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(null);

  const [form, setForm] = useState({
    reminderType: 'Custom',
    message: '',
    scheduledAt: '',
    customerIds: [],
    productId: '',
    customerSelectionType: 'Manually selected'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    loadReminders();
    loadCustomers();
    loadProducts();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/whatsapp/reminders');
      if (data.success) setReminders(data.reminders || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      if (data.success) {
        const sortedCustomers = (data.users?.filter(u => u.role === 'customer') || [])
          .sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(sortedCustomers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadCustomersByProduct = async (productId) => {
    if (!productId) {
      loadCustomers();
      return;
    }
    try {
      const { data } = await api.get(`/admin/whatsapp/customers-by-product/${productId}`);
      if (data.success) {
        const sortedCustomers = (data.customers || [])
          .sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(sortedCustomers);
        setSelectedCustomers(sortedCustomers.map(c => c.id));
      }
    } catch (err) {
      console.error('Failed to load customers by product:', err);
      showToast('Failed to load customers who ordered this product');
    }
  };

  const loadCustomersByCategory = async (category) => {
    if (!category) {
      loadCustomers();
      return;
    }
    try {
      const { data } = await api.get(`/admin/whatsapp/customers-by-category/${category}`);
      if (data.success) {
        const sortedCustomers = (data.customers || [])
          .sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(sortedCustomers);
        setSelectedCustomers(sortedCustomers.map(c => c.id));
      }
    } catch (err) {
      console.error('Failed to load customers by category:', err);
      showToast('Failed to load customers who ordered from this category');
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      if (data.success) {
        const sortedProducts = (data.products || [])
          .filter(p => p.status === 'active')
          .sort((a, b) => a.name.localeCompare(b.name));
        setProducts(sortedProducts);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const createReminder = async (e) => {
    e.preventDefault();
    if (selectedCustomers.length === 0) {
      showToast('Please select at least one customer');
      return;
    }
    
    if (form.reminderType === 'Product' && !form.productId) {
      showToast('Please select a product for Product Reminder');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        reminderType: form.reminderType,
        message: form.message,
        customerIds: selectedCustomers,
        scheduledAt: form.scheduledAt || new Date().toISOString(),
        productId: form.productId || null
      };

      // Check for duplicate reminders
      if (form.reminderType === 'Product' && form.productId) {
        try {
          const { data: duplicateCheck } = await api.post('/admin/whatsapp/check-duplicates', payload);
          if (duplicateCheck.hasDuplicates && duplicateCheck.duplicateCount > 0) {
            if (!window.confirm(`${duplicateCheck.duplicateCount} customers already received this product reminder recently. Continue anyway?`)) {
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Duplicate check failed, proceeding:', err);
        }
      }

      // Sending WhatsApp message
      const { data } = await api.post('/admin/whatsapp/send', payload);
      showToast(data.message);
      
      if (data.success) {
        // Check if backend returns links, otherwise construct them
        const links = data.whatsappLinks || [];
        
        if (links.length > 0) {
          links.forEach((link, index) => {
            setTimeout(() => window.open(link, '_blank'), index * 500);
          });
        } else {
          // Fallback: Just reset form and show success
          showToast('Reminder created successfully');
        }
        
        setForm({ reminderType: 'Custom', message: '', scheduledAt: '', customerIds: [], productId: '', customerSelectionType: 'Manually selected' });
        setSelectedCustomers([]);
        setShowPreview(false);
        loadReminders();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    
    try {
      const { data } = await api.delete(`/admin/whatsapp/reminders/${id}`);
      showToast(data.message);
      loadReminders();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete reminder');
    }
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => setSelectedCustomers(customers.map(c => c.id));
  const clearCustomerSelection = () => setSelectedCustomers([]);

  const previewMessage = () => setShowPreview(true);

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Create WhatsApp Reminder</h3>
        <form onSubmit={createReminder}>
          <div className="fg">
            <label>Reminder Type</label>
            <select value={form.reminderType} onChange={(e) => {
              setForm({ ...form, reminderType: e.target.value });
              if (e.target.value === 'Product') {
                setForm(prev => ({ ...prev, customerSelectionType: 'Customers who ordered this product' }));
              } else {
                setForm(prev => ({ ...prev, customerSelectionType: 'Manually selected' }));
              }
            }}>
              {REMINDER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          {form.reminderType === 'Product' && (
            <div className="fg">
              <label>Product (required)</label>
              <select 
                value={form.productId || ''} 
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.id === parseInt(e.target.value));
                  const productId = e.target.value;
                  setForm({ ...form, productId });
                  if (selectedProduct) {
                    const productInfo = `🌿 ${selectedProduct.name}\n\n${selectedProduct.description || 'Fresh from Go Nature Farms.'}\n\n💰 Price: ₹${selectedProduct.price}${selectedProduct.mrp ? ` (MRP: ₹${selectedProduct.mrp})` : ''}\n\n🛒 View Product:\nhttps://gonaturefarms-qf9o.onrender.com/products/${selectedProduct.id}`;
                    setForm(prev => ({ ...prev, message: productInfo }));
                    loadCustomersByProduct(productId);
                  }
                }}
                required
              >
                <option value="">Select a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name} - ₹{product.price}</option>
                ))}
              </select>
              {form.productId && (() => {
                const selectedProduct = products.find(p => p.id === parseInt(form.productId));
                return selectedProduct ? (
                  <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Selected Product Details</h4>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {selectedProduct.imgUrl && (
                        <img
                          src={selectedProduct.imgUrl}
                          alt={selectedProduct.name}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{selectedProduct.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                          Price: ₹{selectedProduct.price} {selectedProduct.mrp && <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginLeft: 8 }}>MRP: ₹{selectedProduct.mrp}</span>}
                        </div>
                        {selectedProduct.gst && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 2 }}>GST: {selectedProduct.gst}%</div>}
                        {selectedProduct.category && <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Category: {selectedProduct.category}</div>}
                        {selectedProduct.hsn && <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>HSN: {selectedProduct.hsn}</div>}
                        {selectedProduct.description && (
                          <div style={{ fontSize: '.8rem', marginTop: 4, lineHeight: 1.4 }}>
                            {selectedProduct.description}
                          </div>
                        )}
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: '.75rem', fontWeight: 600, marginBottom: 4 }}>Available Variants:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {selectedProduct.variants.map(v => (
                                <span key={v.id} style={{ 
                                  fontSize: '.7rem', 
                                  background: '#e0f2fe', 
                                  color: '#0369a1', 
                                  padding: '2px 6px', 
                                  borderRadius: 4 
                                }}>
                                  {v.variantName}: ₹{v.price}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
          <div className="fg">
            <label>Message</label>
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Enter your message here..." rows={4} />
          </div>
          <div className="fg">
            <label>Schedule (optional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          <div className="fg">
            <label>Customer Selection</label>
            <select 
              value={form.customerSelectionType} 
              onChange={(e) => {
                const selectionType = e.target.value;
                setForm({ ...form, customerSelectionType: selectionType });
                if (selectionType === 'All Customers') {
                  loadCustomers();
                  setSelectedCustomers(customers.map(c => c.id));
                } else if (selectionType === 'Customers who ordered this product' && form.productId) {
                  loadCustomersByProduct(form.productId);
                } else if (selectionType === 'Customers who ordered from this category' && form.productId) {
                  const selectedProduct = products.find(p => p.id === parseInt(form.productId));
                  if (selectedProduct && selectedProduct.category) {
                    loadCustomersByCategory(selectedProduct.category);
                  }
                } else {
                  loadCustomers();
                  setSelectedCustomers([]);
                }
              }}
            >
              {CUSTOMER_SELECTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          {form.customerSelectionType === 'Manually selected' && (
            <div className="fg">
              <label>Select Customers ({selectedCustomers.length} selected)</label>
              <div style={{ marginBottom: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={selectAllCustomers} style={{ marginRight: 8 }}>Select All</button>
                <button type="button" className="btn btn-secondary" onClick={clearCustomerSelection}>Clear Selection</button>
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                {customers.map(customer => (
                  <div key={customer.id} style={{ marginBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedCustomers.includes(customer.id)} onChange={() => toggleCustomerSelection(customer.id)} style={{ marginRight: 8 }} />
                      {customer.name} ({customer.phone})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {form.customerSelectionType !== 'Manually selected' && (
            <div className="fg">
              <label>Selected Customers ({selectedCustomers.length})</label>
              <div style={{ padding: 8, background: '#f9fafb', border: '1px solid var(--border)', borderRadius: 8 }}>
                {selectedCustomers.length > 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {selectedCustomers.length} customer(s) will receive this reminder
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    No customers selected yet
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={previewMessage}>👁 Preview Message</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Reminder'}</button>
          </div>
        </form>
        
        {showPreview && (
          <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
            <h4 style={{ marginBottom: 8 }}>Message Preview</h4>
            <div style={{ padding: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
              <strong>Type:</strong> {form.reminderType}<br />
              <strong>Recipients:</strong> {selectedCustomers.length} customers<br />
              {form.reminderType === 'Product' && form.productId && (() => {
                const selectedProduct = products.find(p => p.id === parseInt(form.productId));
                return selectedProduct ? (
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <strong>Product:</strong> {selectedProduct.name}<br />
                    {selectedProduct.imgUrl && (
                      <img 
                        src={selectedProduct.imgUrl} 
                        alt={selectedProduct.name}
                        style={{ maxWidth: 200, maxHeight: 200, marginTop: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                      />
                    )}
                  </div>
                ) : null;
              })()}
              <strong>Message:</strong><br />
              <div style={{ marginTop: 8, padding: 8, background: '#f9fafb', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{form.message}</div>
              <strong>Scheduled:</strong> {form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : 'Immediate'}
            </div>
            <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>Close Preview</button>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Reminder History</h3>
        {loading && <p>Loading...</p>}
        {!loading && reminders.length === 0 && <p>No reminders sent yet.</p>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th><th>Message</th><th>Scheduled</th><th>Status</th><th>Sent At</th><th></th>
            </tr>
          </thead>
          <tbody>
            {reminders.map(reminder => (
              <tr key={reminder.id}>
                <td>{reminder.reminderType}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{reminder.message}</td>
                <td>{reminder.scheduledAt ? new Date(reminder.scheduledAt).toLocaleString() : 'Immediate'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: '.75rem',
                    background: reminder.status === 'Sent' ? '#f0fdf4' : reminder.status === 'Pending' ? '#fffbeb' : '#fef2f2',
                    color: reminder.status === 'Sent' ? '#166534' : reminder.status === 'Pending' ? '#92400e' : '#dc2626'
                  }}>{reminder.status}</span>
                </td>
                <td>{reminder.sentAt ? new Date(reminder.sentAt).toLocaleString() : '-'}</td>
                <td><button className="btn-d" onClick={() => deleteReminder(reminder.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}