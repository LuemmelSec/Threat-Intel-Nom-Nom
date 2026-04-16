import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { alertsApi } from '../api/client';

function Settings() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleCleanup = async () => {
    if (!days || days < 1) {
      setError('Please enter a valid number of days (minimum 1)');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all alerts older than ${days} days? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await alertsApi.cleanup(days);
      setMessage(`Successfully deleted ${response.data.count} alerts older than ${days} days`);
    } catch (err) {
      console.error('Error cleaning up alerts:', err);
      setError(err.response?.data?.detail || 'Failed to clean up alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Alert Cleanup Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweepIcon />
          Alert Cleanup
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Delete old alerts to free up database space. This will permanently remove alerts older than the specified number of days.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Days"
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            InputProps={{
              inputProps: { min: 1 }
            }}
            sx={{ width: 200 }}
            disabled={loading}
          />
          <Button
            variant="contained"
            color="error"
            onClick={handleCleanup}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteSweepIcon />}
          >
            {loading ? 'Deleting...' : 'Delete Old Alerts'}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          This will delete all alerts triggered before {new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString()}
        </Typography>
      </Paper>

      {/* Future sections can be added here */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Threat Alert - Version 1.0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor threat intelligence feeds for keyword matches and receive real-time alerts.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Settings;
