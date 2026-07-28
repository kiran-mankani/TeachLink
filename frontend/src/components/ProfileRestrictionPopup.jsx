import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileRestrictionPopup = ({ isOpen, onClose, role, missingFields, onCompleteProfile }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCompleteProfile = () => {
    onClose();
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      navigate('/complete-profile');
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif"
    },
    popup: {
      background: 'white',
      borderRadius: '24px',
      maxWidth: '500px',
      width: '100%',
      padding: '40px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.3s ease',
      position: 'relative'
    },
    icon: {
      fontSize: '48px',
      textAlign: 'center',
      marginBottom: '15px'
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1f1f3e',
      textAlign: 'center',
      marginBottom: '10px'
    },
    description: {
      fontSize: '15px',
      color: '#666',
      textAlign: 'center',
      lineHeight: '1.6',
      marginBottom: '20px'
    },
    fieldsList: {
      background: '#f8f9ff',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px'
    },
    fieldItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 0',
      fontSize: '14px',
      color: '#333'
    },
    fieldIcon: {
      color: '#f44336',
      fontSize: '18px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '10px'
    },
    primaryBtn: {
      flex: 1,
      padding: '14px',
      background: 'linear-gradient(135deg, #4a3aff, #6c5ce7)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    secondaryBtn: {
      flex: 1,
      padding: '14px',
      background: 'white',
      color: '#4a3aff',
      border: '2px solid #4a3aff',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    closeBtn: {
      position: 'absolute',
      top: '15px',
      right: '20px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#999',
      padding: '0 8px'
    }
  };

  const getRoleLabel = () => {
    return role === 'student' ? 'Student' : 'Teacher';
  };

  const getTitle = () => {
    if (missingFields.length === 0) {
      return `📝 Complete Your ${getRoleLabel()} Profile`;
    }
    return `⚠️ Complete Your ${getRoleLabel()} Profile`;
  };

  const getDescription = () => {
    if (missingFields.length === 0) {
      return `Please complete your profile to access all TeachLink features.`;
    }
    return `You're missing the following fields. Please complete your profile to access this feature.`;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div style={styles.icon}>🔒</div>
        <h3 style={styles.title}>{getTitle()}</h3>
        <p style={styles.description}>{getDescription()}</p>

        {missingFields.length > 0 && (
          <div style={styles.fieldsList}>
            {missingFields.map((field, index) => (
              <div key={index} style={styles.fieldItem}>
                <span style={styles.fieldIcon}>✗</span>
                <span>{field}</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button style={styles.secondaryBtn} onClick={onClose}>
            Later
          </button>
          <button style={styles.primaryBtn} onClick={handleCompleteProfile}>
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileRestrictionPopup;