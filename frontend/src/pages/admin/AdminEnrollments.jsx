import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  Clock,
  Search,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  BookOpen,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
  Download
} from 'lucide-react';

const AdminEnrollments = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    totalRevenue: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    subject: '',
    mode: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Available filter options
  const statusOptions = ['Pending', 'Accepted', 'Rejected', 'Completed'];
  const paymentStatusOptions = ['Pending', 'Paid', 'Failed'];
  const modeOptions = ['Online', 'Physical', 'Both'];

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [enrollments, searchQuery, filters]);

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Helper to get subject display
  const getSubjectDisplay = (subject) => {
    const name = getSubjectName(subject);
    return name || 'General';
  };

  // ✅ Helper to get teaching mode from teacher object
  const getTeachingMode = (teacher) => {
    if (!teacher) return 'N/A';
    const mode = 
      teacher.teaching_mode ||
      teacher.mode ||
      teacher.preferred_mode ||
      teacher.teacher_mode ||
      null;
    return mode || 'N/A';
  };

  // ✅ Helper to get teaching mode display with icon
  const getTeachingModeDisplay = (mode) => {
    if (!mode || mode === 'N/A') return 'N/A';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻 Online';
    if (modeLower === 'physical') return '🏠 Physical';
    if (modeLower === 'both') return '💻🏠 Both';
    return mode;
  };

  // ✅ Helper to format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Rs. 0';
    return `Rs. ${Number(amount).toLocaleString()}/month`;
  };

  // ✅ Helper to format date
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

  // ✅ Helper to format schedule
  const formatSchedule = (schedule) => {
    if (!schedule) return 'N/A';
    if (typeof schedule === 'string') return schedule;
    if (typeof schedule === 'object') {
      const day = schedule.day || '';
      const start = schedule.start_time || schedule.start || '';
      const end = schedule.end_time || schedule.end || '';
      if (day && start && end) {
        return `${day} • ${start} - ${end}`;
      }
      if (day) return day;
      if (start && end) return `${start} - ${end}`;
    }
    return 'N/A';
  };

  // ✅ Get status badge styles
  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
      accepted: { bg: '#dcfce7', color: '#15803d', label: '✅ Accepted' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected' },
      completed: { bg: '#e0e7ff', color: '#4a3aff', label: '📌 Completed' }
    };
    const lowerStatus = status?.toLowerCase();
    return styles[lowerStatus] || styles.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
      paid: { bg: '#dcfce7', color: '#15803d', label: '✅ Paid' },
      failed: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Failed' }
    };
    const lowerStatus = status?.toLowerCase();
    return styles[lowerStatus] || styles.pending;
  };

  // ✅ FIXED: Fetch enrollments from database
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📤 Fetching enrollments from database...');

      // ✅ Try API service first
      let data;
      try {
        const response = await fetch('/api/admin/enrollments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();
      } catch (err) {
        console.log('⚠️ API service failed, trying direct fetch...');
        // Fallback: Direct API call
        const response = await fetch('/api/admin/enrollments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();
      }

      console.log('📥 Enrollments response:', data);

      // ✅ Handle different response structures
      let enrollmentData = [];
      if (data.success && data.enrollments) {
        enrollmentData = data.enrollments;
      } else if (data.success && data.data && data.data.enrollments) {
        enrollmentData = data.data.enrollments;
      } else if (data.enrollments) {
        enrollmentData = data.enrollments;
      } else if (Array.isArray(data)) {
        enrollmentData = data;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        enrollmentData = data.data;
      }

      console.log('📋 Enrollments loaded:', enrollmentData.length);
      setEnrollments(enrollmentData);
      calculateStats(enrollmentData);
      setFilteredEnrollments(enrollmentData);

    } catch (err) {
      console.error('❌ Error fetching enrollments:', err);
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate stats from enrollments
  const calculateStats = (enrollmentList) => {
    const total = enrollmentList.length;
    const pending = enrollmentList.filter(e => e.status?.toLowerCase() === 'pending').length;
    const accepted = enrollmentList.filter(e => e.status?.toLowerCase() === 'accepted' || e.status?.toLowerCase() === 'approved').length;
    const rejected = enrollmentList.filter(e => e.status?.toLowerCase() === 'rejected').length;
    const completed = enrollmentList.filter(e => e.status?.toLowerCase() === 'completed').length;
    
    // Calculate total revenue from accepted/completed enrollments
    let totalRevenue = 0;
    enrollmentList.forEach(e => {
      if (e.status?.toLowerCase() === 'accepted' || 
          e.status?.toLowerCase() === 'approved' || 
          e.status?.toLowerCase() === 'completed') {
        const fee = e.fee || e.monthly_fee || 0;
        totalRevenue += Number(fee) || 0;
      }
    });

    setStats({ total, pending, accepted, rejected, completed, totalRevenue });
  };

  // ✅ Apply filters
  const applyFilters = () => {
    let result = [...enrollments];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        (e.student_name || '').toLowerCase().includes(query) ||
        (e.student_email || '').toLowerCase().includes(query) ||
        (e.teacher_name || '').toLowerCase().includes(query) ||
        (e.teacher_email || '').toLowerCase().includes(query) ||
        getSubjectDisplay(e.subject).toLowerCase().includes(query)
      );
    }

    if (filters.status) {
      result = result.filter(e => 
        (e.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.paymentStatus) {
      result = result.filter(e => 
        (e.payment_status || '').toLowerCase() === filters.paymentStatus.toLowerCase()
      );
    }

    if (filters.subject) {
      result = result.filter(e => 
        getSubjectDisplay(e.subject) === filters.subject
      );
    }

    if (filters.mode) {
      result = result.filter(e => {
        const mode = getTeachingMode(e.teacher);
        return mode.toLowerCase() === filters.mode.toLowerCase();
      });
    }

    setFilteredEnrollments(result);
    setCurrentPage(1);
  };

  // ✅ Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      paymentStatus: '',
      subject: '',
      mode: ''
    });
  };

  // ✅ Get unique subjects from enrollments for filter
  const getUniqueSubjects = () => {
    const subjects = new Set();
    enrollments.forEach(e => {
      const name = getSubjectDisplay(e.subject);
      if (name) subjects.add(name);
    });
    return Array.from(subjects);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ✅ Handle view enrollment details
  const handleViewDetails = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDetailsModal(true);
  };

  // ✅ Handle update status
  const handleUpdateStatus = async (enrollmentId, newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Status updated to ${newStatus}`);
        fetchEnrollments();
        setShowDetailsModal(false);
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('❌ Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Handle update payment status
  const handleUpdatePayment = async (enrollmentId, newStatus) => {
    if (!window.confirm(`Update payment status to ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Payment status updated to ${newStatus}`);
        fetchEnrollments();
        setShowDetailsModal(false);
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('❌ Error updating payment');
    } finally {
      setActionLoading(false);
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px',
      marginBottom: '25px',
    },
    statCard: {
      background: 'white',
      borderRadius: '14px',
      padding: '18px 22px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'all 0.3s',
    },
    statIconBox: {
      width: '42px',
      height: '42px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0,
    },
    statIconBlue: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
    statIconGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statIconRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    statIconPink: { backgroundColor: '#fce7f3', color: '#db2777' },
    statContent: {
      display: 'flex',
      flexDirection: 'column',
    },
    statNumber: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1f1f3e',
      lineHeight: '1',
    },
    statLabel: {
      fontSize: '12px',
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
      padding: '10px 14px',
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
      padding: '10px 14px',
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
        display: 'inline-block',
      };
    },
    paymentStatusBadge: (status) => {
      const style = getPaymentStatusBadge(status);
      return {
        padding: '3px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: style.bg,
        color: style.color,
        display: 'inline-block',
      };
    },
    viewBtn: {
      padding: '4px 12px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
    },
    actionBtn: {
      padding: '4px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      marginRight: '4px',
    },
    acceptBtn: {
      background: '#22c55e',
      color: 'white',
    },
    rejectBtn: {
      background: '#ef4444',
      color: 'white',
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
      maxWidth: '700px',
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
      fontSize: '22px',
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
    modalSection: {
      marginBottom: '16px',
      padding: '14px 16px',
      background: '#f8fafc',
      borderRadius: '10px',
    },
    modalSectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px',
    },
    modalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      fontSize: '13px',
    },
    modalLabel: {
      color: '#94a3b8',
    },
    modalValue: {
      fontWeight: '500',
      color: '#1f1f3e',
    },
    modalActions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #e8e8e8',
    },
    modalActionBtn: {
      padding: '8px 18px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    modalAcceptBtn: {
      background: '#22c55e',
      color: 'white',
    },
    modalRejectBtn: {
      background: '#ef4444',
      color: 'white',
    },
    modalCompleteBtn: {
      background: '#6366f1',
      color: 'white',
    },
    modalPayBtn: {
      background: '#f59e0b',
      color: 'white',
    },
    modalCloseBtn2: {
      background: '#e8e8e8',
      color: '#666',
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
      fontSize: '14px',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '40px' }}>📋</div>
          <div>Loading enrollments...</div>
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

  // Get unique subjects for filter
  const uniqueSubjects = getUniqueSubjects();

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>📋 Manage Enrollments</h1>
          <p style={styles.subtitle}>View and manage all student enrollment requests.</p>
        </div>
        <button
          style={{
            ...styles.viewBtn,
            padding: '10px 20px',
            fontSize: '14px',
          }}
          onClick={fetchEnrollments}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <Users size={22} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Enrollments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Clock size={22} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pending}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <UserCheck size={22} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.accepted}</span>
            <span style={styles.statLabel}>Accepted</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <XCircle size={22} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.rejected}</span>
            <span style={styles.statLabel}>Rejected</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <CheckCircle size={22} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.completed}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPink}}>
            <DollarSign size={22} />
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
            placeholder="Search by name, email or subject..."
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
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Payment</option>
            {paymentStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Modes</option>
            {modeOptions.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

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

      {/* Enrollments Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredEnrollments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyTitle}>No enrollments found</div>
              <div>Try adjusting your search or filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Fee</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((enrollment) => {
                  const statusStyle = styles.statusBadge(enrollment.status);
                  const paymentStyle = styles.paymentStatusBadge(enrollment.payment_status);
                  const subjectName = getSubjectDisplay(enrollment.subject);
                  const teachingMode = getTeachingMode(enrollment.teacher);
                  const teachingModeDisplay = getTeachingModeDisplay(teachingMode);

                  return (
                    <tr key={enrollment._id || enrollment.id}>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{enrollment.student_name || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{enrollment.student_email || ''}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{enrollment.teacher_name || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{enrollment.teacher_email || ''}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                        }}>
                          {subjectName || 'N/A'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '600', color: '#16a34a' }}>
                          {enrollment.fee ? formatCurrency(enrollment.fee) : 'N/A'}
                        </span>
                      </td>
                      <td style={styles.td}>{teachingModeDisplay}</td>
                      <td style={styles.td}>
                        <span style={statusStyle}>
                          {getStatusBadge(enrollment.status).label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={paymentStyle}>
                          {getPaymentStatusBadge(enrollment.payment_status).label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '12px' }}>
                          {formatDate(enrollment.created_at || enrollment.request_date)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() => handleViewDetails(enrollment)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredEnrollments.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEnrollments.length)} of {filteredEnrollments.length} enrollments
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
      {showDetailsModal && selectedEnrollment && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 Enrollment Details</h3>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowDetailsModal(false)}
                onMouseEnter={(e) => e.target.style.color = '#1f1f3e'}
                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            {/* Student Information */}
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>👤 Student Information</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Name</span>
                <span style={styles.modalValue}>{selectedEnrollment.student_name || 'N/A'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Email</span>
                <span style={styles.modalValue}>{selectedEnrollment.student_email || 'N/A'}</span>
              </div>
              {selectedEnrollment.student_phone && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Phone</span>
                  <span style={styles.modalValue}>{selectedEnrollment.student_phone}</span>
                </div>
              )}
            </div>

            {/* Teacher Information */}
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>👨‍🏫 Teacher Information</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Name</span>
                <span style={styles.modalValue}>{selectedEnrollment.teacher_name || 'N/A'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Email</span>
                <span style={styles.modalValue}>{selectedEnrollment.teacher_email || 'N/A'}</span>
              </div>
              {selectedEnrollment.teacher_phone && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Phone</span>
                  <span style={styles.modalValue}>{selectedEnrollment.teacher_phone}</span>
                </div>
              )}
            </div>

            {/* Enrollment Details */}
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📚 Enrollment Details</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Subject</span>
                <span style={styles.modalValue}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#e0e7ff',
                    color: '#4f46e5',
                  }}>
                    {getSubjectDisplay(selectedEnrollment.subject) || 'N/A'}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Monthly Fee</span>
                <span style={styles.modalValue} style={{ fontWeight: '600', color: '#16a34a' }}>
                  {selectedEnrollment.fee ? formatCurrency(selectedEnrollment.fee) : 'N/A'}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Teaching Mode</span>
                <span style={styles.modalValue}>
                  {getTeachingModeDisplay(getTeachingMode(selectedEnrollment.teacher))}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Schedule</span>
                <span style={styles.modalValue}>
                  {formatSchedule(selectedEnrollment.preferred_schedule || selectedEnrollment.schedule)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📊 Status</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Enrollment Status</span>
                <span style={styles.modalValue}>
                  <span style={styles.statusBadge(selectedEnrollment.status)}>
                    {getStatusBadge(selectedEnrollment.status).label}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Payment Status</span>
                <span style={styles.modalValue}>
                  <span style={styles.paymentStatusBadge(selectedEnrollment.payment_status)}>
                    {getPaymentStatusBadge(selectedEnrollment.payment_status).label}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Request Date</span>
                <span style={styles.modalValue}>
                  {formatDate(selectedEnrollment.created_at || selectedEnrollment.request_date)}
                </span>
              </div>
              {selectedEnrollment.updated_at && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Last Updated</span>
                  <span style={styles.modalValue}>{formatDate(selectedEnrollment.updated_at)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={styles.modalActions}>
              {selectedEnrollment.status?.toLowerCase() === 'pending' && (
                <>
                  <button
                    style={{ ...styles.modalActionBtn, ...styles.modalAcceptBtn }}
                    onClick={() => handleUpdateStatus(selectedEnrollment._id || selectedEnrollment.id, 'Accepted')}
                    disabled={actionLoading}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    ✅ Accept
                  </button>
                  <button
                    style={{ ...styles.modalActionBtn, ...styles.modalRejectBtn }}
                    onClick={() => handleUpdateStatus(selectedEnrollment._id || selectedEnrollment.id, 'Rejected')}
                    disabled={actionLoading}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              {selectedEnrollment.status?.toLowerCase() === 'accepted' && (
                <>
                  <button
                    style={{ ...styles.modalActionBtn, ...styles.modalCompleteBtn }}
                    onClick={() => handleUpdateStatus(selectedEnrollment._id || selectedEnrollment.id, 'Completed')}
                    disabled={actionLoading}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    📌 Mark Completed
                  </button>
                  {selectedEnrollment.payment_status?.toLowerCase() !== 'paid' && (
                    <button
                      style={{ ...styles.modalActionBtn, ...styles.modalPayBtn }}
                      onClick={() => handleUpdatePayment(selectedEnrollment._id || selectedEnrollment.id, 'Paid')}
                      disabled={actionLoading}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      💰 Mark Paid
                    </button>
                  )}
                </>
              )}
              <button
                style={{ ...styles.modalActionBtn, ...styles.modalCloseBtn2 }}
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

export default AdminEnrollments;