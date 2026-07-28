import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, GraduationCap, UserCheck, Sparkles, ShieldCheck } from 'lucide-react';
import HuflitLogo from '../components/HuflitLogo';

const ROLES_CONFIG = {
  student: {
    id: 'student',
    title: 'Sinh viên',
    icon: GraduationCap,
    email: 'k23001@student.edu.vn',
    pass: 'Student@123',
    description: 'Dành cho Sinh viên thực tập'
  },
  teacher: {
    id: 'teacher',
    title: 'Giảng viên',
    icon: UserCheck,
    email: 'gvhd01@university.edu.vn',
    pass: 'Teacher@123',
    description: 'Dành cho Giảng viên hướng dẫn'
  }
};

export default function Login() {
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'teacher') navigate('/teacher', { replace: true });
      else if (user.role === 'student') navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleRoleChange = (roleKey) => {
    setActiveRole(roleKey);
    setError('');
  };

  const handleFillDemo = (roleKey) => {
    const config = ROLES_CONFIG[roleKey];
    if (config) {
      setEmail(config.email);
      setPassword(config.pass);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  const currentConfig = ROLES_CONFIG[activeRole];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ margin: '0 auto 0.75rem auto' }}>
            <HuflitLogo width={180} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#002b5c' }}>CỔNG ĐĂNG NHẬP HỆ THỐNG</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Quản lý thực tập sinh viên (SIMS)</p>
        </div>

        {/* Role Tabs for Student & Teacher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem', backgroundColor: 'var(--background)', padding: '0.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {Object.values(ROLES_CONFIG).map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} />
                <span>{role.title}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email ({currentConfig.title})</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={`Nhập email ${currentConfig.title.toLowerCase()}`}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : `Đăng nhập ${currentConfig.title}`}
          </button>
        </form>

        {/* Dedicated Single Demo Account per role (Student or Teacher) */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <div style={{
            padding: '0.875rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Sparkles size={14} /> Demo Account ({currentConfig.title})
              </span>
              <button
                type="button"
                onClick={() => handleFillDemo(activeRole)}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--surface)' }}
              >
                Điền nhanh
              </button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text)', wordBreak: 'break-all' }}>
              <div><strong>Email:</strong> {currentConfig.email}</div>
              <div><strong>Password:</strong> {currentConfig.pass}</div>
            </div>
          </div>
        </div>

        {/* Separate Admin portal link */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link to="/admin/login" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShieldCheck size={14} /> Đăng nhập dành cho Quản trị viên
          </Link>
        </div>
      </div>
    </div>
  );
}


