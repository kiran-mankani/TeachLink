// pages/teacher/TeacherReviews.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';

const TeacherReviews = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews] = useState([
    { id: 1, student: 'Ahmed Khan', subject: 'Mathematics', rating: 5, comment: 'Excellent teacher! Very clear concepts.', date: '2026-06-20' },
    { id: 2, student: 'Sara Ali', subject: 'Physics', rating: 4, comment: 'Good teaching style.', date: '2026-06-18' }
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [navigate]);

  const userName = user?.fullName || user?.username || 'Teacher';
  const userInitial = userName.charAt(0).toUpperCase();
  const role = user?.role || 'teacher';

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} color={i < rating ? '#f59e0b' : '#d1d5db'} />
    ));
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
    reviewCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1rem' },
    reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
    reviewStudent: { fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' },
    reviewSubject: { fontSize: '0.85rem', color: '#64748b' },
    reviewStars: { marginBottom: '0.5rem' },
    reviewComment: { color: '#475569', marginBottom: '0.5rem' },
    reviewDate: { fontSize: '0.8rem', color: '#94a3b8' },
    emptyState: { textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '16px' },
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
            <h1 style={styles.headerTitle}>⭐ Reviews</h1>
            <p style={{ color: '#64748b' }}>See what your students say about you</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div>
                  <div style={styles.reviewStudent}>{review.student}</div>
                  <div style={styles.reviewSubject}>{review.subject}</div>
                </div>
              </div>
              <div style={styles.reviewStars}>{renderStars(review.rating)}</div>
              <p style={styles.reviewComment}>{review.comment}</p>
              <span style={styles.reviewDate}>{review.date}</span>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⭐</div>
            <p style={styles.emptyText}>No reviews yet</p>
            <p style={styles.emptySubtext}>Student reviews will appear here</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherReviews;