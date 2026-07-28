// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role, refreshTrigger }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Fetch unread notification count from database
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // ✅ Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
    }
  }, [token, refreshTrigger]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const styles = {
    sidebar: {
      width: '270px',
      height: '100vh',
      background: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)',
      color: 'white',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '4px 0 30px rgba(0,0,0,0.4)',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      transition: 'all 0.3s ease',
    },
    header: {
      padding: '10px 10px 5px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
    },
    logoIcon: {
      fontSize: '38px',
      display: 'block',
      marginBottom: '4px',
    },
    logoText: {
      fontSize: '22px',
      fontWeight: '700',
      color: 'white',
      letterSpacing: '0.5px',
    },
    logoSub: {
      fontSize: '9px',
      color: 'rgba(255,255,255,0.3)',
      fontWeight: '400',
      marginTop: '0px',
      letterSpacing: '2.5px',
      textTransform: 'uppercase',
    },
    nav: {
      flex: 1,
      padding: '12px 12px 12px',
      overflowY: 'auto',
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '10px 14px',
      borderRadius: '10px',
      color: 'rgba(255,255,255,0.45)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.25s ease',
      marginBottom: '2px',
      cursor: 'pointer',
      position: 'relative',
    },
    navItemActive: {
      background: '#4F46E5',
      color: 'white',
      boxShadow: '0 2px 12px rgba(79, 70, 229, 0.3)',
    },
    navItemActiveBorder: {
      position: 'absolute',
      left: 0,
      top: '20%',
      height: '60%',
      width: '4px',
      background: 'white',
      borderRadius: '0 4px 4px 0',
    },
    navIcon: {
      fontSize: '18px',
      width: '24px',
      textAlign: 'center',
      flexShrink: 0,
    },
    navText: {
      flex: 1,
    },
    // ✅ Notification Badge - Like WhatsApp/LinkedIn
    badge: {
      background: '#ef4444',
      color: 'white',
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 8px',
      borderRadius: '12px',
      marginLeft: 'auto',
      minWidth: '20px',
      textAlign: 'center',
      lineHeight: '1.4',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
      border: '2px solid #302b63',
    },
    divider: {
      height: '1px',
      background: 'rgba(255,255,255,0.06)',
      margin: '8px 14px 10px',
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '10px 14px',
      borderRadius: '10px',
      color: 'rgba(255,255,255,0.3)',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
      marginTop: '4px',
      border: 'none',
      background: 'none',
      width: '100%',
      textAlign: 'left',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    logoutIcon: {
      fontSize: '18px',
      width: '24px',
      textAlign: 'center',
      flexShrink: 0,
    },
  };

  // TEACHER NAVIGATION ITEMS
  const teacherNavItems = [
    { path: '/teacher-dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/teacher-profile', icon: '👤', label: 'My Profile' },
    { path: '/teacher/requests', icon: '📋', label: 'Requests' },
    { path: '/teacher/manage-schedule', icon: '📅', label: 'Manage Schedule' },
    { path: '/teacher/notifications', icon: '🔔', label: 'Notifications', showBadge: true },
    { path: '/teacher/my-students', icon: '👨‍🎓', label: 'My Students' },
    { path: '/teacher/find-students', icon: '🔍', label: 'Find Students' },
    { path: '/teacher/messages', icon: '💬', label: 'Messages' },
    { path: '/teacher/earnings', icon: '💰', label: 'Earnings' },
    { path: '/teacher/attendance', icon: '📊', label: 'Attendance' },
    { path: '/teacher/settings', icon: '⚙️', label: 'Settings' },
  ];

  // STUDENT NAVIGATION ITEMS
  const studentNavItems = [
    { path: '/student-dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/student-profile', icon: '👤', label: 'My Profile' },
    { path: '/student/requests', icon: '📋', label: 'Requests' },
    { path: '/student/courses', icon: '📚', label: 'My Courses' },
    { path: '/student/notifications', icon: '🔔', label: 'Notifications', showBadge: true },
    { path: '/find-tutor', icon: '🔍', label: 'Find Tutors' },
    { path: '/student/messages', icon: '💬', label: 'Messages' },
    { path: '/student/payment', icon: '💳', label: 'Payments' },
    { path: '/student/attendance', icon: '📊', label: 'Attendance' },
    
  ];

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div style={styles.sidebar}>
      {/* Header - Logo Uper */}
      <div style={styles.header}>
        <span style={styles.logoIcon}>🎓</span>
        <div style={styles.logoText}>TeachLink</div>
        <div style={styles.logoSub}>AI Tutoring Platform</div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const isNotificationItem = item.showBadge;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              {active && <span style={styles.navItemActiveBorder} />}
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navText}>{item.label}</span>
              {/* ✅ Notification Badge - Only show when unread > 0 */}
              {isNotificationItem && unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount}</span>
              )}
            </Link>
          );
        })}

        <div style={styles.divider} />

        {/* Logout */}
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          disabled={isLoggingOut}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
          }}
        >
          <span style={styles.logoutIcon}>🚪</span>
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;