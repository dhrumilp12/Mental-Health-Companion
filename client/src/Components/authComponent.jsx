import React, { useState } from 'react';
import axios from 'axios';
import {TextField, Button, Paper, CssBaseline, Snackbar, Alert,
    Tab, Tabs, Box, CircularProgress,Select, InputLabel,FormControl,MenuItem, IconButton} from '@mui/material';
import { createTheme,  ThemeProvider, styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.post('/api/user/login', { username, password });
        setMessage('Login successful!');
        setSeverity('success');
        console.log('Access Token:', response.data.access_token);
    } catch (error) {
        setMessage('Login failed: ' + (error.response.data.msg || 'Unknown error'));
        setSeverity('error');
    }
    setOpen(true);
    setLoading(false);
};

  const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/api/user/signup', {
                username,
                email,
                password,
                name,
                age,
                gender,
                placeOfResidence,
                fieldOfWork
            });
            console.log('Signup Success:', response.data);
            setMessage("User registered successfully!");
            setSeverity("success");
            
        } catch (error) {
            console.error('Signup Failed:', error.response.data);
            setMessage(error.response.data.error || "Failed to register user.");
            setSeverity("error");
        }
        setLoading(false);
        setOpen(true);
    };

    const handleAnonymousSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/api/user/anonymous_signin');
            setMessage('Anonymous sign-in successful!');
            setSeverity('success');
            console.log('Access Token:', response.data.access_token);
        } catch (error) {
            setMessage('Anonymous sign-in failed: ' + (error.response.data.msg || 'Unknown error'));
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
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Login'} </Button>
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

export default AuthComponent
