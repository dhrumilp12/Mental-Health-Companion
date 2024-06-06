import React, { useState } from 'react';
import axios from 'axios';
import {
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Container,
    Typography,
    Paper,
    CssBaseline,
    Avatar,
    Snackbar, // Importing Snackbar for feedback messages
    Alert 
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { blue } from '@mui/material/colors';

const theme = createTheme({
    palette: {
        primary: {
            main: blue[700],
        },
        secondary: {
            main: '#f50057',
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none'
        }
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& label.Mui-focused': {
                        color: blue[700],
                    },
                    '& .MuiInput-underline:after': {
                        borderBottomColor: blue[700],
                    },
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                            borderColor: blue[700],
                        },
                    },
                },
            },
        },
    }
});

const StyledForm = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[5],
    width: '100%', // Adjust width as needed
    maxWidth: '400px', // Adjust maximum width as needed for different devices
}));
  

function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [placeOfResidence, setPlaceOfResidence] = useState('');
    const [fieldOfWork, setFieldOfWork] = useState('');
    const [open, setOpen] = useState(false); // State to control Snackbar visibility
    const [message, setMessage] = useState(''); // State to hold the message
    const [severity, setSeverity] = useState('info'); // State to control the type of alert

    const handleSignUp = async (e) => {
        e.preventDefault();
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
            setOpen(true);
        } catch (error) {
            console.error('Signup Failed:', error.response.data);
            setMessage(error.response.data.error || "Failed to register user.");
            setSeverity("error");
            setOpen(true);
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };
    

    return (
    <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container component="main" maxWidth="xs">
                <StyledForm elevation={6}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign Up
                    </Typography>
                    <form onSubmit={handleSignUp} style={{ width: '100%' }}>
                        <div>
                            <TextField label="Username" variant="outlined" margin="normal" required fullWidth value={username} onChange={e => setUsername(e.target.value)} />
                            <TextField label="Email" type="email" variant="outlined" margin="normal" required fullWidth value={email} onChange={e => setEmail(e.target.value)} />
                            <TextField label="Password" type="password" variant="outlined" margin="normal" required fullWidth value= {password} onChange={e => setPassword(e.target.value)} />
                            <TextField label="Name" variant="outlined" margin="normal" fullWidth value={name} onChange={e => setName(e.target.value)} />
                            <TextField label="Age" type="number" variant="outlined" margin="normal" fullWidth value={age} onChange={e => setAge(e.target.value)} />
                            
                            <FormControl fullWidth margin="normal">
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
                        </div>
    
                        <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
                            Sign Up
                        </Button>
                    </form>
                    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                            {message}
                        </Alert>
                    </Snackbar>
                </StyledForm>
            </Container>
        </ThemeProvider>
    );
}

export default SignUp;