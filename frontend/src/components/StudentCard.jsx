// frontend/src/components/StudentCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentCard = ({ student, onViewProfile }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const breakdownLabels = {
    area: '📍 Area',
    subject: '📚 Subject',
    mode: '💻 Mode',
    budget: '💰 Budget',
    rating: '⭐ Rating'
  };

  // ✅ Handle view profile click with proper navigation
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
      return;
    }
    
    const studentId = student?.student_id || student?._id || student?.id;
    if (studentId) {
      console.log('📤 Navigating to student profile:', studentId);
      navigate(`/teacher/student-profile/${studentId}`);
    } else {
      console.error('❌ No student_id found:', student);
    }
  };

  // ✅ Get learning mode from database
  const getLearningModeDisplay = () => {
    const mode = student.learning_mode || student.student_learning_mode || '';
    if (mode === 'online') return '💻 Online';
    if (mode === 'physical') return '🏠 Physical';
    if (mode === 'both') return '💻 + 🏠 Both';
    return '💻 Online';
  };

  // ✅ Get name from database
  const displayName = student.name || student.student_name || 'Student';

  // ✅ Get subjects
  const getSubjects = () => {
    const subjects = student.subjects || student.student_subjects || [];
    if (!subjects || subjects.length === 0) return [];
    if (Array.isArray(subjects)) return subjects;
    if (typeof subjects === 'string') return subjects.split(',').map(s => s.trim());
    return [];
  };

  const subjectList = getSubjects();

  const styles = {
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative',
      overflow: 'hidden'
    },
    matchBadge: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '700',
      color: 'white',
      background: `linear-gradient(135deg, ${getMatchColor(student.match_score || 0)}, ${getMatchColor(student.match_score || 0)}dd)`,
      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    avatar: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
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
    info: {
      flex: 1
    },
    name: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    // ✅ Subjects as chips
    subjectsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '4px'
    },
    subjectChip: {
      background: '#e0e7ff',
      padding: '2px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#4f46e5',
      border: '1px solid #c7d2fe'
    },
    noSubjects: {
      fontSize: '13px',
      color: '#94a3b8',
      fontStyle: 'italic'
    },
    // ✅ Meta - Only show if data exists
    meta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      fontSize: '13px',
      color: '#555',
      padding: '8px 0',
      borderTop: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: '#f8fafc',
      padding: '2px 10px',
      borderRadius: '6px'
    },
    matchBreakdown: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '8px',
      padding: '12px 0',
      borderTop: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0'
    },
    breakdownItem: {
      textAlign: 'center'
    },
    breakdownLabel: {
      fontSize: '10px',
      color: '#94a3b8',
      fontWeight: '500',
      textTransform: 'uppercase'
    },
    breakdownScore: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    breakdownBar: {
      height: '4px',
      background: '#f0f0f0',
      borderRadius: '2px',
      marginTop: '2px',
      overflow: 'hidden'
    },
    breakdownFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.5s'
    },
    viewBtn: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    }
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
      }}
    >
      <div style={styles.matchBadge}>
        {student.match_score || 0}% Match
      </div>

      <div style={styles.header}>
        <div style={styles.avatar}>
          {student.profile_picture ? (
            <img src={student.profile_picture} alt={displayName} style={styles.avatarImage} />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div style={styles.info}>
          <div style={styles.name}>{displayName}</div>
          {/* ✅ Subjects as Chips */}
          <div style={styles.subjectsContainer}>
            {subjectList.length > 0 ? (
              subjectList.slice(0, 3).map((subject, idx) => (
                <span key={idx} style={styles.subjectChip}>
                  {subject}
                </span>
              ))
            ) : (
              <span style={styles.noSubjects}>No subjects</span>
            )}
            {subjectList.length > 3 && (
              <span style={styles.subjectChip}>+{subjectList.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Meta - Only show if data exists, NO "N/A" */}
      <div style={styles.meta}>
        {/* Learning Mode - Always show */}
        <span style={styles.metaItem}>{getLearningModeDisplay()}</span>
        
        {/* Location - Only show if exists */}
        {(student.location || student.student_location) && (
          <span style={styles.metaItem}>📍 {student.location || student.student_location}</span>
        )}
        
        {/* Education Level - Only show if exists, NO "N/A" */}
        {student.education_level && student.education_level !== 'N/A' && (
          <span style={styles.metaItem}>🎓 {student.education_level}</span>
        )}
      </div>

      {/* Match Breakdown */}
      {student.match_breakdown && (
        <div style={styles.matchBreakdown}>
          {Object.entries(student.match_breakdown).map(([key, value]) => {
            const score = value.score || 0;
            const max = value.max || 100;
            const percentage = Math.round((score / max) * 100);
            const color = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={key} style={styles.breakdownItem}>
                <div style={styles.breakdownLabel}>{breakdownLabels[key] || key}</div>
                <div style={styles.breakdownScore}>{percentage}%</div>
                <div style={styles.breakdownBar}>
                  <div style={{
                    ...styles.breakdownFill,
                    width: `${percentage}%`,
                    background: color
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        style={styles.viewBtn}
        onClick={handleViewProfile}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        👤 View Profile
      </button>
    </div>
  );
};

export default StudentCard;