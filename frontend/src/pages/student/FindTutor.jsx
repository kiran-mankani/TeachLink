import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const FindTutor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allTutors, setAllTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states - Accordion
  const [openSections, setOpenSections] = useState({
    academic: true,
    location: true,
    fee: true,
    match: true,
    availability: true
  });
  
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('Anywhere');
  const [selectedFee, setSelectedFee] = useState('All');
  const [selectedMatch, setSelectedMatch] = useState('All');
  const [selectedShift, setSelectedShift] = useState('All');
  const [sortBy, setSortBy] = useState('match');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [tutorsPerPage] = useState(4);

  // Filter options
  const subjects = [
    'All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'English', 'Urdu', 'Islamiat', 'Pak Studies',
    'Economics', 'Accounting', 'Business Studies'
  ];
  
  const levels = ['All', 'Primary', 'Middle', 'Matric', 'O Level', 'A Level', 'Intermediate'];
  const modes = ['All', 'Online', 'Physical', 'Both'];
  const areas = [
    'All', 'Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 
    'DHA', 'Clifton', 'Federal B Area', 'Malir', 'Korangi', 
    'Saddar', 'Gulberg', 'Nazimabad', 'Liaquatabad', 'Karachi City'
  ];
  const distances = ['Anywhere', 'Within 2 km', 'Within 5 km', 'Within 10 km'];
  const fees = ['All', '2000-5000', '5000-8000', '8000+'];
  const matchScores = ['All', '90%+', '80%+', '70%+'];
  const shifts = ['All', 'Morning', 'Afternoon', 'Evening'];
  const sortOptions = [
    { value: 'match', label: 'Highest AI Match' },
    { value: 'nearest', label: 'Nearest Area' },
    { value: 'fee_low', label: 'Lowest Fee' },
    { value: 'rating', label: 'Highest Rating' },
    { value: 'experience', label: 'Most Experienced' }
  ];

  // Toggle accordion
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ✅ REFRESH TUTORS WITH SCHEDULES
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.getRecommendedTeachers(token);
      if (data.success) {
        const teachersWithSchedules = await Promise.all(
          (data.teachers || []).map(async (teacher) => {
            try {
              const scheduleRes = await fetch(`/api/teacher/schedules/${teacher.teacher_id || teacher._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const scheduleData = await scheduleRes.json();
              return {
                ...teacher,
                schedules: scheduleData.schedules || []
              };
            } catch (err) {
              return { ...teacher, schedules: [] };
            }
          })
        );
        setAllTutors(teachersWithSchedules);
        setFilteredTutors(teachersWithSchedules);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ FETCH TUTORS WITH SCHEDULES
  const fetchTutors = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendedTeachers(token);
      console.log('📥 All teachers:', data);
      
      if (data.success) {
        // ✅ Fetch schedules for each teacher
        const teachersWithSchedules = await Promise.all(
          (data.teachers || []).map(async (teacher) => {
            try {
              const scheduleRes = await fetch(`/api/teacher/schedules/${teacher.teacher_id || teacher._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const scheduleData = await scheduleRes.json();
              return {
                ...teacher,
                schedules: scheduleData.schedules || []
              };
            } catch (err) {
              return { ...teacher, schedules: [] };
            }
          })
        );
        setAllTutors(teachersWithSchedules);
        setFilteredTutors(teachersWithSchedules);
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTutors();
    }
  }, [token]);

  // ✅ UPDATED: Filter and sort tutors with subject-wise fees
  useEffect(() => {
    let result = [...allTutors];
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(tutor => 
        tutor.name?.toLowerCase().includes(query) ||
        tutor.subjects?.some(s => s.toLowerCase().includes(query)) ||
        tutor.location?.toLowerCase().includes(query)
      );
    }
    
    // Subject
    if (selectedSubject !== 'All') {
      result = result.filter(tutor => 
        tutor.subjects?.some(s => s === selectedSubject)
      );
    }
    
    // Level
    if (selectedLevel !== 'All') {
      result = result.filter(tutor => {
        const levels = tutor.teaching_levels || [];
        return levels.some(l => l.toLowerCase().includes(selectedLevel.toLowerCase()));
      });
    }
    
    // Mode
    if (selectedMode !== 'All') {
      result = result.filter(tutor => 
        tutor.teaching_mode === selectedMode
      );
    }
    
    // Area
    if (selectedArea !== 'All') {
      result = result.filter(tutor => 
        tutor.location === selectedArea
      );
    }
    
    // ✅ UPDATED: Fee filter with subject-wise fees
    if (selectedFee !== 'All') {
      result = result.filter(tutor => {
        const subjectFees = tutor.subject_fees || [];
        if (subjectFees.length === 0) return false;
        
        // Get all fees from subject_fees
        const allFees = subjectFees.map(s => s.fee || 0);
        const minFee = Math.min(...allFees);
        const maxFee = Math.max(...allFees);
        
        switch(selectedFee) {
          case '2000-5000': return minFee >= 2000 && maxFee <= 5000;
          case '5000-8000': return minFee >= 5000 && maxFee <= 8000;
          case '8000+': return minFee >= 8000;
          default: return true;
        }
      });
    }
    
    // Match Score
    if (selectedMatch !== 'All') {
      const minScore = parseInt(selectedMatch.replace('%+', ''));
      result = result.filter(tutor => 
        (tutor.match_score || 0) >= minScore
      );
    }
    
    // Sort
    switch(sortBy) {
      case 'match':
        result.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        break;
      case 'nearest':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'fee_low':
        result.sort((a, b) => {
          const getMin = (tutor) => {
            const fees = tutor.subject_fees || [];
            if (fees.length === 0) return 999999;
            return Math.min(...fees.map(s => s.fee || 999999));
          };
          return getMin(a) - getMin(b);
        });
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        result.sort((a, b) => {
          const getYears = (exp) => {
            const nums = exp?.match(/\d+/g);
            return nums ? parseInt(nums[0]) : 0;
          };
          return getYears(b.experience) - getYears(a.experience);
        });
        break;
      default:
        break;
    }
    
    setFilteredTutors(result);
    setCurrentPage(1);
  }, [searchQuery, selectedSubject, selectedLevel, selectedMode, selectedArea, selectedFee, selectedMatch, sortBy, allTutors]);

  // Pagination
  const indexOfLastTutor = currentPage * tutorsPerPage;
  const indexOfFirstTutor = indexOfLastTutor - tutorsPerPage;
  const currentTutors = filteredTutors.slice(indexOfFirstTutor, indexOfLastTutor);
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('All');
    setSelectedLevel('All');
    setSelectedMode('All');
    setSelectedArea('All');
    setSelectedDistance('Anywhere');
    setSelectedFee('All');
    setSelectedMatch('All');
    setSelectedShift('All');
    setSortBy('match');
  };

  const getMatchColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#22c55e';
    if (score >= 70) return '#eab308';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getMatchLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Low';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getBadges = (tutor) => {
    const badges = [];
    if (tutor.isProfileComplete) badges.push({ icon: '✅', label: 'Verified Teacher', color: '#16a34a' });
    if ((tutor.rating || 0) >= 4.5) badges.push({ icon: '⭐', label: 'Top Rated', color: '#eab308' });
    if ((tutor.match_score || 0) >= 85) badges.push({ icon: '🔥', label: 'Highly Recommended', color: '#ef4444' });
    if (tutor.availability && tutor.availability.length > 0) {
      badges.push({ icon: '🟢', label: 'Available Today', color: '#22c55e' });
    }
    return badges.slice(0, 2);
  };

  // ✅ NEW: Get fee for matching subject
  const getFeeForMatchingSubject = (tutor, studentSubject) => {
    const subjectFees = tutor.subject_fees || [];
    if (!studentSubject || subjectFees.length === 0) {
      return null;
    }
    // First try to find exact match
    for (let s of subjectFees) {
      if (s.subject === studentSubject) {
        return s.fee;
      }
    }
    // If no exact match, return first fee
    return subjectFees[0]?.fee || null;
  };

  // ✅ NEW: Render subject-wise fees
  const renderSubjectFees = (subjectFees) => {
    if (!subjectFees || subjectFees.length === 0) {
      return <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fee not specified</span>;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {subjectFees.slice(0, 3).map((s, idx) => (
          <span key={idx} style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            background: '#e0e7ff',
            color: '#4f46e5',
            border: '1px solid #c7d2fe'
          }}>
            {s.subject}: Rs.{s.fee}
          </span>
        ))}
        {subjectFees.length > 3 && (
          <span style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            background: '#f1f5f9',
            color: '#94a3b8'
          }}>
            +{subjectFees.length - 3} more
          </span>
        )}
      </div>
    );
  };

  // ✅ FIXED: View Profile with state
  const handleViewProfile = (teacherId) => {
    navigate(`/teacher-profile/${teacherId}`, {
      state: { from: '/find-tutor' }
    });
  };

  // ✅ FIXED: Request Enrollment with state
  const handleRequestEnrollment = (teacherId) => {
    navigate(`/teacher-profile/${teacherId}`, {
      state: { from: '/find-tutor', action: 'enroll' }
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
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
      padding: '24px 32px',
      overflowY: 'auto',
      height: '100vh'
    },
    header: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '12px'
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      letterSpacing: '-0.5px'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#64748b'
    },
    headerRight: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px'
    },
    headerCount: {
      fontSize: '14px',
      color: '#64748b'
    },
    headerCountNum: {
      fontWeight: '600',
      color: '#0f172a'
    },
    refreshBtn: {
      padding: '6px 16px',
      background: 'white',
      color: '#4f46e5',
      border: '1px solid #4f46e5',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    refreshBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      background: 'white',
      borderRadius: '10px',
      padding: '10px 16px',
      marginBottom: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      fontSize: '14px',
      width: '100%',
      background: 'transparent',
      fontFamily: 'inherit',
      color: '#0f172a'
    },
    searchIcon: {
      color: '#94a3b8',
      marginRight: '12px',
      fontSize: '16px'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: '24px'
    },
    sidebar: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px 18px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      height: 'fit-content',
      position: 'sticky',
      top: '20px'
    },
    accordionSection: {
      borderBottom: '1px solid #f1f5f9',
      paddingBottom: '2px',
      marginBottom: '2px'
    },
    accordionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#0f172a',
      fontFamily: 'inherit',
      background: 'none',
      border: 'none',
      width: '100%',
      textAlign: 'left'
    },
    accordionIcon: {
      fontSize: '14px',
      color: '#94a3b8',
      transition: 'transform 0.2s'
    },
    accordionIconOpen: {
      transform: 'rotate(180deg)'
    },
    accordionContent: {
      paddingBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '150px',
      overflowY: 'auto'
    },
    filterOption: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '13px',
      color: '#475569',
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: 'transparent',
      border: 'none',
      textAlign: 'left',
      fontFamily: 'inherit'
    },
    filterOptionActive: {
      background: '#eef2ff',
      color: '#4f46e5',
      fontWeight: '500'
    },
    filterDivider: {
      border: 'none',
      borderTop: '1px solid #f1f5f9',
      margin: '4px 0'
    },
    resetBtn: {
      padding: '6px',
      width: '100%',
      background: 'white',
      color: '#4f46e5',
      border: '1.5px solid #4f46e5',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      marginTop: '6px'
    },
    sortSelect: {
      width: '100%',
      padding: '5px 8px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      fontSize: '13px',
      background: 'white',
      fontFamily: 'inherit',
      cursor: 'pointer',
      outline: 'none',
      color: '#0f172a'
    },
    tutorsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    tutorCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px 22px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    tutorCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    tutorCardLeft: {
      display: 'flex',
      gap: '14px',
      alignItems: 'center'
    },
    tutorAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      color: 'white',
      overflow: 'hidden',
      flexShrink: 0
    },
    tutorAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    tutorNameInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    tutorNameRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    tutorName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a'
    },
    tutorBadge: {
      fontSize: '11px',
      fontWeight: '500',
      padding: '1px 8px',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px'
    },
    tutorRating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      color: '#f59e0b'
    },
    tutorRatingText: {
      color: '#94a3b8',
      fontSize: '12px'
    },
    matchScoreBox: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    },
    matchScore: {
      fontSize: '24px',
      fontWeight: '700',
      letterSpacing: '-0.5px'
    },
    matchLabel: {
      fontSize: '10px',
      fontWeight: '500',
      textTransform: 'uppercase',
      color: '#94a3b8',
      letterSpacing: '0.5px'
    },
    tutorBody: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    tutorInfoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4px 16px'
    },
    tutorInfoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      color: '#475569'
    },
    tutorInfoIcon: {
      fontSize: '14px',
      width: '18px',
      textAlign: 'center'
    },
    tutorSubjects: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px'
    },
    subjectChip: {
      padding: '2px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#4f46e5',
      background: 'white',
      border: '1.5px solid #4f46e5',
      letterSpacing: '0.2px'
    },
    // ✅ NEW: Subject fee section styles
    subjectFeeSection: {
      padding: '8px 0',
      borderTop: '1px solid #f1f5f9',
      borderBottom: '1px solid #f1f5f9'
    },
    subjectFeeLabel: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '500',
      display: 'block',
      marginBottom: '4px'
    },
    matchReasons: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      paddingTop: '6px',
      borderTop: '1px solid #f1f5f9'
    },
    matchReason: {
      fontSize: '12px',
      color: '#22c55e',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    tutorAvailability: {
      fontSize: '13px',
      color: '#475569',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      paddingTop: '4px',
      borderTop: '1px solid #f1f5f9'
    },
    availTitle: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#0f172a'
    },
    availSlots: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    availSlot: {
      fontSize: '13px',
      color: '#0f172a',
      fontWeight: '500'
    },
    availDay: {
      color: '#64748b',
      fontWeight: '400'
    },
    availMore: {
      fontSize: '12px',
      color: '#94a3b8',
      fontStyle: 'italic'
    },
    tutorActions: {
      display: 'flex',
      gap: '10px',
      paddingTop: '8px',
      borderTop: '1px solid #f1f5f9'
    },
    viewProfileBtn: {
      flex: 1,
      padding: '8px 16px',
      background: 'white',
      color: '#4f46e5',
      border: '1.5px solid #4f46e5',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    enrollBtn: {
      flex: 1.5,
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '6px',
      marginTop: '20px',
      padding: '12px 0'
    },
    pageBtn: {
      padding: '6px 14px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      background: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      color: '#475569'
    },
    pageBtnActive: {
      background: '#4f46e5',
      color: 'white',
      borderColor: '#4f46e5'
    },
    pageBtnDisabled: {
      opacity: 0.4,
      cursor: 'not-allowed'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      gridColumn: '1 / -1'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px'
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '4px'
    },
    emptySubtitle: {
      fontSize: '14px',
      color: '#94a3b8'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#4f46e5'
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading tutors...</div>;
  }

  const userShift = user?.study_time || '';
  // ✅ Get student's subject preference
  const studentSubject = user?.subjects?.[0] || '';

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <Sidebar role="student" />
        <div style={styles.content}>
          {/* ✅ Back Button - Show if came from somewhere */}
          {location.state?.from && (
            <BackButton label="← Back to Find Tutors" fallbackPath="/find-tutor" />
          )}

          {/* HEADER */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h1 style={styles.headerTitle}>Find Your Perfect Tutor</h1>
              <p style={styles.headerSubtitle}>Discover verified tutors matched with your learning needs.</p>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.headerCount}>
                Showing <span style={styles.headerCountNum}>{filteredTutors.length}</span> Tutors • Sorted by AI Match Score
              </div>
              <button
                style={{
                  ...styles.refreshBtn,
                  ...(refreshing ? styles.refreshBtnDisabled : {})
                }}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span>{refreshing ? '⏳' : '🔄'}</span> {refreshing ? 'Refreshing...' : 'Refresh Matches'}
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div style={styles.searchBar}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by Teacher Name, Subject or Area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: '0 8px' }}
              >
                ×
              </button>
            )}
          </div>

          {/* MAIN GRID */}
          <div style={styles.mainGrid}>
            {/* LEFT SIDEBAR - ACCORDION FILTERS */}
            <div style={styles.sidebar}>
              {/* Academic */}
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('academic')}>
                  <span>📚 Academic</span>
                  <span style={{...styles.accordionIcon, ...(openSections.academic ? styles.accordionIconOpen : {})}}>▾</span>
                </button>
                {openSections.academic && (
                  <div style={styles.accordionContent}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginTop: '2px' }}>Subject</label>
                    {subjects.slice(0, 7).map(sub => (
                      <button
                        key={sub}
                        style={{
                          ...styles.filterOption,
                          ...(selectedSubject === sub ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedSubject(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginTop: '6px' }}>Education Level</label>
                    {levels.slice(0, 5).map(level => (
                      <button
                        key={level}
                        style={{
                          ...styles.filterOption,
                          ...(selectedLevel === level ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedLevel(level)}
                      >
                        {level}
                      </button>
                    ))}
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginTop: '6px' }}>Teaching Mode</label>
                    {modes.map(mode => (
                      <button
                        key={mode}
                        style={{
                          ...styles.filterOption,
                          ...(selectedMode === mode ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr style={styles.filterDivider} />

              {/* Location */}
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('location')}>
                  <span>📍 Location</span>
                  <span style={{...styles.accordionIcon, ...(openSections.location ? styles.accordionIconOpen : {})}}>▾</span>
                </button>
                {openSections.location && (
                  <div style={styles.accordionContent}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginTop: '2px' }}>Area</label>
                    {areas.slice(0, 6).map(area => (
                      <button
                        key={area}
                        style={{
                          ...styles.filterOption,
                          ...(selectedArea === area ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedArea(area)}
                      >
                        {area}
                      </button>
                    ))}
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginTop: '6px' }}>Distance</label>
                    {distances.map(dist => (
                      <button
                        key={dist}
                        style={{
                          ...styles.filterOption,
                          ...(selectedDistance === dist ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedDistance(dist)}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr style={styles.filterDivider} />

              {/* Fee */}
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('fee')}>
                  <span>💰 Fee</span>
                  <span style={{...styles.accordionIcon, ...(openSections.fee ? styles.accordionIconOpen : {})}}>▾</span>
                </button>
                {openSections.fee && (
                  <div style={styles.accordionContent}>
                    {fees.map(fee => (
                      <button
                        key={fee}
                        style={{
                          ...styles.filterOption,
                          ...(selectedFee === fee ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedFee(fee)}
                      >
                        {fee === 'All' ? 'All' : `Rs. ${fee}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr style={styles.filterDivider} />

              {/* AI Match */}
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('match')}>
                  <span>🤖 AI Match</span>
                  <span style={{...styles.accordionIcon, ...(openSections.match ? styles.accordionIconOpen : {})}}>▾</span>
                </button>
                {openSections.match && (
                  <div style={styles.accordionContent}>
                    {matchScores.map(match => (
                      <button
                        key={match}
                        style={{
                          ...styles.filterOption,
                          ...(selectedMatch === match ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedMatch(match)}
                      >
                        {match}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr style={styles.filterDivider} />

              {/* Availability */}
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('availability')}>
                  <span>🕐 Availability</span>
                  <span style={{...styles.accordionIcon, ...(openSections.availability ? styles.accordionIconOpen : {})}}>▾</span>
                </button>
                {openSections.availability && (
                  <div style={styles.accordionContent}>
                    {shifts.map(shift => (
                      <button
                        key={shift}
                        style={{
                          ...styles.filterOption,
                          ...(selectedShift === shift ? styles.filterOptionActive : {})
                        }}
                        onClick={() => setSelectedShift(shift)}
                      >
                        {shift}
                      </button>
                    ))}
                    {userShift && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', padding: '4px 8px', background: '#f8fafc', borderRadius: '4px' }}>
                        Your preference: {userShift}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr style={styles.filterDivider} />

              {/* Sort */}
              <div style={styles.accordionSection}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', padding: '4px 0', display: 'block' }}>
                  📊 Sort By
                </label>
                <select
                  style={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <hr style={styles.filterDivider} />

              <button
                style={styles.resetBtn}
                onClick={clearFilters}
                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                Clear Filters
              </button>
            </div>

            {/* RIGHT - TUTORS GRID */}
            <div>
              {filteredTutors.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🔍</div>
                  <div style={styles.emptyTitle}>No Tutors Found</div>
                  <div style={styles.emptySubtitle}>
                    Try changing your filters or clear all filters to see more tutors.
                  </div>
                  <button
                    onClick={clearFilters}
                    style={{
                      marginTop: '12px',
                      padding: '8px 24px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.tutorsGrid}>
                    {currentTutors.map((tutor) => {
                      const matchScore = tutor.match_score || 0;
                      const matchColor = getMatchColor(matchScore);
                      const matchLabel = getMatchLabel(matchScore);
                      const initial = getInitials(tutor.name);
                      const badges = getBadges(tutor);
                      
                      const availSlots = tutor.availability || [];
                      const displaySlots = availSlots.slice(0, 2);
                      const hasMoreSlots = availSlots.length > 2;

                      // ✅ NEW: Get fee for matching subject
                      const subjectFees = tutor.subject_fees || [];
                      const feeForSubject = getFeeForMatchingSubject(tutor, studentSubject);
                      const displayFee = feeForSubject || tutor.fee_for_matching || 'N/A';

                      return (
                        <div key={tutor.teacher_id || tutor._id} style={styles.tutorCard}>
                          {/* HEADER */}
                          <div style={styles.tutorCardHeader}>
                            <div style={styles.tutorCardLeft}>
                              <div style={styles.tutorAvatar}>
                                {tutor.profile_picture ? (
                                  <img src={tutor.profile_picture} alt={tutor.name} style={styles.tutorAvatarImage} />
                                ) : (
                                  initial
                                )}
                              </div>
                              <div style={styles.tutorNameInfo}>
                                <div style={styles.tutorNameRow}>
                                  <span style={styles.tutorName}>{tutor.name || 'Unknown Tutor'}</span>
                                  {badges.map((badge, idx) => (
                                    <span key={idx} style={{...styles.tutorBadge, background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}30` }}>
                                      {badge.icon} {badge.label}
                                    </span>
                                  ))}
                                </div>
                                <span style={styles.tutorRating}>
                                  {'★'.repeat(Math.round(tutor.rating || 0))}
                                  <span style={styles.tutorRatingText}>({tutor.rating || 0})</span>
                                </span>
                              </div>
                            </div>
                            <div style={styles.matchScoreBox}>
                              <span style={{...styles.matchScore, color: matchColor}}>{Math.round(matchScore)}%</span>
                              <span style={styles.matchLabel}>{matchLabel}</span>
                            </div>
                          </div>

                          {/* BODY */}
                          <div style={styles.tutorBody}>
                            <div style={styles.tutorInfoGrid}>
                              <span style={styles.tutorInfoItem}>
                                <span style={styles.tutorInfoIcon}>🎓</span>
                                {tutor.qualification || 'N/A'}
                              </span>
                              <span style={styles.tutorInfoItem}>
                                <span style={styles.tutorInfoIcon}>💼</span>
                                {tutor.experience || '0 Years'}
                              </span>
                              <span style={styles.tutorInfoItem}>
                                <span style={styles.tutorInfoIcon}>📍</span>
                                {tutor.location || 'N/A'} • {tutor.distance || '2.3'} km Away
                              </span>
                              <span style={styles.tutorInfoItem}>
                                <span style={styles.tutorInfoIcon}>💻</span>
                                {tutor.teaching_mode || 'Online'}
                              </span>
                              <span style={{...styles.tutorInfoItem, fontWeight: '600', color: '#4f46e5' }}>
                                <span style={styles.tutorInfoIcon}>💰</span>
                                Rs.{displayFee}/month
                              </span>
                            </div>

                            <div style={styles.tutorSubjects}>
                              {tutor.subjects?.slice(0, 5).map((sub, idx) => (
                                <span key={idx} style={styles.subjectChip}>
                                  {sub}
                                </span>
                              ))}
                              {tutor.subjects?.length > 5 && (
                                <span style={{...styles.subjectChip, color: '#94a3b8', borderColor: '#94a3b8'}}>
                                  +{tutor.subjects.length - 5}
                                </span>
                              )}
                            </div>

                            {/* ✅ NEW: Subject-wise fees section */}
                            {subjectFees.length > 0 && (
                              <div style={styles.subjectFeeSection}>
                                <span style={styles.subjectFeeLabel}>📋 All Subject Fees</span>
                                {renderSubjectFees(subjectFees)}
                              </div>
                            )}

                            <div style={styles.matchReasons}>
                              {tutor.match_reasons?.slice(0, 5).map((reason, idx) => (
                                <span key={idx} style={styles.matchReason}>✔ {reason}</span>
                              ))}
                            </div>

                            <div style={styles.tutorAvailability}>
                              <span style={styles.availTitle}>Available</span>
                              <div style={styles.availSlots}>
                                {displaySlots.length > 0 ? (
                                  <>
                                    {displaySlots.map((slot, idx) => (
                                      <span key={idx} style={styles.availSlot}>
                                        <span style={styles.availDay}>{slot.day}</span> {slot.start_time || ''}
                                      </span>
                                    ))}
                                    {hasMoreSlots && (
                                      <span style={styles.availMore}>More timings available in profile</span>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>Flexible Timing</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div style={styles.tutorActions}>
                            <button
                              style={styles.viewProfileBtn}
                              onClick={() => handleViewProfile(tutor.teacher_id || tutor._id)}
                              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              View Profile
                            </button>
                            <button
                              style={styles.enrollBtn}
                              onClick={() => handleRequestEnrollment(tutor.teacher_id || tutor._id)}
                              onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              Request Enrollment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={styles.pagination}>
                      <button
                        style={{
                          ...styles.pageBtn,
                          ...(currentPage === 1 ? styles.pageBtnDisabled : {})
                        }}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          style={{
                            ...styles.pageBtn,
                            ...(currentPage === page ? styles.pageBtnActive : {})
                          }}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 5 && (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>...</span>
                      )}
                      <button
                        style={{
                          ...styles.pageBtn,
                          ...(currentPage === totalPages ? styles.pageBtnDisabled : {})
                        }}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindTutor;