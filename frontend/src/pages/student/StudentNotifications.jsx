// frontend/src/pages/student/StudentNotifications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // ✅ Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch (err) {
      setError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ Mark notification as read and refresh badge
  const markAsRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, read: true } : n)
      );
      
      setRefreshTrigger(prev => !prev);
      
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // ✅ Mark all as read
  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;
    
    try {
      await Promise.all(
        unreadNotifs.map(n => 
          fetch(`/api/notifications/${n._id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      setRefreshTrigger(prev => !prev);
      
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // ✅ Navigation handlers with state
  const handleNavigateToMessages = () => {
    navigate('/student/messages', { state: { from: '/student/notifications' } });
  };

  const handleNavigateToRequests = () => {
    navigate('/student/requests', { state: { from: '/student/notifications' } });
  };

  const handleNavigateToDashboard = () => {
    navigate('/student-dashboard', { state: { from: '/student/notifications' } });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'new_request': '📩',
      'request_accepted': '✅',
      'request_rejected': '❌',
      'new_message': '💬',
      'payment_received': '💰',
      'attendance_reminder': '📋',
      'class_scheduled': '📅'
    };
    return icons[type] || '🔔';
  };

  const getNotificationBg = (type) => {
    const colors = {
      'new_request': '#fef3c7',
      'request_accepted': '#dcfce7',
      'request_rejected': '#fee2e2',
      'new_message': '#dbeafe',
      'payment_received': '#d1fae5',
      'attendance_reminder': '#fef3c7',
      'class_scheduled': '#e0e7ff'
    };
    return colors[type] || '#f1f5f9';
  };

  // ✅ Format date only - NO TIME
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex'
    },
    mainLayout: {
      display: 'flex',
      marginLeft: '260px',
      minHeight: '100vh',
      width: '100%'
    },
    content: {
      flex: 1,
      padding: '30px 40px',
      overflowY: 'auto',
      height: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    titleWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    unreadBadge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      background: '#ef4444',
      color: 'white',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
    },
    markAllBtn: {
      padding: '8px 20px',
      background: 'white',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      color: '#475569'
    },
    filterBar: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    filterBtn: {
      padding: '8px 20px',
      borderRadius: '20px',
      border: '2px solid #e8e8e8',
      background: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      color: '#666'
    },
    filterBtnActive: {
      borderColor: '#3b82f6',
      background: '#eff6ff',
      color: '#3b82f6'
    },
    notificationList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    notificationItem: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px 20px',
      border: '1px solid #e8e8e8',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    notificationItemUnread: {
      borderLeft: '4px solid #3b82f6',
      background: '#f8faff'
    },
    notificationIcon: {
      fontSize: '28px',
      flexShrink: 0,
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    notificationContent: {
      flex: 1
    },
    notificationTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    notificationMessage: {
      fontSize: '14px',
      color: '#666',
      marginTop: '2px'
    },
    notificationDate: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" refreshTrigger={refreshTrigger} />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  const filterTypes = [
    { key: 'all', label: 'All' },
    { key: 'new_request', label: 'Requests' },
    { key: 'request_accepted', label: 'Accepted' },
    { key: 'new_message', label: 'Messages' },
    { key: 'payment_received', label: 'Payments' }
  ];

  return (
    <div style={styles.container}>
      <Sidebar role="student" refreshTrigger={refreshTrigger} />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/student-dashboard" />
          )}

          <div style={styles.header}>
            <div style={styles.titleWrapper}>
              <h1 style={styles.title}>🔔 Notifications</h1>
              {unreadCount > 0 && (
                <span style={styles.unreadBadge}>{unreadCount} Unread</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                style={styles.markAllBtn}
                onClick={markAllAsRead}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.color = '#475569';
                }}
              >
                Mark All as Read
              </button>
            )}
          </div>

          <div style={styles.filterBar}>
            {filterTypes.map((f) => (
              <button
                key={f.key}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f.key ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔔</div>
              <div style={styles.emptyTitle}>No notifications yet</div>
              <div style={{ fontSize: '15px', color: '#94a3b8' }}>
                When tutors send messages or updates, they'll appear here
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <div style={styles.emptyTitle}>No {filter} notifications</div>
            </div>
          ) : (
            <div style={styles.notificationList}>
              {filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  style={{
                    ...styles.notificationItem,
                    ...(!notif.read ? styles.notificationItemUnread : {})
                  }}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif._id);
                    if (notif.type === 'new_message') {
                      handleNavigateToMessages();
                    } else if (notif.type === 'request_accepted' || notif.type === 'request_rejected') {
                      handleNavigateToRequests();
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'}
                >
                  <div style={{
                    ...styles.notificationIcon,
                    background: getNotificationBg(notif.type)
                  }}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTitle}>{notif.title}</div>
                    <div style={styles.notificationMessage}>{notif.message}</div>
                    <div style={styles.notificationDate}>{formatDateOnly(notif.created_at)}</div>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      flexShrink: 0,
                      marginTop: '6px'
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNotifications;