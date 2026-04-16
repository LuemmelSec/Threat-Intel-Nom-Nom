import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid } from '@mui/x-data-grid';
import { notificationsApi } from '../api/client';

const NOTIFICATION_TYPES = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'email', label: 'Email' },
  { value: 'discord', label: 'Discord' },
];

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    notification_type: 'email',
    destination: '',
    enabled: true,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (notification = null) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        name: notification.name,
        notification_type: notification.notification_type,
        destination: notification.destination,
        enabled: notification.enabled,
      });
    } else {
      setEditingNotification(null);
      setFormData({
        name: '',
        notification_type: 'email',
        destination: '',
        enabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNotification(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingNotification) {
        await notificationsApi.update(editingNotification.id, formData);
      } else {
        await notificationsApi.create(formData);
      }
      fetchNotifications();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification configuration?')) {
      try {
        await notificationsApi.delete(id);
        fetchNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const getDestinationHelper = (type) => {
    switch (type) {
      case 'email':
        return 'Enter email address (e.g., alerts@example.com)';
      case 'webhook':
        return 'Enter webhook URL (e.g., https://api.example.com/webhook)';
      case 'discord':
        return 'Enter Discord webhook URL';
      default:
        return 'Enter destination';
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    {
      field: 'notification_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value.toUpperCase()} size="small" color="primary" variant="outlined" />
      ),
    },
    { field: 'destination', headerName: 'Destination', width: 350 },
    {
      field: 'enabled',
      headerName: 'Enabled',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredNotifications = notifications.filter(notif => 
    notif.name.toLowerCase().includes(filterText.toLowerCase()) ||
    notif.destination.toLowerCase().includes(filterText.toLowerCase()) ||
    notif.notification_type.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notification Configurations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Configuration
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Filter notifications by name, type, or destination..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{ mb: 2 }}
      />

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredNotifications}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
        />
      </div>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNotification ? 'Edit Notification' : 'Add Notification'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            helperText="A friendly name for this notification configuration"
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Notification Type"
            value={formData.notification_type}
            onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
          >
            {NOTIFICATION_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Destination"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            helperText={getDestinationHelper(formData.notification_type)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label="Enabled"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNotification ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Notifications;
