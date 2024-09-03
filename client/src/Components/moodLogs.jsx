import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiServerAxios from '../api/axios';
import '../Assets/Styles/MoodLogs.css';
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for mood logs

function MoodLogs() {
    const [moodLogs, setMoodLogs] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMoodLogs = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("You are not logged in.");
                return;
            }

            try {
                const response = await apiServerAxios.get('/user/get_mood_logs', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("Received data:", response.data); // Check what's being received
                setMoodLogs(response.data.mood_logs || []);
            } catch (error) {
                setError(error.response.data.error);
            }
        };

        fetchMoodLogs();
    }, []);
    const formatDateTime = (dateObject) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        try {
            // Extract the date string from the date object
            const dateString = dateObject['$date'];
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", options) ;
        } catch (error) {
            console.error("Date parsing error:", error);
            return "Invalid Date";
        }
    };    

    return (
        <div className="mood-logs">
            <h2><ListAltIcon className="icon-large" />Your Mood Journey</h2>
            {error ?<div className="error">{error}</div> : (
                <ul>
                    {moodLogs.map((log, index) => (
                        <li key={index}><div><strong>Mood:</strong> {log.mood}</div>
                            <div><strong>Activities:</strong> {log.activities}</div>
                            <div><strong>Timestamp:</strong> {formatDateTime(log.timestamp)}</div></li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default MoodLogs;
