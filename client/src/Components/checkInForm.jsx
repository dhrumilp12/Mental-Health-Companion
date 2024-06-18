import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
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
    Typography
  } from '@mui/material';

  import { formatISO, parseISO } from 'date-fns';
  
function CheckInForm({ userId, checkInId, update }) {
  const [checkInTime, setCheckInTime] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (update && checkInId) {
      // Fetch existing check-in data
      setLoading(true);
      axios.get(`/api/checkIn/retrieve/${checkInId}`)
        .then(response => {
          const data = response.data;
          console.log('Fetched check-in data:', data);
           // Format the date for datetime-local input
           const formattedCheckInTime = formatISO(parseISO(data.check_in_time), { representation: 'date' });
           setCheckInTime(formattedCheckInTime.slice(0, 16)); // Ensures the datetime string is properly formatted
           setFrequency(data.frequency);
           setNotify(data.notify);
           setLoading(false);
         })
         .catch(error => {
           console.error('Failed to fetch check-in details:', error);
           setLoading(false);
         });
    }
  }, [update, checkInId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedTime = new Date(checkInTime);
    const now = new Date();
    if (selectedTime < now) {
      alert("Cannot schedule check-in in the past. Please choose a future time.");
      return;
    }

    const url = update ? `/api/checkIn/update/${checkInId}` : '/api/checkIn/schedule';
    const method = update ? 'patch' : 'post';
    const data = { user_id: userId, check_in_time: checkInTime, frequency, notify };
    console.log('Submitting:', data);
    try {
      const response = await axios[method](url, data);
      console.log('Success:', response.data.message);
      // Optionally reset form or handle next steps
    } catch (error) {
      console.error('Error:', error.response?.data || error);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4, padding: 3, borderRadius: 2, boxShadow: 3 }}>
      <TextField
        id="datetime-local"
        label="Check-in Time"
        type="datetime-local"
        fullWidth
        value={checkInTime}
        onChange={e => setCheckInTime(e.target.value)}
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
          onChange={e => setFrequency(e.target.value)}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
        <Tooltip title="Choose how often you want the check-ins to occur">
          <i className="fas fa-info-circle" />
        </Tooltip>
      </FormControl>
      <FormControlLabel
        control={<Checkbox checked={notify} onChange={e => setNotify(e.target.checked)} color="primary" />}
        label="Notify me"
        sx={{ marginBottom: 2 }}
      />
      <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2, mb: 2, padding: '10px 0' }}>
        {update ? 'Update Check-In' : 'Schedule Check-In'}
      </Button>
    </Box>
  );
}

CheckInForm.propTypes = {
  userId: PropTypes.string.isRequired,
  checkInId: PropTypes.string,
  update: PropTypes.bool.isRequired,
};

export default CheckInForm;
