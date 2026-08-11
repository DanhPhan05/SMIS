import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Plus, X, Check, FileText, Upload, Eye, Download, ExternalLink } from 'lucide-react';

const STATUS_MAP = {
  submitted: { label: 'Đã nộp', cls: 'badge-info' },
  viewed: { label: 'Đã xem', cls: 'badge-warning' },
  approved: { label: 'Được duyệt', cls: 'badge-success' },
  needs_revision: { label: 'Cần sửa', cls: 'badge-danger' },
};

const EMPTY_FORM = { week_number: '', content: '' };

// Dynamic API base: use env variable in production, fallback to localhost or API instance
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (api.defaults.baseURL && (api.defaults.baseURL.startsWith('http://') || api.defaults.baseURL.startsWith('https://'))) {
    return api.defaults.baseURL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
};

function getPreviewUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const base = getApiBase();
  let clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  clean = clean.replace(/^uploads\//, '');
  const parts = clean.split('/');
  if (parts.length === 1) {
    return `${base}/preview/reports/${parts[0]}`;
  }
  return `${base}/preview/${parts.join('/')}`;
}

function getDownloadUrl(filePath) {
  if (!filePath) return '#';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const base = getApiBase();
  let clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!clean.startsWith('uploads/')) {
    clean = `uploads/${clean}`;
  }
  return `${base}/${clean}`;
}

function getFileExt(filePath) {
  if (!filePath) return '';
  return filePath.split('.').pop().toLowerCase();
}

export default function StudentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { url, name, ext }
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
                        <a href="${getDownloadUrl(previewFile.filePath || previewFile.url)}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
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
                <a href="${getDownloadUrl(previewFile.filePath || previewFile.url)}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const formData = new FormData();
      formData.append('week_number', parseInt(form.week_number));
      formData.append('content', form.content);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowForm(false);
      setForm(EMPTY_FORM);
      setSelectedFile(null);
      fetchReports();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setFormError('');
  };

  const openPreview = (filePath) => {
    const ext = getFileExt(filePath);
    const url = getPreviewUrl(filePath);
    const name = filePath.split('/').pop().split('\\').pop();
    setPreviewFile({ url, name, ext });
  };

  const openInNewTab = (filePath) => {
    const name = filePath.split('/').pop().split('\\').pop();
    const url = getPreviewUrl(filePath);
    window.open(`/view-file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Báo cáo hàng tuần</h1>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setSelectedFile(null); setShowForm(true); }}>
          <Plus size={16} /> Viết báo cáo
        </button>
      </div>

      {/* ── Write Report Modal ── */}
      {showForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '560px', maxWidth: '90%' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Nộp báo cáo tuần</h2>
              <button onClick={closeForm} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            {formError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', textAlign: 'left', borderRadius: 'var(--radius-md)' }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>Số tuần *</label>
              <input className="input" type="number" min="1" max="52" placeholder="VD: 1" value={form.week_number}
                onChange={e => setForm(p => ({ ...p, week_number: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>Nội dung báo cáo *</label>
              <textarea className="input" rows={6} placeholder="Mô tả công việc đã làm trong tuần..." value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Đính kèm tài liệu <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.8rem' }}>(PDF, Word - Tối đa 10MB)</span>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, padding: '0.5rem 1rem' }}>
                  <Upload size={16} /> Chọn File
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={e => setSelectedFile(e.target.files[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '500', fontSize: '0.875rem' }}>
                      <FileText size={16} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedFile.name}>
                        {selectedFile.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)} 
                        style={{ color: 'var(--danger)', fontSize: '1rem', fontWeight: 'bold', padding: '0 0.25rem' }}
                        title="Hủy chọn file"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chưa có file nào được chọn</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={closeForm}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.week_number || !form.content}>
                <Check size={16} /> {saving ? 'Đang nộp...' : 'Nộp báo cáo'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                  href={getDownloadUrl(previewFile.filePath || previewFile.url)}
                  download
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} /> Tải về
                </a>
                <a 
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ExternalLink size={14} /> Tab mới
                </a>
                <button 
                  onClick={() => setPreviewFile(null)}
                  style={{ 
                    color: 'var(--text-muted)', 
                    padding: '0.35rem',
                    borderRadius: 'var(--radius)',
                    transition: 'var(--transition)'
                  }}
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
                      href={getDownloadUrl(previewFile.filePath || previewFile.url)}
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

      <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
        {loading ? (
          <p>Đang tải...</p>
        ) : reports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Bạn chưa nộp báo cáo nào.</p>
          </div>
        ) : (
          reports.map(r => {
            const st = STATUS_MAP[r.status] || { label: r.status, cls: 'badge-info' };
            return (
              <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Tuần {r.week_number}</h3>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                
                <p style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {r.content}
                </p>

                {r.file_path && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.6rem 0.85rem', 
                    background: '#f8fafc', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)',
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                    marginTop: '0.25rem',
                    flexWrap: 'wrap'
                  }}>
                    <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>Tài liệu đính kèm:</span>
                    <button 
                      onClick={() => openPreview(r.file_path)}
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
                    <a 
                      href={getDownloadUrl(r.file_path)}
                      download
                      className="btn btn-outline"
                      style={{ 
                        padding: '0.3rem 0.65rem', 
                        fontSize: '0.8rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        borderRadius: '6px'
                      }}
                    >
                      <Download size={14} /> Tải về
                    </a>
                  </div>
                )}

                {r.comments && r.comments.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Nhận xét từ giảng viên:</strong>
                    {r.comments.map(c => (
                      <div key={c.id} style={{ background: 'var(--primary-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        <strong>{c.teacher?.full_name}:</strong> {c.content}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  Ngày nộp: {new Date(r.submitted_date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
