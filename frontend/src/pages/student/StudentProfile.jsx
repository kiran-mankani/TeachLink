import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

import CreatableSelect from 'react-select/creatable';
import { 
  KARACHI_AREAS, 
  SUBJECTS, 
  EDUCATION_LEVELS, 
  LEARNING_MODES, 
  GENDER_OPTIONS,
  BUDGET_RANGES 
} from '../../constants';

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, login, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // ✅ FIXED: subjectBudget ko state me add karo
  const [subjectBudget, setSubjectBudget] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    education_level: '',
    school_name: '',
    board: '',
    subjects: [],
    budget_range: '',  // ✅ Single budget remove karenge, subject-wise use karenge
    study_time: '',
    learning_mode: '',
    gender: '',
    bio: '',
    profile_picture: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });

  const subjectOptions = SUBJECTS.map(s => ({ value: s, label: s }));
  const budgetOptions = BUDGET_RANGES.map(b => ({ value: b, label: b }));

  useEffect(() => {
    fetchProfile();
    fetchProfileStatus();
  }, [token]);

  const handleBackToDashboard = () => {
    navigate('/student-dashboard', { state: { from: '/student-profile' } });
  };

  // ✅ FETCH PROFILE - Subject-wise budget fetch karo
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getMyProfile(token);
      
      if (data.profile) {
        const learningMode = data.profile.learning_mode || '';
        
        // ✅ Subject-wise budget parse karo
        let parsedSubjectBudget = {};
        if (data.profile.subject_budget) {
          try {
            parsedSubjectBudget = typeof data.profile.subject_budget === 'string' 
              ? JSON.parse(data.profile.subject_budget) 
              : data.profile.subject_budget;
          } catch (e) {
            parsedSubjectBudget = {};
          }
        }
        
        const newFormData = {
          name: data.profile.name || user?.name || '',
          email: data.profile.email || user?.email || '',
          phone: data.profile.phone || '',
          location: data.profile.location || '',
          education_level: data.profile.education_level || '',
          school_name: data.profile.school_name || '',
          board: data.profile.board || '',
          subjects: data.profile.subjects || [],
          budget_range: '',  // ✅ Single budget ko hatao, ab subject-wise use hoga
          study_time: data.profile.study_time || '',
          learning_mode: learningMode,
          gender: data.profile.gender || '',
          bio: data.profile.bio || '',
          profile_picture: data.profile.profile_picture || ''
        };
        
        setFormData(newFormData);
        setSubjectBudget(parsedSubjectBudget);
        setProfilePicPreview(data.profile.profile_picture || '');
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const response = await fetch('/api/student/profile-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const isComplete = data.is_complete || data.percentage >= 98;
        setProfileStatus({
          percentage: isComplete ? 100 : 20,
          is_complete: isComplete
        });
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubjectChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData({ ...formData, subjects: selectedValues });
    
    // ✅ Agar subject remove ho to uska budget bhi remove karo
    const newSubjectBudget = { ...subjectBudget };
    Object.keys(newSubjectBudget).forEach(key => {
      if (!selectedValues.includes(key)) {
        delete newSubjectBudget[key];
      }
    });
    setSubjectBudget(newSubjectBudget);
  };

  // ✅ Subject budget change handler
  const handleBudgetChange = (subject, budget) => {
    setSubjectBudget({
      ...subjectBudget,
      [subject]: budget
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
        setFormData({ ...formData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const learningMode = formData.learning_mode || 'Online';
      
      // ✅ Validate: Har subject ka budget hona chahiye
      const subjects = formData.subjects || [];
      const missingBudgets = subjects.filter(s => !subjectBudget[s] || subjectBudget[s] === '');
      
      if (missingBudgets.length > 0) {
        setMessage({ 
          text: `⚠️ Please set budget for: ${missingBudgets.join(', ')}`, 
          type: 'error' 
        });
        setSaving(false);
        return;
      }
      
      const payload = {
        area: formData.location,
        education_level: formData.education_level,
        school_name: formData.school_name,
        board: formData.board,
        subjects: formData.subjects || [],
        budget_range: '',  // ✅ Empty karo, subject-wise use karo
        subject_budget: JSON.stringify(subjectBudget),  // ✅ Subject-wise budget send karo
        study_time: formData.study_time,
        learning_mode: learningMode,
        phone: formData.phone || '',
        profile_picture: formData.profile_picture || '',
        bio: formData.bio || '',
        gender: formData.gender || '',
        name: formData.name || ''
      };
      
      const response = await fetch('/api/student/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to save profile');
      
      setMessage({ text: '✅ Profile updated successfully!', type: 'success' });
      setIsEditMode(false);
      login({ ...user, isProfileComplete: true, profilePercentage: 100 }, token);
      await refreshUser();
      
      await fetchProfileStatus();
      await fetchProfile();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: '❌ Error: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    fetchProfile();
    setIsEditMode(false);
    setMessage({ text: '', type: '' });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Poppins', 'Segoe UI', 'Nunito Sans', sans-serif"
    },
    mainLayout: {
      display: 'flex',
      marginLeft: '260px',
      minHeight: '100vh'
    },
    content: {
      flex: 1,
      padding: '30px 40px',
      overflowY: 'auto',
      width: '100%',
      height: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column'
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
    statusBadge: {
      padding: '8px 20px',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusComplete: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32'
    },
    statusIncomplete: {
      backgroundColor: '#fff3e0',
      color: '#e65100'
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '35px 40px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0'
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
      paddingBottom: '25px',
      borderBottom: '2px solid #f0f0f0',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    profileAvatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
      overflow: 'hidden',
      border: '4px solid #6366f1',
      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)'
    },
    profileAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    profileInfo: {
      flex: 1
    },
    profileName: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    profileRole: {
      fontSize: '16px',
      color: '#6366f1',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    profileDetails: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '6px'
    },
    profileDetail: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#555'
    },
    profileEditBtn: {
      padding: '10px 28px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap'
    },
    sectionDivider: {
      border: 'none',
      borderTop: '2px solid #f0f0f0',
      margin: '25px 0'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    sectionIcon: {
      fontSize: '20px'
    },
    formGroup: {
      marginBottom: '18px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '5px'
    },
    labelRequired: {
      color: '#f44336',
      marginLeft: '4px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit'
    },
    inputReadonly: {
      backgroundColor: '#f0f0f0',
      cursor: 'not-allowed',
      color: '#666'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit',
      color: '#333',
      cursor: 'pointer'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit',
      minHeight: '80px',
      resize: 'vertical'
    },
    viewValue: {
      padding: '12px 16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '10px',
      border: '2px solid #e8e8e8',
      fontSize: '14px',
      color: '#333',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '6px'
    },
    viewValueEmpty: {
      color: '#999',
      fontStyle: 'italic'
    },
    // ✅ Subject-wise Budget Table Styles
    budgetTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid #e8e8e8'
    },
    budgetTh: {
      padding: '10px 14px',
      textAlign: 'left',
      backgroundColor: '#f8fafc',
      fontWeight: '600',
      color: '#1f1f3e',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '13px'
    },
    budgetTd: {
      padding: '10px 14px',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '14px',
      color: '#1f1f3e'
    },
    budgetSelect: {
      padding: '6px 10px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit',
      cursor: 'pointer',
      width: '100%'
    },
    badge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    badgePurple: {
      background: '#e0e7ff',
      color: '#6366f1'
    },
    badgeGreen: {
      background: '#dcfce7',
      color: '#16a34a'
    },
    badgeBlue: {
      background: '#dbeafe',
      color: '#2563eb'
    },
    badgeOrange: {
      background: '#fef3c7',
      color: '#d97706'
    },
    profilePicContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '20px',
      gap: '10px'
    },
    profilePicPreview: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #6366f1',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
    },
    profilePicPlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      backgroundColor: '#e0e7ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: '#6366f1',
      border: '3px dashed #6366f1'
    },
    fileInput: {
      display: 'none'
    },
    uploadButton: {
      padding: '8px 20px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
      fontFamily: 'inherit'
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    buttonSecondary: {
      width: '100%',
      padding: '14px',
      background: 'white',
      color: '#6366f1',
      border: '2px solid #6366f1',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    editButton: {
      padding: '12px 40px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '10px'
    },
    btnGroupItem: {
      flex: 1
    },
    message: {
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      fontWeight: '500'
    },
    messageSuccess: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32'
    },
    messageError: {
      backgroundColor: '#ffebee',
      color: '#c62828'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      fontSize: '20px',
      color: '#6366f1'
    },
    editButtonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '10px'
    },
    grid2Col: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    formActions: {
      marginTop: '20px'
    }
  };

  const renderViewField = (label, value, emptyText = 'Not provided') => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>{label}</label>
        <div style={styles.viewValue}>
          {value ? value : <span style={styles.viewValueEmpty}>{emptyText}</span>}
        </div>
      </div>
    );
  };

  // ✅ FIXED: Subjects view with badges
  const renderSubjectsView = (subjects) => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>Subjects Required</label>
        <div style={styles.viewValue}>
          {subjects?.length > 0 ? (
            subjects.map((s, i) => {
              const subjectName = typeof s === 'string' ? s : s.subject || s.name || '';
              return (
                <span key={i} style={{...styles.badge, ...styles.badgePurple}}>
                  📘 {subjectName}
                </span>
              );
            })
          ) : (
            <span style={styles.viewValueEmpty}>No subjects selected</span>
          )}
        </div>
      </div>
    );
  };

  // ✅ NEW: Subject-wise Budget View (Table format)
  const renderSubjectBudgetView = (subjects, budgetData) => {
    if (!subjects || subjects.length === 0) {
      return (
        <div style={styles.viewValue}>
          <span style={styles.viewValueEmpty}>No subjects to display</span>
        </div>
      );
    }

    const hasBudgets = Object.keys(budgetData).length > 0;
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>💰 Subject-wise Monthly Budget</label>
        <table style={styles.budgetTable}>
          <thead>
            <tr>
              <th style={styles.budgetTh}>Subject</th>
              <th style={styles.budgetTh}>Budget</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => {
              const subjectName = typeof subject === 'string' ? subject : subject.subject || subject.name || '';
              const budget = budgetData[subjectName] || 'Not set';
              return (
                <tr key={index}>
                  <td style={styles.budgetTd}>
                    <span style={{...styles.badge, ...styles.badgePurple}}>
                      📘 {subjectName}
                    </span>
                  </td>
                  <td style={styles.budgetTd}>
                    {budget !== 'Not set' ? (
                      <span style={{...styles.badge, ...styles.badgeGreen}}>
                        💰 {budget}
                      </span>
                    ) : (
                      <span style={styles.viewValueEmpty}>Budget not set</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ✅ NEW: Subject-wise Budget Edit (with dropdowns)
  const renderSubjectBudgetEdit = (subjects, budgetData, onBudgetChange) => {
    if (!subjects || subjects.length === 0) {
      return (
        <div style={styles.viewValue}>
          <span style={styles.viewValueEmpty}>Add subjects first to set budgets</span>
        </div>
      );
    }

    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>💰 Subject-wise Monthly Budget <span style={styles.labelRequired}>*</span></label>
        <table style={styles.budgetTable}>
          <thead>
            <tr>
              <th style={styles.budgetTh}>Subject</th>
              <th style={styles.budgetTh}>Budget</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => {
              const subjectName = typeof subject === 'string' ? subject : subject.subject || subject.name || '';
              const currentBudget = budgetData[subjectName] || '';
              return (
                <tr key={index}>
                  <td style={styles.budgetTd}>
                    <span style={{...styles.badge, ...styles.badgePurple}}>
                      📘 {subjectName}
                    </span>
                  </td>
                  <td style={styles.budgetTd}>
                    <select
                      style={styles.budgetSelect}
                      value={currentBudget}
                      onChange={(e) => onBudgetChange(subjectName, e.target.value)}
                      required
                    >
                      <option value="">Select budget</option>
                      <option value="Rs. 2,000 – 4,000">Rs. 2,000 – 4,000</option>
                      <option value="Rs. 4,000 – 6,000">Rs. 4,000 – 6,000</option>
                      <option value="Rs. 6,000 – 8,000">Rs. 6,000 – 8,000</option>
                      <option value="Rs. 8,000 – 10,000">Rs. 8,000 – 10,000</option>
                      <option value="Rs. 10,000+">Rs. 10,000+</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {Object.values(budgetData).some(b => b === '') && (
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
            ⚠️ Please select a budget for all subjects
          </div>
        )}
      </div>
    );
  };

  const renderModeView = (mode) => {
    if (mode && mode.trim()) {
      return (
        <div style={styles.viewValue}>
          <span style={{...styles.badge, ...styles.badgeGreen}}>
            ✅ {mode}
          </span>
        </div>
      );
    }
    return (
      <div style={styles.viewValue}>
        <span style={styles.viewValueEmpty}>Not provided</span>
      </div>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  const selectedSubjects = formData.subjects?.map(sub => ({
    value: typeof sub === 'string' ? sub : sub.subject || sub.name || '',
    label: typeof sub === 'string' ? sub : sub.subject || sub.name || ''
  })) || [];

  const initial = formData.name?.charAt(0)?.toUpperCase() || '?';
  const isComplete = profileStatus.is_complete || profileStatus.percentage >= 98;
  const userName = formData.name || user?.name || 'Student';

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <Sidebar role="student" />
        <div style={styles.content}>
          
          {/* Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/student-dashboard" />
          )}

          {/* HEADER */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>👤 My Profile</h1>
              <p style={styles.subtitle}>
                {isEditMode ? 'Edit your profile information' : 'View and manage your personal information.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                ...styles.statusBadge,
                ...(isComplete ? styles.statusComplete : styles.statusIncomplete)
              }}>
                {isComplete ? '🟢 Profile Complete' : '⚠️ ' + profileStatus.percentage + '% Complete'}
              </span>
              {!isEditMode && (
                <button 
                  style={styles.profileEditBtn}
                  onClick={handleEdit}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* MAIN CARD */}
          <div style={styles.card}>
            
            {message.text && (
              <div style={{
                ...styles.message,
                ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* TOP SUMMARY CARD */}
              <div style={styles.profileHeader}>
                <div style={styles.profileAvatar}>
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt={userName} style={styles.profileAvatarImage} />
                  ) : (
                    initial
                  )}
                </div>
                <div style={styles.profileInfo}>
                  <div style={styles.profileName}>
                    {userName}
                    <span style={styles.profileRole}>🎓 {formData.education_level || 'Student'}</span>
                  </div>
                  <div style={styles.profileDetails}>
                    <span style={styles.profileDetail}>📍 {formData.location || 'Location not set'}</span>
                    <span style={styles.profileDetail}>📧 {formData.email || 'Email not set'}</span>
                    <span style={styles.profileDetail}>📞 {formData.phone ? `+92${formData.phone}` : 'Phone not set'}</span>
                    {isComplete && (
                      <span style={{...styles.profileDetail, color: '#16a34a', fontWeight: '600'}}>
                        🟢 Profile Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isEditMode ? (
                // ============ EDIT MODE ============
                <>
                  {/* Profile Picture */}
                  <div style={styles.profilePicContainer}>
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Profile" style={styles.profilePicPreview} />
                    ) : (
                      <div style={styles.profilePicPlaceholder}>{initial}</div>
                    )}
                    <button type="button" style={styles.uploadButton} onClick={() => document.getElementById('profilePicInput').click()}>
                      📸 Upload Photo
                    </button>
                    <input type="file" id="profilePicInput" accept="image/*" style={styles.fileInput} onChange={handleImageChange} />
                  </div>

                  <h3 style={styles.sectionTitle}>👤 Personal Information</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name <span style={styles.labelRequired}>*</span></label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} style={styles.input} placeholder="Enter your full name" required />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address (Read Only)</label>
                    <input type="email" value={formData.email || ''} style={{...styles.input, ...styles.inputReadonly}} disabled />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number <span style={styles.labelRequired}>*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        padding: '10px 14px', 
                        background: '#f0f0f0', 
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f1f3e'
                      }}>🇵🇰 +92</span>
                      <input 
                        type="text" 
                        name="phone"
                        value={formData.phone || ''} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) {
                            handleChange({ target: { name: 'phone', value: val } });
                          }
                        }}
                        style={{...styles.input, flex: 1}}
                        placeholder="3123456789"
                        maxLength="10"
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Location (Karachi) <span style={styles.labelRequired}>*</span></label>
                    <select name="location" value={formData.location || ''} onChange={handleChange} style={styles.select} required>
                      <option value="">Select Area</option>
                      {KARACHI_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                  </div>

                  <hr style={styles.sectionDivider} />

                  <h3 style={styles.sectionTitle}>🎓 Academic Information</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Education Level <span style={styles.labelRequired}>*</span></label>
                    <select name="education_level" value={formData.education_level || ''} onChange={handleChange} style={styles.select} required>
                      <option value="">Select Education Level</option>
                      {EDUCATION_LEVELS.map(el => <option key={el} value={el}>{el}</option>)}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>School / College Name <span style={styles.labelRequired}>*</span></label>
                    <input 
                      type="text" 
                      name="school_name" 
                      value={formData.school_name || ''} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="e.g., Beaconhouse, The City School, Govt Degree College"
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Board / Curriculum</label>
                    <input 
                      type="text" 
                      name="board" 
                      value={formData.board || ''} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="e.g., Sindh Board, Aga Khan Board, Cambridge"
                    />
                  </div>

                  <hr style={styles.sectionDivider} />

                  <h3 style={styles.sectionTitle}>📚 Learning Requirements</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Subjects Required <span style={styles.labelRequired}>*</span></label>
                    <CreatableSelect
                      isMulti
                      options={subjectOptions}
                      value={selectedSubjects}
                      onChange={handleSubjectChange}
                      placeholder="Type or select subjects..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#e8e8e8',
                          borderRadius: '10px',
                          padding: '2px',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#6366f1' }
                        })
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      💡 Type a custom subject and press Enter to add it
                    </div>
                  </div>

                  {/* ✅ FIXED: Subject-wise Budget instead of single budget */}
                  {renderSubjectBudgetEdit(formData.subjects, subjectBudget, handleBudgetChange)}

                  <hr style={styles.sectionDivider} />

                  <h3 style={styles.sectionTitle}>⏰ Learning Preferences</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Preferred Study Time <span style={styles.labelRequired}>*</span></label>
                    <select name="study_time" value={formData.study_time || ''} onChange={handleChange} style={styles.select} required>
                      <option value="">Select Study Time</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Preferred Learning Mode <span style={styles.labelRequired}>*</span></label>
                    <select name="learning_mode" value={formData.learning_mode || ''} onChange={handleChange} style={styles.select} required>
                      <option value="">Select Learning Mode</option>
                      {LEARNING_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                    {formData.learning_mode && (
                      <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '4px' }}>
                        ✅ Selected: {formData.learning_mode}
                      </div>
                    )}
                  </div>

                  <hr style={styles.sectionDivider} />

                  <h3 style={styles.sectionTitle}>📝 Learning Goal</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Bio / Learning Goal</label>
                    <textarea 
                      name="bio" 
                      value={formData.bio || ''} 
                      onChange={handleChange} 
                      style={styles.textarea} 
                      placeholder="Example: I am preparing for Matric Board Exams and looking for a Mathematics tutor."
                    />
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {formData.bio?.length || 0} / 500 characters
                    </div>
                  </div>

                  <div style={styles.btnGroup}>
                    <div style={styles.btnGroupItem}>
                      <button type="submit" style={{...styles.button, ...(saving ? styles.buttonDisabled : {})}} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                      </button>
                    </div>
                    <div style={styles.btnGroupItem}>
                      <button type="button" style={styles.buttonSecondary} onClick={handleCancel}>
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // ============ VIEW MODE ============
                <>
                  {/* 🎓 Academic Information */}
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🎓</span> Academic Information
                  </h3>
                  {renderViewField('Education Level', formData.education_level || 'Not provided')}
                  {renderViewField('School / College', formData.school_name || 'Not provided')}
                  {renderViewField('Board / Curriculum', formData.board || 'Not provided')}

                  <hr style={styles.sectionDivider} />

                  {/* 📚 Learning Requirements */}
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📚</span> Learning Requirements
                  </h3>
                  {renderSubjectsView(formData.subjects)}
                  
                  {/* ✅ FIXED: Subject-wise Budget View instead of single budget */}
                  {renderSubjectBudgetView(formData.subjects, subjectBudget)}

                  <hr style={styles.sectionDivider} />

                  {/* ⏰ Learning Preferences */}
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>⏰</span> Learning Preferences
                  </h3>
                  {renderViewField('Preferred Study Time', formData.study_time || 'Not provided')}
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Preferred Learning Mode</label>
                    {renderModeView(formData.learning_mode)}
                  </div>

                  <hr style={styles.sectionDivider} />

                  {/* 📝 Learning Goal */}
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📝</span> Learning Goal
                  </h3>
                  {renderViewField('Bio / Learning Goal', formData.bio || 'No bio added yet')}
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;