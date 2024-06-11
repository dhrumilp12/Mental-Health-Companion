import React, { useState,useEffect, useContext } from 'react';
import { UserProvider } from './Components/userContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ChatComponent from './Components/chatComponent';  // Ensure this path is correct
import AuthComponent from './Components/authComponent';
import UserProfile from './Components/userProfile';
import Sidebar from './Components/sideBar';
import Navbar from './Components/navBar';
import ChatInterface from './Components/chatInterface';
import MoodLogging from './Components/moodLogging';
import MoodLogs from './Components/moodLogs';
import { CssBaseline, Box } from '@mui/material';
import { UserContext } from './Components/userContext';

function App() {
    const { user } = useContext(UserContext);
    
    useEffect(() => {
        document.body.style.backgroundColor = '#f5f5f5';
        
      }, []);
    
    return (
        
            <Layout>
                <Routes>
                    <Route path="/" element={user?.userId ?<ChatComponent />:<ChatInterface />} />
                    <Route path="/chat" element={<ChatInterface />} />
                    <Route path="/auth" element={<AuthComponent />} />
                    <Route path="/user/profile/:userId" element={<UserProfile />} />
                    <Route path="/user/mood_logging" element={<MoodLogging />} />
                    <Route path="/user/mood_logs" element={<MoodLogs />} />
                </Routes>
            </Layout>
        
    );
}

function Layout({ children }) {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const noNavRoutes = ['/auth'];  // List of routes that shouldn't show the navbar or sidebar
    const showNav = !noNavRoutes.includes(location.pathname);
    const mainPadding = noNavRoutes.includes(location.pathname) ? 0 : 6;
    const [sidebarOpen, setSidebarOpen] = useState(true);  // State to control the sidebar

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);  // Toggle the state
    };
    return (
        <Box sx={{ display: 'flex' }}>
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
