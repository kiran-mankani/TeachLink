// pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaLock, FaTrash, FaArrowLeft, FaSave, FaShieldAlt, FaGlobe, FaMoon, FaSun } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [navigate]);

  const userName = user?.fullName || user?.username || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const role = user?.role || 'student';

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f1f5f9' },
    mainContent: { marginLeft: '260px', flex: 1, padding: '2rem', width: 'calc(100% - 260px)' },
    settingsCard: { background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f0f0f0' },
    title: { fontSize: '1.8rem', color: '#0f172a', margin: 0, fontWeight: '700' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' },
    tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', transition: 'all 0.3s' },
    tabActive: { background: '#4f46e5', color: 'white' },
    section: { padding: '1.5rem 0' },
    sectionTitle: { fontSize: '1.3rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '600' },
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '500' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' },
    btnPrimary: { background: '#4f46e5', color: 'white', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.3s' },
    btnDanger: { background: '#ef4444', color: 'white', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.3s' },
    checkbox: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' },
    dangerZone: { marginTop: '2rem', padding: '1.5rem', border: '2px solid #fee2e2', borderRadius: '8px', background: '#fef2f2' },
    dangerTitle: { color: '#dc2626', marginBottom: '1rem' },
    dangerText: { color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }
  };

  return (
    <div style={styles.dashboard}>
      <Sidebar role={role} />
      <main style={styles.mainContent}>
        <TopBar userName={userName} userInitial={userInitial} notifications={0} pageTitle="Settings" />
        <div style={styles.settingsCard}>
          <div style={styles.header}>
            <h2 style={styles.title}>⚙️ Settings</h2>
          </div>

          <div style={styles.tabs}>
            <button style={{...styles.tab, ...(activeTab === 'account' ? styles.tabActive : {})}} onClick={() => setActiveTab('account')}>
              <FaUser /> Account
            </button>
            <button style={{...styles.tab, ...(activeTab === 'notifications' ? styles.tabActive : {})}} onClick={() => setActiveTab('notifications')}>
              <FaBell /> Notifications
            </button>
            <button style={{...styles.tab, ...(activeTab === 'privacy' ? styles.tabActive : {})}} onClick={() => setActiveTab('privacy')}>
              <FaLock /> Privacy
            </button>
            <button style={{...styles.tab, ...(activeTab === 'appearance' ? styles.tabActive : {})}} onClick={() => setActiveTab('appearance')}>
              <FaMoon /> Appearance
            </button>
          </div>

          <div style={styles.section}>
            {activeTab === 'account' && (
              <div>
                <h3 style={styles.sectionTitle}>Account Settings</h3>
                <form>
                  <div style={styles.formGroup}><label style={styles.label}>Full Name</label><input type="text" style={styles.input} value={userName} /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Email</label><input type="email" style={styles.input} value={user?.email || ''} /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Current Password</label><input type="password" style={styles.input} placeholder="Enter current password" /></div>
                  <div style={styles.formGroup}><label style={styles.label}>New Password</label><input type="password" style={styles.input} placeholder="Enter new password" /></div>
                  <button style={styles.btnPrimary}><FaSave /> Update Account</button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={styles.sectionTitle}>Notification Preferences</h3>
                <div>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Email Notifications</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Session Reminders</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Payment Updates</label>
                  <label style={styles.checkbox}><input type="checkbox" /> New Messages</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Promotional Emails</label>
                </div>
                <button style={styles.btnPrimary} style={{ marginTop: '1rem' }}><FaSave /> Save Preferences</button>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h3 style={styles.sectionTitle}>Privacy & Security</h3>
                <div>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Show my profile to other users</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Show my location</label>
                  <label style={styles.checkbox}><input type="checkbox" /> Show my email address</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Allow messages from verified users</label>
                </div>
                <div style={styles.dangerZone}>
                  <h4 style={styles.dangerTitle}>Danger Zone</h4>
                  <button style={styles.btnDanger}><FaTrash /> Delete Account</button>
                  <p style={styles.dangerText}>This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h3 style={styles.sectionTitle}>Appearance</h3>
                <div>
                  <label style={styles.checkbox}><input type="checkbox" /> Dark Mode</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Compact View</label>
                  <label style={styles.checkbox}><input type="checkbox" defaultChecked /> Animations</label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Language</label>
                  <select style={styles.input}>
                    <option>English</option>
                    <option>Urdu</option>
                    <option>Arabic</option>
                  </select>
                </div>
                <button style={styles.btnPrimary}><FaSave /> Save Preferences</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;