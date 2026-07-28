import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';


const TeacherAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher/attendance' } });
  };

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching students for attendance...');
      
      // ✅ Try direct API call
      const response = await fetch('/api/teacher/my-students', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 My Students response:', data);
      
      // ✅ Handle different response structures
      let studentsData = [];
      if (data.success && data.students) {
        studentsData = data.students;
      } else if (data.success && data.data && data.data.students) {
        studentsData = data.data.students;
      } else if (data.students) {
        studentsData = data.students;
      } else if (Array.isArray(data)) {
        studentsData = data;
      }
      
      console.log('📋 Students loaded:', studentsData.length);
      
      // ✅ Ensure each student has an ID
      studentsData = studentsData.map(s => ({
        ...s,
        student_id: s.student_id || s._id || s.id || `student_${Math.random().toString(36).substr(2, 9)}`,
        student_name: s.student_name || s.name || 'Student',
        student_learning_mode: s.student_learning_mode || s.learning_mode || 'online',
        subject: s.subject || 'General'
      }));
      
      setStudents(studentsData);
      
      // Initialize attendance status
      const initialStatus = {};
      studentsData.forEach(s => {
        initialStatus[s.student_id] = 'unmarked';
      });
      setAttendanceStatus(initialStatus);
      
    } catch (err) {
      console.error('❌ Error fetching students:', err);
      setError(err.message || 'Error loading students');
      
      // ✅ Fallback: Try enrollment requests
      try {
        console.log('🔄 Trying enrollment requests fallback...');
        const response = await fetch('/api/enrollment/requests/teacher', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('📥 Enrollment requests response:', data);
        
        let studentsData = [];
        if (data.success && data.requests) {
          // Get approved students from requests
          const approved = data.requests.filter(r => r.status === 'approved');
          studentsData = approved.map(r => ({
            student_id: r.student_id,
            student_name: r.student_name || 'Student',
            student_learning_mode: r.learning_mode || 'online',
            subject: r.subject || 'General'
          }));
        }
        
        if (studentsData.length > 0) {
          setStudents(studentsData);
          const initialStatus = {};
          studentsData.forEach(s => {
            initialStatus[s.student_id] = 'unmarked';
          });
          setAttendanceStatus(initialStatus);
          setError('');
        }
      } catch (fallbackErr) {
        console.log('⚠️ Fallback also failed:', fallbackErr);
      }
      
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    if (status === 'unmarked') return;
    
    try {
      // Find student to get subject
      const student = students.find(s => s.student_id === studentId);
      
      console.log('📤 Marking attendance:', { studentId, status, selectedDate });
      
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: getSubjectDisplay(student?.subject) || 'general',
          status: status,
          date: selectedDate,
          mode: student?.student_learning_mode || 'online'
        })
      });
      
      const data = await response.json();
      console.log('📥 Attendance response:', data);
      
      if (data.success) {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
        // Show success feedback
        const statusLabels = {
          present: '✅ Present',
          absent: '❌ Absent',
          late: '🟡 Late',
          leave: '📋 Leave'
        };
        alert(`${statusLabels[status]} marked for ${student?.student_name || 'student'}`);
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert('❌ Error marking attendance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': '#22c55e',
      'absent': '#ef4444',
      'late': '#f59e0b',
      'leave': '#8b5cf6',
      'unmarked': '#94a3b8'
    };
    return colors[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'present': '✅ Present',
      'absent': '❌ Absent',
      'late': '🟡 Late',
      'leave': '📋 Leave',
      'unmarked': '⬜ Unmarked'
    };
    return labels[status] || 'Unmarked';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getModeIcon = (mode) => {
    if (mode === 'online') return '💻';
    if (mode === 'physical') return '🏠';
    return '💻';
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
      marginBottom: '20px',
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
    dateInput: {
      padding: '10px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit'
    },
    studentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
      marginTop: '12px'
    },
    studentCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    studentHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden'
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    studentInfo: {
      flex: 1
    },
    studentName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    studentSubject: {
      fontSize: '13px',
      color: '#666'
    },
    studentMode: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '2px'
    },
    currentStatus: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      marginTop: '4px',
      display: 'inline-block'
    },
    statusButtons: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    },
    statusBtn: {
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '2px solid #e8e8e8',
      background: 'white',
      fontFamily: 'inherit',
      flex: 1,
      minWidth: '70px'
    },
    statusBtnActive: (status) => ({
      borderColor: getStatusColor(status),
      background: `${getStatusColor(status)}15`,
      color: getStatusColor(status)
    }),
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      gridColumn: '1 / -1'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
    },
    resultCount: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '12px'
    },
    errorBox: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #fca5a5',
      marginBottom: '16px',
      fontSize: '14px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading students...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar role="teacher" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/teacher-dashboard" />
          )}

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>📋 Attendance</h1>
              <p style={styles.subtitle}>Mark attendance for your today's classes</p>
            </div>
            <input
              type="date"
              style={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>❌ {error}</div>
          )}

          {students.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🎓</div>
              <div style={styles.emptyTitle}>No Active Students</div>
              <div style={{ fontSize: '15px', color: '#94a3b8', marginTop: '8px' }}>
                When students enroll and you accept their requests, they'll appear here
              </div>
            </div>
          ) : (
            <>
              <div style={styles.resultCount}>
                Today's Classes: <strong>{students.length}</strong> student{students.length > 1 ? 's' : ''}
              </div>
              <div style={styles.studentsGrid}>
                {students.map((student) => {
                  const currentStatus = attendanceStatus[student.student_id] || 'unmarked';
                  const mode = student.student_learning_mode || 'online';
                  const modeIcon = getModeIcon(mode);
                  const modeLabel = mode === 'online' ? 'Online' : mode === 'physical' ? 'Physical' : 'Both';
                  const subjectName = getSubjectDisplay(student.subject);

                  return (
                    <div key={student.student_id} style={styles.studentCard}>
                      <div style={styles.studentHeader}>
                        <div style={styles.avatar}>
                          {student.student_picture || student.profile_picture ? (
                            <img 
                              src={student.student_picture || student.profile_picture} 
                              alt={student.student_name} 
                              style={styles.avatarImage} 
                            />
                          ) : (
                            getInitials(student.student_name)
                          )}
                        </div>
                        <div style={styles.studentInfo}>
                          <div style={styles.studentName}>{student.student_name || 'Student'}</div>
                          <div style={styles.studentSubject}>📚 {subjectName}</div>
                          <div style={styles.studentMode}>
                            {modeIcon} {modeLabel}
                          </div>
                          <div 
                            style={{
                              ...styles.currentStatus,
                              background: `${getStatusColor(currentStatus)}20`,
                              color: getStatusColor(currentStatus)
                            }}
                          >
                            {getStatusLabel(currentStatus)}
                          </div>
                        </div>
                      </div>

                      <div style={styles.statusButtons}>
                        {['present', 'absent', 'late', 'leave'].map((status) => (
                          <button
                            key={status}
                            style={{
                              ...styles.statusBtn,
                              ...(currentStatus === status ? styles.statusBtnActive(status) : {})
                            }}
                            onClick={() => markAttendance(student.student_id, status)}
                            onMouseEnter={(e) => {
                              if (currentStatus !== status) {
                                e.target.style.borderColor = getStatusColor(status);
                                e.target.style.background = `${getStatusColor(status)}10`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentStatus !== status) {
                                e.target.style.borderColor = '#e8e8e8';
                                e.target.style.background = 'white';
                              }
                            }}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;