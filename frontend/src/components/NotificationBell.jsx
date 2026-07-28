import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const NotificationBell = ({ role, refreshTrigger }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications(token);
      setNotifications(data.notifications || []);
      const unread = data.notifications?.filter(n => !n.read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Load notifications on mount and auto-refresh every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchNotifications();
    }
  }, [refreshTrigger]);

  // Mark notification as read
  const handleMarkRead = async (notifId) => {
    try {
      await api.markNotificationRead(token, notifId);
      setNotifications(prev => prev.map(n => 
        n._id === notifId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  // Handle click on notification
  const handleClick = (notif) => {
    handleMarkRead(notif._id);
    setShowDropdown(false);
    
    if (role === 'teacher' && notif.type === 'new_request') {
      navigate('/teacher/requests');
    } else if (role === 'student' && notif.type === 'request_accepted') {
      navigate('/student-dashboard');
    } else if (role === 'student' && notif.type === 'request_rejected') {
      // Show alert or just close
    } else if (role === 'student' && notif.type === 'request_cancelled') {
      // Just close
    }
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch(type) {
      case 'new_request': return '📩';
      case 'request_accepted': return '✅';
      case 'request_rejected': return '❌';
      case 'request_cancelled': return '⚠️';
      default: return '🔔';
    }
  };

  // ✅ Updated: Format date as "17 Jul 2026, 1:05 PM" or hide if not available
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString('en-US', options);
    } catch {
      return '';
    }
  };

  // View all notifications
  const handleViewAll = () => {
    setShowDropdown(false);
    if (role === 'teacher') {
      navigate('/teacher/notifications');
    } else {
      navigate('/student/notifications');
    }
  };

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block'
    },
    bellButton: {
      position: 'relative',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px',
      color: 'white',
      transition: 'opacity 0.3s'
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      fontSize: '10px',
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      border: '2px solid #1e40af'
    },
    dropdown: {
      position: 'absolute',
      top: '40px',
      right: '-100px',
      width: '360px',
      maxHeight: '420px',
      backgroundColor: 'white',
      borderRadius: '14px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      border: '1px solid #e8e8e8',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif"
    },
    dropdownHeader: {
      padding: '12px 18px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f8faff'
    },
    dropdownTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    viewAllBtn: {
      fontSize: '13px',
      color: '#3b82f6',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      padding: '4px 8px',
      borderRadius: '6px'
    },
    notifList: {
      maxHeight: '320px',
      overflowY: 'auto'
    },
    notifItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #f5f5f5',
      transition: 'background 0.2s'
    },
    notifItemUnread: {
      backgroundColor: '#f8faff'
    },
    notifIcon: {
      fontSize: '18px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#f0f4ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    notifContent: {
      flex: 1,
      minWidth: 0
    },
    notifTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    notifMessage: {
      fontSize: '12px',
      color: '#666',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    // ✅ Updated: Time style - smaller, subtle
    notifTime: {
      fontSize: '10px',
      color: '#999',
      marginTop: '2px'
    },
    emptyState: {
      padding: '30px 20px',
      textAlign: 'center',
      color: '#94a3b8'
    },
    emptyIcon: {
      fontSize: '32px',
      marginBottom: '8px'
    },
    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      flexShrink: 0
    }
  };

  const topNotifications = notifications.slice(0, 5);

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        style={styles.bellButton}
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>🔔 Notifications</span>
            <button 
              style={styles.viewAllBtn} 
              onClick={handleViewAll}
              onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              View All →
            </button>
          </div>

          <div style={styles.notifList}>
            {topNotifications.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔔</div>
                <div style={{ fontSize: '14px', color: '#666' }}>No notifications</div>
              </div>
            ) : (
              topNotifications.map((notif) => {
                const formattedDate = formatDate(notif.created_at);
                
                return (
                  <div
                    key={notif._id}
                    style={{
                      ...styles.notifItem,
                      ...(!notif.read ? styles.notifItemUnread : {})
                    }}
                    onClick={() => handleClick(notif)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f4ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !notif.read ? '#f8faff' : 'white';
                    }}
                  >
                    <div style={styles.notifIcon}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={styles.notifContent}>
                      <div style={styles.notifTitle}>{notif.title || 'Notification'}</div>
                      <div style={styles.notifMessage}>{notif.message}</div>
                      {/* ✅ Only show date if available, else hide */}
                      {formattedDate && (
                        <div style={styles.notifTime}>{formattedDate}</div>
                      )}
                    </div>
                    {!notif.read && <div style={styles.dot} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;