import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Plus, X, Check } from 'lucide-react';

const NOTES_MAX_LENGTH = 200;

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ student_id: '', teacher_id: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAssignments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/assignments', { params: { page, limit: 10 } });
      setAssignments(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssignments(1); }, [fetchAssignments]);

  const openCreate = async () => {
    setForm({ student_id: '', teacher_id: '', notes: '' }); setFormError('');
    try {
      const [sRes, tRes] = await Promise.all([api.get('/students?limit=100'), api.get('/teachers?limit=100')]);
      setStudents(sRes.data.data || []);
      setTeachers(tRes.data.data || []);
    } catch (err) { console.error(err); }
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      await api.post('/assignments', { 
        student_id: parseInt(form.student_id), 
        teacher_id: parseInt(form.teacher_id), 
        notes: form.notes ? form.notes.trim() : '' 
      });
      setShowForm(false); fetchAssignments(pagination.page);
    } catch (err) { setFormError(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Phân công Hướng dẫn</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Phân công mới</button>
      </div>

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>Phân công mới</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {formError && <div className="badge badge-danger" style={{ display: 'block', padding: '0.5rem', marginBottom: '1rem' }}>{formError}</div>}
            <div className="form-group">
              <label className="form-label">Sinh viên *</label>
              <select className="input" value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}>
                <option value="">-- Chọn sinh viên --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.student_code} - {s.full_name || `${s.ho_ten_lot || ''} ${s.ten || ''}`.trim()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Giảng viên hướng dẫn *</label>
              <select className="input" value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}>
                <option value="">-- Chọn giảng viên --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.teacher_code} - {t.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <textarea
                className="input"
                value={form.notes}
                onChange={e => {
                  if (e.target.value.length <= NOTES_MAX_LENGTH) {
                    setForm(p => ({ ...p, notes: e.target.value }));
                  }
                }}
                rows={3}
                placeholder="Nhập ghi chú (tùy chọn)..."
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: form.notes.length >= NOTES_MAX_LENGTH ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
                {form.notes.length}/{NOTES_MAX_LENGTH}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.student_id || !form.teacher_id}>
                <Check size={16} /> {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="card" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead><tr><th>Sinh viên</th><th>Giảng viên HD</th><th>Ngày phân công</th><th>Ghi chú</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                : assignments.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>Chưa có phân công nào</td></tr>
                : assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.student?.full_name || `${a.student?.ho_ten_lot || ''} ${a.student?.ten || ''}`.trim() || '-'} <br /><small style={{ color: 'var(--text-muted)' }}>{a.student?.student_code}</small></td>
                    <td>{a.teacher?.full_name || '-'}</td>
                    <td>{a.assigned_date ? new Date(a.assigned_date).toLocaleDateString('vi-VN') : '-'}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.notes || '-'}</td>
                    <td><span className={`badge ${a.is_active ? 'badge-success' : 'badge-warning'}`}>{a.is_active ? 'Đang hoạt động' : 'Đã hủy'}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`} style={{ minWidth: '36px' }} onClick={() => fetchAssignments(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

