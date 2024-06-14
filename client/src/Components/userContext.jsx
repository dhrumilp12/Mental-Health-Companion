import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
export const UserContext = createContext({ user: null });

export const UserProvider = ({ children }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
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

  return (
    <UserContext.Provider value={{ user, setUser, logout,voiceEnabled, setVoiceEnabled }}>
      {children}
    </UserContext.Provider>
  );
};
