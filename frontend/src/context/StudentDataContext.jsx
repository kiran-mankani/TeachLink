import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const StudentDataContext = createContext();

export function StudentDataProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.userId || user?.email || 'guest';

  const getKey = (type) => `teachlink_${userId}_${type}`;

  const load = (type, fallback = []) => {
    try {
      const data = localStorage.getItem(getKey(type));
      return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
  };

  const save = (type, data) => {
    localStorage.setItem(getKey(type), JSON.stringify(data));
  };

  const [requests, setRequests] = useState(() => load('requests'));
  const [myTutors, setMyTutors] = useState(() => load('myTutors'));
  const [sessions, setSessions] = useState(() => load('sessions'));
  const [payments, setPayments] = useState(() => load('payments'));
  const [notifications, setNotifications] = useState(() => load('notifications'));

  useEffect(() => { save('requests', requests); }, [requests]);
  useEffect(() => { save('myTutors', myTutors); }, [myTutors]);
  useEffect(() => { save('sessions', sessions); }, [sessions]);
  useEffect(() => { save('payments', payments); }, [payments]);
  useEffect(() => { save('notifications', notifications); }, [notifications]);

  // Send connection request to tutor
  const sendRequest = (tutor) => {
    const already = requests.find(r => r.tutorId === tutor.id);
    if (already) return 'already_sent';
    const alreadyConnected = myTutors.find(t => t.id === tutor.id);
    if (alreadyConnected) return 'already_connected';

    const newRequest = {
      id: Date.now(),
      tutorId: tutor.id,
      tutorName: tutor.name,
      subject: tutor.subject,
      fee: tutor.fee,
      location: tutor.location,
      rating: tutor.rating,
      experience: tutor.experience,
      online: tutor.online,
      physical: tutor.physical,
      status: 'pending',
      sentAt: new Date().toLocaleDateString(),
    };
    setRequests(prev => [...prev, newRequest]);

    // Add notification
    addNotification({
      type: 'connection',
      icon: '🤝',
      title: 'Request Sent',
      message: `Your connection request has been sent to ${tutor.name} for ${tutor.subject}.`,
    });

    return 'sent';
  };

  // Accept request (simulate teacher accepting)
  const acceptRequest = (requestId) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));

    // Add to My Tutors
    setMyTutors(prev => [...prev, {
      id: req.tutorId,
      name: req.tutorName,
      subject: req.subject,
      fee: req.fee,
      location: req.location,
      rating: req.rating,
      experience: req.experience,
      online: req.online,
      physical: req.physical,
      connectedAt: new Date().toLocaleDateString(),
    }]);

    // Add notification
    addNotification({
      type: 'accepted',
      icon: '✅',
      title: 'Request Accepted!',
      message: `${req.tutorName} has accepted your request for ${req.subject}. You can now schedule sessions!`,
    });
  };

  // Add session
  const addSession = (session) => {
    const newSession = { id: Date.now(), ...session, status: 'Upcoming' };
    setSessions(prev => [...prev, newSession]);
    addNotification({
      type: 'session',
      icon: '📅',
      title: 'Session Scheduled',
      message: `${session.subject} session with ${session.tutor} scheduled for ${session.day} at ${session.time}.`,
    });
  };

  const cancelSession = (id) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'Cancelled' } : s));
  };

  // Add payment
  const addPayment = (payment) => {
    const commission = Math.round(payment.amount * 0.10);
    const newPayment = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      commission,
      teacherReceives: payment.amount - commission,
      status: 'Pending',
      ...payment,
    };
    setPayments(prev => [...prev, newPayment]);
    addNotification({
      type: 'payment',
      icon: '💳',
      title: 'Payment Initiated',
      message: `Payment of Rs. ${payment.amount.toLocaleString()} for ${payment.subject} is pending.`,
    });
    return newPayment.id;
  };

  const confirmPayment = (id) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
    const p = payments.find(pay => pay.id === id);
    if (p) {
      addNotification({
        type: 'payment',
        icon: '✅',
        title: 'Payment Successful',
        message: `Rs. ${p.amount.toLocaleString()} paid. ${p.tutor} will receive Rs. ${p.teacherReceives.toLocaleString()} after 1 month.`,
      });
    }
  };

  // Notifications
  const addNotification = (notif) => {
    setNotifications(prev => [{
      id: Date.now(),
      ...notif,
      time: 'Just now',
      read: false,
    }, ...prev]);
  };

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const unreadCount = notifications.filter(n => !n.read).length;

  const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const upcomingSessions = sessions.filter(s => s.status === 'Upcoming').length;

  return (
    <StudentDataContext.Provider value={{
      requests, myTutors, sessions, payments, notifications,
      unreadCount, pendingPayments, upcomingSessions,
      sendRequest, acceptRequest,
      addSession, cancelSession,
      addPayment, confirmPayment,
      addNotification, markRead, markAllRead, deleteNotif,
    }}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  return useContext(StudentDataContext);
}