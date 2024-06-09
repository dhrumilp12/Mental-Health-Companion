import React, {useContext} from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import DeckIcon from '@mui/icons-material/Deck';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'; // Icon for mood logging
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for mood logs
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { UserContext } from './userContext';
import { Link } from 'react-router-dom';

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
          position: 'relative', //position: 'fixed', Fixing the sidebar so it doesn't move on scroll
          height: '100vh', // Ensuring it covers the full height of the viewport
          top: 0, // Aligning it to the top of the viewport
          overflowX: 'hidden', // Hiding horizontal overflow
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <List>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <ListItem button>
          <ListItemIcon><DeckIcon /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        </Link>
        <Link to="/user/mood_logging" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItem button>
                        <ListItemIcon><InsertEmoticonIcon /></ListItemIcon>
                        <ListItemText primary="Track Your Vibes" />
                    </ListItem>
                </Link>
                <Link to="/user/mood_logs" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItem button>
                        <ListItemIcon><ListAltIcon /></ListItemIcon>
                        <ListItemText primary="Mood Logs" />
                    </ListItem>
                </Link>
        <ListItem button onClick={logout}>
          <ListItemIcon><ExitToAppIcon /></ListItemIcon>
          <ListItemText primary="Logout" /> 
        </ListItem>      
        
      </List>
    </Drawer>
  );
}

export default Sidebar;
