// frontend/src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
// ✅ REMOVED: KARACHI_AREAS import - no longer needed

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // ✅ REMOVED: location field
    termsAccepted: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept terms and conditions';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const data = await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: role
        // ✅ REMOVED: location field
      });

      if (role === 'student') navigate('/student-dashboard');
      else if (role === 'teacher') navigate('/teacher-dashboard');

    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Styles (same as before)
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Poppins', 'Segoe UI', 'Nunito Sans', sans-serif",
      background: '#f0f4ff',
      overflow: 'hidden'
    },
    leftSide: {
      flex: '1',
      background: 'linear-gradient(135deg, #4a3aff, #6c5ce7)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingTop: '40px',
      paddingLeft: '60px',
      paddingRight: '60px',
      paddingBottom: '60px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100vh'
    },
    leftBgDecor1: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '50%',
      top: '-200px',
      right: '-200px',
      animation: 'float 8s ease-in-out infinite'
    },
    leftBgDecor2: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '50%',
      bottom: '-100px',
      left: '-100px',
      animation: 'float 10s ease-in-out infinite reverse'
    },
    leftBgDecor3: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '50%',
      top: '30%',
      right: '10%',
      animation: 'float 12s ease-in-out infinite'
    },
    leftContent: {
      position: 'relative',
      zIndex: 2,
      maxWidth: '500px',
      textAlign: 'center',
      animation: 'slideInLeft 0.8s ease-out',
      marginTop: '10px'
    },
    leftLogo: {
      fontSize: '60px',
      marginBottom: '15px'
    },
    leftTitle: {
      fontSize: '42px',
      fontWeight: '800',
      marginBottom: '12px',
      lineHeight: '1.2',
      color: 'white'
    },
    leftSubtitle: {
      fontSize: '18px',
      opacity: '0.9',
      lineHeight: '1.8',
      marginBottom: '25px',
      color: 'white'
    },
    leftFeatures: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'flex-start',
      marginTop: '15px'
    },
    leftFeature: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '16px',
      opacity: '0.95'
    },
    leftFeatureIcon: {
      background: 'rgba(255,255,255,0.15)',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px'
    },
    leftStats: {
      display: 'flex',
      gap: '40px',
      marginTop: '30px',
      justifyContent: 'center'
    },
    leftStat: {
      textAlign: 'center'
    },
    leftStatNumber: {
      fontSize: '32px',
      fontWeight: '700',
      display: 'block'
    },
    leftStatLabel: {
      fontSize: '14px',
      opacity: '0.8'
    },
    rightSide: {
      flex: '1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      background: 'white',
      minHeight: '100vh',
      animation: 'slideInRight 0.8s ease-out'
    },
    card: {
      width: '100%',
      maxWidth: '440px',
      padding: '20px 10px'
    },
    backButton: {
      background: 'none',
      border: 'none',
      fontSize: '16px',
      color: '#4a3aff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '25px',
      fontWeight: '500',
      transition: 'all 0.3s'
    },
    formTitle: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#4a3aff',
      marginBottom: '4px'
    },
    formSubtitle: {
      color: '#666',
      fontSize: '15px',
      marginBottom: '15px'
    },
    roleContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '18px',
      justifyContent: 'center'
    },
    roleOption: {
      flex: '1',
      padding: '10px 8px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '13px',
      fontWeight: '500',
      color: '#666',
      background: '#f8f9ff',
      fontFamily: 'inherit'
    },
    roleSelected: {
      borderColor: '#4a3aff',
      background: '#eef0ff',
      color: '#4a3aff',
      boxShadow: '0 0 0 3px rgba(74, 58, 255, 0.1)'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '5px'
    },
    inputWrapper: {
      position: 'relative',
      width: '100%'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'all 0.3s',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit'
    },
    inputError: {
      borderColor: '#ff4757',
      backgroundColor: '#fff5f5'
    },
    eyeIcon: {
      position: 'absolute',
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#999',
      background: 'none',
      border: 'none',
      padding: '0',
      userSelect: 'none'
    },
    errorText: {
      color: '#ff4757',
      fontSize: '12px',
      marginTop: '3px',
      display: 'block',
      fontWeight: '500'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'all 0.3s',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#f8f9ff',
      fontFamily: 'inherit',
      color: '#333'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginTop: '2px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      marginTop: '1px',
      cursor: 'pointer',
      accentColor: '#4a3aff'
    },
    checkboxLabel: {
      fontSize: '13px',
      color: '#555',
      lineHeight: '1.5'
    },
    linkText: {
      color: '#4a3aff',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #4a3aff, #6c5ce7)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '17px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 8px 25px rgba(74, 58, 255, 0.3)',
      marginTop: '6px',
      fontFamily: 'inherit'
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '18px 0',
      gap: '15px'
    },
    dividerLine: {
      flex: '1',
      height: '1px',
      background: '#e8e8e8'
    },
    dividerText: {
      color: '#999',
      fontSize: '13px',
      fontWeight: '500'
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '18px',
      fontSize: '14px',
      color: '#666',
      fontWeight: '400'
    }
  };

  const animationStyle = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-30px) rotate(5deg); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-60px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(60px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{animationStyle}</style>
      <div style={styles.leftSide}>
        <div style={styles.leftBgDecor1}></div>
        <div style={styles.leftBgDecor2}></div>
        <div style={styles.leftBgDecor3}></div>
        <div style={styles.leftContent}>
          <div style={styles.leftLogo}>🎓</div>
          <h1 style={styles.leftTitle}>Create Your Account</h1>
          <p style={styles.leftSubtitle}>Join TeachLink and start your learning journey today. Connect with expert tutors and achieve your academic goals.</p>
          <div style={styles.leftFeatures}>
            <div style={styles.leftFeature}><span style={styles.leftFeatureIcon}>👨‍🏫</span><span>500+ Qualified Tutors</span></div>
            <div style={styles.leftFeature}><span style={styles.leftFeatureIcon}>📚</span><span>2000+ Active Students</span></div>
            <div style={styles.leftFeature}><span style={styles.leftFeatureIcon}>⭐</span><span>98% Satisfaction Rate</span></div>
            <div style={styles.leftFeature}><span style={styles.leftFeatureIcon}>🔒</span><span>Secure & Trusted Platform</span></div>
          </div>
          <div style={styles.leftStats}>
            <div style={styles.leftStat}><span style={styles.leftStatNumber}>500+</span><span style={styles.leftStatLabel}>Tutors</span></div>
            <div style={styles.leftStat}><span style={styles.leftStatNumber}>2000+</span><span style={styles.leftStatLabel}>Students</span></div>
            <div style={styles.leftStat}><span style={styles.leftStatNumber}>98%</span><span style={styles.leftStatLabel}>Satisfaction</span></div>
          </div>
        </div>
      </div>
      <div style={styles.rightSide}>
        <div style={styles.card}>
          <button style={styles.backButton} onClick={() => navigate('/')}>← Back to Home</button>
          <h2 style={styles.formTitle}>Create Your Account</h2>
          <p style={styles.formSubtitle}>Join TeachLink and start your journey</p>
          <div style={styles.roleContainer}>
            <div 
              style={{...styles.roleOption, ...(role === 'student' ? styles.roleSelected : {})}} 
              onClick={() => setRole('student')}
            >
              👨‍🎓 Student
            </div>
            <div 
              style={{...styles.roleOption, ...(role === 'teacher' ? styles.roleSelected : {})}} 
              onClick={() => setRole('teacher')}
            >
              👨‍🏫 Teacher
            </div>
    
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                placeholder="Enter your full name" 
                style={{...styles.input, ...(errors.fullName ? styles.inputError : {})}} 
                value={formData.fullName} 
                onChange={handleChange} 
              />
              {errors.fullName && <span style={styles.errorText}>{errors.fullName}</span>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input 
                type="email" 
                name="email" 
                placeholder="Enter your email" 
                style={{...styles.input, ...(errors.email ? styles.inputError : {})}} 
                value={formData.email} 
                onChange={handleChange} 
              />
              {errors.email && <span style={styles.errorText}>{errors.email}</span>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Create a password" 
                  style={{...styles.input, ...(errors.password ? styles.inputError : {})}} 
                  value={formData.password} 
                  onChange={handleChange} 
                />
                <button type="button" style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span style={styles.errorText}>{errors.password}</span>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmPassword" 
                  placeholder="Confirm your password" 
                  style={{...styles.input, ...(errors.confirmPassword ? styles.inputError : {})}} 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                />
                <button type="button" style={styles.eyeIcon} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
            </div>
            
            {/* ✅ REMOVED: Location (Karachi) field - Entire section deleted */}

            <div style={styles.formGroup}>
              <div style={styles.checkboxGroup}>
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} style={styles.checkbox} />
                <label style={styles.checkboxLabel}>
                  I agree to the <span style={styles.linkText}>Terms & Conditions</span> and <span style={styles.linkText}>Privacy Policy</span>
                </label>
              </div>
              {errors.termsAccepted && <span style={styles.errorText}>{errors.termsAccepted}</span>}
            </div>
            <button 
              type="submit" 
              style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}} 
              disabled={isLoading}
              onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')} 
              onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine}></div>
          </div>
          <div style={styles.loginLink}>
            Already have an account? <span style={styles.linkText} onClick={() => navigate('/login')}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;