import React, { useState } from "react";
import axios from "axios";
import apiServerAxios from "../api/axios";
import {
  Alert,
  Box,
  Button,
  Container,
  createTheme,
  Snackbar,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import MoodIcon from "@mui/icons-material/Mood";
import SendIcon from "@mui/icons-material/Send";
import "../Assets/Styles/MoodLogging.css";

function MoodLogging() {
  const [mood, setMood] = useState("");
  const [activities, setActivities] = useState("");
  const [message, setMessage] = useState("");

  const theme = createTheme({
    palette: {
      primary: {
        main: "#3F51B5",
      },
      secondary: {
        main: "#F6AE2D",
      },
    },
  });

  const handleLogMood = async () => {
    const token = localStorage.getItem("token");
    if (!mood || !activities) {
      setMessage("Both mood and activities are required.");
      return;
    }
    if (!token) {
      setMessage("You are not logged in.");
      return;
    }

    try {
      const response = await apiServerAxios.post(
        "/user/log_mood",
        { mood, activities },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.error);
    }
  };

  return (
    <>
      {/* <div className="mood-logging-container">
        <h1>
          <MoodIcon fontSize="large" /> Track Your Vibes{" "}
        </h1>
        <div className="mood-logging">
          <div className="input-group">
            <label htmlFor="mood-input">Mood:</label>
            <input
              id="mood-input"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Enter your current mood"
            />

            <label htmlFor="activities-input">Activities:</label>
            <input
              id="activities-input"
              type="text"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="What are you doing?"
            />
          </div>
          <Button
            variant="contained"
            className="submit-button"
            onClick={handleLogMood}
            startIcon={<SendIcon />}
          >
            Log Mood
          </Button>
          {message && <div className="message">{message}</div>}
        </div>
      </div> */}
      <ThemeProvider theme={theme}>
        <Container
          component="main"
          maxWidth="md"
          sx={{
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <Box
            sx={{
              marginTop: 8,
              padding: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <MoodIcon fontSize="large" /> Track Your Vibes{" "}
            </Typography>
            <form
              onSubmit={handleLogMood}
              style={{ width: "100%", marginTop: theme.spacing(1) }}
            >
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="mood-input"
                label="Mood"
                name="currentMood"
                autoComplete="mood-input"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="activities-input"
                label="Activites"
                name="activites"
                autoComplete="activities-input"
                type="text"
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  bgcolor: "#a281d6",

                  "&:hover": {
                    backgroundColor: "#a281d6",
                    opacity: 0.9,
                  },
                }}
              >
                Log Mood
              </Button>
              {message && <div className="message">{message}</div>}
            </form>
          </Box>
        </Container>
      </ThemeProvider>
    </>
  );
}

export default MoodLogging;
