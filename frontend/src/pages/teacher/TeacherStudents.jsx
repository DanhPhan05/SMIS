import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';

const STATUS_MAP = {
  not_started: { label: 'Chưa bắt đầu', cls: 'badge-warning' },
  in_progress: { label: 'Đang thực tập', cls: 'badge-success' },
  completed: { label: 'Hoàn thành', cls: 'badge-info' },
  suspended: { label: 'Tạm dừng', cls: 'badge-danger' },
};

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students?limit=100').then(res => {
      setStudents(res.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sinh viên Hướng dẫn</h1>
      <div className="card" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead><tr><th>Mã SV</th><th>Họ tên</th><th>SĐT</th><th>Lớp</th><th>Công ty</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                : students.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Chưa có sinh viên nào</td></tr>
                : students.map(s => {
                  const st = STATUS_MAP[s.internship_status] || { label: s.internship_status, cls: 'badge-info' };
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.student_code}</strong></td>
                      <td>{s.full_name || `${s.ho_ten_lot || ''} ${s.ten || ''}`.trim()}</td>
                      <td>{s.phone || '-'}</td>
                      <td>{s.class_name || '-'}</td>
                      <td>{s.company?.name || '-'}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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
