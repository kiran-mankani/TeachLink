import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';


const TeacherSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    emailNotifications: true
  });

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher/settings' } });
  };

  const handleChangePassword = async () => {
    const oldPassword = prompt('Enter old password:');
    if (!oldPassword) return;
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Password changed successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('❌ ' + (data.error || 'Failed to change password'));
      }
    } catch (err) {
      setError('❌ Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage(`✅ ${key} updated successfully`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('⚠️ Are you sure? This action cannot be undone!')) {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          await logout();
          navigate('/login');
        } else {
          setError('❌ ' + (data.error || 'Failed to delete account'));
        }
      } catch (err) {
        setError('❌ Error deleting account');
      } finally {
        setLoading(false);
      }
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
      marginBottom: '30px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e'
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px'
    },
    settingsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '20px'
    },
    settingCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px 28px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    settingTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f0f0f0'
    },
    settingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #f8fafc'
    },
    settingLabel: {
      fontSize: '14px',
      color: '#475569'
    },
    toggleBtn: {
      width: '48px',
      height: '26px',
      borderRadius: '13px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s',
      position: 'relative'
    },
    toggleOn: {
      background: '#3b82f6'
    },
    toggleOff: {
      background: '#cbd5e1'
    },
    toggleKnob: (isOn) => ({
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: 'white',
      position: 'absolute',
      top: '3px',
      left: isOn ? '25px' : '3px',
      transition: 'all 0.3s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }),
    actionBtn: {
      padding: '10px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: 'none',
      fontFamily: 'inherit',
      width: '100%',
      marginTop: '8px'
    },
    primaryBtn: {
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white'
    },
    dangerBtn: {
      background: '#ef4444',
      color: 'white'
    },
    logoutBtn: {
      background: 'white',
      color: '#ef4444',
      border: '2px solid #ef4444'
    },
    messageSuccess: {
      padding: '12px 16px',
      background: '#dcfce7',
      color: '#15803d',
      borderRadius: '8px',
      marginBottom: '16px'
    },
    messageError: {
      padding: '12px 16px',
      background: '#fee2e2',
      color: '#b91c1c',
      borderRadius: '8px',
      marginBottom: '16px'
    }
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
            <h1 style={styles.title}>⚙️ Settings</h1>
            <p style={styles.subtitle}>Manage your account preferences</p>
          </div>

          {message && <div style={styles.messageSuccess}>{message}</div>}
          {error && <div style={styles.messageError}>{error}</div>}

          <div style={styles.settingsGrid}>
            {/* Security Card */}
            <div style={styles.settingCard}>
              <div style={styles.settingTitle}>🔒 Security</div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Change Password</span>
                <button
                  style={{
                    ...styles.actionBtn,
                    ...styles.primaryBtn,
                    width: 'auto',
                    padding: '6px 16px',
                    fontSize: '13px',
                    marginTop: 0
                  }}
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? '⏳' : 'Update'}
                </button>
              </div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Two-Factor Authentication</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Coming Soon</span>
              </div>
            </div>

            {/* Notifications Card */}
            <div style={styles.settingCard}>
              <div style={styles.settingTitle}>🔔 Notifications</div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Push Notifications</span>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(settings.notifications ? styles.toggleOn : styles.toggleOff)
                  }}
                  onClick={() => handleToggle('notifications')}
                >
                  <div style={styles.toggleKnob(settings.notifications)} />
                </button>
              </div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Email Notifications</span>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(settings.emailNotifications ? styles.toggleOn : styles.toggleOff)
                  }}
                  onClick={() => handleToggle('emailNotifications')}
                >
                  <div style={styles.toggleKnob(settings.emailNotifications)} />
                </button>
              </div>
            </div>

            {/* Appearance Card */}
            <div style={styles.settingCard}>
              <div style={styles.settingTitle}>🎨 Appearance</div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Dark Mode</span>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(settings.darkMode ? styles.toggleOn : styles.toggleOff)
                  }}
                  onClick={() => handleToggle('darkMode')}
                >
                  <div style={styles.toggleKnob(settings.darkMode)} />
                </button>
              </div>
            </div>

            {/* Account Card */}
            <div style={styles.settingCard}>
              <div style={styles.settingTitle}>👤 Account</div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Name</span>
                <span style={{ fontSize: '14px', color: '#1f1f3e', fontWeight: '500' }}>
                  {user?.name || 'Teacher'}
                </span>
              </div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Email</span>
                <span style={{ fontSize: '14px', color: '#1f1f3e', fontWeight: '500' }}>
                  {user?.email || 'N/A'}
                </span>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  style={{ ...styles.actionBtn, ...styles.logoutBtn }}
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
                <button
                  style={{ ...styles.actionBtn, ...styles.dangerBtn }}
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? '⏳...' : '🗑️ Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;