import React, { useState, useContext,useCallback } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, TextField, Button, List, ListItem, ListItemText, CircularProgress, Snackbar, Divider } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import { UserContext } from './userContext';
import Aria from '../Assets/Images/Aria.jpg'; // Adjust the path to where your logo is stored
import { Avatar } from '@mui/material';



const ChatComponent = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId; 
    const [chatId, setChatId] = useState(0);
    const [turnId, setTurnId] = useState(0);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false); 
    const [open, setOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');


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
}, [userId, chatId]);
    
        const sendMessage = useCallback(async () => {
            if (!input.trim()) return;
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
            <>
            <style>
                {`
                    @keyframes blink {
                        0%, 100% { opacity: 0; }
                        50% { opacity: 1; }
                    }
                `}
            </style>
            <Box sx={{ maxWidth: '100%', mx: 'auto', my: 2, display: 'flex', flexDirection: 'column', height: '91vh',borderRadius: 2, boxShadow: 1 }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%',borderRadius: 2,boxShadow: 3 }}>
                    <CardContent sx={{ flexGrow: 1, overflow: 'auto',padding: 3 }}>
                    {messages.length === 0 && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mt: -3,
                                mb: 2,
                                p: 2,
                                overflow: 'hidden',  // Ensures nothing spills out of the box
                                maxWidth: '100%',    // Limits the width to prevent overflow
                                maxHeight: '80%',  // Adjusts the maximum height of the logo area
                            }}>
                                <img src={Aria} alt="App Logo" style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                    width: 'auto', // Ensures the width automatically adjusts based on height
                                    height: 'auto', // Auto height for proper scaling without specifying vh
                                    objectFit: 'contain',  // Ensures the image scales properly within its constraints
                                    borderRadius: '50%' // Optional: Makes the image circular
                                }} />
                            </Box>
                            
                        )}
                    <Box sx={{ display: 'flex', marginBottom: 2, marginTop:3}}>
                    <Avatar src={Aria} sx={{ width: 44, height: 44, marginRight: 2,  }} alt="Aria" />
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome to Mental Health Companion
                        </Typography>
                        </Box>
                        
                        
                        <List sx={{ maxHeight: '100%', overflow: 'auto' }}>
                            {messages.map((msg, index) => (
                                <ListItem key={index}sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    //backgroundColor: msg.sender === 'user' ? 'primary.light' : 'grey.100',  // Adjust colors here
                                    borderRadius: 2, // Optional: Adds rounded corners
                                    mb: 0.5, // Margin bottom for spacing between messages
                                    p: 1 // Padding inside each list item
                                }}>
                                    <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: msg.sender === 'user' ? 'common.white' : 'text.primary',
                                    borderRadius: '16px',
                                    
                                    
                                }}>
                                    
                                     {msg.sender === 'agent' && (
                                        <Avatar src={Aria} sx={{ width: 36, height: 36, mr: 1 }} alt="Aria" />
                                    )}
                                    
                                    
                                    <ListItemText primary={msg.message} primaryTypographyProps={{
                                        
                                    sx: { 
                                        color: msg.sender === 'user' ? 'common.white' : 'text.primary',
                                        //textAlign: msg.sender === 'user' ? 'right' : 'left',
                                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.200', // You can adjust the background color here
                                        borderRadius: '16px', // Adds rounded corners to the text
                                        px: 2, // padding left and right within the text
                                        py: 1, // padding top and bottom within the text
                                        display: 'inline-block', // Ensures the background color wraps the text only
                                    }
                                    
                                }} />
                                {msg.sender === 'user' && (
                                    <Avatar sx={{ width: 36, height: 36, ml: 1 }}>
                                    <PersonIcon />
                                  </Avatar>
                                )}
                                </Box>
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
            </>
        );
    };
    
    
export default ChatComponent;
