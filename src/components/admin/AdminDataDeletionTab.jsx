import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../api/client.js';

export default function AdminDataDeletionTab() {
  const { adminLogin, logout } = useAuth();
  const showToast = useToast();
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [deleting, setDeleting] = useState(false);

  const handleDeleteType = (type) => {
    setDeleteType(type);
    setShowCredentialPrompt(true);
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setDeleting(true);
    
    try {
      // Verify admin credentials
      const result = await adminLogin(credentials.username, credentials.password);
      if (result.success) {
        // Proceed with deletion
        await performDeletion();
      } else {
        showToast('Invalid admin credentials');
        setCredentials({ username: '', password: '' });
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Invalid credentials');
      setCredentials({ username: '', password: '' });
    } finally {
      setDeleting(false);
    }
  };

  const performDeletion = async () => {
    try {
      let endpoint = '';
      let message = '';
      
      switch (deleteType) {
        case 'users':
          endpoint = '/admin/data/users';
          message = 'All users deleted successfully';
          break;
        case 'orders':
          endpoint = '/admin/data/orders';
          message = 'All orders deleted successfully';
          break;
        case 'all':
          endpoint = '/admin/data/all';
          message = 'All data deleted successfully';
          break;
        default:
          showToast('Invalid deletion type');
          return;
      }
      
      const { data } = await api.delete(endpoint);
      if (data.success) {
        showToast(message);
        setShowCredentialPrompt(false);
        setShowDeleteConfirmation(false);
        setDeleteType('');
        setCredentials({ username: '', password: '' });
      } else {
        showToast(data.message || 'Deletion failed');
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Deletion failed');
    }
  };

  const cancelOperation = () => {
    setShowDeleteConfirmation(false);
    setShowCredentialPrompt(false);
    setDeleteType('');
    setCredentials({ username: '', password: '' });
  };

  if (showCredentialPrompt) {
    return (
      <div>
        <h3>Admin Credential Verification</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          Please enter your admin credentials to confirm deletion of {deleteType === 'all' ? 'ALL DATA' : deleteType}.
        </p>
        <form onSubmit={handleCredentialSubmit}>
          <div className="fg">
            <label>Admin Username</label>
            <input 
              required 
              value={credentials.username} 
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} 
              placeholder="Enter admin username"
            />
          </div>
          <div className="fg">
            <label>Admin Password</label>
            <input 
              required 
              type="password" 
              value={credentials.password} 
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} 
              placeholder="Enter admin password"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-danger" disabled={deleting}>
              {deleting ? 'Verifying...' : 'Confirm & Delete'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancelOperation}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h3>Global Data Deletion</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        ⚠️ Warning: These actions are irreversible. Please be careful before proceeding.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <div style={{ 
          padding: 20, 
          border: '2px solid var(--border)', 
          borderRadius: 8,
          background: '#fff'
        }}>
          <h4 style={{ marginBottom: 8, color: '#dc2626' }}>Delete All Users</h4>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 16 }}>
            Remove all customer accounts and their data. This action cannot be undone.
          </p>
          <button 
            className="btn btn-danger btn-block" 
            onClick={() => handleDeleteType('users')}
          >
            Delete Users
          </button>
        </div>

        <div style={{ 
          padding: 20, 
          border: '2px solid var(--border)', 
          borderRadius: 8,
          background: '#fff'
        }}>
          <h4 style={{ marginBottom: 8, color: '#dc2626' }}>Delete All Orders</h4>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 16 }}>
            Remove all order history and related data. This action cannot be undone.
          </p>
          <button 
            className="btn btn-danger btn-block" 
            onClick={() => handleDeleteType('orders')}
          >
            Delete Orders
          </button>
        </div>

        <div style={{ 
          padding: 20, 
          border: '2px solid #dc2626', 
          borderRadius: 8,
          background: '#fef2f2'
        }}>
          <h4 style={{ marginBottom: 8, color: '#dc2626' }}>⚠️ Delete All Data</h4>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 16 }}>
            <strong>WARNING:</strong> This will delete ALL data including users, orders, etc. This is irreversible!
          </p>
          <button 
            className="btn btn-danger btn-block" 
            onClick={() => handleDeleteType('all')}
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}