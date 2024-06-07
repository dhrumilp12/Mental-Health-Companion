import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Components/Home';  // Ensure this path is correct
import AuthComponent from './Components/authComponent';
import UserProfile from './Components/userProfile';
import Sidebar from './Components/sideBar';
import Navbar from './Components/navBar';
import { CssBaseline, Box } from '@mui/material';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<AuthComponent />} />
                    <Route path="/user/profile/:userId" element={<UserProfile />} />
                </Routes>
            </Layout>
        </Router>
    );
}

function Layout({ children }) {
    const location = useLocation();
    const noNavRoutes = ['/auth'];  // List of routes that shouldn't show the navbar or sidebar
    const showNav = !noNavRoutes.includes(location.pathname);
    const mainPadding = noNavRoutes.includes(location.pathname) ? 0 : 6;

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {showNav && <Navbar />}
            {showNav && <Sidebar />}
            <Box component="main" sx={{ flexGrow: 1, p: mainPadding }}>
                {children}
            </Box>
        </Box>
    );
}

export default App;
