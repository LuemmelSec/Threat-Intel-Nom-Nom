import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { DataGrid } from '@mui/x-data-grid';
import { keywordsApi } from '../api/client';
import TagDisplay from '../components/TagDisplay';
import TagSelector from '../components/TagSelector';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Keywords() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    keyword: '',
    case_sensitive: false,
    regex_pattern: false,
    enabled: true,
    criticality: 'medium',
  });

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const response = await keywordsApi.getAll();
      setKeywords(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (keyword = null) => {
    if (keyword) {
      setEditingKeyword(keyword);
      setFormData({
        keyword: keyword.keyword,
        case_sensitive: keyword.case_sensitive,
        regex_pattern: keyword.regex_pattern,
        enabled: keyword.enabled,
        criticality: keyword.criticality || 'medium',
      });
      setSelectedTags(keyword.tags || []);
    } else {
      setEditingKeyword(null);
      setFormData({
        keyword: '',
        case_sensitive: false,
        regex_pattern: false,
        enabled: true,
        criticality: 'medium',
      });
      setSelectedTags([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingKeyword(null);
  };

  const handleSubmit = async () => {
    try {
      let keywordId;
      if (editingKeyword) {
        await keywordsApi.update(editingKeyword.id, formData);
        keywordId = editingKeyword.id;
      } else {
        const response = await keywordsApi.create(formData);
        keywordId = response.data.id;
      }
      
      // Assign tags
      if (selectedTags.length > 0) {
        await axios.post(`${API_BASE_URL}/api/tags/keywords/${keywordId}/tags`, {
          tag_ids: selectedTags.map(t => t.id)
        });
      }
      
      fetchKeywords();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving keyword:', error);
      alert(error.response?.data?.detail || 'Error saving keyword');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this keyword?')) {
      try {
        await keywordsApi.delete(id);
        fetchKeywords();
      } catch (error) {
        console.error('Error deleting keyword:', error);
      }
    }
  };

  const handleToggleEnabled = async (id, currentStatus) => {
    try {
      const keyword = keywords.find(k => k.id === id);
      await keywordsApi.update(id, { ...keyword, enabled: !currentStatus });
      fetchKeywords();
    } catch (error) {
      console.error('Error toggling keyword status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} keyword(s)?`)) {
      try {
        await Promise.all(selectedRows.map(id => keywordsApi.delete(id)));
        fetchKeywords();
        setSelectedRows([]);
      } catch (error) {
        console.error('Error deleting keywords:', error);
      }
    }
  };

  const handleBulkEnable = async () => {
    try {
      await Promise.all(
        selectedRows.map(id => {
          const keyword = keywords.find(k => k.id === id);
          return keywordsApi.update(id, { ...keyword, enabled: true });
        })
      );
      fetchKeywords();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error enabling keywords:', error);
    }
  };

  const handleBulkDisable = async () => {
    try {
      await Promise.all(
        selectedRows.map(id => {
          const keyword = keywords.find(k => k.id === id);
          return keywordsApi.update(id, { ...keyword, enabled: false });
        })
      );
      fetchKeywords();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error disabling keywords:', error);
    }
  };

  const handleBulkSetCriticality = async (criticality) => {
    try {
      await Promise.all(
        selectedRows.map(id => {
          const keyword = keywords.find(k => k.id === id);
          return keywordsApi.update(id, { ...keyword, criticality });
        })
      );
      fetchKeywords();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error setting criticality:', error);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'keyword', headerName: 'Keyword', width: 300 },
    {
      field: 'case_sensitive',
      headerName: 'Case Sensitive',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'regex_pattern',
      headerName: 'Regex',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'secondary' : 'default'}
        />
      ),
    },
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
        return (
          <Chip
            label={params.value?.toUpperCase() || 'MEDIUM'}
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

  const filteredKeywords = keywords.filter(kw => {
    const matchesText = kw.keyword.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && kw.enabled) ||
      (statusFilter === 'disabled' && !kw.enabled);
    
    return matchesText && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Keywords</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Keyword
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter keywords..."
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
              {selectedRows.length} keyword(s) selected
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
              onClick={() => handleBulkSetCriticality('low')}
              sx={{ mr: 1 }}
            >
              Set Low
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkSetCriticality('medium')}
              sx={{ mr: 1 }}
            >
              Set Medium
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkSetCriticality('high')}
              sx={{ mr: 1 }}
            >
              Set High
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkSetCriticality('critical')}
              sx={{ mr: 1 }}
            >
              Set Critical
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
          rows={filteredKeywords}
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
              sortModel: [{ field: 'keyword', sort: 'asc' }],
            },
          }}
        />
      </div>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingKeyword ? 'Edit Keyword' : 'Add Keyword'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Keyword"
            value={formData.keyword}
            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
            helperText="Enter a keyword or regex pattern"
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Criticality"
            value={formData.criticality}
            onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={formData.case_sensitive}
                onChange={(e) => setFormData({ ...formData, case_sensitive: e.target.checked })}
              />
            }
            label="Case Sensitive"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.regex_pattern}
                onChange={(e) => setFormData({ ...formData, regex_pattern: e.target.checked })}
              />
            }
            label="Regex Pattern"
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
            {editingKeyword ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Keywords;
