import { useState, useEffect } from "react";
import apiServerAxios from "../api/axios";
import {
  Box,
  Button,
  Container,
  createTheme,
  TextField,
  ThemeProvider,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import MoodIcon from "@mui/icons-material/Mood";
import ListAltIcon from "@mui/icons-material/ListAlt";
import "../Assets/Styles/MoodLogging.css";

function MoodTracker() {
  // Mood Logging State
  const [mood, setMood] = useState("");
  const [activities, setActivities] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Mood Logs State
  const [moodLogs, setMoodLogs] = useState([]);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);

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

  const handleLogMood = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!mood || !activities) {
      setMessage("Both mood and activities are required.");
      return;
    }
    if (!token) {
      setMessage("You are not logged in.");
      return;
    }

    setLoading(true);
    try {
      await apiServerAxios.post(
        "/user/log_mood",
        { mood, activities },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Mood logged successfully.");
      setMood("");
      setActivities("");
      fetchMoodLogs(); // Fetch logs after successfully logging mood
    } catch (error) {
      setMessage(error.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodLogs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setFetching(true);
    try {
      const response = await apiServerAxios.get("/user/get_mood_logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMoodLogs(response.data.mood_logs || []);
    } catch (error) {
      setError(error.response?.data?.error || "Something went wrong.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMoodLogs(); // Fetch mood logs on component mount
  }, []);

  const formatDateTime = (dateObject) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    try {
      const dateString = dateObject["$date"];
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container
        component="main"
        sx={{
          background: "#fff",
          borderRadius: "8px",
          width: { xs: "90%", lg: "100%" },
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
            sx={{ display: "flex", alignItems: "center", mb: 4 }}
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
              disabled={loading}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="activities-input"
              label="Activities"
              name="activities"
              autoComplete="activities-input"
              type="text"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              disabled={loading}
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
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Log Mood"
              )}
            </Button>
            {message && (
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  textAlign: "center",
                  color: loading ? "#999" : "#000",
                }}
              >
                {message}
              </Typography>
            )}
          </form>

          {fetching ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "60vh",
                mt: 4,
              }}
            >
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Box sx={{ width: "96%", margin: "40px auto" }}>
              <Typography
                variant="h4"
                sx={{ display: "flex", alignItems: "center", mb: 4 }}
              >
                <ListAltIcon sx={{ fontSize: 40, marginRight: 1 }} />
                Your Mood Journey
              </Typography>

              {error ? (
                <Typography
                  color="error"
                  variant="h6"
                  sx={{ textAlign: "center", mt: 4 }}
                >
                  {error}
                </Typography>
              ) : moodLogs.length > 0 ? (
                moodLogs.map((log, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      backgroundColor: "#f9f9f9",
                      padding: 1,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Mood: {log.mood}
                      </Typography>
                      <Typography variant="body1">
                        Activities: {log.activities}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="textSecondary">
                        Timestamp: {formatDateTime(log.timestamp)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
                  No mood logs found.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default MoodTracker;
