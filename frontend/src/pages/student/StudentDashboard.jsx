import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_MAP = {
  not_started: 'Chưa bắt đầu',
  in_progress: 'Đang thực tập',
  completed: 'Hoàn thành',
  suspended: 'Tạm dừng',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setProfile(res.data.profile);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getFullName = (p) => {
    if (!p) return '';
    return p.full_name || `${p.ho_ten_lot || ''} ${p.ten || ''}`.trim();
  };

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Thông tin Thực tập</h1>

      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Thông tin cá nhân
          </h2>
          {loading ? <p>Đang tải...</p>
            : profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>Họ tên:</strong> {getFullName(profile)}</div>
                <div><strong>Mã SV:</strong> {profile.student_code}</div>
                <div><strong>Lớp:</strong> {profile.class_name || '-'}</div>
                <div><strong>Ngành:</strong> {profile.major || '-'}</div>
                <div><strong>Email:</strong> {profile.email || '-'}</div>
                <div><strong>SĐT:</strong> {profile.phone || '-'}</div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Chưa có thông tin hồ sơ. Liên hệ admin để cập nhật.</p>
            )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Thông tin thực tập & Hướng dẫn
          </h2>
          {loading ? <p>Đang tải...</p>
            : profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <strong>Trạng thái:</strong>{' '}
                  <span className={`badge ${profile.internship_status === 'in_progress' ? 'badge-success' : 'badge-warning'}`}>
                    {STATUS_MAP[profile.internship_status] || profile.internship_status}
                  </span>
                </div>
                <div><strong>Doanh nghiệp:</strong> {profile.company?.name || 'Chưa phân công'}</div>
                <div><strong>GVHD:</strong> {profile.teacher?.full_name || 'Chưa phân công'}</div>

                {profile.company && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>Liên hệ Doanh nghiệp:</div>
                    {profile.nguoi_tiep_nhan && (
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <strong>Người tiếp nhận:</strong> {profile.nguoi_tiep_nhan} {profile.chuc_vu_nguoi_tiep_nhan ? `(${profile.chuc_vu_nguoi_tiep_nhan})` : ''} 
                        {profile.sdt_nguoi_tiep_nhan && ` - SĐT: ${profile.sdt_nguoi_tiep_nhan}`}
                      </div>
                    )}
                    {profile.nguoi_huong_dan && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <strong>Người hướng dẫn:</strong> {profile.nguoi_huong_dan} {profile.chuc_vu_nguoi_huong_dan ? `(${profile.chuc_vu_nguoi_huong_dan})` : ''}
                        {profile.sdt_nguoi_huong_dan && ` - SĐT: ${profile.sdt_nguoi_huong_dan}`}
                      </div>
                    )}
                    {!profile.nguoi_tiep_nhan && !profile.nguoi_huong_dan && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chưa cập nhật thông tin liên hệ tại doanh nghiệp.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Chưa có thông tin phân công.</p>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
