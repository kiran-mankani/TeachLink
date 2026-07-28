import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const KARACHI_AREAS = ['Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'DHA', 'Clifton', 'Federal B Area', 'Malir', 'Korangi', 'Saddar', 'Gulberg', 'Nazimabad', 'Liaquatabad', 'Karachi City', 'Others'];

const QUALIFICATIONS = [
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'MPhil',
  'BS (Hons)',
  'B.Ed',
  'M.Ed',
  'Certification'
];

// ✅ SUBJECT LIST FOR AUTOCOMPLETE
const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'Urdu', 'Islamiat', 'Pak Studies', 'Economics',
  'Accounting', 'Business Studies', 'Statistics', 'Computer Programming',
  'Software Engineering', 'Data Science', 'Artificial Intelligence',
  'Machine Learning', 'Web Development', 'Mobile App Development',
  'Cybersecurity', 'Networking', 'Database Management',
  'Graphic Design', 'Digital Marketing', 'Finance', 'Management',
  'Psychology', 'Sociology', 'History', 'Geography', 'Political Science',
  'Philosophy', 'Literature', 'Creative Writing', 'Journalism',
  'Law', 'Medicine', 'Nursing', 'Pharmacy', 'Dentistry',
  'Architecture', 'Civil Engineering', 'Mechanical Engineering',
  'Electrical Engineering', 'Electronics', 'Telecommunication'
];

const TEACHING_LEVELS = [
  'Primary (Class 1-5)',
  'Middle (Class 6-8)',
  'Matric / O Level',
  'Intermediate / A Level',
  "Bachelor's",
  "Master's"
];

const TEACHING_MODES = ['Online', 'Physical', 'Both'];

