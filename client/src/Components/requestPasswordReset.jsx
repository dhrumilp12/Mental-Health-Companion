import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Paper, Typography, Box,Alert, CircularProgress } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline'; // Importing an email icon
import SendIcon from '@mui/icons-material/Send'; // Importing the send icon

function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('/api/user/request_reset', { email });
      setMessage(response.data.message);
      setIsError(false);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send reset link. Please try again.");
      setIsError(true);
    }
    setIsLoading(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{
      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', // Gradient background
      '& .MuiPaper-root': {
        background: '#fff', // Ensures Paper component has a solid white background
        padding: '30px',
        width: '400px',
        textAlign: 'center'
      }
    }}>
      <Paper elevation={3} style={{ padding: '30px', width: '400px', textAlign: 'center' }}>
        <Typography variant="h5" component="h1" marginBottom="20px">
          Reset Your Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            fullWidth
            required
            margin="normal"
            InputProps={{
              endAdornment: <MailOutlineIcon />  // Email icon in the TextField
            }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}  endIcon={!isLoading ? <SendIcon /> : null}>
            {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </form>
        {message && (
          <Alert severity={isError ? "error" : "success"} sx={{maxWidth: '325px', mt: 2 }}>
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}


export default RequestPasswordReset;
