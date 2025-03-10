import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { integracionesService, propiedadesService } from '../../services/api';

const SincronizarPage = () => {
  // Estados para los formularios
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadAirbnb, setPropiedadAirbnb] = useState('');
  const [propiedadBooking, setPropiedadBooking] = useState('');
  const [propiedadExcel, setPropiedadExcel] = useState('');
  const [fechaInicioAirbnb, setFechaInicioAirbnb] = useState(startOfMonth(new Date()));
  const [fechaFinAirbnb, setFechaFinAirbnb] = useState(endOfMonth(new Date()));
  const [fechaInicioBooking, setFechaInicioBooking] = useState(startOfMonth(new Date()));
  const [fechaFinBooking, setFechaFinBooking] = useState(endOfMonth(new Date()));
  const [excelFilePath, setExcelFilePath] = useState('');

  // Estados para manejar la sincronización
  const [isSyncingAirbnb, setIsSyncingAirbnb] = useState(false);
  const [isSyncingBooking, setIsSyncingBooking] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [airbnbResult, setAirbnbResult] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [excelResult, setExcelResult] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [apiStatus, setApiStatus] = useState({ airbnb: false, booking: false });

  // Cargar propiedades y verificar estado de APIs al inicio
  const fetchPropiedades = async () => {
    try {
      const response = await propiedadesService.getAll();
      setPropiedades(response.data);
      
      // Si hay propiedades, seleccionar la primera por defecto
      if (response.data.length > 0) {
        setPropiedadAirbnb(response.data[0].id);
        setPropiedadBooking(response.data[0].id);
        setPropiedadExcel(response.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      showSnackbar('Error al cargar propiedades', 'error');
    }
  };

  useEffect(() => {
    fetchPropiedades();
    checkApiStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar estado de las APIs
  const checkApiStatus = async () => {
    try {
      // Esta función simula verificar si las APIs están configuradas
      // En una implementación real, habría que verificar las credenciales de APIs
      // Aquí simplemente establecemos valores de ejemplo
      
      // Ejemplo: Configuración de entorno para determinar si las APIs están habilitadas
      // const airbnbEnabled = process.env.REACT_APP_AIRBNB_API_KEY !== undefined;
      // const bookingEnabled = process.env.REACT_APP_BOOKING_API_KEY !== undefined;
      
      // Por ahora usamos valores falsos para la simulación
      setApiStatus({
        airbnb: false,  // Cambiar a true cuando se configure la API real
        booking: false  // Cambiar a true cuando se configure la API real
      });
    } catch (err) {
      console.error('Error al verificar estado de APIs:', err);
    }
  };

  // Sincronizar con Airbnb
  const handleSyncAirbnb = async () => {
    try {
      if (!propiedadAirbnb) {
        showSnackbar('Selecciona una propiedad para sincronizar', 'error');
        return;
      }

      setIsSyncingAirbnb(true);
      setAirbnbResult(null);
      
      const response = await integracionesService.syncAirbnb({
        propiedad_id: propiedadAirbnb,
        desde: format(fechaInicioAirbnb, 'yyyy-MM-dd'),
        hasta: format(fechaFinAirbnb, 'yyyy-MM-dd')
      });
      
      setAirbnbResult(response.data);
      showSnackbar('Sincronización con Airbnb completada', 'success');
    } catch (err) {
      console.error('Error al sincronizar con Airbnb:', err);
      showSnackbar('Error al sincronizar con Airbnb: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsSyncingAirbnb(false);
    }
  };

  // Sincronizar con Booking
  const handleSyncBooking = async () => {
    try {
      if (!propiedadBooking) {
        showSnackbar('Selecciona una propiedad para sincronizar', 'error');
        return;
      }

      setIsSyncingBooking(true);
      setBookingResult(null);
      
      const response = await integracionesService.syncBooking({
        propiedad_id: propiedadBooking,
        desde: format(fechaInicioBooking, 'yyyy-MM-dd'),
        hasta: format(fechaFinBooking, 'yyyy-MM-dd')
      });
      
      setBookingResult(response.data);
      showSnackbar('Sincronización con Booking completada', 'success');
    } catch (err) {
      console.error('Error al sincronizar con Booking:', err);
      showSnackbar('Error al sincronizar con Booking: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsSyncingBooking(false);
    }
  };

  // Importar desde Excel
  const handleImportExcel = async () => {
    try {
      if (!propiedadExcel) {
        showSnackbar('Selecciona una propiedad para importar', 'error');
        return;
      }

      if (!excelFilePath.trim()) {
        showSnackbar('Ingresa la ruta al archivo Excel', 'error');
        return;
      }

      setIsImportingExcel(true);
      setExcelResult(null);
      
      const response = await integracionesService.importarExcel({
        propiedad_id: propiedadExcel,
        file_path: excelFilePath
      });
      
      setExcelResult(response.data);
      showSnackbar('Importación desde Excel completada', 'success');
    } catch (err) {
      console.error('Error al importar desde Excel:', err);
      showSnackbar('Error al importar desde Excel: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsImportingExcel(false);
    }
  };

  // Mostrar diálogo para configurar APIs
  const handleOpenConfigDialog = () => {
    setOpenDialog(true);
  };

  // Cerrar diálogo de configuración
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Mostrar mensaje en snackbar
  const showSnackbar = React.useCallback((message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  }, []);

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Sincronización de Reservas
        </Typography>

        <Grid container spacing={3}>
          {/* Tarjeta de Airbnb */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                    Sincronizar con Airbnb
                  </Typography>
                  {!apiStatus.airbnb && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      onClick={handleOpenConfigDialog}
                    >
                      Configurar API
                    </Button>
                  )}
                </Box>

                {!apiStatus.airbnb && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>API no configurada</AlertTitle>
                    La API de Airbnb no está configurada. La sincronización no funcionará hasta que se configure correctamente.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="propiedad-airbnb-label">Propiedad</InputLabel>
                      <Select
                        labelId="propiedad-airbnb-label"
                        id="propiedad-airbnb"
                        value={propiedadAirbnb}
                        onChange={(e) => setPropiedadAirbnb(e.target.value)}
                        label="Propiedad"
                      >
                        {propiedades.map((propiedad) => (
                          <MenuItem key={propiedad.id} value={propiedad.id}>
                            {propiedad.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Desde"
                      value={fechaInicioAirbnb}
                      onChange={setFechaInicioAirbnb}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Hasta"
                      value={fechaFinAirbnb}
                      onChange={setFechaFinAirbnb}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleSyncAirbnb}
                  disabled={isSyncingAirbnb || !propiedadAirbnb}
                >
                  {isSyncingAirbnb ? <CircularProgress size={24} /> : 'Sincronizar con Airbnb'}
                </Button>
              </CardActions>
              
              {airbnbResult && (
                <Box sx={{ p: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Resultado de la sincronización:
                  </Typography>
                  <Typography variant="body2">
                    {airbnbResult.mensaje}
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Tarjeta de Booking */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                    Sincronizar con Booking
                  </Typography>
                  {!apiStatus.booking && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      onClick={handleOpenConfigDialog}
                    >
                      Configurar API
                    </Button>
                  )}
                </Box>

                {!apiStatus.booking && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>API no configurada</AlertTitle>
                    La API de Booking no está configurada. La sincronización no funcionará hasta que se configure correctamente.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="propiedad-booking-label">Propiedad</InputLabel>
                      <Select
                        labelId="propiedad-booking-label"
                        id="propiedad-booking"
                        value={propiedadBooking}
                        onChange={(e) => setPropiedadBooking(e.target.value)}
                        label="Propiedad"
                      >
                        {propiedades.map((propiedad) => (
                          <MenuItem key={propiedad.id} value={propiedad.id}>
                            {propiedad.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Desde"
                      value={fechaInicioBooking}
                      onChange={setFechaInicioBooking}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Hasta"
                      value={fechaFinBooking}
                      onChange={setFechaFinBooking}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleSyncBooking}
                  disabled={isSyncingBooking || !propiedadBooking}
                >
                  {isSyncingBooking ? <CircularProgress size={24} /> : 'Sincronizar con Booking'}
                </Button>
              </CardActions>
              
              {bookingResult && (
                <Box sx={{ p: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Resultado de la sincronización:
                  </Typography>
                  <Typography variant="body2">
                    {bookingResult.mensaje}
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Tarjeta de importación de Excel */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Importar desde Excel
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Importa reservas desde un archivo Excel. El archivo debe tener el formato adecuado.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="propiedad-excel-label">Propiedad</InputLabel>
                      <Select
                        labelId="propiedad-excel-label"
                        id="propiedad-excel"
                        value={propiedadExcel}
                        onChange={(e) => setPropiedadExcel(e.target.value)}
                        label="Propiedad"
                      >
                        {propiedades.map((propiedad) => (
                          <MenuItem key={propiedad.id} value={propiedad.id}>
                            {propiedad.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ruta del archivo Excel"
                      value={excelFilePath}
                      onChange={(e) => setExcelFilePath(e.target.value)}
                      helperText="Ej: /home/usuario/reservas.xlsx"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleImportExcel}
                  disabled={isImportingExcel || !propiedadExcel || !excelFilePath}
                >
                  {isImportingExcel ? <CircularProgress size={24} /> : 'Importar desde Excel'}
                </Button>
              </CardActions>
              
              {excelResult && (
                <Box sx={{ p: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Resultado de la importación:
                  </Typography>
                  <Typography variant="body2">
                    {excelResult.mensaje}
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Diálogo de configuración de APIs */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Configuración de APIs</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Para sincronizar con Airbnb y Booking, necesitas configurar las claves de API en el servidor.
              Contacta con el administrador del sistema para obtener y configurar estas claves.
            </DialogContentText>
            <List>
              <ListItem>
                <ListItemText 
                  primary="API de Airbnb" 
                  secondary={apiStatus.airbnb ? "Configurada correctamente" : "No configurada"}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="API de Booking" 
                  secondary={apiStatus.booking ? "Configurada correctamente" : "No configurada"}
                />
              </ListItem>
            </List>
            <DialogContentText sx={{ mt: 2 }}>
              Una vez obtenidas las claves de API, deberás actualizar el archivo .env en el servidor
              con los siguientes valores:
            </DialogContentText>
            <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mt: 1 }}>
              AIRBNB_API_KEY=tu_clave_de_airbnb_aqui
              AIRBNB_API_URL=url_de_la_api_de_airbnb
              
              BOOKING_API_KEY=tu_clave_de_booking_aqui
              BOOKING_API_URL=url_de_la_api_de_booking
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default SincronizarPage;