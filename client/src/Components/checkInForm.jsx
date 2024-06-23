import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
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
    Typography,
    Snackbar,
    Alert 
  } from '@mui/material';
  
  import { formatISO, parseISO } from 'date-fns';
  
function CheckInForm({ userId, update }) {
  const [checkInTime, setCheckInTime] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [notify, setNotify] = useState(false);
  const { checkInId } = useParams();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const token = localStorage.getItem('token');


  useEffect(() => {
    if (update && checkInId) {
      // Fetch existing check-in data
      setLoading(true);
      axios.get(`/api/check-in/${checkInId}`,{
        headers: {
            'Authorization': `Bearer ${token}` // Ensure the Authorization header is set
        }
    })
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
    if (selectedTime <= now) {
      setSnackbar({ open: true, message: "Cannot schedule check-in in the past. Please choose a future time.", severity: 'error' });
      return;
    }

    const url = update ? `/api/check-in/${checkInId}` : '/api/check-in/schedule';
    // Setup Axios request configuration
    const config = {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      }
  };
    console.log('URL:', url);
    const method = update ? 'patch' : 'post';
    const data = { user_id: userId, check_in_time: checkInTime, frequency, notify };
    console.log('Submitting:', data);
    try {
      const response = await axios[method](url, data, config);
      console.log('Success:', response.data.message);
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      // Optionally reset form or handle next steps
    } catch (error) {
      console.error('Error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || "An unexpected error occurred";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
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
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

CheckInForm.propTypes = {
  userId: PropTypes.string.isRequired,
  checkInId: PropTypes.string,
  update: PropTypes.bool.isRequired,
};

export default CheckInForm;
