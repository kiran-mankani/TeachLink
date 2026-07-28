// frontend/src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Database,
  HardDrive,
  Lock,
  Key,
  LogOut,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Edit,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Server,
  Cpu,
  Clock,
  Calendar,
  Smartphone,
  MessageSquare,
  FileText,
  Users,
  CreditCard,
  Activity,
  Zap
} from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin Profile
  const [adminProfile, setAdminProfile] = useState({
    name: '',
    email: '',
    role: 'Admin',
    lastLogin: '',
    profilePicture: ''
  });

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'TeachLink',
    supportEmail: 'support@teachlink.com',
    supportPhone: '+92 300 1234567',
    platformLogo: '',
    maintenanceMode: false,
    registrationEnabled: true
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    commission: 10,
    minPayment: 500,
    maxPayment: 50000,
    autoApprove: false,
    requireAdminApproval: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    paymentAlerts: true,
    enrollmentAlerts: true,
    attendanceAlerts: true,
    systemAlerts: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    twoFactorAuth: false,
    maxLoginAttempts: 5,
    autoLogout: true
  });

  // AI Settings
  const [aiSettings, setAiSettings] = useState({
    aiMatching: true,
    aiChatFilter: true,
    aiRecommendations: true,
    aiNotifications: true
  });

  // Database Info
  const [dbInfo, setDbInfo] = useState({
    status: 'Connected',
    serverStatus: 'Running',
    mongoDB: 'MongoDB Atlas',
    lastBackup: '2026-07-18 03:00 AM',
    storageUsed: '2.4 GB / 10 GB'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Placeholder - Will connect to real backend
      setAdminProfile({
        name: user?.name || 'Admin',
        email: user?.email || 'admin@teachlink.com',
        role: 'Admin',
        lastLogin: new Date().toLocaleString(),
        profilePicture: user?.profilePicture || ''
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSaveSettings = async (section) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Placeholder API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`${section} settings updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (setter, field, value) => {
    setter(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (setter, field, value) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  const handleDangerAction = (action) => {
    if (!window.confirm(`Are you sure you want to ${action}? This action cannot be undone.`)) return;
    alert(`✅ ${action} completed successfully!`);
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sections = [
    { id: 'profile', label: '👤 Profile', icon: User },
    { id: 'platform', label: '⚙️ Platform', icon: Globe },
    { id: 'payment', label: '💰 Payment', icon: DollarSign },
    { id: 'notifications', label: '🔔 Notifications', icon: Bell },
    { id: 'security', label: '🔒 Security', icon: Shield },
    { id: 'ai', label: '🤖 AI Settings', icon: Cpu },
    { id: 'database', label: '🗄️ Database', icon: Database },
    { id: 'backup', label: '💾 Backup', icon: HardDrive },
    { id: 'danger', label: '⚠️ Danger Zone', icon: AlertTriangle }
  ];

  const styles = {
    container: {
      padding: '0',
      maxWidth: '100%',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px',
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      margin: 0,
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px',
    },
    layout: {
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start',
    },
    sidebar: {
      width: '220px',
      flexShrink: 0,
      position: 'sticky',
      top: '20px',
    },
    sidebarNav: {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      padding: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '13px',
      color: '#475569',
      width: '100%',
      border: 'none',
      background: 'none',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    sidebarItemActive: {
      background: '#eff6ff',
      color: '#3b82f6',
      fontWeight: '500',
    },
    sidebarIcon: {
      width: '18px',
      height: '18px',
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      marginBottom: '24px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    cardSubtitle: {
      fontSize: '13px',
      color: '#94a3b8',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#1f1f3e',
      marginBottom: '4px',
    },
    labelSub: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '400',
      marginLeft: '4px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      transition: 'all 0.3s',
      backgroundColor: '#fafaff',
    },
    inputReadonly: {
      backgroundColor: '#f1f5f9',
      cursor: 'not-allowed',
      color: '#64748b',
    },
    inputWithIcon: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#94a3b8',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },
    row3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
    },
    toggleWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f0f0f0',
    },
    toggleLabel: {
      fontSize: '14px',
      color: '#1f1f3e',
    },
    toggleDesc: {
      fontSize: '12px',
      color: '#94a3b8',
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      color: '#94a3b8',
      transition: 'all 0.3s',
    },
    toggleActive: {
      color: '#3b82f6',
    },
    saveBtn: {
      padding: '10px 28px',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    saveBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    // Danger Zone
    dangerZone: {
      border: '2px solid #fecaca',
      background: '#fef2f2',
    },
    dangerTitle: {
      color: '#b91c1c',
    },
    dangerBtn: {
      padding: '8px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    // DB Info
    dbGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
    },
    dbItem: {
      background: '#f8fafc',
      padding: '14px 16px',
      borderRadius: '10px',
      border: '1px solid #f0f0f0',
    },
    dbLabel: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    dbValue: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginTop: '4px',
    },
    // Backup Buttons
    backupGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
    },
    backupBtn: {
      padding: '12px 20px',
      background: 'white',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center',
      color: '#1f1f3e',
    },
    backupBtnPrimary: {
      background: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6',
    },
    // Profile Avatar
    profileAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden',
      marginBottom: '12px',
    },
    profileAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f1f3e',
    },
    profileRole: {
      fontSize: '14px',
      color: '#94a3b8',
    },
    successMsg: {
      padding: '10px 16px',
      background: '#dcfce7',
      color: '#15803d',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
      border: '1px solid #86efac',
    },
    errorMsg: {
      padding: '10px 16px',
      background: '#fee2e2',
      color: '#b91c1c',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
      border: '1px solid #fca5a5',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '40px' }}>⚙️</div>
          <div>Loading settings...</div>
        </div>
      </div>
    );
  }

  const renderProfileSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <User size={20} color="#3b82f6" /> Admin Profile
      </div>
      <div style={styles.cardSubtitle}>Manage your admin account details.</div>

      <div style={styles.profileHeader}>
        <div style={styles.profileAvatar}>
          {adminProfile.profilePicture ? (
            <img src={adminProfile.profilePicture} alt="Admin" style={styles.profileAvatarImage} />
          ) : (
            getInitials(adminProfile.name)
          )}
        </div>
        <div style={styles.profileInfo}>
          <div style={styles.profileName}>{adminProfile.name}</div>
          <div style={styles.profileRole}>{adminProfile.role} • {adminProfile.email}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Last Login: {adminProfile.lastLogin}
          </div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            style={styles.input}
            value={adminProfile.name}
            onChange={(e) => handleInputChange(setAdminProfile, 'name', e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            style={{...styles.input, ...styles.inputReadonly}}
            value={adminProfile.email}
            disabled
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Role</label>
          <input
            type="text"
            style={{...styles.input, ...styles.inputReadonly}}
            value={adminProfile.role}
            disabled
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Change Password</label>
          <div style={styles.inputWithIcon}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={styles.input}
              placeholder="Enter new password"
              value=""
              disabled
            />
            <span style={styles.inputIcon} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>
      </div>

      <button
        style={styles.saveBtn}
        onClick={() => handleSaveSettings('Profile')}
        disabled={saving}
      >
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Update Profile'}
      </button>
    </div>
  );

  const renderPlatformSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <Globe size={20} color="#3b82f6" /> Platform Settings
      </div>
      <div style={styles.cardSubtitle}>Configure platform-wide settings.</div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Platform Name</label>
          <input
            type="text"
            style={styles.input}
            value={platformSettings.platformName}
            onChange={(e) => handleInputChange(setPlatformSettings, 'platformName', e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Support Email</label>
          <input
            type="email"
            style={styles.input}
            value={platformSettings.supportEmail}
            onChange={(e) => handleInputChange(setPlatformSettings, 'supportEmail', e.target.value)}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Support Phone</label>
          <input
            type="text"
            style={styles.input}
            value={platformSettings.supportPhone}
            onChange={(e) => handleInputChange(setPlatformSettings, 'supportPhone', e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Platform Logo URL</label>
          <input
            type="text"
            style={styles.input}
            value={platformSettings.platformLogo}
            onChange={(e) => handleInputChange(setPlatformSettings, 'platformLogo', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>Maintenance Mode</div>
          <div style={styles.toggleDesc}>Put the platform in maintenance mode</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(platformSettings.maintenanceMode ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setPlatformSettings, 'maintenanceMode')}
        >
          {platformSettings.maintenanceMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>Registration Enabled</div>
          <div style={styles.toggleDesc}>Allow new users to register</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(platformSettings.registrationEnabled ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setPlatformSettings, 'registrationEnabled')}
        >
          {platformSettings.registrationEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('Platform')} disabled={saving}>
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );

  const renderPaymentSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <DollarSign size={20} color="#3b82f6" /> Payment Settings
      </div>
      <div style={styles.cardSubtitle}>Configure payment and commission settings.</div>

      <div style={styles.row3}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Commission %</label>
          <input
            type="number"
            style={styles.input}
            value={paymentSettings.commission}
            onChange={(e) => handleInputChange(setPaymentSettings, 'commission', parseInt(e.target.value))}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Min Payment (Rs.)</label>
          <input
            type="number"
            style={styles.input}
            value={paymentSettings.minPayment}
            onChange={(e) => handleInputChange(setPaymentSettings, 'minPayment', parseInt(e.target.value))}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Max Payment (Rs.)</label>
          <input
            type="number"
            style={styles.input}
            value={paymentSettings.maxPayment}
            onChange={(e) => handleInputChange(setPaymentSettings, 'maxPayment', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>Auto Approve Payments</div>
          <div style={styles.toggleDesc}>Automatically approve payments</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(paymentSettings.autoApprove ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setPaymentSettings, 'autoApprove')}
        >
          {paymentSettings.autoApprove ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>Require Admin Approval</div>
          <div style={styles.toggleDesc}>Payments need admin approval</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(paymentSettings.requireAdminApproval ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setPaymentSettings, 'requireAdminApproval')}
        >
          {paymentSettings.requireAdminApproval ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('Payment')} disabled={saving}>
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );

  const renderNotificationSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <Bell size={20} color="#3b82f6" /> Notification Settings
      </div>
      <div style={styles.cardSubtitle}>Configure notification preferences.</div>

      {Object.entries(notificationSettings).map(([key, value]) => (
        <div key={key} style={styles.toggleWrapper}>
          <div>
            <div style={styles.toggleLabel}>
              {key === 'emailNotifications' && '📧 Email Notifications'}
              {key === 'pushNotifications' && '📱 Push Notifications'}
              {key === 'paymentAlerts' && '💰 Payment Alerts'}
              {key === 'enrollmentAlerts' && '📚 Enrollment Alerts'}
              {key === 'attendanceAlerts' && '📋 Attendance Alerts'}
              {key === 'systemAlerts' && '⚙️ System Alerts'}
            </div>
            <div style={styles.toggleDesc}>
              {key === 'emailNotifications' && 'Send notifications via email'}
              {key === 'pushNotifications' && 'Send push notifications'}
              {key === 'paymentAlerts' && 'Alert for payment activities'}
              {key === 'enrollmentAlerts' && 'Alert for enrollment activities'}
              {key === 'attendanceAlerts' && 'Alert for attendance activities'}
              {key === 'systemAlerts' && 'Alert for system events'}
            </div>
          </div>
          <button
            style={{...styles.toggleBtn, ...(value ? styles.toggleActive : {})}}
            onClick={() => handleToggle(setNotificationSettings, key)}
          >
            {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      ))}

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('Notification')} disabled={saving}>
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );

  const renderSecuritySection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <Shield size={20} color="#3b82f6" /> Security Settings
      </div>
      <div style={styles.cardSubtitle}>Configure security and authentication settings.</div>

      <div style={styles.row3}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Session Timeout (mins)</label>
          <input
            type="number"
            style={styles.input}
            value={securitySettings.sessionTimeout}
            onChange={(e) => handleInputChange(setSecuritySettings, 'sessionTimeout', parseInt(e.target.value))}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password Min Length</label>
          <input
            type="number"
            style={styles.input}
            value={securitySettings.passwordMinLength}
            onChange={(e) => handleInputChange(setSecuritySettings, 'passwordMinLength', parseInt(e.target.value))}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Max Login Attempts</label>
          <input
            type="number"
            style={styles.input}
            value={securitySettings.maxLoginAttempts}
            onChange={(e) => handleInputChange(setSecuritySettings, 'maxLoginAttempts', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>🔐 Two Factor Authentication</div>
          <div style={styles.toggleDesc}>Require 2FA for admin accounts</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(securitySettings.twoFactorAuth ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setSecuritySettings, 'twoFactorAuth')}
        >
          {securitySettings.twoFactorAuth ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <div style={styles.toggleWrapper}>
        <div>
          <div style={styles.toggleLabel}>⏰ Auto Logout</div>
          <div style={styles.toggleDesc}>Auto logout after idle session</div>
        </div>
        <button
          style={{...styles.toggleBtn, ...(securitySettings.autoLogout ? styles.toggleActive : {})}}
          onClick={() => handleToggle(setSecuritySettings, 'autoLogout')}
        >
          {securitySettings.autoLogout ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('Security')} disabled={saving}>
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );

  const renderAISection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <Cpu size={20} color="#3b82f6" /> AI Settings
      </div>
      <div style={styles.cardSubtitle}>Configure AI and recommendation settings.</div>

      {Object.entries(aiSettings).map(([key, value]) => (
        <div key={key} style={styles.toggleWrapper}>
          <div>
            <div style={styles.toggleLabel}>
              {key === 'aiMatching' && '🤖 AI Matching'}
              {key === 'aiChatFilter' && '🔒 AI Chat Filter'}
              {key === 'aiRecommendations' && '📊 AI Recommendations'}
              {key === 'aiNotifications' && '🔔 AI Notifications'}
            </div>
            <div style={styles.toggleDesc}>
              {key === 'aiMatching' && 'Enable AI student-teacher matching'}
              {key === 'aiChatFilter' && 'Filter inappropriate chat content'}
              {key === 'aiRecommendations' && 'Show AI recommended content'}
              {key === 'aiNotifications' && 'Send AI-generated notifications'}
            </div>
          </div>
          <button
            style={{...styles.toggleBtn, ...(value ? styles.toggleActive : {})}}
            onClick={() => handleToggle(setAiSettings, key)}
          >
            {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      ))}

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('AI')} disabled={saving}>
        <Save size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );

  const renderDatabaseSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <Database size={20} color="#3b82f6" /> Database Information
      </div>
      <div style={styles.cardSubtitle}>View system database status and information.</div>

      <div style={styles.dbGrid}>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>Database Status</div>
          <div style={{...styles.dbValue, color: '#22c55e' }}>✅ {dbInfo.status}</div>
        </div>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>Server Status</div>
          <div style={{...styles.dbValue, color: '#22c55e' }}>✅ {dbInfo.serverStatus}</div>
        </div>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>MongoDB</div>
          <div style={styles.dbValue}>{dbInfo.mongoDB}</div>
        </div>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>Last Backup</div>
          <div style={styles.dbValue}>{dbInfo.lastBackup}</div>
        </div>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>Storage Used</div>
          <div style={styles.dbValue}>{dbInfo.storageUsed}</div>
        </div>
        <div style={styles.dbItem}>
          <div style={styles.dbLabel}>Connection Pool</div>
          <div style={styles.dbValue}>15 / 20</div>
        </div>
      </div>

      <button style={styles.saveBtn} onClick={() => handleSaveSettings('Database')} disabled={saving}>
        <RefreshCw size={16} style={{ marginRight: '6px' }} />
        {saving ? 'Refreshing...' : 'Refresh Status'}
      </button>
    </div>
  );

  const renderBackupSection = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <HardDrive size={20} color="#3b82f6" /> Backup
      </div>
      <div style={styles.cardSubtitle}>Create, restore and manage system backups.</div>

      <div style={styles.backupGrid}>
        <button
          style={{...styles.backupBtn, ...styles.backupBtnPrimary}}
          onClick={() => alert('✅ Creating backup...')}
        >
          <Download size={18} /> Create Backup
        </button>
        <button style={styles.backupBtn} onClick={() => alert('📂 Choose backup file to restore...')}>
          <Upload size={18} /> Restore Backup
        </button>
        <button style={styles.backupBtn} onClick={() => alert('📥 Downloading latest backup...')}>
          <Download size={18} /> Download Backup
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
        Last backup: {dbInfo.lastBackup}
      </div>
    </div>
  );

  const renderDangerSection = () => (
    <div style={{...styles.card, ...styles.dangerZone}}>
      <div style={{...styles.cardTitle, ...styles.dangerTitle}}>
        <AlertTriangle size={20} /> Danger Zone
      </div>
      <div style={styles.cardSubtitle}>Actions here are irreversible. Proceed with caution.</div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button style={styles.dangerBtn} onClick={() => handleDangerAction('Clear Cache')}>
          <Trash2 size={14} style={{ marginRight: '4px' }} /> Clear Cache
        </button>
        <button style={styles.dangerBtn} onClick={() => handleDangerAction('Reset Notifications')}>
          <Bell size={14} style={{ marginRight: '4px' }} /> Reset Notifications
        </button>
        <button style={styles.dangerBtn} onClick={() => handleDangerAction('Delete Logs')}>
          <FileText size={14} style={{ marginRight: '4px' }} /> Delete Logs
        </button>
        <button style={styles.dangerBtn} onClick={() => handleDangerAction('Clear System Cache')}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Clear System Cache
        </button>
      </div>

      <div style={{ marginTop: '16px', fontSize: '13px', color: '#b91c1c' }}>
        ⚠️ These actions cannot be undone. Please confirm before proceeding.
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'platform': return renderPlatformSection();
      case 'payment': return renderPaymentSection();
      case 'notifications': return renderNotificationSection();
      case 'security': return renderSecuritySection();
      case 'ai': return renderAISection();
      case 'database': return renderDatabaseSection();
      case 'backup': return renderBackupSection();
      case 'danger': return renderDangerSection();
      default: return renderProfileSection();
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>⚙️ Admin Settings</h1>
          <p style={styles.subtitle}>Manage system configuration and platform settings.</p>
        </div>
      </div>

      {error && <div style={styles.errorMsg}>❌ {error}</div>}
      {success && <div style={styles.successMsg}>✅ {success}</div>}

      {/* Layout */}
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarNav}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  style={{
                    ...styles.sidebarItem,
                    ...(isActive ? styles.sidebarItemActive : {})
                  }}
                  onClick={() => setActiveSection(section.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'none';
                    }
                  }}
                >
                  <Icon style={styles.sidebarIcon} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {renderContent()}
        </div>
      </div>

    </div>
  );
};

export default AdminSettings;