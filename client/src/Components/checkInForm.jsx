import React, { useState, useEffect } from "react";
import axios from "axios";
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
    alpha,
    InputBase,
    styled,
    createTheme,
    ThemeProvider,
    Container,
} from "@mui/material";

import { formatISO, parseISO } from "date-fns";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
    "label + &": {
        marginTop: theme.spacing(3),
    },
    "& .MuiInputBase-input": {
        borderRadius: 20,
        position: "relative",
        backgroundColor: "#fff",
        border: "2px solid",
        borderColor: "#E0E3E7",
        fontSize: 16,
        width: 400,
        padding: "10px 12px",
        transition: theme.transitions.create([
            "border-color",
            "background-color",
            "box-shadow",
        ]),
        // Use the system font instead of the default Roboto font.
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(","),
        "&:focus": {
            boxShadow: `${alpha(
                theme.palette.primary.main,
                0.25
            )} 0 0 0 0.2rem`,
            borderColor: theme.palette.primary.main,
        },
        ...theme.applyStyles("dark", {
            backgroundColor: "#1A2027",
            borderColor: "#2D3843",
        }),
    },
}));

const theme = createTheme({
    palette: {
        primary: {
            main: "#656782",
        },
        secondary: {
            main: "#F6AE2D",
        },
    },
});

function CheckInForm({ userId, update }) {
    const [checkInTime, setCheckInTime] = useState("");
    const [frequency, setFrequency] = useState("daily");
    const [notify, setNotify] = useState(false);
    const { checkInId } = useParams();
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });
    const token = localStorage.getItem("token");

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
                    console.log("Fetched check-in data:", data);
                    // Format the date for datetime-local input
                    const formattedCheckInTime = formatISO(
                        parseISO(data.check_in_time),
                        { representation: "date" }
                    );
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

        const url = update
            ? `/check-in/${checkInId}`
            : "/api/check-in/schedule";
        // Setup Axios request configuration
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        };
        console.log("URL:", url);
        const method = update ? "patch" : "post";
        const data = {
            user_id: userId,
            check_in_time: checkInTime,
            frequency,
            notify,
        };
        console.log("Submitting:", data);
        try {
            const response = await apiServerAxios[method](url, data, config);
            console.log("Success:", response.data.message);
            setSnackbar({
                open: true,
                message: response.data.message,
                severity: "success",
            });
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
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <ThemeProvider theme={theme}>
            <Container>
                <Box component="section" sx={{ pt: 2 }}>
                    <Typography variant="h4" sx={{ mt: 3 }}>
                        Schedule Check In
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{
                            p: 4,
                            border: 3,
                            mt: 3,
                            borderColor: "#E7E8F3",
                            borderRadius: "40px",
                            boxShadow: 1,
                            ":hover": {
                                bgcolor: "#E7E8F3",
                            },
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <FormControl variant="standard" sx={{ mb: 3 }}>
                                <InputLabel
                                    shrink
                                    htmlFor="datetime-local"
                                    style={{
                                        fontSize: 20,
                                        color: "#141414",
                                        mb: 1,
                                    }}
                                >
                                    Check-in Time
                                </InputLabel>
                                <BootstrapInput
                                    required
                                    value={checkInTime}
                                    id="datetime-local"
                                    name="name"
                                    type="datetime-local"
                                    onChange={(e) =>
                                        setCheckInTime(e.target.value)
                                    }
                                    helperText="Select the date and time for your check-in."
                                />
                                <Typography fontSize="12px" sx={{mt: "2px"}}>
                                    Select the date and time for your check-in.
                                </Typography>
                            </FormControl>
                            <FormControl
                                sx={{ width: 420, mb: 3 }}
                                variant="standard"
                            >
                                <InputLabel
                                    shrink
                                    htmlFor="frequency-label"
                                    style={{ fontSize: 20, color: "#141414" }}
                                >
                                    Frequency
                                </InputLabel>
                                <Select
                                    labelId="frequency-label"
                                    id="frequency"
                                    value={frequency}
                                    label="Frequency"
                                    sx={{ p: "10px 12px" }}
                                    onChange={(e) =>
                                        setFrequency(e.target.value)
                                    }
                                >
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                </Select>
                                <Tooltip title="Choose how often you want the check-ins to occur">
                                    <i className="fas fa-info-circle" />
                                </Tooltip>
                            </FormControl>
                        </Box>
                        {/* <TextField
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
                </FormControl> */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={notify}
                                    onChange={(e) =>
                                        setNotify(e.target.checked)
                                    }
                                    color="primary"
                                />
                            }
                            label="Notify me"
                        />

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
                    </Box>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{
                            mt: 3,
                            width: "25%",
                            float: "right",
                            borderRadius: 20,
                            padding: "10px 15px",
                        }}
                    >
                        {update ? "Update Check-In" : "Schedule Check-In"}
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    );
}

CheckInForm.propTypes = {
    userId: PropTypes.string.isRequired,
    checkInId: PropTypes.string,
    update: PropTypes.bool.isRequired,
};

export default CheckInForm;
