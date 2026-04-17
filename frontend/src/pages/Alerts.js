import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DataGrid } from '@mui/x-data-grid';
import { alertsApi } from '../api/client';
import TagDisplay from '../components/TagDisplay';
import TagSelector from '../components/TagSelector';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.10.161:8000';

function Alerts() {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAlertTags, setSelectedAlertTags] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [criticalityFilter, setCriticalityFilter] = useState(searchParams.get('criticality') || 'all');
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    // Update filters from URL params
    const status = searchParams.get('status');
    const criticality = searchParams.get('criticality');
    if (status) setStatusFilter(status);
    if (criticality) setCriticalityFilter(criticality);
  }, [searchParams]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsApi.getAll();
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertsApi.markAsRead(id);
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      await alertsApi.markAsUnread(id);
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as unread:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      fetchAlerts();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertsApi.delete(id);
        fetchAlerts();
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
  };

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);    setSelectedAlertTags(alert.tags || []);    setDetailsOpen(true);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} alert(s)?`)) {
      try {
        await Promise.all(selectedRows.map(id => alertsApi.delete(id)));
        fetchAlerts();
        setSelectedRows([]);
      } catch (error) {
        console.error('Error deleting alerts:', error);
      }
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(selectedRows.map(id => alertsApi.markAsRead(id)));
      fetchAlerts();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error marking alerts as read:', error);
    }
  };

  const handleBulkMarkAsUnread = async () => {
    try {
      await Promise.all(selectedRows.map(id => alertsApi.markAsUnread(id)));
      fetchAlerts();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error marking alerts as unread:', error);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'triggered_at',
      headerName: 'Time',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'feed',
      headerName: 'Feed',
      width: 200,
      valueGetter: (params) => params.row.feed.name,
    },
    {
      field: 'keyword',
      headerName: 'Keyword',
      width: 150,
      valueGetter: (params) => params.row.keyword.keyword,
    },
    {
      field: 'matched_content',
      headerName: 'Matched Content',
      width: 250,
      renderCell: (params) => (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </span>
      ),
    },
    {
      field: 'read',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Read' : 'Unread'}
          size="small"
          color={params.value ? 'default' : 'error'}
        />
      ),
    },
    {
      field: 'criticality',
      headerName: 'Criticality',
      width: 120,
      sortComparator: (v1, v2) => {
        const order = { low: 1, medium: 2, high: 3, critical: 4 };
        return (order[v1] || 0) - (order[v2] || 0);
      },
      renderCell: (params) => {
        const getCriticalityProps = (level) => {
          switch(level) {
            case 'low': return { color: 'info' };
            case 'medium': return { color: 'warning' };
            case 'high': return { color: 'error' };
            case 'critical': return { sx: { backgroundColor: '#9c27b0', color: 'white', '&:hover': { backgroundColor: '#7b1fa2' } } };
            default: return { color: 'warning' };
          }
        };
        const labels = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH', critical: 'CRITICAL' };
        return (
          <Chip
            label={labels[params.value] || 'MEDIUM'}
            size="small"
            {...getCriticalityProps(params.value)}
          />
        );
      },
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      valueGetter: (params) => params.row.tags?.map(t => t.name).join(', ') || '',
      sortComparator: (v1, v2) => v1.localeCompare(v2),
      renderCell: (params) => <TagDisplay tags={params.row.tags} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleViewDetails(params.row)} color="info">
            <VisibilityIcon />
          </IconButton>
          {!params.row.read ? (
            <IconButton
              size="small"
              onClick={() => handleMarkAsRead(params.row.id)}
              color="success"
              title="Mark as read"
            >
              <MarkEmailReadIcon />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              onClick={() => handleMarkAsUnread(params.row.id)}
              color="warning"
              title="Mark as unread"
            >
              <MarkEmailUnreadIcon />
            </IconButton>
          )}
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesText = alert.feed.name.toLowerCase().includes(filterText.toLowerCase()) ||
      alert.keyword.keyword.toLowerCase().includes(filterText.toLowerCase()) ||
      alert.matched_content.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && alert.read) ||
      (statusFilter === 'unread' && !alert.read);
    
    const matchesCriticality = criticalityFilter === 'all' || 
      alert.criticality === criticalityFilter;
    
    return matchesText && matchesStatus && matchesCriticality;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Alerts</Typography>
        <Button
          variant="contained"
          startIcon={<MarkEmailReadIcon />}
          onClick={handleMarkAllAsRead}
        >
          Mark All as Read
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter alerts by feed, keyword, or content..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="read">Read</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Criticality</InputLabel>
          <Select
            value={criticalityFilter}
            label="Criticality"
            onChange={(e) => setCriticalityFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {selectedRows.length > 0 && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Toolbar sx={{ p: 0 }}>
            <Typography variant="body1" sx={{ flex: 1 }}>
              {selectedRows.length} alert(s) selected
            </Typography>
            <Button
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleBulkMarkAsRead}
              sx={{ mr: 1 }}
            >
              Mark as Read
            </Button>
            <Button
              size="small"
              startIcon={<MarkEmailUnreadIcon />}
              onClick={handleBulkMarkAsUnread}
              sx={{ mr: 1 }}
            >
              Mark as Unread
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
          </Toolbar>
        </Paper>
      )}

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredAlerts}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          checkboxSelection
          disableSelectionOnClick
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection);
          }}
          rowSelectionModel={selectedRows}
          getRowClassName={(params) => (!params.row.read ? 'unread-row' : '')}
        />
      </div>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Feed
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAlert.feed.name} ({selectedAlert.feed.feed_type})
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  URL
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ wordBreak: 'break-all' }}>
                  {selectedAlert.feed.url}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'warning.dark' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Keyword
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAlert.keyword.keyword}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Matched Content
                </Typography>
                <Typography variant="body1" gutterBottom fontWeight="bold">
                  {selectedAlert.matched_content}
                </Typography>
              </Paper>

              {selectedAlert.api_metadata && Object.keys(selectedAlert.api_metadata).length > 0 && (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: 'info.dark' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Threat Intelligence Data
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(selectedAlert.api_metadata).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'capitalize', mr: 1 }}>
                          {key.replace(/_/g, ' ')}:
                        </Typography>
                        <Typography variant="body2">
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              {selectedAlert.context && (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Context
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedAlert.context}
                  </Typography>
                </Paper>
              )}

              <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Triggered At
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedAlert.triggered_at).toLocaleString()}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <TagSelector
                  selectedTags={selectedAlertTags}
                  onChange={async (newTags) => {
                    setSelectedAlertTags(newTags);
                    try {
                      await axios.post(`${API_BASE_URL}/api/tags/alerts/${selectedAlert.id}/tags`, {
                        tag_ids: newTags.map(t => t.id)
                      });
                      fetchAlerts();
                    } catch (error) {
                      console.error('Error updating alert tags:', error);
                    }
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Alerts;
