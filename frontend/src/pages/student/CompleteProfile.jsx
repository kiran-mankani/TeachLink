import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const KARACHI_AREAS = ['Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'DHA', 'Clifton', 'Federal B Area', 'Malir', 'Korangi', 'Saddar', 'Gulberg', 'Nazimabad', 'Liaquatabad', 'Karachi City', 'Others'];

const EDUCATION_LEVELS = [
  'Primary (Class 1–5)',
  'Middle (Class 6–8)',
  'Matric / O Level',
  'Intermediate / A Level'
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics',
  'Accounting', 'Business Studies'
];

const LEARNING_MODES = ['Online', 'Physical', 'Both'];

// ✅ Subject-wise budget ranges
const SUBJECT_BUDGET_RANGES = [
  '2000-4000',
  '4000-6000',
  '6000-8000',
  '8000-10000',
  '10000+'
];

const STUDY_TIMES = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

const KARACHI_SCHOOLS = [
  'Beaconhouse School System',
  'The City School',
  'Karachi Grammar School',
  'Bay View High School',
  'Cedar College',
  'Nixor College',
  'Aga Khan School',
  'Habib Public School',
  "St. Patrick's High School",
  "St. Joseph's Convent School",
  'Foundation Public School',
  'Pakistan International School',
  'Army Public School (APS)',
  'Bahria College',
  'DHA Suffa University',
  'Karachi University',
  'Federal Urdu University',
  'NED University',
  'Dow University',
  'Jinnah University'
];

const BOARDS = [
  'Sindh Board (BISE Karachi)',
  'Aga Khan Board (AKU-EB)',
  'Cambridge International (CAIE)',
  'Federal Board (FBISE)',
  'Other'
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [saveError, setSaveError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    area: '',
    education_level: '',
    school_name: '',
    board: '',
    subjects: [], // ✅ Array of {subject: '', budget: ''}
    study_time: '',
    learning_mode: '',
    profile_picture: '',
    bio: ''
  });

  // ✅ Check if profile is complete
  const checkIfProfileSaved = (data) => {
    // ✅ Check each subject has a budget
    const hasValidSubjects = data.subjects && data.subjects.length > 0 && 
      data.subjects.every(s => {
        const name = typeof s === 'string' ? s : s.subject;
        const budget = typeof s === 'object' ? s.budget : '';
        return name && budget && budget.trim();
      });
    
    return data.phone?.trim() && 
           data.area?.trim() && 
           data.education_level?.trim() && 
           data.school_name?.trim() &&
           hasValidSubjects &&
           data.study_time?.trim() &&
           data.learning_mode?.trim();
  };

  // ✅ FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.profile) {
          let subjects = data.profile.subjects || [];
          
          if (subjects.length > 0 && typeof subjects[0] === 'string') {
            subjects = subjects.map(s => ({ subject: s, budget: '' }));
          }
          subjects = subjects.map(s => {
            if (typeof s === 'string') {
              return { subject: s, budget: '' };
            }
            return { subject: s.subject || '', budget: s.budget || '' };
          });
          
          const newFormData = {
            name: data.profile.name || user?.name || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || '',
            area: data.profile.area || data.profile.location || '',
            education_level: data.profile.education_level || '',
            school_name: data.profile.school_name || '',
            board: data.profile.board || '',
            subjects: subjects,
            study_time: data.profile.study_time || '',
            learning_mode: data.profile.learning_mode || '',
            profile_picture: data.profile.profile_picture || '',
            bio: data.profile.bio || ''
          };
          
          setFormData(newFormData);
          setProfilePicPreview(data.profile.profile_picture || '');
          
          const saved = checkIfProfileSaved(newFormData);
          setIsProfileSaved(saved);
          setIsEditMode(!saved);
        } else {
          setIsEditMode(true);
          setIsProfileSaved(false);
        }
      } catch (err) {
        console.log('Error fetching profile:', err);
        setIsEditMode(true);
        setIsProfileSaved(false);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchProfile();
    }
  }, [token, user]);

  // ✅ FETCH PROFILE STATUS
  useEffect(() => {
    const fetchStatus = async () => {
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
        console.log('Error fetching status:', err);
      }
    };
    if (token) fetchStatus();
  }, [token]);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSubject = (sub) => {
    const isSelected = formData.subjects.some(s => {
      const name = typeof s === 'string' ? s : s.subject;
      return name === sub;
    });
    
    let newSubjects;
    if (isSelected) {
      newSubjects = formData.subjects.filter(s => {
        const name = typeof s === 'string' ? s : s.subject;
        return name !== sub;
      });
    } else {
      newSubjects = [...formData.subjects, { subject: sub, budget: '' }];
    }
    setFormData({ ...formData, subjects: newSubjects });
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

  // ✅ Get completion breakdown
  const getCompletionBreakdown = () => {
    const fields = {
      '👤 Personal': [
        { label: 'Full Name', done: !!formData.name?.trim() },
        { label: 'Email', done: !!formData.email?.trim() },
        { label: 'Phone Number', done: !!formData.phone?.trim() },
        { label: 'Karachi Area', done: !!formData.area?.trim() }
      ],
      '🎓 Academic': [
        { label: 'Education Level', done: !!formData.education_level?.trim() },
        { label: 'School / College Name', done: !!formData.school_name?.trim() },
        { label: 'Board / Curriculum', done: !!formData.board?.trim() },
        { label: 'Subjects with Budget', done: formData.subjects.length > 0 && 
          formData.subjects.every(s => {
            const budget = typeof s === 'object' ? s.budget : '';
            return budget && budget.trim();
          }) },
        { label: 'Preferred Study Time', done: !!formData.study_time?.trim() },
        { label: 'Learning Mode', done: !!formData.learning_mode?.trim() }
      ],
      '✨ Optional': [
        { label: 'Profile Picture', done: !!formData.profile_picture?.trim() },
        { label: 'Learning Goal / Bio', done: !!formData.bio?.trim() }
      ]
    };
    return fields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSaveError('');
    
    try {
      // ✅ Validate each subject has budget
      for (let s of formData.subjects) {
        const name = typeof s === 'string' ? s : s.subject;
        const budget = typeof s === 'object' ? s.budget : '';
        if (!budget || !budget.trim()) {
          setSaveError(`Please select budget for "${name}"`);
          setLoading(false);
          return;
        }
      }
      
      const payload = {
        area: formData.area,
        education_level: formData.education_level,
        school_name: formData.school_name,
        board: formData.board,
        subjects: formData.subjects.map(s => ({
          subject: typeof s === 'string' ? s : s.subject,
          budget: typeof s === 'object' ? s.budget : ''
        })),
        study_time: formData.study_time,
        learning_mode: formData.learning_mode,
        phone: formData.phone,
        profile_picture: formData.profile_picture,
        bio: formData.bio,
        name: formData.name
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await fetch('/api/student/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to complete profile');
      
      setProfileStatus({ percentage: 100, is_complete: true });
      setIsEditMode(false);
      setIsProfileSaved(true);
      
      if (login) {
        login({ ...user, isProfileComplete: true, profilePercentage: 100 }, token);
      }
      
      if (refreshUser) {
        await refreshUser();
      }
      
      navigate('/student-dashboard', { 
        replace: true,
        state: { profileUpdated: true }
      });
      
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.profile) {
          const areaValue = data.profile.area || data.profile.location || '';
          
          let subjects = data.profile.subjects || [];
          if (subjects.length > 0 && typeof subjects[0] === 'string') {
            subjects = subjects.map(s => ({ subject: s, budget: '' }));
          }
          subjects = subjects.map(s => {
            if (typeof s === 'string') {
              return { subject: s, budget: '' };
            }
            return { subject: s.subject || '', budget: s.budget || '' };
          });
          
          setFormData({
            name: data.profile.name || user?.name || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || '',
            area: areaValue,
            education_level: data.profile.education_level || '',
            school_name: data.profile.school_name || '',
            board: data.profile.board || '',
            subjects: subjects,
            study_time: data.profile.study_time || '',
            learning_mode: data.profile.learning_mode || '',
            profile_picture: data.profile.profile_picture || '',
            bio: data.profile.bio || ''
          });
          setProfilePicPreview(data.profile.profile_picture || '');
        }
      } catch (err) {
        console.log('Error fetching profile:', err);
      }
    };
    fetchProfile();
    setIsEditMode(false);
  };

  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
  };

  const percentage = profileStatus.percentage || 20;
  const breakdown = getCompletionBreakdown();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f1f5f9',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      padding: '20px'
    },
    card: {
      background: 'white',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(99, 102, 241, 0.15)',
      maxWidth: '1100px',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1.5fr',
      gap: '40px',
      position: 'relative'
    },
    backButton: {
      position: 'absolute',
      top: '20px',
      left: '24px',
      background: 'none',
      border: 'none',
      color: '#6366f1',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      zIndex: 10
    },
    leftPanel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginTop: '20px'
    },
    rightPanel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '30px',
      marginTop: '20px'
    },
    header: {
      gridColumn: '1 / -1',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
      padding: '30px 40px',
      borderRadius: '16px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '20px',
      marginTop: '10px'
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    welcomeText: {
      fontSize: '26px',
      fontWeight: '700'
    },
    welcomeSubtext: {
      fontSize: '14px',
      opacity: 0.9
    },
    headerRight: {
      background: 'rgba(255,255,255,0.15)',
      padding: '15px 25px',
      borderRadius: '12px',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      minWidth: '120px'
    },
    headerPercentage: {
      fontSize: '32px',
      fontWeight: '800'
    },
    headerSubtext: {
      fontSize: '12px',
      opacity: 0.9
    },
    statusCard: {
      background: '#f8faff',
      padding: '25px',
      borderRadius: '16px',
      border: '1px solid #e8e8e8'
    },
    statusTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginBottom: '15px'
    },
    statusProgress: {
      marginBottom: '20px'
    },
    statusProgressBar: {
      background: '#e8e8e8',
      borderRadius: '10px',
      height: '8px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    statusProgressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
      borderRadius: '10px',
      transition: 'width 0.8s ease'
    },
    categorySection: {
      marginBottom: '14px'
    },
    categoryTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    categoryDivider: {
      border: 'none',
      borderTop: '1px solid #e8e8e8',
      margin: '8px 0'
    },
    checklistItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      color: '#333',
      padding: '3px 0'
    },
    checkIcon: {
      color: '#4caf50',
      fontSize: '16px'
    },
    crossIcon: {
      color: '#f44336',
      fontSize: '16px'
    },
    benefitsCard: {
      background: '#f8faff',
      padding: '25px',
      borderRadius: '16px',
      border: '1px solid #e8e8e8'
    },
    benefitsTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginBottom: '15px'
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '6px 0',
      fontSize: '14px',
      color: '#555'
    },
    benefitIcon: {
      fontSize: '18px',
      width: '28px',
      textAlign: 'center',
      flexShrink: 0
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '12px'
    },
    profilePicContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '20px',
      gap: '12px'
    },
    profilePicPreview: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '4px solid #6366f1',
      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)'
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
      border: '4px dashed #6366f1'
    },
    fileInput: {
      display: 'none'
    },
    uploadButton: {
      padding: '10px 24px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    formGroup: {
      marginBottom: '18px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '6px'
    },
    labelRequired: {
      color: '#f44336',
      marginLeft: '4px'
    },
    labelInfo: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '400',
      marginLeft: '6px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    inputReadonly: {
      backgroundColor: '#f0f0f0',
      cursor: 'not-allowed',
      color: '#666'
    },
    inputError: {
      border: '2px solid #f44336',
      backgroundColor: '#fff5f5'
    },
    errorText: {
      color: '#f44336',
      fontSize: '12px',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      marginTop: '4px'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#1f1f3e',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '2px solid #e8e8e8',
      transition: 'all 0.3s',
      backgroundColor: '#fafaff'
    },
    radioLabelSelected: {
      borderColor: '#6366f1',
      backgroundColor: '#f0f4ff',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)'
    },
    radioInput: {
      accentColor: '#6366f1',
      width: '16px',
      height: '16px',
      cursor: 'pointer'
    },
    checkboxGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      color: '#333',
      cursor: 'pointer',
      padding: '10px 14px',
      borderRadius: '10px',
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
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      minHeight: '80px',
      resize: 'vertical',
      transition: 'all 0.3s'
    },
    viewValue: {
      padding: '12px 16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
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
    subjectBudgetRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '10px 0',
      borderBottom: '1px solid #f0f0f0',
      flexWrap: 'wrap'
    },
    subjectBudgetName: {
      fontSize: '15px',
      fontWeight: '500',
      color: '#1f1f3e',
      minWidth: '120px'
    },
    btn: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '17px',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '10px',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    btnDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    btnSecondary: {
      width: '100%',
      padding: '16px',
      background: 'white',
      color: '#6366f1',
      border: '2px solid #6366f1',
      borderRadius: '12px',
      fontSize: '17px',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    btnGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '10px'
    },
    btnGroupItem: {
      flex: 1
    },
    editButtonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '10px',
      gap: '12px',
      flexWrap: 'wrap'
    },
    editButton: {
      padding: '14px 40px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    backToDashboardBtn: {
      padding: '14px 40px',
      background: 'white',
      color: '#6366f1',
      border: '2px solid #6366f1',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    modeDisplay: {
      padding: '12px 16px',
      backgroundColor: '#e8f5e9',
      borderRadius: '12px',
      border: '2px solid #4caf50',
      fontSize: '14px',
      color: '#2e7d32',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    modeDisplayEmpty: {
      padding: '12px 16px',
      backgroundColor: '#fff3e0',
      borderRadius: '12px',
      border: '2px solid #ff9800',
      fontSize: '14px',
      color: '#e65100',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    phonePrefix: {
      padding: '10px 14px',
      background: '#f0f0f0',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
      border: '2px solid #e8e8e8',
      borderRight: 'none',
      borderTopRightRadius: '0',
      borderBottomRightRadius: '0',
      whiteSpace: 'nowrap'
    },
    phoneInput: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      borderTopLeftRadius: '0',
      borderBottomLeftRadius: '0'
    },
    infoNote: {
      fontSize: '12px',
      color: '#6366f1',
      backgroundColor: '#f0f4ff',
      padding: '8px 14px',
      borderRadius: '8px',
      marginTop: '6px',
      border: '1px solid #e0e7ff'
    },
    infoText: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
    },
    saveError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #fca5a5',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  const getInitial = () => user?.name?.charAt(0)?.toUpperCase() || '?';

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

  // ✅ Render subjects with budgets
  const renderSubjectsView = (subjects) => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>Subjects & Budget</label>
        <div style={styles.viewValue}>
          {subjects.length > 0 ? (
            subjects.map((s, i) => {
              const name = typeof s === 'string' ? s : s.subject;
              const budget = typeof s === 'object' ? s.budget : '';
              return (
                <span key={i} style={{
                  background: '#e0e7ff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#6366f1',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📚 {name}
                  {budget && <span style={{ fontSize: '11px', color: '#4f46e5' }}>💰 {budget}</span>}
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

  const renderModeView = (mode) => {
    if (mode && mode.trim()) {
      return (
        <div style={styles.modeDisplay}>
          <span>✅</span> {mode}
        </div>
      );
    }
    return (
      <div style={styles.modeDisplayEmpty}>
        <span>⚠️</span> Not selected
      </div>
    );
  };

  if (loading && !formData.name) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontSize: '18px', color: '#666' }}>Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* ✅ Back Button */}
        {location.state?.from && (
          <BackButton label="← Back" fallbackPath="/student-dashboard" />
        )}

        <button
          style={styles.backButton}
          onClick={handleBackToDashboard}
          onMouseEnter={(e) => {
            e.target.style.background = '#f0f4ff';
            e.target.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.transform = 'translateX(0)';
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.welcomeText}>
              {!isProfileSaved ? '📝 Complete Your Student Profile' : '👋 Welcome, ' + (formData.name || 'Student') + '!'}
            </div>
            <div style={styles.welcomeSubtext}>
              {!isProfileSaved
                ? 'Complete your profile to receive AI-powered tutor recommendations.'
                : isEditMode
                  ? 'Edit your profile information below.'
                  : 'Your profile is complete. You can edit it anytime.'}
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerPercentage}>{percentage}%</div>
            <div style={styles.headerSubtext}>Profile Complete</div>
          </div>
        </div>

        <div style={styles.leftPanel}>
          <div style={styles.statusCard}>
            <div style={styles.statusTitle}>📋 Profile Status</div>
            
            <div style={styles.statusProgress}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Progress</span>
                <span>{percentage}%</span>
              </div>
              <div style={styles.statusProgressBar}>
                <div style={{ ...styles.statusProgressFill, width: `${percentage}%` }}></div>
              </div>
            </div>

            {Object.entries(breakdown).map(([category, items], idx) => (
              <div key={idx} style={styles.categorySection}>
                <div style={styles.categoryTitle}>{category}</div>
                {items.map((item, i) => (
                  <div key={i} style={styles.checklistItem}>
                    <span style={item.done ? styles.checkIcon : styles.crossIcon}>
                      {item.done ? '✓' : '✗'}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
                {idx < Object.keys(breakdown).length - 1 && (
                  <hr style={styles.categoryDivider} />
                )}
              </div>
            ))}
          </div>

          <div style={styles.benefitsCard}>
            <div style={styles.benefitsTitle}>🚀 Why Complete Your Profile?</div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>🤖</span>
              <span>Get AI Tutor Recommendations</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>📈</span>
              <span>Higher Match Percentage</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>⚡</span>
              <span>Faster Enrollment</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>✅</span>
              <span>Connect with Verified Teachers</span>
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          {saveError && (
            <div style={styles.saveError}>❌ {saveError}</div>
          )}

          <div>
            <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
            
            <div style={styles.profilePicContainer}>
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Profile" style={styles.profilePicPreview} />
              ) : (
                <div style={styles.profilePicPlaceholder}>{getInitial()}</div>
              )}
              {isEditMode ? (
                <button
                  type="button"
                  style={styles.uploadButton}
                  onClick={() => document.getElementById('profilePicInput').click()}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📸 Upload Photo
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {profilePicPreview ? '✅ Profile picture set' : 'No profile picture'}
                </span>
              )}
              <input
                type="file"
                id="profilePicInput"
                accept="image/*"
                style={styles.fileInput}
                onChange={handleImageChange}
                disabled={!isEditMode}
              />
            </div>

            {isEditMode ? (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    style={styles.input}
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address (Read Only)</label>
                  <input
                    type="email"
                    value={formData.email}
                    style={{...styles.input, ...styles.inputReadonly}}
                    disabled
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number <span style={styles.labelRequired}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={styles.phonePrefix}>🇵🇰 +92</span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          updateField('phone', val);
                        }
                      }}
                      style={{
                        ...styles.phoneInput,
                        ...(!formData.phone?.trim() && !loading ? styles.inputError : {})
                      }}
                      placeholder="3123456789"
                      maxLength="10"
                    />
                  </div>
                  {!formData.phone?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Phone Number is required (10 digits)</div>
                  )}
                  <div style={styles.infoText}>Pakistan format only. Accept 10 digits after +92.</div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Area (Karachi) <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.area?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value)}
                  >
                    <option value="">Select your area</option>
                    {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {!formData.area?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Area is required</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {renderViewField('Full Name', formData.name)}
                {renderViewField('Email Address', formData.email)}
                {renderViewField('Phone Number', formData.phone ? `+92${formData.phone}` : 'Not provided')}
                {renderViewField('Area (Karachi)', formData.area || 'Not provided')}
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>🎓 Academic Information</h3>

            {isEditMode ? (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Education Level <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.education_level?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.education_level}
                    onChange={(e) => updateField('education_level', e.target.value)}
                  >
                    <option value="">Select your education level</option>
                    {EDUCATION_LEVELS.map(el => <option key={el} value={el}>{el}</option>)}
                  </select>
                  {!formData.education_level?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Education Level is required</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>School / College Name <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.school_name?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.school_name}
                    onChange={(e) => updateField('school_name', e.target.value)}
                  >
                    <option value="">Select your school / college</option>
                    {KARACHI_SCHOOLS.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                  {!formData.school_name?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ School / College Name is required</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Board / Curriculum <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.board?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.board}
                    onChange={(e) => updateField('board', e.target.value)}
                  >
                    <option value="">Select your board</option>
                    {BOARDS.map(board => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                  {!formData.board?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Board / Curriculum is required</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {renderViewField('Education Level', formData.education_level || 'Not provided')}
                {renderViewField('School / College Name', formData.school_name || 'Not provided')}
                {renderViewField('Board / Curriculum', formData.board || 'Not provided')}
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>📚 Learning Requirements</h3>

            {isEditMode ? (
              <>
                {/* ✅ Subjects with Budget - Monthly Budget REMOVED */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subjects Required <span style={styles.labelRequired}>*</span></label>
                  <div style={styles.checkboxGrid}>
                    {SUBJECTS.map(sub => {
                      const isSelected = formData.subjects.some(s => {
                        const name = typeof s === 'string' ? s : s.subject;
                        return name === sub;
                      });
                      return (
                        <label
                          key={sub}
                          style={{
                            ...styles.checkboxLabel,
                            ...(isSelected ? styles.checkboxLabelSelected : {})
                          }}
                        >
                          <input
                            type="checkbox"
                            style={styles.checkbox}
                            checked={isSelected}
                            onChange={() => toggleSubject(sub)}
                            disabled={!isEditMode}
                          />
                          {sub}
                        </label>
                      );
                    })}
                  </div>
                  {formData.subjects.length === 0 && !loading && (
                    <div style={styles.errorText}>⚠ At least 1 subject is required</div>
                  )}
                  
                  {/* ✅ Subject-wise Budget Dropdowns */}
                  {formData.subjects.length > 0 && isEditMode && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px', 
                      background: '#f8faff', 
                      borderRadius: '12px', 
                      border: '1px solid #e8e8e8' 
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1f1f3e', 
                        marginBottom: '12px' 
                      }}>
                        📊 Monthly Budget for Each Subject
                      </div>
                      {formData.subjects.map((s, index) => {
                        const subjectName = typeof s === 'string' ? s : s.subject;
                        const currentBudget = typeof s === 'object' ? s.budget : '';
                        return (
                          <div key={index} style={styles.subjectBudgetRow}>
                            <span style={styles.subjectBudgetName}>{subjectName}</span>
                            <select
                              style={{
                                ...styles.select,
                                ...(!currentBudget && !loading ? styles.inputError : {}),
                                flex: 1,
                                minWidth: '140px',
                                padding: '8px 12px',
                                fontSize: '13px'
                              }}
                              value={currentBudget}
                              onChange={(e) => {
                                const newSubjects = formData.subjects.map((item) => {
                                  const name = typeof item === 'string' ? item : item.subject;
                                  if (name === subjectName) {
                                    return { subject: name, budget: e.target.value };
                                  }
                                  return typeof item === 'string' ? { subject: item, budget: '' } : item;
                                });
                                setFormData({ ...formData, subjects: newSubjects });
                              }}
                              disabled={!isEditMode}
                            >
                              <option value="">Select Budget</option>
                              {SUBJECT_BUDGET_RANGES.map(range => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Preferred Study Time <span style={styles.labelRequired}>*</span>
                    <span style={styles.labelInfo}>(AI Matching Only)</span>
                  </label>
                  <div style={styles.radioGroup}>
                    {STUDY_TIMES.map(time => (
                      <label
                        key={time}
                        style={{
                          ...styles.radioLabel,
                          ...(formData.study_time === time ? styles.radioLabelSelected : {})
                        }}
                      >
                        <input
                          type="radio"
                          name="study_time"
                          value={time}
                          checked={formData.study_time === time}
                          onChange={(e) => updateField('study_time', e.target.value)}
                          style={styles.radioInput}
                        />
                        {time}
                      </label>
                    ))}
                  </div>
                  {!formData.study_time?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Preferred Study Time is required</div>
                  )}
                  <div style={styles.infoNote}>
                    💡 This field is ONLY used for AI Recommendation Matching.
                    Teacher schedules use exact time slots.
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Learning Mode <span style={styles.labelRequired}>*</span></label>
                  <div style={styles.radioGroup}>
                    {LEARNING_MODES.map(mode => (
                      <label
                        key={mode}
                        style={{
                          ...styles.radioLabel,
                          ...(formData.learning_mode === mode ? styles.radioLabelSelected : {})
                        }}
                      >
                        <input
                          type="radio"
                          name="learning_mode"
                          value={mode}
                          checked={formData.learning_mode === mode}
                          onChange={(e) => updateField('learning_mode', e.target.value)}
                          style={styles.radioInput}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                  {!formData.learning_mode?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Learning Mode is required</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {renderSubjectsView(formData.subjects)}
                {renderViewField('Preferred Study Time', formData.study_time || 'Not provided')}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Learning Mode</label>
                  {renderModeView(formData.learning_mode)}
                </div>
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>✨ Optional</h3>

            {isEditMode ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>Learning Goal / Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  style={styles.textarea}
                  placeholder="Example: I am preparing for Matric Board Exams and looking for a Mathematics tutor."
                />
                <div style={styles.infoText}>
                  Adding a bio helps teachers understand your learning goals
                </div>
              </div>
            ) : (
              renderViewField('Learning Goal / Bio', formData.bio || 'No bio added yet')
            )}
          </div>

          {!isProfileSaved ? (
            <button
              type="submit"
              style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
              disabled={loading}
              onClick={handleSubmit}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Saving...' : '💾 Save Profile'}
            </button>
          ) : isEditMode ? (
            <div style={styles.btnGroup}>
              <div style={styles.btnGroupItem}>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                  disabled={loading}
                  onClick={handleSubmit}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
              <div style={styles.btnGroupItem}>
                <button
                  style={styles.btnSecondary}
                  onClick={handleCancel}
                  onMouseEnter={(e) => e.target.style.background = '#f0f4ff'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.editButtonContainer}>
              <button
                style={styles.editButton}
                onClick={handleEdit}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ✏️ Edit Profile
              </button>
              <button
                style={styles.backToDashboardBtn}
                onClick={handleBackToDashboard}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f0f4ff';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;