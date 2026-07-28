// frontend/src/components/ProfileCompletionBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileCompletionBanner = ({ percentage, role, onComplete }) => {
  const navigate = useNavigate();

  const getMessage = () => {
    if (percentage >= 98) {
      return {
        title: '🎉 Your profile is complete!',
        subtitle: 'You can now access all TeachLink features.',
        color: '#4caf50'
      };
    } else if (percentage >= 60) {
      return {
        title: '📝 Almost there!',
        subtitle: `Your profile is ${percentage}% complete. Add optional details to reach 100%.`,
        color: '#ff9800'
      };
    } else {
      return {
        title: '⚠️ Complete your profile',
        subtitle: `Your profile is only ${percentage}% complete. Complete it to unlock all features.`,
        color: '#f44336'
      };
    }
  };

  const message = getMessage();
  const isComplete = percentage >= 98;

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/complete-profile');
    }
  };

  const styles = {
    container: {
      background: `linear-gradient(135deg, ${message.color}15, ${message.color}08)`,
      border: `2px solid ${message.color}40`,
      borderRadius: '16px',
      padding: '20px 25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      marginBottom: '25px',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif"
    },
    left: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flexWrap: 'wrap'
    },
    progressCircle: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: `conic-gradient(${message.color} ${percentage}%, #e8e8e8 ${percentage}%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexShrink: 0
    },
    progressInner: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    info: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    title: {
      fontSize: '17px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    subtitle: {
      fontSize: '14px',
      color: '#666'
    },
    button: {
      padding: '10px 24px',
      background: `linear-gradient(135deg, ${message.color}, ${message.color}dd)`,
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: `0 4px 15px ${message.color}40`,
      fontFamily: 'inherit',
      whiteSpace: 'nowrap'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.progressCircle}>
          <div style={styles.progressInner}>{percentage}%</div>
        </div>
        <div style={styles.info}>
          <div style={styles.title}>{message.title}</div>
          <div style={styles.subtitle}>{message.subtitle}</div>
        </div>
      </div>
      {!isComplete && (
        <button 
          style={styles.button}
          onClick={handleComplete}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Complete Profile →
        </button>
      )}
    </div>
  );
};

export default ProfileCompletionBanner;