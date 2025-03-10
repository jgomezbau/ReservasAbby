import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Grid
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { reservasService, propiedadesService } from '../../services/api';

const CalendarioPage = () => {
  const [eventos, setEventos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState('');
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar propiedades al inicio
  useEffect(() => {
    const fetchPropiedades = async () => {
      try {
        const response = await propiedadesService.getAll();
        setPropiedades(response.data);
        if (response.data.length > 0) {
          setPropiedadSeleccionada(response.data[0].id);
        }
      } catch (err) {
        console.error('Error al cargar propiedades:', err);
        setError('Error al cargar las propiedades');
      }
    };

    fetchPropiedades();
  }, []);

  // Cargar reservas cuando se selecciona una propiedad o cambian las fechas
  useEffect(() => {
    const fetchReservas = async () => {
      if (!propiedadSeleccionada) return;
      
      try {
        setLoading(true);
        
        const params = {
          propiedad_id: propiedadSeleccionada
        };
        
        if (fechaInicio) params.desde = format(fechaInicio, 'yyyy-MM-dd');
        if (fechaFin) params.hasta = format(fechaFin, 'yyyy-MM-dd');
        
        const response = await reservasService.getCalendario(params);
        setEventos(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar reservas para el calendario:', err);
        setError('Error al cargar las reservas');
        setLoading(false);
      }
    };

    fetchReservas();
  }, [propiedadSeleccionada, fechaInicio, fechaFin]);

  // Manejador para cambio de propiedad
  const handlePropiedadChange = (event) => {
    setPropiedadSeleccionada(event.target.value);
  };

  // Manejador para cuando se hace clic en un evento
  const handleEventClick = (clickInfo) => {
    const evento = clickInfo.event;
    const reservaId = evento.id;
    
    // Estado de carga antes de obtener los detalles
    setLoading(true);
    setReservaDetalle(null);
    setOpenDialog(true);
    
    // Obtener detalles de la reserva
    reservasService.getById(reservaId)
      .then(response => {
        setReservaDetalle(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al obtener detalles de la reserva:', err);
        setError('Error al obtener detalles de la reserva');
        setLoading(false);
      });
  };

  // Manejador para cambio de fechas en el calendario
  const handleDatesSet = (dateInfo) => {
    setFechaInicio(dateInfo.start);
    setFechaFin(dateInfo.end);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Calendario de Reservas
      </Typography>
      
      <Box mb={3}>
        <FormControl fullWidth>
          <InputLabel id="propiedad-select-label">Propiedad</InputLabel>
          <Select
            labelId="propiedad-select-label"
            id="propiedad-select"
            value={propiedadSeleccionada}
            onChange={handlePropiedadChange}
            label="Propiedad"
          >
            {propiedades.map((propiedad) => (
              <MenuItem key={propiedad.id} value={propiedad.id}>
                {propiedad.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Paper elevation={2} sx={{ p: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          events={eventos}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          locale="es"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana'
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          loading={isLoading => setLoading(isLoading)}
        />
      </Paper>
      
      {/* Diálogo para mostrar detalles de reserva */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
        <DialogTitle>Detalles de la Reserva</DialogTitle>
        <DialogContent>
          {reservaDetalle && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DialogContentText>
                  <strong>Huésped:</strong> {reservaDetalle.nombre_huesped}
                </DialogContentText>
                <DialogContentText>
                  <strong>Propiedad:</strong> {reservaDetalle.propiedad.nombre}
                </DialogContentText>
                <DialogContentText>
                  <strong>Plataforma:</strong> {reservaDetalle.plataforma}
                </DialogContentText>
                <DialogContentText>
                  <strong>Estado:</strong> {reservaDetalle.estado}
                </DialogContentText>
              </Grid>
              <Grid item xs={12} md={6}>
                <DialogContentText>
                  <strong>Check-in:</strong> {format(new Date(reservaDetalle.fecha_ingreso), 'dd/MM/yyyy')}
                </DialogContentText>
                <DialogContentText>
                  <strong>Check-out:</strong> {format(new Date(reservaDetalle.fecha_salida), 'dd/MM/yyyy')}
                </DialogContentText>
                <DialogContentText>
                  <strong>Monto Total:</strong> USD ${reservaDetalle.monto_total_usd}
                </DialogContentText>
                {reservaDetalle.monto_sena_usd && (
                  <DialogContentText>
                    <strong>Seña:</strong> USD ${reservaDetalle.monto_sena_usd}
                  </DialogContentText>
                )}
              </Grid>
              {reservaDetalle.notas && (
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Notas:</strong> {reservaDetalle.notas}
                  </DialogContentText>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
          <Button 
            color="primary" 
            onClick={() => {
              handleCloseDialog();
              window.location.href = `/reservas/${reservaDetalle.id}`;
            }}
          >
            Ver Detalle Completo
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CalendarioPage;