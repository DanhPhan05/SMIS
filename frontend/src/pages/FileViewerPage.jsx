import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import api from '../services/api';

// Dynamic API base: use env variable in production, fallback to localhost
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

export default function FileViewerPage() {
  const [searchParams] = useSearchParams();
  const rawFileUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'File Preview';
  const ext = fileName.split('.').pop().toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fileUrl = (() => {
    if (!rawFileUrl) return '';
    if (rawFileUrl.startsWith('http://') || rawFileUrl.startsWith('https://')) return rawFileUrl;
    const base = getApiBase();
    const clean = rawFileUrl.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${base}/${clean}`;
  })();
  
  useEffect(() => {
    if (ext === 'docx' && fileUrl && containerRef.current) {
      setLoading(true);
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Không thể tải file từ máy chủ (Mã lỗi ${res.status})`);
          }
          return res.blob();
        })
        .then(blob => {
          if (containerRef.current) containerRef.current.innerHTML = '';
          import('docx-preview').then(({ renderAsync }) => {
            if (containerRef.current) {
              renderAsync(blob, containerRef.current, null, {
                inWrapper: false
              })
                .then(() => console.log('DOCX rendered successfully'))
                .catch(err => {
                  console.error(err);
                  if (containerRef.current) {
                    containerRef.current.innerHTML = `
                      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-main);">
                        <p style="margin-bottom: 1rem; font-weight: 500;">Không thể hiển thị bản xem trước cho file Word này trực tiếp.</p>
                        <a href="${fileUrl}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Tải file về máy để xem
                        </a>
                      </div>`;
                  }
                })
                .finally(() => setLoading(false));
            }
          });
        })
        .catch(err => {
          console.error(err);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="padding: 3rem 1.5rem; text-align: center; color: var(--danger); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
                <p style="font-weight: 500;">${err.message || 'Lỗi tải file từ server.'}</p>
                <a href="${fileUrl}" download class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                  Tải file về máy
                </a>
              </div>`;
          }
          setLoading(false);
        });
    }
  }, [fileUrl, ext]);
  
  if (ext === 'pdf') {
    return (
      <iframe 
        src={fileUrl} 
        title={fileName} 
        style={{ width: '100vw', height: '100vh', border: 'none' }} 
      />
    );
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        zIndex: 10
      }}>
        <FileText size={20} style={{ color: 'var(--primary)', marginRight: '0.5rem' }} />
        <span style={{ fontWeight: '600' }}>{fileName}</span>
      </div>
      
      {/* File Content Container */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="animate-spin" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Đang nạp file...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="docx-preview-container" />
      </div>
    </div>
  );
}
