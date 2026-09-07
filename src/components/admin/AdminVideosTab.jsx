import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = { title: '', productId: '', posterUrl: '', enabled: true, sortOrder: 0, orientation: 'landscape' };

export default function AdminVideosTab() {
  const showToast = useToast();
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.get('/videos/admin/all').then(({ data }) => setVideos(data.videos || []));
    api.get('/products').then(({ data }) => setProducts(data.products || []));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (video) => {
    setEditing(video.id);
    setForm({
      title: video.title,
      productId: video.productId || '',
      posterUrl: video.posterUrl || '',
      enabled: video.enabled,
      sortOrder: video.sortOrder,
      orientation: video.orientation
    });
    setFile(null);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY);
    setFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!file && !editing) {
      showToast('Video file is required');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (file) formData.append('file', file);
      if (form.productId) formData.append('productId', form.productId);
      if (form.posterUrl) formData.append('posterUrl', form.posterUrl);
      formData.append('enabled', form.enabled);
      formData.append('sortOrder', form.sortOrder);
      formData.append('orientation', form.orientation);

      const data = editing
        ? (await api.put(`/videos/admin/${editing}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            skipTransform: true
          })).data
        : (await api.post('/videos/admin', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            skipTransform: true
          })).data;

      showToast(data.message);
      if (data.success) {
        resetForm();
        load();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save video');
    } finally {
      setUploading(false);
    }
  };

  const toggleEnabled = async (id) => {
    try {
      const { data } = await api.put(`/videos/admin/${id}/toggle`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to toggle video status');
    }
  };

  const approveVideo = async (id) => {
    try {
      const { data } = await api.put(`/videos/admin/${id}/approve`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to approve video');
    }
  };

  const rejectVideo = async (id) => {
    if (!window.confirm('Are you sure you want to reject this video?')) return;
    try {
      const { data } = await api.put(`/videos/admin/${id}/reject`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to reject video');
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      const { data } = await api.delete(`/videos/admin/${id}`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to delete video');
    }
  };

  return (
    <div className="admin-card">
      <h3>Videos Management</h3>
      
      <form onSubmit={save} className="admin-form">
        <div className="fg">
          <label>Video Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="fg">
          <label>Video File {!editing && '*'}</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required={!editing}
          />
          {editing && !file && <small>Current video will be kept if no new file is selected</small>}
        </div>

        <div className="fg">
          <label>Link to Product (Optional)</label>
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          >
            <option value="">No Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="fg">
          <label>Poster Image URL (Optional)</label>
          <input
            type="text"
            value={form.posterUrl}
            onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
            placeholder="https://example.com/poster.jpg"
          />
        </div>

        <div className="frow">
          <div className="fg">
            <label>Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
            />
          </div>
          <div className="fg">
            <label>Orientation</label>
            <select
              value={form.orientation}
              onChange={(e) => setForm({ ...form, orientation: e.target.value })}
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>
        </div>

        <div className="fg">
          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            {' '}Enabled
          </label>
        </div>

        <div className="admin-ctrl">
          <button type="submit" className="btn-buy" disabled={uploading}>
            {uploading ? 'Saving...' : (editing ? 'Update' : 'Add Video')}
          </button>
          {editing && (
            <button type="button" className="btn-e" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-list">
        <h4>Existing Videos ({videos.length})</h4>
        {videos.length === 0 ? (
          <div className="empty-grid">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>No videos added yet</p>
          </div>
        ) : (
          <div className="admin-list-items">
            {videos.sort((a, b) => a.sortOrder - b.sortOrder).map(video => (
              <div key={video.id} className="admin-list-item">
                <div className="admin-list-item-content">
                  <h5>{video.title}</h5>
                  {video.product && (
                    <p className="admin-list-item-sub">Product: {video.product.name} - ₹{video.product.price}</p>
                  )}
                  <p className="admin-list-item-sub">Sort: {video.sortOrder} | {video.orientation}</p>
                  <p className="admin-list-item-sub">Status: {video.enabled ? 'Enabled' : 'Disabled'}</p>
                  {video.pending && <span className="badge-pending">Pending Approval</span>}
                </div>
                <div className="admin-list-item-actions">
                  {video.pending && (
                    <>
                      <button className="btn-sm bsm-g" onClick={() => approveVideo(video.id)}>Approve</button>
                      <button className="btn-sm bsm-r" onClick={() => rejectVideo(video.id)}>Reject</button>
                    </>
                  )}
                  <button className="btn-e" onClick={() => startEdit(video)}>Edit</button>
                  <button className="btn-e" onClick={() => toggleEnabled(video.id)}>
                    {video.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-d" onClick={() => deleteVideo(video.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}