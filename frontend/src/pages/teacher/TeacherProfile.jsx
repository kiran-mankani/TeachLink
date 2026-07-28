// frontend/src/pages/teacher/TeacherProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';
import CreatableSelect from 'react-select/creatable';
import { 
  KARACHI_AREAS, 
  SUBJECTS, 
  LEARNING_MODES, 
  QUALIFICATIONS,
  EXPERIENCE_OPTIONS,
  TEACHING_LEVELS
} from '../../constants';

const TeacherProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, login, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    qualification: '',
    experience: '',
    subjects: [],
    teaching_mode: '',
    teaching_levels: [],
    bio: '',
    profile_picture: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });

  const subjectOptions = SUBJECTS.map(s => ({ value: s, label: s }));

  useEffect(() => {
    fetchProfile();
    fetchProfileStatus();
  }, [token]);

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher-profile' } });
  };

  // ✅ FETCH PROFILE - FIXED for subject-wise fees
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      console.log('📤 Fetching profile for TeacherProfile...');
      
      const response = await fetch('/api/profile/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Profile API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.profile) {
        console.log('📥 Teaching Levels in response:', data.profile.teaching_levels);
        
        const teachingMode = data.profile.learning_mode || data.profile.teaching_mode || '';
        
        // ✅ FIXED: Handle subject-wise fees
        let subjects = data.profile.subjects || [];
        // If subjects is array of strings, convert to display format
        if (subjects.length > 0 && typeof subjects[0] === 'string') {
          subjects = subjects.map(s => ({ subject: s, fee: '' }));
        }
        // If subjects is array of objects, keep as is
        if (subjects.length > 0 && typeof subjects[0] === 'object') {
          subjects = subjects.map(s => ({
            subject: s.subject || '',
            fee: s.fee || ''
          }));
        }
        
        // ✅ IMPORTANT: teaching_levels ko properly extract karo
        const teachingLevels = Array.isArray(data.profile.teaching_levels) 
          ? data.profile.teaching_levels 
          : [];
        
        console.log('✅ Teaching Levels extracted:', teachingLevels);
        console.log('✅ Subjects extracted:', subjects);
        
        const newFormData = {
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          location: data.profile.location || '',
          qualification: data.profile.qualification || '',
          experience: data.profile.experience || '',
          subjects: subjects,
          teaching_mode: teachingMode,
          teaching_levels: teachingLevels,
          bio: data.profile.bio || '',
          profile_picture: data.profile.profile_picture || ''
        };
        
        console.log('✅ Final FormData:', newFormData);
        
        setFormData(newFormData);
        setOriginalFormData(newFormData);
        setProfilePicPreview(data.profile.profile_picture || '');
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('❌ Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const response = await fetch('/api/teacher/profile-status', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setProfileStatus(data);
      }
    } catch (err) {
      console.error('❌ Status fetch error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubjectChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    // ✅ Convert to subject-wise fee format for display
    const subjectsWithFee = selectedValues.map(s => ({ subject: s, fee: '' }));
    setFormData({ ...formData, subjects: subjectsWithFee });
  };

  const toggleTeachingLevel = (level) => {
    const current = formData.teaching_levels.includes(level) 
      ? formData.teaching_levels.filter(l => l !== level) 
      : [...formData.teaching_levels, level];
    setFormData({ ...formData, teaching_levels: current });
    console.log('📊 Toggled teaching levels:', current);
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
    
    // Validation
    if (!formData.name?.trim()) {
      setMessage({ text: '❌ Full Name is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.phone?.trim()) {
      setMessage({ text: '❌ Phone Number is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.location?.trim()) {
      setMessage({ text: '❌ Location is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.qualification?.trim()) {
      setMessage({ text: '❌ Qualification is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.experience?.trim()) {
      setMessage({ text: '❌ Experience is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (formData.subjects.length === 0) {
      setMessage({ text: '❌ At least one subject is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.teaching_mode?.trim()) {
      setMessage({ text: '❌ Teaching Mode is required', type: 'error' });
      setSaving(false);
      return;
    }
    if (formData.teaching_levels.length === 0) {
      setMessage({ text: '❌ At least one teaching level is required', type: 'error' });
      setSaving(false);
      return;
    }
    
    try {
      // ✅ Build subjects for API (subject-wise fees)
      const subjectsForApi = formData.subjects.map(s => ({
        subject: s.subject || s,
        fee: s.fee || 0
      }));
      
      const payload = {
        location: formData.location,
        qualification: formData.qualification,
        experience: formData.experience,
        subjects: subjectsForApi,
        teaching_mode: formData.teaching_mode,
        phone: formData.phone || '',
        profile_picture: formData.profile_picture || '',
        bio: formData.bio || '',
        name: formData.name || '',
        teaching_levels: formData.teaching_levels || []
      };
      
      console.log('📤 Teaching Levels payload:', formData.teaching_levels);
      console.log('📤 Subjects payload:', subjectsForApi);
      
      const response = await fetch('/api/teacher/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to save profile');
      
      setMessage({ text: '✅ Profile saved successfully!', type: 'success' });
      setIsEditMode(false);
      login({ ...user, isProfileComplete: true }, token);
      await refreshUser();
      
      setOriginalFormData(formData);
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
    if (originalFormData) {
      setFormData(originalFormData);
      setProfilePicPreview(originalFormData.profile_picture || '');
    }
    setIsEditMode(false);
    setMessage({ text: '', type: '' });
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Not provided';
    if (phone.length === 10) {
      return `+92 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  const getModeIcon = (mode) => {
    if (!mode) return '';
    const modeMap = {
      'Online': '💻 Online Classes',
      'Physical': '🏠 Physical Classes',
      'Both': '✔ Both'
    };
    return modeMap[mode] || mode;
  };

  // ✅ FIXED: Format fee display from subject-wise fees
  const getFeeDisplay = () => {
    const subjects = formData.subjects || [];
    if (subjects.length === 0) return 'Not provided';
    
    const fees = subjects.map(s => s.fee || 0).filter(f => f > 0);
    if (fees.length === 0) return 'Not provided';
    
    const minFee = Math.min(...fees);
    const maxFee = Math.max(...fees);
    
    if (minFee === maxFee) {
      return `Rs. ${Number(minFee).toLocaleString()} / Month`;
    }
    return `Rs. ${Number(minFee).toLocaleString()} – Rs. ${Number(maxFee).toLocaleString()} / Month`;
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

  // ✅ FIXED: Render subjects with fees
  const renderSubjectsView = (subjects) => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>Subjects & Fees</label>
        <div style={styles.viewValue}>
          {subjects?.length > 0 ? (
            subjects.map((s, i) => {
              const subjectName = typeof s === 'string' ? s : s.subject || s;
              const fee = typeof s === 'object' ? (s.fee || '') : '';
              return (
                <span key={i} style={{...styles.badge, ...styles.badgePurple}}>
                  📚 {subjectName}{fee ? ` (Rs. ${fee}/month)` : ''}
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

  // ✅ TEACHING LEVELS VIEW - FIXED
  const renderTeachingLevelsView = (levels) => {
    console.log('📊 renderTeachingLevelsView called with:', levels);
    
    const safeLevels = Array.isArray(levels) ? levels : [];
    console.log('📊 Safe levels:', safeLevels);
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>Teaching Levels</label>
        <div style={styles.viewValue}>
          {safeLevels.length > 0 ? (
            safeLevels.map((l, i) => (
              <span key={i} style={{...styles.badge, ...styles.badgeGreen}}>
                {l}
              </span>
            ))
          ) : (
            <span style={styles.viewValueEmpty}>No levels selected</span>
          )}
        </div>
      </div>
    );
  };

  const styles = {
    container: { 
      minHeight: '100vh', 
      backgroundColor: '#f1f5f9', 
      fontFamily: "'Poppins', 'Segoe UI', sans-serif" 
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
      width: '100%' 
    },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '30px', 
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
      fontSize: '14px' 
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
      padding: '40px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
      border: '1px solid #f0f0f0' 
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
      paddingBottom: '25px',
      borderBottom: '1px solid #f0f0f0',
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
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    profileVerified: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6366f1',
      background: '#eef2ff',
      padding: '4px 14px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    profileDetails: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '8px'
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
      fontWeight: '700', 
      color: '#1f1f3e', 
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    formGroup: { 
      marginBottom: '20px' 
    },
    label: { 
      display: 'block', 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#1f1f3e', 
      marginBottom: '5px' 
    },
    input: { 
      width: '100%', 
      padding: '12px 16px', 
      border: '2px solid #e8e8e8', 
      borderRadius: '10px', 
      fontSize: '15px', 
      outline: 'none', 
      backgroundColor: '#f8f9ff', 
      fontFamily: 'inherit',
      transition: 'all 0.3s'
    },
    inputReadonly: {
      backgroundColor: '#f8fafc',
      color: '#64748b',
      cursor: 'default',
      border: '2px solid #e8e8e8',
      pointerEvents: 'none',
      opacity: 0.8,
      boxShadow: 'none'
    },
    select: { 
      width: '100%', 
      padding: '12px 16px', 
      border: '2px solid #e8e8e8', 
      borderRadius: '10px', 
      fontSize: '15px', 
      outline: 'none', 
      backgroundColor: '#f8f9ff', 
      fontFamily: 'inherit', 
      color: '#333', 
      cursor: 'pointer' 
    },
    selectReadonly: {
      backgroundColor: '#f8fafc',
      color: '#64748b',
      cursor: 'default',
      border: '2px solid #e8e8e8',
      pointerEvents: 'none',
      opacity: 0.8
    },
    textarea: { 
      width: '100%', 
      padding: '12px 16px', 
      border: '2px solid #e8e8e8', 
      borderRadius: '10px', 
      fontSize: '15px', 
      outline: 'none', 
      backgroundColor: '#f8f9ff', 
      fontFamily: 'inherit', 
      minHeight: '100px', 
      resize: 'vertical' 
    },
    textareaReadonly: {
      backgroundColor: '#f8fafc',
      color: '#64748b',
      cursor: 'default',
      border: '2px solid #e8e8e8',
      pointerEvents: 'none',
      opacity: 0.8,
      resize: 'none'
    },
    viewValue: { 
      padding: '12px 16px', 
      backgroundColor: '#f8fafc',
      borderRadius: '10px', 
      border: '2px solid #e8e8e8', 
      fontSize: '15px', 
      color: '#64748b',
      minHeight: '48px', 
      display: 'flex', 
      alignItems: 'center', 
      flexWrap: 'wrap', 
      gap: '6px',
      cursor: 'default'
    },
    viewValueEmpty: { 
      color: '#94a3b8', 
      fontStyle: 'italic' 
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
      transition: 'all 0.3s'
    },
    uploadButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    button: { 
      width: '100%', 
      padding: '14px', 
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
      color: 'white', 
      border: 'none', 
      borderRadius: '10px', 
      fontSize: '17px', 
      fontWeight: '600', 
      cursor: 'pointer', 
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
      fontSize: '17px', 
      fontWeight: '600', 
      cursor: 'pointer', 
      fontFamily: 'inherit' 
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
    checkboxGrid: { 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr 1fr', 
      gap: '10px' 
    },
    checkboxLabel: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      fontSize: '13px', 
      color: '#333', 
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '2px solid #e8e8e8',
      transition: 'all 0.3s',
      backgroundColor: '#fafaff'
    },
    checkboxLabelSelected: {
      borderColor: '#6366f1',
      backgroundColor: '#f0f4ff',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)'
    },
    checkbox: { 
      width: '18px', 
      height: '18px', 
      accentColor: '#6366f1',
      cursor: 'pointer' 
    },
    checkboxDisabled: {
      accentColor: '#94a3b8',
      cursor: 'not-allowed'
    },
    loading: { 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh', 
      fontSize: '20px', 
      color: '#6366f1' 
    },
    feeDisplay: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    feeSub: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '400'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  // ✅ FIXED: Get subject names for CreatableSelect
  const selectedSubjects = formData.subjects?.map(s => {
    const name = typeof s === 'string' ? s : s.subject || s;
    return { value: name, label: name };
  }) || [];
  
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const isComplete = profileStatus.percentage >= 98;
  const userName = formData.name || user?.name || 'Teacher';
  const userLocation = formData.location || 'Not specified';
  const userPhone = formatPhone(formData.phone);
  const feeDisplay = getFeeDisplay();

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <Sidebar role="teacher" />
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/teacher-dashboard" />
          )}

          {/* HEADER WITH EDIT BUTTON AT TOP RIGHT */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>Teacher Profile</h1>
              <p style={styles.subtitle}>
                {isEditMode ? '✏️ Editing Mode' : 'View your profile information'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{...styles.statusBadge, ...(isComplete ? styles.statusComplete : styles.statusIncomplete)}}>
                {isComplete ? '✅ Complete' : '⚠️ ' + profileStatus.percentage + '% Complete'}
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

          <div style={styles.card}>
            {/* PROFILE HEADER */}
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
                  👤 {userName}
                  {isComplete && (
                    <span style={styles.profileVerified}>⭐ Verified Teacher</span>
                  )}
                </div>
                <div style={styles.profileDetails}>
                  <span style={styles.profileDetail}>📍 {userLocation}, Karachi</span>
                  <span style={styles.profileDetail}>📱 {userPhone}</span>
                  <span style={styles.profileDetail}>
                    💰 <span style={styles.feeDisplay}>{feeDisplay}</span>
                  </span>
                  {formData.teaching_mode && (
                    <span style={styles.profileDetail}>{getModeIcon(formData.teaching_mode)}</span>
                  )}
                  {formData.subjects?.length > 0 && (
                    <span style={styles.profileDetail}>📚 {formData.subjects.slice(0, 3).map(s => typeof s === 'string' ? s : s.subject).join(', ')}{formData.subjects.length > 3 && ` +${formData.subjects.length - 3}`}</span>
                  )}
                </div>
              </div>
            </div>

            {/* MESSAGE */}
            {message.text && (
              <div style={{...styles.message, ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)}}>
                {message.text}
              </div>
            )}

            {!isEditMode ? (
              // VIEW MODE - Read-only with gray background
              <>
                <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
                {renderViewField('Full Name', formData.name)}
                {renderViewField('Phone Number', userPhone)}
                {renderViewField('Email', formData.email)}
                {renderViewField('Area', formData.location ? `${formData.location}, Karachi` : 'Not provided')}
                
                <hr style={styles.sectionDivider} />

                <h3 style={styles.sectionTitle}>🎓 Teaching Information</h3>
                {renderViewField('Qualification', formData.qualification || 'Not provided')}
                {renderViewField('Experience', formData.experience || 'Not provided')}
                {renderSubjectsView(formData.subjects)}
                
                {/* ✅ TEACHING LEVELS - FIXED */}
                {renderTeachingLevelsView(formData.teaching_levels)}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Mode</label>
                  <div style={styles.viewValue}>
                    {formData.teaching_mode ? (
                      <span style={{...styles.badge, ...styles.badgeBlue}}>
                        {getModeIcon(formData.teaching_mode)}
                      </span>
                    ) : (
                      <span style={styles.viewValueEmpty}>Not provided</span>
                    )}
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Monthly Fee</label>
                  <div style={styles.viewValue}>
                    <span style={styles.feeDisplay}>
                      {feeDisplay}
                    </span>
                  </div>
                </div>

                <hr style={styles.sectionDivider} />

                <h3 style={styles.sectionTitle}>📝 About Me</h3>
                {renderViewField('Bio', formData.bio || 'No bio added yet')}
              </>
            ) : (
              // EDIT MODE
              <form onSubmit={handleSubmit}>
                <div style={styles.profilePicContainer}>
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" style={styles.profilePicPreview} />
                  ) : (
                    <div style={styles.profilePicPlaceholder}>{initial}</div>
                  )}
                  <>
                    <button 
                      type="button" 
                      style={{...styles.uploadButton, ...(saving ? styles.uploadButtonDisabled : {})}} 
                      onClick={() => document.getElementById('profilePicInput').click()}
                      disabled={saving}
                    >
                      {profilePicPreview ? '🔄 Change Photo' : '📷 Upload Photo'}
                    </button>
                    <input type="file" id="profilePicInput" accept="image/*" style={styles.fileInput} onChange={handleImageChange} disabled={saving} />
                  </>
                </div>

                <h3 style={styles.sectionTitle}>👤 Personal Information</h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleChange} 
                    style={styles.input} 
                    required 
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email (Read Only)</label>
                  <input 
                    type="email" 
                    value={formData.email || ''} 
                    style={{...styles.input, ...styles.inputReadonly}} 
                    disabled 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number *</label>
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
                      placeholder="3001234567"
                      maxLength="10"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Location (Karachi) *</label>
                  <select 
                    name="location" 
                    value={formData.location || ''} 
                    onChange={handleChange} 
                    style={styles.select} 
                    required
                    disabled={saving}
                  >
                    <option value="">Select Area</option>
                    {KARACHI_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>

                <hr style={styles.sectionDivider} />

                <h3 style={styles.sectionTitle}>🎓 Teaching Information</h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Qualification *</label>
                  <select 
                    name="qualification" 
                    value={formData.qualification || ''} 
                    onChange={handleChange} 
                    style={styles.select} 
                    required
                    disabled={saving}
                  >
                    <option value="">Select Qualification</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Experience *</label>
                  <select 
                    name="experience" 
                    value={formData.experience || ''} 
                    onChange={handleChange} 
                    style={styles.select} 
                    required
                    disabled={saving}
                  >
                    <option value="">Select Experience</option>
                    {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Subjects *</label>
                  <CreatableSelect
                    isMulti
                    options={subjectOptions}
                    value={selectedSubjects}
                    onChange={handleSubjectChange}
                    placeholder="Type or select subjects..."
                    isDisabled={saving}
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

                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Levels *</label>
                  <div style={styles.checkboxGrid}>
                    {TEACHING_LEVELS.map(level => {
                      const isSelected = formData.teaching_levels?.includes(level);
                      return (
                        <label 
                          key={level} 
                          style={{
                            ...styles.checkboxLabel,
                            ...(isSelected ? styles.checkboxLabelSelected : {})
                          }}
                        >
                          <input 
                            type="checkbox" 
                            style={styles.checkbox} 
                            checked={isSelected} 
                            onChange={() => toggleTeachingLevel(level)} 
                            disabled={saving}
                          />
                          {level}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Mode *</label>
                  <select 
                    name="teaching_mode" 
                    value={formData.teaching_mode || ''} 
                    onChange={handleChange} 
                    style={styles.select} 
                    required
                    disabled={saving}
                  >
                    <option value="">Select Mode</option>
                    {LEARNING_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </div>

                <hr style={styles.sectionDivider} />

                <h3 style={styles.sectionTitle}>📝 About Me</h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Bio / About</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio || ''} 
                    onChange={handleChange} 
                    style={styles.textarea} 
                    placeholder="Tell students about yourself..." 
                    maxLength="250"
                    disabled={saving}
                  />
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
                    {formData.bio?.length || 0} / 250 characters
                  </div>
                </div>

                {/* EDIT MODE BUTTONS */}
                <div style={styles.btnGroup}>
                  <div style={styles.btnGroupItem}>
                    <button 
                      type="submit" 
                      style={{...styles.button, ...(saving ? styles.buttonDisabled : {})}} 
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                  </div>
                  <div style={styles.btnGroupItem}>
                    <button 
                      type="button" 
                      style={styles.buttonSecondary} 
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;