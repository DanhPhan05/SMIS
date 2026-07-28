import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, pendingReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fix: Lấy dữ liệu thực từ API thay vì hardcode
        const [studRes, repRes] = await Promise.all([
          api.get('/students?limit=100'),
          api.get('/reports?status=submitted&limit=100'),
        ]);
        setStats({
          students: studRes.data.pagination?.total || 0,
          pendingReports: repRes.data.pagination?.total || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Xin chào Giảng viên {user?.full_name}
      </h1>

      <div className="grid grid-cols-2">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: '#3b82f620', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sinh viên hướng dẫn</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{loading ? '...' : stats.students}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Báo cáo chờ duyệt</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{loading ? '...' : stats.pendingReports}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Thao tác nhanh</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Truy cập <strong>SV Hướng dẫn</strong> để xem danh sách sinh viên của bạn, hoặc <strong>Báo cáo &amp; Chấm điểm</strong> để xem xét báo cáo hàng tuần.
        </p>
      </div>
    </DashboardLayout>
  );
}
