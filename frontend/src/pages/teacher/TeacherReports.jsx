import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { MessageSquare, CheckCircle, AlertCircle, FileText, Eye, ExternalLink, Download, X } from 'lucide-react';

const STATUS_MAP = {
  submitted: { label: 'Đã nộp', cls: 'badge-info' },
  viewed: { label: 'Đã xem', cls: 'badge-warning' },
  approved: { label: 'Được duyệt', cls: 'badge-success' },
  needs_revision: { label: 'Cần sửa', cls: 'badge-danger' },
};

// Dynamic API base: use env variable in production, fallback to localhost or API instance
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  if (api.defaults.baseURL && (api.defaults.baseURL.startsWith('http://') || api.defaults.baseURL.startsWith('https://'))) {
    return api.defaults.baseURL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

function getPreviewUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const base = getApiBase();
  const clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = clean.replace(/^uploads\//, '').split('/');
  return `${base}/preview/${parts.join('/')}`;
}

function getDownloadUrl(filePath) {
  if (!filePath) return '#';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const base = getApiBase();
  const clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${base}/${clean}`;
}

function getFileExt(filePath) {
  if (!filePath) return '';
  return filePath.split('.').pop().toLowerCase();
}

export default function TeacherReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const docxContainerRef = useRef(null);

  useEffect(() => {
    if (previewFile && previewFile.ext === 'docx' && docxContainerRef.current) {
      setDocxLoading(true);
      fetch(previewFile.url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Không thể tải file từ máy chủ (Mã lỗi ${res.status})`);
          }
          return res.blob();
        })
        .then(blob => {
          if (docxContainerRef.current) docxContainerRef.current.innerHTML = '';
          import('docx-preview').then(({ renderAsync }) => {
            if (docxContainerRef.current) {
              renderAsync(blob, docxContainerRef.current, null, {
                inWrapper: false
              })
                .then(() => console.log('DOCX rendered successfully'))
                .catch(err => {
                  console.error('Error rendering DOCX:', err);
                  if (docxContainerRef.current) {
                    docxContainerRef.current.innerHTML = `
                      <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-main);">
                        <p style="margin-bottom: 1rem; font-weight: 500;">Không thể hiển thị bản xem trước cho file Word này trực tiếp.</p>
                        <a href="${getDownloadUrl(previewFile.filePath)}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                          Tải file về máy để xem
                        </a>
                      </div>`;
                  }
                })
                .finally(() => setDocxLoading(false));
            }
          });
        })
        .catch(err => {
          console.error('Error fetching DOCX blob:', err);
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = `
              <div style="padding: 2.5rem 1rem; text-align: center; color: var(--danger); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
                <p style="font-weight: 500;">${err.message || 'Lỗi tải file từ server.'}</p>
                <a href="${getDownloadUrl(previewFile.filePath)}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                  Tải file về máy
                </a>
              </div>`;
          }
          setDocxLoading(false);
        });
    }
  }, [previewFile]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports?limit=50');
      setReports(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (reportId, status) => {
    try {
      await api.put(`/reports/${reportId}/status`, { status });
      fetchReports();
      if (selected?.id === reportId) setSelected(s => ({ ...s, status }));
    } catch (err) { alert(err.response?.data?.message || 'Lỗi cập nhật'); }
  };

  const submitComment = async () => {
    if (!comment.trim() || !selected) return;
    setSubmitting(true);
    try {
      await api.post('/comments', { report_id: selected.id, content: comment });
      setComment('');
      // Refresh comments
      const res = await api.get(`/reports/${selected.id}`);
      setSelected(res.data);
      fetchReports();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi thêm nhận xét'); }
    finally { setSubmitting(false); }
  };

  const openPreview = (filePath) => {
    const ext = getFileExt(filePath);
    const url = getPreviewUrl(filePath);
    const name = filePath.split('/').pop().split('\\').pop();
    setPreviewFile({ url, name, ext, filePath });
  };

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Báo cáo & Chấm điểm</h1>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Danh sách báo cáo */}
        <div>
          <div className="card" style={{ padding: '0' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="table">
                <thead><tr><th>Sinh viên</th><th>Tuần</th><th>Ngày nộp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                    : reports.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>Chưa có báo cáo nào</td></tr>
                    : reports.map(r => {
                      const st = STATUS_MAP[r.status] || { label: r.status, cls: 'badge-info' };
                      return (
                        <tr key={r.id} style={{ cursor: 'pointer', background: selected?.id === r.id ? 'var(--primary-light)' : '' }}
                          onClick={() => setSelected(r)}>
                          <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '0.875rem'
                              }}>
                                {r.student ? (r.student.ten ? r.student.ten.charAt(0).toUpperCase() : 'S') : 'S'}
                              </div>
                              <div>
                                {r.student ? `${r.student.ho_ten_lot || ''} ${r.student.ten || ''}`.trim() : 'Không rõ'}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.student?.student_code || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--primary)' }}>Tuần {r.week_number}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r.submitted_date ? new Date(r.submitted_date).toLocaleDateString('vi-VN') : '-'}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                              <button 
                                title="Duyệt báo cáo" 
                                className="btn-icon-approve"
                                onClick={e => { e.stopPropagation(); updateStatus(r.id, 'approved'); }}
                                disabled={r.status === 'approved'}
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                title="Yêu cầu sửa" 
                                className="btn-icon-reject"
                                onClick={e => { e.stopPropagation(); updateStatus(r.id, 'needs_revision'); }}
                                disabled={r.status === 'needs_revision'}
                              >
                                <AlertCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chi tiết báo cáo */}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 'bold' }}>Tuần {selected.week_number} - {selected.student?.full_name}</h2>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', whiteSpace: 'pre-wrap', minHeight: '100px' }}>
              {selected.content}
            </div>

            {selected.file_path && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.65rem 0.85rem', 
                background: '#f8fafc', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                maxWidth: '100%',
                flexWrap: 'wrap'
              }}>
                <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Tài liệu đính kèm:</span>
                <button 
                  onClick={() => openPreview(selected.file_path)}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.3rem 0.65rem', 
                    fontSize: '0.8rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    borderRadius: '6px'
                  }}
                >
                  <Eye size={14} /> Xem file
                </button>
              </div>
            )}

            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Nhận xét</h3>
            {(selected.comments || []).map(c => (
              <div key={c.id} style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                <strong>{c.teacher?.full_name}</strong>: {c.content}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input className="input" placeholder="Viết nhận xét..." value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={submitComment} disabled={submitting || !comment.trim()}>
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── File Preview Modal ── */}
      {previewFile && createPortal(
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '90vw',
              maxWidth: '1100px',
              height: '85vh',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Preview Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: '600', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewFile.name}
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                  {previewFile.ext.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <a 
                  href={getDownloadUrl(previewFile.filePath)}
                  download
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} /> Tải về
                </a>
                <button 
                  onClick={() => setPreviewFile(null)}
                  style={{ color: 'var(--text-muted)', padding: '0.35rem', borderRadius: 'var(--radius)', transition: 'var(--transition)' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#f1f5f9' }}>
              {previewFile.ext === 'pdf' ? (
                <iframe
                  src={previewFile.url}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : previewFile.ext === 'docx' ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto' }}>
                  {docxLoading && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}>
                      <div className="animate-spin" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px' }} />
                    </div>
                  )}
                  <div ref={docxContainerRef} className="docx-preview-container" />
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  gap: '1.5rem',
                  padding: '2rem'
                }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary), #818cf8)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <FileText size={36} style={{ color: 'white' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontWeight: '600', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                      File Word ({previewFile.ext.toUpperCase()})
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', lineHeight: '1.5' }}>
                      Trình duyệt không hỗ trợ xem trực tiếp định dạng Word cũ (.doc). Vui lòng tải về để xem chi tiết.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a 
                      href={getDownloadUrl(previewFile.filePath)}
                      download
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} /> Tải file về
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
}
