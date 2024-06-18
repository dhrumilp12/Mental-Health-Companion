import React, { useState, useEffect} from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { List, ListItem, ListItemText, Paper, Typography } from '@mui/material';

function CheckInsList() {
    const { userId } = useParams(); // Assuming 'user' has 'userId'
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCheckIns = async () => {
            if (!userId) {
                setError('User not logged in');
                return;
            }
            setLoading(true);
            try {
                const response = await axios.get(`/api/checkIn/retrieveAll?user_id=${userId}`);
                console.log("API Response:", response.data);  // Confirm what you receive
                
                // Validate if data is an array and has the correct structure
                if (Array.isArray(response.data) && response.data.every(item => item._id && item._id.$oid && item.check_in_time && item.check_in_time.$date)) {
                    const formattedCheckIns = response.data.map(checkIn => ({
                        ...checkIn,
                        _id: checkIn._id.$oid,
                        check_in_time: new Date(checkIn.check_in_time.$date).toLocaleString(),  // Convert date from MongoDB format to a readable string
                    }));
                    setCheckIns(formattedCheckIns);
                } else {
                    console.error('Data received is not in expected array format:', response.data);
                    setError('Unexpected data format');
                }
                setLoading(false);
            } catch (err) {
                console.error("Error during fetch:", err);
                setError(err.message);
                setLoading(false);
            }
        };
    
        fetchCheckIns();
    }, [userId]);
    

    if (!userId) return <Typography variant="h6">Please log in to see your check-ins.</Typography>;
    if (loading) return <Typography variant="h6">Loading...</Typography>;
    if (error) return <Typography variant="h6">Error: {error}</Typography>;

    return (
        <Paper style={{ margin: 16, padding: 16 }}>
            <Typography variant="h5" style={{ marginBottom: 16 }}>Your Check-Ins</Typography>
            <List>
                {checkIns.length > 0 ? checkIns.map(checkIn => (
                    <ListItem key={checkIn._id} divider>
                        <ListItemText
                            primary={`Check-In Time: ${checkIn.check_in_time}`}
                            secondary={`Frequency: ${checkIn.frequency}`}
                        />
                    </ListItem>
                )) : <ListItem><ListItemText primary="No check-ins found" /></ListItem>}
            </List>
        </Paper>
    );
}    

export default CheckInsList;
