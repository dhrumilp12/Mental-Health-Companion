import React, { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import apiServerAxios from "../api/axios";
import { useNavigate } from "react-router-dom";
export const UserContext = createContext({ user: null });

export const UserProvider = ({ children }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(
    (notification) => {
      setNotifications((prev) => [...prev, notification]);
    },
    [setNotifications]
  );
  const removeNotification = (index) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((_, i) => i !== index)
    );
  };
  const incrementNotificationCount = () => {
    setNotificationCount(notificationCount + 1);
  };

  const navigate = useNavigate();
  // Load user from local storage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    console.log("Attempting to load user:", savedUser);
    if (savedUser) {
      console.log("User found in storage:", savedUser);
      setUser(JSON.parse(savedUser));
    } else {
      console.log("No user found in storage at initialization.");
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log("Storing user in storage:", user);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      console.log("Removing user from storage.");
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Logging out with token:", token);
      if (!token) {
        console.error("No token available for logout");
        return; // Exit the function if no token is available
      }
      const response = await apiServerAxios.post(
        "/user/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setUser(null); // Clear user context
        localStorage.removeItem("token"); // Clear token from local storage
        navigate("/auth"); // Redirect after logout
      } else {
        throw new Error("Logout failed with status: " + response.status);
      }
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  }, [navigate]);

  const changePassword = async (userId, currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiServerAxios.patch(
        `/user/change_password/${userId}`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Make sure the token is being managed in your context or retrieved from somewhere secure
          },
        }
      );

      if (response.status === 200) {
        return { success: true, message: "Password updated successfully!" };
      } else {
        return {
          success: false,
          message: response.data.message || "Update failed!",
        };
      }
    } catch (error) {
      if (error.response.status === 403) {
        return {
          success: false,
          message: error.response.data.message || "Incorrect current password",
        };
      } else {
        return {
          success: false,
          message: error.response?.data?.message || "Network error",
        };
      }
    }
  };

  // Handle messages from the service worker
  useEffect(() => {
    const handleServiceWorkerMessages = (event) => {
      if (event.data && event.data.type === "NEW_NOTIFICATION") {
        console.log("Notification received:", event.data.data);
        addNotification({
          title: event.data.data.title,
          message: event.data.data.body,
        });
      }
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessages
    );

    // Cleanup this effect
    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessages
      );
    };
  }, [addNotification]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        voiceEnabled,
        setVoiceEnabled,
        changePassword,
        incrementNotificationCount,
        notifications,
        removeNotification,
        addNotification,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
