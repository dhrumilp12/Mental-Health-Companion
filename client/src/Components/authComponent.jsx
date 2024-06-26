import React, { useState, useContext } from 'react';
import axios from 'axios';
import apiServerAxios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './userContext';
import { Link } from 'react-router-dom';
import {TextField, Button, Paper, CssBaseline, Snackbar, Alert,
    Tab, Tabs, Box, CircularProgress,Select, InputLabel,FormControl,MenuItem, IconButton, Typography, Tooltip} from '@mui/material';
import { createTheme,  ThemeProvider, styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';


const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    background: {
        default: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        paper: '#fff',
      },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      color: '#444',
    },
    button: {
      textTransform: 'none',
      fontWeight: 'bold',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          margin: '8px',
        },
      },
    },
  },
});


const StyledForm = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(12),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[10],
  width: '90%',
  maxWidth: '450px',
  opacity: 0.98,
  backdropFilter: 'blur(10px)',
}));

function AuthComponent() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [placeOfResidence, setPlaceOfResidence] = useState('');
    const [fieldOfWork, setFieldOfWork] = useState('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false); // State to control Snackbar visibility
    const [message, setMessage] = useState(''); // State to hold the message
    const [severity, setSeverity] = useState('info'); // State to control the type of alert
    const mentalStressors = [
      { id: 'job_search', name: 'Stress from job search' },
      { id: 'classwork', name: 'Stress from classwork' },
      { id: 'social_anxiety', name: 'Social anxiety' },
      { id: 'impostor_syndrome', name: 'Impostor Syndrome' },
      { id: 'career_drift', name: 'Career Drift' },
  ];
  
  const [selectedStressors, setSelectedStressors] = useState([]);

  const handleStressorChange = (event) => {
    const value = event.target.value;
    const newSelection = selectedStressors.includes(value)
        ? selectedStressors.filter(item => item !== value)
        : [...selectedStressors, value];
    setSelectedStressors(newSelection);
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await apiServerAxios.post('/api/user/login', { username, password });
        if (response && response.data) {
          const userId = response.data.userId;
          localStorage.setItem('token', response.data.access_token);  // Ensure this is correctly saving the token
          console.log('Token stored:', localStorage.getItem('token')); // Confirm the token is stored
          setMessage('Login successful!');
          setSeverity('success');
          setIsAuthenticated(true);
          setUser({ userId });
          navigate('/');
          console.log('User logged in:', userId);
        } else {
          throw new Error('Invalid response from server');
        }
    } catch (error) {
      console.error('Login failed:', error);
      setMessage('Login failed: ' + (error.response?.data?.msg || 'Unknown error'));
      setSeverity('error');
      setShowForgotPassword(true);
    }
    setOpen(true);
    setLoading(false);
};

  const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiServerAxios.post('/api/user/signup', {
                username,
                email,
                password,
                name,
                age,
                gender,
                placeOfResidence,
                fieldOfWork,
                mental_health_concerns: selectedStressors
            });
            if (response && response.data) {
              const userId = response.data.userId;
              localStorage.setItem('token', response.data.access_token);  // Ensure this is correctly saving the token
              console.log('Token stored:', localStorage.getItem('token')); // Confirm the token is stored
              setMessage('User registered successfully!');
              setSeverity('success');
              setIsAuthenticated(true);
              setUser({ userId });
              navigate('/');
              console.log('User registered:', userId);
            } else {
              throw new Error('Invalid response from server');
            }
            
            } catch (error) {
              console.error('Signup failed:', error);
              setMessage(error.response?.data?.error || 'Failed to register user.');
              setSeverity('error');
            }
            setLoading(false);
            setOpen(true);
    };

    const handleAnonymousSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiServerAxios.post('/api/user/anonymous_signin');
            if (response && response.data) {
              const userId = "0";
              const isAnon = true;
              localStorage.setItem('token', response.data.access_token);  // Ensure this is correctly saving the token
              console.log('Token stored:', localStorage.getItem('token')); // Confirm the token is stored
              setMessage('Anonymous sign-in successful!');
              setSeverity('success');
              setIsAuthenticated(true);
              setUser({ userId, isAnon });
              navigate('/');
            } else {
              throw new Error('Invalid response from server');
            }
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
          setMessage('Anonymous sign-in failed: ' + (error.response?.data?.msg || 'Unknown error'));
          setSeverity('error');
        }
        setLoading(false);
        setOpen(true);
    };

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.palette.background.default }}>
        <StyledForm>
          <Tabs value={activeTab} onChange={handleChange} variant="fullWidth" centered indicatorColor="primary" textColor="primary">
            <Tab icon={<LockOutlinedIcon />} label="Login" />
            <Tab icon={<PersonAddIcon />} label="Sign Up" />
            <Tab icon={<VisibilityOffIcon />} label="Anonymous" />
          </Tabs>
          <Box sx={{ mt: 3, width: '100%', px: 3 }}>
          {activeTab === 0 && (
            <form onSubmit={handleLogin}>
              <TextField label="Username" variant="outlined" margin="normal" required fullWidth
                value={username} onChange={e => setUsername(e.target.value)} />
              <TextField label="Password" type={showPassword ? 'text' : 'password'} variant="outlined" margin="normal" required fullWidth value={password} onChange={e => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }} />
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, maxWidth:'325px' }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Login'} </Button>
              {showForgotPassword && (
                        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
                            Forgot your password? <Link to="/request_reset" style={{ textDecoration: 'none', color: theme.palette.secondary.main }}>Reset it here</Link>
                        </Typography>
                    )}
              </form>
          )}
          {activeTab === 1 && (
            <form onSubmit={handleSignUp}>
              <TextField label="Username" variant="outlined" margin="normal" required fullWidth value={username} onChange={e => setUsername(e.target.value)} />
                            <TextField label="Email" type="email" variant="outlined" margin="normal" required fullWidth value={email} onChange={e => setEmail(e.target.value)} />
                            <TextField label="Password" type={showPassword ? 'text' : 'password'} variant="outlined" margin="normal" required fullWidth value={password} onChange={e => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                <IconButton onClick={togglePasswordVisibility} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                                ),
                            }} />
                            <TextField label="Name" variant="outlined" margin="normal" fullWidth value={name} onChange={e => setName(e.target.value)} />
                            <TextField label="Age" type="number" variant="outlined" margin="normal" required fullWidth value={age} onChange={e => setAge(e.target.value)} />
                            
                            <FormControl required fullWidth margin="normal">
                                <InputLabel>Gender</InputLabel>
                                <Select value={gender} label="Gender" onChange={e => setGender(e.target.value)}>
                                    <MenuItem value="">Select Gender</MenuItem>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <TextField label="Place of Residence" variant="outlined" margin="normal" fullWidth value={placeOfResidence} onChange={e => setPlaceOfResidence(e.target.value)} />
                            <TextField label="Field of Work" variant="outlined" margin="normal" fullWidth value={fieldOfWork} onChange={e => setFieldOfWork(e.target.value)} />
                            <FormGroup sx={{marginTop:'10px'}}>
                            <Typography variant="body1" gutterBottom>
                                Select any mental stressors you are currently experiencing to help us better tailor your therapy sessions.
                            </Typography>
                              {mentalStressors.map(stressor => (
                                  <FormControlLabel
                                      key={stressor.id}
                                      control={<Checkbox checked={selectedStressors.includes(stressor.id)} onChange={handleStressorChange} value={stressor.id} />}
                                      label={
                                        <Box display="flex" alignItems="center">
                                            {stressor.name}
                                            <Tooltip title={<Typography variant="body2">{getStressorDescription(stressor.id)}</Typography>} arrow placement="right">
                                                <InfoIcon color="action" style={{ marginLeft: 4, fontSize: 20 }} />
                                            </Tooltip>
                                        </Box>}
                                  />
                              ))}
                          </FormGroup>
                            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Sign Up'}
                            </Button>
             </form>
          )}
          {activeTab === 2 && (
             <form onSubmit={handleAnonymousSignIn}>
            <Button type="submit" variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Anonymous Sign-In'}
                  </Button>
                  </form>
          )}
           </Box>
          <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
              {message}
            </Alert>
          </Snackbar>
        </StyledForm>
      </Box>
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

export default AuthComponent
