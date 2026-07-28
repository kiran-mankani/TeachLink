import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enrollmentId } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, paid: 0, total: 0 });
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [processing, setProcessing] = useState(false);
  
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [showEnrollmentPayment, setShowEnrollmentPayment] = useState(false);

  // ✅ Helper to get subject name from string or object
  const getSubjectName = (subject) => {
    if (typeof subject === 'string') return subject;
    if (typeof subject === 'object' && subject !== null) {
      return subject.subject || subject.name || '';
    }
    return '';
  };

  // ✅ Helper to get subject display
  const getSubjectDisplay = (subject) => {
    const name = getSubjectName(subject);
    return name || 'General';
  };

  useEffect(() => {
    fetchPayments();
    
    // ✅ Check if enrollmentId from URL params
    if (enrollmentId) {
      console.log('📥 Enrollment ID from URL:', enrollmentId);
      fetchEnrollmentDetails();
    }
  }, [enrollmentId]);

  // ✅ Fetch enrollment details
  const fetchEnrollmentDetails = async () => {
    try {
      console.log('📤 Fetching enrollment details for:', enrollmentId);
      const response = await fetch(`/api/enrollment/request/${enrollmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('📥 Enrollment details:', data);
      
      if (data.success) {
        const enrollment = data.request;
        setEnrollmentData(enrollment);
        setSelectedTeacher(enrollment.teacher_id);
        
        // ✅ Get subject name from object or string
        const subjectName = getSubjectDisplay(enrollment.subject);
        setSelectedSubject(subjectName);
        
        // ✅ Get fee - ONLY this subject's fee
        // Check if fee is in enrollment or find from subject_fees
        let fee = enrollment.fee || '';
        if (!fee && enrollment.subject_fees) {
          for (let s of enrollment.subject_fees) {
            if (s.subject === subjectName) {
              fee = s.fee;
              break;
            }
          }
        }
        setAmount(fee);
        
        setShowEnrollmentPayment(true);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error('Error fetching enrollment:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.getStudentPayments(token);
      console.log('📥 Payments response:', data);
      
      if (data.success) {
        setPayments(data.payments || []);
        calculateStats(data.payments || []);
      } else {
        setError(data.error || 'Failed to load payments');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsList) => {
    const total = paymentsList.length;
    const pending = paymentsList.filter(p => p.status === 'pending').length;
    const paid = paymentsList.filter(p => p.status === 'completed' || p.status === 'approved').length;
    setStats({ total, pending, paid });
  };

  // ✅ FIXED: Handle payment with enrollment_id
  const handlePayment = async () => {
    if (!selectedTeacher || !selectedSubject || !amount) {
      alert('Please fill all payment details');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        teacher_id: selectedTeacher,
        course_id: enrollmentId || 'general',
        subject: selectedSubject,
        amount: amountNum,
        payment_method: paymentMethod
      };
      
      if (enrollmentId) {
        payload.enrollment_id = enrollmentId;
      }

      console.log('📤 Sending payment payload:', payload);

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ Payment initiated successfully! Status: Pending Admin Verification');
        setShowPaymentModal(false);
        setShowEnrollmentPayment(false);
        await fetchPayments();
        navigate('/student-dashboard', { state: { from: '/student/payment' } });
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('❌ Error processing payment');
    } finally {
      setProcessing(false);
    }
  };

  // ✅ Navigation handlers with state
  const handleBackToDashboard = () => {
    navigate('/student-dashboard', { state: { from: '/student/payment' } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch { 
      return dateString; 
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
      completed: { bg: '#dcfce7', color: '#15803d', label: '✅ Completed' },
      approved: { bg: '#dcfce7', color: '#15803d', label: '✅ Approved' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: '❌ Rejected' }
    };
    return styles[status] || styles.pending;
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
    payNowBtn: {
      padding: '10px 28px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.25)'
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
      color: '#1f1f3e'
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
      borderBottom: '1px solid #f0f0f0'
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
        display: 'inline-block'
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
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    },
    modal: {
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f1f3e',
      marginBottom: '20px'
    },
    modalSubtitle: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      marginBottom: '12px',
      transition: 'border-color 0.3s'
    },
    inputDisabled: {
      backgroundColor: '#f5f5f5',
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
      fontFamily: 'inherit',
      marginBottom: '12px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px'
    },
    modalPayBtn: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    modalPayBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    modalCancelBtn: {
      flex: 1,
      padding: '12px',
      background: 'white',
      color: '#666',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    backBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#475569',
      marginBottom: '20px',
      transition: 'all 0.3s',
      fontFamily: 'inherit'
    },
    paymentDetailsCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    paymentDetailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    paymentDetailLabel: {
      color: '#94a3b8',
      fontSize: '14px'
    },
    paymentDetailValue: {
      fontWeight: '600',
      color: '#1f1f3e',
      fontSize: '14px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading payments...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar role="student" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* ✅ Back Button */}
          {location.state?.from && (
            <BackButton label="← Back" fallbackPath="/student-dashboard" />
          )}

          {/* ✅ Back button when enrollment payment */}
          {enrollmentId && !location.state?.from && (
            <button
              style={styles.backBtn}
              onClick={handleBackToDashboard}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e2e8f0';
              }}
            >
              ← Back to Dashboard
            </button>
          )}

          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>💳 Payments</h1>
              <p style={styles.subtitle}>Manage your payments and transaction history</p>
            </div>
            <button
              style={styles.payNowBtn}
              onClick={() => setShowPaymentModal(true)}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              💰 Pay Now
            </button>
          </div>

          {/* ✅ ONLY SHOW ENROLLED SUBJECT - NOT ALL SUBJECTS */}
          {enrollmentData && showEnrollmentPayment && (
            <div style={styles.paymentDetailsCard}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f1f3e' }}>
                📋 Payment Details
              </h3>
              <div style={styles.paymentDetailRow}>
                <span style={styles.paymentDetailLabel}>Teacher</span>
                <span style={styles.paymentDetailValue}>{enrollmentData.teacher_name || 'Teacher'}</span>
              </div>
              <div style={styles.paymentDetailRow}>
                <span style={styles.paymentDetailLabel}>Subject</span>
                <span style={styles.paymentDetailValue}>{getSubjectDisplay(enrollmentData.subject)}</span>
              </div>
              <div style={styles.paymentDetailRow}>
                <span style={styles.paymentDetailLabel}>Monthly Fee</span>
                <span style={styles.paymentDetailValue}>
                  Rs. {amount || 'N/A'}/month
                </span>
              </div>
              <div style={styles.paymentDetailRow}>
                <span style={styles.paymentDetailLabel}>Status</span>
                <span style={{ ...styles.paymentDetailValue, color: '#f59e0b' }}>
                  ⏳ Pending Payment
                </span>
              </div>
            </div>
          )}

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>⏳ Pending Payments</div>
              <div style={styles.statValue}>{stats.pending}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>✅ Paid Payments</div>
              <div style={styles.statValue}>{stats.paid}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📊 Total Payments</div>
              <div style={styles.statValue}>{stats.total}</div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>📋 Payment History</div>
            {payments.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <div>No payment records yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#cbd5e1' }}>
                  Make your first payment to get started
                </div>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Teacher</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td style={styles.td}>{payment.teacher_name || 'Teacher'}</td>
                      <td style={styles.td}>{getSubjectDisplay(payment.subject)}</td>
                      <td style={styles.td}>Rs. {payment.amount?.toLocaleString() || 0}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(payment.status)}>
                          {getStatusBadge(payment.status).label}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Payment Modal - Only Enrolled Subject */}
      {showPaymentModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>💰 Make Payment</div>
            <div style={styles.modalSubtitle}>
              {enrollmentId ? 'Pay for your enrollment' : 'Pay for your enrolled courses'}
            </div>

            {/* ✅ ONLY SHOW ENROLLED SUBJECT */}
            {enrollmentData && (
              <div style={{ marginBottom: '15px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Teacher:</span>
                  <span style={{ fontWeight: '500' }}>{enrollmentData.teacher_name || 'Teacher'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Subject:</span>
                  <span style={{ fontWeight: '500' }}>{getSubjectDisplay(enrollmentData.subject)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Monthly Fee:</span>
                  <span style={{ fontWeight: '500' }}>Rs. {amount || 'N/A'}/month</span>
                </div>
              </div>
            )}

            <input
              style={{
                ...styles.input,
                ...(enrollmentId ? styles.inputDisabled : {})
              }}
              placeholder="Amount (Rs.)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
              disabled={!!enrollmentId}
              min="1"
            />
            
            <select
              style={styles.select}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="jazzcash">📱 JazzCash</option>
              <option value="easypaisa">📱 EasyPaisa</option>
              <option value="card">💳 Credit/Debit Card</option>
            </select>

            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowEnrollmentPayment(false);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.modalPayBtn,
                  ...(processing || !amount ? styles.modalPayBtnDisabled : {})
                }}
                onClick={handlePayment}
                disabled={processing || !amount}
                onMouseEnter={(e) => {
                  if (!processing && amount) e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!processing && amount) e.target.style.transform = 'translateY(0)';
                }}
              >
                {processing ? '⏳ Processing...' : '✅ Confirm Payment'}
              </button>
            </div>
            
            {enrollmentId && amount && (
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                💡 Payment amount is automatically set from enrollment fee
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;