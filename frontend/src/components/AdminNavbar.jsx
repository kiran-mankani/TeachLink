// frontend/src/components/AdminNavbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  Settings,
  LogOut,
  Shield,
  UserCircle
} from 'lucide-react';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUnreadCount();
  }, []);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const styles = {
    navbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      height: '100%',
      backgroundColor: 'white',
      borderRadius: '0',
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flex: 1,
    },
    pageTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      background: '#f1f5f9',
      borderRadius: '10px',
      padding: '8px 16px',
      gap: '10px',
      flex: 1,
      maxWidth: '400px',
      transition: 'all 0.3s',
      border: '2px solid transparent',
    },
    searchIcon: {
      color: '#94a3b8',
      width: '18px',
      height: '18px',
      flexShrink: 0,
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '14px',
      color: '#1f1f3e',
      width: '100%',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    searchInputPlaceholder: {
      color: '#94a3b8',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    notificationBtn: {
      position: 'relative',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '8px',
      transition: 'all 0.3s',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationBadge: {
      position: 'absolute',
      top: '-2px',
      right: '-4px',
      background: '#ef4444',
      color: 'white',
      fontSize: '9px',
      fontWeight: '700',
      padding: '1px 5px',
      borderRadius: '50%',
      minWidth: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
    },
    profileSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      padding: '6px 12px',
      borderRadius: '10px',
      transition: 'all 0.3s',
      position: 'relative',
    },
    profileAvatar: {
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden',
    },
    profileAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    profileInfo: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: '1.3',
    },
    profileName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    profileRole: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    profileChevron: {
      color: '#94a3b8',
      width: '16px',
      height: '16px',
      transition: 'transform 0.3s',
    },
    profileChevronOpen: {
      transform: 'rotate(180deg)',
    },
    // Dropdown Menu
    dropdownMenu: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: '0',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      border: '1px solid #e8e8e8',
      minWidth: '220px',
      padding: '8px',
      zIndex: 1000,
      overflow: 'hidden',
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#1f1f3e',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      background: 'none',
      width: '100%',
      textAlign: 'left',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    dropdownItemHover: {
      background: '#f1f5f9',
    },
    dropdownItemDanger: {
      color: '#ef4444',
    },
    dropdownItemDangerHover: {
      background: '#fef2f2',
    },
    dropdownDivider: {
      height: '1px',
      background: '#e8e8e8',
      margin: '4px 8px',
    },
    dropdownIcon: {
      width: '18px',
      height: '18px',
      flexShrink: 0,
    },
    // Responsive
    mobileSearch: {
      display: 'none',
    },
  };

  // Mobile responsive styles
  const responsiveStyles = {
    '@media (max-width: 768px)': {
      searchWrapper: {
        display: 'none',
      },
      mobileSearch: {
        display: 'flex',
      },
      profileInfo: {
        display: 'none',
      },
    },
  };

  return (
    <div style={styles.navbar}>
      {/* Left Section */}
      <div style={styles.leftSection}>
        <div style={styles.pageTitle}>
          {/* Title will be dynamic based on route */}
        </div>

        {/* Search Bar */}
        <div style={styles.searchWrapper}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search teachers, students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              e.target.parentElement.style.borderColor = '#4F46E5';
              e.target.parentElement.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.parentElement.style.borderColor = 'transparent';
              e.target.parentElement.style.background = '#f1f5f9';
            }}
          />
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        {/* Notifications */}
        <button
          style={styles.notificationBtn}
          onClick={() => navigate('/admin/notifications')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={styles.notificationBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Section */}
        <div
          style={styles.profileSection}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            if (!showProfileMenu) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <div style={styles.profileAvatar}>
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name || 'Admin'}
                style={styles.profileAvatarImage}
              />
            ) : (
              getInitials(user?.name || 'Admin')
            )}
          </div>
          <div style={styles.profileInfo}>
            <span style={styles.profileName}>{user?.name || 'Admin'}</span>
            <span style={styles.profileRole}>
              <Shield size={12} /> Admin
            </span>
          </div>
          <ChevronDown
            style={{
              ...styles.profileChevron,
              ...(showProfileMenu ? styles.profileChevronOpen : {}),
            }}
          />

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div style={styles.dropdownMenu}>
              <button
                style={styles.dropdownItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/admin/profile');
                }}
              >
                <UserCircle style={styles.dropdownIcon} />
                My Profile
              </button>
              <button
                style={styles.dropdownItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/admin/settings');
                }}
              >
                <Settings style={styles.dropdownIcon} />
                Settings
              </button>
              <div style={styles.dropdownDivider} />
              <button
                style={{
                  ...styles.dropdownItem,
                  ...styles.dropdownItemDanger,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
              >
                <LogOut style={styles.dropdownIcon} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;