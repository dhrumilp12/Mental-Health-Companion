import { useState, useEffect } from "react";
import apiServerAxios from "../api/axios";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
  createTheme,
  ThemeProvider,
  Container,
    CircularProgress,
} from "@mui/material";
import { ring2 } from "ldrs";

import { formatISO, parseISO } from "date-fns";

function CheckInForm({ userId, update }) {
  const [checkInTime, setCheckInTime] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [notify, setNotify] = useState(false);
  const { checkInId } = useParams();
  const [loading, setLoading] = useState(false);
    const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const token = localStorage.getItem("token");
  ring2.register();

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

  useEffect(() => {
    if (update && checkInId) {
      // Fetch existing check-in data
      setLoading(true);
      apiServerAxios
        .get(`/check-in/${checkInId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure the Authorization header is set
          },
        })
        .then((response) => {
          const data = response.data;
          // Format the date for datetime-local input
          const formattedCheckInTime = formatISO(parseISO(data.check_in_time), {
            representation: "date",
          });
          setCheckInTime(formattedCheckInTime.slice(0, 16)); // Ensures the datetime string is properly formatted
          setFrequency(data.frequency);
          setNotify(data.notify);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch check-in details:", error);
          setLoading(false);
        });
    }
  }, [update, checkInId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
        setIsSaveInProgress(true);
    const selectedTime = new Date(checkInTime);
    const now = new Date();
    if (selectedTime <= now) {
      setSnackbar({
        open: true,
        message:
          "Cannot schedule check-in in the past. Please choose a future time.",
        severity: "error",
      });
      return;
    }

    const url = update ? `/check-in/${checkInId}` : "/check-in/schedule";
    // Setup Axios request configuration
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    const method = update ? "patch" : "post";
    const data = {
      user_id: userId,
      check_in_time: checkInTime,
      frequency,
      notify,
    };
    try {
      const response = await apiServerAxios[method](url, data, config);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });
            setCheckInTime("");
            setFrequency("");
            setNotify(false);
      // Optionally reset form or handle next steps
    } catch (error) {
      console.error("Error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
        } finally {
            setIsSaveInProgress(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading)
    return (
      <Box
        sx={{
            position: "absolute",
            left: { xs: "50%", md: "60%" },
            top: { xs: "50%", md: "40%" },
            translate: { xs: "-50% -50%", md: "-60% -40%" },
        }}
      >
        <l-ring-2
          size="40"
          stroke="5"
          stroke-length="0.25"
          bg-opacity="0.1"
          speed="0.8"
          color="#656782"
        ></l-ring-2>
      </Box>
    );

  return (
    <>
      <ThemeProvider theme={theme}>
        <Container
          component="main"
          sx={{
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
            width: { xs: "90%", lg: "100%" },
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
              Schedule Check In
            </Typography>
            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
                marginTop: theme.spacing(1),
              }}
            >
              <TextField
                id="datetime-local"
                label="Check-in Time"
                type="datetime-local"
                fullWidth
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                sx={{ marginBottom: 3 }}
                InputLabelProps={{
                  shrink: true,
                }}
                required
                helperText="Select the date and time for your check-in."
              />
              <FormControl fullWidth sx={{ marginBottom: 3 }}>
                <InputLabel id="frequency-label">Frequency</InputLabel>
                <Select
                  labelId="frequency-label"
                  id="frequency"
                  value={frequency}
                  label="Frequency"
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
                <Tooltip title="Choose how often you want the check-ins to occur">
                  <i className="fas fa-info-circle" />
                </Tooltip>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    color="primary"
                  />
                }
                label="Notify me"
                sx={{ marginBottom: 2 }}
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
                                {isSaveInProgress ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <div>
                                        {update
                                            ? "Update Check-In"
                                            : "Schedule Check-In"}
                                    </div>
                                )}
                            </Button>
                            <Snackbar
                                open={snackbar.open}
                                autoHideDuration={6000}
                                onClose={handleSnackbarClose}
                            >
                                <Alert
                                    onClose={handleSnackbarClose}
                                    severity={snackbar.severity}
                                >
                                    {snackbar.message}
                                </Alert>
                            </Snackbar>
                        </form>
                    </Box>
                </Container>
            </ThemeProvider>
        </>
    );
}

CheckInForm.propTypes = {
  userId: PropTypes.string.isRequired,
  checkInId: PropTypes.string,
  update: PropTypes.bool.isRequired,
};

export default CheckInForm;
