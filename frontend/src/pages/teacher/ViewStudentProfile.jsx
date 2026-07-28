import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

const ViewStudentProfile = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const location = useLocation();
  const { token } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [enrollmentRequest, setEnrollmentRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔍 ViewStudentProfile loaded with studentId:', studentId);
  console.log('📍 Location state:', location.state);

  useEffect(() => {
    if (!studentId) {
      console.error('❌ No studentId in URL params');
      setError('Student ID not found in URL');
      setLoading(false);
      return;
    }
    
    fetchStudentProfile();
    fetchEnrollmentRequest();
  }, [studentId]);

  // ✅ Fetch student profile
  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📤 Fetching student profile for ID:', studentId);

      // First try: /api/student/profile/{id}
      try {
        const response = await fetch(`/api/student/profile/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('📥 Student profile response (student/profile):', data);

        if (data.success && data.student) {
          setStudent(data.student);
          console.log('✅ Student loaded:', data.student.name);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ First endpoint failed, trying second...');
      }

      // Second try: /api/enrollment/student-profile/{id}
      try {
        const response = await fetch(`/api/enrollment/student-profile/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('📥 Student profile response (enrollment/student-profile):', data);

        if (data.success && data.student) {
          setStudent(data.student);
          console.log('✅ Student loaded:', data.student.name);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ Second endpoint also failed');
      }

      // Third try: /api/profile/public/{id}
      try {
        const response = await fetch(`/api/profile/public/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('📥 Student profile response (profile/public):', data);

        if (data.success && data.profile) {
          setStudent({
            ...data.profile,
            education_level: data.profile.education_level || '',
            learning_mode: data.profile.learning_mode || 'online',
            study_time: data.profile.study_time || 'Flexible',
            subjects: data.profile.subjects || [],
            location: data.profile.location || '',
            bio: data.profile.bio || '',
            phone: data.profile.phone || '',
            profile_picture: data.profile.profile_picture || '',
            school_name: data.profile.school_name || '',
            board: data.profile.board || '',
            budget_range: data.profile.budget_range || ''
          });
          console.log('✅ Student loaded via /api/profile/public');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ Third endpoint also failed');
      }

      setError('Student not found. Please try again.');
      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching student profile:', err);
      setError('Error loading student profile: ' + err.message);
      setLoading(false);
    }
  };

  // ✅ Fetch pending enrollment request for this student
  const fetchEnrollmentRequest = async () => {
    try {
      const response = await fetch('/api/enrollment/requests/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const pendingRequest = data.requests.find(
          r => r.student_id === studentId && r.status === 'pending'
        );
        if (pendingRequest) {
          setEnrollmentRequest(pendingRequest);
          console.log('✅ Pending request found:', pendingRequest._id);
        } else {
          console.log('ℹ️ No pending request found for this student');
        }
      }
    } catch (err) {
      console.error('Error fetching enrollment request:', err);
    }
  };

  // ✅ Accept Request
  const handleAccept = async () => {
    if (!enrollmentRequest) return;
    if (!window.confirm('Accept this enrollment request?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/enrollment/request/${enrollmentRequest._id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Enrollment request accepted!');
        navigate('/teacher/requests');
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('❌ Error accepting request');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Reject Request
  const handleReject = async () => {
    if (!enrollmentRequest) return;
    if (!window.confirm('Reject this enrollment request?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/enrollment/request/${enrollmentRequest._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('❌ Request rejected.');
        navigate('/teacher/requests');
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('❌ Error rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Back to Dashboard
  const handleBack = () => {
    navigate('/teacher-dashboard');
  };

  // ✅ Back to Requests
  const handleBackToRequests = () => {
    navigate('/teacher/requests');
  };

  // ✅ Send Request (if no pending request)
  const handleSendRequest = () => {
    // Navigate to find students or send request page
    navigate('/teacher/find-students');
  };

  // ✅ Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ✅ Get learning mode from database
  const getLearningMode = () => {
    return student?.learning_mode || 'online';
  };

  const getLearningModeDisplay = (mode) => {
    if (mode === 'online') return ' Online';
    if (mode === 'physical') return ' Physical';
    if (mode === 'both') return ' Both';
    return ' Online';
  };

  // ✅ Get learning mode icon
  const getLearningModeIcon = (mode) => {
    if (mode === 'online') return '';
    if (mode === 'physical') return '';
    if (mode === 'both') return '';
    return '💻';
  };

  // ✅ Format date only
  const formatDateOnly = (dateString) => {
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

  // ✅ Get subject display names (handle both formats)
  const getSubjectDisplay = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  const getSubjectList = () => {
    if (!student?.subjects) return [];
    return student.subjects.map(s => getSubjectDisplay(s)).filter(s => s);
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
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#475569',
      marginBottom: '20px',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid #e8e8e8'
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
      color: '#1f1f3e',
      margin: 0
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px'
    },
    profileHeader: {
      display: 'flex',
      gap: '30px',
      alignItems: 'center',
      paddingBottom: '30px',
      borderBottom: '1px solid #f0f0f0',
      flexWrap: 'wrap'
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '42px',
      color: 'white',
      fontWeight: '700',
      flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)'
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    profileInfo: {
      flex: 1,
      minWidth: '250px'
    },
    studentName: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginBottom: '4px'
    },
    studentStatus: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '6px'
    },
    statusBadge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      background: '#eff6ff',
      color: '#3b82f6'
    },
    modeBadge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      background: '#f0fdf4',
      color: '#16a34a'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      padding: '30px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    detailItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    detailLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    detailValue: {
      fontSize: '16px',
      color: '#1f1f3e',
      fontWeight: '500'
    },
    bioSection: {
      padding: '25px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    bioTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '10px'
    },
    bioText: {
      fontSize: '15px',
      color: '#555',
      lineHeight: '1.7'
    },
    // ✅ Request Section
    requestSection: {
      padding: '25px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    requestTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '15px'
    },
    requestInfo: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px 30px',
      padding: '15px',
      background: '#f8fafc',
      borderRadius: '12px',
      marginBottom: '20px'
    },
    requestInfoItem: {
      fontSize: '14px',
      color: '#475569'
    },
    requestInfoLabel: {
      color: '#94a3b8',
      marginRight: '6px'
    },
    // ✅ Action Buttons
    actionsRow: {
      display: 'flex',
      gap: '14px',
      flexWrap: 'wrap',
      marginTop: '20px'
    },
    acceptBtn: {
      padding: '12px 32px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
      minWidth: '140px'
    },
    rejectBtn: {
      padding: '12px 32px',
      background: 'white',
      color: '#ef4444',
      border: '2px solid #ef4444',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      minWidth: '140px'
    },
    sendRequestBtn: {
      padding: '12px 32px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
      minWidth: '140px'
    },
    backBtnBottom: {
      padding: '12px 32px',
      background: 'white',
      color: '#475569',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      minWidth: '140px'
    },
    actionBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    noRequestMsg: {
      color: '#94a3b8',
      fontSize: '15px',
      padding: '12px 0'
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
      color: '#ef4444',
      textAlign: 'center'
    },
    errorButton: {
      marginTop: '15px',
      padding: '10px 24px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading student profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.errorContainer}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ marginBottom: '8px' }}>Student Not Found</h2>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>{error || 'No student data available'}</p>
              <button style={styles.errorButton} onClick={handleBack}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Get learning mode from database
  const learningMode = getLearningMode();
  const learningModeDisplay = getLearningModeDisplay(learningMode);
  const learningModeIcon = getLearningModeIcon(learningMode);
  const hasPendingRequest = enrollmentRequest && enrollmentRequest.status === 'pending';

  // ✅ Get subject list
  const subjectList = getSubjectList();

  return (
    <div style={styles.container}>
      <Sidebar role="teacher" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back to Dashboard Button */}
          <button
            style={styles.backButton}
            onClick={handleBack}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>👤 Student Profile</h1>
                <p style={styles.subtitle}>
                  Review student details before making a decision
                </p>
              </div>
            </div>

            {/* Profile Header */}
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {student.profile_picture ? (
                  <img 
                    src={student.profile_picture} 
                    alt={student.name}
                    style={styles.avatarImage}
                  />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              <div style={styles.profileInfo}>
                <div style={styles.studentName}>{student.name || 'Student'}</div>
                <div style={styles.studentStatus}>
                  <span style={styles.statusBadge}>
                    {student.education_level || 'Not specified'}
                  </span>
                  <span style={styles.modeBadge}>
                    {learningModeIcon} {learningModeDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid - ✅ Learning Mode from database */}
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>🎓 Education Level</span>
                <span style={styles.detailValue}>{student.education_level || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>📍 Area</span>
                <span style={styles.detailValue}>{student.location || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>💻 Learning Mode</span>
                <span style={styles.detailValue}>{learningModeDisplay}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>📋 Board</span>
                <span style={styles.detailValue}>{student.board || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>📚 Subjects</span>
                <span style={styles.detailValue}>
                  {subjectList.length > 0 ? subjectList.join(' • ') : 'Not specified'}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>⏰ Study Time</span>
                <span style={styles.detailValue}>{student.study_time || 'Flexible'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>💰 Budget Range</span>
                <span style={styles.detailValue}>{student.budget_range || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>🏫 School</span>
                <span style={styles.detailValue}>{student.school_name || 'Not specified'}</span>
              </div>
            </div>

            {/* About Student - Bio */}
            {student.bio && (
              <div style={styles.bioSection}>
                <div style={styles.bioTitle}>📝 About Student</div>
                <div style={styles.bioText}>{student.bio}</div>
              </div>
            )}

            {/* ✅ Enrollment Request Section */}
            {hasPendingRequest && (
              <div style={styles.requestSection}>
                <div style={styles.requestTitle}>📋 Pending Enrollment Request</div>
                <div style={styles.requestInfo}>
                  <span style={styles.requestInfoItem}>
                    <span style={styles.requestInfoLabel}>📚 Subject:</span> {enrollmentRequest.subject || 'General'}
                  </span>
                  <span style={styles.requestInfoItem}>
                    <span style={styles.requestInfoLabel}> Mode:</span> 
                    {enrollmentRequest.learning_mode === 'online' ? ' Online' :
                     enrollmentRequest.learning_mode === 'physical' ? ' Physical' : ' Both'}
                  </span>
                  <span style={styles.requestInfoItem}>
                    <span style={styles.requestInfoLabel}>📅 Requested:</span> {formatDateOnly(enrollmentRequest.created_at)}
                  </span>
                  {enrollmentRequest.preferred_schedule && (
                    <span style={styles.requestInfoItem}>
                      <span style={styles.requestInfoLabel}>🕐 Preferred:</span> {enrollmentRequest.preferred_schedule}
                    </span>
                  )}
                </div>
                
                {enrollmentRequest.message && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '10px 14px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#475569' 
                  }}>
                    <span style={{ color: '#94a3b8' }}>💬 Message:</span> {enrollmentRequest.message}
                  </div>
                )}

                {/* ✅ Accept/Reject buttons */}
                <div style={styles.actionsRow}>
                  <button
                    style={{
                      ...styles.acceptBtn,
                      ...(actionLoading ? styles.actionBtnDisabled : {})
                    }}
                    onClick={handleAccept}
                    disabled={actionLoading}
                    onMouseEnter={(e) => {
                      if (!actionLoading) e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading) e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {actionLoading ? '⏳ Processing...' : '✅ Accept Request'}
                  </button>
                  <button
                    style={{
                      ...styles.rejectBtn,
                      ...(actionLoading ? styles.actionBtnDisabled : {})
                    }}
                    onClick={handleReject}
                    disabled={actionLoading}
                    onMouseEnter={(e) => {
                      if (!actionLoading) e.target.style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading) e.target.style.background = 'white';
                    }}
                  >
                    {actionLoading ? '⏳ Processing...' : '❌ Reject Request'}
                  </button>
                </div>
              </div>
            )}

            {/* ✅ Bottom Actions - Send Request & Back */}
            <div style={styles.actionsRow}>
              {!hasPendingRequest && (
                <button
                  style={styles.sendRequestBtn}
                  onClick={handleSendRequest}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  📨 Send Request
                </button>
              )}
              <button
                style={styles.backBtnBottom}
                onClick={handleBackToRequests}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                ← Back
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentProfile;