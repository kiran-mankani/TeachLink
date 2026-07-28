import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const HomePage = () => {
  const navigate = useNavigate();
  // --- TYPING ANIMATION STATE ---
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [phase, setPhase] = useState(1);

  const line1 = '📚 Find the Right Tutor';
  const line2 = 'Near You 🎯';

  useEffect(() => {
    if (phase === 1) {
      if (text1.length < line1.length) {
        const timer = setTimeout(() => {
          setText1(line1.substring(0, text1.length + 1));
        }, 70);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setPhase(2);
        }, 800);
        return () => clearTimeout(timer);
      }
    } else if (phase === 2) {
      if (text2.length < line2.length) {
        const timer = setTimeout(() => {
          setText2(line2.substring(0, text2.length + 1));
        }, 70);
        return () => clearTimeout(timer);
      } else {
        setIsTypingComplete(true);
      }
    }
  }, [text1, text2, phase]);

  // --- INLINE CSS STYLES ---
  const styles = {
    container: {
      backgroundColor: '#f0f4ff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Poppins', 'Segoe UI', 'Nunito Sans', sans-serif",
      overflowX: 'hidden'
    },
    mainContent: {
      flex: '1',
      paddingBottom: '50px'
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 40px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(74, 58, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.05)'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    logoIcon: {
      fontSize: '30px',
      color: '#4a3aff'
    },
    logoText: {
      fontSize: '26px',
      fontWeight: '800',
      color: '#1f1f3e',
      letterSpacing: '-0.5px'
    },
    logoHighlight: {
      color: '#4a3aff'
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '30px'
    },
    navLink: {
      textDecoration: 'none',
      color: '#444',
      fontWeight: '500',
      fontSize: '15px',
      transition: 'color 0.3s',
      cursor: 'pointer',
      position: 'relative'
    },
    btnPrimarySmall: {
      backgroundColor: '#4a3aff',
      color: 'white',
      border: 'none',
      padding: '10px 28px',
      borderRadius: '50px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '15px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(74, 58, 255, 0.25)'
    },
    heroSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '60px 80px',
      background: 'linear-gradient(135deg, #e8edff 0%, #d6e0ff 40%, #c5d4ff 100%)',
      borderRadius: '0 0 60px 60px',
      margin: '0 20px',
      position: 'relative',
      overflow: 'hidden',
      flexWrap: 'wrap',
      minHeight: '500px'
    },
    heroBgDecor1: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      background: 'radial-gradient(circle, rgba(74,58,255,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      top: '-100px',
      right: '-100px'
    },
    heroBgDecor2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      bottom: '-50px',
      left: '-50px'
    },
    heroBgDecor3: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(74,58,255,0.06) 0%, transparent 70%)',
      borderRadius: '50%',
      top: '50%',
      right: '30%'
    },
    heroContent: {
      maxWidth: '50%',
      minWidth: '320px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      textAlign: 'left',
      position: 'relative',
      zIndex: 2
    },
    heroTitleWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // CENTER ALIGN
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '20px',
      minHeight: '130px',
      width: '100%'
    },
    heroTitleLine1: {
      fontSize: '48px',
      fontWeight: '800',
      lineHeight: '1.2',
      margin: 0,
      background: 'linear-gradient(135deg, #1f1f3e, #4a3aff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      minHeight: '60px',
      textAlign: 'center' // CENTER
    },
    heroTitleLine2: {
      fontSize: '42px',
      fontWeight: '800',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // CENTER
      gap: '10px',
      minHeight: '55px',
      background: 'linear-gradient(135deg, #1f1f3e, #4a3aff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textAlign: 'center' // CENTER
    },
    cursor: {
      display: 'inline-block',
      width: '4px',
      height: '48px',
      backgroundColor: '#4a3aff',
      marginLeft: '5px',
      animation: 'blink 1s infinite',
      borderRadius: '2px'
    },
    cursorSmall: {
      display: 'inline-block',
      width: '4px',
      height: '42px',
      backgroundColor: '#4a3aff',
      marginLeft: '5px',
      animation: 'blink 1s infinite',
      borderRadius: '2px'
    },
    heroDescription: {
      color: '#2d2d5e',
      fontSize: '18px',
      marginBottom: '35px',
      lineHeight: '1.7',
      maxWidth: '480px',
      fontWeight: '400',
      background: 'rgba(255,255,255,0.7)',
      padding: '18px 24px',
      borderRadius: '16px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.8)',
      textAlign: 'center', // CENTER
      width: '100%'
    },
    heroButtons: {
      display: 'flex',
      gap: '15px',
      marginBottom: '45px',
      flexWrap: 'wrap',
      justifyContent: 'center', // CENTER
      width: '100%'
    },
    btnPrimaryLarge: {
      backgroundColor: '#4a3aff',
      color: 'white',
      border: 'none',
      padding: '16px 38px',
      borderRadius: '50px',
      fontWeight: '600',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 25px rgba(74, 58, 255, 0.3)',
      transition: 'all 0.3s'
    },
    btnSecondaryLarge: {
      backgroundColor: 'white',
      color: '#1f1f3e',
      border: '2px solid #e0e0e0',
      padding: '16px 38px',
      borderRadius: '50px',
      fontWeight: '600',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s'
    },
    heroStats: {
      display: 'flex',
      gap: '30px',
      flexWrap: 'wrap',
      justifyContent: 'center', // CENTER
      width: '100%'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(255,255,255,0.85)',
      padding: '10px 20px',
      borderRadius: '16px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.9)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
    },
    statIconBg: {
      background: 'rgba(74, 58, 255, 0.1)',
      color: '#4a3aff',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '20px'
    },
    statTextH3: {
      fontSize: '20px',
      color: '#1f1f3e',
      marginBottom: '0px',
      fontWeight: '700'
    },
    statTextP: {
      fontSize: '13px',
      color: '#777',
      fontWeight: '500',
      margin: 0
    },
    heroImage: {
      width: '45%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: '300px',
      marginTop: '20px',
      position: 'relative',
      zIndex: 2
    },
    heroImageTag: {
      width: '100%',
      maxWidth: '500px',
      height: 'auto',
      objectFit: 'contain',
      borderRadius: '24px',
      boxShadow: '0 30px 80px rgba(74, 58, 255, 0.15)',
      transition: 'transform 0.5s'
    },
    howItWorks: {
      padding: '50px 80px 30px 80px',
      textAlign: 'center'
    },
    sectionTitle: {
      fontSize: '36px',
      color: '#1f1f3e',
      marginBottom: '45px',
      fontWeight: '700',
      position: 'relative',
      display: 'inline-block'
    },
    sectionTitleUnderline: {
      width: '60px',
      height: '4px',
      background: 'linear-gradient(90deg, #4a3aff, #6c5ce7)',
      margin: '10px auto 0',
      borderRadius: '2px'
    },
    stepsContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0'
    },
    stepCard: {
      background: 'white',
      border: '1px solid #f0f0f0',
      borderRadius: '20px',
      padding: '25px 20px',
      width: '140px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      transition: 'all 0.3s'
    },
    stepNumber: {
      backgroundColor: '#4a3aff',
      color: 'white',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '12px'
    },
    stepIcon: {
      fontSize: '28px',
      marginBottom: '8px'
    },
    stepText: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
      textAlign: 'center'
    },
    stepArrow: {
      color: '#ccc',
      fontSize: '22px',
      margin: '0 10px'
    },
    whyTeachlink: {
      padding: '20px 80px 60px 80px',
      textAlign: 'center'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      maxWidth: '900px',
      margin: '0 auto'
    },
    featureCard: {
      background: 'white',
      border: '1px solid #f0f0f0',
      padding: '20px 25px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      textAlign: 'left',
      transition: 'all 0.3s',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    },
    checkCircle: {
      backgroundColor: '#4a3aff',
      color: 'white',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '14px',
      flexShrink: '0'
    },
    featureIcon: {
      color: '#4a3aff',
      fontSize: '22px'
    },
    featureText: {
      fontWeight: '500',
      color: '#1f1f3e',
      fontSize: '15px'
    },
    footer: {
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      padding: '60px 80px 30px 80px',
      marginTop: 'auto'
    },
    footerContent: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '40px',
      marginBottom: '40px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: '40px'
    },
    footerCol: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    footerLogo: {
      fontSize: '24px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#ffffff'
    },
    footerDesc: {
      fontSize: '14px',
      color: '#b0b0c0',
      lineHeight: '1.7',
      maxWidth: '250px',
      fontWeight: '400'
    },
    footerHeading: {
      fontSize: '17px',
      fontWeight: '600',
      marginBottom: '5px',
      color: '#ffffff'
    },
    footerLink: {
      textDecoration: 'none',
      color: '#b0b0c0',
      fontSize: '14px',
      transition: 'color 0.3s',
      cursor: 'pointer'
    },
    footerSocials: {
      display: 'flex',
      gap: '12px',
      fontSize: '20px'
    },
    socialIcon: {
      width: '38px',
      height: '38px',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background 0.3s'
    },
    footerBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '20px',
      fontSize: '14px',
      color: '#b0b0c0'
    }
  };

  // Add keyframe styles for cursor blink
  const cursorStyle = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{cursorStyle}</style>
      
      <div style={styles.mainContent}>
        
        {/* Navbar */}
        <nav style={styles.navbar}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>
              Teach<span style={styles.logoHighlight}>Link</span>
            </span>
          </div>
          <div style={styles.navLinks}>
            <a href="#" style={styles.navLink}>Home</a>
            <a href="#" style={styles.navLink}>About</a>
            <button style={styles.btnPrimarySmall} onClick={() => navigate('/login')}>
              Login
            </button>

            <button style={styles.btnPrimarySmall} onClick={() => navigate('/signup')}>
              Signup
            </button>

          </div>
        </nav>

        {/* Hero Section */}
        <section style={styles.heroSection}>
          
          {/* Decorative Background Elements */}
          <div style={styles.heroBgDecor1}></div>
          <div style={styles.heroBgDecor2}></div>
          <div style={styles.heroBgDecor3}></div>

          <div style={styles.heroContent}>
            {/* TYPING ANIMATION TITLE - CENTER ALIGNED */}
            <div style={styles.heroTitleWrapper}>
              <h1 style={styles.heroTitleLine1}>
                {text1}
                {!isTypingComplete && text1.length < line1.length && (
                  <span style={styles.cursor}></span>
                )}
                {isTypingComplete && text1.length === line1.length && (
                  <span style={{...styles.cursor, opacity: 0.3 }}></span>
                )}
              </h1>
              <div style={styles.heroTitleLine2}>
                {text2}
                {!isTypingComplete && text2.length < line2.length && phase === 2 && (
                  <span style={styles.cursorSmall}></span>
                )}
                {isTypingComplete && text2.length === line2.length && (
                  <span style={{...styles.cursorSmall, opacity: 0.3 }}></span>
                )}
              </div>
            </div>
            
            <p style={styles.heroDescription}>
              Connect students and qualified teachers on a secure smart learning platform in Karachi & beyond.
            </p>
            
            <div style={styles.heroButtons}>
            <button 
                style={styles.btnPrimaryLarge}
                onClick={() => navigate('/signup')}  // YEH ADD KAREIN
              >
            <span>🚀</span> Get Started
            </button>
            </div>
            <div style={styles.heroStats}>
              <div style={styles.statItem}>
                <div style={styles.statIconBg}>👨‍🏫</div>
                <div>
                  <h3 style={styles.statTextH3}>500+</h3>
                  <p style={styles.statTextP}>Active Tutors</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statIconBg}>👥</div>
                <div>
                  <h3 style={styles.statTextH3}>2000+</h3>
                  <p style={styles.statTextP}>Students</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statIconBg}>⭐</div>
                <div>
                  <h3 style={styles.statTextH3}>98%</h3>
                  <p style={styles.statTextP}>Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div style={styles.heroImage}>
            <img 
              src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=400&fit=crop&crop=center"
              alt="Books and Learning" 
              style={styles.heroImageTag}
            />
          </div>
        </section>

        {/* How It Works */}
        <section style={styles.howItWorks}>
          <h2 style={styles.sectionTitle}>
            How It Works
            <div style={styles.sectionTitleUnderline}></div>
          </h2>
          <div style={styles.stepsContainer}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Create Profile</p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Find Match</p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Connect Chat</p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Schedule Class</p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>5</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Pay Securely</p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>6</div>
              <div style={styles.stepIcon}></div>
              <p style={styles.stepText}>Review</p>
            </div>
          </div>
        </section>

        {/* Why TeachLink */}
        <section style={styles.whyTeachlink}>
          <h2 style={styles.sectionTitle}>
            Why TeachLink?
            <div style={styles.sectionTitleUnderline}></div>
          </h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.checkCircle}>✓</div>
              <div style={styles.featureIcon}>📍</div>
              <p style={styles.featureText}>Location-Based Matching</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.checkCircle}>✓</div>
              <div style={styles.featureIcon}>💻</div>
              <p style={styles.featureText}>Online + Physical Classes</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.checkCircle}>✓</div>
              <div style={styles.featureIcon}>🔒</div>
              <p style={styles.featureText}>Secure Chat (No Contact Sharing)</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.checkCircle}>✓</div>
              <div style={styles.featureIcon}>🛡️</div>
              <p style={styles.featureText}>Safe Payment System (Escrow)</p>
            </div>
            <div style={{...styles.featureCard, gridColumn: '1 / -1'}}>
              <div style={styles.checkCircle}>✓</div>
              <div style={styles.featureIcon}>✅</div>
              <p style={styles.featureText}>Verified Students & Teachers</p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerCol}>
            <div style={styles.footerLogo}>
              <span>🎓</span> TeachLink
            </div>
            <p style={styles.footerDesc}>
              Empowering students and teachers to connect, learn, and grow together on a trusted platform.
            </p>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Quick Links</h4>
            <a href="#" style={styles.footerLink}>About Us</a>
            <a href="#" style={styles.footerLink}>How it Works</a>
            <a href="#" style={styles.footerLink}>Become a Tutor</a>
            <a href="#" style={styles.footerLink}>Contact Support</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Legal</h4>
            <a href="#" style={styles.footerLink}>Privacy Policy</a>
            <a href="#" style={styles.footerLink}>Terms of Service</a>
            <a href="#" style={styles.footerLink}>Refund Policy</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Follow Us</h4>
            <div style={styles.footerSocials}>
              <div style={styles.socialIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div style={styles.socialIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <div style={styles.socialIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <div style={styles.socialIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>&copy; 2026 TeachLink. All rights reserved.</span>
          <span>Made with ❤️ for Education</span>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;