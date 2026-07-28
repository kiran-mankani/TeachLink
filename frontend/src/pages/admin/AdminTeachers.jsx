import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  Clock,
  Star,
  Search,
  Filter,
  X,
  Eye,
  UserX,
  UserCheck as ActivateIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  MoreVertical
} from 'lucide-react';

const AdminTeachers = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    avgRating: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    teachingMode: '',
    area: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');

  // Available filter options
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics', 'Accounting', 'Business Studies'];
  const modeOptions = ['Online', 'Physical', 'Both'];
  const areaOptions = ['Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'DHA', 'Clifton', 'Federal B Area', 'Malir', 'Korangi', 'Saddar', 'Gulberg', 'Nazimabad', 'Liaquatabad', 'Karachi City'];
  const statusOptions = ['Active', 'Inactive', 'Pending'];

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [teachers, searchQuery, filters]);

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Helper to get teaching mode from teacher object
  const getTeachingMode = (teacher) => {
    // Check all possible field names that backend might use
    const mode = 
      teacher.teaching_mode ||
      teacher.mode ||
      teacher.preferred_mode ||
      teacher.teacher_mode ||
      teacher.learning_mode ||
      null;
    
    // If mode exists, return it exactly as is (capitalization preserved)
    if (mode) {
      return mode;
    }
    
    // If no mode found, return "N/A"
    return 'N/A';
  };

  // ✅ Helper to get display name for teaching mode with icon
  const getTeachingModeDisplay = (mode) => {
    if (!mode || mode === 'N/A') return 'N/A';
    
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻 Online';
    if (modeLower === 'physical') return '🏠 Physical';
    if (modeLower === 'both') return '💻🏠 Both';
    
    // If unknown value, return as-is
    return mode;
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate API call - Replace with actual API
      const response = await fetch('/api/admin/teachers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeachers(data.teachers || []);
          calculateStats(data.teachers || []);
          return;
        }
      }

      // Placeholder data - Updated with realistic teaching_mode values
      const placeholderTeachers = [
        { id: 1, name: 'Dr. Talha Ahmed', email: 'talha@email.com', subjects: ['Mathematics', 'Physics'], teaching_mode: 'Online', area: 'Gulshan', experience: '5 years', rating: 4.8, status: 'active', photo: null, joined: '2026-01-15' },
        { id: 2, name: 'Prof. Rida Noor', email: 'rida@email.com', subjects: ['Chemistry', 'Biology'], teaching_mode: 'Physical', area: 'Korangi', experience: '3 years', rating: 4.6, status: 'active', photo: null, joined: '2026-02-20' },
        { id: 3, name: 'Sir Hassan Raza', email: 'hassan@email.com', subjects: ['Computer Science', 'Mathematics'], teaching_mode: 'Both', area: 'DHA', experience: '2 years', rating: 4.2, status: 'pending', photo: null, joined: '2026-03-10' },
        { id: 4, name: 'Ms. Zara Khan', email: 'zara@email.com', subjects: ['English', 'Urdu'], teaching_mode: 'Online', area: 'Clifton', experience: '4 years', rating: 4.9, status: 'active', photo: null, joined: '2026-01-05' },
        { id: 5, name: 'Mr. Omar Farooq', email: 'omar@email.com', subjects: ['Physics', 'Chemistry'], teaching_mode: 'Physical', area: 'Gulberg', experience: '6 years', rating: 4.7, status: 'active', photo: null, joined: '2025-12-01' },
        { id: 6, name: 'Ms. Ayesha Ali', email: 'ayesha@email.com', subjects: ['Biology', 'Chemistry'], teaching_mode: 'Online', area: 'Nazimabad', experience: '2 years', rating: 4.3, status: 'inactive', photo: null, joined: '2026-04-15' },
        { id: 7, name: 'Prof. Usman Malik', email: 'usman@email.com', subjects: ['Mathematics', 'Statistics'], teaching_mode: 'Both', area: 'Liaquatabad', experience: '7 years', rating: 4.9, status: 'active', photo: null, joined: '2025-11-20' },
        { id: 8, name: 'Ms. Fatima Noor', email: 'fatima@email.com', subjects: ['English', 'Literature'], teaching_mode: 'Online', area: 'Gulshan', experience: '3 years', rating: 4.5, status: 'active', photo: null, joined: '2026-02-01' },
        { id: 9, name: 'Mr. Bilal Ahmed', email: 'bilal@email.com', subjects: ['Physics', 'Mathematics'], teaching_mode: 'Physical', area: 'Korangi', experience: '4 years', rating: 4.4, status: 'pending', photo: null, joined: '2026-05-10' },
        { id: 10, name: 'Dr. Sara Ali', email: 'sara@email.com', subjects: ['Chemistry', 'Biology'], teaching_mode: 'Both', area: 'DHA', experience: '8 years', rating: 5.0, status: 'active', photo: null, joined: '2025-10-01' },
        { id: 11, name: 'Prof. Hassan Ahmed', email: 'hassan.ahmed@email.com', subjects: ['Computer Science', 'Programming'], teaching_mode: 'Online', area: 'Clifton', experience: '5 years', rating: 4.8, status: 'active', photo: null, joined: '2026-01-20' },
        { id: 12, name: 'Ms. Nida Khan', email: 'nida@email.com', subjects: ['Urdu', 'Islamiat'], teaching_mode: 'Physical', area: 'Gulberg', experience: '2 years', rating: 4.1, status: 'inactive', photo: null, joined: '2026-03-15' },
      ];

      setTeachers(placeholderTeachers);
      calculateStats(placeholderTeachers);

    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (teacherList) => {
    const total = teacherList.length;
    const active = teacherList.filter(t => t.status === 'active').length;
    const pending = teacherList.filter(t => t.status === 'pending').length;
    const avgRating = teacherList.reduce((sum, t) => sum + (t.rating || 0), 0) / total || 0;
    setStats({ total, active, pending, avgRating: Math.round(avgRating * 10) / 10 });
  };

  const applyFilters = () => {
    let result = [...teachers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.subjects.some(s => {
          const subjectName = typeof s === 'string' ? s : s.subject;
          return subjectName.toLowerCase().includes(query);
        })
      );
    }

    // Subject filter
    if (filters.subject) {
      result = result.filter(t => 
        t.subjects.some(s => {
          const subjectName = typeof s === 'string' ? s : s.subject;
          return subjectName === filters.subject;
        })
      );
    }

    // Teaching Mode filter - Compare with actual database value
    if (filters.teachingMode) {
      result = result.filter(t => {
        const mode = getTeachingMode(t);
        return mode === filters.teachingMode;
      });
    }

    // Area filter
    if (filters.area) {
      result = result.filter(t => t.area === filters.area);
    }

    // Status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status.toLowerCase());
    }

    setFilteredTeachers(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      subject: '',
      teachingMode: '',
      area: '',
      status: ''
    });
  };

  const handleStatusChange = (teacherId, newStatus) => {
    const updatedTeachers = teachers.map(t =>
      t.id === teacherId ? { ...t, status: newStatus } : t
    );
    setTeachers(updatedTeachers);
    calculateStats(updatedTeachers);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
      inactive: { bg: '#fee2e2', color: '#b91c1c', label: 'Inactive' },
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' }
    };
    return styles[status] || styles.pending;
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++) stars.push('⭐');
    if (halfStar) stars.push('☆');
    return stars.join('');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

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
    // Header
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
    // Stats Grid
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
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
    // Search & Filters
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
      minWidth: '140px',
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
    // Table
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
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden',
    },
    userAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    userName: {
      fontWeight: '500',
      color: '#1f1f3e',
    },
    userEmail: {
      fontSize: '12px',
      color: '#94a3b8',
    },
    subjectsCell: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
    },
    subjectChip: {
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      background: '#e0e7ff',
      color: '#4f46e5',
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
    ratingDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#f59e0b',
    },
    ratingStar: {
      fontSize: '12px',
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
    suspendBtn: {
      background: '#fef3c7',
      color: '#b45309',
    },
    activateBtn: {
      background: '#dcfce7',
      color: '#16a34a',
    },
    // Pagination
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
    // Empty State
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
          <div style={{ fontSize: '40px' }}>👨‍🏫</div>
          <div>Loading teachers...</div>
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
          <h1 style={styles.title}>👨‍🏫 Manage Teachers</h1>
          <p style={styles.subtitle}>View, search and manage all registered teachers.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <Users size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Teachers</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <UserCheck size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.active}</span>
            <span style={styles.statLabel}>Active Teachers</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pending}</span>
            <span style={styles.statLabel}>Pending Profile Completion</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <Star size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.avgRating}</span>
            <span style={styles.statLabel}>Average Rating</span>
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
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Subjects</option>
            {subjectOptions.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.teachingMode}
            onChange={(e) => setFilters({ ...filters, teachingMode: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Modes</option>
            {modeOptions.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Areas</option>
            {areaOptions.map(area => (
              <option key={area} value={area}>{area}</option>
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
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
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

      {/* Teachers Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredTeachers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <div style={styles.emptyTitle}>No teachers found</div>
              <div>Try adjusting your search or filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Photo</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Area</th>
                  <th style={styles.th}>Experience</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((teacher) => {
                  const status = getStatusBadge(teacher.status);
                  // ✅ Get teaching mode from database - no hardcoding
                  const teachingMode = getTeachingMode(teacher);
                  const teachingModeDisplay = getTeachingModeDisplay(teachingMode);
                  
                  return (
                    <tr key={teacher.id}>
                      <td style={styles.td}>
                        <div style={styles.userAvatar}>
                          {teacher.photo ? (
                            <img src={teacher.photo} alt={teacher.name} style={styles.userAvatarImage} />
                          ) : (
                            getInitials(teacher.name)
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={styles.userName}>{teacher.name}</div>
                          <div style={styles.userEmail}>{teacher.email}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.subjectsCell}>
                          {teacher.subjects.slice(0, 2).map((subject, idx) => (
                            <span key={idx} style={styles.subjectChip}>
                              {typeof subject === 'string' ? subject : subject.subject}
                            </span>
                          ))}
                          {teacher.subjects.length > 2 && (
                            <span style={{ ...styles.subjectChip, background: '#f1f5f9', color: '#94a3b8' }}>
                              +{teacher.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {/* ✅ Show exact database value with icon */}
                        {teachingModeDisplay}
                      </td>
                      <td style={styles.td}>{teacher.area}</td>
                      <td style={styles.td}>{teacher.experience}</td>
                      <td style={styles.td}>
                        <div style={styles.ratingDisplay}>
                          <span style={styles.ratingStar}>{getRatingStars(teacher.rating)}</span>
                          <span>{teacher.rating}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(teacher.status)}>
                          {status.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => navigate(`/admin/teacher/${teacher.id}`)}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Eye size={14} /> View
                          </button>
                          {teacher.status === 'active' ? (
                            <button
                              style={{ ...styles.actionBtn, ...styles.suspendBtn }}
                              onClick={() => handleStatusChange(teacher.id, 'inactive')}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <UserX size={14} /> Suspend
                            </button>
                          ) : teacher.status === 'inactive' ? (
                            <button
                              style={{ ...styles.actionBtn, ...styles.activateBtn }}
                              onClick={() => handleStatusChange(teacher.id, 'active')}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <ActivateIcon size={14} /> Activate
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.actionBtn, ...styles.viewBtn }}
                              onClick={() => handleStatusChange(teacher.id, 'active')}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <ActivateIcon size={14} /> Approve
                            </button>
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
        {filteredTeachers.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTeachers.length)} of {filteredTeachers.length} teachers
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

    </div>
  );
};

export default AdminTeachers;