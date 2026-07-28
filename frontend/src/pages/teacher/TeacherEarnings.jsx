import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const TeacherEarnings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    received: 0,
    adminCommission: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ✅ Admin Commission Rate (10%)
  const ADMIN_COMMISSION = 0.10; // 10%

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching teacher payments...');
      
      // ✅ Try API service first
      let data;
      try {
        data = await api.getTeacherPayments(token);
      } catch (err) {
        console.log('⚠️ API service failed, trying direct fetch...');
        const response = await fetch('/api/payments/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        data = await response.json();
      }
      
      console.log('📥 Payments response:', data);
      
      // ✅ Handle different response structures
      let paymentsData = [];
      if (data.success && data.payments) {
        paymentsData = data.payments;
      } else if (data.success && data.data && data.data.payments) {
        paymentsData = data.data.payments;
      } else if (data.payments) {
        paymentsData = data.payments;
      } else if (Array.isArray(data)) {
        paymentsData = data;
      }
      
      setPayments(paymentsData);
      calculateStats(paymentsData);
      console.log('📋 Payments loaded:', paymentsData.length);
      
    } catch (err) {
      console.error('❌ Error fetching payments:', err);
      setError(err.message || 'Error loading payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate earnings with 10% admin commission
  const calculateStats = (paymentsList) => {
    let total = 0;
    let pending = 0;
    let received = 0;
    let adminCommission = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let thisMonthTotal = 0;
    
    paymentsList.forEach(p => {
      // ✅ Teacher gets 90% (after 10% admin commission)
      const commission = p.amount * ADMIN_COMMISSION;
      const teacherAmount = p.amount - commission;
      
      adminCommission += commission;
      
      // ✅ Status wise calculation
      if (p.status === 'approved' || p.status === 'completed' || p.status === 'released') {
        received += teacherAmount;
        total += teacherAmount;
        
        // Check if payment is from this month
        const date = new Date(p.created_at);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          thisMonthTotal += teacherAmount;
        }
      } else if (p.status === 'pending' || p.status === 'paid') {
        pending += teacherAmount;
        total += teacherAmount;
      } else if (p.status === 'rejected') {
        // ✅ Rejected payments - no amount added
        // Student will get refund
      }
    });
    
    setStats({
      total: Math.round(total),
      thisMonth: Math.round(thisMonthTotal),
      pending: Math.round(pending),
      received: Math.round(received),
      adminCommission: Math.round(adminCommission)
    });
  };

  const applyFilters = () => {
    let result = [...payments];

    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const studentName = (p.student_name || '').toLowerCase();
        const subject = (p.subject || '').toLowerCase();
        return studentName.includes(query) || subject.includes(query);
      });
    }

    setFilteredPayments(result);
  };

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard', { state: { from: '/teacher/earnings' } });
  };

  const handleViewStudentProfile = (studentId) => {
    if (studentId) {
      navigate(`/teacher/student-profile/${studentId}`, { state: { from: '/teacher/earnings' } });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending (Admin Hold)' },
      paid: { bg: '#dbeafe', color: '#2563eb', label: '💰 Paid (Course Unlocked)' },
      approved: { bg: '#dcfce7', color: '#15803d', label: '✅ Released to Teacher' },
      completed: { bg: '#dcfce7', color: '#15803d', label: '✅ Completed' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected' },
      released: { bg: '#dcfce7', color: '#15803d', label: '✅ Released to Teacher' }
    };
    return styles[status] || styles.pending;
  };

  // ✅ Get status description for tooltip
  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Payment received by admin. Waiting for verification.',
      paid: 'Payment verified by admin. Course unlocked for student.',
      approved: 'Month completed. Payment released to teacher after 10% commission.',
      completed: 'Payment fully processed.',
      rejected: 'Payment rejected. Student will receive refund.',
      released: 'Payment released to teacher after 10% commission.'
    };
    return descriptions[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px'
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    statLabel: {
      fontSize: '13px',
      color: '#94a3b8',
      fontWeight: '500'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginTop: '4px'
    },
    statSub: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '2px'
    },
    commissionCard: {
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      borderRadius: '16px',
      padding: '16px 20px',
      border: '1px solid #f59e0b',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    commissionLabel: {
      fontSize: '14px',
      color: '#92400e',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    commissionValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#92400e'
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
      alignItems: 'center',
      background: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    filterGroup: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      flex: 1
    },
    filterBtn: {
      padding: '6px 16px',
      borderRadius: '20px',
      border: '2px solid #e8e8e8',
      background: 'white',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      color: '#666'
    },
    filterBtnActive: {
      borderColor: '#3b82f6',
      background: '#eff6ff',
      color: '#3b82f6'
    },
    filterBtnCount: {
      fontSize: '11px',
      opacity: 0.6,
      marginLeft: '4px'
    },
    searchInput: {
      padding: '8px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      minWidth: '180px',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    tableHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px 20px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      borderBottom: '1px solid #e8e8e8',
      background: '#f8fafc'
    },
    td: {
      padding: '12px 20px',
      fontSize: '14px',
      color: '#1f1f3e',
      borderBottom: '1px solid #f0f0f0',
      verticalAlign: 'middle'
    },
    statusBadge: (status) => {
      const style = getStatusBadge(status);
      return {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-block',
        cursor: 'pointer'
      };
    },
    emptyState: {
      padding: '40px',
      textAlign: 'center',
      color: '#94a3b8'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#3b82f6'
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
    },
    amountGreen: {
      color: '#16a34a',
      fontWeight: '600'
    },
    amountOrange: {
      color: '#f59e0b',
      fontWeight: '600'
    },
    amountRed: {
      color: '#ef4444',
      fontWeight: '600'
    },
    amountBlue: {
      color: '#2563eb',
      fontWeight: '600'
    },
    tooltip: {
      position: 'relative',
      cursor: 'help'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="teacher" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading payments...</div>
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

  const filterNames = {
    all: 'All',
    pending: 'Pending',
    paid: 'Paid',
    approved: 'Released',
    rejected: 'Rejected'
  };

  const filterCounts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    paid: payments.filter(p => p.status === 'paid').length,
    approved: payments.filter(p => p.status === 'approved' || p.status === 'released').length,
    rejected: payments.filter(p => p.status === 'rejected').length
  };

  return (
    <div style={styles.container}>
      <Sidebar role="teacher" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/teacher-dashboard" />
          )}

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>💰 Earnings</h1>
              <p style={styles.subtitle}>
                Track your teaching income and payment history
              </p>
            </div>
            <button
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#475569'
              }}
              onClick={fetchPayments}
              onMouseEnter={(e) => e.target.style.background = '#e8ecf0'}
              onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
            >
              🔄 Refresh
            </button>
          </div>

          {/* ✅ Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>💰 Total Earnings</div>
              <div style={styles.statValue}>Rs. {stats.total.toLocaleString()}</div>
              <div style={styles.statSub}>After 10% admin commission</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📅 This Month</div>
              <div style={styles.statValue}>Rs. {stats.thisMonth.toLocaleString()}</div>
              <div style={styles.statSub}>Current month earnings</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>⏳ Pending</div>
              <div style={styles.statValue}>Rs. {stats.pending.toLocaleString()}</div>
              <div style={styles.statSub}>Waiting for release</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>✅ Received</div>
              <div style={styles.statValue}>Rs. {stats.received.toLocaleString()}</div>
              <div style={styles.statSub}>Payments released to you</div>
            </div>
          </div>

          {/* ✅ Admin Commission Card */}
          <div style={styles.commissionCard}>
            <span style={styles.commissionLabel}>
              🏦 Admin Platform Fee (10%)
            </span>
            <span style={styles.commissionValue}>
              Rs. {stats.adminCommission.toLocaleString()}
            </span>
          </div>

          {/* ✅ Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
              {['all', 'pending', 'paid', 'approved', 'rejected'].map((filter) => (
                <button
                  key={filter}
                  style={{
                    ...styles.filterBtn,
                    ...(filterStatus === filter ? styles.filterBtnActive : {})
                  }}
                  onClick={() => setFilterStatus(filter)}
                >
                  {filterNames[filter] || filter}
                  <span style={styles.filterBtnCount}>
                    ({filterCounts[filter] || 0})
                  </span>
                </button>
              ))}
            </div>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Search student or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>

          {/* ✅ Payment History Table */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <span>📋 Payment History</span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Total: {payments.length} payments
              </span>
            </div>
            
            {filteredPayments.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <div>No payment records yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#cbd5e1' }}>
                  Payments will appear here once students make payments
                </div>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Total Amount</th>
                    <th style={styles.th}>Teacher Gets (90%)</th>
                    <th style={styles.th}>Admin Fee (10%)</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const statusStyle = getStatusBadge(payment.status);
                    const teacherAmount = payment.amount * 0.9;
                    const adminFee = payment.amount * 0.1;
                    
                    return (
                      <tr key={payment._id}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'white'
                            }}>
                              {getInitials(payment.student_name)}
                            </div>
                            <span>{payment.student_name || 'Student'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>{payment.subject || 'General'}</td>
                        <td style={styles.td}>
                          <span style={styles.amountBlue}>Rs. {payment.amount?.toLocaleString() || 0}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.amountGreen}>Rs. {Math.round(teacherAmount).toLocaleString()}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.amountOrange}>Rs. {Math.round(adminFee).toLocaleString()}</span>
                        </td>
                        <td style={styles.td}>
                          <span 
                            style={styles.statusBadge(payment.status)}
                            title={getStatusDescription(payment.status)}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                        <td style={styles.td}>{formatDate(payment.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ✅ Commission Info */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>ℹ️</span>
            <span>
              <strong>How it works:</strong> Student pays full amount → 
              Admin holds payment → 10% platform fee deducted → 
              Teacher receives 90% after month completion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherEarnings;