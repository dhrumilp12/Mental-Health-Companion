import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ChatComponent from './Components/ChatComponent';  // Ensure this path is correct
import AuthComponent from './Components/authComponent';
import UserProfile from './Components/userProfile';
import Sidebar from './Components/sideBar';
import Navbar from './Components/navBar';
import ChatLogManager from './Components/chatLomManager';
import ChatInterface from './Components/chatInterface';
import MoodLogging from './Components/moodLogging';
import MoodLogs from './Components/moodLogs';
import CheckInForm from './Components/checkInForm';
import CheckInsList from './Components/checkInsList';
import { CssBaseline, Box } from '@mui/material';
import { UserContext } from './Components/userContext';
import ProtectedRoute from './protectedRoute';

import Home from "./Components/Pages/Home";
import About from "./Components/About";
import AppDashboard from "./Components/Pages/Dashboard";
import NotFound from './Components/Pages/NotFound';
import NavBar from "./Components/Nav/NavTemp";

function AppLayout() {
  const [user, setUser] = useState();
  const navigate = useNavigate();

  function logOut() {
    setUser(null);
    navigate("/");
  }

  return (
    <>
      <NavBar user={user} logOut={logOut} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/dashboard" element={<AppDashboard user={user} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

function Login({ onLogin }) {
  const [creds, setCreds] = useState({});
  const navigate = useNavigate();

  function handleLogin() {
    // For demonstration purposes only. Never use these checks in production!
    // Use a proper authentication implementation
    if (creds.username === 'admin' && creds.password === '123') {
      onLogin && onLogin({ username: creds.username });
      navigate('/dashboard');
    }
  }
  return (
    <div style={{ padding: 10 }}>
      <br />
      <span>Username:</span><br />
      <input
        type="text"
        onChange={(e) => setCreds({ ...creds, username: e.target.value })} /><br />
      <span>Password:</span><br />
      <input
        type="password"
        onChange={(e) => setCreds({ ...creds, password: e.target.value })} /><br /><br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

function App() {
  const { user } = useContext(UserContext);

  useEffect(() => {
    document.body.style.backgroundColor = '#f5f5f5';

  }, []);

  return (
    <Router>
      <AppLayout />
    </Router>
  );
  // <Layout>
  //     <Routes>
  //         <Route path="/" element={<ProtectedRoute>{user?.userId ? <ChatComponent /> : <ChatInterface />}
  //       </ProtectedRoute>} />
  //       <Route path="/chat" element={
  //       <ProtectedRoute>
  //         <ChatInterface />
  //       </ProtectedRoute>
  //     } />
  //         <Route path="/auth" element={<AuthComponent />} />
  //         <Route path="/user/profile/:userId" element={
  //       <ProtectedRoute>
  //         <UserProfile />
  //       </ProtectedRoute>
  //     } />
  //         <Route path="/user/mood_logging" element={
  //       <ProtectedRoute>
  //         <MoodLogging />
  //       </ProtectedRoute>
  //     } />
  //         <Route path="/user/mood_logs" element={<ProtectedRoute><MoodLogs /></ProtectedRoute>} />
  //         <Route path="/user/check_in" element={<ProtectedRoute><CheckInForm userId={user?.userId} checkInId="" update={false} /></ProtectedRoute>} />
  //         <Route path="/user/check_in/:checkInId" element={<ProtectedRoute><CheckInForm userId={user?.userId} update={true} /></ProtectedRoute>} />
  //         <Route path="/user/chat_log_Manager" element={<ProtectedRoute><ChatLogManager /></ProtectedRoute>} />
  //         <Route path="/user/check_ins/:userId" element={<ProtectedRoute><CheckInsList /></ProtectedRoute>} />
  //     </Routes>
  // </Layout>
}

// function Layout({ children }) {
//     const { user } = useContext(UserContext);
//     const location = useLocation();
//     const noNavRoutes = ['/auth'];  // List of routes that shouldn't show the navbar or sidebar
//     const showNav = !noNavRoutes.includes(location.pathname);
//     const mainPadding = noNavRoutes.includes(location.pathname) ? 0 : 6;
//     const [sidebarOpen, setSidebarOpen] = useState(true);  // State to control the sidebar

//     const toggleSidebar = () => {
//         setSidebarOpen(!sidebarOpen);  // Toggle the state
//     };
//     return (
//         <Box sx={{ display: 'flex',
//              // Adjust overflow properties as needed
//             maxHeight: '100vh', // Limit height to viewport to prevent outer scrolling
//          }}>
//             <CssBaseline />
//             {showNav && <Navbar toggleSidebar={toggleSidebar}/>}
//             {showNav && sidebarOpen && <Sidebar />}
//             <Box component="main" sx={{ flexGrow: 1, p: mainPadding, }}>
//                 {children}
//             </Box>
//         </Box>
//     );
// }

export default App;
