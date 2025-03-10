import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Esta página es un redireccionamiento a la pestaña de categorías en CajaPage
const CategoriasPage = () => {
  const navigate = useNavigate();

  // Redirigir a la pestaña de categorías en CajaPage
  React.useEffect(() => {
    navigate('/caja', { state: { activeTab: 2 } });
  }, [navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Redirigiendo a Categorías...
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/caja', { state: { activeTab: 2 } })}
        >
          Ir a Categorías
        </Button>
      </Box>
    </Container>
  );
};

export default CategoriasPage;