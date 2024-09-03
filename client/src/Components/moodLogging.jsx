import React, { useState } from 'react';
import axios from 'axios';
import apiServerAxios from '../api/axios';
import { Button } from '@mui/material';
import MoodIcon from '@mui/icons-material/Mood';
import SendIcon from '@mui/icons-material/Send';
import '../Assets/Styles/MoodLogging.css';

function MoodLogging() {
    const [mood, setMood] = useState('');
    const [activities, setActivities] = useState('');
    const [message, setMessage] = useState('');

    const handleLogMood = async () => {
        const token = localStorage.getItem('token');
        if (!mood || !activities) {
            setMessage("Both mood and activities are required.");
            return;
        }if (!token) {
            setMessage("You are not logged in.");
            return;
        }

        try {
            const response = await apiServerAxios.post('/user/log_mood', { mood, activities }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response.data.error);
        }
    };

    return (
        <div className="mood-logging-container">
            <h1><MoodIcon fontSize="large" /> Track Your Vibes </h1>
            <div className="mood-logging">
                <div className="input-group">
                <label htmlFor="mood-input">Mood:</label>
                <input id="mood-input" type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Enter your current mood" />
                
                <label htmlFor="activities-input">Activities:</label>
                <input id="activities-input" type="text" value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="What are you doing?" />
                </div>
                <Button variant="contained" className="submit-button" onClick={handleLogMood} startIcon={<SendIcon />}>
                    Log Mood
                </Button>
                {message && <div className="message">{message}</div>}
            </div>
        </div>
    );
}

export default MoodLogging;
