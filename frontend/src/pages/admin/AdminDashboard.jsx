import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Clock,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  UserPlus,
  UserCheck,
  Calendar,
  Award
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeEnrollments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [latestStudents, setLatestStudents] = useState([]);
  const [latestTeachers, setLatestTeachers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [analytics, setAnalytics] = useState({
    studentsVsTeachers: { students: 0, teachers: 0 },
    monthlyEnrollments: [],
    paymentStatus: { paid: 0, pending: 0, rejected: 0 }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleNavigate = (path) => {
    navigate(path, { state: { from: '/admin/dashboard' } });
  };

  // ✅ Student View - Using the SAME pattern as AdminStudents.jsx
  const handleViewStudent = (studentId) => {
    if (!studentId) {
      console.error('❌ No student ID provided');
      return;
    }
    // AdminStudents.jsx uses: navigate(`/admin/student/${studentId}`)
    navigate(`/admin/student/${studentId}`, { state: { from: '/admin/dashboard' } });
  };

  // ✅ Teacher View - Using the SAME pattern as AdminTeachers.jsx
  const handleViewTeacher = (teacherId) => {
    if (!teacherId) {
      console.error('❌ No teacher ID provided');
      return;
    }
    // AdminTeachers.jsx uses: navigate(`/admin/teacher/${teacher.id}`)
    navigate(`/admin/teacher/${teacherId}`, { state: { from: '/admin/dashboard' } });
  };

  // ✅ Enrollment View - Using the SAME pattern as AdminEnrollments.jsx
  const handleViewEnrollment = (enrollmentId) => {
    if (!enrollmentId) {
      console.error('❌ No enrollment ID provided');
      return;
    }
    // AdminEnrollments.jsx uses: navigate(`/admin/enrollments/${enrollmentId}`)
    navigate(`/admin/enrollments/${enrollmentId}`, { state: { from: '/admin/dashboard' } });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();

      if (data.success) {
        const safeAmount = (amount) => {
          if (typeof amount === 'object' && amount !== null) {
            return amount.amount || amount.total || amount.value || 0;
          }
          return amount || 0;
        };

        setStats({
          totalStudents: data.stats?.totalStudents || 0,
          totalTeachers: data.stats?.totalTeachers || 0,
          activeEnrollments: data.stats?.activeEnrollments || 0,
          pendingPayments: data.stats?.pendingPayments || 0,
          totalRevenue: safeAmount(data.stats?.totalRevenue),
          pendingRequests: data.stats?.pendingRequests || 0
        });

        setAnalytics({
          studentsVsTeachers: {
            students: data.stats?.totalStudents || 0,
            teachers: data.stats?.totalTeachers || 0
          },
          monthlyEnrollments: data.analytics?.monthlyEnrollments || [],
          paymentStatus: data.analytics?.paymentStatus || { paid: 0, pending: 0, rejected: 0 }
        });

        setRecentActivity(data.recentActivity || []);
        setLatestStudents(data.latestStudents || []);
        setLatestTeachers(data.latestTeachers || []);
        
        // ✅ CRITICAL FIX: Convert amount to number
        const processedPayments = (data.pendingPayments || []).map(p => ({
          ...p,
          amount: (() => {
            const amt = p.amount;
            if (typeof amt === 'object' && amt !== null) {
              return Number(amt.amount || amt.budget || amt.value || 0);
            }
            return Number(amt || 0);
          })()
        }));
        setPendingPayments(processedPayments);
        
        setPendingRequests(data.pendingRequests || []);
      } else {
        setError(data.error || 'Failed to load dashboard');
      }

    } catch (err) {
      console.error('❌ Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm('Approve this payment?')) return;
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Payment approved!');
        fetchDashboardData();
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm('Reject this payment?')) return;
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('❌ Payment rejected.');
        fetchDashboardData();
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
      inactive: { bg: '#fee2e2', color: '#b91c1c', label: 'Inactive' },
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
      completed: { bg: '#e0e7ff', color: '#4a3aff', label: 'Completed' }
    };
    return styles[status] || styles.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
      paid: { bg: '#dcfce7', color: '#15803d', label: '✅ Paid' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected' }
    };
    return styles[status] || styles.pending;
  };

  const formatCurrency = (amount) => {
    let value = amount;
    if (typeof amount === 'object' && amount !== null) {
      value = amount.amount || amount.total || amount.value || 0;
    }
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getActivityIcon = (type) => {
    const icons = {
      'student_registered': UserPlus,
      'teacher_registered': UserCheck,
      'teacher_completed': UserCheck,
      'student_completed': UserCheck,
      'payment_approved': CheckCircle,
      'enrollment_accepted': BookOpen,
      'attendance_submitted': Calendar,
      'default': Activity
    };
    return icons[type] || icons.default;
  };

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Helper to get student area - Same as AdminStudents.jsx
  const getStudentArea = (student) => {
    // Check all possible field names that backend might use
    const area = 
      student.location ||
      student.student_location ||
      student.area ||
      student.student_area ||
      student.city ||
      null;
    
    return area || 'N/A';
  };

  // ✅ Helper to get teaching mode - Same as AdminTeachers.jsx
  const getTeachingMode = (teacher) => {
    // Check all possible field names that backend might use
    const mode = 
      teacher.teaching_mode ||
      teacher.mode ||
      teacher.preferred_mode ||
      teacher.teacher_mode ||
      teacher.learning_mode ||
      null;
    
    return mode || 'N/A';
  };

  // ✅ Helper to get teaching mode display with icon - Same as AdminTeachers.jsx
  const getTeachingModeDisplay = (mode) => {
    if (!mode || mode === 'N/A') return 'N/A';
    
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻 Online';
    if (modeLower === 'physical') return '🏠 Physical';
    if (modeLower === 'both') return '💻🏠 Both';
    
    // If unknown value, return as-is
    return mode;
  };

  const styles = {
    container: {
      padding: '0',
      maxWidth: '100%',
    },
    welcomeSection: {
      background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
      borderRadius: '20px',
      padding: '28px 35px',
      marginBottom: '25px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(15, 52, 96, 0.3)',
    },
    welcomeGradient1: {
      position: 'absolute',
      top: '-50%',
      right: '-10%',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)',
      pointerEvents: 'none',
    },
    welcomeGradient2: {
      position: 'absolute',
      bottom: '-30%',
      left: '20%',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08), transparent 70%)',
      pointerEvents: 'none',
    },
    welcomeContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      position: 'relative',
      zIndex: 1,
    },
    welcomeLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    welcomeTitle: {
      fontSize: '26px',
      fontWeight: '700',
      color: 'white',
    },
    welcomeHighlight: {
      background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    welcomeSubtext: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.6)',
      marginTop: '2px',
    },
    welcomeDateTime: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.5)',
      marginTop: '4px',
    },
    welcomeBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 14px',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderRadius: '50px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#a78bfa',
      border: '1px solid rgba(99, 102, 241, 0.3)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
      cursor: 'default',
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
    analyticsSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
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
    barChart: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    barItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    barLabel: {
      fontSize: '13px',
      color: '#475569',
      minWidth: '80px',
    },
    barTrack: {
      flex: 1,
      height: '28px',
      background: '#f1f5f9',
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative',
    },
    barFill: {
      height: '100%',
      borderRadius: '6px',
      transition: 'width 1s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '10px',
      fontSize: '12px',
      color: 'white',
      fontWeight: '600',
    },
    pieLegend: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '10px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#475569',
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '3px',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      marginBottom: '30px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewAllLink: {
      fontSize: '13px',
      color: '#3b82f6',
      cursor: 'pointer',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      fontFamily: 'inherit',
    },
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '10px',
      transition: 'all 0.2s',
    },
    activityIconBox: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: '#f1f5f9',
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: '13px',
      color: '#1f1f3e',
    },
    activityTime: {
      fontSize: '11px',
      color: '#94a3b8',
    },
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '30px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '8px 10px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      borderBottom: '1px solid #e8e8e8',
    },
    td: {
      padding: '10px 10px',
      fontSize: '13px',
      color: '#1f1f3e',
      borderBottom: '1px solid #f0f0f0',
    },
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
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
    statusBadge: (status) => {
      const style = getStatusBadge(status);
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
    paymentStatusBadge: (status) => {
      const style = getPaymentStatusBadge(status);
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
    approveBtn: {
      padding: '4px 12px',
      background: '#22c55e',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      marginRight: '4px',
      transition: 'all 0.2s',
    },
    rejectBtn: {
      padding: '4px 12px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '11px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
    },
    emptyState: {
      textAlign: 'center',
      padding: '30px',
      color: '#94a3b8',
      fontSize: '14px',
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
          <div>Loading dashboard...</div>
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

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const total = analytics.studentsVsTeachers.students + analytics.studentsVsTeachers.teachers;
  const studentPercent = total > 0 ? Math.round((analytics.studentsVsTeachers.students / total) * 100) : 0;
  const teacherPercent = total > 0 ? Math.round((analytics.studentsVsTeachers.teachers / total) * 100) : 0;

  const totalPayments = analytics.paymentStatus.paid + analytics.paymentStatus.pending + analytics.paymentStatus.rejected;
  const paidPercent = totalPayments > 0 ? Math.round((analytics.paymentStatus.paid / totalPayments) * 100) : 0;
  const pendingPercent = totalPayments > 0 ? Math.round((analytics.paymentStatus.pending / totalPayments) * 100) : 0;
  const rejectedPercent = totalPayments > 0 ? Math.round((analytics.paymentStatus.rejected / totalPayments) * 100) : 0;

  return (
    <div style={styles.container}>
      
      <div style={styles.welcomeSection}>
        <div style={styles.welcomeGradient1}></div>
        <div style={styles.welcomeGradient2}></div>
        
        <div style={styles.welcomeContent}>
          <div style={styles.welcomeLeft}>
            <div style={styles.welcomeBadge}>👨‍💼 Admin</div>
            <div style={styles.welcomeTitle}>
              Welcome Back, <span style={styles.welcomeHighlight}>Admin</span>! 👋
            </div>
            <div style={styles.welcomeSubtext}>
              Monitor and manage the TeachLink platform.
            </div>
            <div style={styles.welcomeDateTime}>
              {dateStr} • {timeStr}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconBlue}}>
            <GraduationCap size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.totalStudents}</span>
            <span style={styles.statLabel}>Total Students</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconGreen}}>
            <Users size={24} />
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
            <span style={styles.statNumber}>{stats.activeEnrollments}</span>
            <span style={styles.statLabel}>Active Enrollments</span>
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

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconRed}}>
            <Clock size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pendingPayments}</span>
            <span style={styles.statLabel}>Pending Payments</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, ...styles.statIconPink}}>
            <Mail size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.pendingRequests}</span>
            <span style={styles.statLabel}>Pending Requests</span>
          </div>
        </div>
      </div>

      <div style={styles.analyticsSection}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <BarChart3 size={18} color="#3b82f6" />
            Students vs Teachers
          </div>
          <div style={styles.barChart}>
            <div style={styles.barItem}>
              <span style={styles.barLabel}>👨‍🎓 Students</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${Math.max(studentPercent, 5)}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1)'
                }}>
                  {analytics.studentsVsTeachers.students}
                </div>
              </div>
            </div>
            <div style={styles.barItem}>
              <span style={styles.barLabel}>👨‍🏫 Teachers</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${Math.max(teacherPercent, 5)}%`,
                  background: 'linear-gradient(90deg, #22c55e, #34d399)'
                }}>
                  {analytics.studentsVsTeachers.teachers}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <TrendingUp size={18} color="#22c55e" />
            Monthly Enrollments
          </div>
          {analytics.monthlyEnrollments.length > 0 ? (
            <div style={styles.barChart}>
              {analytics.monthlyEnrollments.map((item, index) => {
                const max = Math.max(...analytics.monthlyEnrollments.map(i => i.count), 1);
                const percent = Math.round((item.count / max) * 100);
                return (
                  <div key={index} style={styles.barItem}>
                    <span style={{...styles.barLabel, minWidth: '40px', fontSize: '11px' }}>
                      {item.month}
                    </span>
                    <div style={styles.barTrack}>
                      <div style={{
                        ...styles.barFill,
                        width: `${Math.max(percent, 5)}%`,
                        background: `linear-gradient(90deg, ${index % 2 === 0 ? '#8b5cf6' : '#a78bfa'}, ${index % 2 === 0 ? '#6366f1' : '#8b5cf6'})`
                      }}>
                        {item.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>
              No enrollment data available
            </div>
          )}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <PieChart size={18} color="#8b5cf6" />
            Payment Status
          </div>
          <div style={styles.pieLegend}>
            <div style={styles.legendItem}>
              <span style={{...styles.legendColor, background: '#22c55e'}}></span>
              Paid ({paidPercent}%) - {analytics.paymentStatus.paid}
            </div>
            <div style={styles.legendItem}>
              <span style={{...styles.legendColor, background: '#f59e0b'}}></span>
              Pending ({pendingPercent}%) - {analytics.paymentStatus.pending}
            </div>
            <div style={styles.legendItem}>
              <span style={{...styles.legendColor, background: '#ef4444'}}></span>
              Rejected ({rejectedPercent}%) - {analytics.paymentStatus.rejected}
            </div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
              Total: {totalPayments} payments
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>🔄 Recent Activity</span>
        </div>
        <div style={styles.activityList}>
          {recentActivity.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div>No recent activity</div>
            </div>
          ) : (
            recentActivity.slice(0, 6).map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityIconBox}>
                    <Icon size={16} color="#6366f1" />
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>{activity.message}</div>
                    <div style={styles.activityTime}>
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.twoColumn}>
        {/* ✅ Latest Students Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>👨‍🎓 Latest Students</span>
            <button 
              style={styles.viewAllLink} 
              onClick={() => handleNavigate('/admin/students')}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              View All →
            </button>
          </div>
          {latestStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🎓</div>
              <div>No students registered</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Photo</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Area</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {latestStudents.slice(0, 5).map((student) => {
                  const status = getStatusBadge(student.status);
                  const area = getStudentArea(student);
                  const studentId = student._id || student.id;
                  return (
                    <tr key={studentId}>
                      <td style={styles.td}>
                        <div style={styles.userAvatar}>
                          {student.profile_picture ? (
                            <img src={student.profile_picture} alt={student.name} style={styles.userAvatarImage} />
                          ) : (
                            getInitials(student.name)
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>{student.name || 'Student'}</td>
                      <td style={styles.td}>{area}</td>
                      <td style={styles.td}>
                        {student.learning_mode === 'online' ? '💻 Online' :
                         student.learning_mode === 'physical' ? '🏠 Physical' : '💻🏠 Both'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(student.status || 'active')}>
                          {status.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.viewBtn}
                          onClick={() => handleViewStudent(studentId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Latest Teachers Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>👨‍🏫 Latest Teachers</span>
            <button 
              style={styles.viewAllLink} 
              onClick={() => handleNavigate('/admin/teachers')}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              View All →
            </button>
          </div>
          {latestTeachers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🏫</div>
              <div>No teachers registered</div>
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
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {latestTeachers.slice(0, 5).map((teacher) => {
                  const status = getStatusBadge(teacher.status);
                  const subjects = teacher.subjects || [];
                  const teachingMode = getTeachingMode(teacher);
                  const teachingModeDisplay = getTeachingModeDisplay(teachingMode);
                  const teacherId = teacher._id || teacher.id;
                  return (
                    <tr key={teacherId}>
                      <td style={styles.td}>
                        <div style={styles.userAvatar}>
                          {teacher.profile_picture ? (
                            <img src={teacher.profile_picture} alt={teacher.name} style={styles.userAvatarImage} />
                          ) : (
                            getInitials(teacher.name)
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>{teacher.name || 'Teacher'}</td>
                      <td style={styles.td}>
                        {subjects
                          .map(s => typeof s === 'string' ? s : s.subject)
                          .slice(0, 2)
                          .join(', ')}
                        {subjects.length > 2 && '...'}
                      </td>
                      <td style={styles.td}>
                        {teachingModeDisplay}
                      </td>
                      <td style={styles.td}>{teacher.area || teacher.location || 'N/A'}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(teacher.status || 'active')}>
                          {status.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.viewBtn}
                          onClick={() => handleViewTeacher(teacherId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 7 & 8: Pending Payments & Enrollment Requests */}
      <div style={styles.twoColumn}>
        {/* Pending Payments */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>💰 Pending Payments</span>
            <button 
              style={styles.viewAllLink} 
              onClick={() => handleNavigate('/admin/payments')}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              View All →
            </button>
          </div>
          {pendingPayments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✅</div>
              <div>No pending payments</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.slice(0, 5).map((payment) => (
                  <tr key={payment._id || payment.id}>
                    <td style={styles.td}>{payment.student_name || 'Student'}</td>
                    <td style={styles.td}>{payment.teacher_name || 'Teacher'}</td>
                    <td style={styles.td}>
                      {typeof payment.subject === 'string' ? payment.subject : payment.subject?.subject || 'General'}
                    </td>
                    <td style={styles.td}>
                      Rs. {(() => {
                        const amt = payment.amount;
                        if (typeof amt === 'object' && amt !== null) {
                          return Number(amt.amount || amt.budget || amt.value || 0);
                        }
                        return Number(amt || 0);
                      })()}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.paymentStatusBadge('pending')}>
                        ⏳ Pending
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={styles.approveBtn}
                        onClick={() => handleApprovePayment(payment._id || payment.id)}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        Approve
                      </button>
                      <button 
                        style={styles.rejectBtn}
                        onClick={() => handleRejectPayment(payment._id || payment.id)}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Pending Enrollment Requests */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>📩 Pending Enrollment Requests</span>
            <button 
              style={styles.viewAllLink} 
              onClick={() => handleNavigate('/admin/enrollments')}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              View All →
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div>No pending requests</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.slice(0, 5).map((request) => {
                  const requestId = request._id || request.id;
                  return (
                    <tr key={requestId}>
                      <td style={styles.td}>{request.student_name || 'Student'}</td>
                      <td style={styles.td}>{request.teacher_name || 'Teacher'}</td>
                      <td style={styles.td}>
                        {typeof request.subject === 'string' ? request.subject : request.subject?.subject || 'General'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.paymentStatusBadge('pending')}>
                          ⏳ Pending
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.viewBtn}
                          onClick={() => handleViewEnrollment(requestId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;