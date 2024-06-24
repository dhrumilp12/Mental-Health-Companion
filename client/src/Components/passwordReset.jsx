import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Box, Alert, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import SendIcon from '@mui/icons-material/Send';
function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setIsError(true);
        return;
      }
    try {
      const response = await axios.post(`/api/user/reset_password/${token}`, { password });
      setMessage(response.data.message);
      setIsError(false);
      // Navigate to auth page after a short delay
      setTimeout(() => navigate('/auth'), 2000); // Redirects after 2 seconds
    } catch (error) {
      setMessage(error.response.data.error);
      setIsError(true);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };


  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{
        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',  // Cool blue gradient
      '& .MuiPaper-root': {
        padding: '40px',
        width: '400px',
        textAlign: 'center',
        marginTop: '20px',
        borderRadius: '10px',
      }
    }}>
      <Paper elevation={6}>
        <Typography variant="h5" component="h1" marginBottom="2">
          Reset Your Password <LockResetIcon />
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            fullWidth
            required
            margin="normal"
            InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            variant="outlined"
            fullWidth
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} endIcon={<SendIcon />}>
            Reset Password
          </Button>
        </form>
        {message && (
          <Alert severity={isError ? "error" : "success"} sx={{ mt: 2,maxWidth: '325px' }}>
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default ResetPassword;
