import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import HuflitLogo from '../components/HuflitLogo';

export default function AdminLogin() {
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

  const handleFillDemo = () => {
    setEmail('admin@huflit.edu.vn');
    setPassword('Admin@2026');
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderTop: '4px solid var(--primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ margin: '0 auto 0.75rem auto' }}>
            <HuflitLogo width={180} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#002b5c' }}>CỔNG QUẢN TRỊ HỆ THỐNG</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Dành riêng cho Admin Management</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Admin</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@huflit.edu.vn"
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
            {loading ? 'Đang xử lý...' : 'Đăng nhập Quản trị viên'}
          </button>
        </form>

        {/* Dedicated Admin Demo Account ONLY */}
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
                <Sparkles size={14} /> Demo Account (Admin)
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--surface)' }}
              >
                Điền nhanh
              </button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text)', wordBreak: 'break-all' }}>
              <div><strong>Email:</strong> admin@huflit.edu.vn</div>
              <div><strong>Password:</strong> Admin@2026</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Quay lại trang Sinh viên & Giảng viên
          </Link>
        </div>
      </div>
    </div>
  );
}
