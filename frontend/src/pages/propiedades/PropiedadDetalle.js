import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { propiedadesService, reservasService } from '../../services/api';

const PropiedadDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propiedad, setPropiedad] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPropiedad = async () => {
      try {
        setLoading(true);
        const response = await propiedadesService.getById(id);
        setPropiedad(response.data);

        // Obtener las reservas de esta propiedad
        const reservasResponse = await reservasService.getAll({ propiedad_id: id });
        setReservas(reservasResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar la propiedad:', err);
        setError('Error al cargar los datos de la propiedad');
        setLoading(false);
      }
    };

    fetchPropiedad();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !propiedad) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'No se encontró la propiedad solicitada'}
        </Alert>
        <Button 
          sx={{ mt: 2 }}
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/propiedades')}
        >
          Volver a Propiedades
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/propiedades')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {propiedad.nombre}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={() => navigate(`/propiedades/editar/${id}`)}
        >
          Editar
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de la Propiedad
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle1">
                Nombre
              </Typography>
              <Typography variant="body1" paragraph>
                {propiedad.nombre}
              </Typography>
              
              <Typography variant="subtitle1">
                Descripción
              </Typography>
              <Typography variant="body1" paragraph>
                {propiedad.descripcion || 'Sin descripción'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reservas Recientes
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {reservas.length > 0 ? (
              <Box>
                {reservas.slice(0, 5).map((reserva) => (
                  <Box 
                    key={reserva.id} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      border: '1px solid #eee',
                      borderRadius: 1,
                      '&:hover': { boxShadow: 1 }
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">
                          {reserva.nombre_huesped}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(reserva.fecha_ingreso).toLocaleDateString()} - {new Date(reserva.fecha_salida).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2">
                          {reserva.plataforma}
                        </Typography>
                        <Typography variant="body2">
                          Total: USD ${reserva.monto_total_usd}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    variant="outlined"
                    onClick={() => navigate('/reservas', { state: { propiedad_id: id } })}
                  >
                    Ver todas las reservas
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="info">
                No hay reservas para esta propiedad
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PropiedadDetalle;