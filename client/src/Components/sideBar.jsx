import React, {useContext} from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { UserContext } from './userContext';

const drawerWidth = 230;

function Sidebar() {
  const { logout } = useContext(UserContext);
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        mt: 8,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'relative'
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <List>
        <ListItem button>
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem button onClick={logout}>
          <ListItemIcon><ExitToAppIcon /></ListItemIcon>
          <ListItemText primary="Logout" /> 
        </ListItem>      
        
      </List>
    </Drawer>
  );
}

export default Sidebar;
