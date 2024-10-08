import React, { useState } from "react";
import apiServerAxios from "../api/axios";
import {
  Button,
  Snackbar,
  Alert,
  Tooltip,
  Typography,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Container,
  Box,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import DateRangeIcon from "@mui/icons-material/DateRange";

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(3),
}));

function ChatLogManager() {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("info");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogRange, setDialogRange] = useState(false);
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDeleteConfirmation = (range) => {
    setDialogRange(range);
    setDialogOpen(true);
    // Further actions are deferred until user confirms in the dialog
  };

  const downloadChatLogs = async (range = false) => {
    setLoading(true);
    try {
      const endpoint = range
        ? "/user/download_chat_logs/range"
        : "/user/download_chat_logs";
      const params = range
        ? { params: { start_date: startDate, end_date: endDate } }
        : {};

      const response = await apiServerAxios.get(endpoint, {
        ...params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: "blob", // Important for handling the download of binary content
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        range ? "chat_logs_range.csv" : "chat_logs.csv"
      );
      document.body.appendChild(link);
      link.click();

      setMessage("Chat logs downloaded successfully.");
      setSeverity("success");
    } catch (error) {
      setMessage(
        `Failed to download chat logs: ${
          error.response?.data?.error || error.message
        }`
      );
      setSeverity("error");
    } finally {
      setLoading(false);
    }
    setSnackbarOpen(true);
  };

  const deleteChatLogs = async () => {
    setDialogOpen(false); // Close dialog first
    setLoading(true);
    try {
      const endpoint = dialogRange
        ? "/user/delete_chat_logs/range"
        : "/user/delete_chat_logs";
      const params = dialogRange
        ? { params: { start_date: startDate, end_date: endDate } }
        : {};

      const response = await apiServerAxios.delete(endpoint, {
        ...params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMessage(response.data.message);
      setSeverity("success");
    } catch (error) {
      setMessage(
        `Failed to delete chat logs: ${
          error.response?.data?.error || error.message
        }`
      );
      setSeverity("error");
    } finally {
      setLoading(false);
    }
    setSnackbarOpen(true);
  };

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
              sx={{ display: "flex", alignItems: "center", mb: 3 }}
            >
              Manage Your Chat Logs
            </Typography>
            <form
              style={{
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 20,
                  width: "100%",
                }}
              >
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>

              <Typography variant="body1" paragraph>
                Here you can download your chat logs as a CSV file, which
                includes details like chat IDs, content, type, and additional
                information for each session.
              </Typography>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <Tooltip title="Download chat logs for selected date range">
                  <ActionButton
                    startIcon={<DateRangeIcon />}
                    onClick={() => downloadChatLogs(true)}
                    disabled={loading || !startDate || !endDate}
                    sx={{
                      width: "50%",
                      alignSelf: "center",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#333",
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Download Range"
                    )}
                  </ActionButton>
                </Tooltip>
                <Tooltip title="Download your chat logs as a CSV file">
                  <ActionButton
                    sx={{ width: "50%", alignSelf: "center" }}
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadChatLogs(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Download Chat Logs"
                    )}
                  </ActionButton>
                </Tooltip>
              </div>

              <Typography variant="body1" paragraph>
                If you need to clear your history for privacy or other reasons,
                you can also permanently delete your chat logs from the server.
              </Typography>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <Tooltip title="Delete chat logs for selected date range">
                  <ActionButton
                    color="warning"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteConfirmation(true)}
                    disabled={loading || !startDate || !endDate}
                    sx={{
                      width: "50%",
                      alignSelf: "center",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#333",
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Delete Range"
                    )}
                  </ActionButton>
                </Tooltip>
                <Tooltip title="Permanently delete all your chat logs">
                  <ActionButton
                    sx={{ width: "50%", alignSelf: "center" }}
                    variant="contained"
                    color="secondary"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteConfirmation(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Delete Chat Logs"
                    )}
                  </ActionButton>
                </Tooltip>
                <Typography
                  variant="body1"
                  paragraph
                  sx={{ width: "50%", alignSelf: "center" }}
                >
                  Please use these options carefully as deleting your chat logs
                  is irreversible.
                </Typography>
              </div>
            </form>
          </Box>
          <Dialog
            open={dialogOpen}
            onClose={handleDialogClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"Confirm Deletion"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Are you sure you want to delete these chat logs? This action
                cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose} color="primary">
                Cancel
              </Button>
              <Button
                onClick={() => deleteChatLogs(true)}
                color="secondary"
                autoFocus
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {message}
            </Alert>
          </Snackbar>
        </Container>
      </ThemeProvider>
    </>
  );
}

export default ChatLogManager;
