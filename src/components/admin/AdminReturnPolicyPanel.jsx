import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

/** Return / Non-Returnable policy management, embedded in Admin → Orders. */
export default function AdminReturnPolicyPanel() {
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [policies, setPolicies] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/products', { skipTransform: true })
      .then(({ data }) => {
        const list = data?.products || data || [];
        setProducts(Array.isArray(list) ? list : []);
        const map = {};
        list.forEach((p) => {
          map[p.id] = p.return_policy || p.returnPolicy || (p.return_eligible === false || p.returnEligible === false ? 'NON_RETURNABLE' : 'RETURNABLE');
        });
        setPolicies(map);
      })
      .catch(() => showToast('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open && products.length === 0) load(); }, [open]);

  const save = async (p) => {
    setSavingId(p.id);
    try {
      await api.put(`/products/${p.id}`, { ...p, returnPolicy: policies[p.id] });
      showToast(`Policy updated for ${p.name}`);
    } catch (e) {
      showToast(e?.userMessage || 'Failed to update policy');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Return / Non-Returnable Management</h3>
          <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: 'var(--muted)' }}>
            Set each product's return policy. Changes appear on the homepage immediately.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Manage'}</button>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {loading ? <p>Loading products…</p> : (
            <table className="data-table">
              <thead><tr><th>Product</th><th>Category</th><th>Current Policy</th><th>Set Policy</th><th></th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(p.img_url || p.imgUrl) && <img src={p.img_url || p.imgUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />}
                      {p.name}
                    </td>
                    <td>{p.cat || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: '.72rem', fontWeight: 600,
                        background: policies[p.id] === 'NON_RETURNABLE' ? '#fee2e2' : '#dcfce7',
                        color: policies[p.id] === 'NON_RETURNABLE' ? '#b91c1c' : '#15803d'
                      }}>
                        {policies[p.id] === 'NON_RETURNABLE' ? 'Non-Returnable' : 'Returnable'}
                      </span>
                    </td>
                    <td>
                      <select value={policies[p.id] || 'RETURNABLE'}
                        onChange={(e) => setPolicies({ ...policies, [p.id]: e.target.value })}>
                        <option value="RETURNABLE">Returnable</option>
                        <option value="NON_RETURNABLE">Non-Returnable</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-primary" disabled={savingId === p.id} onClick={() => save(p)}>
                        {savingId === p.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
