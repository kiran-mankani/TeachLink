import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';
import ProfileRestrictionPopup from '../../components/ProfileRestrictionPopup';
import TutorCard from '../../components/TutorCard';


const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedTeachers, setRecommendedTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [error, setError] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Notification refresh trigger
  const [refreshNotifications, setRefreshNotifications] = useState(false);
  
  const [showPopup, setShowPopup] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  
  const hasFetched = useRef(false);
  const isMounted = useRef(true);

  // Check if user is new
  useEffect(() => {
    const hasVisited = localStorage.getItem(`visited_${user?.id}`);
    if (!hasVisited) {
      setIsNewUser(true);
      localStorage.setItem(`visited_${user?.id}`, 'true');
    } else {
      setIsNewUser(false);
    }
  }, [user]);

  // ✅ Navigation handlers with state
  const handleViewAllCourses = () => {
    navigate('/student/courses', { state: { from: '/student-dashboard' } });
  };

  const handleViewAllTeachers = () => {
    navigate('/find-tutor', { state: { from: '/student-dashboard' } });
  };

  const handleViewProfile = (teacherId) => {
    navigate(`/teacher-profile/${teacherId}`, { state: { from: '/student-dashboard' } });
  };

  const handleViewNotifications = () => {
    navigate('/student/notifications', { state: { from: '/student-dashboard' } });
  };

  // ✅ Helper to get subject display name (handles both formats)
  const getSubjectDisplay = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Get matching fee helper
  const getMatchingFee = (teacher) => {
    if (teacher.fee_for_matching && teacher.fee_for_matching > 0) {
      return teacher.fee_for_matching;
    }
    if (teacher.subject_fees && teacher.matching_subject) {
      const found = teacher.subject_fees.find(s => s.subject === teacher.matching_subject);
      if (found && found.fee) return found.fee;
    }
    if (teacher.subject_fees && teacher.subject_fees.length > 0) {
      return teacher.subject_fees[0].fee;
    }
    return null;
  };

  // Fetch recommended teachers with schedules
  const fetchRecommendedTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await api.getRecommendedTeachers(token);
      if (data.success) {
        const teachersWithSchedules = await Promise.all(
          (data.teachers || []).map(async (teacher) => {
            try {
              const scheduleRes = await fetch(`/api/teacher/schedules/${teacher.teacher_id || teacher._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const scheduleData = await scheduleRes.json();
              return {
                ...teacher,
                schedules: scheduleData.schedules || []
              };
            } catch (err) {
              return { ...teacher, schedules: [] };
            }
          })
        );
        setRecommendedTeachers(teachersWithSchedules);
      }
    } catch (err) {
      console.error('Error fetching recommended teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ✅ MAIN FETCH FUNCTION - Always fetches fresh data
  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('📤 Fetching student dashboard data...');
      console.log('📍 Current path:', location.pathname);
      
      const [dashboardData, statusData, countData] = await Promise.all([
        api.getStudentDashboard(token),
        api.getStudentProfileStatus(token).catch(() => null),
        api.getUnreadCount(token).catch(() => null)
      ]);
      
      console.log('📥 Dashboard Data:', dashboardData);
      
      setDashboardData(dashboardData);
      setError(null);
      
      if (statusData) {
        const isComplete = statusData.is_complete || statusData.percentage >= 98;
        setProfileStatus({
          percentage: isComplete ? 100 : 20,
          is_complete: isComplete
        });
        
        if (user?.profilePercentage !== (isComplete ? 100 : 20)) {
          await refreshUser();
        }
      }
      
      if (countData) {
        setUnreadCount(countData.count || 0);
      }
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFFECT 1: Initial load
  useEffect(() => {
    if (token && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllDashboardData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [token]);

  // ✅ EFFECT 2: Re-fetch when navigating back
  useEffect(() => {
    if (location.pathname === '/student-dashboard' && hasFetched.current && token) {
      console.log('🔄 Re-fetching student dashboard data on navigation back...');
      fetchAllDashboardData();
    }
  }, [location.pathname, token]);

  // Auto-fetch recommended teachers
  useEffect(() => {
    const isComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
    if (isComplete && token && recommendedTeachers.length === 0 && !loading) {
      fetchRecommendedTeachers();
    }
  }, [profileStatus.is_complete, profileStatus.percentage, token, loading]);

  const checkStudentProfile = () => {
    const isComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
    
    if (!isComplete) {
      const fields = [];
      if (!dashboardData?.student?.phone) fields.push('Phone Number');
      if (!dashboardData?.student?.location) fields.push('Location');
      if (!dashboardData?.student?.education_level) fields.push('Education Level');
      if (!dashboardData?.student?.subjects || dashboardData.student.subjects.length === 0) fields.push('Subjects');
      if (!dashboardData?.student?.learning_mode) fields.push('Learning Mode');
      if (!dashboardData?.student?.budget_range) fields.push('Budget Range');
      
      setMissingFields(fields);
      setShowPopup(true);
      return false;
    }
    return true;
  };

  const handleCompleteProfile = () => {
    navigate('/student/complete-profile');
  };

  const isProfileComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
  const hasRecommendedTeachers = recommendedTeachers.length > 0;
  
  const userName = dashboardData?.student?.name || user?.name || 'Student';

  const pendingRequests = dashboardData?.pending_requests || 0;
  const activeCourses = dashboardData?.active_courses || 0;
  const totalTeachers = dashboardData?.total_teachers || 0;

  const styles = {
    container: { 
      minHeight: '100vh', 
      backgroundColor: '#f1f5f9', 
      fontFamily: "'Poppins', 'Segoe UI', 'Nunito Sans', sans-serif",
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
      backgroundColor: '#f1f5f9', 
      overflowY: 'auto', 
      height: '100vh' 
    },
    roleBadge: {
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
      marginBottom: '8px',
      letterSpacing: '0.3px',
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '20px', 
      marginBottom: '30px' 
    },
    statCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '20px 25px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
      border: '1px solid #f0f0f0', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px' 
    },
    statIconBox: { 
      width: '40px', 
      height: '40px', 
      borderRadius: '10px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '20px' 
    },
    statIconGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statIconBlue: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    statIconOrange: { backgroundColor: '#fef3c7', color: '#d97706' },
    statContent: { display: 'flex', flexDirection: 'column' },
    statNumber: { fontSize: '24px', fontWeight: '700', color: '#1f1f3e', lineHeight: '1' },
    statLabel: { color: '#666', fontSize: '13px', fontWeight: '500', marginTop: '2px' },
    sectionTitle: { 
      fontSize: '20px', 
      fontWeight: '600', 
      color: '#1f1f3e', 
      marginBottom: '16px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    viewAllLink: { 
      fontSize: '14px', 
      color: '#6366f1', 
      fontWeight: '500', 
      cursor: 'pointer', 
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    },
    coursesGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '20px', 
      marginBottom: '30px' 
    },
    courseCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '20px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
      border: '1px solid #f0f0f0', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px' 
    },
    courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    courseSubject: { fontSize: '16px', fontWeight: '600', color: '#1f1f3e' },
    courseStatus: { 
      padding: '4px 12px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: '600', 
      textTransform: 'capitalize' 
    },
    statusActive: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statusCompleted: { backgroundColor: '#e0e7ff', color: '#4a3aff' },
    courseDetail: { color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
    courseTeacher: { color: '#6366f1', fontWeight: '600', fontSize: '14px', marginTop: '4px' },
    teacherList: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '20px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
      border: '1px solid #f0f0f0' 
    },
    noTeachersCard: { 
      padding: '30px', 
      textAlign: 'center', 
      color: '#666', 
      backgroundColor: '#f8fafc', 
      borderRadius: '12px', 
      border: '1px dashed #cbd5e1' 
    },
    emptyState: { color: '#666', padding: '15px 0', textAlign: 'center', fontSize: '14px' },
    loadingContainer: { 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      fontSize: '18px', 
      color: '#6366f1' 
    },
    errorContainer: { 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column', 
      color: '#ef4444' 
    },
    errorButton: { 
      marginTop: '15px', 
      padding: '10px 25px', 
      backgroundColor: '#6366f1', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontSize: '14px' 
    },
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
        <div>{error}</div>
        <button style={styles.errorButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <Sidebar role="student" refreshTrigger={refreshNotifications} />
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back to Dashboard" fallbackPath="/student-dashboard" />
          )}

          {/* HERO SECTION */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            borderRadius: '20px',
            padding: '30px 35px',
            marginBottom: '30px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(15, 52, 96, 0.3)',
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
              pointerEvents: 'none',
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '20%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%)',
              pointerEvents: 'none',
            }}></div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '15px',
              position: 'relative',
              zIndex: 1,
            }}>
              <div>
                <div style={styles.roleBadge}>🎓 Student</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'white',
                }}>
                  {isNewUser ? (
                    <>Welcome, <span style={{
                      background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>{userName}</span>! 👋</>
                  ) : (
                    <>Welcome Back, <span style={{
                      background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>{userName}</span>! 👋</>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px',
                  fontWeight: '400',
                }}>
                  {isNewUser 
                    ? 'Start your learning journey with us!' 
                    : 'Manage your courses, teachers and learning efficiently.'}
                </div>
              </div>
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={handleViewNotifications}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              >
                🔔 <span style={{ fontWeight: '600' }}>{unreadCount}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px',
              marginTop: '16px',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                }}>Profile Status</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '120px',
                    height: '6px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                      borderRadius: '10px',
                      transition: 'width 0.8s ease',
                      width: `${profileStatus.percentage}%`,
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#a78bfa',
                  }}>{profileStatus.percentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* PROFILE COMPLETION CARD */}
          {!isProfileComplete && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9ff, #eef2ff)',
              borderRadius: '20px',
              padding: '28px 32px',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              boxShadow: '0 4px 25px rgba(99, 102, 241, 0.08)',
              marginBottom: '30px',
              fontFamily: "'Poppins', 'Segoe UI', sans-serif",
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                marginBottom: '12px',
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1f1f3e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ fontSize: '24px' }}>👤</span>
                  Complete Your Profile
                </div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#6366f1',
                }}>{profileStatus.percentage}% Completed</span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e8e8e8',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa, #8b5cf6)',
                    borderRadius: '10px',
                    transition: 'width 0.8s ease',
                    width: `${profileStatus.percentage}%`,
                  }}></div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginBottom: '18px',
              }}>
                {[
                  { icon: '🤖', text: 'AI Recommendations' },
                  { icon: '👥', text: 'Teacher Matching' },
                  { icon: '📅', text: 'Schedule Management' },
                  { icon: '🔒', text: 'Secure Payments' },
                ].map((benefit, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#1f1f3e',
                    padding: '6px 0',
                  }}>
                    <span style={{ fontSize: '16px' }}>{benefit.icon}</span>
                    <span style={{ color: '#555' }}>{benefit.text}</span>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                }}>
                  Complete your profile to unlock{' '}
                  <span style={{ color: '#6366f1', fontWeight: '600' }}>all features</span>
                </div>
                <button
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '50px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={handleCompleteProfile}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
                  }}
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          )}

          {/* STATS GRID */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconOrange}}>⏳</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>{pendingRequests}</span>
                <span style={styles.statLabel}>Pending Requests</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconGreen}}>📚</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>{activeCourses}</span>
                <span style={styles.statLabel}>Active Courses</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconBlue}}>👨‍🏫</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>{totalTeachers}</span>
                <span style={styles.statLabel}>Teachers</span>
              </div>
            </div>
          </div>

          {/* ✅ My Courses - FIXED */}
          <div style={styles.sectionTitle}>
            <span>📅 My Courses</span>
            <span 
              style={styles.viewAllLink}
              onClick={handleViewAllCourses}
              onMouseEnter={(e) => e.target.style.color = '#4a3aff'}
              onMouseLeave={(e) => e.target.style.color = '#6366f1'}
            >
              View All →
            </span>
          </div>
          <div style={styles.coursesGrid}>
            {dashboardData?.my_courses?.length > 0 ? (
              dashboardData.my_courses.map((course) => (
                <div key={course._id} style={styles.courseCard}>
                  <div style={styles.courseHeader}>
                    <span style={styles.courseSubject}>
                      {/* ✅ FIXED: Handle both string and object formats */}
                      {typeof course.subject === 'string' 
                        ? course.subject 
                        : course.subject?.subject || 'N/A'}
                    </span>
                    <span style={{...styles.courseStatus, ...(course.status === 'active' ? styles.statusActive : styles.statusCompleted)}}>
                      {course.status}
                    </span>
                  </div>
                  <div style={styles.courseDetail}>📍 {course.mode === 'online' ? 'Online' : 'In-person'}</div>
                  <div style={styles.courseDetail}>🕐 {course.schedule || 'Flexible'}</div>
                  <div style={styles.courseTeacher}>👤 {course.teacher_name}</div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                No active courses. Start learning today!
              </div>
            )}
          </div>

          {/* AI RECOMMENDED TEACHERS */}
          <div style={styles.sectionTitle}>
            <span>🎯 AI Recommended Teachers</span>
            {isProfileComplete && hasRecommendedTeachers && (
              <span 
                style={styles.viewAllLink}
                onClick={handleViewAllTeachers}
                onMouseEnter={(e) => e.target.style.color = '#4a3aff'}
                onMouseLeave={(e) => e.target.style.color = '#6366f1'}
              >
                View All →
              </span>
            )}
          </div>

          {loadingTeachers ? (
            <div style={styles.noTeachersCard}>Loading recommendations...</div>
          ) : isProfileComplete ? (
            recommendedTeachers.length > 0 ? (
              <div style={styles.teacherList}>
                {recommendedTeachers.slice(0, 4).map((teacher) => {
                  const fee = getMatchingFee(teacher);
                  return (
                    <TutorCard 
                      key={teacher.teacher_id} 
                      tutor={{
                        ...teacher,
                        fee_for_matching: fee,
                        matching_subject: teacher.matching_subject || 
                          (teacher.subjects && teacher.subjects.length > 0 ? 
                            getSubjectDisplay(teacher.subjects[0]) : 
                            null)
                      }}
                      onViewProfile={() => handleViewProfile(teacher.teacher_id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={styles.noTeachersCard}>
                <p>👀 No matching teachers found</p>
                <p style={{ fontSize: '13px', marginTop: '5px', color: '#94a3b8' }}>
                  Teachers with matching subjects and complete profiles will appear here
                </p>
              </div>
            )
          ) : (
            <div style={styles.noTeachersCard}>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                🔒 Complete your profile to unlock AI recommendations
              </p>
            </div>
          )}
          
        </div>
      </div>

      <ProfileRestrictionPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        role="student"
        missingFields={missingFields}
        onCompleteProfile={handleCompleteProfile}
      />
    </div>
  );
};

export default StudentDashboard;