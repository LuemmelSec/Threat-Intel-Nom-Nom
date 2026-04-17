import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.10.161:8000';

function TagSelector({ selectedTags = [], onChange }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tags/`);
      setAvailableTags(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  return (
    <Autocomplete
      multiple
      options={availableTags}
      getOptionLabel={(option) => option.name}
      value={selectedTags}
      onChange={handleChange}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tags"
          placeholder="Select tags..."
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            icon={<LocalOfferIcon />}
            label={option.name}
            size="small"
            sx={{
              backgroundColor: option.color,
              color: '#fff',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)',
                },
              },
            }}
          />
        ))
      }
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Chip
            icon={<LocalOfferIcon />}
            label={option.name}
            size="small"
            sx={{
              backgroundColor: option.color,
              color: '#fff',
              mr: 1,
            }}
          />
          {option.description && (
            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary', ml: 1 }}>
              - {option.description}
            </Box>
          )}
        </Box>
      )}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  );
}

export default TagSelector;
