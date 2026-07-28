// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { KARACHI_AREAS } from '../constants';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const data = await api.login(formData.email, formData.password);
      const { user, token } = data;
      login(user, token);

      // ✅ ROLE-BASED REDIRECT - Admin Support Added
      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else if (user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Styles (same as before, no changes)
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
      maxWidth: '420px',
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
      marginBottom: '25px'
    },
    formGroup: {
      marginBottom: '18px'
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
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '2px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#4a3aff',
      marginRight: '8px'
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#555',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    },
    forgotPassword: {
      fontSize: '14px',
      color: '#4a3aff',
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'none',
      background: 'none',
      border: 'none'
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
    signupLink: {
      textAlign: 'center',
      marginTop: '18px',
      fontSize: '14px',
      color: '#666',
      fontWeight: '400'
    },
    linkText: {
      color: '#4a3aff',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none'
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
          <h1 style={styles.leftTitle}>Welcome Back!</h1>
          <p style={styles.leftSubtitle}>Continue your learning journey with TeachLink. Connect with expert tutors and achieve your academic goals.</p>
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
          <h2 style={styles.formTitle}>Welcome Back!</h2>
          <p style={styles.formSubtitle}>Login to continue your learning journey</p>
          <form onSubmit={handleSubmit}>
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
                  placeholder="Enter your password" 
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
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} style={styles.checkbox} /> 
                  Remember me
                </label>
                <button type="button" style={styles.forgotPassword} onClick={() => alert('📧 Password reset link sent to your email!')}>
                  Forgot Password?
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}} 
              disabled={isLoading}
              onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')} 
              onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine}></div>
          </div>
          <div style={styles.signupLink}>
            Don't have an account? <span style={styles.linkText} onClick={() => navigate('/signup')}>Sign up</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;