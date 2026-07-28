import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';

const StudentMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enrollmentId } = useParams();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [chatLocked, setChatLocked] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState('active');
  
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

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

  // ✅ Check if we're in chat view (has enrollmentId) or list view
  const isChatView = !!enrollmentId;

  useEffect(() => {
    if (isChatView && enrollmentId) {
      fetchMessages();
      intervalRef.current = setInterval(fetchMessages, 5000);
    } else {
      fetchChatEnrollments();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enrollmentId]);

  useEffect(() => {
    if (isChatView) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ✅ Fetch messages for a specific enrollment (Chat View)
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${enrollmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Messages response:', data);
      
      if (data.success) {
        setMessages(data.messages || []);
        setEnrollment(data.enrollment);
        setChatLocked(data.enrollment?.payment_status !== 'paid');
        setEnrollmentStatus(data.enrollment?.status || 'active');
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch all chat enrollments (List View)
  const fetchChatEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Chat enrollments response:', data);
      
      if (data.success) {
        setEnrollments(data.enrollments || []);
      } else {
        setError(data.error || 'Failed to load chats');
      }
    } catch (err) {
      console.error('Error fetching chat enrollments:', err);
      setError('Error loading chats');
    } finally {
      setLoading(false);
    }
  };

  const [enrollments, setEnrollments] = useState([]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (chatLocked) {
      alert('Chat is locked. Complete payment to unlock.');
      return;
    }
    if (enrollmentStatus !== 'active') {
      alert('This enrollment is no longer active.');
      return;
    }
    
    setSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: enrollment?.teacher_id || '',
          enrollment_id: enrollmentId,
          message: newMessage.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        await fetchMessages();
      } else {
        alert('❌ ' + (data.error || 'Failed to send message'));
        if (data.error === 'Payment not completed. Chat is locked.') {
          setChatLocked(true);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateString);
    } catch {
      return '';
    }
  };

  const handleOpenChat = (enrollmentId) => {
    navigate(`/student/messages/${enrollmentId}`, { state: { from: '/student/messages' } });
  };

  const handleBack = () => {
    navigate('/student/messages', { state: { from: '/student/chat' } });
  };

  const handleBackToList = () => {
    navigate('/student/messages', { state: { from: '/student/messages' } });
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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
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
    backButton: {
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
      fontFamily: 'inherit',
      width: 'fit-content'
    },
    chatHeader: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px 24px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    chatHeaderInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    chatHeaderAvatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      color: 'white'
    },
    chatHeaderName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    chatHeaderSubject: {
      fontSize: '13px',
      color: '#94a3b8'
    },
    chatLockBadge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: '#fef3c7',
      color: '#b45309'
    },
    chatUnlockBadge: {
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: '#dcfce7',
      color: '#16a34a'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      minHeight: '400px',
      maxHeight: 'calc(100vh - 320px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    messageWrapper: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '70%'
    },
    messageWrapperSent: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end'
    },
    messageWrapperReceived: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start'
    },
    messageBubble: {
      padding: '10px 16px',
      borderRadius: '12px',
      wordBreak: 'break-word',
      fontSize: '14px',
      lineHeight: '1.5',
      position: 'relative'
    },
    messageBubbleSent: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      borderBottomRightRadius: '4px'
    },
    messageBubbleReceived: {
      background: '#f1f5f9',
      color: '#1f1f3e',
      borderBottomLeftRadius: '4px'
    },
    messageMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '4px',
      padding: '0 4px'
    },
    messageSender: {
      fontWeight: '500'
    },
    messageTime: {
      fontSize: '10px'
    },
    messageStatus: {
      fontSize: '10px'
    },
    dateDivider: {
      textAlign: 'center',
      fontSize: '12px',
      color: '#94a3b8',
      padding: '8px 0',
      margin: '4px 0'
    },
    lockMessage: {
      textAlign: 'center',
      padding: '30px',
      color: '#94a3b8',
      fontSize: '15px'
    },
    lockIcon: {
      fontSize: '48px',
      display: 'block',
      marginBottom: '12px'
    },
    inputContainer: {
      display: 'flex',
      gap: '12px',
      padding: '16px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      marginTop: '16px'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e8e8e8',
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.3s'
    },
    inputDisabled: {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
      color: '#94a3b8'
    },
    sendBtn: {
      padding: '12px 28px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap'
    },
    sendBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    // ✅ List View Styles
    chatList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    chatItem: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px 20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    chatItemAvatar: {
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0
    },
    chatItemContent: {
      flex: 1,
      minWidth: 0
    },
    chatItemName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f1f3e'
    },
    chatItemSubject: {
      fontSize: '13px',
      color: '#94a3b8'
    },
    chatItemLastMessage: {
      fontSize: '14px',
      color: '#475569',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginTop: '2px'
    },
    chatItemTime: {
      fontSize: '12px',
      color: '#94a3b8',
      whiteSpace: 'nowrap'
    },
    chatItemRight: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px'
    },
    unreadBadge: {
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      background: '#6366f1',
      color: 'white'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e8e8e8'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f1f3e',
      marginBottom: '8px'
    },
    emptySubtitle: {
      fontSize: '15px',
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
      fontSize: '14px'
    }
  };

  // ✅ RENDER LIST VIEW (No enrollmentId in URL)
  if (!isChatView) {
    if (loading) {
      return (
        <div style={styles.container}>
          <Sidebar role="student" />
          <div style={styles.mainLayout}>
            <div style={styles.content}>
              <div style={styles.loadingContainer}>Loading messages...</div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.container}>
          <Sidebar role="student" />
          <div style={styles.mainLayout}>
            <div style={styles.content}>
              <div style={styles.errorContainer}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <div>{error}</div>
                <button style={styles.errorButton} onClick={() => window.location.reload()}>Retry</button>
              </div>
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
            
            {/* Back Button */}
            {location.state?.from && (
              <BackButton label="← Back" fallbackPath="/student-dashboard" />
            )}

            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>💬 Messages</h1>
                <p style={styles.subtitle}>
                  {enrollments.length > 0 
                    ? `You have ${enrollments.length} active chat${enrollments.length > 1 ? 's' : ''}`
                    : 'No active chats yet'}
                </p>
              </div>
            </div>

            {enrollments.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💬</div>
                <div style={styles.emptyTitle}>No messages yet</div>
                <div style={styles.emptySubtitle}>
                  When you have active enrollments, your chats will appear here.
                </div>
              </div>
            ) : (
              <div style={styles.chatList}>
                {enrollments.map((chat) => {
                  const otherUser = chat.other_user_name || 'User';
                  const initial = getInitials(otherUser);
                  const isLocked = chat.payment_status !== 'paid';
                  // ✅ FIXED: Get subject display name
                  const subjectDisplay = getSubjectDisplay(chat.subject);
                  
                  return (
                    <div
                      key={chat._id}
                      style={styles.chatItem}
                      onClick={() => handleOpenChat(chat._id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                      }}
                    >
                      <div style={styles.chatItemAvatar}>{initial}</div>
                      <div style={styles.chatItemContent}>
                        <div style={styles.chatItemName}>
                          {otherUser}
                          {isLocked && <span style={{ fontSize: '12px', color: '#b45309', marginLeft: '8px' }}>🔒</span>}
                        </div>
                        <div style={styles.chatItemSubject}>{subjectDisplay}</div>
                        <div style={styles.chatItemLastMessage}>
                          {chat.last_message ? (
                            <span>
                              {chat.last_message_sender === 'You' ? 'You: ' : ''}
                              {chat.last_message}
                            </span>
                          ) : (
                            'No messages yet'
                          )}
                        </div>
                      </div>
                      <div style={styles.chatItemRight}>
                        <div style={styles.chatItemTime}>
                          {chat.last_message_at ? formatTimeAgo(chat.last_message_at) : ''}
                        </div>
                        {chat.unread_count > 0 && (
                          <div style={styles.unreadBadge}>{chat.unread_count}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER CHAT VIEW (Has enrollmentId)
  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.loadingContainer}>Loading chat...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !messages.length) {
    return (
      <div style={styles.container}>
        <Sidebar role="student" />
        <div style={styles.mainLayout}>
          <div style={styles.content}>
            <div style={styles.errorContainer}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div>{error}</div>
              <button style={styles.errorButton} onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const otherUser = enrollment?.teacher_name || 'Teacher';
  const otherUserInitial = getInitials(otherUser);
  const subject = getSubjectDisplay(enrollment?.subject || 'General');
  const isLocked = chatLocked || enrollmentStatus !== 'active';

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = msg.created_at ? new Date(msg.created_at).toDateString() : 'today';
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div style={styles.container}>
      <Sidebar role="student" />
      <div style={styles.mainLayout}>
        <div style={styles.content}>
          
          {/* Back Button */}
          <button
            style={styles.backButton}
            onClick={handleBackToList}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            ← All Messages
          </button>

          {/* Chat Header */}
          <div style={styles.chatHeader}>
            <div style={styles.chatHeaderInfo}>
              <div style={styles.chatHeaderAvatar}>
                {otherUserInitial}
              </div>
              <div>
                <div style={styles.chatHeaderName}>{otherUser}</div>
                <div style={styles.chatHeaderSubject}>{subject}</div>
              </div>
            </div>
            <div>
              {isLocked ? (
                <span style={styles.chatLockBadge}>🔒 Locked</span>
              ) : (
                <span style={styles.chatUnlockBadge}>🔓 Unlocked</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer}>
            {isLocked ? (
              <div style={styles.lockMessage}>
                <span style={styles.lockIcon}>🔒</span>
                <div>
                  {enrollmentStatus !== 'active' 
                    ? 'This enrollment is no longer active.' 
                    : 'Chat will be available after payment confirmation.'}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.lockMessage}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💬</span>
                <div>No messages yet. Say hello!</div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <React.Fragment key={date}>
                  <div style={styles.dateDivider}>
                    {date === new Date().toDateString() ? 'Today' : formatDate(date) || date}
                  </div>
                  {msgs.map((msg) => {
                    const isSender = msg.is_sender || msg.sender_id === user?._id;
                    const senderName = isSender ? 'You' : (enrollment?.teacher_name || 'Teacher');
                    
                    return (
                      <div
                        key={msg._id}
                        style={{
                          ...styles.messageWrapper,
                          ...(isSender ? styles.messageWrapperSent : styles.messageWrapperReceived)
                        }}
                      >
                        <div
                          style={{
                            ...styles.messageBubble,
                            ...(isSender ? styles.messageBubbleSent : styles.messageBubbleReceived)
                          }}
                        >
                          {msg.message}
                        </div>
                        <div style={styles.messageMeta}>
                          <span style={styles.messageSender}>{senderName}</span>
                          <span style={styles.messageTime}>{formatTime(msg.created_at)}</span>
                          {isSender && (
                            <span style={styles.messageStatus}>
                              {msg.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form style={styles.inputContainer} onSubmit={handleSendMessage}>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(isLocked || sending ? styles.inputDisabled : {})
              }}
              placeholder={isLocked ? 'Chat locked' : 'Type your message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
              disabled={isLocked || sending}
            />
            <button
              type="submit"
              style={{
                ...styles.sendBtn,
                ...(isLocked || sending || !newMessage.trim() ? styles.sendBtnDisabled : {})
              }}
              disabled={isLocked || sending || !newMessage.trim()}
              onMouseEnter={(e) => {
                if (!isLocked && !sending && newMessage.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLocked && !sending && newMessage.trim()) {
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {sending ? '⏳ Sending...' : 'Send'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default StudentMessages;