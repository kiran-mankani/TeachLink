// frontend/src/pages/admin/AdminAttendance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
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
  Monitor,
  Home,
  RefreshCw,
  MapPin,
  Link as LinkIcon,
  Video
} from 'lucide-react';

const AdminAttendance = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    online: 0,
    physical: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    status: '',
    mode: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Available filter options
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics', 'Accounting', 'Business Studies'];
  const statusOptions = ['present', 'absent', 'pending'];
  const modeOptions = ['Online', 'Physical'];

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendance, searchQuery, filters]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }

      const data = await response.json();

      if (data.success) {
        setAttendance(data.attendance || []);
        calculateStats(data.attendance || []);
      } else {
        setError(data.error || 'Failed to load attendance records');
      }

    } catch (err) {
      console.error('❌ Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance records');
      setAttendance([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceList) => {
    const total = attendanceList.length;
    const present = attendanceList.filter(a => a.status === 'present').length;
    const absent = attendanceList.filter(a => a.status === 'absent').length;
    const online = attendanceList.filter(a => a.mode === 'Online' || a.mode === 'online').length;
    const physical = attendanceList.filter(a => a.mode === 'Physical' || a.mode === 'physical').length;
    setStats({ total, present, absent, online, physical });
  };

  const applyFilters = () => {
    let result = [...attendance];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        (a.student_name || '').toLowerCase().includes(query) ||
        (a.teacher_name || '').toLowerCase().includes(query) ||
        (a.subject || '').toLowerCase().includes(query)
      );
    }

    // Subject filter
    if (filters.subject) {
      result = result.filter(a => a.subject === filters.subject);
    }

    // Status filter
    if (filters.status) {
      result = result.filter(a => a.status === filters.status);
    }

    // Mode filter
    if (filters.mode) {
      result = result.filter(a => a.mode === filters.mode || a.mode?.toLowerCase() === filters.mode.toLowerCase());
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(a => {
        const aDate = new Date(a.date || a.class_date || a.created_at);
        return aDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(a => {
        const aDate = new Date(a.date || a.class_date || a.created_at);
        return aDate <= toDate;
      });
    }

    setFilteredAttendance(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      subject: '',
      status: '',
      mode: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: { bg: '#dcfce7', color: '#15803d', label: '🟢 Present', icon: CheckCircle },
      absent: { bg: '#fee2e2', color: '#b91c1c', label: '🔴 Absent', icon: XCircle },
      pending: { bg: '#fef3c7', color: '#b45309', label: '🟡 Pending', icon: Clock }
    };
    return styles[status] || styles.pending;
  };

  const getModeIcon = (mode) => {
    if (mode === 'Online' || mode === 'online') {
      return { icon: Video, label: '💻 Online' };
    }
    return { icon: Home, label: '🏠 Physical' };
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

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
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
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);

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
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
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
    statIconGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statIconRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
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
    modeBadge: (mode) => {
      const isOnline = mode === 'Online' || mode === 'online';
      return {
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: isOnline ? '#e0f2fe' : '#fef3c7',
        color: isOnline ? '#0284c7' : '#b45309',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      };
    },
    actions: {
      display: 'flex',
      gap: '6px',
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
    modalSection: {
      marginTop: '16px',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '10px',
    },
    modalSectionTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px',
    },
    modalLink: {
      color: '#3b82f6',
      textDecoration: 'underline',
      cursor: 'pointer',
      wordBreak: 'break-all',
    },
    modalNote: {
      marginTop: '12px',
      padding: '12px 16px',
      background: '#fef3c7',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#b45309',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
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
          <div style={{ fontSize: '40px' }}>📅</div>
          <div>Loading attendance records...</div>
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
          <h1 style={styles.title}>📅 Attendance Management</h1>
          <p style={styles.subtitle}>Monitor attendance of all online and physical classes.</p>
        </div>
        <button
          style={{
            ...styles.actionBtn,
            ...styles.viewBtn,
            padding: '10px 20px',
            fontSize: '14px',
          }}
          onClick={fetchAttendance}
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
            <Calendar size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Classes</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.present}</span>
            <span style={styles.statLabel}>Present Records</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <XCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.absent}</span>
            <span style={styles.statLabel}>Absent Records</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <Video size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.online}</span>
            <span style={styles.statLabel}>Online Classes</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Home size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.physical}</span>
            <span style={styles.statLabel}>Physical Classes</span>
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

          <select
            style={styles.filterSelect}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Status</option>
            <option value="present">🟢 Present</option>
            <option value="absent">🔴 Absent</option>
            <option value="pending">🟡 Pending</option>
          </select>

          <select
            style={styles.filterSelect}
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Modes</option>
            <option value="Online">💻 Online</option>
            <option value="Physical">🏠 Physical</option>
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

      {/* Attendance Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredAttendance.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📅</div>
              <div style={styles.emptyTitle}>No attendance records found</div>
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
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((record) => {
                  const status = getStatusBadge(record.status);
                  const StatusIcon = status.icon;
                  const modeInfo = getModeIcon(record.mode);
                  const ModeIcon = modeInfo.icon;
                  
                  return (
                    <tr key={record._id || record.id}>
                      <td style={styles.td}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          #{String(record._id || record.id).slice(-6)}
                        </span>
                      </td>
                      <td style={styles.td}>{record.student_name || 'Student'}</td>
                      <td style={styles.td}>{record.teacher_name || 'Teacher'}</td>
                      <td style={styles.td}>{record.subject || 'General'}</td>
                      <td style={styles.td}>
                        <span style={styles.modeBadge(record.mode)}>
                          <ModeIcon size={12} /> {modeInfo.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {formatDate(record.date || record.class_date || record.created_at)}
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {record.time ? formatTime(record.time) : ''}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(record.status)}>
                          <StatusIcon size={12} /> {status.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetailsModal(true);
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Eye size={14} /> View
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
        {filteredAttendance.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAttendance.length)} of {filteredAttendance.length} records
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
      {showDetailsModal && selectedRecord && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 Attendance Details</h3>
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
              <span style={styles.modalLabel}>Attendance ID</span>
              <span style={styles.modalValue}>#{String(selectedRecord._id || selectedRecord.id).slice(-8)}</span>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>👤 Student</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Name</span>
                <span style={styles.modalValue}>{selectedRecord.student_name || 'Student'}</span>
              </div>
              {selectedRecord.student_email && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Email</span>
                  <span style={styles.modalValue}>{selectedRecord.student_email}</span>
                </div>
              )}
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>👨‍🏫 Teacher</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Name</span>
                <span style={styles.modalValue}>{selectedRecord.teacher_name || 'Teacher'}</span>
              </div>
              {selectedRecord.teacher_subjects && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Subjects</span>
                  <span style={styles.modalValue}>{selectedRecord.teacher_subjects.join(', ')}</span>
                </div>
              )}
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📚 Class Details</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Subject</span>
                <span style={styles.modalValue}>{selectedRecord.subject || 'General'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Learning Mode</span>
                <span style={styles.modalValue}>
                  {selectedRecord.mode === 'Online' || selectedRecord.mode === 'online' ? '💻 Online' : '🏠 Physical'}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Attendance Status</span>
                <span style={styles.modalValue}>
                  <span style={styles.statusBadge(selectedRecord.status)}>
                    {getStatusBadge(selectedRecord.status).label}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Class Date</span>
                <span style={styles.modalValue}>
                  {formatDate(selectedRecord.date || selectedRecord.class_date || selectedRecord.created_at)}
                </span>
              </div>
              {selectedRecord.time && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Time</span>
                  <span style={styles.modalValue}>{formatTime(selectedRecord.time)}</span>
                </div>
              )}
            </div>

            {/* ✅ Special: Online Class - Show Meeting Link */}
            {(selectedRecord.mode === 'Online' || selectedRecord.mode === 'online') && (
              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>💻 Online Class Details</div>
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Meeting Link</span>
                  <span style={styles.modalValue}>
                    {selectedRecord.meeting_link ? (
                      <a
                        href={selectedRecord.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.modalLink}
                      >
                        <LinkIcon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {selectedRecord.meeting_link}
                      </a>
                    ) : (
                      'No meeting link provided'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* ✅ Special: Physical Class - Show Location */}
            {(selectedRecord.mode === 'Physical' || selectedRecord.mode === 'physical') && (
              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>🏠 Physical Class Details</div>
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Location</span>
                  <span style={styles.modalValue}>
                    {selectedRecord.location ? (
                      <>
                        <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {selectedRecord.location}
                      </>
                    ) : (
                      'No location provided'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* ⭐ IMPORTANT NOTE - Admin can only VIEW */}
            <div style={styles.modalNote}>
              <Eye size={16} />
              <span>
                <strong>Admin can only view attendance records.</strong> Admin cannot edit attendance. Only teachers can mark attendance.
              </span>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 24px',
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
                onClick={() => setShowDetailsModal(false)}
                onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.background = '#e8e8e8'}
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

export default AdminAttendance;