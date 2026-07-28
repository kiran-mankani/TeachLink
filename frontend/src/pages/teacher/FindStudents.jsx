// frontend/src/pages/teacher/FindStudents.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import StudentCard from '../../components/StudentCard';
import BackButton from '../../components/BackButton';


const FindStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher/find-students' } });
  };

  const handleViewStudentProfile = (studentId) => {
    navigate(`/teacher/student-profile/${studentId}`, { state: { from: '/teacher/find-students' } });
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendedStudents(token);
      console.log('📥 All recommended students:', data);
      if (data.success) {
        // ✅ Sort by match_score descending (highest first)
        const sortedStudents = (data.students || []).sort((a, b) => 
          (b.match_score || 0) - (a.match_score || 0)
        );
        setStudents(sortedStudents);
      } else {
        setError(data.error || 'Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter students by search query
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subjects?.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.education?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    titleCount: {
      fontSize: '16px',
      fontWeight: '400',
      color: '#94a3b8'
    },
    subtitle: {
      color: '#666',
      fontSize: '14px'
    },
    searchBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      alignItems: 'center'
    },
    searchInput: {
      flex: 1,
      padding: '12px 18px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.3s'
    },
    backBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#475569',
      marginBottom: '16px',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    studentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
      marginTop: '12px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      gridColumn: '1 / -1'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    emptySubtitle: {
      fontSize: '15px',
      color: '#94a3b8',
      marginTop: '8px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
    },
    resultCount: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '12px'
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      flexDirection: 'column',
      color: '#ef4444'
    },
    errorButton: {
      marginTop: '15px',
      padding: '10px 25px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading recommended students...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.errorContainer}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
              <div>{error}</div>
              <button style={styles.errorButton} onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar role="teacher" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/teacher-dashboard" />
          )}

          {/* ✅ Back to Dashboard Button - Keep for direct navigation */}
          <button
            style={styles.backBtn}
            onClick={handleBackToDashboard}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                🎯 Find Students
                <span style={styles.titleCount}>
                  ({students.length} recommendations)
                </span>
              </h1>
              <p style={styles.subtitle}>
                AI-powered student recommendations based on your profile
              </p>
            </div>
          </div>

          <div style={styles.searchBar}>
            <input
              style={styles.searchInput}
              placeholder="🔍 Search by name, subject or education..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>

          {students.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👀</div>
              <div style={styles.emptyTitle}>No matching students found</div>
              <div style={styles.emptySubtitle}>
                Complete your profile to get better AI recommendations
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <div style={styles.emptyTitle}>No results found</div>
              <div style={styles.emptySubtitle}>
                Try adjusting your search terms
              </div>
            </div>
          ) : (
            <>
              <div style={styles.resultCount}>
                Showing {filteredStudents.length} student{filteredStudents.length > 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              <div style={styles.studentsGrid}>
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.student_id || student._id}
                    student={{
                      ...student,
                      match_score: student.match_score || 0
                    }}
                    onViewProfile={() => handleViewStudentProfile(student.student_id || student._id || student.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindStudents;