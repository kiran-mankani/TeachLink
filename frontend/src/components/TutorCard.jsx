import React from 'react';
import { useNavigate } from 'react-router-dom';

const TutorCard = ({ tutor, onRequestSent }) => {
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

  // ✅ FIX: Get teaching mode from database with proper display
  const getTeachingModeDisplay = (mode) => {
    if (!mode) return 'Online';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return 'Online';
    if (modeLower === 'physical') return 'Physical';
    if (modeLower === 'both') return 'Both';
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

  // ✅ FIX: Get name from database
  const displayName = tutor.name || tutor.teacher_name || 'Teacher';

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
      background: `linear-gradient(135deg, ${getMatchColor(tutor.match_score || 0)}, ${getMatchColor(tutor.match_score || 0)}dd)`,
      boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
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
    subjects: {
      fontSize: '14px',
      color: '#666'
    },
    meta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      fontSize: '13px',
      color: '#555'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: '#f8fafc',
      padding: '2px 10px',
      borderRadius: '6px'
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#f59e0b'
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
    btnGroup: {
      display: 'flex',
      gap: '10px'
    },
    viewBtn: {
      flex: 1,
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    requestBtn: {
      flex: 1,
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
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

  // ✅ Get teaching mode from database
  const teachingMode = tutor.teaching_mode || tutor.teacher_teaching_mode || 'online';
  const modeDisplay = getTeachingModeDisplay(teachingMode);
  const modeIcon = getTeachingModeIcon(teachingMode);

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
        {tutor.match_score || 0}% Match
      </div>

      <div style={styles.header}>
        <div style={styles.avatar}>
          {tutor.profile_picture ? (
            <img src={tutor.profile_picture} alt={displayName} style={styles.avatarImage} />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div style={styles.info}>
          <div style={styles.name}>{displayName}</div>
          <div style={styles.subjects}>
            {tutor.subjects?.join(' • ') || 'General'}
          </div>
        </div>
      </div>

      <div style={styles.meta}>
        <span style={styles.metaItem}>
          {modeIcon} {modeDisplay}
        </span>
        <span style={styles.metaItem}>📍 {tutor.location || tutor.teacher_location || 'N/A'}</span>
        {tutor.rating > 0 && (
          <span style={{...styles.metaItem, ...styles.rating}}>
            ⭐ {tutor.rating.toFixed(1)}
          </span>
        )}
        <span style={styles.metaItem}>💰 {tutor.fee_range || 'N/A'}</span>
      </div>

      {/* Match Breakdown */}
      {tutor.match_breakdown && (
        <div style={styles.matchBreakdown}>
          {Object.entries(tutor.match_breakdown).map(([key, value]) => {
            const score = value.score || 0;
            const max = value.max || 100;
            const percentage = Math.round((score / max) * 100);
            const color = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444';
            
            const labels = {
              area: '📍 Area',
              subject: '📚 Subject',
              mode: '💻 Mode',
              budget: '💰 Budget',
              rating: '⭐ Rating'
            };
            
            return (
              <div key={key} style={styles.breakdownItem}>
                <div style={styles.breakdownLabel}>{labels[key] || key}</div>
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

      <div style={styles.btnGroup}>
        <button
          style={styles.viewBtn}
          onClick={() => navigate(`/teacher-profile/${tutor.teacher_id || tutor.id}`)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          👤 View Profile
        </button>
        <button
          style={styles.requestBtn}
          onClick={() => {
            if (onRequestSent) onRequestSent(tutor);
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          📝 Request
        </button>
      </div>
    </div>
  );
};

export default TutorCard;