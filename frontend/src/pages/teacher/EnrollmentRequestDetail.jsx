import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

const EnrollmentRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [request, setRequest] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Request Data
      const reqRes = await fetch(`/api/enrollment/request/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      if (!reqData.success) throw new Error('Request not found');
      setRequest(reqData.request);

      // 2. Fetch Student Public Profile (Safe API)
      const stuRes = await fetch(`/api/enrollment/student-profile/${reqData.request.student_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stuData = await stuRes.json();
      if (stuData.success) {
        setStudent(stuData.student);
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
    if (!window.confirm(`Are you sure you want to ${status === 'approved' ? 'accept' : 'reject'} this request?`)) return;
    
    setActionLoading(true);
    try {
      const endpoint = status === 'approved' ? 'accept' : 'reject';
      const res = await fetch(`/api/enrollment/request/${requestId}/${endpoint}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(status === 'approved' ? '✅ Request Accepted!' : '❌ Request Rejected');
        navigate('/teacher/requests');
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>Loading request details...</div>;

  const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Poppins', sans-serif" },
    mainLayout: { display: 'flex', marginLeft: '260px', minHeight: '100vh', width: '100%' },
    content: { flex: 1, padding: '30px 40px' },
    card: { background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f1f3e' },
    subtitle: { color: '#666', marginBottom: '25px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    label: { fontWeight: '600', color: '#555', fontSize: '14px' },
    value: { color: '#1f1f3e', fontSize: '16px', marginBottom: '15px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' },
    fullWidth: { gridColumn: '1 / -1' },
    btnGroup: { display: 'flex', gap: '15px', marginTop: '30px' },
    acceptBtn: { flex: 1, padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' },
    rejectBtn: { flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' },
    disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
    backBtn: { padding: '10px 20px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#555', fontSize: '14px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <Sidebar role="teacher" />
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>👤 Student Profile</h1>
                <p style={styles.subtitle}>Review the student's profile before accepting or rejecting.</p>
              </div>
              <button style={styles.backBtn} onClick={() => navigate('/teacher/requests')}>← Back</button>
            </div>

            <div style={styles.grid}>
              <div>
                <div style={styles.label}>Student Name</div>
                <div style={styles.value}>{student?.name || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Class / Grade</div>
                <div style={styles.value}>{student?.education_level || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Subjects</div>
                <div style={styles.value}>{(student?.subjects || []).join(', ')}</div>
              </div>
              <div>
                <div style={styles.label}>Learning Mode</div>
                <div style={styles.value}>{student?.learning_mode || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Area</div>
                <div style={styles.value}>{student?.location || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.label}>Preferred Schedule</div>
                <div style={styles.value}>{request?.preferred_schedule || 'N/A'}</div>
              </div>
              <div style={styles.fullWidth}>
                <div style={styles.label}>About Student</div>
                <div style={styles.value}>{student?.bio || 'No bio provided'}</div>
              </div>
            </div>

            <div style={styles.btnGroup}>
              <button 
                style={{...styles.acceptBtn, ...(actionLoading ? styles.disabledBtn : {})}} 
                onClick={() => handleDecision('approved')}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Processing...' : '✅ Accept'}
              </button>
              <button 
                style={{...styles.rejectBtn, ...(actionLoading ? styles.disabledBtn : {})}} 
                onClick={() => handleDecision('rejected')}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Processing...' : '❌ Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentRequestDetail;