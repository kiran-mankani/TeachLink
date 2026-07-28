// pages/student/StudentSessions.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';

const StudentSessions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sessions] = useState([
    { id: 1, subject: 'Mathematics', tutor: 'Ahmed Sir', date: '2026-06-25', time: '5:00 PM', mode: 'Online', status: 'Upcoming' },
    { id: 2, subject: 'Physics', tutor: 'Sara Teacher', date: '2026-06-26', time: '7:00 PM', mode: 'Physical', status: 'Upcoming' },
    { id: 3, subject: 'Chemistry', tutor: 'Dr. Ali', date: '2026-06-23', time: '3:00 PM', mode: 'Online', status: 'Completed' }
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [navigate]);

  const userName = user?.fullName || user?.username || 'Student';
  const userInitial = userName.charAt(0).toUpperCase();
  const role = user?.role || 'student';

  const getStatusStyle = (status) => {
    if (status === 'Upcoming') return { background: '#dbeafe', color: '#2563eb' };
    if (status === 'Completed') return { background: '#dcfce7', color: '#16a34a' };
    if (status === 'Cancelled') return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f1f5f9' },
    mainContent: { marginLeft: '260px', flex: 1, padding: '2rem', width: 'calc(100% - 260px)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    headerTitle: { fontSize: '1.8rem', color: '#0f172a', fontWeight: '700' },
    addBtn: { background: '#4f46e5', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', transition: 'background 0.3s' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' },
    td: { padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#0f172a' },
    statusBadge: { padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500', display: 'inline-block' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', color: '#64748b', transition: 'color 0.3s', fontSize: '1rem' },
    actionBtnEdit: { color: '#4f46e5' },
    actionBtnDelete: { color: '#ef4444' },
    emptyState: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
    emptyIcon: { fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 },
    emptyText: { fontSize: '1.1rem', color: '#475569' },
    emptySubtext: { fontSize: '0.9rem', color: '#94a3b8' }
  };

  return (
    <div style={styles.dashboard}>
      <Sidebar role={role} />
      <main style={styles.mainContent}>
        <TopBar userName={userName} userInitial={userInitial} notifications={0} />
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>📅 My Sessions</h1>
            <p style={{ color: '#64748b' }}>View and manage your scheduled sessions</p>
          </div>
          <button style={styles.addBtn}><FaPlus /> New Session</button>
        </div>

        <div style={styles.tableContainer}>
          {sessions.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Tutor</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td style={styles.td}><strong>{session.subject}</strong></td>
                    <td style={styles.td}>{session.tutor}</td>
                    <td style={styles.td}>{session.date}</td>
                    <td style={styles.td}>{session.time}</td>
                    <td style={styles.td}>
                      {session.mode === 'Online' ? <FaVideo style={{ color: '#4f46e5' }} /> : <FaMapMarkerAlt style={{ color: '#f59e0b' }} />} {session.mode}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...getStatusStyle(session.status) }}>{session.status}</span>
                    </td>
                    <td style={styles.td}>
                      <button style={{ ...styles.actionBtn, ...styles.actionBtnEdit }}><FaEdit /></button>
                      <button style={{ ...styles.actionBtn, ...styles.actionBtnDelete }}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📅</div>
              <p style={styles.emptyText}>No sessions scheduled</p>
              <p style={styles.emptySubtext}>Book a tutor to start your learning journey</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentSessions;