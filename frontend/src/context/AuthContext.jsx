import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState({ percentage: 20, is_complete: false });
  const [isNewUser, setIsNewUser] = useState(false);

  const extractUserId = (userData) => {
    return userData?._id || userData?.id || userData?.userId || userData?.user_id || null;
  };

  const ensureUserWithId = (userData) => {
    if (!userData) return null;
    const userId = extractUserId(userData);
    return {
      ...userData,
      id: userId,
      _id: userId
    };
  };

  const fetchProfilePercentage = async (authToken, role) => {
    try {
      const endpoint = role === 'teacher' 
        ? '/api/teacher/profile-status' 
        : '/api/student/profile-status';
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.percentage || 20;
      }
      return 20;
    } catch (error) {
      console.error('Error fetching profile percentage:', error);
      return 20;
    }
  };

  const fetchUserProfile = async (authToken) => {
    try {
      const tokenToUse = authToken || token;
      if (!tokenToUse) return;
      
      const profileResponse = await fetch('/api/profile/me', {
        headers: { 
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
          const userId = extractUserId(profileData.profile) || extractUserId(user);
          const role = profileData.profile.role || user?.role || 'student';
          
          const percentage = await fetchProfilePercentage(tokenToUse, role);
          
          const mergedUser = {
            ...user,
            ...profileData.profile,
            id: userId,
            _id: userId,
            role: role,
            isProfileComplete: profileData.profile.isProfileComplete || false,
            profilePercentage: percentage
          };
          
          if (userId) {
            localStorage.setItem('userId', userId);
          }
          
          setUser(mergedUser);
          localStorage.setItem('user', JSON.stringify(mergedUser));
          
          setProfileStatus({
            percentage: percentage,
            is_complete: mergedUser.isProfileComplete
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userWithId = ensureUserWithId(parsedUser);
        
        if (!userWithId.profilePercentage) {
          userWithId.profilePercentage = 20;
        }
        
        setToken(storedToken);
        setUser(userWithId);
        
        localStorage.setItem('user', JSON.stringify(userWithId));
        if (userWithId?.id) {
          localStorage.setItem('userId', userWithId.id);
        }
        
        if (userWithId?.id) {
          fetchUserProfile(storedToken);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
      }
    }
    setLoading(false);
  }, []);

  // ✅ FIXED: Login sets isNewUser to false
  const login = (userData, authToken) => {
    const userId = extractUserId(userData);
    
    const initialPercentage = 20;
    
    const userWithId = {
      ...userData,
      id: userId,
      _id: userId,
      isProfileComplete: userData.isProfileComplete || false,
      profilePercentage: initialPercentage
    };
    
    setUser(userWithId);
    setToken(authToken);
    setIsNewUser(false); // ✅ Login par false
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userWithId));
    
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    
    setProfileStatus({
      percentage: initialPercentage,
      is_complete: false
    });
    
    if (userId) {
      fetchUserProfile(authToken);
    }
  };

  // ✅ FIXED: Signup sets isNewUser to true
  const signup = async (userData) => {
    const data = await api.signup(userData);
    const { user, token } = data;
    setIsNewUser(true); // ✅ New user flag
    login(user, token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsNewUser(false);
    setProfileStatus({ percentage: 20, is_complete: false });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  };

  const updateUser = (updatedData) => {
    const userId = extractUserId(updatedData) || extractUserId(user);
    const updatedUser = {
      ...user,
      ...updatedData,
      id: userId,
      _id: userId,
      profilePercentage: updatedData.profilePercentage || user?.profilePercentage || 20
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    
    if (token) {
      fetchUserProfile(token);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      isNewUser,
      login, 
      logout, 
      signup,
      updateUser,
      refreshUser,
      profileStatus,
      isAuthenticated: !!user && !!token,
      isProfileComplete: user?.isProfileComplete || false
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;