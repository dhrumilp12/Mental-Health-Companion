import React, {useContext, useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Badge,Switch, Tooltip, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import { UserContext } from './userContext';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';


function Navbar({ toggleSidebar }) {
  const { incrementNotificationCount, notifications, addNotification } = useContext(UserContext);
  const navigate = useNavigate();
  const { voiceEnabled, setVoiceEnabled,user } = useContext(UserContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
      setAnchorEl(null);
  };

  const handleProfileClick = () => {
    if (user && user.userId) {
      navigate(`/user/profile/${user.userId}`);
    } else {
      console.error("User ID not found");
    }
  };

  const handleToggleVoice = (event) => {
    event.preventDefault(); // Prevents the IconButton from triggering form submissions if used in forms
    setVoiceEnabled(!voiceEnabled);
  };

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.msg === 'updateCount') {
        incrementNotificationCount();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);
  
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton onClick={toggleSidebar}
          color="inherit"
          edge="start"
          sx={{ marginRight: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>
        <Tooltip title="Toggle voice responses">
          <IconButton color="inherit" onClick={handleToggleVoice} sx={{ padding: 0 }}>
            <Switch
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              icon={<VolumeOffIcon />}
              checkedIcon={<VolumeUpIcon />}
              inputProps={{ 'aria-label': 'Voice response toggle' }}
              color="default"
              sx={{
                height: 42, // Adjust height to align with icons
                '& .MuiSwitch-switchBase': {
                  padding: '9px', // Reduce padding to make the switch smaller
                },
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'white',
                  transform: 'translateX(16px)',
                  '& + .MuiSwitch-track': {
                    
                    backgroundColor: 'white',
                  },
                },
              }}
            />
          </IconButton>
        </Tooltip>
        <IconButton color="inherit" onClick={handleNotificationClick}>
          <Badge badgeContent={notifications.length} color="secondary">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {notifications.map((notification, index) => (
                        <MenuItem key={index} onClick={handleClose}>
                            {notification.title}
                        </MenuItem>
                    ))}
                </Menu>
        <IconButton color="inherit">
          <SearchIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleProfileClick}>
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
