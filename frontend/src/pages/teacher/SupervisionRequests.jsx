import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_MAP = {
  PENDING: { label: 'Chờ duyệt', color: '#f59e0b', icon: Clock },
  APPROVED: { label: 'Đã chấp nhận', color: '#10b981', icon: CheckCircle },
  REJECTED: { label: 'Đã từ chối', color: '#ef4444', icon: XCircle },
};

export default function SupervisionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [responseNote, setResponseNote] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  const toast = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/supervision-requests/teacher', { params: { status: filter } });
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchRequests();
    // Also mark notifications as read when entering this page
    api.patch('/supervision-requests/notifications/read-all').catch(() => {});
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'approve' ? 'CHẤP NHẬN' : 'TỪ CHỐI'} yêu cầu này?`)) return;
    
    setProcessingId(id);
    try {
      await api.patch(`/supervision-requests/${id}/${action}`, { response_note: responseNote });
      toast.success(action === 'approve' ? 'Đã chấp nhận hướng dẫn' : 'Đã từ chối yêu cầu');
      setResponseNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Yêu cầu Hướng dẫn từ Sinh viên</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${filter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('PENDING')}>Chờ duyệt</button>
          <button className={`btn ${filter === 'APPROVED' ? 'btn-success' : 'btn-outline'}`} onClick={() => setFilter('APPROVED')}>Đã chấp nhận</button>
          <button className={`btn ${filter === 'REJECTED' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setFilter('REJECTED')}>Đã từ chối</button>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Khóa (Batch)</th>
                <th>Công ty thực tập</th>
                <th>Lời nhắn</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                {filter === 'PENDING' && <th style={{ textAlign: 'right' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không có yêu cầu nào</td></tr>
              ) : requests.map(req => {
                const StatusIcon = STATUS_MAP[req.status].icon;
                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{req.student.full_name || `${req.student.ho_ten_lot || ''} ${req.student.ten || ''}`.trim()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.student.student_code}</div>
                    </td>
                    <td>{req.student.batch || '-'}</td>
                    <td>{req.student.company?.name || <span style={{ color: 'var(--text-muted)' }}>Chưa có công ty</span>}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.message}>
                        {req.message || <span style={{ color: 'var(--text-muted)' }}>Không có lời nhắn</span>}
                      </div>
                    </td>
                    <td>{new Date(req.request_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: STATUS_MAP[req.status].color, fontWeight: '500' }}>
                        <StatusIcon size={16} /> {STATUS_MAP[req.status].label}
                      </div>
                      {req.response_date && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{new Date(req.response_date).toLocaleDateString('vi-VN')}</div>}
                    </td>
                    
                    {filter === 'PENDING' && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <input 
                            type="text" 
                            className="input" 
                            placeholder="Ghi chú (tùy chọn)..." 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '200px' }}
                            value={responseNote}
                            onChange={(e) => setResponseNote(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                              disabled={processingId === req.id}
                              onClick={() => handleAction(req.id, 'approve')}
                            >
                              Chấp nhận
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                              disabled={processingId === req.id}
                              onClick={() => handleAction(req.id, 'reject')}
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
