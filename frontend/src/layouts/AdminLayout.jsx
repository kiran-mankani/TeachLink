// frontend/src/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';

const AdminLayout = () => {
  const location = useLocation();
  
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: "'Poppins', 'Segoe UI', 'Nunito Sans', sans-serif",
      display: 'flex',
    },
    mainLayout: {
      display: 'flex',
      marginLeft: '270px',
      minHeight: '100vh',
      width: '100%',
      flexDirection: 'column',
    },
    content: {
      flex: 1,
      padding: '20px 30px 30px',
      backgroundColor: '#f1f5f9',
      overflowY: 'auto',
      height: 'calc(100vh - 70px)',
      marginTop: '70px',
    },
    // Navbar wrapper
    navbarWrapper: {
      position: 'fixed',
      top: 0,
      right: 0,
      left: '270px',
      zIndex: 999,
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
  };

  // ✅ Determine if back button should be shown
  const shouldShowBackButton = () => {
    const path = location.pathname;
    // Show back button on all admin pages except dashboard
    return path !== '/admin/dashboard' && path !== '/admin';
  };

  // ✅ Get back button label based on current page
  const getBackLabel = () => {
    const path = location.pathname;
    if (path.includes('/teachers')) return '← Back to Teachers';
    if (path.includes('/students')) return '← Back to Students';
    if (path.includes('/payments')) return '← Back to Payments';
    if (path.includes('/enrollments')) return '← Back to Enrollments';
    if (path.includes('/attendance')) return '← Back to Attendance';
    if (path.includes('/notifications')) return '← Back to Notifications';
    if (path.includes('/reports')) return '← Back to Reports';
    if (path.includes('/settings')) return '← Back to Settings';
    return '← Back to Dashboard';
  };

  return (
    <div style={styles.container}>
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Fixed Navbar */}
        <div style={styles.navbarWrapper}>
          <AdminNavbar />
        </div>

        {/* Scrollable Content */}
        <div style={styles.content}>
          {/* ✅ Back Button - Show on all pages except dashboard */}
          {shouldShowBackButton() && (
            <BackButton 
              label={getBackLabel()} 
              fallbackPath="/admin/dashboard"
              style={{ marginBottom: '20px' }}
            />
          )}
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;