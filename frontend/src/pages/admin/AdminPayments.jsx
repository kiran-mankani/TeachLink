// frontend/src/pages/admin/AdminPayments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  Send,
  AlertCircle,
  Check,
  Ban,
  RefreshCw
} from 'lucide-react';

const AdminPayments = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    subject: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState(null);

  // Available filter options
  const statusOptions = ['pending', 'paid', 'rejected'];
  const methodOptions = ['bank_transfer', 'jazzcash', 'easypaisa', 'card'];
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics', 'Accounting', 'Business Studies'];

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();

      if (data.success) {
        setPayments(data.payments || []);
        calculateStats(data.payments || []);
      } else {
        setError(data.error || 'Failed to load payments');
      }

    } catch (err) {
      console.error('❌ Error fetching payments:', err);
      setError(err.message || 'Failed to load payments');
      // Fallback to empty state
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentList) => {
    const total = paymentList.length;
    const pending = paymentList.filter(p => p.status === 'pending').length;
    const approved = paymentList.filter(p => p.status === 'paid' || p.status === 'approved').length;
    const rejected = paymentList.filter(p => p.status === 'rejected').length;
    const totalRevenue = paymentList
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    setStats({ total, pending, approved, rejected, totalRevenue });
  };

  const applyFilters = () => {
    let result = [...payments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.student_name || '').toLowerCase().includes(query) ||
        (p.teacher_name || '').toLowerCase().includes(query) ||
        (p.subject || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Method filter
    if (filters.method) {
      result = result.filter(p => p.payment_method === filters.method);
    }

    // Subject filter
    if (filters.subject) {
      result = result.filter(p => p.subject === filters.subject);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate <= toDate;
      });
    }

    setFilteredPayments(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      method: '',
      subject: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Approve this payment? This will unlock chat for student and teacher.')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Payment approved! Chat unlocked for student and teacher.');
        await fetchPayments();
        setShowDetailsModal(false);
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('❌ Error approving payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectPaymentId) return;
    if (!window.confirm('Reject this payment?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${rejectPaymentId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectReason || 'Payment rejected by admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('❌ Payment rejected.');
        setShowRejectModal(false);
        setRejectReason('');
        setRejectPaymentId(null);
        await fetchPayments();
        setShowDetailsModal(false);
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('❌ Error rejecting payment');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (paymentId) => {
    setRejectPaymentId(paymentId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending', icon: Clock },
      paid: { bg: '#dcfce7', color: '#15803d', label: '✅ Approved', icon: CheckCircle },
      approved: { bg: '#dcfce7', color: '#15803d', label: '✅ Approved', icon: CheckCircle },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected', icon: XCircle }
    };
    return styles[status] || styles.pending;
  };

  const getMethodLabel = (method) => {
    const methods = {
      bank_transfer: '🏦 Bank Transfer',
      jazzcash: '📱 JazzCash',
      easypaisa: '📱 EasyPaisa',
      card: '💳 Credit/Debit Card'
    };
    return methods[method] || method || 'N/A';
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
    statIconRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
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
      minWidth: '130px',
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
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '3px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: style.bg,
        color: style.color,
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
      padding: '5px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
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
    approveBtn: {
      background: '#22c55e',
      color: 'white',
    },
    rejectBtn: {
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
      maxWidth: '600px',
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
    modalActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #e8e8e8',
    },
    modalActionBtn: {
      flex: 1,
      padding: '12px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    // Reject Modal
    rejectModal: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    rejectTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      transition: 'border-color 0.3s',
      marginTop: '8px',
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
          <div style={{ fontSize: '40px' }}>💰</div>
          <div>Loading payments...</div>
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
          <h1 style={styles.title}>💰 Payment Management</h1>
          <p style={styles.subtitle}>Verify, approve and manage all student payments.</p>
        </div>
        <button
          style={{
            ...styles.actionBtn,
            ...styles.viewBtn,
            padding: '10px 20px',
            fontSize: '14px',
          }}
          onClick={fetchPayments}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <DollarSign size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Payments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pending}</span>
            <span style={styles.statLabel}>Pending Payments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.approved}</span>
            <span style={styles.statLabel}>Approved Payments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <XCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.rejected}</span>
            <span style={styles.statLabel}>Rejected Payments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <DollarSign size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{formatCurrency(stats.totalRevenue)}</span>
            <span style={styles.statLabel}>Total Revenue</span>
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
            placeholder="Search by student or teacher name..."
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="paid">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>

          <select
            style={styles.filterSelect}
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Methods</option>
            <option value="bank_transfer">🏦 Bank Transfer</option>
            <option value="jazzcash">📱 JazzCash</option>
            <option value="easypaisa">📱 EasyPaisa</option>
            <option value="card">💳 Credit/Debit Card</option>
          </select>

          <select
            style={styles.filterSelect}
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Subjects</option>
            {subjectOptions.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
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

      {/* Payments Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredPayments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💰</div>
              <div style={styles.emptyTitle}>No payments found</div>
              <div>Try adjusting your search or filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((payment) => {
                  const status = getStatusBadge(payment.status);
                  const StatusIcon = status.icon;
                  const isPending = payment.status === 'pending';
                  return (
                    <tr key={payment._id || payment.id}>
                      <td style={styles.td}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          #{String(payment._id || payment.id).slice(-6)}
                        </span>
                      </td>
                      <td style={styles.td}>{payment.student_name || 'Student'}</td>
                      <td style={styles.td}>{payment.teacher_name || 'Teacher'}</td>
                      <td style={styles.td}>{payment.subject || 'General'}</td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '600', color: '#1f1f3e' }}>
                          {formatCurrency(payment.amount || 0)}
                        </span>
                      </td>
                      <td style={styles.td}>{getMethodLabel(payment.payment_method)}</td>
                      <td style={styles.td}>{formatDate(payment.created_at)}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(payment.status)}>
                          <StatusIcon size={12} /> {status.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailsModal(true);
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Eye size={14} /> View
                          </button>
                          {isPending && (
                            <>
                              <button
                                style={{ ...styles.actionBtn, ...styles.approveBtn }}
                                onClick={() => handleApprove(payment._id || payment.id)}
                                disabled={actionLoading}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                                onClick={() => openRejectModal(payment._id || payment.id)}
                                disabled={actionLoading}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                <Ban size={14} /> Reject
                              </button>
                            </>
                          )}
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
        {filteredPayments.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} payments
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
      {showDetailsModal && selectedPayment && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 Payment Details</h3>
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
              <span style={styles.modalLabel}>Payment ID</span>
              <span style={styles.modalValue}>#{String(selectedPayment._id || selectedPayment.id).slice(-8)}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Student</span>
              <span style={styles.modalValue}>{selectedPayment.student_name || 'Student'}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Teacher</span>
              <span style={styles.modalValue}>{selectedPayment.teacher_name || 'Teacher'}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Subject</span>
              <span style={styles.modalValue}>{selectedPayment.subject || 'General'}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Amount</span>
              <span style={styles.modalValue}><strong>{formatCurrency(selectedPayment.amount || 0)}</strong></span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Payment Method</span>
              <span style={styles.modalValue}>{getMethodLabel(selectedPayment.payment_method)}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Payment Date</span>
              <span style={styles.modalValue}>{formatDateTime(selectedPayment.created_at)}</span>
            </div>
            <div style={styles.modalRow}>
              <span style={styles.modalLabel}>Status</span>
              <span style={styles.modalValue}>
                <span style={styles.statusBadge(selectedPayment.status)}>
                  {getStatusBadge(selectedPayment.status).label}
                </span>
              </span>
            </div>

            {selectedPayment.status === 'pending' && (
              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.modalActionBtn,
                    background: '#22c55e',
                    color: 'white',
                  }}
                  onClick={() => handleApprove(selectedPayment._id || selectedPayment.id)}
                  disabled={actionLoading}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Check size={18} /> {actionLoading ? 'Processing...' : 'Approve Payment'}
                </button>
                <button
                  style={{
                    ...styles.modalActionBtn,
                    background: '#ef4444',
                    color: 'white',
                  }}
                  onClick={() => {
                    setShowDetailsModal(false);
                    openRejectModal(selectedPayment._id || selectedPayment.id);
                  }}
                  disabled={actionLoading}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Ban size={18} /> Reject Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div style={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>❌ Reject Payment</h3>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowRejectModal(false)}
                onMouseEnter={(e) => e.target.style.color = '#1f1f3e'}
                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Please provide a reason for rejecting this payment.
            </p>

            <textarea
              style={styles.rejectTextarea}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e8e8e8',
                  color: '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                }}
                onClick={() => setShowRejectModal(false)}
                onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.background = '#e8e8e8'}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                }}
                onClick={handleReject}
                disabled={actionLoading}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPayments;