import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Paper 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            maxWidth: 500
          }}
        >
          <Typography variant="h1" color="primary" sx={{ mb: 2, fontSize: '5rem' }}>
            404
          </Typography>
          
          <Typography variant="h4" gutterBottom>
            Página no encontrada
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            size="large"
          >
            Volver al inicio
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;