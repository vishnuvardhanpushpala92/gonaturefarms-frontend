import React from 'react';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminVideosTab() {
  const showToast = useToast();
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: '', enabled: true, sortOrder: 0, orientation: 'landscape' });
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      // This must be /admin/all, NOT /admin
      const res = await api.get('/videos/admin/all');
      
      console.log('Admin videos response:', res);
      console.log('Admin videos response.data:', res.data);
      
      if (res.data.success) {
        setVideos(res.data.videos || []);
      } else {
        console.error('API returned success=false:', res.data);
      }
    } catch (err) {
      // This prevents the error from printing as a massive red crash in the browser console
      console.warn('Could not load videos silently:', err.message);
    }
  };

  const saveVideo = async (e) => {
    e.preventDefault();
    
    if (!file && !editing) {
      showToast('Please select a video file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('enabled', form.enabled);
    formData.append('sortOrder', form.sortOrder);
    formData.append('orientation', form.orientation);
    
    if (file) {
      formData.append('file', file);
    }
    
    try {
      if (editing) {
        await api.put(`/videos/admin/${editing}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Video updated successfully');
      } else {
        await api.post('/videos/admin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Video added successfully');
      }
      resetForm();
      loadVideos();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save video');
    }
  };

  const resetForm = () => {
    setForm({ title: '', enabled: true, sortOrder: 0, orientation: 'landscape' });
    setFile(null);
    setEditing(null);
  };

  const editVideo = (video) => {
    setEditing(video.id);
    setForm({ 
      title: video.title, 
      enabled: video.enabled, 
      sortOrder: video.sortOrder,
      orientation: video.orientation || 'landscape'
    });
    setFile(null);
  };

  const deleteVideo = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/videos/admin/${id}`);
      showToast('Video deleted successfully');
      loadVideos();
    } catch (err) {
      showToast('Failed to delete video');
    }
  };

  const toggleEnabled = async (id) => {
    try {
      await api.put(`/videos/admin/${id}/toggle`);
      showToast('Video status updated');
      loadVideos();
    } catch (err) {
      showToast('Failed to update video status');
    }
  };

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>{editing ? 'Edit Video' : 'Upload New Video'}</h3>
        <form onSubmit={saveVideo}>
          <div className="fg">
            <label>Video Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Farm Tour Video"
              required
            />
          </div>
          
          <div className="fg">
            <label>Video File (MP4/WebM/OGG)</label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={(e) => setFile(e.target.files[0])}
              required={!editing}
            />
            {file && <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 4 }}>Selected: {file.name}</p>}
            {!editing && <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>High-quality video recommended</p>}
          </div>

          <div className="frow">
            <div className="fg">
              <label>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="fg">
              <label>Orientation</label>
              <select
                value={form.orientation}
                onChange={(e) => setForm({ ...form, orientation: e.target.value })}
              >
                <option value="landscape">Landscape (16:9)</option>
                <option value="portrait">Portrait (9:16)</option>
              </select>
            </div>
          </div>
          
          <div className="fg">
            <label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Enabled (show on website)
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit">
              {editing ? 'Update Video' : 'Upload Video'}
            </button>
            {editing && <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>All Videos</h3>
        {videos.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>No videos uploaded yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td>{video.title}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '.7rem',
                      background: video.enabled ? '#ecfdf5' : '#f3f4f6',
                      color: video.enabled ? '#065f46' : '#6b7280'
                    }}>
                      {video.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>{video.sortOrder}</td>
                  <td>
                    <button className="btn-e" onClick={() => editVideo(video)}>Edit</button>
                    <button className="btn-e" onClick={() => toggleEnabled(video.id)}>
                      {video.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-d" onClick={() => deleteVideo(video.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
