import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const TeacherRequests = () => {
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

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Apply filters whenever requests or filter state changes
  useEffect(() => {
    applyFilters();
  }, [requests, activeFilter, searchQuery]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching teacher enrollment requests...');
      
      // Try API service first
      const result = await api.getTeacherEnrollmentRequests(token);
      console.log('📥 Full API response:', result);
      
      // Extract requests from different possible response structures
      let requestsData = [];
      
      if (result) {
        if (result.success && result.requests) {
          requestsData = result.requests;
        } else if (result.success && result.data && result.data.requests) {
          requestsData = result.data.requests;
        } else if (result.success && Array.isArray(result.data)) {
          requestsData = result.data;
        } else if (result.requests && Array.isArray(result.requests)) {
          requestsData = result.requests;
        } else if (Array.isArray(result)) {
          requestsData = result;
        } else if (result.data && Array.isArray(result.data)) {
          requestsData = result.data;
        }
      }
      
      console.log('📋 Requests loaded:', requestsData.length);
      setRequests(requestsData);
      
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      setError('Error loading requests. Please try again.');
      
      // Fallback: Direct API call
      try {
        console.log('🔄 Trying direct API call as fallback...');
        const response = await fetch('/api/enrollment/requests/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        console.log('📥 Direct API response:', result);
        
        if (result.success && result.requests) {
          setRequests(result.requests);
          setError('');
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...requests];

    if (activeFilter !== 'all') {
      result = result.filter(r => r.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        (r.student_name || '').toLowerCase().includes(query) ||
        getSubjectName(r.subject).toLowerCase().includes(query)
      );
    }

    setFilteredRequests(result);
  };

  // ✅ Accept Request
  const handleAccept = async (requestId) => {
    if (!window.confirm('Accept this enrollment request?')) return;

    setActionLoading(true);
    try {
      const result = await api.acceptEnrollmentRequest(token, requestId);
      if (result.success) {
        alert('✅ Enrollment request accepted!');
        await fetchRequests();
      } else {
        alert('❌ Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('❌ Error accepting request');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Reject Request
  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this enrollment request?')) return;

    setActionLoading(true);
    try {
      const result = await api.rejectEnrollmentRequest(token, requestId);
      if (result.success) {
        alert('❌ Request rejected.');
        await fetchRequests();
      } else {
        alert('❌ Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('❌ Error rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewStudentProfile = (studentId) => {
    navigate(`/teacher/student-profile/${studentId}`, {
      state: { from: '/teacher/requests' }
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
      approved: { bg: '#dcfce7', color: '#15803d', label: '✅ Approved' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected' }
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
    studentAvatar: {
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
      fontSize: '17px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    studentDetails: {
      fontSize: '13px',
      color: '#666'
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
    requestBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    },
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-block'
      };
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
    acceptBtn: {
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
    rejectBtn: {
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
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading requests...</div>
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const filterCounts = {
    all: requests.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount
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
              <h1 style={styles.title}>📋 Enrollment Requests</h1>
              <p style={styles.subtitle}>
                {pendingCount > 0
                  ? `You have ${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`
                  : 'No pending requests'}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
              {['all', 'pending', 'approved', 'rejected'].map((filter) => (
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
              placeholder="🔍 Search student or subject..."
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
                  ? 'Students will appear here when they send requests' 
                  : 'Try changing your filters or search term'}
              </div>
            </div>
          ) : (
            <>
              <div style={styles.resultCount}>
                Showing {filteredRequests.length} request{filteredRequests.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {filteredRequests.map((req) => {
                  const statusStyle = getStatusBadge(req.status);
                  const isPending = req.status === 'pending';
                  const subjectName = getSubjectName(req.subject);
                  
                  return (
                    <div key={req._id || req.id} style={styles.requestCard}>
                      {/* TOP: Student Info + Status */}
                      <div style={styles.requestTop}>
                        <div style={styles.requestLeft}>
                          <div style={styles.studentAvatar}>
                            {req.student_profile_picture ? (
                              <img 
                                src={req.student_profile_picture} 
                                alt={req.student_name}
                                style={styles.studentAvatarImage}
                              />
                            ) : (
                              getInitials(req.student_name)
                            )}
                          </div>
                          <div style={styles.studentInfo}>
                            <div style={styles.studentName}>
                              {req.student_name || 'Student'}
                            </div>
                            <div style={styles.studentDetails}>
                              {req.student_education_level || 'Education not specified'}
                            </div>
                            <div style={styles.requestMeta}>
                              <span style={styles.metaItem}>📚 {subjectName || 'General'}</span>
                              <span style={styles.metaItem}>📍 {req.student_location || 'N/A'}</span>
                              {req.fee && (
                                <span style={{...styles.metaItem, background: '#e0e7ff', color: '#4f46e5'}}>
                                  💰 Rs. {req.fee}/month
                                </span>
                              )}
                              <span style={styles.metaItem}>📅 {formatDate(req.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <span style={styles.statusBadge(req.status)}>
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* BOTTOM: Status + Actions */}
                      <div style={styles.requestBottom}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {req.preferred_schedule && (
                            <span style={styles.metaItem}>🕐 {req.preferred_schedule}</span>
                          )}
                          {req.learning_mode && (
                            <span style={styles.metaItem}>
                              {req.learning_mode === 'online' ? '💻 Online' :
                               req.learning_mode === 'physical' ? '🏠 Physical' : '💻 + 🏠 Both'}
                            </span>
                          )}
                          {req.message && (
                            <span style={{...styles.metaItem, background: '#fef3c7', color: '#b45309'}}>
                              💬 {req.message}
                            </span>
                          )}
                        </div>
                        <div style={styles.actionsSection}>
                          <button
                            style={styles.viewProfileBtn}
                            onClick={() => handleViewStudentProfile(req.student_id)}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            👤 View Profile
                          </button>
                          {isPending && (
                            <>
                              <button
                                style={styles.acceptBtn}
                                onClick={() => handleAccept(req._id || req.id)}
                                disabled={actionLoading}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                {actionLoading ? '⏳...' : '✅ Accept'}
                              </button>
                              <button
                                style={styles.rejectBtn}
                                onClick={() => handleReject(req._id || req.id)}
                                disabled={actionLoading}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                {actionLoading ? '⏳...' : '❌ Reject'}
                              </button>
                            </>
                          )}
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

export default TeacherRequests;