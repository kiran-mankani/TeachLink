const API_BASE = '/api';

export const api = {
  // ==============================
  // LOGIN
  // ==============================
  login: async (email, password) => {
    try {
      console.log('📤 Sending login request for:', email);
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('📥 Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  // ==============================
  // SIGNUP
  // ==============================
  signup: async (userData) => {
    try {
      console.log('📤 Sending signup request:', userData);
      
      const role = userData.role || 'student';
      const endpoint = role === 'student' ? '/auth/register/student' : '/auth/register/teacher';
      
      const payload = {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: role,
        location: userData.location || '',
        age: userData.age || '',
        gender: userData.gender || '',
        education_level: userData.education_level || '',
        school: userData.school || '',
        college: userData.college || '',
        university: userData.university || '',
        subjects: userData.subjects || [],
        budget_range: userData.budget_range || '',
        preferred_mode: userData.preferred_mode || 'online',
        preferred_timing: userData.preferred_timing || '',
        qualification: userData.qualification || '',
        experience: userData.experience || '',
        certifications: userData.certifications || '',
        fee_range: userData.fee_range || '',
        teaching_mode: userData.teaching_mode || 'online',
        availability_days: userData.availability_days || [],
        time_slots: userData.time_slots || [],
        bio: userData.bio || ''
      };
      
      console.log(`📤 Sending to ${endpoint} with payload:`, payload);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📥 Signup response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      return data;
    } catch (error) {
      console.error('Signup API error:', error);
      throw error;
    }
  },

  // ==============================
  // GET CURRENT USER
  // ==============================
  getCurrentUser: async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user');
      }
      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // ==============================
  // LOGOUT
  // ==============================
  logout: async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Logout failed');
      }
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // ==============================
  // STUDENT DASHBOARD
  // ==============================
  getStudentDashboard: async (token) => {
    const response = await fetch(`${API_BASE}/student/dashboard`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard');
    }
    return data;
  },

  // ==============================
  // TEACHER DASHBOARD
  // ==============================
  getTeacherDashboard: async (token) => {
    const response = await fetch(`${API_BASE}/teacher/dashboard`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard');
    }
    return data;
  },

  // ==============================
  // SEND REQUEST
  // ==============================
  sendRequest: async (token, data) => {
    const response = await fetch(`${API_BASE}/requests/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send request');
    }
    return result;
  },

  // ==============================
  // PROFILE API
  // ==============================
  getPublicProfile: async (userId) => {
    const response = await fetch(`${API_BASE}/profile/public/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  getMyProfile: async (token) => {
    const response = await fetch(`${API_BASE}/profile/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  updateProfile: async (token, profileData) => {
    const response = await fetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  // ==============================
  // NOTIFICATION API
  // ==============================
  getNotifications: async (token) => {
    const response = await fetch(`${API_BASE}/notifications/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch notifications');
    return data;
  },

  getUnreadCount: async (token) => {
    const response = await fetch(`${API_BASE}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch count');
    return data;
  },

  markNotificationRead: async (token, notifId) => {
    const response = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to mark read');
    return data;
  },

  // ==============================
  // STUDENT PROFILE COMPLETION
  // ==============================
  completeStudentProfile: async (token, data) => {
    const response = await fetch(`${API_BASE}/student/complete-profile`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to complete profile');
    return result;
  },

  getStudentProfileStatus: async (token) => {
    const response = await fetch(`${API_BASE}/student/profile-status`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch status');
    return data;
  },

  getNearbyTeachers: async (token) => {
    const response = await fetch(`${API_BASE}/student/nearby-teachers`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch teachers');
    return data;
  },

  // ==============================
  // TEACHER PROFILE COMPLETION
  // ==============================
  completeTeacherProfile: async (token, data) => {
    const response = await fetch(`${API_BASE}/teacher/complete-profile`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to complete profile');
    return result;
  },

  getTeacherProfileStatus: async (token) => {
    const response = await fetch(`${API_BASE}/teacher/profile-status`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch status');
    return data;
  },

  // ==============================
  // GENERIC PROFILE STATUS
  // ==============================
  getProfileStatus: async (token) => {
    try {
      const studentStatus = await api.getStudentProfileStatus(token);
      return studentStatus;
    } catch (error) {
      try {
        const teacherStatus = await api.getTeacherProfileStatus(token);
        return teacherStatus;
      } catch (err) {
        throw new Error('Failed to fetch profile status');
      }
    }
  },

  completeProfile: async (token, data) => {
    try {
      const result = await api.completeStudentProfile(token, data);
      return result;
    } catch (error) {
      try {
        const result = await api.completeTeacherProfile(token, data);
        return result;
      } catch (err) {
        throw new Error('Failed to complete profile');
      }
    }
  },

  // ==============================
  // ENROLLMENT API
  // ==============================
  createEnrollmentRequest: async (token, data) => {
    try {
      console.log('📤 Sending enrollment request:', data);
      const response = await fetch(`/api/enrollment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      console.log('📥 Enrollment response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send enrollment request');
      }
      return result;
    } catch (error) {
      console.error('❌ Create enrollment request error:', error);
      throw error;
    }
  },

  getTeacherEnrollmentRequests: async (token) => {
    try {
      const response = await fetch(`/api/enrollment/requests/teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch teacher requests');
      }
      return result;
    } catch (error) {
      console.error('❌ Get teacher enrollment requests error:', error);
      throw error;
    }
  },

  getStudentEnrollmentRequests: async (token) => {
    try {
      const response = await fetch(`/api/enrollment/requests/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch student requests');
      }
      return result;
    } catch (error) {
      console.error('❌ Get student enrollment requests error:', error);
      throw error;
    }
  },

  acceptEnrollmentRequest: async (token, requestId) => {
    try {
      const response = await fetch(`/api/enrollment/request/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept request');
      }
      return result;
    } catch (error) {
      console.error('❌ Accept enrollment request error:', error);
      throw error;
    }
  },

  rejectEnrollmentRequest: async (token, requestId) => {
    try {
      const response = await fetch(`/api/enrollment/request/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject request');
      }
      return result;
    } catch (error) {
      console.error('❌ Reject enrollment request error:', error);
      throw error;
    }
  },

  // Get teacher profile for student view
  getTeacherProfile: async (token, teacherId) => {
    try {
      console.log('🔍 Fetching teacher profile:', teacherId);
      
      try {
        const response = await fetch(`/api/profile/teacher/${teacherId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        if (response.ok && result.teacher) {
          console.log('✅ Teacher found via profile route');
          return result;
        }
      } catch (err) {
        console.log('⚠️ Profile route failed, trying enrollment route...');
      }
      
      const response = await fetch(`/api/enrollment/teacher-profile/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch teacher profile');
      }
      return result;
    } catch (error) {
      console.error('❌ Get teacher profile error:', error);
      throw error;
    }
  },

  // Get teacher schedules
  getTeacherSchedules: async (token, teacherId) => {
    try {
      const response = await fetch(`/api/enrollment/teacher-schedules/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch teacher schedules');
      }
      return result;
    } catch (error) {
      console.error('❌ Get teacher schedules error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ GET TEACHER'S STUDENTS
  // ==============================
  getMyStudents: async (token) => {
    try {
      console.log('📤 Fetching my students...');
      const response = await fetch(`${API_BASE}/teacher/my-students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📥 My Students response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch students');
      }
      return result;
    } catch (error) {
      console.error('❌ Get my students error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ GET STUDENT'S COURSES
  // ==============================
  getMyCourses: async (token) => {
    try {
      console.log('📤 Fetching my courses...');
      const response = await fetch(`${API_BASE}/student/my-courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📥 My Courses response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch courses');
      }
      return result;
    } catch (error) {
      console.error('❌ Get my courses error:', error);
      throw error;
    }
  },

  // ==============================
  // PAYMENT API
  // ==============================
  createPayment: async (token, data) => {
    try {
      const response = await fetch(`/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process payment');
      }
      return result;
    } catch (error) {
      console.error('❌ Create payment error:', error);
      throw error;
    }
  },

  getPaymentDetails: async (token, paymentId) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment');
      }
      return result;
    } catch (error) {
      console.error('❌ Get payment details error:', error);
      throw error;
    }
  },

  getStudentPayments: async (token) => {
    try {
      const response = await fetch(`/api/payments/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payments');
      }
      return result;
    } catch (error) {
      console.error('❌ Get student payments error:', error);
      throw error;
    }
  },

  getTeacherPayments: async (token) => {
    try {
      const response = await fetch(`/api/payments/teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payments');
      }
      return result;
    } catch (error) {
      console.error('❌ Get teacher payments error:', error);
      throw error;
    }
  },

  getReceipt: async (token, paymentId) => {
    try {
      const response = await fetch(`/api/payments/receipt/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch receipt');
      }
      return result;
    } catch (error) {
      console.error('❌ Get receipt error:', error);
      throw error;
    }
  },

  // ==============================
  // AI RECOMMENDATION API
  // ==============================
  getRecommendedTeachers: async (token) => {
    try {
      const response = await fetch(`/api/student/recommended-teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
      return result;
    } catch (error) {
      console.error('❌ Get recommended teachers error:', error);
      throw error;
    }
  },

  getRecommendedStudents: async (token) => {
    try {
      const response = await fetch(`/api/teacher/recommended-students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
      return result;
    } catch (error) {
      console.error('❌ Get recommended students error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ ADMIN ENROLLMENTS API - NEW
  // ==============================
  getAdminEnrollments: async (token) => {
    try {
      console.log('📤 Fetching admin enrollments...');
      const response = await fetch(`${API_BASE}/admin/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📥 Admin Enrollments response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch enrollments');
      }
      return result;
    } catch (error) {
      console.error('❌ Get admin enrollments error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ ADMIN UPDATE ENROLLMENT STATUS - NEW
  // ==============================
  updateEnrollmentStatus: async (token, enrollmentId, status) => {
    try {
      console.log(`📤 Updating enrollment ${enrollmentId} to ${status}...`);
      const response = await fetch(`${API_BASE}/admin/enrollments/${enrollmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const result = await response.json();
      console.log('📥 Update enrollment response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update enrollment');
      }
      return result;
    } catch (error) {
      console.error('❌ Update enrollment error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ ADMIN UPDATE PAYMENT STATUS - NEW
  // ==============================
  updatePaymentStatus: async (token, enrollmentId, paymentStatus) => {
    try {
      console.log(`📤 Updating payment ${enrollmentId} to ${paymentStatus}...`);
      const response = await fetch(`${API_BASE}/admin/enrollments/${enrollmentId}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: paymentStatus })
      });
      
      const result = await response.json();
      console.log('📥 Update payment response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment');
      }
      return result;
    } catch (error) {
      console.error('❌ Update payment error:', error);
      throw error;
    }
  },

  // ==============================
  // ✅ CHECK SCHEDULE COMPLETION STATUS
  // ==============================
  checkScheduleCompletion: async (token, teacherId) => {
    try {
      console.log('🔍 Checking schedule completion for teacher:', teacherId);
      
      let userId = teacherId;
      if (!userId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          userId = user._id || user.id || user.userId || user.user_id;
        }
      }
      
      if (!userId || userId === 'null' || userId === 'undefined') {
        throw new Error('User ID not found');
      }
      
      const response = await fetch(`${API_BASE}/schedule/completion-status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📥 Schedule completion status:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check schedule completion');
      }
      return result;
    } catch (error) {
      console.error('❌ Check schedule completion error:', error);
      throw error;
    }
  }
};

export default api;