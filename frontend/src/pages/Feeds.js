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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { DataGrid } from '@mui/x-data-grid';
import { feedsApi, templatesApi } from '../api/client';
import TagDisplay from '../components/TagDisplay';
import TagSelector from '../components/TagSelector';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const FEED_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'onion', label: 'Onion Site' },
  { value: 'rss', label: 'RSS Feed' },
  { value: 'api', label: 'API Feed' },
];

function Feeds() {
  const [feeds, setFeeds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    feed_type: 'website',
    url: '',
    enabled: true,
    fetch_interval: 300,
    feed_metadata: {},
  });

  useEffect(() => {
    fetchFeeds();
    fetchTemplates();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await feedsApi.getAll();
      setFeeds(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getAll();
      setTemplates(response.data.filter(t => t.enabled));
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleOpenDialog = (feed = null) => {
    if (feed) {
      setEditingFeed(feed);
      setFormData({
        name: feed.name,
        feed_type: feed.feed_type,
        url: feed.url,
        enabled: feed.enabled,
        fetch_interval: feed.fetch_interval,
        feed_metadata: feed.feed_metadata || {},
      });
      setSelectedTags(feed.tags || []);
    } else {
      setEditingFeed(null);
      setFormData({
        name: '',
        feed_type: 'website',
        url: '',
        enabled: true,
        fetch_interval: 300,
        feed_metadata: {},
      });
      setSelectedTags([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFeed(null);
  };

  const handleSubmit = async () => {
    try {
      let feedId;
      if (editingFeed) {
        await feedsApi.update(editingFeed.id, formData);
        feedId = editingFeed.id;
      } else {
        const response = await feedsApi.create(formData);
        feedId = response.data.id;
      }
      
      // Assign tags
      if (selectedTags.length > 0) {
        await axios.post(`${API_BASE_URL}/api/tags/feeds/${feedId}/tags`, {
          tag_ids: selectedTags.map(t => t.id)
        });
      }
      
      fetchFeeds();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving feed:', error);
      alert(error.response?.data?.detail || 'Failed to save feed. Check console for details.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feed?')) {
      try {
        await feedsApi.delete(id);
        fetchFeeds();
      } catch (error) {
        console.error('Error deleting feed:', error);
      }
    }
  };

  const handleTriggerCheck = async (id) => {
    try {
      await feedsApi.triggerCheck(id);
      alert('Feed check triggered!');
    } catch (error) {
      console.error('Error triggering feed check:', error);
    }
  };

  const handleToggleEnabled = async (id, currentStatus) => {
    try {
      const feed = feeds.find(f => f.id === id);
      await feedsApi.update(id, { ...feed, enabled: !currentStatus });
      fetchFeeds();
    } catch (error) {
      console.error('Error toggling feed status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} feed(s)?`)) {
      try {
        await Promise.all(selectedRows.map(id => feedsApi.delete(id)));
        fetchFeeds();
        setSelectedRows([]);
      } catch (error) {
        console.error('Error deleting feeds:', error);
      }
    }
  };

  const handleBulkEnable = async () => {
    try {
      await Promise.all(
        selectedRows.map(id => {
          const feed = feeds.find(f => f.id === id);
          return feedsApi.update(id, { ...feed, enabled: true });
        })
      );
      fetchFeeds();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error enabling feeds:', error);
    }
  };

  const handleBulkDisable = async () => {
    try {
      await Promise.all(
        selectedRows.map(id => {
          const feed = feeds.find(f => f.id === id);
          return feedsApi.update(id, { ...feed, enabled: false });
        })
      );
      fetchFeeds();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error disabling feeds:', error);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    {
      field: 'feed_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    { field: 'url', headerName: 'URL', width: 300 },
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
    { field: 'fetch_interval', headerName: 'Interval (s)', width: 120 },
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
      width: 250,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleTriggerCheck(params.row.id)} color="success" title="Check now">
            <PlayArrowIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleToggleEnabled(params.row.id, params.row.enabled)} 
            color={params.row.enabled ? 'success' : 'default'}
            title={params.row.enabled ? 'Disable' : 'Enable'}
          >
            {params.row.enabled ? <ToggleOnIcon /> : <ToggleOffIcon />}
          </IconButton>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)} color="primary" title="Edit">
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} color="error" title="Delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredFeeds = feeds.filter(feed => {
    const matchesText = feed.name.toLowerCase().includes(filterText.toLowerCase()) ||
      feed.url.toLowerCase().includes(filterText.toLowerCase()) ||
      feed.feed_type.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && feed.enabled) ||
      (statusFilter === 'disabled' && !feed.enabled);
    
    return matchesText && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Feeds</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Feed
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter feeds by name, URL, or type..."
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
            <MenuItem value="enabled">Enabled</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {selectedRows.length > 0 && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Toolbar sx={{ p: 0 }}>
            <Typography variant="body1" sx={{ flex: 1 }}>
              {selectedRows.length} feed(s) selected
            </Typography>
            <Button
              size="small"
              startIcon={<ToggleOnIcon />}
              onClick={handleBulkEnable}
              sx={{ mr: 1 }}
            >
              Enable
            </Button>
            <Button
              size="small"
              startIcon={<ToggleOffIcon />}
              onClick={handleBulkDisable}
              sx={{ mr: 1 }}
            >
              Disable
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
          rows={filteredFeeds}
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
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
        />
      </div>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFeed ? 'Edit Feed' : 'Add Feed'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Feed Type"
            value={formData.feed_type}
            onChange={(e) => setFormData({ ...formData, feed_type: e.target.value })}
          >
            {FEED_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            helperText={formData.feed_type === 'api' ? 'Leave empty - URL comes from template' : ''}
            disabled={formData.feed_type === 'api'}
          />
          {formData.feed_type === 'api' && (
            <TextField
              fullWidth
              margin="normal"
              select
              label="API Template"
              value={formData.feed_metadata?.template_id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === parseInt(e.target.value));
                setFormData({ 
                  ...formData, 
                  url: template?.configuration?.endpoint || '',
                  feed_metadata: { ...formData.feed_metadata, template_id: parseInt(e.target.value) }
                });
              }}
              helperText="Select the API integration template to use"
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            margin="normal"
            label="Fetch Interval (seconds)"
            type="number"
            value={formData.fetch_interval}
            onChange={(e) => setFormData({ ...formData, fetch_interval: parseInt(e.target.value) })}
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
          <Box sx={{ mt: 2 }}>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingFeed ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Feeds;
