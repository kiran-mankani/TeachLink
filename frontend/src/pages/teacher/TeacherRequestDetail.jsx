// frontend/src/pages/teacher/TeacherRequestDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const TeacherRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [request, setRequest] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  // ✅ Navigation handlers with state
  const handleBackToRequests = () => {
    navigate('/teacher/requests', { state: { from: '/teacher/request-detail' } });
  };

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

      // 1. Fetch Request Data
      const reqRes = await fetch(`/api/enrollment/request/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();

      if (!reqData.success) {
        throw new Error('Request not found');
      }
      setRequest(reqData.request);

      // 2. Fetch Student Profile
      if (reqData.request.student_id) {
        const stuRes = await fetch(`/api/enrollment/student-profile/${reqData.request.student_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const stuData = await stuRes.json();
        if (stuData.success) {
          setStudent(stuData.student);
        }
      }

    } catch (err) {
      console.error(err);
      alert('Failed to load request details');
      navigate('/teacher/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status) => {
    const action = status === 'approved' ? 'accept' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/enrollment/request/${requestId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        alert(status === 'approved' ? '✅ Request Accepted!' : '❌ Request Rejected');
        navigate('/teacher/requests', { state: { from: '/teacher/request-detail' } });
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating request');
    } finally {
      setActionLoading(false);
    }
  };

  // Styles
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
      overflowY: 'auto'
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
      alignItems: 'flex-start',
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
      marginBottom: '25px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    label: {
      fontWeight: '600',
      color: '#555',
      fontSize: '14px'
    },
    value: {
      color: '#1f1f3e',
      fontSize: '16px',
      marginBottom: '15px',
      padding: '8px 12px',
      background: '#f8fafc',
      borderRadius: '8px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    btnGroup: {
      display: 'flex',
      gap: '15px',
      marginTop: '30px',
      flexWrap: 'wrap'
    },
    acceptBtn: {
      flex: 1,
      padding: '14px',
      background: '#22c55e',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      minWidth: '150px'
    },
    rejectBtn: {
      flex: 1,
      padding: '14px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      minWidth: '150px'
    },
    disabledBtn: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    backBtn: {
      padding: '10px 20px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#555',
      fontSize: '14px',
      transition: 'all 0.3s'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
    },
    statusBadge: (status) => {
      const colors = {
        pending: { bg: '#fef3c7', color: '#b45309' },
        approved: { bg: '#dcfce7', color: '#15803d' },
        rejected: { bg: '#fee2e2', color: '#b91c1c' }
      };
      const style = colors[status] || colors.pending;
      return {
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-block'
      };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading request details...</div>
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
            <BackButton label="← Back to Requests" fallbackPath="/teacher/requests" />
          )}

          <div style={styles.card}>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>👤 Student Request</h1>
                <p style={styles.subtitle}>
                  Review the student's profile before accepting or rejecting
                </p>
              </div>
              <button
                style={styles.backBtn}
                onClick={handleBackToRequests}
                onMouseEnter={(e) => e.target.style.borderColor = '#999'}
                onMouseLeave={(e) => e.target.style.borderColor = '#ddd'}
              >
                ← Back to Requests
              </button>
            </div>

            {request && (
              <div style={{ marginBottom: '20px' }}>
                <span style={styles.statusBadge(request.status)}>
                  {request.status === 'pending' ? '⏳ Pending' :
                   request.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                </span>
              </div>
            )}

            <div style={styles.grid}>
              <div>
                <div style={styles.label}>Student Name</div>
                <div style={styles.value}>{student?.name || request?.student_name || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Subject</div>
                <div style={styles.value}>{request?.subject || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Learning Mode</div>
                <div style={styles.value}>
                  {request?.learning_mode === 'online' ? '💻 Online' :
                   request?.learning_mode === 'physical' ? '🏠 Physical' : 'Both'}
                </div>
              </div>
              <div>
                <div style={styles.label}>Preferred Schedule</div>
                <div style={styles.value}>{request?.preferred_schedule || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Education Level</div>
                <div style={styles.value}>{student?.education_level || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Location</div>
                <div style={styles.value}>{student?.location || 'N/A'}</div>
              </div>
              <div style={styles.fullWidth}>
                <div style={styles.label}>Message</div>
                <div style={styles.value}>{request?.message || 'No message provided'}</div>
              </div>
            </div>

            {request?.status === 'pending' && (
              <div style={styles.btnGroup}>
                <button
                  style={{
                    ...styles.acceptBtn,
                    ...(actionLoading ? styles.disabledBtn : {})
                  }}
                  onClick={() => handleDecision('approved')}
                  disabled={actionLoading}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {actionLoading ? '⏳ Processing...' : '✅ Accept'}
                </button>
                <button
                  style={{
                    ...styles.rejectBtn,
                    ...(actionLoading ? styles.disabledBtn : {})
                  }}
                  onClick={() => handleDecision('rejected')}
                  disabled={actionLoading}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {actionLoading ? '⏳ Processing...' : '❌ Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherRequestDetail;