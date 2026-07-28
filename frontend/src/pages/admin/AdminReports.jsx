// frontend/src/pages/admin/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Users,
  UserPlus,
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  ChevronDown,
  MoreVertical
} from 'lucide-react';

const AdminReports = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalEnrollments: 0,
    completedPayments: 0,
    pendingPayments: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [error, setError] = useState('');

  // Report type options
  const reportTypes = ['Revenue', 'Student', 'Teacher', 'Payment', 'Enrollment'];

  useEffect(() => {
    fetchReportsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recentReports, searchQuery, filters]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Placeholder - Will connect to real backend later
      // const response = await fetch('/api/admin/reports', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      // Placeholder data
      const placeholderStats = {
        totalRevenue: 245000,
        totalStudents: 156,
        totalTeachers: 42,
        totalEnrollments: 89,
        completedPayments: 67,
        pendingPayments: 12
      };

      const placeholderReports = [
        { id: 1, name: 'Revenue Report - June 2026', generatedBy: 'Admin', date: '2026-06-30', format: 'PDF', size: '1.2 MB' },
        { id: 2, name: 'Student Report - Q2 2026', generatedBy: 'Admin', date: '2026-06-28', format: 'Excel', size: '856 KB' },
        { id: 3, name: 'Teacher Report - June 2026', generatedBy: 'Admin', date: '2026-06-25', format: 'PDF', size: '2.1 MB' },
        { id: 4, name: 'Payment Report - June 2026', generatedBy: 'Admin', date: '2026-06-22', format: 'Excel', size: '1.5 MB' },
        { id: 5, name: 'Enrollment Report - Q2 2026', generatedBy: 'Admin', date: '2026-06-20', format: 'PDF', size: '3.4 MB' },
        { id: 6, name: 'Revenue Report - May 2026', generatedBy: 'Admin', date: '2026-05-31', format: 'PDF', size: '1.1 MB' },
        { id: 7, name: 'Student Report - May 2026', generatedBy: 'Admin', date: '2026-05-28', format: 'Excel', size: '723 KB' },
      ];

      setStats(placeholderStats);
      setRecentReports(placeholderReports);
      setFilteredReports(placeholderReports);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...recentReports];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.generatedBy.toLowerCase().includes(query) ||
        r.format.toLowerCase().includes(query)
      );
    }

    if (filters.type) {
      result = result.filter(r => r.name.includes(filters.type));
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(r => {
        const rDate = new Date(r.date);
        return rDate <= toDate;
      });
    }

    setFilteredReports(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      type: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleExport = (format, reportName) => {
    alert(`📥 Exporting ${reportName || 'report'} as ${format}...`);
  };

  const handleViewReport = (report) => {
    alert(`📄 Viewing report: ${report.name}`);
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
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

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
      marginBottom: '30px',
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
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    statIconBlue: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    statIconGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
    statIconRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statIconPink: { backgroundColor: '#fce7f3', color: '#db2777' },
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
    // Chart Section
    chartSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '30px',
    },
    chartCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      minHeight: '200px',
    },
    chartTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    chartPlaceholder: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '150px',
      background: '#f8fafc',
      borderRadius: '10px',
      color: '#94a3b8',
      fontSize: '14px',
      flexDirection: 'column',
      gap: '8px',
      border: '1px dashed #e2e8f0',
    },
    chartPlaceholderIcon: {
      fontSize: '32px',
      opacity: 0.5,
    },
    // Report Cards
    reportSection: {
      marginBottom: '30px',
    },
    reportSectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px',
    },
    reportGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    },
    reportCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
    },
    reportCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    reportCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    reportCardIcon: {
      fontSize: '28px',
    },
    reportCardStats: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '14px',
      padding: '10px 0',
      borderTop: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
    },
    reportStatItem: {
      display: 'flex',
      flexDirection: 'column',
    },
    reportStatLabel: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '500',
    },
    reportStatValue: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    reportCardActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    reportActionBtn: {
      padding: '6px 14px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    viewReportBtn: {
      background: '#3b82f6',
      color: 'white',
    },
    exportPdfBtn: {
      background: '#ef4444',
      color: 'white',
    },
    exportExcelBtn: {
      background: '#22c55e',
      color: 'white',
    },
    // Table
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
    tableHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e8e8e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px',
    },
    tableHeaderTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      background: '#f1f5f9',
      borderRadius: '8px',
      padding: '6px 12px',
      gap: '8px',
      border: '2px solid transparent',
      transition: 'all 0.3s',
    },
    searchIcon: {
      color: '#94a3b8',
      width: '16px',
      height: '16px',
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '13px',
      color: '#1f1f3e',
      width: '150px',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    filterSelect: {
      padding: '6px 12px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      backgroundColor: 'white',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      color: '#1f1f3e',
      minWidth: '120px',
      cursor: 'pointer',
    },
    resetBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      background: 'white',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      cursor: 'pointer',
      color: '#666',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
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
    },
    td: {
      padding: '10px 14px',
      fontSize: '13px',
      color: '#1f1f3e',
      borderBottom: '1px solid #f0f0f0',
    },
    formatBadge: (format) => {
      const styles = {
        PDF: { bg: '#fee2e2', color: '#b91c1c' },
        Excel: { bg: '#dcfce7', color: '#15803d' }
      };
      const style = styles[format] || styles.PDF;
      return {
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: style.bg,
        color: style.color,
        display: 'inline-block',
      };
    },
    actions: {
      display: 'flex',
      gap: '6px',
    },
    actionBtn: {
      padding: '4px 10px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    viewActionBtn: {
      background: '#3b82f6',
      color: 'white',
    },
    downloadActionBtn: {
      background: '#22c55e',
      color: 'white',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
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
      padding: '4px 12px',
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
      padding: '30px',
      color: '#94a3b8',
    },
    emptyIcon: {
      fontSize: '32px',
      marginBottom: '8px',
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
          <div style={{ fontSize: '40px' }}>📊</div>
          <div>Loading reports...</div>
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
          <h1 style={styles.title}>📊 Reports & Analytics</h1>
          <p style={styles.subtitle}>View system reports and export data.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <DollarSign size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{formatCurrency(stats.totalRevenue)}</span>
            <span style={styles.statLabel}>Total Revenue</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <Users size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.totalStudents}</span>
            <span style={styles.statLabel}>Total Students</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <UserPlus size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.totalTeachers}</span>
            <span style={styles.statLabel}>Total Teachers</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <BookOpen size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.totalEnrollments}</span>
            <span style={styles.statLabel}>Total Enrollments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.completedPayments}</span>
            <span style={styles.statLabel}>Completed Payments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pendingPayments}</span>
            <span style={styles.statLabel}>Pending Payments</span>
          </div>
        </div>
      </div>

      {/* Revenue Analytics - Chart Placeholders */}
      <div style={styles.chartSection}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <TrendingUp size={18} color="#3b82f6" />
            Monthly Revenue
          </div>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartPlaceholderIcon}>📈</div>
            <div>Revenue Chart Placeholder</div>
            <div style={{ fontSize: '12px' }}>Jan - Dec 2026</div>
          </div>
        </div>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <BarChart3 size={18} color="#8b5cf6" />
            Monthly Enrollments
          </div>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartPlaceholderIcon}>📊</div>
            <div>Enrollments Chart Placeholder</div>
            <div style={{ fontSize: '12px' }}>Jan - Dec 2026</div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div style={styles.reportSection}>
        <div style={styles.reportSectionTitle}>📋 Report Cards</div>
        <div style={styles.reportGrid}>
          
          {/* Revenue Report */}
          <div style={styles.reportCard}>
            <div style={styles.reportCardHeader}>
              <span style={styles.reportCardTitle}>💰 Revenue Report</span>
              <span style={styles.reportCardIcon}>📊</span>
            </div>
            <div style={styles.reportCardStats}>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Total Revenue</span>
                <span style={styles.reportStatValue}>{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Pending</span>
                <span style={styles.reportStatValue}>{formatCurrency(245000 * 0.1)}</span>
              </div>
            </div>
            <div style={styles.reportCardActions}>
              <button style={{...styles.reportActionBtn, ...styles.viewReportBtn}}>👁 View</button>
              <button style={{...styles.reportActionBtn, ...styles.exportPdfBtn}}>📄 PDF</button>
              <button style={{...styles.reportActionBtn, ...styles.exportExcelBtn}}>📊 Excel</button>
            </div>
          </div>

          {/* Student Report */}
          <div style={styles.reportCard}>
            <div style={styles.reportCardHeader}>
              <span style={styles.reportCardTitle}>👨‍🎓 Student Report</span>
              <span style={styles.reportCardIcon}>📋</span>
            </div>
            <div style={styles.reportCardStats}>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Total Students</span>
                <span style={styles.reportStatValue}>{stats.totalStudents}</span>
              </div>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Active</span>
                <span style={styles.reportStatValue}>{Math.round(stats.totalStudents * 0.85)}</span>
              </div>
            </div>
            <div style={styles.reportCardActions}>
              <button style={{...styles.reportActionBtn, ...styles.viewReportBtn}}>👁 View</button>
              <button style={{...styles.reportActionBtn, ...styles.exportPdfBtn}}>📄 PDF</button>
              <button style={{...styles.reportActionBtn, ...styles.exportExcelBtn}}>📊 Excel</button>
            </div>
          </div>

          {/* Teacher Report */}
          <div style={styles.reportCard}>
            <div style={styles.reportCardHeader}>
              <span style={styles.reportCardTitle}>👨‍🏫 Teacher Report</span>
              <span style={styles.reportCardIcon}>📋</span>
            </div>
            <div style={styles.reportCardStats}>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Total Teachers</span>
                <span style={styles.reportStatValue}>{stats.totalTeachers}</span>
              </div>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Verified</span>
                <span style={styles.reportStatValue}>{Math.round(stats.totalTeachers * 0.9)}</span>
              </div>
            </div>
            <div style={styles.reportCardActions}>
              <button style={{...styles.reportActionBtn, ...styles.viewReportBtn}}>👁 View</button>
              <button style={{...styles.reportActionBtn, ...styles.exportPdfBtn}}>📄 PDF</button>
              <button style={{...styles.reportActionBtn, ...styles.exportExcelBtn}}>📊 Excel</button>
            </div>
          </div>

          {/* Payment Report */}
          <div style={styles.reportCard}>
            <div style={styles.reportCardHeader}>
              <span style={styles.reportCardTitle}>💳 Payment Report</span>
              <span style={styles.reportCardIcon}>💰</span>
            </div>
            <div style={styles.reportCardStats}>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Approved</span>
                <span style={styles.reportStatValue}>{stats.completedPayments}</span>
              </div>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Pending</span>
                <span style={styles.reportStatValue}>{stats.pendingPayments}</span>
              </div>
            </div>
            <div style={styles.reportCardActions}>
              <button style={{...styles.reportActionBtn, ...styles.viewReportBtn}}>👁 View</button>
              <button style={{...styles.reportActionBtn, ...styles.exportPdfBtn}}>📄 PDF</button>
              <button style={{...styles.reportActionBtn, ...styles.exportExcelBtn}}>📊 Excel</button>
            </div>
          </div>

          {/* Enrollment Report */}
          <div style={styles.reportCard}>
            <div style={styles.reportCardHeader}>
              <span style={styles.reportCardTitle}>📚 Enrollment Report</span>
              <span style={styles.reportCardIcon}>📖</span>
            </div>
            <div style={styles.reportCardStats}>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Active</span>
                <span style={styles.reportStatValue}>{Math.round(stats.totalEnrollments * 0.7)}</span>
              </div>
              <div style={styles.reportStatItem}>
                <span style={styles.reportStatLabel}>Completed</span>
                <span style={styles.reportStatValue}>{Math.round(stats.totalEnrollments * 0.2)}</span>
              </div>
            </div>
            <div style={styles.reportCardActions}>
              <button style={{...styles.reportActionBtn, ...styles.viewReportBtn}}>👁 View</button>
              <button style={{...styles.reportActionBtn, ...styles.exportPdfBtn}}>📄 PDF</button>
              <button style={{...styles.reportActionBtn, ...styles.exportExcelBtn}}>📊 Excel</button>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Reports Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableHeaderTitle}>📋 Recent Reports</span>
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search style={styles.searchIcon} />
              <input
                type="text"
                style={styles.searchInput}
                placeholder="Search reports..."
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
            <select
              style={styles.filterSelect}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              {reportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="date"
              style={styles.filterSelect}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <input
              type="date"
              style={styles.filterSelect}
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
            <button style={styles.resetBtn} onClick={resetFilters}>
              <X size={14} /> Reset
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          {filteredReports.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div>No reports found</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Report Name</th>
                  <th style={styles.th}>Generated By</th>
                  <th style={styles.th}>Generated Date</th>
                  <th style={styles.th}>Format</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((report) => (
                  <tr key={report.id}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '500' }}>{report.name}</span>
                    </td>
                    <td style={styles.td}>{report.generatedBy}</td>
                    <td style={styles.td}>{report.date}</td>
                    <td style={styles.td}>
                      <span style={styles.formatBadge(report.format)}>
                        {report.format}
                      </span>
                    </td>
                    <td style={styles.td}>{report.size}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.viewActionBtn }}
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.downloadActionBtn }}
                          onClick={() => handleExport(report.format, report.name)}
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length} reports
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
                <ChevronLeft size={14} /> Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
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
              {totalPages > 3 && <span style={{ padding: '4px 8px', color: '#94a3b8' }}>...</span>}
              {totalPages > 3 && (
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
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminReports;