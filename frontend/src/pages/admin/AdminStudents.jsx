import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  BookOpen,
  Monitor,
  Search,
  Filter,
  X,
  Eye,
  UserMinus,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  Calendar,
  Phone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Download,
  Edit,
  Trash2
} from 'lucide-react';

const AdminStudents = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    profileCompleted: 0,
    pendingProfile: 0,
    activeEnrollments: 0,
    onlineStudents: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    learningMode: '',
    area: '',
    subject: '',
    enrollmentStatus: '',
    profileCompletion: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Available filter options
  const modeOptions = ['Online', 'Physical', 'Both'];
  const areaOptions = ['Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'DHA', 'Clifton', 'Federal B Area', 'Malir', 'Korangi', 'Saddar', 'Gulberg', 'Nazimabad', 'Liaquatabad', 'Karachi City'];
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics', 'Accounting', 'Business Studies'];
  const enrollmentStatusOptions = ['Active', 'Completed', 'Pending', 'Cancelled'];
  const profileCompletionOptions = ['Complete', 'Partial', 'Low'];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, filters]);

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      // Placeholder - Replace with real API call
      // const response = await fetch('/api/admin/students', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      // Placeholder data - Will be replaced by real database data
      const placeholderStudents = [
        { id: 1, name: 'Ali Khan', email: 'ali@email.com', phone: '+92 300 1234567', subjects: ['Mathematics', 'Physics'], learningMode: 'Online', area: 'Gulshan', educationLevel: 'Matric / O Level', profileCompletion: 95, enrollmentStatus: 'Active', enrollments: 2, joinedDate: '2026-01-15', profilePicture: null, isActive: true },
        { id: 2, name: 'Sara Ali', email: 'sara@email.com', phone: '+92 321 7654321', subjects: ['Chemistry', 'Biology'], learningMode: 'Physical', area: 'DHA', educationLevel: 'Intermediate / A Level', profileCompletion: 100, enrollmentStatus: 'Active', enrollments: 1, joinedDate: '2026-02-20', profilePicture: null, isActive: true },
        { id: 3, name: 'Usman Malik', email: 'usman@email.com', phone: '+92 334 9876543', subjects: ['Computer Science', 'Mathematics'], learningMode: 'Both', area: 'Korangi', educationLevel: 'Matric / O Level', profileCompletion: 60, enrollmentStatus: 'Pending', enrollments: 0, joinedDate: '2026-03-10', profilePicture: null, isActive: false },
        { id: 4, name: 'Ayesha Noor', email: 'ayesha@email.com', phone: '+92 345 5432109', subjects: ['English', 'Urdu'], learningMode: 'Online', area: 'Clifton', educationLevel: 'Intermediate / A Level', profileCompletion: 90, enrollmentStatus: 'Active', enrollments: 3, joinedDate: '2026-01-05', profilePicture: null, isActive: true },
        { id: 5, name: 'Bilal Ahmed', email: 'bilal@email.com', phone: '+92 312 4567890', subjects: ['Physics', 'Chemistry'], learningMode: 'Physical', area: 'Gulberg', educationLevel: 'Matric / O Level', profileCompletion: 75, enrollmentStatus: 'Completed', enrollments: 1, joinedDate: '2025-12-01', profilePicture: null, isActive: true },
        { id: 6, name: 'Hina Raza', email: 'hina@email.com', phone: '+92 333 5678901', subjects: ['Biology', 'Chemistry'], learningMode: 'Online', area: 'Nazimabad', educationLevel: 'Intermediate / A Level', profileCompletion: 40, enrollmentStatus: 'Pending', enrollments: 0, joinedDate: '2026-04-15', profilePicture: null, isActive: false },
        { id: 7, name: 'Zain Malik', email: 'zain@email.com', phone: '+92 321 6789012', subjects: ['Mathematics', 'Statistics'], learningMode: 'Both', area: 'Liaquatabad', educationLevel: 'Matric / O Level', profileCompletion: 85, enrollmentStatus: 'Active', enrollments: 2, joinedDate: '2025-11-20', profilePicture: null, isActive: true },
        { id: 8, name: 'Nida Noor', email: 'nida@email.com', phone: '+92 312 7890123', subjects: ['English', 'Literature'], learningMode: 'Online', area: 'Gulshan', educationLevel: 'Intermediate / A Level', profileCompletion: 70, enrollmentStatus: 'Active', enrollments: 1, joinedDate: '2026-02-01', profilePicture: null, isActive: true },
        { id: 9, name: 'Hassan Ahmed', email: 'hassan.ahmed@email.com', phone: '+92 334 8901234', subjects: ['Physics', 'Mathematics'], learningMode: 'Physical', area: 'Korangi', educationLevel: 'Matric / O Level', profileCompletion: 50, enrollmentStatus: 'Pending', enrollments: 0, joinedDate: '2026-05-10', profilePicture: null, isActive: false },
        { id: 10, name: 'Sana Ali', email: 'sana.ali@email.com', phone: '+92 345 9012345', subjects: ['Chemistry', 'Biology'], learningMode: 'Both', area: 'DHA', educationLevel: 'Intermediate / A Level', profileCompletion: 100, enrollmentStatus: 'Active', enrollments: 2, joinedDate: '2025-10-01', profilePicture: null, isActive: true },
        { id: 11, name: 'Farhan Ahmed', email: 'farhan@email.com', phone: '+92 321 0123456', subjects: ['Computer Science', 'Programming'], learningMode: 'Online', area: 'Clifton', educationLevel: 'Matric / O Level', profileCompletion: 80, enrollmentStatus: 'Active', enrollments: 1, joinedDate: '2026-01-20', profilePicture: null, isActive: true },
        { id: 12, name: 'Maira Khan', email: 'maira@email.com', phone: '+92 334 1234560', subjects: ['Urdu', 'Islamiat'], learningMode: 'Physical', area: 'Gulberg', educationLevel: 'Intermediate / A Level', profileCompletion: 45, enrollmentStatus: 'Pending', enrollments: 0, joinedDate: '2026-03-15', profilePicture: null, isActive: false }
      ];

      setStudents(placeholderStudents);
      calculateStats(placeholderStudents);
      setFilteredStudents(placeholderStudents);

    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentList) => {
    const total = studentList.length;
    const active = studentList.filter(s => s.isActive).length;
    const profileCompleted = studentList.filter(s => s.profileCompletion >= 90).length;
    const pendingProfile = studentList.filter(s => s.profileCompletion < 90).length;
    const activeEnrollments = studentList.reduce((sum, s) => sum + (s.enrollments || 0), 0);
    const onlineStudents = studentList.filter(s => s.learningMode === 'Online' || s.learningMode === 'Both').length;
    setStats({ total, active, profileCompleted, pendingProfile, activeEnrollments, onlineStudents });
  };

  const applyFilters = () => {
    let result = [...students];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }

    if (filters.learningMode) {
      result = result.filter(s => s.learningMode === filters.learningMode);
    }

    if (filters.area) {
      result = result.filter(s => s.area === filters.area);
    }

    if (filters.subject) {
      result = result.filter(s => 
        s.subjects.some(sub => getSubjectName(sub) === filters.subject)
      );
    }

    if (filters.enrollmentStatus) {
      result = result.filter(s => s.enrollmentStatus === filters.enrollmentStatus);
    }

    if (filters.profileCompletion) {
      if (filters.profileCompletion === 'Complete') {
        result = result.filter(s => s.profileCompletion >= 90);
      } else if (filters.profileCompletion === 'Partial') {
        result = result.filter(s => s.profileCompletion >= 50 && s.profileCompletion < 90);
      } else if (filters.profileCompletion === 'Low') {
        result = result.filter(s => s.profileCompletion < 50);
      }
    }

    setFilteredStudents(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      learningMode: '',
      area: '',
      subject: '',
      enrollmentStatus: '',
      profileCompletion: ''
    });
  };

  // ✅ FIXED: View Student Handler - Navigate to student detail page
  const handleViewStudent = (studentId) => {
    if (!studentId) {
      console.error('❌ No student ID provided');
      return;
    }
    console.log('📤 Navigating to student details:', studentId);
    navigate(`/admin/student/${studentId}`, { state: { from: '/admin/students' } });
  };

  const handleSuspend = async (studentId) => {
    if (!window.confirm('Are you sure you want to suspend this student?')) return;
    
    setActionLoading(true);
    try {
      // Placeholder API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedStudents = students.map(s =>
        s.id === studentId ? { ...s, isActive: false, enrollmentStatus: 'Pending' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
      alert('Student suspended successfully.');
    } catch (err) {
      alert('Failed to suspend student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (studentId) => {
    if (!window.confirm('Are you sure you want to activate this student?')) return;
    
    setActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedStudents = students.map(s =>
        s.id === studentId ? { ...s, isActive: true, enrollmentStatus: 'Active' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
      alert('Student activated successfully.');
    } catch (err) {
      alert('Failed to activate student.');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (isActive) => {
    return {
      padding: '3px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#15803d' : '#b91c1c',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };
  };

  const getCompletionBadge = (percentage) => {
    if (percentage >= 90) return { bg: '#dcfce7', color: '#15803d', label: 'Complete' };
    if (percentage >= 50) return { bg: '#fef3c7', color: '#b45309', label: 'Partial' };
    return { bg: '#fee2e2', color: '#b91c1c', label: 'Low' };
  };

  const getEnrollmentStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#dcfce7', color: '#15803d' },
      Completed: { bg: '#e0e7ff', color: '#4a3aff' },
      Pending: { bg: '#fef3c7', color: '#b45309' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' }
    };
    const style = styles[status] || styles.Pending;
    return {
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      background: style.bg,
      color: style.color,
      display: 'inline-block',
    };
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

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
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
    statIconPurple: { backgroundColor: '#ede9fe', color: '#7c3aed' },
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
    statusBadge: (isActive) => {
      const style = getStatusBadge(isActive);
      return {
        padding: '3px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#15803d' : '#b91c1c',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      };
    },
    completionBadge: (percentage) => {
      const style = getCompletionBadge(percentage);
      return {
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        background: style.bg,
        color: style.color,
        display: 'inline-block',
      };
    },
    completionBar: {
      width: '60px',
      height: '6px',
      background: '#f1f5f9',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '4px',
    },
    completionFill: (percentage) => ({
      height: '100%',
      width: `${percentage}%`,
      borderRadius: '3px',
      background: percentage >= 90 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444',
      transition: 'width 0.5s ease',
    }),
    enrollmentStatusBadge: (status) => {
      const style = getEnrollmentStatusBadge(status);
      return {
        padding: '3px 10px',
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
      maxWidth: '650px',
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
    modalSection: {
      marginBottom: '16px',
      padding: '14px 16px',
      background: '#f8fafc',
      borderRadius: '10px',
    },
    modalSectionTitle: {
      fontSize: '13px',
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
          <div style={{ fontSize: '40px' }}>👨‍🎓</div>
          <div>Loading students...</div>
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
          <h1 style={styles.title}>👨‍🎓 Manage Students</h1>
          <p style={styles.subtitle}>View, search and manage all registered students.</p>
        </div>
        <button
          style={{
            ...styles.actionBtn,
            ...styles.viewBtn,
            padding: '10px 20px',
            fontSize: '14px',
          }}
          onClick={fetchStudents}
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
            <Users size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Total Students</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <UserCheck size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.active}</span>
            <span style={styles.statLabel}>Active Students</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPurple}}>
            <CheckCircle size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.profileCompleted}</span>
            <span style={styles.statLabel}>Profile Completed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconOrange}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pendingProfile}</span>
            <span style={styles.statLabel}>Pending Profile</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <BookOpen size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.activeEnrollments}</span>
            <span style={styles.statLabel}>Active Enrollments</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPink}}>
            <Monitor size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.onlineStudents}</span>
            <span style={styles.statLabel}>Online Students</span>
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
            placeholder="Search by name or email..."
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
            value={filters.learningMode}
            onChange={(e) => setFilters({ ...filters, learningMode: e.target.value })}
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
            value={filters.enrollmentStatus}
            onChange={(e) => setFilters({ ...filters, enrollmentStatus: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Status</option>
            {enrollmentStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            style={styles.filterSelect}
            value={filters.profileCompletion}
            onChange={(e) => setFilters({ ...filters, profileCompletion: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
          >
            <option value="">All Completion</option>
            {profileCompletionOptions.map(status => (
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

      {/* Students Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {filteredStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🎓</div>
              <div style={styles.emptyTitle}>No students found</div>
              <div>Try adjusting your search or filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Photo</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Course</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Area</th>
                  <th style={styles.th}>Profile</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student) => {
                  const completion = getCompletionBadge(student.profileCompletion);
                  const studentId = student.id;
                  return (
                    <tr key={student.id}>
                      <td style={styles.td}>
                        <div style={styles.userAvatar}>
                          {student.profilePicture ? (
                            <img src={student.profilePicture} alt={student.name} style={styles.userAvatarImage} />
                          ) : (
                            getInitials(student.name)
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={styles.userName}>{student.name}</div>
                          <div style={styles.userEmail}>{student.email}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.subjectsCell}>
                          {student.subjects.slice(0, 2).map((subject, idx) => (
                            <span key={idx} style={styles.subjectChip}>
                              {typeof subject === 'string' ? subject : subject.subject}
                            </span>
                          ))}
                          {student.subjects.length > 2 && (
                            <span style={{ ...styles.subjectChip, background: '#f1f5f9', color: '#94a3b8' }}>
                              +{student.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {student.learningMode === 'Online' ? '💻 Online' :
                         student.learningMode === 'Physical' ? '🏠 Physical' : '💻🏠 Both'}
                      </td>
                      <td style={styles.td}>{student.area}</td>
                      <td style={styles.td}>
                        <div>
                          <span style={styles.completionBadge(student.profileCompletion)}>
                            {completion.label}
                          </span>
                          <div style={styles.completionBar}>
                            <div style={styles.completionFill(student.profileCompletion)}></div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <span style={styles.enrollmentStatusBadge(student.enrollmentStatus)}>
                            {student.enrollmentStatus}
                          </span>
                          <span style={{
                            ...styles.statusBadge(student.isActive),
                            marginTop: '4px',
                            display: 'inline-flex',
                          }}>
                            {student.isActive ? '🟢 Active' : '🔴 Inactive'}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '12px' }}>{formatDate(student.joinedDate)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {student.enrollments} enrollments
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {/* ✅ FIXED: View Button - Now navigates to student detail page */}
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => handleViewStudent(studentId)}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <Eye size={14} /> View
                          </button>
                          {student.isActive ? (
                            <button
                              style={{ ...styles.actionBtn, ...styles.suspendBtn }}
                              onClick={() => handleSuspend(student.id)}
                              disabled={actionLoading}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <UserMinus size={14} /> Suspend
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.actionBtn, ...styles.activateBtn }}
                              onClick={() => handleActivate(student.id)}
                              disabled={actionLoading}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              <UserPlus size={14} /> Activate
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
        {filteredStudents.length > 0 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
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

      {/* View Profile Modal */}
      {showDetailsModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👤 Student Profile</h3>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowDetailsModal(false)}
                onMouseEnter={(e) => e.target.style.color = '#1f1f3e'}
                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{...styles.userAvatar, width: '64px', height: '64px', fontSize: '24px'}}>
                {selectedStudent.profilePicture ? (
                  <img src={selectedStudent.profilePicture} alt={selectedStudent.name} style={styles.userAvatarImage} />
                ) : (
                  getInitials(selectedStudent.name)
                )}
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f1f3e' }}>
                  {selectedStudent.name}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {selectedStudent.email} • {selectedStudent.phone || 'No phone'}
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                  Joined: {formatDate(selectedStudent.joinedDate)}
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📋 Personal Information</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Name</span>
                <span style={styles.modalValue}>{selectedStudent.name}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Email</span>
                <span style={styles.modalValue}>{selectedStudent.email}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Phone</span>
                <span style={styles.modalValue}>{selectedStudent.phone || 'Not provided'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Area</span>
                <span style={styles.modalValue}>{selectedStudent.area}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Education Level</span>
                <span style={styles.modalValue}>{selectedStudent.educationLevel || 'Not specified'}</span>
              </div>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📚 Academic Information</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Learning Mode</span>
                <span style={styles.modalValue}>
                  {selectedStudent.learningMode === 'Online' ? '💻 Online' :
                   selectedStudent.learningMode === 'Physical' ? '🏠 Physical' : '💻🏠 Both'}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Subjects</span>
                <span style={styles.modalValue}>
                  {selectedStudent.subjects
                    .map(s => typeof s === 'string' ? s : s.subject)
                    .join(' • ')}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Profile Completion</span>
                <span style={styles.modalValue}>
                  {selectedStudent.profileCompletion}%
                  <span style={{ marginLeft: '8px', ...styles.completionBadge(selectedStudent.profileCompletion) }}>
                    {getCompletionBadge(selectedStudent.profileCompletion).label}
                  </span>
                </span>
              </div>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📊 Enrollment & Status</div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Enrollment Status</span>
                <span style={styles.modalValue}>
                  <span style={styles.enrollmentStatusBadge(selectedStudent.enrollmentStatus)}>
                    {selectedStudent.enrollmentStatus}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Account Status</span>
                <span style={styles.modalValue}>
                  <span style={styles.statusBadge(selectedStudent.isActive)}>
                    {selectedStudent.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Enrollments</span>
                <span style={styles.modalValue}>{selectedStudent.enrollments} courses</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Joined Date</span>
                <span style={styles.modalValue}>{formatDate(selectedStudent.joinedDate)}</span>
              </div>
            </div>

            <div style={styles.modalActions}>
              {selectedStudent.isActive ? (
                <button
                  style={{
                    ...styles.modalActionBtn,
                    background: '#b45309',
                    color: 'white',
                  }}
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleSuspend(selectedStudent.id);
                  }}
                  disabled={actionLoading}
                >
                  <UserMinus size={18} /> Suspend Student
                </button>
              ) : (
                <button
                  style={{
                    ...styles.modalActionBtn,
                    background: '#22c55e',
                    color: 'white',
                  }}
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleActivate(selectedStudent.id);
                  }}
                  disabled={actionLoading}
                >
                  <UserPlus size={18} /> Activate Student
                </button>
              )}
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

export default AdminStudents;