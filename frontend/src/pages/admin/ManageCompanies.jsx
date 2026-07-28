import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Search, Plus, Trash2, Edit, X, Check } from 'lucide-react';

import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = {
  name: '', address: '', email: '', phone: '',
  nguoi_tiep_nhan: '', chuc_vu_nguoi_tiep_nhan: '', sdt_nguoi_tiep_nhan: '', email_nguoi_tiep_nhan: '',
  nguoi_huong_dan: '', chuc_vu_nguoi_huong_dan: '', sdt_nguoi_huong_dan: '', email_nguoi_huong_dan: '',
  notes: ''
};

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const fetchCompanies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/companies', { params: { search, page, limit: 10 } });
      setCompanies(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCompanies(1); }, [fetchCompanies]);

  useEffect(() => {
    const cached = sessionStorage.getItem('cached_toast');
    if (cached) {
      try {
        const { type, message } = JSON.parse(cached);
        if (type && message) toast[type](message);
      } catch (e) { console.error(e); }
      sessionStorage.removeItem('cached_toast');
    }
  }, [toast]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };
  const openEdit = (c) => { 
    setEditId(c.id); 
    setForm({ 
      name: c.name, 
      address: c.address || '', 
      email: c.email || '', 
      phone: c.phone || '', 
      nguoi_tiep_nhan: c.nguoi_tiep_nhan || '', 
      chuc_vu_nguoi_tiep_nhan: c.chuc_vu_nguoi_tiep_nhan || '', 
      sdt_nguoi_tiep_nhan: c.sdt_nguoi_tiep_nhan || '', 
      email_nguoi_tiep_nhan: c.email_nguoi_tiep_nhan || '', 
      nguoi_huong_dan: c.nguoi_huong_dan || '', 
      chuc_vu_nguoi_huong_dan: c.chuc_vu_nguoi_huong_dan || '', 
      sdt_nguoi_huong_dan: c.sdt_nguoi_huong_dan || '', 
      email_nguoi_huong_dan: c.email_nguoi_huong_dan || '', 
      notes: c.notes || '' 
    }); 
    setFormError(''); 
    setShowForm(true); 
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      if (editId) { 
        await api.put(`/companies/${editId}`, form); 
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Cập nhật doanh nghiệp thành công' }));
      }
      else { 
        await api.post('/companies', form); 
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Thêm doanh nghiệp thành công' }));
      }
      setShowForm(false); 
      window.location.reload();
    } catch (err) { setFormError(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa doanh nghiệp "${name}"?`)) return;
    try { 
      await api.delete(`/companies/${id}`); 
      sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Đã xóa doanh nghiệp thành công' }));
      window.location.reload();
    }
    catch (err) { 
      toast.error(err.response?.data?.message || 'Không thể xóa doanh nghiệp này'); 
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Quản lý Doanh nghiệp</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Thêm doanh nghiệp</button>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', width: '90%' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{editId ? 'Sửa doanh nghiệp' : 'Thêm doanh nghiệp'}</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {formError && <div className="badge badge-danger" style={{ display: 'block', padding: '0.5rem', marginBottom: '1rem' }}>{formError}</div>}
            
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Tên doanh nghiệp *</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Người tiếp nhận</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Họ tên</label>
                  <input className="input" value={form.nguoi_tiep_nhan} onChange={e => setForm(p => ({ ...p, nguoi_tiep_nhan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ</label>
                  <input className="input" value={form.chuc_vu_nguoi_tiep_nhan} onChange={e => setForm(p => ({ ...p, chuc_vu_nguoi_tiep_nhan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="input" value={form.sdt_nguoi_tiep_nhan} onChange={e => setForm(p => ({ ...p, sdt_nguoi_tiep_nhan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" value={form.email_nguoi_tiep_nhan} onChange={e => setForm(p => ({ ...p, email_nguoi_tiep_nhan: e.target.value }))} />
                </div>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Người hướng dẫn</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Họ tên</label>
                  <input className="input" value={form.nguoi_huong_dan} onChange={e => setForm(p => ({ ...p, nguoi_huong_dan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ</label>
                  <input className="input" value={form.chuc_vu_nguoi_huong_dan} onChange={e => setForm(p => ({ ...p, chuc_vu_nguoi_huong_dan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="input" value={form.sdt_nguoi_huong_dan} onChange={e => setForm(p => ({ ...p, sdt_nguoi_huong_dan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" value={form.email_nguoi_huong_dan} onChange={e => setForm(p => ({ ...p, email_nguoi_huong_dan: e.target.value }))} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Ghi chú</label>
                <textarea className="input" rows="2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Check size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input" placeholder="Tìm kiếm tên, địa chỉ..." style={{ paddingLeft: '2.5rem' }} value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCompanies(1)} />
          </div>
          <button className="btn btn-outline" onClick={() => fetchCompanies(1)}>Tìm</button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tên doanh nghiệp</th>
                <th>Người tiếp nhận</th>
                <th>Người hướng dẫn</th>
                <th>Email</th>
                <th>SV thực tập</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                : companies.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                : companies.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.nguoi_tiep_nhan || '-'}</td>
                    <td>{c.nguoi_huong_dan || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.students?.length || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button style={{ color: 'var(--primary)', padding: '0.25rem', marginRight: '0.5rem' }} onClick={() => openEdit(c)}><Edit size={16} /></button>
                      <button style={{ color: 'var(--danger)', padding: '0.25rem' }} onClick={() => handleDelete(c.id, c.name)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`} style={{ minWidth: '36px' }} onClick={() => fetchCompanies(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
