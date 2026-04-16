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
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ApiIcon from '@mui/icons-material/Api';
import { DataGrid } from '@mui/x-data-grid';
import { templatesApi } from '../api/client';

function APITemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    configuration: {
      endpoint: '',
      method: 'GET',
      headers: {},
      auth: {
        type: 'none',
        bearer_token: '',
        api_key: '',
        api_key_header: 'X-API-Key'
      },
      field_mapping: {
        content_fields: [],
        metadata_fields: {}
      },
      incremental_update: {
        enabled: false,
        timestamp_field: '',
        last_fetch_tracking: true
      }
    }
  });
  const [configJson, setConfigJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getAll();
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description,
        enabled: template.enabled,
        configuration: template.configuration
      });
      setConfigJson(JSON.stringify(template.configuration, null, 2));
    } else {
      setEditingTemplate(null);
      const defaultConfig = {
        endpoint: '',
        method: 'GET',
        headers: {},
        auth: {
          type: 'none',
          bearer_token: '',
          api_key: '',
          api_key_header: 'X-API-Key'
        },
        field_mapping: {
          content_fields: [],
          metadata_fields: {}
        },
        incremental_update: {
          enabled: false,
          timestamp_field: '',
          last_fetch_tracking: true
        }
      };
      setFormData({
        name: '',
        description: '',
        enabled: true,
        configuration: defaultConfig
      });
      setConfigJson(JSON.stringify(defaultConfig, null, 2));
    }
    setJsonError('');
    setTabValue(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setJsonError('');
  };

  const handleTabChange = (event, newValue) => {
    if (tabValue === 1 && newValue === 0) {
      // Switching from JSON to Basic - validate and sync
      try {
        const parsed = JSON.parse(configJson);
        setFormData({ ...formData, configuration: parsed });
        setJsonError('');
      } catch (error) {
        setJsonError('Invalid JSON: ' + error.message);
        return;
      }
    } else if (tabValue === 0 && newValue === 1) {
      // Switching from Basic to JSON - sync
      setConfigJson(JSON.stringify(formData.configuration, null, 2));
    }
    setTabValue(newValue);
  };

  const handleBasicChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleConfigChange = (path, value) => {
    const newConfig = { ...formData.configuration };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setFormData({ ...formData, configuration: newConfig });
  };

  const handleJsonChange = (value) => {
    setConfigJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData({ ...formData, configuration: parsed });
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate configuration
      if (tabValue === 1) {
        JSON.parse(configJson); // Will throw if invalid
      }

      const submitData = {
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        configuration: tabValue === 1 ? JSON.parse(configJson) : formData.configuration
      };

      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, submitData);
      } else {
        await templatesApi.create(submitData);
      }
      fetchTemplates();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.detail || 'Error saving template');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templatesApi.delete(id);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert(error.response?.data?.detail || 'Cannot delete system templates');
      }
    }
  };

  const handleTest = async (template) => {
    setEditingTemplate(template);
    setTestResult(null);
    setTestDialogOpen(true);
    setTestLoading(true);
    
    try {
      const response = await templatesApi.test(template.id);
      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.detail || error.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApiIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'endpoint',
      headerName: 'Endpoint',
      width: 250,
      valueGetter: (params) => params.row.configuration?.endpoint || 'N/A'
    },
    {
      field: 'is_system',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'System' : 'Custom'}
          size="small"
          color={params.value ? 'secondary' : 'primary'}
        />
      ),
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Enabled' : 'Disabled'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleTest(params.row)}
            title="Test Template"
            color="primary"
          >
            <PlayArrowIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            title="Edit Template"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            disabled={params.row.is_system}
            title={params.row.is_system ? 'Cannot delete system template' : 'Delete Template'}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Toolbar disableGutters>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            API Templates
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Template
          </Button>
        </Toolbar>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Manage API integration templates for structured threat intelligence data sources. 
          Templates define endpoint, authentication, and field mapping for API feeds.
        </Typography>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={templates}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Edit API Template' : 'Create API Template'}
          {editingTemplate?.is_system && (
            <Chip label="System Template" color="secondary" size="small" sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              autoFocus
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => handleBasicChange('name', e.target.value)}
              margin="normal"
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleBasicChange('description', e.target.value)}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => handleBasicChange('enabled', e.target.checked)}
                />
              }
              label="Enabled"
              sx={{ mt: 2 }}
            />
          </Box>

          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Basic Configuration" />
            <Tab label="JSON Editor" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>API Endpoint</Typography>
              <TextField
                label="Endpoint URL"
                fullWidth
                value={formData.configuration.endpoint}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                margin="normal"
                required
                placeholder="https://api.example.com/v1/data"
              />
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Authentication</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure authentication in JSON Editor for bearer tokens or API keys
              </Alert>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Field Mapping</Typography>
              <Alert severity="info">
                Use JSON Editor to configure content_fields (searchable) and metadata_fields (structured context)
              </Alert>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              {jsonError && (
                <Alert severity="error" sx={{ mb: 2 }}>{jsonError}</Alert>
              )}
              <TextField
                label="Configuration (JSON)"
                fullWidth
                multiline
                rows={20}
                value={configJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                margin="normal"
                error={!!jsonError}
                helperText="Must be valid JSON. See system templates for examples."
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!!jsonError || !formData.name || !formData.configuration.endpoint}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test Template: {editingTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {testLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : testResult ? (
            <Box>
              {testResult.success ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Successfully fetched {testResult.item_count} item(s) from API
                  </Alert>
                  <Typography variant="subtitle2" gutterBottom>Sample Data:</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e', overflow: 'auto', maxHeight: 400 }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(testResult.sample_data, null, 2)}
                    </pre>
                  </Paper>
                  {testResult.metadata_summary && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Metadata Fields Extracted:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#1e1e1e' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(testResult.metadata_summary, null, 2)}
                        </pre>
                      </Paper>
                    </>
                  )}
                </>
              ) : (
                <Alert severity="error">
                  <strong>Test Failed:</strong> {testResult.error}
                </Alert>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => handleTest(editingTemplate)} 
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={testLoading}
          >
            Re-test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default APITemplates;
