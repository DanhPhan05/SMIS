import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Search, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_MAP = {
  PENDING: { label: 'Đang chờ giảng viên duyệt', color: '#f59e0b', icon: Clock },
  APPROVED: { label: 'Đã được chấp nhận', color: '#10b981', icon: CheckCircle },
  REJECTED: { label: 'Bị từ chối', color: '#ef4444', icon: XCircle },
};

export default function RequestSupervisor() {
  const [teachers, setTeachers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, requestsRes] = await Promise.allSettled([
        api.get('/teachers/public'), // Uses the new public endpoint
        api.get('/supervision-requests/student')
      ]);
      
      const fetchedTeachers = teachersRes.status === 'fulfilled' ? (teachersRes.value.data || []) : [];
      const fetchedRequests = requestsRes.status === 'fulfilled' ? (requestsRes.value.data || []) : [];
      
      setTeachers(fetchedTeachers);
      setMyRequests(fetchedRequests);
    } catch (err) {
      setTeachers([]);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return toast.warning('Vui lòng chọn giảng viên');
    
    setSending(true);
    try {
      await api.post('/supervision-requests', {
        teacher_id: selectedTeacher.id,
        message
      });
      toast.success('Đã gửi yêu cầu thành công');
      setSelectedTeacher(null);
      setMessage('');
      fetchData(); // Refresh list to show new request
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setSending(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.full_name.toLowerCase().includes(search.toLowerCase()) || 
    t.department?.toLowerCase().includes(search.toLowerCase())
  );

  // Check if student has an active APPROVED request
  const hasApproved = myRequests.some(r => r.status === 'APPROVED');
  // Check if student has a PENDING request
  const hasPending = myRequests.some(r => r.status === 'PENDING');

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Đăng ký Giảng viên Hướng dẫn</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bạn có thể gửi yêu cầu đến các giảng viên trong khoa.</p>
      </div>

      {hasApproved && (
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={24} />
          <div>
            <strong>Chúc mừng!</strong> Bạn đã có giảng viên hướng dẫn. Bạn không thể gửi thêm yêu cầu mới.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Left Column: Teacher List */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Danh sách Giảng viên</h2>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Tìm kiếm giảng viên, khoa..."
              style={{ paddingLeft: '2.5rem' }} 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
            ) : filteredTeachers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy giảng viên</div>
            ) : filteredTeachers.map(t => (
              <div 
                key={t.id} 
                style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: selectedTeacher?.id === t.id ? 'var(--primary-light)' : 'transparent',
                  cursor: (hasApproved || hasPending) ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  if (!hasApproved && !hasPending) setSelectedTeacher(t);
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: selectedTeacher?.id === t.id ? 'var(--primary)' : 'inherit' }}>{t.full_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.department || 'Chưa cập nhật khoa'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Đang hướng dẫn: <strong>{t.student_count || 0}</strong> sinh viên</div>
                </div>
                <div style={{ color: selectedTeacher?.id === t.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <input type="radio" checked={selectedTeacher?.id === t.id} readOnly style={{ accentColor: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Request Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Form */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Gửi Yêu cầu</h2>
            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label className="form-label">Giảng viên nhận</label>
                <input 
                  type="text" 
                  className="input" 
                  value={selectedTeacher ? `${selectedTeacher.full_name} (${selectedTeacher.department || 'N/A'})` : ''} 
                  disabled 
                  placeholder="Vui lòng chọn giảng viên từ danh sách bên trái" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lời nhắn (Tùy chọn)</label>
                <textarea 
                  className="input" 
                  rows="3" 
                  placeholder="Giới thiệu bản thân, đề tài mong muốn hướng dẫn, hoặc nơi đang thực tập..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={hasApproved || hasPending || !selectedTeacher}
                ></textarea>
              </div>
              
              {hasPending && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Bạn đang có 1 yêu cầu chờ duyệt. Không thể gửi thêm cho đến khi có kết quả.
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                disabled={!selectedTeacher || hasApproved || hasPending || sending}
              >
                <Send size={18} /> {sending ? 'Đang gửi...' : 'Gửi Yêu cầu'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="card" style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Lịch sử Yêu cầu</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
              ) : myRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Bạn chưa gửi yêu cầu nào.</div>
              ) : myRequests.map(req => {
                const StatusIcon = STATUS_MAP[req.status].icon;
                return (
                  <div key={req.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem' }}>GV: {req.teacher.full_name}</strong>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(req.request_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: STATUS_MAP[req.status].color, fontWeight: '500', marginBottom: '0.5rem' }}>
                      <StatusIcon size={16} /> {STATUS_MAP[req.status].label}
                    </div>
                    {req.response_note && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        <strong>Phản hồi từ GV:</strong> {req.response_note}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
