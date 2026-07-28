// frontend/src/components/EnrollmentModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EnrollmentModal = ({ 
  isOpen, 
  onClose, 
  teacherId, 
  teacherName, 
  teacherSubjects = [],
  teacherSchedules = [],
  teacherData = {},
  onSuccess 
}) => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Get user's preferred study time from profile
  const userStudyTime = user?.study_time || user?.preferred_study_time || '';

  // ✅ Fetch schedules when subject changes
  useEffect(() => {
    if (selectedSubject && teacherId) {
      fetchSchedulesForSubject(selectedSubject);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedSubject, teacherId]);

  // ✅ Fetch schedules for selected subject
  const fetchSchedulesForSubject = async (subject) => {
    try {
      setIsLoadingSlots(true);
      setError('');
      
      console.log(`📤 Fetching schedules for teacher: ${teacherId}, subject: ${subject}`);
      
      // ✅ CORRECT API ENDPOINT - Using teacher routes
      const response = await fetch(`/api/teacher/schedules/${teacherId}?subject=${encodeURIComponent(subject)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Schedule response:', data);
      
      if (data.success) {
        const slots = data.schedules || [];
        setAvailableSlots(slots);
        
        // Auto-select first available slot if exists
        if (slots.length > 0) {
          const firstAvailable = slots.find(s => !s.is_booked);
          if (firstAvailable) {
            setSelectedSchedule(`${firstAvailable.day} • ${firstAvailable.start_time}`);
          } else {
            setSelectedSchedule('');
          }
        } else {
          setSelectedSchedule('');
        }
      } else {
        setAvailableSlots([]);
        setSelectedSchedule('');
      }
    } catch (err) {
      console.error('❌ Error fetching schedules:', err);
      setAvailableSlots([]);
      setSelectedSchedule('');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Auto-select first subject if available
  useEffect(() => {
    if (teacherSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0]);
    }
  }, [teacherSubjects]);

  // Get unique subjects from schedules
  const getScheduleSubjects = () => {
    const subjects = new Set();
    teacherSchedules.forEach(schedule => {
      if (schedule.subject) {
        subjects.add(schedule.subject);
      }
    });
    return Array.from(subjects);
  };

  const scheduleSubjects = getScheduleSubjects();
  const displaySubjects = scheduleSubjects.length > 0 ? scheduleSubjects : teacherSubjects;

  // Get selected slot details
  const getSelectedSlotDetails = () => {
    if (!selectedSchedule) return null;
    const parts = selectedSchedule.split(' • ');
    if (parts.length === 2) {
      return { day: parts[0], time: parts[1] };
    }
    return null;
  };

  const selectedSlot = getSelectedSlotDetails();

  // Check if any slot is available
  const hasAvailableSlots = availableSlots.some(slot => !slot.is_booked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedSubject) {
      setError('Please select a subject');
      setLoading(false);
      return;
    }

    if (!selectedSchedule) {
      setError('Please select a schedule slot');
      setLoading(false);
      return;
    }

    // Check if selected slot is booked
    const selectedSlotData = availableSlots.find(s => 
      `${s.day} • ${s.start_time}` === selectedSchedule
    );
    if (selectedSlotData?.is_booked) {
      setError('This slot is already booked. Please select another time.');
      setLoading(false);
      return;
    }

    try {
      const [day, time] = selectedSchedule.split(' • ');
      
      const payload = {
        teacher_id: teacherId,
        subject: selectedSubject,
        learning_mode: 'online',
        preferred_schedule: `${day} ${time}`,
        preferred_time: time,
        preferred_shift: userStudyTime || 'Flexible',
        message: message.trim() || ''
      };

      console.log('📤 Sending enrollment request:', payload);

      const response = await fetch('/api/enrollment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Enrollment response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request');
      }

      setSuccess(true);
      setShowSuccessModal(true);
      if (onSuccess) onSuccess();

    } catch (err) {
      setError(err.message || 'Failed to send enrollment request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSubject(displaySubjects[0] || '');
    setSelectedSchedule('');
    setMessage('');
    setError('');
    setSuccess(false);
    setShowSuccessModal(false);
    setAvailableSlots([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoToRequests = () => {
    setShowSuccessModal(false);
    onClose();
    navigate('/student/requests');
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    },
    modal: {
      background: 'white',
      borderRadius: '16px',
      maxWidth: '540px',
      width: '100%',
      padding: '32px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      animation: 'slideUp 0.3s ease'
    },
    successModal: {
      textAlign: 'center',
      padding: '10px 0'
    },
    successIcon: {
      fontSize: '64px',
      marginBottom: '16px',
      display: 'block'
    },
    successTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '8px'
    },
    successSubtitle: {
      fontSize: '15px',
      color: '#475569',
      marginBottom: '6px'
    },
    successStatus: {
      display: 'inline-block',
      padding: '4px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      background: '#fef3c7',
      color: '#d97706',
      marginTop: '4px',
      marginBottom: '16px'
    },
    successNote: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '24px'
    },
    successBtn: {
      padding: '12px 32px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#0f172a'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#94a3b8',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '6px',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    teacherCard: {
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px 18px',
      marginBottom: '20px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    teacherAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0
    },
    teacherInfo: {
      flex: 1
    },
    teacherName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a'
    },
    teacherMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      fontSize: '13px',
      color: '#475569',
      marginTop: '2px'
    },
    teacherMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    formGroup: {
      marginBottom: '18px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '6px'
    },
    labelRequired: {
      color: '#ef4444',
      marginLeft: '4px'
    },
    labelSub: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '400',
      marginLeft: '6px'
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white',
      fontFamily: 'inherit',
      color: '#0f172a',
      cursor: 'pointer'
    },
    selectDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      background: '#f1f5f9'
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: '80px',
      color: '#0f172a'
    },
    studyTimeDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      background: '#f1f5f9',
      borderRadius: '10px',
      border: '2px solid #e2e8f0'
    },
    studyTimeLabel: {
      fontSize: '14px',
      color: '#475569'
    },
    studyTimeValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    studyTimeChip: {
      fontSize: '12px',
      color: '#4f46e5',
      background: '#eef2ff',
      padding: '2px 12px',
      borderRadius: '12px',
      fontWeight: '500'
    },
    error: {
      color: '#ef4444',
      fontSize: '14px',
      padding: '10px 14px',
      background: '#fef2f2',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid #fecaca'
    },
    warning: {
      color: '#d97706',
      fontSize: '14px',
      padding: '10px 14px',
      background: '#fffbeb',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid #fde68a',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    summary: {
      background: '#f8fafc',
      borderRadius: '10px',
      padding: '16px 18px',
      marginBottom: '18px',
      border: '1px solid #e2e8f0'
    },
    summaryTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '10px'
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      padding: '4px 0',
      color: '#475569'
    },
    summaryLabel: {
      color: '#94a3b8'
    },
    summaryValue: {
      fontWeight: '500',
      color: '#0f172a'
    },
    summarySlotDay: {
      display: 'block',
      fontWeight: '500'
    },
    summarySlotTime: {
      color: '#475569',
      fontWeight: '400'
    },
    charCount: {
      fontSize: '12px',
      color: '#94a3b8',
      textAlign: 'right',
      marginTop: '4px'
    },
    charCountWarning: {
      color: '#ef4444'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px'
    },
    submitBtn: {
      flex: 1,
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
    },
    submitBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      boxShadow: 'none'
    },
    cancelBtn: {
      padding: '12px 24px',
      background: 'white',
      color: '#475569',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid #e2e8f0',
      borderTop: '2px solid #4f46e5',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      marginRight: '8px'
    }
  };

  const getShiftEmoji = (shift) => {
    const map = {
      'Morning': '🌅',
      'Afternoon': '☀️',
      'Evening': '🌇',
      'Flexible': '🕐'
    };
    return map[shift] || '🕐';
  };

  const shiftEmoji = getShiftEmoji(userStudyTime);

  // Check if subject has schedules
  const subjectHasSchedules = availableSlots.length > 0;
  const hasAvailableSlot = availableSlots.some(slot => !slot.is_booked);
  const isSubmitDisabled = loading || !subjectHasSchedules || !hasAvailableSlot || !selectedSchedule;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {showSuccessModal ? (
          <div style={styles.successModal}>
            <span style={styles.successIcon}>✅</span>
            <div style={styles.successTitle}>Enrollment Request Sent</div>
            <div style={styles.successSubtitle}>Your request has been sent successfully.</div>
            <div style={styles.successStatus}>⏳ Pending Teacher Approval</div>
            <div style={styles.successNote}>
              You will receive a notification once the teacher responds.
            </div>
            <button style={styles.successBtn} onClick={handleGoToRequests}>
              Go to Requests
            </button>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <h2 style={styles.title}>📝 Request Enrollment</h2>
              <button style={styles.closeBtn} onClick={handleClose}>×</button>
            </div>

            <div style={styles.teacherCard}>
              <div style={styles.teacherAvatar}>
                {teacherData?.name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div style={styles.teacherInfo}>
                <div style={styles.teacherName}>{teacherName || 'Teacher'}</div>
                <div style={styles.teacherMeta}>
                  <span style={styles.teacherMetaItem}>📍 {teacherData?.location || 'N/A'}</span>
                  <span style={styles.teacherMetaItem}>⭐ {teacherData?.rating || 'N/A'}</span>
                  <span style={styles.teacherMetaItem}>🎓 {teacherData?.qualification || 'N/A'}</span>
                  <span style={styles.teacherMetaItem}>💻 {teacherData?.teaching_mode || 'Online'}</span>
                  <span style={styles.teacherMetaItem}>💰 {teacherData?.fee_range || 'N/A'}</span>
                </div>
              </div>
            </div>

            {error && <div style={styles.error}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Subject */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Subject <span style={styles.labelRequired}>*</span>
                </label>
                <select
                  style={styles.select}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {displaySubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Schedule */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Teacher Schedule <span style={styles.labelRequired}>*</span>
                </label>
                
                {isLoadingSlots ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                    <span style={styles.loadingSpinner}></span> Loading schedules...
                  </div>
                ) : subjectHasSchedules ? (
                  <>
                    <select
                      style={{
                        ...styles.select,
                        ...(!hasAvailableSlot ? styles.selectDisabled : {})
                      }}
                      value={selectedSchedule}
                      onChange={(e) => setSelectedSchedule(e.target.value)}
                      disabled={!hasAvailableSlot}
                      required
                    >
                      <option value="">Select Available Slot</option>
                      {availableSlots.map((slot, idx) => (
                        <option 
                          key={idx} 
                          value={`${slot.day} • ${slot.start_time}`}
                          disabled={slot.is_booked}
                        >
                          {slot.day} • {slot.start_time} – {slot.end_time}
                          {slot.is_booked ? ' (Full)' : ''}
                          {slot.subject ? ` (${slot.subject})` : ''}
                        </option>
                      ))}
                    </select>
                    {!hasAvailableSlot && (
                      <div style={styles.warning}>
                        ⚠️ All slots for this subject are currently booked. 
                        Please select another subject or try a different tutor.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <select
                      style={{
                        ...styles.select,
                        ...styles.selectDisabled
                      }}
                      disabled
                      value=""
                    >
                      <option value="">No schedules available</option>
                    </select>
                    <div style={styles.warning}>
                      ⚠️ This teacher has not added any schedule for <strong>{selectedSubject}</strong> yet.
                      <br />
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Please choose another subject or another tutor.
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Preferred Study Time */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Your Preferred Study Time
                  <span style={styles.labelSub}>(from your profile)</span>
                </label>
                <div style={styles.studyTimeDisplay}>
                  <span style={styles.studyTimeLabel}>Your Preference:</span>
                  <span style={styles.studyTimeValue}>
                    {shiftEmoji} {userStudyTime || 'Not set'}
                    {userStudyTime && (
                      <span style={styles.studyTimeChip}>From Profile</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Message <span style={styles.labelSub}>(Optional)</span></label>
                <textarea
                  style={styles.textarea}
                  placeholder="Any special request or message for the teacher..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength="300"
                />
                <div style={{
                  ...styles.charCount,
                  ...(message.length >= 280 ? styles.charCountWarning : {})
                }}>
                  {message.length} / 300
                </div>
              </div>

              {/* Summary */}
              <div style={styles.summary}>
                <div style={styles.summaryTitle}>📋 Enrollment Summary</div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Teacher</span>
                  <span style={styles.summaryValue}>{teacherName}</span>
                </div>
                {selectedSubject && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Subject</span>
                    <span style={styles.summaryValue}>{selectedSubject}</span>
                  </div>
                )}
                {selectedSlot && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Selected Slot</span>
                    <span style={styles.summaryValue}>
                      <span style={styles.summarySlotDay}>{selectedSlot.day}</span>
                      <span style={styles.summarySlotTime}> {selectedSlot.time}</span>
                    </span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Study Shift</span>
                  <span style={styles.summaryValue}>
                    {shiftEmoji} {userStudyTime || 'Flexible'}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.submitBtn,
                    ...(isSubmitDisabled ? styles.submitBtnDisabled : {})
                  }}
                  disabled={isSubmitDisabled}
                >
                  {loading ? 'Sending...' : '📤 Send Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollmentModal;