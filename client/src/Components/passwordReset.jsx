import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockResetIcon from "@mui/icons-material/LockReset";
import SendIcon from "@mui/icons-material/Send";
function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }
    try {
      const response = await axios.post(`/user/reset_password/${token}`, {
        password,
      });
      setMessage(response.data.message);
      setIsError(false);
      // Navigate to auth page after a short delay
      setTimeout(() => navigate("/auth"), 2000); // Redirects after 2 seconds
    } catch (error) {
      setMessage(error.response.data.error);
      setIsError(true);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const commonTextFieldStyles = {
    input: {
      color: "#fff",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 1,
    },
    label: {
      color: "rgba(255, 255, 255, 0.8)",
      "&.Mui-focused": {
        color: "#fff",
      },
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.5)",
      },
      "&:hover fieldset": {
        borderColor: "#fff",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#fff",
      },
    },
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background:
          "linear-gradient(to bottom right, #121111 60%, #201739 72%, #eec9e6 100%)",
        "& .MuiPaper-root": {
          padding: "40px",
          width: "400px",
          textAlign: "center",
          marginTop: "20px",
          borderRadius: "10px",
        },
      }}
    >
      <Paper elevation={6}>
        <Typography
          variant="h5"
          component="h1"
          marginBottom="2"
          sx={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
          Reset Your Password <LockResetIcon />
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
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
              ),
            }}
            sx={commonTextFieldStyles}
          />
          <TextField
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
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
              ),
            }}
            sx={commonTextFieldStyles}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              mt: 1,
              mb: 2,
              backgroundColor: "rgba(255, 255, 255, 1.0)",
              color: "#666",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
              },
            }}
            endIcon={<SendIcon />}
          >
            Reset Password
          </Button>
        </form>
        {message && (
          <Alert
            severity={isError ? "error" : "success"}
            sx={{ mt: 2, maxWidth: "325px" }}
          >
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default ResetPassword;
