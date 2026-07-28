import DashboardLayout from '../../layouts/DashboardLayout';
import { Users, Building, GraduationCap, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
const BATCH_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCompanies: 0,
    totalRequests: 0,
    statusCounts: [],
    completionRate: 0,
  });
  
  const [batchStats, setBatchStats] = useState([]);
  const [reportStats, setReportStats] = useState({ weeklyTrend: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [overviewRes, batchRes, reportRes] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/stats/by-batch'),
          api.get('/stats/reports')
        ]);
        
        setStats(overviewRes.data);
        
        // Format batch stats for BarChart
        const formattedBatches = overviewRes.data.totalStudents === 0 ? [] : batchRes.data.map(b => ({
          name: b.batch,
          'Số lượng': parseInt(b.count, 10)
        }));
        setBatchStats(formattedBatches);
        
        setReportStats(reportRes.data);
      } catch (err) {
        console.error('Lỗi khi tải thống kê', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStats();
  }, []);

  const statCards = [
    { title: 'Sinh viên', value: stats.totalStudents, icon: GraduationCap, color: '#3b82f6' },
    { title: 'Giảng viên', value: stats.totalTeachers, icon: Users, color: '#10b981' },
    { title: 'Doanh nghiệp', value: stats.totalCompanies, icon: Building, color: '#f59e0b' },
    { title: 'Yêu cầu HD', value: stats.totalRequests, icon: Briefcase, color: '#8b5cf6' },
  ];

  // Format data for PieChart
  const pieData = stats.statusCounts.map(s => ({
    name: s.internship_status === 'completed' ? 'Hoàn thành' : 
          s.internship_status === 'in_progress' ? 'Đang thực tập' : 
          s.internship_status === 'suspended' ? 'Tạm dừng' : 'Chưa bắt đầu',
    value: parseInt(s.count, 10)
  }));

  // Format data for LineChart
  const lineData = (reportStats.weeklyTrend || []).map(r => ({
    name: `Tuần ${r.week_number}`,
    'Báo cáo': parseInt(r.count, 10)
  }));

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Tổng quan Hệ thống (SIMS 4.0)</h1>
        <div className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          Tỉ lệ hoàn thành: {stats.completionRate}%
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} />
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {loading ? '...' : s.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2" style={{ marginTop: '1.5rem' }}>
        
        {/* Pie Chart */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Trạng thái Thực tập</h2>
          {loading ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div> : 
           pieData.length === 0 ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div> :
          (
            <div className="stat-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sinh viên theo Khóa (Batch)</h2>
          {loading ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div> : 
           batchStats.length === 0 ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div> :
          (
            <div className="stat-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="Số lượng" radius={[4, 4, 0, 0]}>
                    {batchStats.map((entry, index) => <Cell key={`cell-${index}`} fill={BATCH_COLORS[index % BATCH_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tiến độ Nộp Báo cáo Hàng tuần</h2>
          {loading ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div> : 
           lineData.length === 0 ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div> :
          (
            <div className="stat-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Báo cáo" stroke="var(--primary)" activeDot={{ r: 8 }} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
