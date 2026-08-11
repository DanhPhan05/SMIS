import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Search, Plus, Trash2, Edit, X, Check } from 'lucide-react';

import { useToast } from '../../context/ToastContext';

const DEPARTMENTS = [
  'Chuyên ngành Công nghệ phần mềm',
  'Chuyên ngành Mạng máy tính và An ninh mạng',
  'Chuyên ngành Hệ thống thông tin',
  'Chuyên ngành Khoa học dữ liệu',
  'Chuyên ngành Thiết kế vi mạch',
  'Ngành Kỹ thuật phần mềm',
  'Ngành Trí tuệ nhân tạo',
  'Ngành Thương mại điện tử',
];

const EMPTY_FORM = { full_name: '', email: '', department: '', phone: '' };

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const toast = useToast();

  const fetchTeachers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/teachers', { params: { search, page, limit: 10 } });
      setTeachers(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchTeachers(1); }, [fetchTeachers]);

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

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (t) => { setEditId(t.id); setForm({ full_name: t.full_name, email: t.email || '', department: t.department || '', phone: t.phone || '' }); setFormError(''); setShowForm(true); };

  const handleSave = async () => {
    if (!form.full_name) {
      setFormError('Vui lòng nhập họ tên giảng viên');
      return;
    }
    setSaving(true); setFormError('');
    try {
      if (editId) { 
        await api.put(`/teachers/${editId}`, form); 
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Cập nhật giảng viên thành công' }));
      }
      else { 
        await api.post('/teachers', form); 
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Thêm giảng viên thành công' }));
      }
      setShowForm(false); 
      window.location.reload();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403 || status === 401) {
        setFormError('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại bằng tài khoản Admin.');
      } else {
        setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
      }
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa giảng viên "${name}"?`)) return;
    try { 
      await api.delete(`/teachers/${id}`); 
      sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Đã xóa giảng viên thành công' }));
      window.location.reload();
    }
    catch (err) { 
      toast.error(err.response?.data?.message || 'Không thể xóa giảng viên này'); 
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Quản lý Giảng viên</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Thêm giảng viên</button>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 'bold' }}>{editId ? 'Sửa giảng viên' : 'Thêm giảng viên'}</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Họ tên *</label>
              <input className="input" type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Khoa / Bộ môn / Ngành</label>
              <select
                className="input"
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                style={{ marginBottom: '0.5rem' }}
              >
                <option value="">-- Chọn Khoa / Bộ môn / Ngành --</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {DEPARTMENTS.map(dept => {
                  const isSelected = form.department === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, department: dept }))}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '9999px',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: isSelected ? 'var(--primary)' : '#f8fafc',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        fontWeight: isSelected ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="input" type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>

            {formError && (
              <div style={{ color: 'var(--danger)', background: '#fff0f0', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                ⚠️ {formError}
                {(formError.includes('quyền') || formError.includes('403') || formError.includes('token') || formError.includes('đăng nhập')) && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>→ Đăng xuất và đăng nhập lại bằng tài khoản Admin</a>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
            <input type="text" className="input" placeholder="Tìm kiếm mã GV, họ tên..." style={{ paddingLeft: '2.5rem' }} value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchTeachers(1)} />
          </div>
          <button className="btn btn-outline" onClick={() => fetchTeachers(1)}>Tìm</button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead><tr><th>Mã GV</th><th>Họ tên</th><th>Khoa</th><th>SĐT</th><th>Email</th><th>SV hướng dẫn</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                : teachers.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                : teachers.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.teacher_code}</strong></td>
                    <td>{t.full_name}</td>
                    <td>{t.department || '-'}</td>
                    <td>{t.phone || '-'}</td>
                    <td>{t.email || '-'}</td>
                    <td>{t.students?.length || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button style={{ color: 'var(--primary)', padding: '0.25rem', marginRight: '0.5rem' }} onClick={() => openEdit(t)}><Edit size={16} /></button>
                      <button style={{ color: 'var(--danger)', padding: '0.25rem' }} onClick={() => handleDelete(t.id, t.full_name)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`} style={{ minWidth: '36px' }} onClick={() => fetchTeachers(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
