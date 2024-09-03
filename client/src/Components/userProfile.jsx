import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PasswordUpdateTab from './passwordUpdateTab';
import axios from 'axios';
import apiServerAxios from '../api/axios';

import {
  TextField, Button, Container, Typography, Paper, CssBaseline, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem,IconButton,Tabs,Tab,Box
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
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const CustomTabs = styled(Tabs)({
  background: '#fff', // Set the background color you prefer
  borderRadius: '8px', // Optional: rounded corners
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Optional: adds a subtle shadow for depth
  margin: '20px 0', // Adds margin around the tabs for spacing
  maxWidth: '100%', // Ensures it doesn't overflow its container
  overflow: 'hidden', // Prevents any internal content from overflowing
});

const CustomTab = styled(Tab)({
  fontSize: '1rem', // Sets the font size to 16px
  fontWeight: 'bold', // Makes the font weight bold
  color: '#3F51B5', // Uses the primary color defined in the theme
  marginRight: '4px', // Adds space between tabs
  marginLeft: '4px', // Adds space between tabs
  flex: 1, // Each tab flexes to fill available space
  maxWidth: 'none', // Allows the tab to grow as needed
  '&.Mui-selected': { // Styles for the selected tab
    color: '#F6AE2D', // Changes text color when selected
    background: '#e0e0e0', // Light grey background on selection
  },
  '&:hover': { // Styles for hover state
    background: '#f4f4f4', // Lighter grey background on hover
    transition: 'background-color 0.3s', // Smooth transition for background color
  },
  '@media (max-width: 720px)': { // Responsive adjustment for smaller screens
    padding: '6px 12px', // Reduces padding on smaller screens
    fontSize: '0.8rem', // Reduces font size to fit on smaller devices
}});

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
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
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
    fieldOfWork: '',
    mental_health_concerns: []
  });
  const [tabValue, setTabValue] = useState(0); // To control the active tab

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
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
        const response = await apiServerAxios.get(`/user/profile/${userId}`);
        console.log("Fetched data:", response.data);
        const formattedData = {
            username: response.data.username || '',
            name: response.data.name || '',
            email: response.data.email || '',
            age: response.data.age || '',
            gender: response.data.gender || '',
            placeOfResidence: response.data.placeOfResidence || 'Not specified',
            fieldOfWork: response.data.fieldOfWork || 'Not specified',
            mental_health_concerns: response.data.mental_health_concerns || []

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

  const mentalStressors = [
    { label: "Stress from Job Search", value: "job_search" }, // Assuming this is the backend name if it were in the data
    { label: "Stress from Classwork", value: "classwork" },
    { label: "Social Anxiety", value: "social_anxiety" },
    { label: "Impostor Syndrome", value: "impostor_syndrome" },
    { label: "Career Drift", value: "career_drift" } // Assuming this is the backend name if it were in the data
];

  
  console.log("current mental health concerns: ", user.mental_health_concerns);
  // Function to handle changes in checkboxes
  const handleMentalHealthChange = (event) => {
    const { name, checked } = event.target;
    setUser(prevState => {
      const newConcerns = checked 
        ? [...prevState.mental_health_concerns, name]
        : prevState.mental_health_concerns.filter(concern => concern !== name);
      return {...prevState, mental_health_concerns: newConcerns};
    });
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiServerAxios.patch(`/user/profile/${userId}`, user);
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
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <Container component="main" maxWidth="md" >
      <CustomTabs value={tabValue} onChange={handleTabChange} centered>
          <CustomTab label="Profile" />
          <CustomTab label="Update Password" />
        </CustomTabs>

        {tabValue === 0 && (
        <StyledForm component="form" onSubmit={handleSubmit} sx={{ maxHeight: '81vh', overflow:'auto'}}>
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
            <FormGroup>
            {mentalStressors.map((stressor, index) => {
            console.log(`Is "${stressor.label}" checked?`, user.mental_health_concerns.includes(stressor.value));
            return (
                <FormControlLabel
                    key={index}
                    control={
                        <Checkbox
                            checked={user.mental_health_concerns.includes(stressor.value)}
                            onChange={handleMentalHealthChange}
                            name={stressor.value}
                        />
                    }
                    label={
                      <Box display="flex" alignItems="center">
                          {stressor.label}
                          <Tooltip title={<Typography variant="body2">{getStressorDescription(stressor.value)}</Typography>} arrow placement="right">
                              <InfoIcon color="action" style={{ marginLeft: 4, fontSize: 20 }} />
                          </Tooltip>
                      </Box>
                  }
              />
            );
        })}

          </FormGroup>
          <Button type="submit" color="primary" variant="contained">
          <UpdateIcon style={{ marginRight: '10px' }} />Update Profile
          </Button>
        </StyledForm>)}
        {tabValue === 1 && (
          <PasswordUpdateTab userId={userId} />
        )}
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}


// Define a function to return descriptions based on stressor id
function getStressorDescription(stressorId) {
  switch(stressorId) {
      case 'job_search':
          return 'Feelings of stress stemming from the job search process.';
      case 'classwork':
          return 'Stress related to managing coursework and academic responsibilities.';
      case 'social_anxiety':
          return 'Anxiety experienced during social interactions or in anticipation of social interactions.';
      case 'impostor_syndrome':
          return "Persistent doubt concerning one's abilities or accomplishments coupled with a fear of being exposed as a fraud.";
      case 'career_drift':
          return "Stress from uncertainty or dissatisfaction with one's career path or progress.";
      default:
          return 'No description available.';
  }
}

export default UserProfile;
