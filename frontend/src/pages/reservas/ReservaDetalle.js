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
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { reservasService, cajaService } from '../../services/api';

const ReservaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        setLoading(true);
        const response = await reservasService.getById(id);
        setReserva(response.data);
        
        // Obtener movimientos relacionados con esta reserva
        const movimientosResponse = await cajaService.getAll({ relacionado_reserva_id: id });
        setMovimientos(movimientosResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar la reserva:', err);
        setError('Error al cargar los datos de la reserva');
        setLoading(false);
      }
    };

    fetchReserva();
  }, [id]);

  // Formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  // Obtener color según estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'success';
      case 'PENDIENTE':
        return 'warning';
      case 'CANCELADA':
        return 'error';
      case 'COMPLETADA':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !reserva) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'No se encontró la reserva solicitada'}
        </Alert>
        <Button 
          sx={{ mt: 2 }}
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reservas')}
        >
          Volver a Reservas
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/reservas')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Reserva: {reserva.nombre_huesped}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={() => navigate(`/reservas/editar/${id}`)}
          sx={{ ml: 2 }}
        >
          Editar
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Información de la Reserva
                </Typography>
                <Chip 
                  label={reserva.estado} 
                  color={getStatusColor(reserva.estado)}
                  variant="outlined"
                />
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Huésped
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {reserva.nombre_huesped}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Propiedad
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {reserva.propiedad.nombre}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Ingreso
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(reserva.fecha_ingreso)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Salida
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(reserva.fecha_salida)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Plataforma
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {reserva.plataforma}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monto Total
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    USD ${reserva.monto_total_usd}
                  </Typography>
                </Grid>
                
                {reserva.monto_sena_usd && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Seña
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      USD ${reserva.monto_sena_usd}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notas
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {reserva.notas || 'Sin notas'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Movimientos de Caja Relacionados
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {movimientos.length > 0 ? (
              <List>
                {movimientos.map((movimiento) => (
                  <ListItem key={movimiento.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">
                            {movimiento.categoria.nombre}
                          </Typography>
                          <Typography 
                            variant="subtitle2"
                            color={movimiento.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                          >
                            {movimiento.moneda === 'USD' ? 'USD $' : '$'} 
                            {movimiento.monto.toFixed(2)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(movimiento.fecha)} - {movimiento.descripcion || 'Sin descripción'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Socio: {movimiento.socio}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No hay movimientos de caja relacionados con esta reserva
              </Alert>
            )}
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/caja')}
              >
                Ver todos los movimientos
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReservaDetalle;