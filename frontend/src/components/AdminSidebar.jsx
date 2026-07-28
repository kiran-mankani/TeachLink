// frontend/src/components/AdminSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  CalendarCheck,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/teachers', icon: Users, label: 'Teachers' },
    { path: '/admin/students', icon: GraduationCap, label: 'Students' },
    { path: '/admin/enrollments', icon: BookOpen, label: 'Enrollments' },
    { path: '/admin/payments', icon: DollarSign, label: 'Payments' },
    { path: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

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
    sidebarHeader: {
      padding: '16px 20px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
      flexShrink: 0,
    },
    logoIcon: {
      fontSize: '32px',
      display: 'block',
      marginBottom: '2px',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'white',
      letterSpacing: '0.5px',
    },
    logoSub: {
      fontSize: '8px',
      color: 'rgba(255,255,255,0.3)',
      fontWeight: '400',
      marginTop: '0px',
      letterSpacing: '2.5px',
      textTransform: 'uppercase',
    },
    logoAdmin: {
      fontSize: '9px',
      color: '#a78bfa',
      fontWeight: '600',
      marginTop: '2px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: 'rgba(167, 139, 250, 0.15)',
      padding: '2px 12px',
      borderRadius: '12px',
      display: 'inline-block',
    },
    nav: {
      flex: 1,
      padding: '12px 14px 12px',
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
      width: '20px',
      height: '20px',
      flexShrink: 0,
    },
    navText: {
      flex: 1,
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
      width: '20px',
      height: '20px',
      flexShrink: 0,
    },
    // Scrollbar styles
    scrollbar: {
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    },
  };

  // Scrollbar styles for the nav container
  const navStyles = {
    ...styles.nav,
    ...styles.scrollbar,
  };

  return (
    <div style={styles.sidebar}>
      {/* Header - Logo */}
      <div style={styles.sidebarHeader}>
        <span style={styles.logoIcon}>🎓</span>
        <div style={styles.logoText}>TeachLink</div>
        <div style={styles.logoSub}>AI Tutoring Platform</div>
        <div style={styles.logoAdmin}>Admin Panel</div>
      </div>

      {/* Navigation */}
      <nav style={navStyles}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
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
              <Icon style={styles.navIcon} />
              <span style={styles.navText}>{item.label}</span>
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
          <LogOut style={styles.logoutIcon} />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminSidebar;