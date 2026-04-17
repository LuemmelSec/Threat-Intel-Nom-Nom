import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

function TagDisplay({ tags = [], size = 'small' }) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {tags.map((tag) => (
        <Chip
          key={tag.id}
          icon={<LocalOfferIcon />}
          label={tag.name}
          size={size}
          sx={{
            backgroundColor: tag.color,
            color: '#fff',
            fontWeight: 500
          }}
        />
      ))}
    </Box>
  );
}

export default TagDisplay;
