import { useContext, useState, useEffect } from "react";
import apiServerAxios from "../api/axios";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Badge,
    Menu,
    MenuItem,
    Card,
    CardContent,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircle from "@mui/icons-material/AccountCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import { UserContext } from "./userContext";

function Navbar({ toggleSidebar }) {
    const {
        incrementNotificationCount,
        notifications,
        addNotification,
        removeNotification,
    } = useContext(UserContext);
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const token = localStorage.getItem("token");
    const userId = user?.userId;
    console.log("User ID:", userId);

    useEffect(() => {
        if (userId) {
            fetchMissedCheckIns();
        } else {
            console.error("No user ID available from URL parameters.");
        }
    }, [userId]); // This effect depends on the `user` object

    const fetchMissedCheckIns = async () => {
        if (!userId) {
            console.error("User ID is missing in context");
            return; // Exit the function if no user ID is available
        }
        try {
            const response = await apiServerAxios.get(
                `/check-in/missed?user_id=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensure the Authorization header is set
                    },
                }
            ); // Replace {userId} with actual user ID
            const missedCheckIns = response.data;
            console.log("Missed check-ins:", missedCheckIns);
            if (missedCheckIns.length > 0) {
                missedCheckIns.forEach((checkIn) => {
                    addNotification({
                        title: `Missed Check-in on ${new Date(
                            checkIn.check_in_time
                        ).toLocaleString()}`,
                        message: "Please complete your check-in.",
                    });
                });
            } else {
                addNotification({
                    title: "You have no missed check-ins.",
                    message: "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch missed check-ins:", error);
            addNotification({
                title: "Failed to fetch missed check-ins. Please check the console for more details.",
                message: "",
            });
        }
    };

    const handleNotificationClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (index) => {
        setAnchorEl(null);
        removeNotification(index);
    };

    const handleProfileClick = () => {
        if (user && user.userId) {
            navigate(`/user/profile/${user.userId}`);
        } else {
            console.error("User ID not found");
        }
    };

    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.msg === "updateCount") {
                console.log(
                    "Received message from service worker:",
                    event.data
                );
                addNotification({
                    title: event.data.title,
                    message: event.data.body,
                });
                incrementNotificationCount();
            }
        };

        navigator.serviceWorker.addEventListener(
            "message",
            handleServiceWorkerMessage
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "message",
                handleServiceWorkerMessage
            );
        };
    }, []);

    return (
        <AppBar
            position="fixed"
            width = "100%"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: "#ecf0f5",
                color: "#191718",
            }}
        >
            <Toolbar>
                <IconButton
                    onClick={toggleSidebar}
                    color="inherit"
                    edge="start"
                    sx={{ marginRight: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{ flexGrow: 1 }}
                >
                    Dashboard
                </Typography>
                {!user?.isAnon && (
                    <IconButton
                        color="inherit"
                        onClick={handleNotificationClick}
                    >
                        <Badge
                            badgeContent={notifications.length}
                            color="secondary"
                        >
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                )}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => handleClose(null)}
                >
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <MenuItem
                                key={index}
                                onClick={() => handleClose(index)}
                                sx={{
                                    whiteSpace: "normal",
                                    maxWidth: 350,
                                    padding: 2,
                                }}
                            >
                                <Card
                                    elevation={2}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        padding: "2px",
                                    }}
                                >
                                    <CancelIcon color="error" />

                                    <CardContent sx={{ flex: "1 1 auto" }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: "bold" }}
                                        >
                                            {notification.title}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {notification.message}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </MenuItem>
                        ))
                    ) : (
                        <Typography
                            variant="h6"
                            onClick={() => handleClose(0)}
                            sx={{
                                whiteSpace: "normal",
                                width: {xs: 250, sm: 350},
                                padding: 2,
                                textAlign: "center",
                                fontSize: {xs: "14px", sm: "18px"},
                                fontWeight: 600 
                            }}
                        >
                            You have no notifications
                        </Typography>
                    )}
                </Menu>
                {!user?.isAnon && (
                    <IconButton color="inherit" onClick={handleProfileClick}>
                        <AccountCircle />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
}

Navbar.propTypes = {
    toggleSidebar: PropTypes.func,
};

export default Navbar;
