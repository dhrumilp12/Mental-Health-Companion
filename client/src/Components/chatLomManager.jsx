import React, { useState } from 'react';
import axios from 'axios';
import { Button, Snackbar, Alert, Tooltip, Paper,Typography, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: 1 ,
    maxWidth: 650,
    margin: 'auto',
    marginTop: theme.spacing(4),
    backgroundColor: '#fff' // Consider using theme.palette.background.paper for theme consistency
}));

const ActionButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(0),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(3),
}));

function ChatLogManager() {
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [severity, setSeverity] = React.useState('info');
    const [loading, setLoading] = useState(false);
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const downloadChatLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/user/download_chat_logs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                responseType: 'blob' // Important for handling the download of binary content
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'chat_logs.csv'); //or any other extension
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
        setLoading(true);
        try {
            const response = await axios.delete('/api/user/delete_chat_logs', {
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
        <StyledPaper>
            <Typography variant="h4" gutterBottom>
                Manage Your Chat Logs
            </Typography>
            
            <div style={{ display: 'flex', justifyContent: 'center',flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Typography variant="body1" paragraph>
                Here you can download all your chat logs as a CSV file, which includes details like chat IDs, content, type, and additional information for each session. 
            </Typography>
                <Tooltip title="Download your chat logs as a CSV file">
                    <ActionButton 
                        variant="contained" 
                        color="primary" 
                        startIcon={<DownloadIcon />} 
                        onClick={downloadChatLogs}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Download Chat Logs'}
                    </ActionButton>
                </Tooltip>
                <Typography variant="body1" paragraph>
                If you need to clear your history for privacy or other reasons, you can also permanently delete all your chat logs from the server. 
            </Typography>
                <Tooltip title="Permanently delete all your chat logs">
                    <ActionButton 
                        variant="contained" 
                        color="secondary" 
                        startIcon={<DeleteIcon />} 
                        onClick={deleteChatLogs}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete Chat Logs'}
                    </ActionButton>
                </Tooltip>
                <Typography variant="body1" paragraph>
                Please use these options carefully as deleting your chat logs is irreversible.
            </Typography>
            </div>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </StyledPaper>
    );
}

export default ChatLogManager;