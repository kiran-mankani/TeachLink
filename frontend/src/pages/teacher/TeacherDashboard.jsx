import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import ProfileRestrictionPopup from '../../components/ProfileRestrictionPopup';
import StudentCard from '../../components/StudentCard';
import BackButton from '../../components/BackButton';


const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedStudents, setRecommendedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshNotifications, setRefreshNotifications] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [hasEnrollmentRequests, setHasEnrollmentRequests] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);  
  const hasFetched = useRef(false);
  const isMounted = useRef(true);

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Helper to get subject list (array of names)
  const getSubjectList = (subjects) => {
    if (!subjects || !Array.isArray(subjects)) return [];
    return subjects.map(s => getSubjectName(s)).filter(s => s);
  };

  // Check if user is new
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      const visitedKey = `visited_${userId}`;
      const hasVisited = localStorage.getItem(visitedKey);
      
      if (!hasVisited) {
        setIsNewUser(true);
        localStorage.setItem(visitedKey, 'true');
        console.log('👋 New user detected:', userId);
      } else {
        setIsNewUser(false);
        console.log('🔄 Returning user detected:', userId);
      }
    }
  }, [user]);

  // ✅ FETCH TEACHER PROFILE - Always fresh from database
  const fetchTeacherProfile = async () => {
    try {
      console.log('📤 Fetching teacher profile from database...');
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        const subjects = data.profile.subjects || [];
        setAllSubjects(subjects);
        console.log('📌 Profile Subjects from DB:', subjects);
        return subjects;
      }
      return [];
    } catch (err) {
      console.error('Error fetching profile:', err);
      return [];
    }
  };

  // ✅ FETCH SCHEDULES - Always fresh from database
  const fetchSchedules = async () => {
    try {
      const userId = user?._id || user?.id || user?.userId;
      if (!userId) {
        console.log('⚠️ No user ID found for fetching schedules');
        return [];
      }

      console.log('📤 Fetching schedules from database for teacher:', userId);
      
      const response = await fetch(`/api/schedule/teacher/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Schedules API Response from DB:', data);
      
      if (data.success) {
        const schedules = data.schedules || [];
        setAllSchedules(schedules);
        console.log('📌 Schedules from DB:', schedules);
        console.log('📌 Schedule subjects from DB:', schedules.map(s => s.subject));
        return schedules;
      }
      return [];
    } catch (err) {
      console.error('Error fetching schedules:', err);
      return [];
    }
  }; 

  // CHECK ENROLLMENT REQUESTS
  const checkEnrollmentRequests = async () => {
    try {
      const response = await fetch('/api/teacher/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const requests = data.enrollment_requests || [];
        const hasRequests = requests.length > 0;
        setHasEnrollmentRequests(hasRequests);
        return hasRequests;
      }
      return false;
    } catch (err) {
      console.error('Error checking enrollment requests:', err);
      return false;
    }
  };

  const fetchRecommendedStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await api.getRecommendedStudents(token);
      console.log('📥 Recommended students fetched:', data);
      if (data.success) {
        // ✅ Sort by match_score descending (highest first)
        const sortedStudents = (data.students || []).sort((a, b) => 
          (b.match_score || 0) - (a.match_score || 0)
        );
        setRecommendedStudents(sortedStudents);
      }
    } catch (err) {
      console.error('Error fetching recommended students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // ✅ FIXED: Calculate pending subjects - handles both string and object arrays
  const calculatePendingSubjects = (subjects, schedules) => {
    if (!subjects || subjects.length === 0) {
      console.log('📌 No subjects found, pending = []');
      return [];
    }
    
    // ✅ Extract subject names from both string and object formats
    const subjectNames = subjects.map(s => {
      if (typeof s === 'string') {
        return s.trim().toLowerCase();
      } else if (typeof s === 'object' && s !== null) {
        // Handle both formats: {subject: 'Physics'} or {subject: 'Physics', fee: 5000}
        const name = s.subject || s.name || s.title || '';
        return name.trim().toLowerCase();
      }
      return '';
    }).filter(s => s !== '');
    
    console.log('📌 Subject names extracted:', subjectNames);
    
    // Get scheduled subject names from schedules
    const scheduledSubjects = schedules.map(s => {
      const subject = s.subject || s._subject || s.title || s.name || '';
      return subject.trim().toLowerCase();
    }).filter(s => s !== '');
    
    console.log('📌 Scheduled subjects from DB:', scheduledSubjects);
    
    // Find pending subjects (subjects NOT in schedules)
    const pending = subjectNames.filter(subjectName => {
      const isScheduled = scheduledSubjects.includes(subjectName);
      console.log(`   ${subjectName}: ${isScheduled ? '✅ Scheduled' : '❌ Pending'}`);
      return !isScheduled;
    });
    
    console.log('📌 Pending Subjects from DB:', pending);
    return pending;
  };

  // ✅ MAIN FETCH FUNCTION - Always fetches fresh data from database
  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      setDataLoaded(false);
      
      console.log('📤 ========== FETCHING FRESH DATA FROM DATABASE ==========');
      console.log('📍 Current path:', location.pathname);
      console.log('👤 User ID:', user?._id || user?.id);
      
      // ✅ ALWAYS fetch fresh from database - NO CACHING
      const [dashboardData, subjects, schedules, hasRequests] = await Promise.all([
        api.getTeacherDashboard(token),
        fetchTeacherProfile(),
        fetchSchedules(),
        checkEnrollmentRequests()
      ]);
      
      console.log('📥 Dashboard Data from DB:', dashboardData);
      console.log('📥 Subjects from DB:', subjects);
      console.log('📥 Schedules from DB:', schedules);
      console.log('📥 Has Enrollment Requests from DB:', hasRequests);
      
      setDashboardData(dashboardData);
      setAllSubjects(subjects || []);
      setAllSchedules(schedules || []);
      setHasEnrollmentRequests(hasRequests);
      
      // ✅ Calculate pending subjects from fresh data
      const pending = calculatePendingSubjects(subjects || [], schedules || []);
      console.log('📌 Pending Subjects from DB calculation:', pending);
      setPendingSubjects(pending);
      
      setError(null);
      setDataLoaded(true);
      
      // Profile status
      try {
        const statusData = await api.getTeacherProfileStatus(token);
        const isComplete = statusData.is_complete || false;
        const percentage = isComplete ? 100 : 20;
        
        setProfileStatus({
          percentage: percentage,
          is_complete: isComplete
        });
        
        if (user?.profilePercentage !== percentage) {
          await refreshUser();
        }
      } catch (e) {
        console.log('Profile status fetch skipped');
        setProfileStatus({
          percentage: 20,
          is_complete: false
        });
      }

      // Notification count
      try {
        const countData = await api.getUnreadCount(token);
        setUnreadCount(countData.count || 0);
      } catch (e) {
        console.log('Notification count fetch skipped');
      }
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard');
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFFECT 1: Initial load - ALWAYS fetches from database
  useEffect(() => {
    if (token) {
      hasFetched.current = true;
      console.log('🔄 DASHBOARD MOUNT/REFRESH: Fetching from database...');
      fetchAllDashboardData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [token]);

  // ✅ EFFECT 2: Re-fetch when navigating back - ALWAYS fetches from database
  useEffect(() => {
    if (location.pathname === '/teacher-dashboard' && token) {
      console.log('🔄 NAVIGATION BACK: Re-fetching from database...');
      hasFetched.current = false;
      fetchAllDashboardData();
      hasFetched.current = true;
    }
  }, [location.pathname, token]);

  // ✅ EFFECT 3: Refresh when schedule changes
  useEffect(() => {
    if (location.state?.refreshDashboard) {
      console.log('🔄 REFRESH FROM MANAGE SCHEDULE: Fetching from database...');
      fetchAllDashboardData();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  
  // ✅ EFFECT 4: Recalculate pending subjects when schedules or subjects change
  useEffect(() => {
    if (allSubjects.length > 0 && allSchedules.length > 0) {
      const pending = calculatePendingSubjects(allSubjects, allSchedules);
      setPendingSubjects(pending);
      console.log('🔄 Recalculated pending subjects:', pending);
    } else if (allSubjects.length > 0 && allSchedules.length === 0) {
      // ✅ FIXED: Store subject names, not objects
      const subjectNames = getSubjectList(allSubjects);
      setPendingSubjects(subjectNames);
      console.log('🔄 All subjects are pending (no schedules found)');
    }
  }, [allSubjects, allSchedules]);
  
  // Auto-fetch recommended students
  useEffect(() => {
    const isComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
    if (isComplete && token && recommendedStudents.length === 0 && dataLoaded) {
      fetchRecommendedStudents();
    }
  }, [profileStatus.is_complete, profileStatus.percentage, token, dataLoaded]);

  const checkTeacherProfile = () => {
    const isComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
    
    if (!isComplete) {
      const fields = [];
      if (!dashboardData?.teacher?.qualification) fields.push('Qualification');
      if (!dashboardData?.teacher?.experience) fields.push('Experience');
      if (!dashboardData?.teacher?.subjects || dashboardData.teacher.subjects.length === 0) fields.push('Subjects');
      if (!dashboardData?.teacher?.teaching_mode) fields.push('Teaching Mode');
      if (!dashboardData?.teacher?.fee_range) fields.push('Monthly Fee');
      if (!dashboardData?.teacher?.phone) fields.push('Phone Number');
      if (!dashboardData?.teacher?.bio) fields.push('Bio');
      
      setMissingFields(fields);
      setShowPopup(true);
      return false;
    }
    return true;
  };

  const handleCompleteProfile = () => {
    navigate('/teacher-complete-profile');
  };

  const handleAcceptRequest = async (requestId) => {
    if (!window.confirm('Accept this enrollment request?')) return;
    try {
      const result = await api.acceptEnrollmentRequest(token, requestId);
      if (result.success) {
        alert('✅ Enrollment request accepted!');
        setRefreshNotifications(prev => !prev);
        await fetchAllDashboardData();
      } else {
        alert('❌ Failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Reject this enrollment request?')) return;
    try {
      const result = await api.rejectEnrollmentRequest(token, requestId);
      if (result.success) {
        alert('❌ Enrollment request rejected.');
        setRefreshNotifications(prev => !prev);
        await fetchAllDashboardData();
      } else {
        alert('❌ Failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const isProfileComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
  const hasAllSchedules = pendingSubjects.length === 0;
  
  // ✅ REMOVED: Schedule cards - No longer showing on dashboard
  const showScheduleReminder = false;
  const showScheduleSuccessCard = false;

  // ✅ Get user name
  const userName = dashboardData?.teacher?.name || user?.name || 'Teacher';

  // ✅ Get dynamic stats
  const pendingRequests = dashboardData?.pending_requests_count || 0;
  const activeStudents = dashboardData?.active_students || 0;
  const totalEarnings = dashboardData?.total_earnings || 0;

  // ✅ Helper to get subject display name
  const getSubjectDisplay = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

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
    sessionsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '20px', 
      marginBottom: '30px' 
    },
    sessionCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '20px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
      border: '1px solid #f0f0f0', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px' 
    },
    sessionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    sessionSubject: { fontSize: '16px', fontWeight: '600', color: '#1f1f3e' },
    sessionStatus: { 
      padding: '4px 12px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: '600', 
      textTransform: 'capitalize' 
    },
    statusUpcoming: { backgroundColor: '#dcfce7', color: '#16a34a' },
    statusInProgress: { backgroundColor: '#fef3c7', color: '#d97706' },
    sessionDetail: { color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
    sessionStudent: { color: '#6366f1', fontWeight: '600', fontSize: '14px', marginTop: '4px' },
    studentList: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '20px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
      border: '1px solid #f0f0f0' 
    },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { 
      padding: '10px 14px', 
      textAlign: 'left', 
      backgroundColor: '#f8fafc', 
      fontWeight: '600', 
      color: '#1f1f3e', 
      borderBottom: '2px solid #e2e8f0' 
    },
    td: { padding: '10px 14px', borderBottom: '1px solid #e2e8f0' },
    statusBadge: { 
      padding: '4px 10px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: '600', 
      display: 'inline-block' 
    },
    acceptBtn: { 
      padding: '4px 12px', 
      backgroundColor: '#22c55e', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      fontSize: '12px', 
      fontWeight: '500', 
      cursor: 'pointer', 
      marginRight: '6px' 
    },
    rejectBtn: { 
      padding: '4px 12px', 
      backgroundColor: '#ef4444', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      fontSize: '12px', 
      fontWeight: '500', 
      cursor: 'pointer' 
    },
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
    emptyState: { color: '#666', padding: '15px 0', textAlign: 'center', fontSize: '14px' },
    noStudentsCard: { 
      padding: '30px', 
      textAlign: 'center', 
      color: '#666', 
      backgroundColor: '#f8fafc', 
      borderRadius: '12px', 
      border: '1px dashed #cbd5e1' 
    },
    pendingSubjectsContainer: {
      marginTop: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px'
    },
    pendingSubjectChip: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      background: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fde68a'
    }
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
        <Sidebar role="teacher" refreshTrigger={refreshNotifications} />
        <div style={styles.content}>
          
          {/* ✅ Back Button - Show if came from somewhere */}
          {location.state?.from && (
            <BackButton label="← Back to Dashboard" fallbackPath="/teacher-dashboard" />
          )}

          {/* HERO SECTION */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            borderRadius: '20px',
            padding: '28px 35px',
            marginBottom: '25px',
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
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)',
              pointerEvents: 'none',
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '20%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%)',
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
                <div style={styles.roleBadge}>👨‍🏫 Teacher</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: 'white' }}>
                  {isNewUser ? (
                    <>Welcome, <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>! 👋</>
                  ) : (
                    <>Welcome Back, <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>! 👋</>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {isNewUser ? 'Start your teaching journey with us!' : 'Manage your teaching activities from your dashboard.'}
                </div>
              </div>
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '50px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => navigate('/teacher/notifications', { state: { from: '/teacher-dashboard' } })}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              >
                🔔 <span style={{ fontWeight: '600' }}>{unreadCount}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '14px',
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Profile Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '100px', height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    borderRadius: '10px',
                    transition: 'width 0.8s ease',
                    width: `${profileStatus.percentage}%`,
                  }}></div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa' }}>{profileStatus.percentage}%</span>
              </div>
            </div>
          </div>

          {/* PROFILE COMPLETION CARD */}
          {!isProfileComplete && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9ff, #eef2ff)',
              borderRadius: '16px',
              padding: '20px 28px',
              marginBottom: '25px',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '28px' }}>👤</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f1f3e' }}>Complete Your Profile</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {profileStatus.percentage}% completed • Unlock all features
                  </div>
                </div>
              </div>
              <button
                style={{
                  padding: '8px 22px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onClick={handleCompleteProfile}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Complete Profile →
              </button>
            </div>
          )}

          {/* STATS GRID */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconOrange}}>📋</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>{pendingRequests}</span>
                <span style={styles.statLabel}>Pending Requests</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconBlue}}>👨‍🎓</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>{activeStudents}</span>
                <span style={styles.statLabel}>My Students</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, ...styles.statIconGreen}}>💰</div>
              <div style={styles.statContent}>
                <span style={styles.statNumber}>Rs {totalEarnings}</span>
                <span style={styles.statLabel}>Monthly Earnings</span>
              </div>
            </div>
          </div>

          {/* UPCOMING SESSIONS */}
          <div style={styles.sectionTitle}>
            <span>📅 Upcoming Sessions</span>
            <span style={styles.viewAllLink}>View All →</span>
          </div>
          <div style={styles.sessionsGrid}>
            {dashboardData?.upcoming_sessions?.length > 0 ? (
              dashboardData.upcoming_sessions.map((session) => (
                <div key={session._id} style={styles.sessionCard}>
                  <div style={styles.sessionHeader}>
                    <span style={styles.sessionSubject}>
                      {getSubjectDisplay(session.subject) || session.subject}
                    </span>
                    <span style={{...styles.sessionStatus, ...(session.status === 'upcoming' ? styles.statusUpcoming : styles.statusInProgress)}}>
                      {session.status}
                    </span>
                  </div>
                  <div style={styles.sessionDetail}>📍 {session.mode === 'online' ? 'Online' : 'In-person'}</div>
                  <div style={styles.sessionDetail}>🕐 {session.date} at {session.time}</div>
                  <div style={styles.sessionStudent}>👤 {session.student_name}</div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>No upcoming sessions scheduled.</div>
            )}
          </div>

          {/* ✅ AI RECOMMENDED STUDENTS */}
          <div style={styles.sectionTitle}>
            <span>🎯 AI Recommended Students</span>
            {isProfileComplete && recommendedStudents.length > 0 && (
              <span 
                style={styles.viewAllLink}
                onClick={() => navigate('/teacher/find-students', { state: { from: '/teacher-dashboard' } })}
                onMouseEnter={(e) => e.target.style.color = '#4a3aff'}
                onMouseLeave={(e) => e.target.style.color = '#6366f1'}
              >
                View All →
              </span>
            )}
          </div>

          {loadingStudents ? (
            <div style={styles.noStudentsCard}>Loading recommendations...</div>
          ) : isProfileComplete ? (
            recommendedStudents.length > 0 ? (
              <div style={styles.studentList}>
                {recommendedStudents.slice(0, 4).map((student) => (
                  <StudentCard 
                    key={student.student_id || student._id} 
                    student={{
                      ...student,
                      name: student.name || student.student_name || 'Student',
                      learning_mode: student.learning_mode || student.student_learning_mode || 'online',
                      location: student.location || student.student_location || 'N/A',
                      subjects: student.subjects || student.student_subjects || student.topics || [],
                      education_level: student.education_level || student.student_education_level || 'N/A',
                      match_score: student.match_score || 0
                    }}
                    onViewProfile={() => {
                      const studentId = student.student_id || student._id || student.id;
                      if (studentId) {
                        navigate(`/teacher/student-profile/${studentId}`, { state: { from: '/teacher-dashboard' } });
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.noStudentsCard}>
                <p>👀 No matching students found</p>
                <p style={{ fontSize: '13px', marginTop: '5px', color: '#94a3b8' }}>
                  Students with matching subjects and complete profiles will appear here
                </p>
              </div>
            )
          ) : (
            <div style={styles.noStudentsCard}>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                🔒 Complete your profile to unlock AI recommendations
              </p>
            </div>
          )}
          
          {/* ENROLLMENT REQUESTS */}
          <div style={{ marginTop: '30px' }}>
            <div style={styles.sectionTitle}>
              <span>📋 Enrollment Requests</span>
              <span style={styles.viewAllLink}>View All →</span>
            </div>
            <div style={styles.studentList}>
              {dashboardData?.enrollment_requests?.length === 0 ? (
                <div style={styles.emptyState}>No enrollment requests yet.</div>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Mode</th>
                        <th style={styles.th}>Preferred Time</th>
                        <th style={styles.th}>Message</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.enrollment_requests.map((req) => {
                        const isPending = req.status === 'pending';
                        return (
                          <tr key={req._id}>
                            <td style={styles.td}>{req.student_name}</td>
                            <td style={styles.td}>{getSubjectDisplay(req.subject) || req.subject}</td>
                            <td style={styles.td}>{req.learning_mode}</td>
                            <td style={styles.td}>{req.preferred_schedule || req.preferred_time || 'N/A'}</td>
                            <td style={styles.td}>{req.message || '-'}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusBadge,
                                backgroundColor: isPending ? '#fef3c7' : req.status === 'approved' ? '#d1fae5' : '#fde8e8',
                                color: isPending ? '#b45309' : req.status === 'approved' ? '#065f46' : '#b91c1c'
                              }}>
                                {isPending ? '⏳ Pending' : req.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {isPending ? (
                                <>
                                  <button style={styles.acceptBtn} onClick={() => handleAcceptRequest(req._id)}>Accept</button>
                                  <button style={styles.rejectBtn} onClick={() => handleRejectRequest(req._id)}>Reject</button>
                                </>
                              ) : (
                                <span style={{ color: '#999' }}>No action</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <ProfileRestrictionPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        role="teacher"
        missingFields={missingFields}
        onCompleteProfile={handleCompleteProfile}
      />
    </div>
  );
};

export default TeacherDashboard;