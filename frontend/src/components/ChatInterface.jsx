// components/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  FaPaperPlane, FaUserCircle, FaSmile, FaPaperclip, 
  FaCheck, FaCheckDouble, FaClock, FaExclamationTriangle,
  FaSearch, FaPhone, FaEnvelope, FaInstagram, FaWhatsapp
} from 'react-icons/fa';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [blockedContent, setBlockedContent] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sample Conversations Data
  useEffect(() => {
    setConversations([
      {
        id: 1,
        name: 'Ahmed Sir',
        role: 'teacher',
        subject: 'Mathematics',
        lastMessage: 'Hello, how are you?',
        lastMessageTime: '5:30 PM',
        unreadCount: 2,
        online: true,
        profilePicture: null,
        lastMessageIsOwn: false
      },
      {
        id: 2,
        name: 'Sara Teacher',
        role: 'teacher',
        subject: 'Physics',
        lastMessage: 'Fee details updated',
        lastMessageTime: '3:15 PM',
        unreadCount: 0,
        online: false,
        profilePicture: null,
        lastMessageIsOwn: true
      },
      {
        id: 3,
        name: 'Ali Khan',
        role: 'student',
        subject: 'Chemistry',
        lastMessage: 'Tomorrow 5 PM?',
        lastMessageTime: 'Yesterday',
        unreadCount: 1,
        online: false,
        profilePicture: null,
        lastMessageIsOwn: false
      }
    ]);

    // Sample Messages
    setMessages([
      {
        id: 1,
        senderId: 'teacher1',
        senderName: 'Ahmed Sir',
        message: 'Hello! How can I help you today?',
        timestamp: '5:15 PM',
        isOwn: false,
        isRead: true,
        type: 'text'
      },
      {
        id: 2,
        senderId: 'student1',
        senderName: 'You',
        message: 'I need help with Math assignment',
        timestamp: '5:20 PM',
        isOwn: true,
        isRead: true,
        type: 'text'
      },
      {
        id: 3,
        senderId: 'teacher1',
        senderName: 'Ahmed Sir',
        message: 'Sure! What topic?',
        timestamp: '5:25 PM',
        isOwn: false,
        isRead: true,
        type: 'text'
      },
      {
        id: 4,
        senderId: 'student1',
        senderName: 'You',
        message: 'Calculus integration problems',
        timestamp: '5:28 PM',
        isOwn: true,
        isRead: true,
        type: 'text'
      },
      {
        id: 5,
        senderId: 'teacher1',
        senderName: 'Ahmed Sir',
        message: 'Tomorrow 5 PM works for me',
        timestamp: '5:30 PM',
        isOwn: false,
        isRead: false,
        type: 'text'
      }
    ]);

    setSelectedChat(1);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // AI Moderation Function - Detects sensitive information
  const moderateMessage = (text) => {
    const blockedItems = [];
    const warnings = [];

    // Phone Number Detection (Pakistan format)
    const phoneRegex = /(03[0-9]{2}[-.\s]?[0-9]{7}|03[0-9]{9}|[0-9]{4}[-.\s]?[0-9]{7})/g;
    if (phoneRegex.test(text)) {
      blockedItems.push({ type: 'phone', content: 'Phone Number' });
      warnings.push('📱 Phone Number');
    }

    // Email Detection
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailRegex.test(text)) {
      blockedItems.push({ type: 'email', content: 'Email Address' });
      warnings.push('📧 Email Address');
    }

    // Social Media Detection
    const socialMediaRegex = /(instagram|facebook|twitter|youtube|tiktok|snapchat|linkedin)/gi;
    if (socialMediaRegex.test(text)) {
      blockedItems.push({ type: 'social', content: 'Social Media' });
      warnings.push('📱 Social Media ID');
    }

    // WhatsApp Number Detection
    const whatsappRegex = /(whatsapp|wa\.me|wa\.link)/gi;
    if (whatsappRegex.test(text)) {
      blockedItems.push({ type: 'whatsapp', content: 'WhatsApp' });
      warnings.push('💬 WhatsApp');
    }

    // Address Detection (for online classes)
    const addressRegex = /(house|street|road|block|sector|phase|near|address)/gi;
    const isOnlineMode = true; // This should come from session settings
    if (addressRegex.test(text) && isOnlineMode) {
      blockedItems.push({ type: 'address', content: 'Physical Address' });
      warnings.push('📍 Physical Address');
    }

    return { blocked: blockedItems.length > 0, blockedItems, warnings };
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // AI Moderation Check
    const moderationResult = moderateMessage(newMessage);
    
    if (moderationResult.blocked) {
      setBlockedContent(moderationResult.blockedItems);
      setWarningMessage(
        `⚠️ Personal information detected in your message.\n\nPlease do not share:\n${moderationResult.warnings.map(w => `• ${w}`).join('\n')}`
      );
      setShowWarning(true);
      
      // Block the message
      setNewMessage('');
      inputRef.current?.focus();
      return;
    }

    // Send message if not blocked
    const newMsg = {
      id: messages.length + 1,
      senderId: 'student1',
      senderName: 'You',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      isRead: false,
      type: 'text'
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Auto-reply for demo
      const reply = {
        id: messages.length + 2,
        senderId: 'teacher1',
        senderName: 'Ahmed Sir',
        message: getAutoReply(newMessage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        isRead: false,
        type: 'text'
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const getAutoReply = (message) => {
    const replies = [
      "That's great! Let me think about it.",
      "I understand. Let me help you with that.",
      "Perfect! I'll prepare the material for you.",
      "Got it! I'll send you the details shortly.",
      "Sure! We can discuss this in more detail."
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    // Mark messages as read
    const updatedConversations = conversations.map(conv => 
      conv.id === chatId ? { ...conv, unreadCount: 0 } : conv
    );
    setConversations(updatedConversations);
  };

  // Styles
  const styles = {
    chatContainer: {
      display: 'flex',
      height: 'calc(100vh - 120px)',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      margin: '2rem auto',
      maxWidth: '1100px'
    },
    conversationList: {
      width: '320px',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafbfc'
    },
    chatHeader: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e2e8f0',
      background: 'white'
    },
    chatHeaderTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0
    },
    chatHeaderSubtitle: {
      fontSize: '0.85rem',
      color: '#64748b'
    },
    searchBox: {
      padding: '0.75rem 1rem',
      margin: '0.75rem 1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'white'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      fontSize: '0.9rem',
      flex: 1,
      background: 'transparent'
    },
    conversationItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      transition: 'background 0.2s',
      borderBottom: '1px solid #f1f5f9',
      position: 'relative'
    },
    conversationItemActive: {
      background: '#eef2ff'
    },
    convAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      color: '#94a3b8',
      flexShrink: 0,
      marginRight: '0.75rem',
      position: 'relative'
    },
    onlineDot: {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: '#22c55e',
      border: '2px solid white'
    },
    convInfo: {
      flex: 1,
      minWidth: 0
    },
    convName: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#1e293b'
    },
    convSubject: {
      fontSize: '0.75rem',
      color: '#94a3b8'
    },
    convLastMessage: {
      fontSize: '0.85rem',
      color: '#64748b',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    convMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '0.25rem',
      flexShrink: 0
    },
    convTime: {
      fontSize: '0.7rem',
      color: '#94a3b8'
    },
    unreadBadge: {
      background: '#4f46e5',
      color: 'white',
      fontSize: '0.7rem',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '12px',
      minWidth: '20px',
      textAlign: 'center'
    },
    chatWindow: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'white'
    },
    chatWindowHeader: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'white'
    },
    windowAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      color: '#94a3b8'
    },
    windowInfo: {
      flex: 1
    },
    windowName: {
      fontSize: '1rem',
      fontWeight: '500',
      color: '#1e293b'
    },
    windowStatus: {
      fontSize: '0.8rem',
      color: '#64748b'
    },
    windowOnline: {
      color: '#22c55e'
    },
    messagesContainer: {
      flex: 1,
      padding: '1.5rem',
      overflowY: 'auto',
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    messageWrapper: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '70%'
    },
    messageOwn: {
      alignSelf: 'flex-end'
    },
    messageOther: {
      alignSelf: 'flex-start'
    },
    messageBubble: {
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      lineHeight: 1.5,
      wordBreak: 'break-word'
    },
    messageBubbleOwn: {
      background: '#4f46e5',
      color: 'white',
      borderBottomRightRadius: '4px'
    },
    messageBubbleOther: {
      background: 'white',
      color: '#1e293b',
      borderBottomLeftRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    messageSender: {
      fontSize: '0.75rem',
      color: '#64748b',
      marginBottom: '0.25rem',
      paddingLeft: '0.25rem'
    },
    messageTime: {
      fontSize: '0.7rem',
      color: '#94a3b8',
      marginTop: '0.25rem',
      paddingLeft: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    messageTimeOwn: {
      justifyContent: 'flex-end',
      paddingRight: '0.25rem'
    },
    typingIndicator: {
      padding: '0.5rem 1rem',
      color: '#64748b',
      fontSize: '0.9rem',
      fontStyle: 'italic'
    },
    messageInputArea: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-end',
      background: 'white'
    },
    inputWrapper: {
      flex: 1,
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '0.6rem 1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '0.95rem',
      outline: 'none',
      resize: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.3s',
      minHeight: '40px',
      maxHeight: '120px'
    },
    inputActions: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center'
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.2rem',
      cursor: 'pointer',
      color: '#94a3b8',
      padding: '0.25rem',
      transition: 'color 0.3s'
    },
    sendBtn: {
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '0.6rem 1.2rem',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    sendBtnDisabled: {
      background: '#94a3b8',
      cursor: 'not-allowed'
    },
    warningOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderRadius: '12px'
    },
    warningModal: {
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    warningIcon: {
      fontSize: '3rem',
      color: '#ef4444',
      marginBottom: '1rem'
    },
    warningTitle: {
      color: '#dc2626',
      fontSize: '1.3rem',
      marginBottom: '0.5rem'
    },
    warningText: {
      color: '#64748b',
      fontSize: '0.95rem',
      lineHeight: 1.6,
      marginBottom: '1.5rem',
      whiteSpace: 'pre-line'
    },
    warningBtn: {
      background: '#4f46e5',
      color: 'white',
      padding: '0.6rem 2rem',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.95rem',
      cursor: 'pointer',
      transition: 'background 0.3s'
    },
    readStatus: {
      fontSize: '0.7rem',
      color: '#94a3b8',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    readStatusOwn: {
      justifyContent: 'flex-end'
    }
  };

  const renderConversation = (conv) => (
    <div 
      key={conv.id}
      style={{
        ...styles.conversationItem,
        ...(selectedChat === conv.id ? styles.conversationItemActive : {})
      }}
      onClick={() => handleSelectChat(conv.id)}
    >
      <div style={styles.convAvatar}>
        <FaUserCircle />
        {conv.online && <span style={styles.onlineDot}></span>}
      </div>
      <div style={styles.convInfo}>
        <div style={styles.convName}>{conv.name}</div>
        <div style={styles.convSubject}>{conv.subject} • {conv.role}</div>
        <div style={styles.convLastMessage}>
          {conv.lastMessageIsOwn && 'You: '}{conv.lastMessage}
        </div>
      </div>
      <div style={styles.convMeta}>
        <span style={styles.convTime}>{conv.lastMessageTime}</span>
        {conv.unreadCount > 0 && (
          <span style={styles.unreadBadge}>{conv.unreadCount}</span>
        )}
      </div>
    </div>
  );

  const renderMessage = (msg, index) => {
    const isOwn = msg.isOwn;
    return (
      <div 
        key={msg.id}
        style={{
          ...styles.messageWrapper,
          ...(isOwn ? styles.messageOwn : styles.messageOther)
        }}
      >
        <div style={styles.messageSender}>
          {!isOwn && msg.senderName}
        </div>
        <div 
          style={{
            ...styles.messageBubble,
            ...(isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther)
          }}
        >
          {msg.message}
        </div>
        <div 
          style={{
            ...styles.messageTime,
            ...(isOwn ? styles.messageTimeOwn : {})
          }}
        >
          {msg.timestamp}
          {isOwn && (
            <span style={styles.readStatus}>
              {msg.isRead ? <FaCheckDouble /> : <FaCheck />}
            </span>
          )}
        </div>
      </div>
    );
  };

  const selectedConv = conversations.find(c => c.id === selectedChat);

  return (
    <div style={styles.chatContainer}>
      {/* Warning Modal */}
      {showWarning && (
        <div style={styles.warningOverlay}>
          <div style={styles.warningModal}>
            <div style={styles.warningIcon}>⚠️</div>
            <h3 style={styles.warningTitle}>Personal Information Detected!</h3>
            <p style={styles.warningText}>{warningMessage}</p>
            <button 
              style={styles.warningBtn}
              onClick={() => setShowWarning(false)}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div style={styles.conversationList}>
        <div style={styles.chatHeader}>
          <h3 style={styles.chatHeaderTitle}>💬 Messages</h3>
          <p style={styles.chatHeaderSubtitle}>
            {conversations.length} conversations
          </p>
        </div>
        
        <div style={styles.searchBox}>
          <FaSearch style={{ color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search conversations..."
            style={styles.searchInput}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(conv => renderConversation(conv))}
        </div>
      </div>

      {/* Chat Window */}
      <div style={styles.chatWindow}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatWindowHeader}>
              <div style={styles.windowAvatar}>
                <FaUserCircle />
              </div>
              <div style={styles.windowInfo}>
                <div style={styles.windowName}>{selectedConv.name}</div>
                <div style={styles.windowStatus}>
                  <span style={selectedConv.online ? styles.windowOnline : {}}>
                    {selectedConv.online ? '🟢 Online' : '⚪ Offline'}
                  </span>
                  {' • '}{selectedConv.subject}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={styles.actionBtn}>📞</button>
                <button style={styles.actionBtn}>📹</button>
              </div>
            </div>

            {/* AI Warning Banner */}
            <div style={{
              padding: '0.5rem 1rem',
              background: '#fef3c7',
              borderBottom: '1px solid #f59e0b',
              fontSize: '0.8rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaExclamationTriangle />
              <span>AI Alert: Sharing personal contact details is not allowed. For physical classes, address will be shared through platform only after request accepted.</span>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
              {messages.map((msg, index) => renderMessage(msg, index))}
              
              {isTyping && (
                <div style={styles.typingIndicator}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0s'
                    }}></span>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.2s'
                    }}></span>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.4s'
                    }}></span>
                  </span>
                  {selectedConv.name} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={styles.messageInputArea}>
              <div style={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputActions}>
                <button style={styles.actionBtn} title="Attachment">
                  <FaPaperclip />
                </button>
                <button style={styles.actionBtn} title="Emoji">
                  <FaSmile />
                </button>
                <button 
                  style={{
                    ...styles.sendBtn,
                    ...(!newMessage.trim() ? styles.sendBtnDisabled : {})
                  }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane /> Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <FaComments style={{ fontSize: '4rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.1rem' }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;