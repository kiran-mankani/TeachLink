// frontend/src/components/ChatLocked.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChatLocked = ({ enrollmentId, studentName, teacherName, subject, fee }) => {
  const navigate = useNavigate();

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      borderRadius: '16px',
      padding: '30px',
      textAlign: 'center',
      border: '2px solid #f59e0b',
      maxWidth: '500px',
      margin: '20px auto'
    },
    icon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#92400e',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#78350f',
      marginBottom: '20px'
    },
    details: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px',
      textAlign: 'left'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: '14px',
      borderBottom: '1px solid #f0f0f0'
    },
    detailLabel: {
      color: '#94a3b8'
    },
    detailValue: {
      fontWeight: '600',
      color: '#1f1f3e'
    },
    payBtn: {
      padding: '14px 40px',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
    }
  };

  const handlePay = () => {
    navigate(`/student/payments/${enrollmentId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>🔒</div>
      <div style={styles.title}>Chat Locked</div>
      <div style={styles.subtitle}>
        Payment required before chat is unlocked.
      </div>
      
      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Teacher</span>
          <span style={styles.detailValue}>{teacherName || 'Teacher'}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Subject</span>
          <span style={styles.detailValue}>{subject || 'General'}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Fee</span>
          <span style={styles.detailValue}>Rs. {fee || '3000'}/month</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Status</span>
          <span style={styles.detailValue}>🔴 Pending</span>
        </div>
      </div>

      <button
        style={styles.payBtn}
        onClick={handlePay}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
        }}
      >
        💳 Proceed to Payment
      </button>
    </div>
  );
};

export default ChatLocked;