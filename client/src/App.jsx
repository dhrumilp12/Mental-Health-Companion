import { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { CssBaseline, Box } from "@mui/material";

import PropTypes from "prop-types";
import ChatComponent from "./Components/chatComponent"; // Ensure this path is correct
import AuthComponent from "./Components/authComponent";
import UserProfile from "./Components/userProfile";
import Sidebar from "./Components/sideBar";
import Navbar from "./Components/navBar";
import ChatLogManager from "./Components/chatLogManager";

import CheckInForm from "./Components/checkInForm";
import CheckInsList from "./Components/checkInsList";
import { UserContext } from "./Components/userContext";
import ProtectedRoute from "./protectedRoute";
import RequestPasswordReset from "./Components/requestPasswordReset";
import ResetPassword from "./Components/passwordReset";
import Routine from "./Components/Routine";
import LandingPage from "./Components/LandingPage";
import AboutPage from "./Components/AboutPage";
import FAQPage from "./Components/FAQPage";
import MoodTracker from "./Components/moodTracker";

function App() {
  const { user } = useContext(UserContext);

  useEffect(() => {
    document.body.style.backgroundColor = "#f5f5f5";
  }, []);

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/reset_password/:token" element={<ResetPassword />} />
        <Route path="/request_reset" element={<RequestPasswordReset />} />
        <Route path="/auth" element={<AuthComponent />} />
        <Route path="/landing_page" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route
          path="/user/profile/:userId"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/mood_tracking"
          element={
            <ProtectedRoute>
              <MoodTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/check_in"
          element={
            <ProtectedRoute>
              <CheckInForm userId={user?.userId} checkInId="" update={false} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/check_in/:checkInId"
          element={
            <ProtectedRoute>
              <CheckInForm userId={user?.userId} update={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/routines"
          element={
            <ProtectedRoute>
              <Routine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/chat_log_Manager"
          element={
            <ProtectedRoute>
              <ChatLogManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/check_ins/:userId"
          element={
            <ProtectedRoute>
              <CheckInsList />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

function Layout({ children }) {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const noNavRoutes = [
    "/auth",
    "/landing_page",
    "/about",
    "/faq",
    "/request_reset",
    new RegExp("^/reset_password/[^/]+$"),
  ]; // List of routes that shouldn't show the navbar or sidebar
  const showNav = !noNavRoutes.some((route) =>
    typeof route === "string"
      ? route === location.pathname
      : route.test(location.pathname)
  );

  const mainPadding = !showNav ? 0 : 6;
  const [sidebarOpen, setSidebarOpen] = useState(true); // State to control the sidebar

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen); // Toggle the state
  };
  return (
    <Box
      sx={{
        // Adjust overflow properties as needed
        maxHeight: "100vh", // Limit height to viewport to prevent outer scrolling
      }}
    >
      <CssBaseline />
      {showNav && <Navbar toggleSidebar={toggleSidebar} />}
      <Box
        sx={{
          display: showNav && sidebarOpen ? "flex" : "",
          maxHeight: "100vh",
          gap: 5,
        }}
      >
        {showNav && sidebarOpen && <Sidebar setSidebarOpen={setSidebarOpen} />}
        <Box
          component="main"
          maxWidth={showNav && !sidebarOpen ? { xl: "1500px" } : "100%"}
          width={
            showNav && sidebarOpen
              ? { xl: "80%", md: "75%", sm: "100%" }
              : "100%"
          }
          sx={{
            py: mainPadding,
            mx: showNav && !sidebarOpen ? { xl: "auto" } : "none",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};

export default App;
