import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Trash2, Edit, X, Check, AlertTriangle } from 'lucide-react';

const STATUS_MAP = {
  not_started: { label: 'Chưa bắt đầu', cls: 'badge-warning' },
  in_progress: { label: 'Đang thực tập', cls: 'badge-success' },
  completed: { label: 'Hoàn thành', cls: 'badge-info' },
  suspended: { label: 'Tạm dừng', cls: 'badge-danger' },
};

const ACADEMIC_MAP = {
  ACTIVE: { label: 'Đang học', cls: 'badge-success' },
  GRADUATED: { label: 'Đã tốt nghiệp', cls: 'badge-gray' },
  INACTIVE: { label: 'Đình chỉ/Bảo lưu', cls: 'badge-danger' },
};

const EMPTY_FORM = {
  ho_ten_lot: '', ten: '', class_name: '', major: '', batch: '',
  email: '', phone: '', internship_status: 'not_started', academic_status: 'ACTIVE',
  nguoi_tiep_nhan: '', chuc_vu_nguoi_tiep_nhan: '', sdt_nguoi_tiep_nhan: '', email_nguoi_tiep_nhan: '',
  nguoi_huong_dan: '', chuc_vu_nguoi_huong_dan: '', sdt_nguoi_huong_dan: '', email_nguoi_huong_dan: ''
};

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterAcademic, setFilterAcademic] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  
  const toast = useToast();

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { search, page, limit: 10 };
      if (filterBatch) params.batch = filterBatch;
      if (filterAcademic) params.academic_status = filterAcademic;
      
      const res = await api.get('/students', { params });
      setStudents(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
      // Clear selection on page change
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  }, [search, filterBatch, filterAcademic, toast]);

  useEffect(() => {
    fetchStudents(1);
    api.get('/students/batches')
      .then(res => setAvailableBatches(res.data))
      .catch(err => console.error(err));
  }, [fetchStudents]);

  // ── Checkbox helpers ──
  const deletableStudents = students.filter(s => s.academic_status !== 'GRADUATED');
  const allDeletableSelected = deletableStudents.length > 0 && deletableStudents.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableStudents.map(s => s.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  
  const openEdit = (s) => { 
    setEditId(s.id); 
    setForm({ 
      ho_ten_lot: s.ho_ten_lot || '', 
      ten: s.ten || '', 
      class_name: s.class_name || '', 
      major: s.major || '', 
      batch: s.batch || '',
      email: s.email || '', 
      phone: s.phone || '', 
      internship_status: s.internship_status,
      academic_status: s.academic_status,
      nguoi_tiep_nhan: s.nguoi_tiep_nhan || '',
      chuc_vu_nguoi_tiep_nhan: s.chuc_vu_nguoi_tiep_nhan || '',
      sdt_nguoi_tiep_nhan: s.sdt_nguoi_tiep_nhan || '',
      email_nguoi_tiep_nhan: s.email_nguoi_tiep_nhan || '',
      nguoi_huong_dan: s.nguoi_huong_dan || '',
      chuc_vu_nguoi_huong_dan: s.chuc_vu_nguoi_huong_dan || '',
      sdt_nguoi_huong_dan: s.sdt_nguoi_huong_dan || '',
      email_nguoi_huong_dan: s.email_nguoi_huong_dan || ''
    }); 
    setShowForm(true); 
  };

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

  const handleSave = async () => {
    if (!form.ten) {
      return toast.warning('Vui lòng nhập tên sinh viên');
    }
    
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/students/${editId}`, form);
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Cập nhật thành công' }));
      } else {
        await api.post('/students', form);
        sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Thêm sinh viên thành công' }));
      }
      setShowForm(false);
      window.location.reload();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403 || status === 401) {
        toast.error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại bằng tài khoản Admin.');
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name, status) => {
    if (status === 'GRADUATED') {
      return toast.warning('Không thể xóa sinh viên đã tốt nghiệp. Vui lòng chuyển trạng thái!');
    }
    if (!window.confirm(`Xóa sinh viên "${name}" khỏi hệ thống? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/students/${id}`);
      sessionStorage.setItem('cached_toast', JSON.stringify({ type: 'success', message: 'Đã xóa sinh viên' }));
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa sinh viên này');
    }
  };

  // ── Batch delete ──
  const handleDeleteMany = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    
    if (!window.confirm(`Bạn có chắc muốn xóa ${count} sinh viên đã chọn?\n\nHành động này không thể hoàn tác!`)) return;
    
    setDeleting(true);
    try {
      const res = await api.post('/students/delete-many', { ids: Array.from(selectedIds) });
      const data = res.data;
      
      let msg = data.message;
      let type = 'success';
      if (data.skipped_count > 0) {
        msg = `Đã xóa ${data.deleted_count} sinh viên. Bỏ qua ${data.skipped_count} sinh viên đã tốt nghiệp.`;
        type = 'warning';
      }
      
      sessionStorage.setItem('cached_toast', JSON.stringify({ type, message: msg }));
      setSelectedIds(new Set());
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa sinh viên');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Quản lý Sinh viên</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Thêm sinh viên
        </button>
      </div>

      {/* ── Floating action bar when items selected ── */}
      {someSelected && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '0.75rem 1.25rem', marginBottom: '1rem',
          background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-lg)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span style={{ fontWeight: '600', color: '#991b1b', flex: 1 }}>
            Đã chọn {selectedIds.size} sinh viên
          </span>
          <button 
            className="btn" 
            style={{ 
              background: '#dc2626', color: '#fff', border: 'none',
              padding: '0.5rem 1rem', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
            onClick={handleDeleteMany}
            disabled={deleting}
          >
            <Trash2 size={15} /> {deleting ? 'Đang xóa...' : `Xóa ${selectedIds.size} sinh viên`}
          </button>
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            onClick={() => setSelectedIds(new Set())}
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Modal form */}
      {showForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{editId ? 'Cập nhật Thông tin' : 'Thêm Sinh viên Mới'}</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Thông tin cá nhân</h3>
              
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Họ và tên lót</label>
                  <input className="input" value={form.ho_ten_lot} onChange={e => setForm({...form, ho_ten_lot: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên *</label>
                  <input className="input" value={form.ten} onChange={e => setForm({...form, ten: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Khóa (Batch)</label>
                  <input className="input" placeholder="VD: K24" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lớp</label>
                  <input className="input" value={form.class_name} onChange={e => setForm({...form, class_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái Học tập</label>
                  <select className="input" value={form.academic_status} onChange={e => setForm({...form, academic_status: e.target.value})}>
                    <option value="ACTIVE">Đang học</option>
                    <option value="GRADUATED">Đã tốt nghiệp</option>
                    <option value="INACTIVE">Đình chỉ / Bảo lưu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái Thực tập</label>
                  <select className="input" value={form.internship_status} onChange={e => setForm({...form, internship_status: e.target.value})}>
                    <option value="not_started">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực tập</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="suspended">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Thông tin Người tiếp nhận tại Doanh nghiệp</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Người tiếp nhận</label>
                  <input className="input" value={form.nguoi_tiep_nhan} onChange={e => setForm({...form, nguoi_tiep_nhan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ người tiếp nhận</label>
                  <input className="input" value={form.chuc_vu_nguoi_tiep_nhan} onChange={e => setForm({...form, chuc_vu_nguoi_tiep_nhan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SĐT người tiếp nhận</label>
                  <input className="input" value={form.sdt_nguoi_tiep_nhan} onChange={e => setForm({...form, sdt_nguoi_tiep_nhan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email người tiếp nhận</label>
                  <input className="input" type="email" value={form.email_nguoi_tiep_nhan} onChange={e => setForm({...form, email_nguoi_tiep_nhan: e.target.value})} />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Thông tin Người hướng dẫn tại Doanh nghiệp</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Người hướng dẫn</label>
                  <input className="input" value={form.nguoi_huong_dan} onChange={e => setForm({...form, nguoi_huong_dan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ người hướng dẫn</label>
                  <input className="input" value={form.chuc_vu_nguoi_huong_dan} onChange={e => setForm({...form, chuc_vu_nguoi_huong_dan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SĐT người hướng dẫn</label>
                  <input className="input" value={form.sdt_nguoi_huong_dan} onChange={e => setForm({...form, sdt_nguoi_huong_dan: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email người hướng dẫn</label>
                  <input className="input" type="email" value={form.email_nguoi_huong_dan} onChange={e => setForm({...form, email_nguoi_huong_dan: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={16} /> {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Filters and Table */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input" placeholder="Tìm kiếm theo mã, họ tên, email..."
              style={{ paddingLeft: '2.5rem' }} value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchStudents(1)} />
          </div>
          
          <select className="input" style={{ width: '150px' }} value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
            <option value="">Tất cả Khóa</option>
            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          
          <select className="input" style={{ width: '180px' }} value={filterAcademic} onChange={e => setFilterAcademic(e.target.value)}>
            <option value="">Mọi trạng thái học tập</option>
            <option value="ACTIVE">Đang học</option>
            <option value="GRADUATED">Đã tốt nghiệp</option>
            <option value="INACTIVE">Đình chỉ</option>
          </select>

          <button className="btn btn-outline" onClick={() => fetchStudents(1)}>Tìm / Lọc</button>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={allDeletableSelected && deletableStudents.length > 0}
                    onChange={toggleSelectAll}
                    title="Chọn tất cả"
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </th>
                <th>Mã SV</th>
                <th>Họ tên</th>
                <th>Khóa</th>
                <th>Trạng thái học tập</th>
                <th>Trạng thái thực tập</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy sinh viên nào</td></tr>
              ) : students.map(s => {
                const istt = STATUS_MAP[s.internship_status] || { label: s.internship_status, cls: 'badge-gray' };
                const isacad = ACADEMIC_MAP[s.academic_status] || { label: s.academic_status, cls: 'badge-gray' };
                const isGraduated = s.academic_status === 'GRADUATED';
                const isChecked = selectedIds.has(s.id);
                
                return (
                  <tr key={s.id} style={{ background: isChecked ? 'rgba(99, 102, 241, 0.06)' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        disabled={isGraduated}
                        onChange={() => toggleSelect(s.id)}
                        title={isGraduated ? 'Không thể xóa SV đã tốt nghiệp' : 'Chọn để xóa'}
                        style={{ 
                          width: '16px', height: '16px', 
                          cursor: isGraduated ? 'not-allowed' : 'pointer',
                          accentColor: 'var(--primary)',
                          opacity: isGraduated ? 0.4 : 1,
                        }}
                      />
                    </td>
                    <td><strong>{s.student_code}</strong></td>
                    <td>
                      <div>{`${s.ho_ten_lot || ''} ${s.ten || ''}`.trim()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email || 'Chưa cập nhật'}</div>
                    </td>
                    <td>{s.batch || '-'}</td>
                    <td><span className={`badge ${isacad.cls}`}>{isacad.label}</span></td>
                    <td><span className={`badge ${istt.cls}`}>{istt.label}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button style={{ color: 'var(--primary)', padding: '0.3rem', marginRight: '0.5rem' }} onClick={() => openEdit(s)}><Edit size={18} /></button>
                      <button 
                        style={{ color: isGraduated ? 'var(--text-muted)' : 'var(--danger)', padding: '0.3rem', cursor: isGraduated ? 'not-allowed' : 'pointer' }} 
                        onClick={() => handleDelete(s.id, `${s.ho_ten_lot || ''} ${s.ten || ''}`.trim(), s.academic_status)}
                        title={isGraduated ? 'Không thể xóa SV đã tốt nghiệp' : 'Xóa'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                style={{ minWidth: '36px' }} onClick={() => fetchStudents(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} sinh viên)
      </div>
    </DashboardLayout>
  );
}
