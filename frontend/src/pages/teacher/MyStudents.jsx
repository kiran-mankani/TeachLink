import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const MyStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, activeFilter, searchQuery]);

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher/my-students' } });
  };

  const handleFindStudents = () => {
    navigate('/teacher/find-students', { state: { from: '/teacher/my-students' } });
  };

  const handleViewStudentProfile = (studentId) => {
    if (studentId) {
      navigate(`/teacher/student-profile/${studentId}`, { state: { from: '/teacher/my-students' } });
    } else {
      alert('Student ID not found');
    }
  };

  const handleGoToMessages = (studentId) => {
    navigate('/teacher/messages', { state: { from: '/teacher/my-students', studentId } });
  };

  const handleGoToAttendance = (studentId) => {
    navigate('/teacher/attendance', { state: { from: '/teacher/my-students', studentId } });
  };

  const handleGoToPayments = (studentId) => {
    navigate('/teacher/payments', { state: { from: '/teacher/my-students', studentId } });
  };

  // ✅ FIXED: Fetch students with proper API call
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching my students...');
      
      // Try API service first
      let data;
      try {
        data = await api.getMyStudents(token);
      } catch (err) {
        console.log('⚠️ API service failed, trying direct fetch...');
        // Fallback: Direct API call
        const response = await fetch('/api/teacher/my-students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();
      }
      
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
      
      // ✅ Ensure each student has a unique ID
      studentsData = studentsData.map(s => ({
        ...s,
        student_id: s.student_id || s._id || s.id || `student_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      console.log('📋 My Students loaded:', studentsData.length);
      setStudents(studentsData);
      
    } catch (err) {
      console.error('❌ Error fetching students:', err);
      setError(err.message || 'Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...students];

    if (activeFilter !== 'all') {
      result = result.filter(s => s.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => {
        const name = (s.student_name || s.name || '').toLowerCase();
        const subject = getSubjectName(s.subject).toLowerCase();
        const education = (s.student_education || s.education || '').toLowerCase();
        return name.includes(query) || subject.includes(query) || education.includes(query);
      });
    }

    setFilteredStudents(result);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#15803d', label: '🟢 Active' },
      completed: { bg: '#e0e7ff', color: '#4a3aff', label: '🔵 Completed' },
      pending: { bg: '#fef3c7', color: '#b45309', label: '🟡 Pending' },
      approved: { bg: '#dcfce7', color: '#15803d', label: '🟢 Active' }
    };
    return styles[status] || styles.active;
  };

  const getStatusCounts = () => {
    const counts = { all: students.length };
    students.forEach(s => {
      const status = s.status || 'active';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getShiftEmoji = (shift) => {
    const map = {
      'Morning': '🌅',
      'Afternoon': '☀️',
      'Evening': '🌇',
      'Flexible': '🕐'
    };
    return map[shift] || '🕐';
  };

  const getShiftLabel = (shift) => {
    const map = {
      'Morning': 'Morning',
      'Afternoon': 'Afternoon',
      'Evening': 'Evening',
      'Flexible': 'Flexible'
    };
    return map[shift] || 'Flexible';
  };

  // ✅ Get learning mode display - exactly from database
  const getLearningModeDisplay = (mode) => {
    if (!mode) return 'Not specified';
    const modeLower = mode.toLowerCase().trim();
    if (modeLower === 'online') return 'Online';
    if (modeLower === 'physical') return 'Physical';
    if (modeLower === 'both') return 'Both';
    return mode;
  };

  // ✅ Get learning mode icon
  const getLearningModeIcon = (mode) => {
    if (!mode) return '❓';
    const modeLower = mode.toLowerCase().trim();
    if (modeLower === 'online') return '💻';
    if (modeLower === 'physical') return '🏠';
    if (modeLower === 'both') return '💻🏠';
    return '❓';
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
      color: '#1f1f3e',
      margin: 0
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px'
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
      alignItems: 'center',
      background: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    filterGroup: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      flex: 1
    },
    filterBtn: {
      padding: '6px 16px',
      borderRadius: '20px',
      border: '2px solid #e8e8e8',
      background: 'white',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      color: '#666'
    },
    filterBtnActive: {
      borderColor: '#3b82f6',
      background: '#eff6ff',
      color: '#3b82f6'
    },
    filterBtnCount: {
      fontSize: '11px',
      opacity: 0.6,
      marginLeft: '4px'
    },
    searchInput: {
      padding: '8px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      minWidth: '180px',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
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
      padding: '20px 22px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    studentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    studentSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    studentAvatar: {
      width: '52px',
      height: '52px',
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
    studentAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    studentInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    studentName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    studentEducation: {
      fontSize: '13px',
      color: '#666'
    },
    studentDetails: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px 16px',
      padding: '12px 0',
      borderTop: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0'
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: '#475569'
    },
    detailIcon: {
      fontSize: '14px'
    },
    detailLabel: {
      color: '#94a3b8'
    },
    detailValue: {
      fontWeight: '500',
      color: '#1f1f3e'
    },
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      };
    },
    studentActions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      paddingTop: '8px'
    },
    actionBtn: {
      padding: '7px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    actionBtnChat: {
      background: '#3b82f6',
      color: 'white'
    },
    actionBtnAttendance: {
      background: '#8b5cf6',
      color: 'white'
    },
    actionBtnPayment: {
      background: '#22c55e',
      color: 'white'
    },
    actionBtnProfile: {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    },
    actionBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
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
      color: '#1f1f3e',
      marginBottom: '8px'
    },
    emptySubtitle: {
      fontSize: '15px',
      color: '#94a3b8'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      flexDirection: 'column',
      color: '#ef4444'
    },
    errorButton: {
      marginTop: '15px',
      padding: '10px 25px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    resultCount: {
      fontSize: '13px',
      color: '#94a3b8',
      marginLeft: '4px'
    },
    findStudentsBtn: {
      padding: '12px 28px',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading your students...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.errorContainer}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
              <div>{error}</div>
              <button style={styles.errorButton} onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filterNames = {
    all: 'All',
    active: 'Active',
    completed: 'Completed'
  };

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
              <h1 style={styles.title}>👨‍🎓 My Students</h1>
              <p style={styles.subtitle}>
                {students.length > 0
                  ? `You have ${students.length} student${students.length > 1 ? 's' : ''}`
                  : 'No students enrolled yet'}
              </p>
            </div>
            {students.length === 0 && (
              <button
                style={styles.findStudentsBtn}
                onClick={handleFindStudents}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🔍 Find Students
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
              {['all', 'active', 'completed'].map((filter) => (
                <button
                  key={filter}
                  style={{
                    ...styles.filterBtn,
                    ...(activeFilter === filter ? styles.filterBtnActive : {})
                  }}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filterNames[filter]}
                  <span style={styles.filterBtnCount}>
                    ({statusCounts[filter] || 0})
                  </span>
                </button>
              ))}
            </div>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Search student or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                {students.length === 0 ? '👨‍🎓' : '🔍'}
              </div>
              <div style={styles.emptyTitle}>
                {students.length === 0
                  ? 'No students enrolled yet'
                  : 'No students match your filters'}
              </div>
              <div style={styles.emptySubtitle}>
                {students.length === 0
                  ? 'When students send enrollment requests and you accept them, they will appear here.'
                  : 'Try changing your filters or search term'}
              </div>
              {students.length === 0 && (
                <button
                  style={styles.findStudentsBtn}
                  onClick={handleFindStudents}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🔍 Find Students
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.resultCount}>
                Showing {filteredStudents.length} student{filteredStudents.length > 1 ? 's' : ''}
              </div>
              <div style={styles.studentsGrid}>
                {filteredStudents.map((student) => {
                  const statusStyle = getStatusBadge(student.status);
                  
                  // ✅ Get student details with fallbacks
                  const studentName = student.student_name || student.name || 'Student';
                  const studentId = student.student_id || student._id || student.id;
                  const subjectName = getSubjectDisplay(student.subject);
                  const education = student.student_education || student.education || 'Education not specified';
                  const location = student.student_location || student.location || 'N/A';
                  const shift = student.student_shift || student.shift || 'Flexible';
                  const shiftEmoji = getShiftEmoji(shift);
                  const shiftLabel = getShiftLabel(shift);
                  const schedule = student.preferred_schedule || student.schedule || 'Flexible';
                  
                  // ✅ Get learning mode from database
                  const learningMode = student.student_learning_mode || student.learning_mode || '';
                  const modeDisplay = getLearningModeDisplay(learningMode);
                  const modeIcon = getLearningModeIcon(learningMode);

                  return (
                    <div key={studentId} style={styles.studentCard}>
                      {/* Header */}
                      <div style={styles.studentHeader}>
                        <div style={styles.studentSection}>
                          <div style={styles.studentAvatar}>
                            {student.student_picture || student.profile_picture ? (
                              <img
                                src={student.student_picture || student.profile_picture}
                                alt={studentName}
                                style={styles.studentAvatarImage}
                              />
                            ) : (
                              getInitials(studentName)
                            )}
                          </div>
                          <div style={styles.studentInfo}>
                            <div style={styles.studentName}>
                              {studentName}
                            </div>
                            <div style={styles.studentEducation}>
                              {education}
                            </div>
                          </div>
                        </div>
                        <span style={styles.statusBadge(student.status || 'active')}>
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Student Details */}
                      <div style={styles.studentDetails}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailIcon}>📚</span>
                          <span style={styles.detailLabel}>Subject</span>
                          <span style={styles.detailValue}>{subjectName}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailIcon}>📍</span>
                          <span style={styles.detailLabel}>Area</span>
                          <span style={styles.detailValue}>{location}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailIcon}>{modeIcon}</span>
                          <span style={styles.detailLabel}>Mode</span>
                          <span style={styles.detailValue}>{modeDisplay}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailIcon}>{shiftEmoji}</span>
                          <span style={styles.detailLabel}>Study Shift</span>
                          <span style={styles.detailValue}>{shiftLabel}</span>
                        </div>
                        <div style={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                          <span style={styles.detailIcon}>📅</span>
                          <span style={styles.detailLabel}>Schedule</span>
                          <span style={styles.detailValue}>{schedule}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={styles.studentActions}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.actionBtnChat }}
                          onClick={() => handleGoToMessages(studentId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          💬 Chat
                        </button>

                        <button
                          style={{ ...styles.actionBtn, ...styles.actionBtnAttendance }}
                          onClick={() => handleGoToAttendance(studentId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          📋 Mark Attendance
                        </button>

                        <button
                          style={{ ...styles.actionBtn, ...styles.actionBtnPayment }}
                          onClick={() => handleGoToPayments(studentId)}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          💳 Payment Status
                        </button>

                        <button
                          style={{ ...styles.actionBtn, ...styles.actionBtnProfile }}
                          onClick={() => handleViewStudentProfile(studentId)}
                          onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                          onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                        >
                          👤 View Profile
                        </button>
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

export default MyStudents;