const TeacherCompleteProfile = () => {
  const navigate = useNavigate();
  const { token, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [saveError, setSaveError] = useState('');
  
  // ✅ NEW: Subject search state
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    qualification: '',
    experience: '',
    subjects: [], // ✅ Array of {subject: '', fee: ''}
    teaching_levels: [],
    teaching_mode: '',
    profile_picture: '',
    bio: ''
  });

  // ✅ NEW: Filter subjects based on search
  useEffect(() => {
    if (subjectSearch.trim()) {
      const searchLower = subjectSearch.toLowerCase().trim();
      const filtered = SUBJECTS.filter(sub => 
        sub.toLowerCase().includes(searchLower) &&
        !formData.subjects.some(s => s.subject === sub)
      );
      setFilteredSubjects(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSubjects([]);
      setShowSuggestions(false);
    }
  }, [subjectSearch, formData.subjects]);

  // ✅ NEW: Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ NEW: Add subject from autocomplete
  const addSubject = (subject) => {
    if (formData.subjects.some(s => s.subject === subject)) {
      alert(`"${subject}" is already added`);
      return;
    }
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { subject, fee: '' }]
    });
    setSubjectSearch('');
    setShowSuggestions(false);
  };

  // ✅ NEW: Remove subject
  const removeSubject = (index) => {
    if (formData.subjects.length <= 1) {
      alert('You must have at least one subject');
      return;
    }
    const updated = [...formData.subjects];
    updated.splice(index, 1);
    setFormData({ ...formData, subjects: updated });
  };

  // ✅ NEW: Update subject fee
  const updateSubjectFee = (index, value) => {
    const updated = [...formData.subjects];
    updated[index].fee = value;
    setFormData({ ...formData, subjects: updated });
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleTeachingLevel = (level) => {
    const current = formData.teaching_levels.includes(level)
      ? formData.teaching_levels.filter(l => l !== level)
      : [...formData.teaching_levels, level];
    updateField('teaching_levels', current);
  };

  const checkIfProfileSaved = (data) => {
    const hasValidSubjects = data.subjects && data.subjects.length > 0 && 
      data.subjects.every(s => s.subject && s.subject.trim() && s.fee && parseFloat(s.fee) > 0);
    
    return data.phone?.trim() && 
           data.location?.trim() && 
           data.qualification?.trim() && 
           data.experience?.trim() && 
           hasValidSubjects &&
           data.teaching_levels?.length > 0 && 
           data.teaching_mode?.trim();
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
          
          // ✅ Convert old string format to new format
          if (subjects.length > 0 && typeof subjects[0] === 'string') {
            subjects = subjects.map(s => ({ subject: s, fee: '' }));
          }
          
          // ✅ Ensure each subject has fee field
          subjects = subjects.map(s => {
            if (typeof s === 'string') {
              return { subject: s, fee: '' };
            }
            return { subject: s.subject || '', fee: s.fee || '' };
          });
          
          const newFormData = {
            name: data.profile.name || user?.name || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || '',
            location: data.profile.location || data.profile.area || '',
            qualification: data.profile.qualification || '',
            experience: data.profile.experience || '',
            subjects: subjects,
            teaching_levels: data.profile.teaching_levels || [],
            teaching_mode: data.profile.teaching_mode || '',
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
        const response = await fetch('/api/teacher/profile-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const isComplete = data.is_complete || data.percentage >= 98;
          setProfileStatus({
            percentage: isComplete ? 100 : data.percentage || 20,
            is_complete: isComplete
          });
        }
      } catch (err) {
        console.log('Error fetching status:', err);
      }
    };
    if (token) fetchStatus();
  }, [token]);

  // ✅ Get completion breakdown
  const getCompletionBreakdown = () => {
    const fields = {
      '👤 Personal': [
        { label: 'Full Name', done: !!formData.name?.trim() },
        { label: 'Email', done: !!formData.email?.trim() },
        { label: 'Phone Number', done: !!formData.phone?.trim() },
        { label: 'Karachi Area', done: !!formData.location?.trim() }
      ],
      '🎓 Professional': [
        { label: 'Qualification', done: !!formData.qualification?.trim() },
        { label: 'Experience', done: !!formData.experience?.trim() },
        { label: 'Subjects with Fees', done: formData.subjects.length > 0 && 
          formData.subjects.every(s => s.subject?.trim() && parseFloat(s.fee) > 0) },
        { label: 'Teaching Levels', done: formData.teaching_levels.length > 0 },
        { label: 'Teaching Mode', done: !!formData.teaching_mode?.trim() }
      ],
      '✨ Optional': [
        { label: 'Profile Picture', done: !!formData.profile_picture?.trim() },
        { label: 'Bio', done: !!formData.bio?.trim() }
      ]
    };
    return fields;
  };

  // ✅ Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    // ✅ Validate subjects with fees
    for (let s of formData.subjects) {
      if (!s.subject || !s.subject.trim()) {
        setSaveError('Please enter subject name for all subjects');
        return;
      }
      if (!s.fee || parseFloat(s.fee) <= 0) {
        setSaveError(`Please enter valid fee for "${s.subject}"`);
        return;
      }
    }
    
    setLoading(true);
    setSaveError('');
    
    try {
      const payload = {
        phone: formData.phone,
        location: formData.location,
        qualification: formData.qualification,
        experience: formData.experience,
        subjects: formData.subjects.map(s => ({
          subject: s.subject.trim(),
          fee: parseFloat(s.fee)
        })),
        teaching_levels: formData.teaching_levels,
        teaching_mode: formData.teaching_mode,
        profile_picture: formData.profile_picture,
        bio: formData.bio
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await fetch('/api/teacher/complete-profile', {
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
      
      if (refreshUser) {
        await refreshUser();
      }
      
      navigate('/teacher-dashboard', {
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
          let subjects = data.profile.subjects || [];
          if (subjects.length > 0 && typeof subjects[0] === 'string') {
            subjects = subjects.map(s => ({ subject: s, fee: '' }));
          }
          subjects = subjects.map(s => {
            if (typeof s === 'string') {
              return { subject: s, fee: '' };
            }
            return { subject: s.subject || '', fee: s.fee || '' };
          });
          
          setFormData({
            name: data.profile.name || user?.name || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || '',
            location: data.profile.location || data.profile.area || '',
            qualification: data.profile.qualification || '',
            experience: data.profile.experience || '',
            subjects: subjects,
            teaching_levels: data.profile.teaching_levels || [],
            teaching_mode: data.profile.teaching_mode || '',
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
    navigate('/teacher-dashboard');
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
    // ✅ NEW: Subject Search Styles
    subjectSearchContainer: {
      position: 'relative',
      marginBottom: '12px'
    },
    subjectSearchInput: {
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
    suggestionsList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '2px solid #e8e8e8',
      borderTop: 'none',
      borderRadius: '0 0 12px 12px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    suggestionItem: {
      padding: '10px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.2s',
      borderBottom: '1px solid #f5f5f5'
    },
    suggestionItemHover: {
      backgroundColor: '#f0f4ff',
      color: '#6366f1'
    },
    noSuggestions: {
      padding: '10px 16px',
      color: '#94a3b8',
      fontSize: '14px',
      fontStyle: 'italic'
    },
    // ✅ NEW: Subject Card Styles
    subjectCard: {
      background: '#f8faff',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    subjectCardName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f1f3e',
      minWidth: '160px',
      flex: '0 0 auto'
    },
    subjectCardFee: {
      flex: 1,
      minWidth: '140px'
    },
    subjectCardFeeInput: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif'
    },
    removeSubjectBtn: {
      padding: '8px 16px',
      background: '#fee2e2',
      color: '#dc2626',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.3s',
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    subjectCount: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
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
    saveError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #fca5a5',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '500'
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
    }
  };

  const renderSubjectsView = (subjects) => {
    if (!subjects || subjects.length === 0) {
      return <span style={styles.viewValueEmpty}>No subjects added</span>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {subjects.map((s, idx) => {
          const subjectName = typeof s === 'string' ? s : s.subject;
          const fee = typeof s === 'string' ? '' : s.fee;
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontWeight: '500' }}>{subjectName || 'Subject'}</span>
              <span style={{ color: '#6366f1', fontWeight: '600' }}>
                {fee ? `Rs. ${fee}/month` : 'Fee not set'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTeachingLevelsView = (levels) => {
    if (!levels || levels.length === 0) {
      return <span style={styles.viewValueEmpty}>No levels selected</span>;
    }
    return levels.map((l, i) => (
      <span key={i} style={{
        background: '#e0e7ff',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        color: '#6366f1',
        fontWeight: '500'
      }}>
        {l}
      </span>
    ));
  };

  const getInitial = () => user?.name?.charAt(0)?.toUpperCase() || '?';

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
              {!isProfileSaved ? '📝 Complete Your Teacher Profile' : '👋 Welcome, ' + (formData.name || 'Teacher') + '!'}
            </div>
            <div style={styles.welcomeSubtext}>
              {!isProfileSaved
                ? 'Complete your profile to start receiving student requests.'
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
              <span style={styles.benefitIcon}>👨‍🎓</span>
              <span>Get Student Enrollment Requests</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>📈</span>
              <span>AI-Powered Matching with Students</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>⚡</span>
              <span>Faster Enrollment & Earnings</span>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.benefitIcon}>✅</span>
              <span>Verified Teacher Badge</span>
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
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Pakistan format only. Accept 10 digits after +92.
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Area (Karachi) <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.location?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  >
                    <option value="">Select your area</option>
                    {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {!formData.location?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Area is required</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {renderViewField('Full Name', formData.name)}
                {renderViewField('Email Address', formData.email)}
                {renderViewField('Phone Number', formData.phone ? `+92${formData.phone}` : 'Not provided')}
                {renderViewField('Area (Karachi)', formData.location || 'Not provided')}
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>🎓 Professional Information</h3>

            {isEditMode ? (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Qualification <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.qualification?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.qualification}
                    onChange={(e) => updateField('qualification', e.target.value)}
                  >
                    <option value="">Select your qualification</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  {!formData.qualification?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Qualification is required</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Experience <span style={styles.labelRequired}>*</span></label>
                  <select
                    style={{
                      ...styles.select,
                      ...(!formData.experience?.trim() && !loading ? styles.inputError : {})
                    }}
                    value={formData.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                  >
                    <option value="">Select your experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="6-10 years">6-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                  {!formData.experience?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Experience is required</div>
                  )}
                </div>

                {/* ✅ NEW: Searchable Subject Selector with Autocomplete */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Subjects & Monthly Fees <span style={styles.labelRequired}>*</span>
                    <span style={styles.labelInfo}>(Search and add subjects)</span>
                  </label>
                  
                  {/* ✅ Search Input with Autocomplete */}
                  <div style={styles.subjectSearchContainer}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      style={styles.subjectSearchInput}
                      placeholder="🔍 Type to search subjects (e.g. 'Computer', 'Physics')"
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      onFocus={() => {
                        if (subjectSearch.trim()) setShowSuggestions(true);
                      }}
                      disabled={!isEditMode}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredSubjects.length > 0) {
                          addSubject(filteredSubjects[0]);
                          e.preventDefault();
                        }
                      }}
                    />
                    
                    {/* ✅ Suggestions Dropdown */}
                    {showSuggestions && isEditMode && (
                      <div ref={suggestionsRef} style={styles.suggestionsList}>
                        {filteredSubjects.length > 0 ? (
                          filteredSubjects.map((sub, idx) => (
                            <div
                              key={idx}
                              style={styles.suggestionItem}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#f0f4ff';
                                e.target.style.color = '#6366f1';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#333';
                              }}
                              onClick={() => addSubject(sub)}
                            >
                              {sub}
                            </div>
                          ))
                        ) : (
                          <div style={styles.noSuggestions}>
                            {subjectSearch.trim() ? 'No matching subjects found' : 'Start typing to search subjects'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ✅ Subject Cards with Fee Inputs */}
                  {formData.subjects.map((subjectItem, index) => (
                    <div key={index} style={styles.subjectCard}>
                      <span style={styles.subjectCardName}>
                        {subjectItem.subject}
                      </span>
                      <div style={styles.subjectCardFee}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                          Monthly Fee (Rs.)
                        </label>
                        <input
                          type="number"
                          style={styles.subjectCardFeeInput}
                          placeholder="Enter fee"
                          value={subjectItem.fee}
                          onChange={(e) => updateSubjectFee(index, e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                          onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                          min="1"
                          disabled={!isEditMode}
                        />
                        {subjectItem.fee && parseFloat(subjectItem.fee) <= 0 && (
                          <div style={styles.errorText}>⚠ Fee must be greater than 0</div>
                        )}
                      </div>
                      <button
                        type="button"
                        style={styles.removeSubjectBtn}
                        onClick={() => removeSubject(index)}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#fee2e2';
                        }}
                        disabled={!isEditMode}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                  
                  <div style={styles.subjectCount}>
                    {formData.subjects.length > 0 
                      ? `${formData.subjects.length} subject${formData.subjects.length > 1 ? 's' : ''} added` 
                      : 'No subjects added yet'}
                  </div>
                </div>
              </>
            ) : (
              <>
                {renderViewField('Qualification', formData.qualification || 'Not provided')}
                {renderViewField('Experience', formData.experience || 'Not provided')}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subjects & Monthly Fees</label>
                  <div style={styles.viewValue}>
                    {renderSubjectsView(formData.subjects)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>📚 Teaching Preferences</h3>

            {isEditMode ? (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Levels <span style={styles.labelRequired}>*</span></label>
                  <div style={styles.checkboxGrid}>
                    {TEACHING_LEVELS.map(level => {
                      const isSelected = formData.teaching_levels.includes(level);
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
                          />
                          {level}
                        </label>
                      );
                    })}
                  </div>
                  {formData.teaching_levels.length === 0 && !loading && (
                    <div style={styles.errorText}>⚠ At least 1 teaching level is required</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Mode <span style={styles.labelRequired}>*</span></label>
                  <div style={styles.radioGroup}>
                    {TEACHING_MODES.map(mode => (
                      <label
                        key={mode}
                        style={{
                          ...styles.radioLabel,
                          ...(formData.teaching_mode === mode ? styles.radioLabelSelected : {})
                        }}
                      >
                        <input
                          type="radio"
                          name="teaching_mode"
                          value={mode}
                          checked={formData.teaching_mode === mode}
                          onChange={(e) => updateField('teaching_mode', e.target.value)}
                          style={styles.radioInput}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                  {!formData.teaching_mode?.trim() && !loading && (
                    <div style={styles.errorText}>⚠ Teaching Mode is required</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teaching Levels</label>
                  <div style={styles.viewValue}>
                    {renderTeachingLevelsView(formData.teaching_levels)}
                  </div>
                </div>
                {renderViewField('Teaching Mode', formData.teaching_mode || 'Not provided')}
              </>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>✨ Optional</h3>

            {isEditMode ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>Bio / About You</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  style={styles.textarea}
                  placeholder="Example: I am a passionate Mathematics teacher with 5 years of experience..."
                />
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Adding a bio helps students understand your teaching style
                </div>
              </div>
            ) : (
              renderViewField('Bio / About You', formData.bio || 'No bio added yet')
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

const renderViewField = (label, value, emptyText = 'Not provided') => {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1f1f3e', marginBottom: '6px' }}>{label}</label>
      <div style={{
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
      }}>
        {value ? value : <span style={{ color: '#999', fontStyle: 'italic' }}>{emptyText}</span>}
      </div>
    </div>
  );
};

export default TeacherCompleteProfile;