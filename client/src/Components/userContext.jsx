import React, { createContext, useState, useCallback,useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
export const UserContext = createContext({ user: null });

export const UserProvider = ({ children }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  // Load user from local storage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Persist user to local storage on changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);
  
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Logging out with token:', token);
      if (!token) {
        console.error('No token available for logout');
        return; // Exit the function if no token is available
      }
      const response = await axios.post('/api/user/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 200) {
        setUser(null); // Clear user context
        localStorage.removeItem('token'); // Clear token from local storage
        navigate('/auth'); // Redirect after logout
      } else {
        throw new Error('Logout failed with status: ' + response.status);
      }
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
    }
  }, [navigate]);

  const changePassword = async (userId, currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/user/change_password/${userId}`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Make sure the token is being managed in your context or retrieved from somewhere secure
        }
      });
  
      if (response.status === 200) {
        return { success: true, message: 'Password updated successfully!' };
      } else {
        return { success: false, message: response.data.message || 'Update failed!' };
      }
    } catch (error) {
      if(error.response.status === 403) {
        return { success: false, message: error.response.data.message || 'Incorrect current password' };
      }
      else {
        return { success: false, message: error.response?.data?.message || 'Network error' };
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout,voiceEnabled, setVoiceEnabled, changePassword }}>
      {children}
    </UserContext.Provider>
  );
};
