import { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send"; // Importing the send icon

function RequestPasswordReset() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post("/user/request_reset", { email });
      setMessage(response.data.message);
      setIsError(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to send reset link. Please try again."
      );
      setIsError(true);
    }
    setIsLoading(false);
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
          "linear-gradient(to bottom right, #121111 60%, #201739 72%, #eec9e6 100%)", // Gradient background
        "& .MuiPaper-root": {
          margin: 16,
          padding: 8,
          bgcolor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(20px)",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        },
      }}
    >
      <Paper
        elevation={3}
        style={{ padding: "30px", width: "400px", textAlign: "center" }}
      >
        <Typography
          variant="h5"
          component="h1"
          marginBottom="20px"
          sx={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
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
            sx={commonTextFieldStyles}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            endIcon={!isLoading ? <SendIcon /> : null}
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
          >
            {isLoading ? <CircularProgress size={24} /> : "Send Reset Link"}
          </Button>
        </form>
        {message && (
          <Alert
            severity={isError ? "error" : "success"}
            sx={{ maxWidth: "325px", mt: 2 }}
          >
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default RequestPasswordReset;
