import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function FileViewerPage() {
  const [searchParams] = useSearchParams();
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'File Preview';
  const ext = fileName.split('.').pop().toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (ext === 'docx' && fileUrl && containerRef.current) {
      setLoading(true);
      fetch(fileUrl)
        .then(res => res.blob())
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
                    containerRef.current.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);">Không thể hiển thị file Word này trực tiếp. Vui lòng tải về để xem.</div>';
                  }
                })
                .finally(() => setLoading(false));
            }
          });
        })
        .catch(err => {
          console.error(err);
          if (containerRef.current) {
            containerRef.current.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);">Lỗi tải file từ máy chủ.</div>';
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
