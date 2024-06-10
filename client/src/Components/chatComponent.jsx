import React, { useState, useEffect, useContext,useCallback } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, TextField, Button, List, ListItem, ListItemText, CircularProgress, Snackbar, Divider } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { UserContext } from './userContext';
//import  '../Assets/Styles/ChatComponent.module.css';


const ChatComponent = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId; 
    const [chatId, setChatId] = useState(null);
    const [turnId, setTurnId] = useState(0);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false); 
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    const fetchWelcomeMessage = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
        const response = await fetch(`/api/ai/mental_health/welcome/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            setWelcomeMessage(data.message);
            setChatId(data.chat_id);
            console.log(data.chat_id);
        } else {
            console.error('Failed to fetch welcome message:', data);
            setWelcomeMessage('Error fetching welcome message.');
        }
    } catch (error) {
        console.error('Network or server error:', error);
    }finally {
        setIsLoading(false);
    }      
}, [userId]);
    // Fetch initial message when component mounts
    useEffect(() => {
        fetchWelcomeMessage();
    }, [fetchWelcomeMessage]);
                

        const handleSnackbarClose = (event, reason) => {
            if (reason === 'clickaway') {
                return;
            }
            setOpen(false);
        };

        const finalizeChat = useCallback(async () => {
            if (chatId === null) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/ai/mental_health/finalize/${userId}/${chatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
    
                const data = await response.json();
        if (response.ok) {
            setSnackbarMessage('Chat finalized successfully');
            setSnackbarSeverity('success');
            // Reset chat state to start a new chat
            setChatId(null);
            setTurnId(0);
            setMessages([]);
            // Optionally, fetch a new welcome message or reset other relevant states
            fetchWelcomeMessage(); // assuming fetchWelcomeMessage resets or initiates a new chat session
        } else {
            setSnackbarMessage('Failed to finalize chat');
            setSnackbarSeverity('error');
        }
    } catch (error) {
        setSnackbarMessage('Error finalizing chat');
        setSnackbarSeverity('error');
    } finally {
        setIsLoading(false);
        setOpen(true);
    }
}, [userId, chatId, fetchWelcomeMessage]);
    
        const sendMessage = useCallback(async () => {
            if (!input.trim() || chatId === undefined) return;
            console.log(chatId);
            setIsLoading(true);
            
            try {
                const body = JSON.stringify({
                    prompt: input,
                    turn_id: turnId
                });
            const response = await fetch(`/api/ai/mental_health/${userId}/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
    
            const data = await response.json();
            console.log(data);    
            if (response.ok) {
                setMessages(prev => [...prev, { message: input, sender: 'user' }, { message: data, sender: 'agent' }]);
                setTurnId(prev => prev + 1);
                setInput('');
            } else {
                console.error('Failed to send message:', data);
            } 
            }catch (error) {
                console.error('Failed to send message:', error);
            } finally {
                setIsLoading(false);
            }
        }, [input, userId, chatId, turnId]);
    
        // Handle input changes
        const handleInputChange = useCallback((event) => {
            setInput(event.target.value);
        }, []);

        return (
            <Box sx={{ maxWidth: '100%', mx: 'auto', my: 2, display: 'flex', flexDirection: 'column', height: '91vh',borderRadius: 2, boxShadow: 1 }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%',borderRadius: 2,boxShadow: 3 }}>
                    <CardContent sx={{ flexGrow: 1, overflow: 'auto',padding: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome to Mental Health Companion
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {welcomeMessage}
                        </Typography>
                        <List sx={{ maxHeight: '100%', overflow: 'auto' }}>
                            {messages.map((msg, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={msg.message} sx={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }} />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center',bgcolor: 'background.paper' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message here..."
                            value={input}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            sx={{ mr: 1, flexGrow: 1 }}
                        />
                        {isLoading ? <CircularProgress size={24} /> : (
                            <Button variant="contained" color="primary" onClick={sendMessage} disabled={isLoading || !input.trim()} endIcon={<SendIcon />}>
                                Send
                            </Button>
                        )}
                    </Box>
                    <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ExitToAppIcon />}
                    onClick={finalizeChat}
                    disabled={isLoading}
                    sx={{mt: 1,backgroundColor: theme => theme.palette.error.light + '33', // Adds an alpha value for transparency, making it lighter
                         
                        '&:hover': {
                            color: 'common.white',// White text for better contrast
                            backgroundColor: theme => theme.palette.error.light, // Slightly darker on hover but still lighter than default
                        } }
                    }
                >
                    {isLoading ? <CircularProgress color="inherit" /> : 'End Chat'}
                </Button>
                </Card>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                    <MuiAlert elevation={6} variant="filled" onClose={handleSnackbarClose} severity={snackbarSeverity}>
                        {snackbarMessage}
                    </MuiAlert>
                </Snackbar>
            </Box>
        );
    };
    
    
export default ChatComponent;
