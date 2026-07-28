// frontend/src/pages/teacher/ManageSchedule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';


const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ✅ Generate TIME_OPTIONS from 8:00 AM to 12:00 AM (midnight)
const TIME_OPTIONS = [];
for (let hour = 8; hour <= 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    let h = hour;
    let ampm = 'AM';
    
    if (hour === 24) {
      TIME_OPTIONS.push('12:00 AM');
      continue;
    }
    
    if (hour >= 12) {
      ampm = 'PM';
      if (hour > 12) h = hour - 12;
    }
    if (hour === 0) {
      h = 12;
      ampm = 'AM';
    }
    if (hour === 12) {
      h = 12;
      ampm = 'PM';
    }
    
    const timeStr = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
    TIME_OPTIONS.push(timeStr);
  }
}

const addOneHour = (timeStr) => {
  if (!timeStr) return '';
  
  const parseTime = (str) => {
    const [time, ampm] = str.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let h = hours;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: minutes };
  };
  
  const formatTime = (h, m) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  
  const parsed = parseTime(timeStr);
  let newHour = parsed.hours + 1;
  if (newHour > 23) {
    return formatTime(23, 59);
  }
  return formatTime(newHour, parsed.minutes);
};

// ✅ Get today's date
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ Get date 1 month from now
const getOneMonthLater = (startDate) => {
  if (!startDate) return '';
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ManageSchedule = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  
  // ✅ FIXED: teachingMode ko database se fetch karo
  const [teachingMode, setTeachingMode] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // Form state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState({});
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Get user ID - Multiple sources
  const getUserId = () => {
    const userId = user?._id || user?.id || user?.userId || user?.user_id;
    if (userId && userId !== 'null' && userId !== 'undefined') {
      return userId;
    }
    try {
      const directId = localStorage.getItem('userId');
      if (directId && directId !== 'null' && directId !== 'undefined') {
        return directId;
      }
    } catch (e) {}
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const storedId = parsedUser._id || parsedUser.id || parsedUser.userId || parsedUser.user_id;
        if (storedId && storedId !== 'null' && storedId !== 'undefined') {
          return storedId;
        }
      }
    } catch (e) {}
    return null;
  };

  // ✅ Auto-calculate end date when start date changes
  useEffect(() => {
    if (startDate) {
      setEndDate(getOneMonthLater(startDate));
    }
  }, [startDate]);

  // ✅ Auto-set time slot end time when start time changes
  const handleTimeChange = (day, startTime) => {
    const endTime = addOneHour(startTime);
    setTimeSlots(prev => ({
      ...prev,
      [day]: { start: startTime, end: endTime }
    }));
  };

  // ✅ FETCH TEACHER PROFILE FOR SUBJECTS AND TEACHING MODE
  const fetchTeacherProfile = async () => {
    try {
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        let subjects = data.profile.subjects || [];
        
        // ✅ FIXED: Extract subject names from both string and object arrays
        const subjectNames = subjects.map(s => {
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s !== null) {
            return s.subject || s.name || '';
          }
          return '';
        }).filter(s => s !== '');
        
        console.log('📌 Subject names extracted:', subjectNames);
        setAllSubjects(subjectNames);
        
        // ✅ FIXED: teaching_mode ko database se directly lein
        const mode = data.profile.teaching_mode || '';
        console.log('📌 Fetched teaching_mode from profile:', mode);
        setTeachingMode(mode);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // ✅ FETCH SCHEDULES
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userId = getUserId();
      if (!userId) {
        setError('User ID not found. Please logout and login again.');
        setLoading(false);
        return;
      }
      
      console.log('📤 Fetching schedules for user ID:', userId);
      
      const response = await fetch(`/api/schedule/teacher/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Schedules response:', data);
      
      if (data.success) {
        setSchedules(data.schedules || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load schedules');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Error loading schedules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load everything on mount
  useEffect(() => {
    if (token) {
      Promise.all([
        fetchTeacherProfile(),
        fetchSchedules()
      ]).finally(() => setLoading(false));
    }
  }, [token]);

  // ✅ Calculate which subjects already have schedules
  const scheduledSubjects = schedules.map(s => s.subject);
  
  // ✅ FIXED: Filter subject names (strings) against scheduled subjects
  const unscheduledSubjects = allSubjects.filter(sub => {
    // sub is now a string (subject name)
    return !scheduledSubjects.includes(sub);
  });
  
  const allScheduled = allSubjects.length > 0 && unscheduledSubjects.length === 0;

  // ✅ Toggle day selection
  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      const newTimeSlots = { ...timeSlots };
      if (!newDays.includes(day)) {
        delete newTimeSlots[day];
      }
      setTimeSlots(newTimeSlots);
      return newDays;
    });
  };

  // ✅ Reset form
  const resetForm = () => {
    setSelectedSubject('');
    setSelectedDays([]);
    setTimeSlots({});
    setStartDate(getTodayDate());
    setEndDate('');
    setError('');
    setSuccess('');
    setEditingSchedule(null);
    setShowForm(false);
  };

  // ✅ Handle edit
  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedSubject(schedule.subject || '');
    setSelectedDays(schedule.days || []);
    
    const slots = {};
    if (schedule.time_slots) {
      schedule.time_slots.forEach(slot => {
        slots[slot.day] = { start: slot.start_time, end: slot.end_time };
      });
    }
    setTimeSlots(slots);
    setStartDate(schedule.start_date || getTodayDate());
    setEndDate(schedule.end_date || '');
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }
    
    const missingTimes = selectedDays.filter(day => !timeSlots[day] || !timeSlots[day].start);
    if (missingTimes.length > 0) {
      setError(`Please set time for: ${missingTimes.join(', ')}`);
      return;
    }
    
    if (!startDate) {
      setError('Start date is required');
      return;
    }

    const timeSlotsArray = selectedDays.map(day => ({
      day: day,
      start_time: timeSlots[day].start,
      end_time: timeSlots[day].end
    }));

    const userId = getUserId();
    if (!userId) {
      setError('User ID not found. Please login again.');
      return;
    }

    try {
      let url = '/api/schedule/add';
      let method = 'POST';
      let payload = {
        teacher_id: userId,
        subject: selectedSubject,
        days: selectedDays,
        time_slots: timeSlotsArray,
        start_date: startDate,
        end_date: endDate
      };

      if (editingSchedule) {
        url = '/api/schedule/update';
        method = 'PUT';
        payload = {
          ...payload,
          schedule_id: editingSchedule.id
        };
      }

      console.log('📤 Sending schedule payload:', payload);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Schedule response:', data);
      
      if (data.success) {
        setSuccess(editingSchedule ? '✅ Schedule updated!' : '✅ Schedule added!');
        resetForm();
        await Promise.all([
          fetchTeacherProfile(),
          fetchSchedules()
        ]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save schedule');
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Error: ' + err.message);
    }
  };

  // ✅ Handle delete
  const handleDelete = async (schedule) => {
    if (!window.confirm(`Delete schedule for "${schedule.subject}"?`)) return;

    try {
      const response = await fetch('/api/schedule/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schedule_id: schedule.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('✅ Schedule deleted!');
        await Promise.all([
          fetchTeacherProfile(),
          fetchSchedules()
        ]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Error: ' + err.message);
    }
  };

  // ✅ FIXED: getModeIcon - teaching_mode ke hisaab se icon dikhaye
  const getModeIcon = (mode) => {
    if (!mode) return '💻';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return '💻';
    if (modeLower === 'physical') return '🏠';
    if (modeLower === 'both') return '💻 + 🏠';
    return '💻';
  };

  // ✅ FIXED: getModeLabel - teaching_mode ke hisaab se label dikhaye
  const getModeLabel = (mode) => {
    if (!mode) return 'Online';
    const modeLower = mode.toLowerCase();
    if (modeLower === 'online') return 'Online';
    if (modeLower === 'physical') return 'Physical';
    if (modeLower === 'both') return 'Both';
    return 'Online';
  };

  const getStatusBadge = (status) => {
    if (status === 'inactive') {
      return { color: '#94a3b8', bg: '#f1f5f9', label: '⚪ Inactive' };
    }
    return { color: '#22c55e', bg: '#f0fdf4', label: '🟢 Active' };
  };

  // ✅ Handle Back to Dashboard
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard');
  };

  const styles = {
    container: { 
      minHeight: '100vh', 
      backgroundColor: '#f1f5f9', 
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      display: 'flex',
    },
    mainLayout: {
      display: 'flex',
      marginLeft: '260px',
      minHeight: '100vh',
      width: '100%',
    },
    content: {
      flex: 1,
      padding: '30px 40px',
      overflowY: 'auto',
      height: '100vh',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: 'white',
      border: '2px solid #e8e8e8',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px',
    },
    titleSection: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f1f3e',
    },
    subtitle: {
      color: '#666',
      fontSize: '14px',
      marginTop: '2px',
    },
    addBtn: {
      padding: '12px 28px',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    addBtnDisabled: {
      padding: '12px 28px',
      background: '#94a3b8',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: 0.6,
      fontFamily: 'inherit',
    },
    summaryCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '25px',
      border: '1px solid #e8e8e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    },
    summaryLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    summaryTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    summarySub: {
      fontSize: '14px',
      color: '#666',
    },
    summaryRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
    },
    summaryMode: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: '#eff6ff',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#3b82f6',
    },
    summaryStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
    },
    summaryStatusComplete: {
      background: '#f0fdf4',
      color: '#22c55e',
    },
    summaryStatusIncomplete: {
      background: '#fef3c7',
      color: '#d97706',
    },
    completeCard: {
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      borderRadius: '16px',
      padding: '24px 30px',
      marginBottom: '25px',
      border: '2px solid #22c55e',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
      boxShadow: '0 4px 20px rgba(34, 197, 94, 0.15)',
    },
    completeIcon: {
      fontSize: '40px',
      flexShrink: 0,
    },
    completeContent: {
      flex: 1,
    },
    completeTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#16a34a',
    },
    completeSubtext: {
      fontSize: '14px',
      color: '#15803d',
      marginTop: '2px',
    },
    formCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid #e8e8e8',
    },
    formTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '20px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    labelRequired: {
      color: '#ef4444',
      marginLeft: '4px',
    },
    labelOptional: {
      color: '#94a3b8',
      fontSize: '12px',
      fontWeight: '400',
      marginLeft: '6px',
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s',
      backgroundColor: '#fafaff',
      fontFamily: 'inherit',
    },
    inputDisabled: {
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f1f5f9',
      fontFamily: 'inherit',
      color: '#64748b',
      cursor: 'not-allowed',
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#fafaff',
      fontFamily: 'inherit',
      cursor: 'pointer',
      width: '100%',
    },
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px',
      marginTop: '6px',
    },
    dayBtn: {
      padding: '10px 12px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      background: '#fafaff',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    dayBtnSelected: {
      borderColor: '#3b82f6',
      background: '#eff6ff',
      color: '#3b82f6',
    },
    timeRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '8px',
      padding: '8px 12px',
      background: '#f8fafc',
      borderRadius: '8px',
    },
    timeDay: {
      fontWeight: '500',
      color: '#1f1f3e',
      fontSize: '14px',
    },
    timeSelect: {
      padding: '8px 12px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      backgroundColor: 'white',
      fontFamily: 'inherit',
      cursor: 'pointer',
    },
    timeDisplay: {
      padding: '8px 12px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      fontSize: '13px',
      backgroundColor: '#f1f5f9',
      color: '#64748b',
      fontFamily: 'inherit',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '25px',
    },
    saveBtn: {
      padding: '12px 32px',
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    cancelBtn: {
      padding: '12px 32px',
      background: 'white',
      color: '#666',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    errorMsg: {
      color: '#ef4444',
      fontSize: '14px',
      padding: '10px 14px',
      background: '#fef2f2',
      borderRadius: '8px',
      marginBottom: '15px',
    },
    successMsg: {
      color: '#22c55e',
      fontSize: '14px',
      padding: '10px 14px',
      background: '#f0fdf4',
      borderRadius: '8px',
      marginBottom: '15px',
    },
    scheduleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
    },
    scheduleCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    scheduleCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    scheduleSubject: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e',
    },
    scheduleDays: {
      fontSize: '14px',
      color: '#555',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    scheduleTime: {
      fontSize: '14px',
      color: '#555',
    },
    scheduleDate: {
      fontSize: '13px',
      color: '#666',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    scheduleActions: {
      display: 'flex',
      gap: '10px',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0',
    },
    editBtn: {
      flex: 1,
      padding: '8px 16px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    deleteBtn: {
      flex: 1,
      padding: '8px 16px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#94a3b8',
      gridColumn: '1 / -1',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px',
    },
    emptySubtitle: {
      fontSize: '15px',
      color: '#94a3b8',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '20px',
      color: '#3b82f6',
    },
    timeNote: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    subjectNote: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    scheduleStatus: {
      fontSize: '13px',
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: '20px',
    },
    mySchedulesTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '20px',
      marginTop: '30px',
    },
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading schedules...</div>;
  }

  // ✅ Calculate summary stats
  const totalSubjects = allSubjects.length;
  const totalSchedules = schedules.length;
  const isComplete = totalSubjects > 0 && totalSchedules === totalSubjects;

  return (
    <div style={styles.container}>
      <Sidebar role="teacher" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          {/* ✅ Back to Dashboard Button */}
          <button
            style={styles.backButton}
            onClick={handleBackToDashboard}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8e8e8';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span> Back to Dashboard
          </button>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleSection}>
              <h1 style={styles.title}>📅 Manage Schedule</h1>
              <p style={styles.subtitle}>
                Set your weekly teaching availability. Students will only be able to request classes during these available time slots.
              </p>
            </div>
            
            {!showForm && (
              totalSubjects === 0 ? (
                <div style={styles.addBtnDisabled}>
                  ⚠️ No subjects added yet
                </div>
              ) : isComplete ? (
                <div style={styles.addBtnDisabled}>
                  ✅ All subjects scheduled
                </div>
              ) : (
                <button
                  style={styles.addBtn}
                  onClick={() => {
                    if (unscheduledSubjects.length > 0) {
                      setSelectedSubject(unscheduledSubjects[0]);
                    }
                    setShowForm(true);
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  + Add Schedule
                </button>
              )
            )}
          </div>

          {/* Summary Card with Progress */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryLeft}>
              <div style={styles.summaryTitle}>📊 Schedule Summary</div>
              <div style={styles.summarySub}>
                {totalSubjects > 0 ? (
                  <>
                    Total Subjects: <strong>{totalSubjects}</strong> &nbsp;·&nbsp;
                    Schedules Created: <strong>{totalSchedules}/{totalSubjects}</strong> &nbsp;·&nbsp;
                    Status: <strong style={{ color: isComplete ? '#22c55e' : '#d97706' }}>
                      {isComplete ? '✅ Complete' : '⏳ In Progress'}
                    </strong>
                  </>
                ) : (
                  'No subjects found in profile'
                )}
              </div>
            </div>
            <div style={styles.summaryRight}>
              {teachingMode && (
                <div style={styles.summaryMode}>
                  {getModeIcon(teachingMode)} {getModeLabel(teachingMode)}
                </div>
              )}
              <div style={{
                ...styles.summaryStatus,
                ...(isComplete ? styles.summaryStatusComplete : styles.summaryStatusIncomplete)
              }}>
                {isComplete ? '🟢 All Done' : '🟡 Pending'}
              </div>
            </div>
          </div>

          {/* COMPLETE CARD */}
          {isComplete && totalSubjects > 0 && (
            <div style={styles.completeCard}>
              <div style={styles.completeIcon}>✅</div>
              <div style={styles.completeContent}>
                <div style={styles.completeTitle}>All Subject Schedules Added</div>
                <div style={styles.completeSubtext}>
                  You have successfully created schedules for all your teaching subjects.
                  You can edit or delete existing schedules anytime.
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div style={styles.formCard}>
              <div style={styles.formTitle}>
                {editingSchedule ? '✏️ Edit Schedule' : '📝 Add New Schedule'}
              </div>

              {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
              {success && <div style={styles.successMsg}>✅ {success}</div>}

              <form onSubmit={handleSubmit}>
                {/* Subject Selection */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Subject/Course <span style={styles.labelRequired}>*</span>
                  </label>
                  <select
                    style={styles.select}
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                  >
                    <option value="">Select a subject</option>
                    {(editingSchedule 
                      ? allSubjects 
                      : unscheduledSubjects
                    ).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div style={styles.subjectNote}>
                    {editingSchedule 
                      ? '💡 Editing existing schedule' 
                      : unscheduledSubjects.length === 0 && allSubjects.length > 0
                        ? '✅ All subjects already have schedules'
                        : `💡 ${unscheduledSubjects.length} subject(s) remaining to schedule`
                    }
                  </div>
                </div>

                {/* Course Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      📅 Start Date <span style={styles.labelRequired}>*</span>
                    </label>
                    <input
                      type="date"
                      style={styles.input}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      📅 End Date <span style={styles.labelRequired}>*</span>
                      <span style={styles.timeNote}>(Auto-calculated - 1 month)</span>
                    </label>
                    <input
                      type="date"
                      style={styles.inputDisabled}
                      value={endDate}
                      disabled                    />
                  </div>
                </div>

                {/* Available Days */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Available Days <span style={styles.labelRequired}>*</span>
                  </label>
                  <div style={styles.daysGrid}>
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        style={{
                          ...styles.dayBtn,
                          ...(selectedDays.includes(day) ? styles.dayBtnSelected : {})
                        }}
                        onClick={() => toggleDay(day)}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDays.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Time Slots <span style={styles.labelRequired}>*</span>
                      <span style={styles.timeNote}>(Each session is 1 hour)</span>
                    </label>
                    {selectedDays.map((day) => (
                      <div key={day} style={styles.timeRow}>
                        <span style={styles.timeDay}>{day}</span>
                        <select
                          style={styles.timeSelect}
                          value={timeSlots[day]?.start || ''}
                          onChange={(e) => handleTimeChange(day, e.target.value)}
                          required
                        >
                          <option value="">Select time</option>
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          style={styles.timeDisplay}
                          value={timeSlots[day]?.end || 'Auto'}
                          disabled
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.formActions}>
                  <button
                    type="submit"
                    style={styles.saveBtn}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {editingSchedule ? '💾 Update Schedule' : '💾 Save Schedule'}
                  </button>
                  <button
                    type="button"
                    style={styles.cancelBtn}
                    onClick={resetForm}
                    onMouseEnter={(e) => e.target.style.borderColor = '#999'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e8e8e8'}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Teaching Schedules */}
          <div style={styles.mySchedulesTitle}>📋 My Teaching Schedules</div>
          <div style={styles.scheduleGrid}>
            {schedules.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📅</div>
                <div style={styles.emptyTitle}>No schedules added yet</div>
                <div style={styles.emptySubtitle}>
                  {allSubjects.length > 0 
                    ? `Click "Add Schedule" to set availability for your ${allSubjects.length} subject(s)`
                    : 'Please add subjects in your profile first'}
                </div>
              </div>
            ) : (
              schedules.map((schedule) => {
                const status = getStatusBadge(schedule.status);
                const timeSlotsDisplay = schedule.time_slots || [];
                
                return (
                  <div key={schedule.id} style={styles.scheduleCard}>
                    <div style={styles.scheduleCardHeader}>
                      <div style={styles.scheduleSubject}>📚 {schedule.subject}</div>
                      <span style={{
                        ...styles.scheduleStatus,
                        backgroundColor: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </div>

                    <div style={styles.scheduleDate}>
                      📆 {schedule.start_date} → {schedule.end_date}
                    </div>

                    <div style={styles.scheduleDays}>
                      📅 {schedule.days?.join(' • ')}
                    </div>

                    {timeSlotsDisplay.map((slot, idx) => (
                      <div key={idx} style={styles.scheduleTime}>
                        🕘 {slot.day}: {slot.start_time} → {slot.end_time}
                      </div>
                    ))}

                    <div style={styles.scheduleActions}>
                      <button
                        style={styles.editBtn}
                        onClick={() => handleEdit(schedule)}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(schedule)}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;