import React, { useState } from 'react';
import axios from 'axios';
import apiServerAxios from '../api/axios';
import {
    Button, Snackbar, Alert, Tooltip, Paper, Typography, CircularProgress, TextField,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
  } from '@mui/material';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import { styled } from '@mui/material/styles';
import DateRangeIcon from '@mui/icons-material/DateRange';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: 1 ,
    maxWidth: '100%',
    margin: 'auto',
    marginTop: theme.spacing(2),
    backgroundColor: '#fff', // Consider using theme.palette.background.paper for theme consistency
    overflow: 'auto',
}));

const ActionButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(0),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(3),
}));

function ChatLogManager() {
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [message, setMessage] = React.useState('');
    const [severity, setSeverity] = React.useState('info');
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dialogRange, setDialogRange] = useState(false); 
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
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
            const endpoint = range ? '/user/download_chat_logs/range' : '/api/user/download_chat_logs';
            const params = range ? { params: { start_date: startDate, end_date: endDate } } : {};

            const response = await apiServerAxios.get(endpoint, {
                ...params,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                responseType: 'blob' // Important for handling the download of binary content
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', range ? 'chat_logs_range.csv' : 'chat_logs.csv');
            document.body.appendChild(link);
            link.click();

            setMessage('Chat logs downloaded successfully.');
            setSeverity('success');
        } catch (error) {
            setMessage(`Failed to download chat logs: ${error.response?.data?.error || error.message}`);
            setSeverity('error');
        }finally {
            setLoading(false);
        }
        setSnackbarOpen(true);
    };

    const deleteChatLogs = async () => {
        setDialogOpen(false); // Close dialog first
        setLoading(true);
        try {
            const endpoint = dialogRange ? '/user/delete_chat_logs/range' : '/user/delete_chat_logs';
            const params = dialogRange ? { params: { start_date: startDate, end_date: endDate } } : {};

            const response = await apiServerAxios.delete(endpoint, {
                ...params,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setMessage(response.data.message);
            setSeverity('success');
        } catch (error) {
            setMessage(`Failed to delete chat logs: ${error.response?.data?.error || error.message}`);
            setSeverity('error');
        } finally {
            setLoading(false);
        }
        setSnackbarOpen(true);
    };

    return (
        <StyledPaper sx={{height:'91vh'}}>
            <Typography variant="h4" gutterBottom >
                Manage Your Chat Logs
            </Typography>
            <Typography variant="body1" paragraph>
            Manage your chat logs efficiently by downloading or deleting entries for specific dates or entire ranges. Please be cautious as deletion is permanent.
            </Typography>
            
            <div style={{ display: 'flex', justifyContent: 'center',flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
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
                Here you can download  your chat logs as a CSV file, which includes details like chat IDs, content, type, and additional information for each session. 
            </Typography>

            <Tooltip title="Download chat logs for selected date range">
                    <ActionButton 
                        variant="outlined"
                        startIcon={<DateRangeIcon />}
                        onClick={() => downloadChatLogs(true)}
                        disabled={loading || !startDate || !endDate}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Download Range'}
                    </ActionButton>
                </Tooltip>
                <Tooltip title="Download your chat logs as a CSV file">
                    <ActionButton 
                        variant="contained" 
                        color="primary" 
                        startIcon={<DownloadIcon />} 
                        onClick={() => downloadChatLogs(false)}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Download Chat Logs'}
                    </ActionButton>
                </Tooltip>
                <Typography variant="body1" paragraph>
                If you need to clear your history for privacy or other reasons, you can also permanently delete  your chat logs from the server. 
            </Typography>
            <Tooltip title="Delete chat logs for selected date range">
                    <ActionButton 
                        variant="outlined" 
                        color="warning"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteConfirmation(true)}
                        disabled={loading || !startDate || !endDate}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete Range'}
                    </ActionButton>
                </Tooltip>
                <Tooltip title="Permanently delete all your chat logs">
                    <ActionButton 
                        variant="contained" 
                        color="secondary" 
                        startIcon={<DeleteIcon />} 
                        onClick={() => handleDeleteConfirmation(false)}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete Chat Logs'}
                    </ActionButton>
                </Tooltip>
                <Typography variant="body1" paragraph>
                Please use these options carefully as deleting your chat logs is irreversible.
            </Typography>
            </div>
            <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete these chat logs? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={() => deleteChatLogs(true)} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </StyledPaper>
    );
}

export default ChatLogManager;