import { useState } from "react";
import apiServerAxios from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }
    try {
      const response = await apiServerAxios.post(
        `/user/reset_password/${token}`,
        {
          password,
        }
      );
      setMessage(response.data.message);
      setIsError(false);
      setTimeout(() => navigate("/auth"), 2000); // Redirect after 2 seconds
    } catch (error) {
      setMessage(error.response.data.error);
      setIsError(true);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
    <Container
      component="main"
      maxWidth="false"
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(to bottom right, #121111 60%, #201739 72%, #eec9e6 100%)",
      }}
    >
      <Box
        sx={{
          padding: isSmallScreen ? "20px" : "40px",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(20px)",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          maxWidth: isSmallScreen ? "90%" : "400px", // Responsive width
          width: "100%", // Ensures it stretches properly
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          marginBottom={2}
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
                    sx={{ color: "white" }}
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
            type={showConfirmPassword ? "text" : "password"}
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
                    sx={{ color: "white" }}
                    aria-label="toggle password visibility"
                    onClick={handleClickShowConfirmPassword}
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
      </Box>
    </Container>
  );
}

export default ResetPassword;
