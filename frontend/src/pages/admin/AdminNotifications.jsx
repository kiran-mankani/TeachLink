// frontend/src/pages/admin/AdminNotifications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  RefreshCw,
  Mail,
  Check,
  Trash2,
  UserPlus,
  UserCheck,
  CreditCard,
  Video,
  Home,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    payment: 0,
    enrollment: 0,
    attendance: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Notification type options
  const typeOptions = [
    'student_registered',
    'teacher_registered',
    'profile_completed',
    'enrollment_request',
    'enrollment_accepted',
    'payment_pending',
    'payment_approved',
    'payment_rejected',
    'attendance_submitted',
    'class_cancelled',
    'new_message',
    'new_request'
  ];

  const typeLabels = {
    student_registered: '📝 Student Registered',
    teacher_registered: '📝 Teacher Registered',
    profile_completed: '✅ Profile Completed',
    enrollment_request: '📩 Enrollment Request',
    enrollment_accepted: '✅ Enrollment Accepted',
    payment_pending: '⏳ Payment Pending',
    payment_approved: '✅ Payment Approved',
    payment_rejected: '❌ Payment Rejected',
    attendance_submitted: '📋 Attendance Submitted',
    class_cancelled: '❌ Class Cancelled',
    new_message: '💬 New Message',
    new_request: '📩 New Request'
  };

  const statusOptions = ['read', 'unread'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchQuery, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        calculateStats(data.notifications || []);
      } else {
        setError(data.error || 'Failed to load notifications');
      }

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notificationList) => {
    const total = notificationList.length;
    const unread = notificationList.filter(n => !n.read).length;
    const payment = notificationList.filter(n => 
      n.type === 'payment_pending' || n.type === 'payment_approved' || n.type === 'payment_rejected'
    ).length;
    const enrollment = notificationList.filter(n => 
      n.type === 'enrollment_request' || n.type === 'enrollment_accepted'
    ).length;
    const attendance = notificationList.filter(n => 
      n.type === 'attendance_submitted'
    ).length;
    setStats({ total, unread, payment, enrollment, attendance });
  };

  const applyFilters = () => {
    let result = [...notifications];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(n =>
        (n.recipient_name || '').toLowerCase().includes(query) ||
        (n.message || '').toLowerCase().includes(query) ||
        (n.title || '').toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type) {
      result = result.filter(n => n.type === filters.type);
    }

    // Read/Unread filter
    if (filters.status) {
      const isRead = filters.status === 'read';
      result = result.filter(n => n.read === isRead);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(n => {
        const nDate = new Date(n.created_at);
        return nDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(n => {
        const nDate = new Date(n.created_at);
        return nDate <= toDate;
      });
    }

    setFilteredNotifications(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchNotifications();
        if (selectedNotification && selectedNotification._id === notificationId) {
          setSelectedNotification({ ...selectedNotification, read: true });
        }
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
      alert('Error marking as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount === 0) {
      alert('All notifications are already read.');
      return;
    }
    if (!window.confirm(`Mark all ${unreadCount} notifications as read?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.count || unreadCount} notifications marked as read`);
        await fetchNotifications();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Error marking all as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Notification deleted');
        await fetchNotifications();
        setShowDetailsModal(false);
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Error deleting notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm(`Delete all ${notifications.length} notifications? This action cannot be undone.`)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('All notifications deleted');
        await fetchNotifications();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      alert('Error deleting all notifications');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypeIcon = (type) => {
    const icons = {
      student_registered: UserPlus,
      teacher_registered: UserCheck,
      profile_completed: CheckCircle,
      enrollment_request: Mail,
      enrollment_accepted: CheckCircle,
      payment_pending: Clock,
      payment_approved: CheckCircle,
      payment_rejected: XCircle,
      attendance_submitted: Calendar,
      class_cancelled: XCircle,
      new_message: MessageSquare,
      new_request: Mail
    };
    return icons[type] || Bell;
  };

  const getTypeColor = (type) => {
    const colors = {
      student_registered: '#3b82f6',
      teacher_registered: '#3b82f6',
      profile_completed: '#22c55e',
      enrollment_request: '#f59e0b',
      enrollment_accepted: '#22c55e',
      payment_pending: '#f59e0b',
      payment_approved: '#22c55e',
      payment_rejected: '#ef4444',
      attendance_submitted: '#8b5cf6',
      class_cancelled: '#ef4444',
      new_message: '#3b82f6',
      new_request: '#f59e0b'
    };
    return colors[type] || '#94a3b8';
  };

  const getTypeLabel = (type) => {
    return typeLabels[type] || type || 'Unknown';
  };

  const formatDate = (dateString) => {
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const styles = {
    container: {
      padding: '0',
      maxWidth: '100%',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px',
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      margin: 0,
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px',
    },
    headerActions: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    actionHeaderBtn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    markAllBtn: {
      background: '#3b82f6',
      color: 'white',
    },
    deleteAllBtn: {
      background: '#ef4444',
      color: 'white',
    },
    refreshBtn: {
      background: 'white',
      color: '#475569',
      border: '1px solid #e8e8e8',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
      marginBottom: '25px',
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      transition: 'all 0.3s',
    },
    statIconBox: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      flexShrink: 0,
    },
    statIconBlue: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
    statIconGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    statIconRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statContent: {
      display: 'flex',
      flexDirection: 'column',
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f1f3e',
      lineHeight: '1',
    },
    statLabel: {
      fontSize: '13px',
      color: '#666',
      fontWeight: '500',
      marginTop: '2px',
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
      alignItems: 'center',
      background: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      minWidth: '200px',
      background: '#f1f5f9',
      borderRadius: '8px',
      padding: '8px 14px',
      gap: '10px',
      border: '2px solid transparent',
      transition: 'all 0.3s',
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
    filterGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
    },
    filterSelect: {
      padding: '8px 14px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      backgroundColor: 'white',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      color: '#1f1f3e',
      minWidth: '150px',
      transition: 'border-color 0.3s',
      cursor: 'pointer',
    },
    resetBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: 'white',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      color: '#666',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
    tableWrapper: {
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      borderBottom: '1px solid #e8e8e8',
      background: '#f8fafc',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '12px 14px',
      fontSize: '13px',
      color: '#1f1f3e',
      borderBottom: '1px solid #f0f0f0',
      verticalAlign: 'middle',
    },
    statusBadge: (isRead) => {
      return {
        padding: '3px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: isRead ? '#dcfce7' : '#fef3c7',
        color: isRead ? '#15803d' : '#b45309',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      };
    },
    typeBadge: (type) => {
      const color = getTypeColor(type);
      return {
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: color + '15',
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      };
    },
    actions: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
    },
    actionBtn: {
      padding: '5px 10px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    viewBtn: {
      background: '#3b82f6',
      color: 'white',
    },
    readBtn: {
      background: '#22c55e',
      color: 'white',
    },
    deleteBtn: {
      background: '#ef4444',
      color: 'white',
    },
    actionBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderTop: '1px solid #e8e8e8',
      flexWrap: 'wrap',
      gap: '10px',
    },
    paginationInfo: {
      fontSize: '13px',
      color: '#94a3b8',
    },
    paginationButtons: {
      display: 'flex',
      gap: '6px',
    },
    pageBtn: {
      padding: '6px 14px',
      border: '1px solid #e8e8e8',
      borderRadius: '6px',
      background: 'white',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    pageBtnActive: {
      background: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6',
    },
    pageBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#94a3b8',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '4px',
    },
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '550px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    modalCloseBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#94a3b8',
      transition: 'all 0.3s',
    },
    modalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f0f0f0',
    },
    modalLabel: {
      color: '#94a3b8',
      fontSize: '13px',
      fontWeight: '500',
    },
    modalValue: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1f1f3e',
    },
    modalMessage: {
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '10px',
      marginTop: '8px',
      fontSize: '14px',
      color: '#1f1f3e',
      lineHeight: '1.6',
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #e8e8e8',
    },
    modalActionBtn: {
      flex: 1,
      padding: '10px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6',
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      flexDirection: 'column',
      color: '#ef4444',
    },
    errorButton: {
      marginTop: '15px',
      padding: '10px 25px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '40px' }}>🔔</div>
          <div>Loading notifications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>{error}</div>
        <button style={styles.errorButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🔔 Notifications</h1>
          <p style={styles.subtitle}>Monitor all platform notifications.</p>
        </div>
        <div style={styles.headerActions}>
          <button
            style={{ ...styles.actionHeaderBtn, ...styles.markAllBtn }}
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Check size={16} /> Mark All Read
          </button>
          <button
            style={{ ...styles.actionHeaderBtn, ...styles.deleteAllBtn }}
            onClick={handleDeleteAll}
            disabled={actionLoading}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Trash2 size={16} /> Delete All
          </button>
          <button
            style={{ ...styles.actionHeaderBtn, ...styles.refreshBtn }}
            onClick={fetchNotifications}
            onMouseEnter={(e) => {
              e.target.style.background = '#f1f5f9';
              e.target.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e8e8e8';
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <Bell size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Notifications</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.unread}</span>
            <span style={styles.statLabel}>Unread Notifications</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <DollarSign size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.payment}</span>
            <span style={styles.statLabel}>Payment Notifications</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <BookOpen size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.enrollment}</span>
            <span style={styles.statLabel}>Enrollment Notifications</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <Calendar size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.attendance}</span>
            <span style={styles.statLabel}>Attendance Notifications</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by recipient or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              e.target.parentElement.style.borderColor = '#3b82f6';
              e.target.parentElement.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.parentElement.style.borderColor = 'transparent';
              e.target.parentElement.style.background = '#f1f5f9';
            }}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            style={styles.filterSelect}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Types</option>
            {typeOptions.map(type => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Status</option>
            <option value="unread">🔴 Unread</option>
            <option value="read">✅ Read</option>
          </select>

          <input
            type="date"
            style={styles.filterSelect}
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="From Date"
          />

          <input
            type="date"
            style={styles.filterSelect}
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="To Date"
          />

          <button
            style={styles.resetBtn}
            onClick={resetFilters}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e8e8e8';
              e.target.style.color = '#666';
            }}
          >
            <X size={16} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔔</div>
              <div style={styles.emptyTitle}>No notifications found</div>
              <div>Try adjusting your search or filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Recipient</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  
                  return (
                    <tr key={notification._id || notification.id}>
                      <td style={styles.td}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          #{String(notification._id || notification.id).slice(-6)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f1f3e' }}>
                            {notification.recipient_name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {notification.recipient_role || 'User'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typeBadge(notification.type)}>
                          <TypeIcon size={12} /> {getTypeLabel(notification.type)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {notification.title || notification.message || 'No message'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>{formatDate(notification.created_at)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {notification.created_at ? formatDateTime(notification.created_at).split(',')[1] : ''}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(notification.read)}>
                          {notification.read ? '✅ Read' : '⏳ Unread'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => {
                              setSelectedNotification(notification);
                              setShowDetailsModal(true);
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Eye size={12} /> View
                          </button>
                          {!notification.read && (
                            <button
                              style={{ ...styles.actionBtn, ...styles.readBtn }}
                              onClick={() => handleMarkAsRead(notification._id || notification.id)}
                              disabled={actionLoading}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <Check size={12} /> Read
                            </button>
                          )}
                          <button
                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                            onClick={() => handleDelete(notification._id || notification.id)}
                            disabled={actionLoading}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </div>
            <div style={styles.paginationButtons}>
              <button
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === 1 ? styles.pageBtnDisabled : {})
                }}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    style={{
                      ...styles.pageBtn,
                      ...(currentPage === page ? styles.pageBtnActive : {})
                    }}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span style={{ padding: '6px 8px', color: '#94a3b8' }}>...</span>}
              {totalPages > 5 && (
                <button
                  style={{
                    ...styles.pageBtn,
                    ...(currentPage === totalPages ? styles.pageBtnActive : {})
                  }}
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === totalPages ? styles.pageBtnDisabled : {})
                }}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <span style={{ color: getTypeColor(selectedNotification.type) }}>
                  {React.createElement(getTypeIcon(selectedNotification.type), { size: 20 })}
                </span>
                Notification Details
              </h3>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowDetailsModal(false)}
                onMouseEnter={(e) => e.target.style.color = '#1f1f3e'}
                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Notification ID</span>
              <span style={styles.modalValue}>#{String(selectedNotification._id || selectedNotification.id).slice(-8)}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Type</span>
              <span style={styles.modalValue}>
                <span style={styles.typeBadge(selectedNotification.type)}>
                  {getTypeLabel(selectedNotification.type)}
                </span>
              </span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Recipient</span>
              <span style={styles.modalValue}>{selectedNotification.recipient_name || 'Unknown'}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Role</span>
              <span style={styles.modalValue}>{selectedNotification.recipient_role || 'User'}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Status</span>
              <span style={styles.modalValue}>
                <span style={styles.statusBadge(selectedNotification.read)}>
                  {selectedNotification.read ? '✅ Read' : '⏳ Unread'}
                </span>
              </span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Created At</span>
              <span style={styles.modalValue}>{formatDateTime(selectedNotification.created_at)}</span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f1f3e', marginBottom: '6px' }}>
                📝 Message
              </div>
              <div style={styles.modalMessage}>
                <strong>{selectedNotification.title || 'Notification'}</strong>
                <br />
                {selectedNotification.message || 'No message content'}
              </div>
            </div>

            <div style={styles.modalActions}>
              {!selectedNotification.read && (
                <button
                  style={{
                    ...styles.modalActionBtn,
                    background: '#22c55e',
                    color: 'white',
                  }}
                  onClick={() => handleMarkAsRead(selectedNotification._id || selectedNotification.id)}
                  disabled={actionLoading}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Check size={18} /> Mark as Read
                </button>
              )}
              <button
                style={{
                  ...styles.modalActionBtn,
                  background: '#ef4444',
                  color: 'white',
                }}
                onClick={() => handleDelete(selectedNotification._id || selectedNotification.id)}
                disabled={actionLoading}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Trash2 size={18} /> Delete
              </button>
              <button
                style={{
                  ...styles.modalActionBtn,
                  background: '#e8e8e8',
                  color: '#666',
                }}
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotifications;