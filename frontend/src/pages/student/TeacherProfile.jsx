import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getDistance, getDistanceMatchPercentage, normalizeAreaName } from '../../utils/karachiDistances';

const TeacherProfile = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [matchBreakdown, setMatchBreakdown] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Check if request already exists
  const [existingRequest, setExistingRequest] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    fetchTeacherProfile();
    checkExistingRequest();
  }, [teacherId]);

  // Check if student already has a request for this teacher
  const checkExistingRequest = async () => {
    try {
      const response = await fetch('/api/enrollment/requests/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const existing = data.requests.find(
          r => r.teacher_id === teacherId && 
               ['pending', 'approved'].includes(r.status)
        );
        if (existing) {
          setExistingRequest(existing);
          setRequestStatus(existing.status);
        }
      }
    } catch (err) {
      console.error('Error checking existing request:', err);
    }
  };

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

  // ✅ Helper to get subject fee from teacher's subjects
  const getSubjectFee = (subjects, subjectName) => {
    if (!subjects || !Array.isArray(subjects)) return null;
    for (let s of subjects) {
      if (typeof s === 'string') {
        if (s === subjectName) return null;
      } else if (typeof s === 'object' && s !== null) {
        if (s.subject === subjectName) {
          return s.fee || s.budget || null;
        }
      }
    }
    return null;
  };

  // ✅ Get fee from subject_fees array
  const getFeeFromSubjectFees = (subjectFees, subjectName) => {
    if (!subjectFees || !Array.isArray(subjectFees) || subjectFees.length === 0) {
      return null;
    }
    for (let s of subjectFees) {
      if (s.subject === subjectName) {
        return s.fee || s.budget || null;
      }
    }
    return null;
  };

  const fetchTeacherProfile = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📤 Fetching teacher profile for ID:', teacherId);

      const response = await fetch(`/api/enrollment/teacher-profile/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Teacher profile response:', data);

      if (data.success && data.teacher) {
        setTeacher(data.teacher);
        console.log('✅ Teacher loaded:', data.teacher.name);
        console.log('📌 Schedules from API:', data.teacher.schedules);
        console.log('📌 Subject Fees:', data.teacher.subject_fees);
        console.log('📌 Subjects:', data.teacher.subjects);
        
        generateMatchBreakdown(data.teacher);
        
        // Set default selected subject
        if (data.teacher.subjects && data.teacher.subjects.length > 0) {
          const firstSubject = data.teacher.subjects[0];
          setSelectedSubject(typeof firstSubject === 'string' ? firstSubject : firstSubject.subject);
        }
      } else {
        setError(data.error || 'Teacher not found');
      }
    } catch (err) {
      console.error('❌ Error fetching teacher profile:', err);
      setError('Error loading teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const generateMatchBreakdown = (teacherData) => {
    const student = JSON.parse(localStorage.getItem('user') || '{}');
    const studentProfile = JSON.parse(localStorage.getItem('studentProfile') || '{}');
    
    const breakdown = {};
    
    // ==========================================
    // A. AREA MATCH - Distance based
    // ==========================================
    const studentArea = studentProfile.location || student.location || '';
    const teacherArea = teacherData.location || '';
    
    let areaMatch = { score: 0, distance: null, matched: false };
    
    if (studentArea && teacherArea) {
      const normalizedStudent = normalizeAreaName(studentArea);
      const normalizedTeacher = normalizeAreaName(teacherArea);
      
      if (normalizedStudent && normalizedTeacher) {
        const distance = getDistance(normalizedStudent, normalizedTeacher);
        if (distance !== null) {
          areaMatch.distance = distance;
          areaMatch.score = getDistanceMatchPercentage(distance);
          areaMatch.matched = areaMatch.score > 0;
        }
      }
    }
    
    breakdown.area = {
      label: '📍 Area Match',
      score: areaMatch.score,
      max: 100,
      student: studentArea || 'Not specified',
      teacher: teacherArea || 'Not specified',
      distance: areaMatch.distance !== null ? `${areaMatch.distance} km` : 'Unknown',
      matched: areaMatch.matched
    };

    // ==========================================
    // B. SUBJECT MATCH
    // ==========================================
    const studentSubjects = studentProfile.subjects || student.subjects || [];
    const teacherSubjects = teacherData.subjects || [];
    
    const studentSubjectNames = studentSubjects.map(s => {
      if (typeof s === 'string') return s;
      if (typeof s === 'object' && s !== null) {
        return s.subject || s.name || '';
      }
      return '';
    }).filter(s => s);
    
    const teacherSubjectNames = teacherSubjects.map(s => {
      if (typeof s === 'string') return s;
      if (typeof s === 'object' && s !== null) {
        return s.subject || s.name || '';
      }
      return '';
    }).filter(s => s);
    
    const commonSubjects = studentSubjectNames.filter(s => teacherSubjectNames.includes(s));
    const subjectScore = studentSubjectNames.length > 0 && teacherSubjectNames.length > 0
      ? Math.round((commonSubjects.length / Math.max(studentSubjectNames.length, teacherSubjectNames.length)) * 100)
      : 0;
    
    breakdown.subject = {
      label: '📚 Subject Match',
      score: subjectScore,
      max: 100,
      student: studentSubjectNames.join(', ') || 'Not specified',
      teacher: teacherSubjectNames.join(', ') || 'Not specified',
      matched: commonSubjects.join(', ') || 'None'
    };

    // ==========================================
    // C. TEACHING MODE - Only 100% or 0%
    // ==========================================
    const studentMode = (studentProfile.learning_mode || student.learning_mode || '').toLowerCase();
    const teacherMode = (teacherData.teaching_mode || '').toLowerCase();
    
    let modeScore = 0;
    if (studentMode && teacherMode) {
      if (teacherMode === 'both') {
        modeScore = 100;
      } else if (studentMode === teacherMode) {
        modeScore = 100;
      } else {
        modeScore = 0;
      }
    }
    
    breakdown.mode = {
      label: '💻 Teaching Mode Match',
      score: modeScore,
      max: 100,
      student: studentMode || 'Not specified',
      teacher: teacherMode || 'Not specified',
      matched: modeScore === 100
    };

    // ❌ REMOVED: Study Time Match
    // ❌ REMOVED: Budget Match

    setMatchBreakdown(breakdown);
  };

  // ✅ Handle request
  const handleRequest = async () => {
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }

    if (existingRequest) {
      alert(`You already have a ${existingRequest.status} request for this teacher.`);
      return;
    }

    if (!window.confirm(`Send enrollment request to ${teacher?.name} for ${selectedSubject}?`)) return;

    setSendingRequest(true);
    try {
      let fee = getSubjectFee(teacher?.subjects || [], selectedSubject);
      if (!fee) {
        fee = getFeeFromSubjectFees(teacher?.subject_fees || [], selectedSubject);
      }

      console.log('💰 Fee for subject:', selectedSubject, '=', fee);

      const response = await fetch('/api/enrollment/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          subject: selectedSubject,
          fee: fee || '',
          preferred_schedule: 'Flexible',
          message: message
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Enrollment request sent for ${selectedSubject}${fee ? ` (Fee: Rs. ${fee}/month)` : ''}!`);
        setExistingRequest({ status: 'pending' });
        setRequestStatus('pending');
        navigate('/student/requests');
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (err) {
      console.error('Error sending request:', err);
      alert('❌ Error sending request');
    } finally {
      setSendingRequest(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTeachingModeDisplay = (mode) => {
    if (!mode) return 'Online';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻 Online';
    if (modeLower === 'physical') return '🏠 Physical';
    if (modeLower === 'both') return '💻 + 🏠 Both';
    return 'Online';
  };

  const getTeachingModeIcon = (mode) => {
    if (!mode) return '💻';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻';
    if (modeLower === 'physical') return '🏠';
    if (modeLower === 'both') return '💻 + 🏠';
    return '💻';
  };

  const getMatchColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // ✅ Render subject fees
  const renderSubjectFees = () => {
    if (!teacher) return null;
    
    const subjectList = getSubjectList(teacher.subjects);
    
    if (subjectList.length === 0) {
      return <span style={{ color: '#94a3b8' }}>No subjects specified</span>;
    }

    const subjectFees = teacher.subject_fees || [];
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
        {subjectList.map((subject, idx) => {
          let fee = getFeeFromSubjectFees(subjectFees, subject);
          if (!fee) {
            fee = getSubjectFee(teacher.subjects, subject);
          }
          
          return (
            <div key={idx} style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#f0f4ff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minWidth: '180px',
              flex: '1 1 auto'
            }}>
              <span style={{ fontWeight: '500', color: '#1f1f3e' }}>{subject}</span>
              <span style={{
                background: fee ? '#4f46e5' : '#94a3b8',
                color: 'white',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {fee ? `Rs. ${fee}/month` : 'No fee set'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ✅ Render subject chips
  const renderSubjectChips = () => {
    const subjectList = getSubjectList(teacher?.subjects || []);
    if (subjectList.length === 0) return null;
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        {subjectList.map((subject, idx) => (
          <span key={idx} style={{
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '500',
            background: '#e0e7ff',
            color: '#4f46e5',
            border: '1px solid #c7d2fe'
          }}>
            {subject}
          </span>
        ))}
      </div>
    );
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderRequestStatus = () => {
    if (!requestStatus) return null;
    
    const statusConfig = {
      pending: { color: '#f59e0b', bg: '#fef3c7', label: '⏳ Pending Request' },
      approved: { color: '#16a34a', bg: '#dcfce7', label: '✅ Approved' },
      rejected: { color: '#dc2626', bg: '#fee2e2', label: '❌ Rejected' }
    };
    
    const config = statusConfig[requestStatus] || statusConfig.pending;
    
    return (
      <div style={{
        padding: '10px 20px',
        borderRadius: '10px',
        background: config.bg,
        color: config.color,
        fontWeight: '600',
        fontSize: '14px',
        marginBottom: '16px',
        border: `2px solid ${config.color}`,
        textAlign: 'center'
      }}>
        {config.label}
      </div>
    );
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
    profileHeader: {
      display: 'flex',
      gap: '30px',
      alignItems: 'center',
      paddingBottom: '30px',
      borderBottom: '1px solid #f0f0f0',
      flexWrap: 'wrap'
    },
    avatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '38px',
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
    teacherName: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    verifiedBadge: {
      fontSize: '13px',
      color: '#22c55e',
      background: '#dcfce7',
      padding: '2px 12px',
      borderRadius: '20px',
      fontWeight: '500'
    },
    teacherMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      fontSize: '14px',
      color: '#555',
      marginTop: '8px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: '#f8fafc',
      padding: '4px 14px',
      borderRadius: '8px'
    },
    matchSection: {
      padding: '20px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    matchTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px'
    },
    matchGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',  // ✅ 3 equal columns
      gap: '16px'
    },
    matchItem: {
      background: '#f8fafc',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid #f0f0f0'
    },
    matchLabel: {
      fontSize: '13px',
      color: '#94a3b8',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '4px'
    },
    matchScore: {
      fontSize: '24px',
      fontWeight: '700',
      marginTop: '2px'
    },
    matchBar: {
      height: '4px',
      background: '#e8e8e8',
      borderRadius: '2px',
      marginTop: '8px',
      overflow: 'hidden'
    },
    matchBarFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.8s ease'
    },
    matchDetails: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    matchDetailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1px 0'
    },
    matchDetailLabel: {
      color: '#94a3b8'
    },
    matchDetailValue: {
      color: '#1f1f3e',
      fontWeight: '500',
      textAlign: 'right'
    },
    matchStatus: {
      fontSize: '12px',
      fontWeight: '600',
      marginTop: '4px',
      padding: '2px 10px',
      borderRadius: '12px',
      display: 'inline-block'
    },
    subjectFeeSection: {
      padding: '20px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    subjectFeeTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      padding: '20px 0',
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
      padding: '20px 0',
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
    requestSection: {
      padding: '20px 0'
    },
    requestTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px'
    },
    subjectSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      marginBottom: '12px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    subjectFeeDisplay: {
      padding: '10px 16px',
      background: '#f0f4ff',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#4f46e5',
      marginBottom: '12px',
      border: '1px solid #c7d2fe',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    messageInput: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: '80px',
      marginBottom: '16px',
      transition: 'border-color 0.3s'
    },
    requestBtn: {
      padding: '14px 40px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
      fontFamily: 'inherit',
      width: '100%'
    },
    requestBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    requestBtnAlready: {
      padding: '14px 40px',
      background: '#94a3b8',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'not-allowed',
      fontFamily: 'inherit',
      width: '100%'
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
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading teacher profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.errorContainer}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2>Teacher Not Found</h2>
              <p style={{ color: '#94a3b8' }}>{error || 'Teacher profile not available'}</p>
              <button style={styles.errorButton} onClick={handleBack}>← Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const teachingMode = teacher.teaching_mode || 'online';
  const modeDisplay = getTeachingModeDisplay(teachingMode);
  const modeIcon = getTeachingModeIcon(teachingMode);

  const isRequestDisabled = requestStatus === 'pending' || requestStatus === 'approved' || sendingRequest;

  // Get subject list
  const subjectList = getSubjectList(teacher.subjects);

  // Get fee for selected subject
  let selectedFee = getFeeFromSubjectFees(teacher.subject_fees || [], selectedSubject);
  if (!selectedFee) {
    selectedFee = getSubjectFee(teacher.subjects, selectedSubject);
  }

  return (
    <div style={styles.container}>
      <Sidebar role="student" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
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
            ← Back
          </button>

          <div style={styles.card}>
            {/* ========================================== */}
            {/* PROFILE HEADER */}
            {/* ========================================== */}
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {teacher.profile_picture ? (
                  <img src={teacher.profile_picture} alt={teacher.name} style={styles.avatarImage} />
                ) : (
                  getInitials(teacher.name)
                )}
              </div>
              <div style={styles.profileInfo}>
                <div style={styles.teacherName}>
                  {teacher.name || 'Teacher'}
                  <span style={styles.verifiedBadge}>✅ Verified</span>
                </div>
                
                {/* ✅ Subject Chips */}
                {renderSubjectChips()}

                <div style={styles.teacherMeta}>
                  <span style={styles.metaItem}>{modeIcon} {modeDisplay}</span>
                  {teacher.location && (
                    <span style={styles.metaItem}>📍 {teacher.location}</span>
                  )}
                  {teacher.experience && (
                    <span style={styles.metaItem}>🎯 {teacher.experience}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Request Status Badge */}
            {renderRequestStatus()}

            {/* ========================================== */}
            {/* SUBJECT-WISE FEES */}
            {/* ========================================== */}
            <div style={styles.subjectFeeSection}>
              <div style={styles.subjectFeeTitle}>📋 Subject-wise Monthly Fees</div>
              {renderSubjectFees()}
            </div>

            {/* ========================================== */}
            {/* AI MATCHING - 3 Equal Cards */}
            {/* ========================================== */}
            {matchBreakdown && (
              <div style={styles.matchSection}>
                <div style={styles.matchTitle}>🎯 AI Matching Analysis</div>
                <div style={styles.matchGrid}>
                  {/* Area Match */}
                  <div style={styles.matchItem}>
                    <div style={styles.matchLabel}>📍 Area Match</div>
                    <div style={{ ...styles.matchScore, color: getMatchColor(matchBreakdown.area.score) }}>
                      {matchBreakdown.area.score}%
                    </div>
                    <div style={styles.matchBar}>
                      <div style={{ ...styles.matchBarFill, width: `${matchBreakdown.area.score}%`, background: getMatchColor(matchBreakdown.area.score) }} />
                    </div>
                    <div style={styles.matchDetails}>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Student:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.area.student}</span>
                      </div>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Teacher:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.area.teacher}</span>
                      </div>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Distance:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.area.distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Match */}
                  <div style={styles.matchItem}>
                    <div style={styles.matchLabel}>📚 Subject Match</div>
                    <div style={{ ...styles.matchScore, color: getMatchColor(matchBreakdown.subject.score) }}>
                      {matchBreakdown.subject.score}%
                    </div>
                    <div style={styles.matchBar}>
                      <div style={{ ...styles.matchBarFill, width: `${matchBreakdown.subject.score}%`, background: getMatchColor(matchBreakdown.subject.score) }} />
                    </div>
                    <div style={styles.matchDetails}>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Student:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.subject.student}</span>
                      </div>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Teacher:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.subject.teacher}</span>
                      </div>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Matched:</span>
                        <span style={styles.matchDetailValue} style={{ color: '#16a34a', fontWeight: '600' }}>
                          {matchBreakdown.subject.matched}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Teaching Mode Match */}
                  <div style={styles.matchItem}>
                    <div style={styles.matchLabel}>💻 Teaching Mode Match</div>
                    <div style={{ ...styles.matchScore, color: getMatchColor(matchBreakdown.mode.score) }}>
                      {matchBreakdown.mode.score}%
                    </div>
                    <div style={styles.matchBar}>
                      <div style={{ ...styles.matchBarFill, width: `${matchBreakdown.mode.score}%`, background: getMatchColor(matchBreakdown.mode.score) }} />
                    </div>
                    <div style={styles.matchDetails}>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Student:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.mode.student}</span>
                      </div>
                      <div style={styles.matchDetailRow}>
                        <span style={styles.matchDetailLabel}>Teacher:</span>
                        <span style={styles.matchDetailValue}>{matchBreakdown.mode.teacher}</span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          ...styles.matchStatus,
                          background: matchBreakdown.mode.matched ? '#dcfce7' : '#fee2e2',
                          color: matchBreakdown.mode.matched ? '#15803d' : '#b91c1c'
                        }}>
                          {matchBreakdown.mode.matched ? '✅ Matched' : '❌ Not Matched'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* DETAILS GRID */}
            {/* ========================================== */}
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>🎓 Qualification</span>
                <span style={styles.detailValue}>{teacher.qualification || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>💻 Teaching Mode</span>
                <span style={styles.detailValue}>{modeDisplay}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>🎯 Experience</span>
                <span style={styles.detailValue}>{teacher.experience || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>📍 Area</span>
                <span style={styles.detailValue}>{teacher.location || 'Not specified'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>📚 Subjects</span>
                <span style={styles.detailValue}>
                  {subjectList.length > 0 ? subjectList.join(' • ') : 'Not specified'}
                </span>
              </div>
            </div>

            {/* ========================================== */}
            {/* BIO */}
            {/* ========================================== */}
            {teacher.bio && (
              <div style={styles.bioSection}>
                <div style={styles.bioTitle}>📝 About Teacher</div>
                <div style={styles.bioText}>{teacher.bio}</div>
              </div>
            )}

            {/* ========================================== */}
            {/* REQUEST ENROLLMENT */}
            {/* ========================================== */}
            <div style={styles.requestSection}>
              <div style={styles.requestTitle}>📩 Request Enrollment</div>
              
              {/* Subject Selection */}
              {subjectList.length > 1 && (
                <select
                  style={styles.subjectSelect}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={isRequestDisabled}
                >
                  {subjectList.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              )}
              
              {/* Fee Display for Selected Subject */}
              {selectedSubject && (
                <div style={styles.subjectFeeDisplay}>
                  <span>💰 Monthly Fee for <strong>{selectedSubject}</strong></span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#4f46e5' }}>
                    {selectedFee ? `Rs. ${selectedFee}/month` : 'Fee not set'}
                  </span>
                </div>
              )}
              
              <textarea
                style={styles.messageInput}
                placeholder="Write a message to the teacher (optional)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                disabled={isRequestDisabled}
              />
              
              {requestStatus === 'pending' ? (
                <button style={styles.requestBtnAlready} disabled>
                  ⏳ Request Pending
                </button>
              ) : requestStatus === 'approved' ? (
                <button style={styles.requestBtnAlready} disabled>
                  ✅ Already Approved
                </button>
              ) : (
                <button
                  style={{
                    ...styles.requestBtn,
                    ...(sendingRequest ? styles.requestBtnDisabled : {})
                  }}
                  onClick={handleRequest}
                  disabled={sendingRequest}
                  onMouseEnter={(e) => {
                    if (!sendingRequest) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!sendingRequest) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.3)';
                    }
                  }}
                >
                  {sendingRequest ? '⏳ Sending...' : '📝 Request Enrollment'}
                </button>
              )}
              
              {selectedSubject && selectedFee && !isRequestDisabled && (
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                  💡 You will be enrolled for <strong>{selectedSubject}</strong> at <strong>Rs. {selectedFee}/month</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;