import React, { useContext } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DeckIcon from "@mui/icons-material/Deck";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon"; // Icon for mood logging
import ListAltIcon from "@mui/icons-material/ListAlt"; // Icon for mood logs
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import { UserContext } from "./userContext";
import { NavLink, useLocation } from "react-router-dom";

const drawerWidth = 270;

function Sidebar() {
  const { logout, user } = useContext(UserContext);
  const location = useLocation(); // This hook returns the location object that represents the current URL.

  const isActive = (path) => location.pathname === path; // This function checks if the current path is the same as the path passed as an argument.

  const items = [
    { text: "Mind Chat", icon: <DeckIcon />, path: "/" },
    ...(!user?.isAnon
      ? [
          {
            text: "Track Your Vibes",
            icon: <InsertEmoticonIcon />,
            path: "/user/mood_logging",
          },
          { text: "Mood Logs", icon: <ListAltIcon />, path: "/user/mood_logs" },
          {
            text: "Schedule Check-In",
            icon: <ScheduleIcon />,
            path: "/user/check_in",
          }, // New item for check-in page
          {
            text: "Check-In Reporting",
            icon: <EventAvailableIcon />,
            path: `/user/check_ins/${user?.userId}`,
          }, // Dynamically inserting userId
          {
            text: "Chat Log Manager",
            icon: <ManageHistoryIcon />,
            path: "/user/chat_log_Manager",
          },
        ]
      : []),
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        mt: 8,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          position: "relative", //position: 'fixed', Fixing the sidebar so it doesn't move on scroll
          height: "88vh", // Ensuring it covers the full height of the viewport
          top: 13, // Aligning it to the top of the viewport
          overflowX: "hidden", // Hiding horizontal overflow
          borderRadius: 2,
          boxShadow: 1,
          ml: 1,
          backgroundColor: "#ecf0f5",
          color: "#191718",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <List
        sx={{ padding: 1.5, display: "flex", flexDirection: "column", gap: 1 }}
      >
        {items.map((item) => (
          <NavLink
            to={item.path}
            key={item.text}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <ListItem
              sx={{
                backgroundColor: isActive(item.path) ? "#BABDDA" : "inherit", // Adjust the background color for the active item
                "&:hover": {
                  bgcolor: "#BABDDA", // Adjust the background color for the hovered item
                },
                borderRadius: 3,
                display: "flex",
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </NavLink>
        ))}
        <ListItem
          onClick={logout}
          sx={{
            backgroundColor: "inherit", // Adjust the background color for the active item
            "&:hover": {
              bgcolor: "#BABDDA", // Adjust the background color for the hovered item
            },
            cursor: "pointer",
            borderRadius: 3,
          }}
        >
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Sidebar;
