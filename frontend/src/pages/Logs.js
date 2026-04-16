import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Logs() {
  const [health, setHealth] = useState(null);
  const [feedErrors, setFeedErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const [healthRes, errorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/logs/health`),
        axios.get(`${API_BASE_URL}/api/logs/feed-errors`)
      ]);
      
      setHealth(healthRes.data);
      setFeedErrors(errorsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'disabled':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'disabled':
        return <BlockIcon sx={{ color: '#9e9e9e' }} />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          System Health & Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchLogs}
        >
          Refresh
        </Button>
      </Box>

      {/* Health Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Overall Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(health?.overall_status)}
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {health?.overall_status || 'Unknown'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Healthy Feeds
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>
                {health?.healthy_feeds || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Warning Feeds
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>
                {health?.warning_feeds || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Error Feeds
              </Typography>
              <Typography variant="h4" sx={{ color: '#f44336' }}>
                {health?.error_feeds || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Disabled Feeds
              </Typography>
              <Typography variant="h4" sx={{ color: '#9e9e9e' }}>
                {health?.disabled_feeds || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feed Status Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Feed Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Failures</TableCell>
                <TableCell>Last Checked</TableCell>
                <TableCell>Last Error</TableCell>
                <TableCell>Error Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedErrors.map((feed) => (
                <TableRow
                  key={feed.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    opacity: feed.status === 'disabled' ? 0.6 : 1,
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(feed.status)}
                      <Chip
                        label={feed.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(feed.status),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {feed.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={feed.feed_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {feed.consecutive_failures > 0 ? (
                      <Chip
                        label={feed.consecutive_failures}
                        size="small"
                        color={feed.consecutive_failures >= 3 ? 'error' : 'warning'}
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        0
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatTimestamp(feed.last_fetched)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    {feed.last_error ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#f44336',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {feed.last_error}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No errors
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatTimestamp(feed.last_error_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Logs;
