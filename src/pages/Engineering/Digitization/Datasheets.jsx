import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { FileText } from 'lucide-react';

/**
 * Datasheets Component
 * Displays a "Coming Soon" message for the Digitization Datasheets module
 */
const Datasheets = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 3,
          textAlign: 'center'
        }}
      >
        <FileText size={64} color="#ec4899" strokeWidth={1.5} />
        
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1
            }}
          >
            Digitization Datasheets
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 500, 
              color: 'text.secondary',
              mb: 3
            }}
          >
            Coming Soon
          </Typography>
        </Box>

        <Box sx={{ maxWidth: '600px' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 2
            }}
          >
            This module is currently under development and will be available soon.
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            The Datasheets module will provide digital transformation datasheets and documentation, 
            including digital documentation management, automated datasheet generation, template library, 
            and standards compliance.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Datasheets;
