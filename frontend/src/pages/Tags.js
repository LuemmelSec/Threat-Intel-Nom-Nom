import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tags/`);
      setTags(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        color: tag.color,
        description: tag.description || '',
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        color: '#3b82f6',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTag) {
        await axios.put(`${API_BASE_URL}/api/tags/${editingTag.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/tags/`, formData);
      }
      fetchTags();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving tag:', error);
      alert(error.response?.data?.detail || 'Error saving tag');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/tags/${id}`);
        fetchTags();
      } catch (error) {
        console.error('Error deleting tag:', error);
        alert(error.response?.data?.detail || 'Error deleting tag');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} tags?`)) {
      try {
        await Promise.all(
          selectedRows.map(id => axios.delete(`${API_BASE_URL}/api/tags/${id}`))
        );
        setSelectedRows([]);
        fetchTags();
      } catch (error) {
        console.error('Error deleting tags:', error);
        alert('Error deleting tags');
      }
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Tag',
      flex: 1,
      renderCell: (params) => (
        <Chip
          icon={<LabelIcon />}
          label={params.row.name}
          size="small"
          sx={{
            backgroundColor: params.row.color,
            color: '#fff',
            fontWeight: 500,
          }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 100,
      renderCell: (params) => (
        <Box
          sx={{
            width: 40,
            height: 24,
            borderRadius: 1,
            backgroundColor: params.row.color,
            border: '1px solid rgba(0,0,0,0.2)',
          }}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            title="Delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h5" component="h1">
            <LabelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tags
          </Typography>
          <Box>
            {selectedRows.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                sx={{ mr: 2 }}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Tag
            </Button>
          </Box>
        </Toolbar>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={tags}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRows(newSelection);
            }}
            rowSelectionModel={selectedRows}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTag ? 'Edit Tag' : 'Add Tag'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tag Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: 60,
                    height: 40,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                <TextField
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="small"
                  sx={{ width: 120 }}
                />
                <Chip
                  icon={<LabelIcon />}
                  label={formData.name || 'Preview'}
                  sx={{
                    backgroundColor: formData.color,
                    color: '#fff',
                  }}
                />
              </Box>
            </Box>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Tags;
