import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const StudentRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
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

  // ✅ FIXED: Helper to get learning mode from request (checks multiple fields)
  const getLearningMode = (req) => {
    // Check all possible field names where learning mode could be stored
    const mode = 
      req.learning_mode || 
      req.learningMode || 
      req.mode || 
      req.student_learning_mode ||
      req.studentLearningMode ||
      req.teacher_teaching_mode ||
      req.teacherTeachingMode ||
      '';
    
    console.log('🔍 Learning mode found:', mode);
    
    if (!mode) return 'Not specified';
    
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻 Online';
    if (modeLower === 'physical') return '🏠 Physical';
    if (modeLower === 'both') return '💻 + 🏠 Both';
    return mode;
  };

  // ✅ Helper to get preferred schedule from database
  const getPreferredSchedule = (req) => {
    const schedule = req.preferred_schedule || req.preferredSchedule || req.schedule || '';
    if (!schedule) return 'Flexible';
    return schedule;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Apply filters whenever requests or filter state changes
  useEffect(() => {
    applyFilters();
  }, [requests, activeFilter, searchQuery]);

  // ✅ Fetch requests with proper error handling
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching student enrollment requests...');
      
      // Try API service first
      const result = await api.getStudentEnrollmentRequests(token);
      console.log('📥 Full API response:', JSON.stringify(result, null, 2));
      
      // Extract requests from different possible response structures
      let requestsData = [];
      
      if (result) {
        if (result.success && result.requests) {
          requestsData = result.requests;
          console.log('✅ Found requests in result.requests:', requestsData.length);
        } else if (result.success && result.data && result.data.requests) {
          requestsData = result.data.requests;
          console.log('✅ Found requests in result.data.requests:', requestsData.length);
        } else if (result.success && Array.isArray(result.data)) {
          requestsData = result.data;
          console.log('✅ Found requests in result.data (array):', requestsData.length);
        } else if (result.requests && Array.isArray(result.requests)) {
          requestsData = result.requests;
          console.log('✅ Found requests in result.requests (no success):', requestsData.length);
        } else if (Array.isArray(result)) {
          requestsData = result;
          console.log('✅ Result is directly an array:', requestsData.length);
        } else if (result.data && Array.isArray(result.data)) {
          requestsData = result.data;
          console.log('✅ Found requests in result.data:', requestsData.length);
        } else {
          console.log('⚠️ Unknown response structure, trying to find any array...');
          for (const key in result) {
            if (Array.isArray(result[key])) {
              requestsData = result[key];
              console.log(`✅ Found array in result.${key}:`, requestsData.length);
              break;
            }
          }
        }
      }
      
      // ✅ Log each request to see what fields are available
      requestsData.forEach((req, index) => {
        console.log(`📋 Request ${index + 1}:`, {
          id: req._id || req.id,
          teacher_name: req.teacher_name || req.teacherName,
          student_name: req.student_name || req.studentName,
          learning_mode: req.learning_mode || req.learningMode || req.mode,
          student_learning_mode: req.student_learning_mode || req.studentLearningMode,
          status: req.status,
          subject: req.subject
        });
      });
      
      // ✅ Ensure each request has a unique ID
      requestsData = requestsData.map(req => ({
        ...req,
        _id: req._id || req.id || `req_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      console.log('📋 Final requests data:', requestsData);
      console.log('📋 Number of requests:', requestsData.length);
      
      setRequests(requestsData);
      
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      setError('Error loading requests. Please try again.');
      
      // ✅ Fallback: Direct API call
      try {
        console.log('🔄 Trying direct API call as fallback...');
        const response = await fetch('/api/enrollment/requests/student', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        console.log('📥 Direct API response:', JSON.stringify(result, null, 2));
        
        let requestsData = [];
        if (result.success && result.requests) {
          requestsData = result.requests;
        } else if (result.requests) {
          requestsData = result.requests;
        } else if (Array.isArray(result)) {
          requestsData = result;
        }
        
        // ✅ Ensure each request has a unique ID
        requestsData = requestsData.map(req => ({
          ...req,
          _id: req._id || req.id || `req_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setRequests(requestsData);
        setError('');
        console.log('✅ Fallback succeeded! Requests loaded:', requestsData.length);
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Apply filters and search
  const applyFilters = () => {
    let result = [...requests];

    if (activeFilter !== 'all') {
      result = result.filter(r => r.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(r => {
        const teacherName = (r.teacher_name || r.teacherName || '').toLowerCase();
        const subjectName = getSubjectName(r.subject).toLowerCase();
        return teacherName.includes(query) || subjectName.includes(query);
      });
    }

    setFilteredRequests(result);
  };

  // ✅ Cancel Request
  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/enrollment/request/${requestId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Request cancelled successfully');
        await fetchRequests();
      } else {
        alert(data.error || 'Failed to cancel request');
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('Error cancelling request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Navigation handlers with state
  const handleViewProfile = (teacherId) => {
    navigate(`/teacher-profile/${teacherId}`, {
      state: { from: '/student/requests' }
    });
  };

  // ✅ Go to My Courses
  const handleGoToMyCourses = () => {
    navigate('/student/courses', {
      state: { from: '/student/requests' }
    });
  };

  const handleFindTutors = () => {
    navigate('/find-tutor', {
      state: { from: '/student/requests' }
    });
  };

  const handleSendNewRequest = (teacherId) => {
    navigate(`/teacher-profile/${teacherId}`, {
      state: { from: '/student/requests', action: 'enroll' }
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending', desc: 'Waiting for teacher approval' },
      approved: { bg: '#dcfce7', color: '#15803d', label: '✅ Approved', desc: 'Teacher accepted your request' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected', desc: 'Teacher declined your request' },
      cancelled: { bg: '#f1f5f9', color: '#64748b', label: '⚫ Cancelled', desc: 'Cancelled by student' }
    };
    return styles[status] || styles.pending;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  // ✅ Render action buttons based on status
  const renderActions = (req) => {
    const status = req.status;

    switch(status) {
      case 'pending':
        return (
          <>
            <button
              style={styles.viewProfileBtn}
              onClick={() => handleViewProfile(req.teacher_id || req.teacherId)}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              👤 View Profile
            </button>
            <button
              style={styles.cancelBtn}
              onClick={() => handleCancel(req._id || req.id)}
              disabled={actionLoading}
              onMouseEnter={(e) => {
                if (!actionLoading) e.target.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) e.target.style.opacity = '1';
              }}
            >
              {actionLoading ? '⏳...' : '🚫 Cancel Request'}
            </button>
          </>
        );

      case 'approved':
        return (
          <>
            <button
              style={styles.viewProfileBtn}
              onClick={() => handleViewProfile(req.teacher_id || req.teacherId)}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              👤 View Profile
            </button>
            <button
              style={styles.coursesBtn}
              onClick={handleGoToMyCourses}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              📚 Go to My Courses
            </button>
          </>
        );

      case 'rejected':
        return (
          <>
            <button
              style={styles.viewProfileBtn}
              onClick={() => handleViewProfile(req.teacher_id || req.teacherId)}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              👤 View Profile
            </button>
            <button
              style={styles.findTutorBtnSmall}
              onClick={handleFindTutors}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              🔍 Find Similar Tutors
            </button>
          </>
        );

      case 'cancelled':
        return (
          <>
            <button
              style={styles.viewProfileBtn}
              onClick={() => handleViewProfile(req.teacher_id || req.teacherId)}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              👤 View Profile
            </button>
            <button
              style={styles.newRequestBtn}
              onClick={() => handleSendNewRequest(req.teacher_id || req.teacherId)}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              📝 Send New Request
            </button>
          </>
        );

      default:
        return null;
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
    requestCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'all 0.2s'
    },
    requestTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '12px'
    },
    requestLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1,
      minWidth: '200px'
    },
    teacherAvatar: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden'
    },
    teacherAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    teacherInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    teacherName: {
      fontSize: '17px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    teacherQualification: {
      fontSize: '13px',
      color: '#666'
    },
    teacherTeachingMode: {
      fontSize: '12px',
      color: '#94a3b8',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '2px'
    },
    requestMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      fontSize: '13px',
      color: '#555',
      marginTop: '2px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: '#f8fafc',
      padding: '2px 10px',
      borderRadius: '6px'
    },
    scheduleSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '10px',
      border: '1px solid #f0f0f0'
    },
    scheduleItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#1f1f3e'
    },
    scheduleLabel: {
      color: '#94a3b8',
      fontSize: '12px'
    },
    scheduleValue: {
      fontWeight: '500',
      color: '#1f1f3e'
    },
    requestBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    },
    statusSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      };
    },
    statusDesc: {
      fontSize: '12px',
      color: '#94a3b8'
    },
    actionsSection: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    },
    viewProfileBtn: {
      padding: '8px 18px',
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    cancelBtn: {
      padding: '8px 18px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    coursesBtn: {
      padding: '8px 18px',
      background: '#22c55e',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    findTutorBtnSmall: {
      padding: '8px 18px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    newRequestBtn: {
      padding: '8px 18px',
      background: '#8b5cf6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    findTutorBtn: {
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
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8'
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
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading your requests...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;

  const filterCounts = {
    all: requests.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    cancelled: cancelledCount
  };

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
              <h1 style={styles.title}>📋 My Requests</h1>
              <p style={styles.subtitle}>
                {pendingCount > 0
                  ? `You have ${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`
                  : 'No pending requests'}
              </p>
            </div>
            <button
              style={styles.findTutorBtn}
              onClick={handleFindTutors}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔍 Find More Tutors
            </button>
          </div>

          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((filter) => (
                <button
                  key={filter}
                  style={{
                    ...styles.filterBtn,
                    ...(activeFilter === filter ? styles.filterBtnActive : {})
                  }}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  <span style={styles.filterBtnCount}>
                    ({filterCounts[filter] || 0})
                  </span>
                </button>
              ))}
            </div>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Search teacher or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>

          {filteredRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyTitle}>
                {requests.length === 0 
                  ? 'No enrollment requests yet' 
                  : 'No requests match your filters'}
              </div>
              <div style={styles.emptySubtitle}>
                {requests.length === 0 
                  ? 'Find tutors and send your first enrollment request' 
                  : 'Try changing your filters or search term'}
              </div>
              {requests.length === 0 && (
                <button
                  style={styles.findTutorBtn}
                  onClick={handleFindTutors}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🔍 Find Tutors
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.resultCount}>
                Showing {filteredRequests.length} request{filteredRequests.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {filteredRequests.map((req) => {
                  const statusStyle = getStatusBadge(req.status);
                  
                  const teacherName = req.teacher_name || req.teacherName || 'Teacher';
                  const teacherQualification = req.teacher_qualification || req.teacherQualification || 'Qualification not specified';
                  
                  // ✅ FIXED: Get learning mode from multiple possible fields
                  const learningMode = getLearningMode(req);
                  const subjectName = getSubjectName(req.subject);
                  const preferredSchedule = getPreferredSchedule(req);
                  
                  return (
                    <div key={req._id || req.id} style={styles.requestCard}>
                      {/* TOP: Teacher Info + Status */}
                      <div style={styles.requestTop}>
                        <div style={styles.requestLeft}>
                          <div style={styles.teacherAvatar}>
                            {req.teacher_profile_picture || req.teacherProfilePicture ? (
                              <img 
                                src={req.teacher_profile_picture || req.teacherProfilePicture} 
                                alt={teacherName}
                                style={styles.teacherAvatarImage}
                              />
                            ) : (
                              getInitials(teacherName)
                            )}
                          </div>
                          <div style={styles.teacherInfo}>
                            <div style={styles.teacherName}>
                              {teacherName}
                            </div>
                            <div style={styles.teacherQualification}>
                              {teacherQualification}
                            </div>
                            <div style={styles.teacherTeachingMode}>
                              {learningMode}
                            </div>
                            <div style={styles.requestMeta}>
                              <span style={styles.metaItem}>📚 {subjectName || 'General'}</span>
                              <span style={styles.metaItem}>📍 {req.teacher_location || req.teacherLocation || 'N/A'}</span>
                              {req.fee && (
                                <span style={{...styles.metaItem, background: '#e0e7ff', color: '#4f46e5'}}>
                                  💰 Rs. {req.fee}/month
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span style={styles.statusBadge(req.status)}>
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* MIDDLE: Schedule */}
                      <div style={styles.scheduleSection}>
                        <div style={styles.scheduleItem}>
                          <span style={styles.scheduleLabel}>📅 Requested Schedule</span>
                          <span style={styles.scheduleValue}>
                            {preferredSchedule}
                          </span>
                        </div>
                        <div style={styles.scheduleItem}>
                          <span style={styles.scheduleLabel}>📚 Learning Mode</span>
                          <span style={styles.scheduleValue}>
                            {learningMode}
                          </span>
                        </div>
                        <div style={styles.scheduleItem}>
                          <span style={styles.scheduleLabel}>📅 Requested on</span>
                          <span style={styles.scheduleValue}>
                            {req.created_at ? formatDate(req.created_at) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* BOTTOM: Status Description + Actions */}
                      <div style={styles.requestBottom}>
                        <div style={styles.statusSection}>
                          <span style={styles.statusDesc}>{statusStyle.desc}</span>
                        </div>
                        <div style={styles.actionsSection}>
                          {renderActions(req)}
                        </div>
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

export default StudentRequests;