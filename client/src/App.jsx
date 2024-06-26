import React, { useState,useEffect, useContext } from 'react';
import { UserProvider } from './Components/userContext';
import { Navigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ChatComponent from './Components/chatComponent';  // Ensure this path is correct
import AuthComponent from './Components/authComponent';
import UserProfile from './Components/userProfile';
import Sidebar from './Components/sideBar';
import Navbar from './Components/navBar';
import ChatLogManager from './Components/chatLogManager';
import ChatInterface from './Components/chatInterface';
import MoodLogging from './Components/moodLogging';
import MoodLogs from './Components/moodLogs';
import CheckInForm from './Components/checkInForm';
import CheckInsList from './Components/checkInsList';
import { CssBaseline, Box } from '@mui/material';
import { UserContext } from './Components/userContext';
import ProtectedRoute from './protectedRoute';
import RequestPasswordReset from './Components/requestPasswordReset';
import ResetPassword from './Components/passwordReset';

function App() {
    const { user } = useContext(UserContext);
    
    useEffect(() => {
        document.body.style.backgroundColor = '#f5f5f5';
        
      }, []);
    
    return (
        
            <Layout>
                <Routes>
                    <Route path="/" element={<ProtectedRoute>{user?.userId ? <ChatComponent /> : <ChatInterface />}
                  </ProtectedRoute>} />
                  <Route path="/chat" element={
                  <ProtectedRoute>
                    <ChatInterface />
                  </ProtectedRoute>
                } />
                    <Route path="/reset_password/:token" element={<ResetPassword />} />
                    <Route path="/request_reset" element={<RequestPasswordReset />} />
                    <Route path="/auth" element={<AuthComponent />} />
                    <Route path="/user/profile/:userId" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                    <Route path="/user/mood_logging" element={
                  <ProtectedRoute>
                    <MoodLogging />
                  </ProtectedRoute>
                } />
                    <Route path="/user/mood_logs" element={<ProtectedRoute><MoodLogs /></ProtectedRoute>} />
                    <Route path="/user/check_in" element={<ProtectedRoute><CheckInForm userId={user?.userId} checkInId="" update={false} /></ProtectedRoute>} />
                    <Route path="/user/check_in/:checkInId" element={<ProtectedRoute><CheckInForm userId={user?.userId} update={true} /></ProtectedRoute>} />
                    <Route path="/user/chat_log_Manager" element={<ProtectedRoute><ChatLogManager /></ProtectedRoute>} />
                    <Route path="/user/check_ins/:userId" element={<ProtectedRoute><CheckInsList /></ProtectedRoute>} />
                </Routes>
            </Layout>
        
    );
}

function Layout({ children }) {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const noNavRoutes = ['/auth','/request_reset',new RegExp('^/reset_password/[^/]+$')];  // List of routes that shouldn't show the navbar or sidebar
    const showNav = !noNavRoutes.some(route => 
      typeof route === 'string' ? route === location.pathname : route.test(location.pathname));

  const mainPadding = !showNav ? 0 : 6;
    const [sidebarOpen, setSidebarOpen] = useState(true);  // State to control the sidebar

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);  // Toggle the state
    };
    return (
        <Box sx={{ display: 'flex',
             // Adjust overflow properties as needed
            maxHeight: '100vh', // Limit height to viewport to prevent outer scrolling
         }}>
            <CssBaseline />
            {showNav && <Navbar toggleSidebar={toggleSidebar}/>}
            {showNav && sidebarOpen && <Sidebar />}
            <Box component="main" sx={{ flexGrow: 1, p: mainPadding, }}>
                {children}
            </Box>
        </Box>
    );
}

export default App;
