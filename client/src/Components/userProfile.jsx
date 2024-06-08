import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  TextField, Button, Container, Typography, Paper, CssBaseline, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem,IconButton
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc'; // Icon for gender
import HomeIcon from '@mui/icons-material/Home'; // Icon for place of residence
import WorkIcon from '@mui/icons-material/Work';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UpdateIcon from '@mui/icons-material/Update';
const theme = createTheme({
    palette: {
        primary: {
          main: '#3F51B5',  // Changed to a deep blue shade
        },
        secondary: {
          main: '#F6AE2D',  // Changed to a golden yellow for highlights
        },
        background: {
          default: '#e0e0e0',  // Light grey background
        },
      },
      typography: {
        fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif',  // Changed to Arial for a more neutral look
        button: {
          textTransform: 'none',
          fontWeight: 'bold',
        },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: 8,  // Slightly rounded corners
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: '20px',
            borderRadius: '10px',  // More pronounced rounded corners
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',  // Subtle shadow for depth
          },
        },
      },
    },
});

const StyledForm = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(10),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  boxShadow: theme.shadows[3], // Subtle shadow for depth
}));

function UserProfile() {
 const { userId } = useParams();
 const [user, setUser] = useState({
    username: '',
    name: '',
    email: '',
    age: '',
    gender: '',
    placeOfResidence: '',
    fieldOfWork: ''
  });
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState('info');

  useEffect(() => {
    if (!userId) {
        console.error("User ID is undefined");
        return;
      }
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/user/profile/${userId}`);
        console.log("Fetched data:", response.data);
        const formattedData = {
            username: response.data.username || '',
            name: response.data.name || '',
            email: response.data.email || '',
            age: response.data.age || '',
            gender: response.data.gender || '',
            placeOfResidence: response.data.placeOfResidence || 'Not specified',
            fieldOfWork: response.data.fieldOfWork || 'Not specified'
          };
          console.log("Formatted data:", formattedData);
          setUser(formattedData);
      } catch (error) {
        setMessage('Failed to fetch user data');
        setSeverity('error');
        setOpen(true);
      }
    };
    fetchData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/user/profile/${userId}`, user);
      setMessage('Profile updated successfully!');
      setSeverity('success');
    } catch (error) {
    setMessage('Failed to update profile');
    setSeverity('error');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="md">
        <StyledForm component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" style={{ fontWeight: 700 }}><AccountCircleIcon style={{ marginRight: '10px' }} /> {user.username}</Typography>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            name="name"
            value={user.name || ''}
            onChange={handleChange}
            InputProps={{
                startAdornment: (
                  <IconButton position="start">
                    <PersonIcon />
                  </IconButton>
                ),
              }}
            />
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            name="email"
            value={user.email || ''}
            onChange={handleChange}
            InputProps={{
                startAdornment: (
                  <IconButton position="start">
                    <EmailIcon />
                  </IconButton>
                ),
              }}
            />
          <TextField
            fullWidth
            label="Age"
            variant="outlined"
            name="age"
            type="number"
            value={user.age || ''}
            onChange={handleChange}
            InputProps={{
                startAdornment: <IconButton><CakeIcon /></IconButton>
              }}
            />
          <FormControl fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={user.gender || ''}
              label="Gender"
              onChange={handleChange}
              startAdornment={<IconButton><WcIcon /></IconButton>}
              >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Place of Residence"
            variant="outlined"
            name="placeOfResidence"
            value={user.placeOfResidence || ''}
            onChange={handleChange}
            InputProps={{
                startAdornment: <IconButton><HomeIcon /></IconButton>
              }}
            />
          <TextField
            fullWidth
            label="Field of Work"
            variant="outlined"
            name="fieldOfWork"
            value={user.fieldOfWork || ''}
            onChange={handleChange}
            InputProps={{
                startAdornment: (
                  <IconButton position="start">
                    <WorkIcon />
                  </IconButton>
                ),
              }}
            />
          <Button type="submit" color="primary" variant="contained">
          <UpdateIcon style={{ marginRight: '10px' }} />Update Profile
          </Button>
        </StyledForm>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default UserProfile;
