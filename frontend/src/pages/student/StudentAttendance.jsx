import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';


const StudentAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendance_rate: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/student-dashboard', { state: { from: '/student/attendance' } });
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id || user?.userId;
      
      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/attendance/student/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setAttendance(data.attendance || []);
        setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, attendance_rate: 0 });
      } else {
        setError(data.error || 'Failed to load attendance');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Error loading attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: { bg: '#dcfce7', color: '#15803d', label: '✅ Present' },
      absent: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Absent' },
      late: { bg: '#fef3c7', color: '#b45309', label: '🟡 Late' },
      leave: { bg: '#e0e7ff', color: '#4a3aff', label: '📋 Leave' }
    };
    return styles[status] || styles.present;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch { 
      return dateString; 
    }
  };

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
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px 20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    statLabel: {
      fontSize: '13px',
      color: '#94a3b8',
      marginTop: '2px'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    tableHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px 20px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      borderBottom: '1px solid #e8e8e8',
      background: '#f8fafc'
    },
    td: {
      padding: '12px 20px',
      fontSize: '14px',
      color: '#1f1f3e',
      borderBottom: '1px solid #f0f0f0'
    },
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-block'
      };
    },
    emptyState: {
      padding: '40px',
      textAlign: 'center',
      color: '#94a3b8'
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
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading attendance...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar role="student" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/student-dashboard" />
          )}

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>📋 Attendance</h1>
              <p style={styles.subtitle}>Your attendance record</p>
            </div>
            <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
              Attendance Rate: {stats.attendance_rate}%
            </div>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>📚 Total Classes</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#22c55e' }}>{stats.present}</div>
              <div style={styles.statLabel}>✅ Present</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#ef4444' }}>{stats.absent}</div>
              <div style={styles.statLabel}>❌ Absent</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.late}</div>
              <div style={styles.statLabel}>🟡 Late</div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>📋 Attendance History</div>
            {attendance.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div>No attendance records yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#cbd5e1' }}>
                  Attendance will appear here once your teacher marks it
                </div>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Teacher</th>
                    <th style={styles.th}>Mode</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td style={styles.td}>{formatDate(record.date)}</td>
                      <td style={styles.td}>{record.course_id || 'General'}</td>
                      <td style={styles.td}>{record.teacher_name || 'Teacher'}</td>
                      <td style={styles.td}>
                        {record.mode === 'online' ? '💻 Online' : 
                         record.mode === 'physical' ? '🏠 Physical' : 'Both'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(record.status)}>
                          {getStatusBadge(record.status).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;