import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from './userContext';


const ChatComponent = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId;  
    const [welcomeMessage, setWelcomeMessage] = useState('');
    // Fetch initial message when component mounts
    useEffect(() => {
        if (userId) {
            const fetchWelcomeMessage = async () => {
                const response = await fetch(`/api/ai/mental_health/welcome/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setWelcomeMessage(data.message);
                } else {
                    console.error('Failed to fetch welcome message:', data);
                    setWelcomeMessage('Error fetching welcome message.');
                }
            };
    
            if (userId) {
                fetchWelcomeMessage();
            }
        }
        }, [userId]);
    


        return (
            <div>
                <h1>Welcome to Mental Health Companion</h1>
                <p>{welcomeMessage}</p>
            </div>
        );
    }

export default ChatComponent;
