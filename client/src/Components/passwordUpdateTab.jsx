import React, { useContext, useState } from 'react';
import { UserContext } from './userContext'; // Adjust the import path as necessary
import { useParams } from 'react-router-dom';
import { TextField, Button, Box, Typography,  Container, Snackbar, Alert } from '@mui/material';
import { createTheme, ThemeProvider} from '@mui/material/styles';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';

const theme = createTheme({
    palette: {
      primary: {
        main: '#656782',
      },
      secondary: {
        main: '#F6AE2D',
      },
    },
  });


const PasswordUpdateTab = () => {
  const { changePassword } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success'); // 'success' or 'error'

  const { userId } = useParams();
  const handleSubmit = async (e) => {
    e.preventDefault();
  const result = await changePassword(userId, currentPassword, newPassword);
  setSnackbarMessage(result.message);
  setSnackbarType(result.success ? 'success' : 'error');
  setSnackbarOpen(true);
};
 

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="sm" sx={{background: '#fff',borderRadius: '20px', boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',}}>
        <Box
          sx={{
            marginTop: 8,
            p:1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4">
            Update Password
          </Typography>
          <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: theme.spacing(1) }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="current-password"
              label="Current Password"
              name="currentPassword"
              autoComplete="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <LockIcon color="primary" style={{ marginRight: '10px' }} />
                ),
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="new-password"
              label="New Password"
              name="newPassword"
              autoComplete="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <VpnKeyIcon color="secondary" style={{ marginRight: '10px' }} />
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2, borderRadius: 20, padding: "10px 15px" }}
            >
              Update Password
            </Button>
          </form>
          <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarType} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default PasswordUpdateTab;
