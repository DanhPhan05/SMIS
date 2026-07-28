import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Building, BookOpen, GraduationCap, LayoutDashboard, Menu, FileText, Upload, Bell, Award, User, ChevronUp, CheckCircle, XCircle, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import HuflitLogo from '../components/HuflitLogo';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const location = useLocation();

  const fetchNotifications = () => {
    if (user) {
      api.get('/supervision-requests/notifications')
        .then(res => {
          setUnreadCount(res.data.unreadCount || 0);
          setNotifications(res.data.notifications || []);
        })
        .catch(err => console.error('Failed to fetch notifications', err));
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds to save Supabase free-tier egress
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/supervision-requests/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/supervision-requests/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const getMenuByRole = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
          { name: 'Doanh nghiệp', path: '/admin/companies', icon: Building },
          { name: 'Giảng viên', path: '/admin/teachers', icon: Users },
          { name: 'Sinh viên', path: '/admin/students', icon: GraduationCap },
          { name: 'Import dữ liệu', path: '/admin/import', icon: Upload },
          { name: 'Phân công', path: '/admin/assignments', icon: BookOpen },
        ];
      case 'teacher':
        return [
          { name: 'Tổng quan', path: '/teacher', icon: LayoutDashboard },
          { name: 'SV Hướng dẫn', path: '/teacher/students', icon: Users },
          { name: 'Yêu cầu HD', path: '/teacher/requests', icon: Bell, badge: unreadCount },
          { name: 'Báo cáo tuần', path: '/teacher/reports', icon: FileText },
          { name: 'Chấm điểm', path: '/teacher/grading', icon: Award },
        ];
      case 'student':
        return [
          { name: 'Thông tin TT', path: '/student', icon: LayoutDashboard },
          { name: 'Xin Giảng viên', path: '/student/supervisor', icon: Users },
          { name: 'Báo cáo tuần', path: '/student/reports', icon: FileText },
          { name: 'Xem điểm', path: '/student/scores', icon: Award },
        ];
      default:
        return [];
    }
  };

  const getRoleDisplayName = () => {
    if (user?.role === 'student') return 'Sinh viên';
    if (user?.role === 'teacher') return 'Giảng viên';
    if (user?.role === 'admin') return 'Quản trị viên';
    return 'Người dùng';
  };

  const getUserCode = () => {
    if (user?.student_code) return user.student_code;
    if (user?.teacher_code) return user.teacher_code;
    if (user?.username && user.username !== user.role) return user.username;
    return '';
  };

  const menu = getMenuByRole();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Left Navigation Sidebar (Extends full height from top) */}
      <aside style={{ 
        width: sidebarOpen ? '260px' : '0px', 
        backgroundColor: '#0c2847', 
        transition: 'all 0.25s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sidebarOpen ? '3px 0 10px rgba(0,0,0,0.15)' : 'none',
        zIndex: 10
      }}>
        {/* Top Logo Container inside Sidebar */}
        <div style={{ padding: '1.25rem 1rem', textAlign: 'center', backgroundColor: '#0c2847', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <HuflitLogo width={160} />
        </div>

        {/* User Info Card inside Sidebar */}
        <div style={{ padding: '1rem 1rem 0.75rem 1rem' }}>
          <div style={{
            backgroundColor: '#061a33',
            borderRadius: '10px',
            padding: '1.25rem 1rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#334155',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              color: '#cbd5e1',
              border: '2px solid rgba(255,255,255,0.15)',
              boxSizing: 'border-box',
              padding: 0
            }}>
              <User size={30} style={{ display: 'block', margin: 0 }} />
            </div>
            <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              {getUserCode() ? getUserCode() : (user?.full_name || user?.username)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>
              {getRoleDisplayName()} {getUserCode() ? `- ${getUserCode()}` : ''}
            </div>
          </div>
        </div>

        {/* Sidebar Menu Header ("CHỨC NĂNG") */}
        <div style={{ padding: '0.25rem 0.75rem 0.5rem 0.75rem' }}>
          <button 
            onClick={() => setMenuExpanded(!menuExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              backgroundColor: '#133863',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            <span>CHỨC NĂNG</span>
            <ChevronUp size={16} style={{ transform: menuExpanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Navigation Items List */}
        {menuExpanded && (
          <nav style={{ padding: '0.25rem 0.75rem 1.5rem 0.75rem', flex: 1 }}>
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.375rem',
                    borderRadius: '4px',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? '#164e87' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <Icon size={18} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '0.125rem 0.45rem', backgroundColor: '#ef4444' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </aside>

      {/* Main Container (Header + Content Area to the Right of Sidebar) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Streamlined Site Header (Top Bar to the Right of Sidebar) */}
        <header style={{ 
          height: '54px', 
          backgroundColor: '#072446', 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 1.25rem',
          borderBottom: '2px solid #ff7a00',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          zIndex: 5
        }}>
          {/* Header Left Title & Ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0, marginRight: '1rem' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              style={{ color: '#ffffff', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.35rem', borderRadius: '4px', background: 'transparent', border: 'none' }}
              title="Ẩn/Hiện Sidebar"
            >
              <Menu size={22} />
            </button>
            
            <span style={{ 
              color: '#ff7a00', 
              fontWeight: '800', 
              fontSize: '0.95rem', 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - TIN HỌC TP. HỒ CHÍ MINH
            </span>

            {/* Announcement Ticker */}
            <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', color: '#e2e8f0', fontSize: '0.825rem', opacity: 0.95, marginLeft: '1rem' }}>
              <marquee behavior="scroll" direction="left" scrollamount="4">
                🔥 Thông báo: Cổng Thông Tin Quản Lý Thực Tập (SIMS) - Trường Đại học Ngoại ngữ - Tin học TP. Hồ Chí Minh
              </marquee>
            </div>
          </div>

          {/* Header Right Controls: Streamlined Account Icon & Bell Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, position: 'relative' }}>
            
            {/* Notification Bell Dropdown Popover */}
            <div ref={notifMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setNotifMenuOpen(!notifMenuOpen);
                  if (!notifMenuOpen) fetchNotifications();
                }}
                style={{
                  position: 'relative',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none'
                }}
                title="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 3px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #072446',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications List Popover */}
              {notifMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: '-10px',
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  border: '1px solid #cbd5e1',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Popover Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#072446',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff7a00',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          marginLeft: 'auto'
                        }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleMarkRead(item.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: item.is_read ? '#ffffff' : '#f0f9ff',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ marginTop: '2px', color: item.type === 'request_approved' ? '#16a34a' : item.type === 'request_rejected' ? '#dc2626' : '#2563eb', flexShrink: 0 }}>
                            {item.type === 'request_approved' ? <CheckCircle size={18} /> : item.type === 'request_rejected' ? <XCircle size={18} /> : <Info size={18} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.825rem', fontWeight: item.is_read ? '600' : '700', color: '#1e293b', marginBottom: '0.15rem' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: '#475569', lineHeight: '1.3' }}>
                              {item.message}
                            </div>
                            <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                              {new Date(item.created_at || item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.created_at || item.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          {!item.is_read && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb', marginTop: '6px', flexShrink: 0 }}></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Circular Account Icon with Popover Menu */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  color: '#ffffff',
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
                title="Tài khoản"
              >
                <User size={22} style={{ display: 'block', margin: 0 }} />
              </button>

              {/* Exact Account Popover Dropdown matching screenshot */}
              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: '-4px',
                  width: '210px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  border: '1px solid #cbd5e1',
                  padding: '1.25rem 1rem',
                  zIndex: 1000,
                  textAlign: 'center'
                }}>
                  {/* Account Code (MSSV/MSGV/Username) */}
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '1rem', 
                    color: '#475569', 
                    letterSpacing: '0.5px',
                    marginBottom: '0.2rem' 
                  }}>
                    {getUserCode() || user?.full_name || user?.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {getRoleDisplayName()}
                  </div>

                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.875rem 0' }}></div>

                  {/* Outlined Logout Button */}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 1rem',
                      backgroundColor: '#ffffff',
                      color: '#072446',
                      border: '1px solid #072446',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f1f5f9' }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
